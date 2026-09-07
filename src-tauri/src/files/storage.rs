use crate::channels::telegram::peer_from_cache;
use crate::types::{FileItem, InnerMeta, TelegramState};
use grammers_client::tl;
use grammers_session::types::PeerRef;
use std::time::Duration;
use tauri::State;

// ── Private helpers ────────────────────────────────────────────────────────

#[derive(serde::Deserialize)]
struct TypeOnly {
    t: String,
}

#[derive(serde::Deserialize)]
struct EncryptedEnvelope {
    e: String,
}

pub(crate) fn meta_to_item(meta: InnerMeta, channel_id: i64, message_id: i32) -> FileItem {
    FileItem {
        id: meta.id,
        name: meta.n,
        item_type: meta.t,
        mime_type: meta.m,
        size: meta.s,
        parent_id: meta.p,
        channel_id,
        message_id,
        document_message_id: meta.d,
        created_at: meta.c,
        updated_at: meta.u,
        encrypted_file_key: meta.k,
    }
}

/// Encrypt `InnerMeta` into `{"e":"<base64>"}` string.
pub(crate) fn encrypt_meta(key: &[u8; 32], meta: &InnerMeta) -> Result<String, String> {
    let json = serde_json::to_string(meta).map_err(|e| e.to_string())?;
    let encrypted = crate::crypto::encrypt_b64(key, json.as_bytes())?;
    Ok(format!(r#"{{"e":"{encrypted}"}}"#))
}

/// Decrypt `{"e":"<base64>"}` string into `InnerMeta`.
pub(crate) fn decrypt_meta(key: &[u8; 32], envelope: &str) -> Result<InnerMeta, String> {
    let env: EncryptedEnvelope =
        serde_json::from_str(envelope).map_err(|e| format!("Not an encrypted envelope: {e}"))?;
    let plain = crate::crypto::decrypt_b64(key, &env.e)?;
    serde_json::from_slice::<InnerMeta>(&plain).map_err(|e| format!("Meta parse failed: {e}"))
}

/// Parse a raw message text into `InnerMeta`.
/// Returns `None` for system messages (cfg/vfy) or unrecognisable text.
pub(crate) fn parse_message_text(text: &str, key: Option<&[u8; 32]>) -> Option<InnerMeta> {
    // Skip system-only messages
    if let Ok(ty) = serde_json::from_str::<TypeOnly>(text) {
        if ty.t == "cfg" || ty.t == "vfy" {
            return None;
        }
    }

    // Encrypted envelope
    if text.contains(r#""e":"#) {
        if let Some(key) = key {
            return decrypt_meta(key, text).ok();
        }
        return None; // encrypted but no key — skip
    }

    // Plain JSON InnerMeta (non-encrypted channel)
    serde_json::from_str::<InnerMeta>(text).ok()
}

/// Robustly resolves a channel PeerRef with retry on dropped connections.
/// Invoking GetFullChannel primes the MTProto session cache so subsequent calls
/// like iter_messages succeed without CHANNEL_INVALID.
pub(crate) async fn resolve_channel_peer(
    client: &grammers_client::Client,
    channel_id: i64,
    access_hash: i64,
) -> Result<PeerRef, String> {
    for attempt in 0..3 {
        let full = client
            .invoke(&tl::functions::channels::GetFullChannel {
                channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                    channel_id,
                    access_hash,
                }),
            })
            .await;

        match full {
            Ok(tl::enums::messages::ChatFull::Full(full)) => {
                for chat in full.chats {
                    if let tl::enums::Chat::Channel(ch) = chat {
                        if ch.id == channel_id {
                            let fresh_hash = ch.access_hash.unwrap_or(access_hash);
                            return peer_from_cache(channel_id, fresh_hash);
                        }
                    }
                }
                return peer_from_cache(channel_id, access_hash);
            }
            Err(e) => {
                let err_str = e.to_string();
                if attempt < 2
                    && (err_str.contains("dropped")
                        || err_str.contains("cancelled")
                        || err_str.contains("reset"))
                {
                    tokio::time::sleep(Duration::from_millis(250 * (attempt + 1))).await;
                    continue;
                }
            }
        }
    }

    // Fallback: locate peer from active user dialogs
    crate::channels::telegram::find_peer_by_id(client, channel_id).await
}

