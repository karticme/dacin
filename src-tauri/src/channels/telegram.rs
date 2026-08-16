use grammers_client::media::Uploaded;
use grammers_client::tl;
use grammers_session::types::PeerRef;

use super::registry::{channel_description, channel_title};

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

    if let Err(error) = set_profile_image(client, &peer).await {
        eprintln!("[channels] channel image was not set: {error}");
    }
    let input = tl::enums::InputPeer::Channel(tl::types::InputPeerChannel {
        channel_id: peer.id.bare_id(),
        access_hash: peer.auth.hash(),
    });
    if let Err(error) = client
        .invoke(&tl::functions::messages::ToggleNoForwards {
            peer: input,
            enabled: true,
        })
        .await
    {
        eprintln!("[channels] could not disable forwarding: {error}");
    }
    Ok(peer)
}

pub(crate) async fn rename_telegram_channel(
    client: &grammers_client::Client,
    peer: &PeerRef,
    name: &str,
    encrypted: bool,
) -> Result<(), String> {
    client
        .invoke(&tl::functions::channels::EditTitle {
            channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                channel_id: peer.id.bare_id(),
                access_hash: peer.auth.hash(),
            }),
            title: channel_title(name),
        })
        .await
        .map_err(|error| format!("Could not rename channel: {error}"))?;

    client
        .invoke(&tl::functions::messages::EditChatAbout {
            peer: tl::enums::InputPeer::Channel(tl::types::InputPeerChannel {
                channel_id: peer.id.bare_id(),
                access_hash: peer.auth.hash(),
            }),
            about: channel_description(name, encrypted),
        })
        .await
        .map_err(|error| format!("Could not update channel description: {error}"))?;

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
