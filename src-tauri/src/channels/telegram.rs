use grammers_client::media::Uploaded;
use grammers_client::tl;
use grammers_session::types::{PeerAuth, PeerId, PeerRef};

use super::registry::{channel_description, channel_title};

/// Reconstruct a `PeerRef` from cached channel_id + access_hash.
/// This avoids a full dialog-list scan entirely.
pub(crate) fn peer_from_cache(channel_id: i64, access_hash: i64) -> Result<PeerRef, String> {
    let id = PeerId::channel(channel_id)
        .ok_or_else(|| format!("Invalid channel id: {channel_id}"))?;
    let auth = PeerAuth::from_hash(access_hash);
    Ok(PeerRef { id, auth })
}

pub(crate) async fn find_peer_by_id(
    client: &grammers_client::Client,
    id: i64,
) -> Result<PeerRef, String> {
    let mut dialogs = client.iter_dialogs();
    while let Some(dialog) = dialogs.next().await.map_err(|error| error.to_string())? {
        if let Some(peer) = dialog.peer.to_ref().await {
            if peer.id.bare_id() == id {
                return Ok(peer);
            }
        }
    }
    Err("Channel is no longer available in Telegram".to_string())
}

async fn find_peer_by_title(
    client: &grammers_client::Client,
    title: &str,
) -> Result<PeerRef, String> {
    let mut dialogs = client.iter_dialogs();
    while let Some(dialog) = dialogs.next().await.map_err(|error| error.to_string())? {
        if dialog.peer.name() == Some(title) {
            return dialog
                .peer
                .to_ref()
                .await
                .ok_or_else(|| "Could not resolve Telegram channel".to_string());
        }
    }
    Err(format!("Channel '{title}' was not found"))
}

async fn set_profile_image(client: &grammers_client::Client, peer: &PeerRef) -> Result<(), String> {
    let image = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../public/channel-image.png"
    ));
    let path = std::env::temp_dir().join(format!("dacin-channel-{}.png", uuid::Uuid::new_v4()));
    std::fs::write(&path, image)
        .map_err(|error| format!("Could not prepare channel image: {error}"))?;
    let uploaded: Uploaded = client
        .upload_file(&path)
        .await
        .map_err(|error| error.to_string())?;
    let _ = std::fs::remove_file(&path);
    client
        .invoke(&tl::functions::channels::EditPhoto {
            channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                channel_id: peer.id.bare_id(),
                access_hash: peer.auth.hash(),
            }),
            photo: tl::enums::InputChatPhoto::InputChatUploadedPhoto(
                tl::types::InputChatUploadedPhoto {
                    file: Some(uploaded.raw),
                    video: None,
                    video_start_ts: None,
                    video_emoji_markup: None,
                },
            ),
        })
        .await
        .map_err(|error| format!("Could not set channel image: {error}"))?;
    Ok(())
}

