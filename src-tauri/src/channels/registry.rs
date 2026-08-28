use crate::types::ChannelEntry;
use grammers_client::tl;

pub(crate) const CHANNEL_SUFFIX: &str = " @dacin";
const CHANNEL_NOTE: &str = "🛑 Note: Don't rename channel or change description otherwise channel will be disconnected from dacin.";

pub(crate) fn channel_title(name: &str) -> String {
    format!("{name}{CHANNEL_SUFFIX}")
}

pub(crate) fn channel_description(name: &str, encrypted: bool) -> String {
    let slug = name.to_lowercase().replace(' ', "_");
    let handle = if encrypted {
        format!("@{slug}-enc-dacin")
    } else {
        format!("@{slug}-dacin")
    };
    let encryption_note = if encrypted {
        "\n\nThis channel is encrypted."
    } else {
        ""
    };
    format!(
        "{handle} This channel is automatically created by Dacin app.{encryption_note}\n\n{CHANNEL_NOTE}"
    )
}

fn matching_description(name: &str, description: &str) -> Option<bool> {
    let slug = name.to_lowercase().replace(' ', "_");
    let enc_handle = format!("@{slug}-enc-dacin");
    let norm_handle = format!("@{slug}-dacin");
    if description.contains(&enc_handle) || (description.contains(&norm_handle) && description.contains("This channel is encrypted.")) {
        Some(true)
    } else if description.contains(&norm_handle) {
        Some(false)
    } else if description == channel_description(name, true) {
        Some(true)
    } else if description == channel_description(name, false) {
        Some(false)
    } else {
        None
    }
}

pub(crate) async fn discover_channels(
    client: &grammers_client::Client,
) -> Result<Vec<ChannelEntry>, String> {
    let mut channels = Vec::new();
    let mut dialogs = client.iter_dialogs();
    while let Some(dialog) = dialogs.next().await.map_err(|error| error.to_string())? {
        // Quick title filter — skip anything that's not a dacin channel
        let Some(title) = dialog.peer.name() else { continue; };
        let Some(name) = title.strip_suffix(CHANNEL_SUFFIX) else { continue; };
        let Some(peer) = dialog.peer.to_ref().await else { continue; };

        // Get description via GetFullChannel (one RPC per matched channel)
        let full = client
            .invoke(&tl::functions::channels::GetFullChannel {
                channel: tl::enums::InputChannel::Channel(tl::types::InputChannel {
                    channel_id: peer.id.bare_id(),
                    access_hash: peer.auth.hash(),
                }),
            })
            .await;
        let Ok(tl::enums::messages::ChatFull::Full(full)) = full else { continue; };
        let Some(encrypted) = matching_description(name, &full.full_chat.about()) else { continue; };
        channels.push(ChannelEntry {
            name: name.to_string(),
            channel_id: peer.id.bare_id(),
            access_hash: peer.auth.hash(),
            encrypted,
        });
    }
    channels.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(channels)
}

pub(crate) async fn ensure_unique_name(
    client: &grammers_client::Client,
    name: &str,
    excluding_id: Option<i64>,
) -> Result<(), String> {
    let target_title = channel_title(name);
    let mut dialogs = client.iter_dialogs();
    while let Some(dialog) = dialogs.next().await.map_err(|error| error.to_string())? {
        if let Some(title) = dialog.peer.name() {
            if title.eq_ignore_ascii_case(&target_title) {
                if let Some(peer) = dialog.peer.to_ref().await {
                    if Some(peer.id.bare_id()) != excluding_id {
                        return Err("A channel with this name already exists".to_string());
                    }
                }
            }
        }
    }
    Ok(())
}