/// Iterate all messages in a channel and collect every valid `FileItem`.
pub(crate) async fn fetch_all_items(
    client: &grammers_client::Client,
    peer: PeerRef,
    channel_id: i64,
    key: Option<&[u8; 32]>,
) -> Result<Vec<FileItem>, String> {
    for attempt in 0..3 {
        let mut items = Vec::new();
        let mut messages = client.iter_messages(peer);
        let mut retry = false;

        loop {
            match messages.next().await {
                Ok(Some(msg)) => {
                    let text = msg.text();
                    if text.is_empty() {
                        continue;
                    }
                    if let Some(meta) = parse_message_text(text, key) {
                        items.push(meta_to_item(meta, channel_id, msg.id()));
                    }
                }
                Ok(None) => break,
                Err(e) => {
                    let err_str = e.to_string();
                    if attempt < 2
                        && (err_str.contains("dropped")
                            || err_str.contains("cancelled")
                            || err_str.contains("reset"))
                    {
                        retry = true;
                        tokio::time::sleep(Duration::from_millis(250 * (attempt + 1))).await;
                        break;
                    } else {
                        return Err(err_str);
                    }
                }
            }
        }

        if !retry {
            return Ok(items);
        }
    }

    Err("Failed to load channel messages".to_string())
}

// ── Tauri commands ─────────────────────────────────────────────────────────

/// Derive and cache the metadata key for an encrypted channel.
/// For non-encrypted channels this is a no-op (returns immediately).
#[tauri::command]
pub(crate) async fn setup_storage(
    channel_id: i64,
    access_hash: i64,
    encrypted: bool,
    state: State<'_, TelegramState>,
) -> Result<(), String> {
    if !encrypted {
        return Ok(());
    }

    let service = state.service().await?;

    // Return early if key already cached for this channel
    if service.channel_keys.lock().await.contains_key(&channel_id) {
        return Ok(());
    }

    let peer = resolve_channel_peer(&service.client, channel_id, access_hash).await?;
    let phone = service.credentials.phone.clone();

    #[derive(serde::Deserialize)]
    struct CfgMsg {
        t: String,
        s: String,
    }

    // Find the cfg message and derive the key from the salt it contains
    for attempt in 0..3 {
        let mut messages = service.client.iter_messages(peer);

        while let Ok(maybe_msg) = messages.next().await {
            match maybe_msg {
                Some(msg) => {
                    let text = msg.text();
                    if text.is_empty() {
                        continue;
                    }
                    if let Ok(cfg) = serde_json::from_str::<CfgMsg>(text) {
                        if cfg.t == "cfg" {
                            let key = crate::crypto::derive_key(&phone, &cfg.s)
                                .map_err(|e| format!("Key derivation failed: {e}"))?;
                            service.channel_keys.lock().await.insert(channel_id, key);
                            return Ok(());
                        }
                    }
                }
                None => break,
            }
        }

        if attempt < 2 {
            tokio::time::sleep(Duration::from_millis(250 * (attempt + 1))).await;
        }
    }

    Err("Channel is missing a configuration message — cannot derive encryption key".to_string())
}

/// List all files and folders for a channel.
#[tauri::command]
pub(crate) async fn list_files(
    channel_id: i64,
    access_hash: i64,
    encrypted: bool,
    state: State<'_, TelegramState>,
) -> Result<Vec<FileItem>, String> {
    let service = state.service().await?;
    let peer = resolve_channel_peer(&service.client, channel_id, access_hash).await?;

    let keys = service.channel_keys.lock().await;
    let key: Option<&[u8; 32]> = if encrypted {
        Some(
            keys.get(&channel_id)
                .ok_or("Channel storage not set up — call setup_storage first")?,
        )
    } else {
        None
    };

    fetch_all_items(&service.client, peer, channel_id, key).await
}
