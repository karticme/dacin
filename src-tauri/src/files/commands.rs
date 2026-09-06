use crate::files::storage::{encrypt_meta, meta_to_item, parse_message_text, resolve_channel_peer};
use crate::types::{FileItem, InnerMeta, TelegramState};
use chrono::Utc;
use grammers_client::message::{InputMessage, Message};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub(crate) async fn create_folder(
    channel_id: i64,
    access_hash: i64,
    name: String,
    parent_id: String,
    encrypted: bool,
    state: State<'_, TelegramState>,
) -> Result<FileItem, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Folder name is required".to_string());
    }

    let service = state.service().await?;
    let peer = resolve_channel_peer(&service.client, channel_id, access_hash).await?;

    let now = Utc::now().to_rfc3339();
    let meta = InnerMeta {
        id: Uuid::new_v4().to_string(),
        n: name,
        t: "folder".to_string(),
        m: "folder".to_string(),
        s: 0,
        p: parent_id,
        d: None,
        k: None,
        c: now.clone(),
        u: now,
    };

    let text = if encrypted {
        let keys = service.channel_keys.lock().await;
        let key = keys
            .get(&channel_id)
            .ok_or_else(|| "Channel storage not set up — key not found".to_string())?;
        encrypt_meta(key, &meta)?
    } else {
        serde_json::to_string(&meta).map_err(|e| e.to_string())?
    };

    let msg: Message = service
        .client
        .send_message(peer, InputMessage::from(text))
        .await
        .map_err(|e| format!("Failed to send folder metadata message: {e}"))?;

    Ok(meta_to_item(meta, channel_id, msg.id()))
}

#[tauri::command]
pub(crate) async fn rename_item(
    channel_id: i64,
    access_hash: i64,
    message_id: i32,
    new_name: String,
    encrypted: bool,
    state: State<'_, TelegramState>,
) -> Result<FileItem, String> {
    let new_name = new_name.trim().to_string();
    if new_name.is_empty() {
        return Err("Item name is required".to_string());
    }

    let service = state.service().await?;
    let peer = resolve_channel_peer(&service.client, channel_id, access_hash).await?;

    let keys = service.channel_keys.lock().await;
    let key: Option<&[u8; 32]> = if encrypted {
        Some(
            keys.get(&channel_id)
                .ok_or_else(|| "Channel storage not set up — key not found".to_string())?,
        )
    } else {
        None
    };

    let msgs: Vec<Option<Message>> = service
        .client
        .get_messages_by_id(peer.clone(), &[message_id])
        .await
        .map_err(|e| format!("Failed to get message: {e}"))?;

    let msg = msgs
        .into_iter()
        .flatten()
        .next()
        .ok_or_else(|| format!("Message {message_id} not found"))?;

    let mut meta = parse_message_text(msg.text(), key)
        .ok_or_else(|| "Failed to parse item metadata from message".to_string())?;

    meta.n = new_name;
    meta.u = Utc::now().to_rfc3339();

    let new_text = if encrypted {
        let k = key.unwrap();
        encrypt_meta(k, &meta)?
    } else {
        serde_json::to_string(&meta).map_err(|e| e.to_string())?
    };

    service
        .client
        .edit_message(peer, message_id, InputMessage::from(new_text))
        .await
        .map_err(|e| format!("Failed to edit message: {e}"))?;

    Ok(meta_to_item(meta, channel_id, message_id))
}

#[tauri::command]
pub(crate) async fn delete_item(
    channel_id: i64,
    access_hash: i64,
    message_id: i32,
    state: State<'_, TelegramState>,
) -> Result<(), String> {
    let service = state.service().await?;
    let peer = resolve_channel_peer(&service.client, channel_id, access_hash).await?;

    let msgs: Vec<Option<Message>> = service
        .client
        .get_messages_by_id(peer.clone(), &[message_id])
        .await
        .map_err(|e| format!("Failed to get message: {e}"))?;

    let mut delete_ids = vec![message_id];

    if let Some(msg) = msgs.into_iter().flatten().next() {
        let keys = service.channel_keys.lock().await;
        let key = keys.get(&channel_id);
        if let Some(meta) = parse_message_text(msg.text(), key) {
            if let Some(doc_id) = meta.d {
                delete_ids.push(doc_id);
            }
        }
    }

    service
        .client
        .delete_messages(peer, &delete_ids)
        .await
        .map_err(|e| format!("Failed to delete messages: {e}"))?;

    Ok(())
}