pub(crate) async fn create_private_channel(
    client: &grammers_client::Client,
    phone: &str,
    name: &str,
    encrypted: bool,
) -> Result<PeerRef, String> {
    let title = channel_title(name);
    let updates = client
        .invoke(&tl::functions::channels::CreateChannel {
            broadcast: true,
            megagroup: false,
            for_import: false,
            forum: false,
            title: title.clone(),
            about: channel_description(name, encrypted),
            geo_point: None,
            address: None,
            ttl_period: None,
        })
        .await
        .map_err(|error| format!("Could not create channel: {error}"))?;

    let peer = match updates {
        tl::enums::Updates::Updates(u) => {
            u.chats.into_iter().find_map(|chat| match chat {
                tl::enums::Chat::Channel(c) => {
                    let id = grammers_session::types::PeerId::channel(c.id)?;
                    let auth = grammers_session::types::PeerAuth::from_hash(c.access_hash?);
                    Some(grammers_session::types::PeerRef { id, auth })
                }
                _ => None,
            })
        }
        tl::enums::Updates::Combined(u) => {
            u.chats.into_iter().find_map(|chat| match chat {
                tl::enums::Chat::Channel(c) => {
                    let id = grammers_session::types::PeerId::channel(c.id)?;
                    let auth = grammers_session::types::PeerAuth::from_hash(c.access_hash?);
                    Some(grammers_session::types::PeerRef { id, auth })
                }
                _ => None,
            })
        }
        _ => None,
    };

    let peer = match peer {
        Some(p) => p,
        None => find_peer_by_title(client, &title).await?,
    };

    let input = tl::enums::InputPeer::Channel(tl::types::InputPeerChannel {
        channel_id: peer.id.bare_id(),
        access_hash: peer.auth.hash(),
    });

    // Prepare crypto messages upfront (CPU-only, no I/O)
    let crypto_msgs: Option<(String, String)> = if encrypted {
        let salt = crate::crypto::generate_salt()?;
        let metadata_key = crate::crypto::derive_key(phone, &salt)?;
        let encoded = crate::crypto::encrypt_b64(
            &metadata_key,
            crate::util::VERIFICATION_PLAINTEXT.as_bytes(),
        )?;
        let cfg_msg = serde_json::json!({"t": "cfg", "s": salt}).to_string();
        let vfy_msg = serde_json::json!({"t": "vfy", "d": encoded}).to_string();
        Some((cfg_msg, vfy_msg))
    } else {
        None
    };

    // Run image upload and forwarding toggle concurrently
    let img_fut = set_profile_image(client, &peer);
    let fwd_req = tl::functions::messages::ToggleNoForwards {
        peer: input,
        enabled: true,
    };
    let fwd_fut = client.invoke(&fwd_req);
    let (img_res, fwd_res) = tokio::join!(img_fut, fwd_fut);
    if let Err(error) = img_res {
        eprintln!("[channels] channel image was not set: {error}");
    }
    if let Err(error) = fwd_res {
        eprintln!("[channels] could not disable forwarding: {error}");
    }

    // Send crypto messages sequentially (order matters: cfg before vfy)
    if let Some((cfg_msg, vfy_msg)) = crypto_msgs {
        client
            .send_message(peer.clone(), cfg_msg)
            .await
            .map_err(|error| format!("Failed to send config message: {error}"))?;
        client
            .send_message(peer.clone(), vfy_msg)
            .await
            .map_err(|error| format!("Failed to send verification message: {error}"))?;
    }

    Ok(peer)
}

pub(crate) async fn rename_telegram_channel(
    client: &grammers_client::Client,
    peer: &PeerRef,
    name: &str,
    encrypted: bool,
) -> Result<(), String> {
    // Run title rename and description update concurrently
    let title_req = tl::functions::channels::EditTitle {
        channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
            channel_id: peer.id.bare_id(),
            access_hash: peer.auth.hash(),
        }),
        title: channel_title(name),
    };
    let about_req = tl::functions::messages::EditChatAbout {
        peer: tl::enums::InputPeer::Channel(tl::types::InputPeerChannel {
            channel_id: peer.id.bare_id(),
            access_hash: peer.auth.hash(),
        }),
        about: channel_description(name, encrypted),
    };
    let title_fut = client.invoke(&title_req);
    let about_fut = client.invoke(&about_req);
    let (title_res, about_res) = tokio::join!(title_fut, about_fut);
    title_res.map_err(|error| format!("Could not rename channel: {error}"))?;
    about_res.map_err(|error| format!("Could not update channel description: {error}"))?;
    Ok(())
}

pub(crate) async fn delete_telegram_channel(
    client: &grammers_client::Client,
    peer: &PeerRef,
) -> Result<(), String> {
    client
        .invoke(&tl::functions::channels::DeleteChannel {
            channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                channel_id: peer.id.bare_id(),
                access_hash: peer.auth.hash(),
            }),
        })
        .await
        .map_err(|error| format!("Could not delete channel: {error}"))?;
    Ok(())
}
