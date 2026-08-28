use crate::types::{ChannelEntry, TelegramState};
use tauri::State;

use super::cache::{read_channel_cache, write_channel_cache};
use super::registry::{discover_channels, ensure_unique_name};
use super::telegram::{
    create_private_channel, delete_telegram_channel, find_peer_by_id, peer_from_cache,
    rename_telegram_channel,
};

#[tauri::command]
pub(crate) fn get_cached_channels() -> Result<Vec<ChannelEntry>, String> {
    read_channel_cache()
}

#[tauri::command]
pub(crate) async fn create_channel(
    name: String,
    encrypted: bool,
    state: State<'_, TelegramState>,
) -> Result<ChannelEntry, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Channel name is required".to_string());
    }
    let service = state.service().await?;

    // Fast uniqueness check: disk cache first, only network-scan if cold cache
    let cached = read_channel_cache().unwrap_or_default();
    let name_lower = name.to_lowercase();
    let dup_in_cache = cached.iter().any(|c| c.name.to_lowercase() == name_lower);
    if dup_in_cache {
        return Err("A channel with this name already exists".to_string());
    }
    // Only scan network if cache is empty (first run)
    if cached.is_empty() {
        ensure_unique_name(&service.client, &name, None).await?;
    }

    let peer = create_private_channel(
        &service.client,
        &service.credentials.phone,
        &name,
        encrypted,
    )
    .await?;

    let entry = ChannelEntry {
        name,
        channel_id: peer.id.bare_id(),
        access_hash: peer.auth.hash(),
        encrypted,
    };

    let mut cached = read_channel_cache().unwrap_or_default();
    if !cached.iter().any(|c| c.channel_id == entry.channel_id) {
        cached.push(entry.clone());
        cached.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
        write_channel_cache(&cached).ok();
    }

    Ok(entry)
}

#[tauri::command]
pub(crate) async fn list_channels(
    state: State<'_, TelegramState>,
) -> Result<Vec<ChannelEntry>, String> {
    let channels = discover_channels(&state.service().await?.client).await?;
    write_channel_cache(&channels).ok();
    Ok(channels)
}

#[tauri::command]
pub(crate) async fn rename_channel(
    channel_id: i64,
    name: String,
    state: State<'_, TelegramState>,
) -> Result<ChannelEntry, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Channel name is required".to_string());
    }

    // Find channel in cache — no network needed
    let mut cached = read_channel_cache().unwrap_or_default();
    let channel = cached
        .iter()
        .find(|c| c.channel_id == channel_id)
        .cloned()
        .ok_or_else(|| "Channel not found in cache".to_string())?;

    // Uniqueness check against cache only
    let name_lower = name.to_lowercase();
    if cached
        .iter()
        .any(|c| c.channel_id != channel_id && c.name.to_lowercase() == name_lower)
    {
        return Err("A channel with this name already exists".to_string());
    }

    // Reconstruct peer from cached access_hash — zero dialog scan
    let peer = match peer_from_cache(channel_id, channel.access_hash) {
        Ok(p) => p,
        Err(_) => find_peer_by_id(&state.service().await?.client, channel_id).await?,
    };

    let service = state.service().await?;
    rename_telegram_channel(&service.client, &peer, &name, channel.encrypted).await?;

    let updated = ChannelEntry { name, ..channel };
    for c in &mut cached {
        if c.channel_id == channel_id {
            c.name = updated.name.clone();
        }
    }
    cached.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    write_channel_cache(&cached).ok();

    Ok(updated)
}

#[tauri::command]
pub(crate) async fn delete_channel(
    channel_id: i64,
    state: State<'_, TelegramState>,
) -> Result<(), String> {
    // Find channel in cache — no network needed
    let mut cached = read_channel_cache().unwrap_or_default();
    let channel = cached
        .iter()
        .find(|c| c.channel_id == channel_id)
        .cloned()
        .ok_or_else(|| "Channel not found in cache".to_string())?;

    // Reconstruct peer from cached access_hash — zero dialog scan
    let peer = match peer_from_cache(channel_id, channel.access_hash) {
        Ok(p) => p,
        Err(_) => find_peer_by_id(&state.service().await?.client, channel_id).await?,
    };

    let service = state.service().await?;
    delete_telegram_channel(&service.client, &peer).await?;

    cached.retain(|c| c.channel_id != channel_id);
    write_channel_cache(&cached).ok();

    Ok(())
}
