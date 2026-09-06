use crate::types::ChannelEntry;
use grammers_client::tl;

use super::folder::list_folder_peers;

pub(crate) const CHANNEL_SUFFIX: &str = " @dacin";
const CHANNEL_NOTE: &str = "Note: Don't move the channel from folder. Also don't rename channel or change description otherwise channel will be disconnected from dacin.";

pub(crate) fn channel_title(name: &str) -> String {
    format!("{name}{CHANNEL_SUFFIX}")
}

pub(crate) fn channel_description(encrypted: bool) -> String {
    if encrypted {
        format!("[Encrypted] This channel is automatically created by Dacin app.\n{CHANNEL_NOTE}")
    } else {
        format!("This channel is automatically created by Dacin app.\n{CHANNEL_NOTE}")
    }
}

/// Detect the encrypted flag from a stored description.
fn encrypted_from_description(description: &str) -> bool {
    description.starts_with("[Encrypted]")
}

pub(crate) async fn discover_channels(
    client: &grammers_client::Client,
) -> Result<Vec<ChannelEntry>, String> {
    let peers = list_folder_peers(client).await?;

    if peers.is_empty() {
        return Ok(vec![]);
    }

    let mut channels = Vec::new();
    let mut stale_ids: Vec<i64> = Vec::new();

    for peer_input in peers {
        let (channel_id, access_hash) = match &peer_input {
            tl::enums::InputPeer::Channel(c) => (c.channel_id, c.access_hash),
            _ => continue,
        };

        // Read description via GetFullChannel to determine encrypted flag
        let full = client
            .invoke(&tl::functions::channels::GetFullChannel {
                channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                    channel_id,
                    access_hash,
                }),
            })
            .await;

        let Ok(tl::enums::messages::ChatFull::Full(full)) = full else {
            eprintln!("[registry] Channel {channel_id} is inaccessible — removing from folder");
            stale_ids.push(channel_id);
            continue;
        };

        let about = full.full_chat.about();
        let encrypted = encrypted_from_description(&about);

        // Extract name and fresh access hash from the chat
        let mut fresh_access_hash = access_hash;
        let name = full
            .chats
            .into_iter()
            .find_map(|chat| match chat {
                tl::enums::Chat::Channel(c) if c.id == channel_id => {
                    if let Some(h) = c.access_hash {
                        fresh_access_hash = h;
                    }
                    c.title.strip_suffix(CHANNEL_SUFFIX).map(str::to_string)
                }
                _ => None,
            });

        let Some(name) = name else {
            eprintln!("[registry] Skipping channel {channel_id}: title has no @dacin suffix");
            continue;
        };

        channels.push(ChannelEntry {
            name,
            channel_id,
            access_hash: fresh_access_hash,
            encrypted,
        });
    }

    // Purge stale entries from the folder so they don't spam on next call
    for stale_id in stale_ids {
        if let Err(e) = super::folder::remove_peer_from_folder(client, stale_id).await {
            eprintln!("[registry] Failed to remove stale channel {stale_id} from folder: {e}");
        }
    }

    channels.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(channels)
}

/// Checks uniqueness against the @dacin folder peers (no full dialog scan).
pub(crate) async fn ensure_unique_name(
    client: &grammers_client::Client,
    name: &str,
    excluding_id: Option<i64>,
) -> Result<(), String> {
    let target_title = channel_title(name);
    let peers = list_folder_peers(client).await?;

    for peer_input in peers {
        let (channel_id, access_hash) = match &peer_input {
            tl::enums::InputPeer::Channel(c) => (c.channel_id, c.access_hash),
            _ => continue,
        };
        if Some(channel_id) == excluding_id {
            continue;
        }
        // Read title via GetFullChannel
        let full = client
            .invoke(&tl::functions::channels::GetFullChannel {
                channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                    channel_id,
                    access_hash,
                }),
            })
            .await;
        if let Ok(tl::enums::messages::ChatFull::Full(full)) = full {
            let title_matches = full.chats.iter().any(|chat| {
                matches!(chat, tl::enums::Chat::Channel(c) if c.id == channel_id && c.title.eq_ignore_ascii_case(&target_title))
            });
            if title_matches {
                return Err("A channel with this name already exists".to_string());
            }
        }
    }
    Ok(())
}
