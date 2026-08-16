use crate::types::{ChannelEntry, TelegramState};
use tauri::State;

use super::registry::{discover_channels, ensure_unique_name};
use super::telegram::{
    create_private_channel, delete_telegram_channel, find_peer_by_id, rename_telegram_channel,
};

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
    ensure_unique_name(&service.client, &name, None).await?;
    let peer = create_private_channel(&service.client, &name, encrypted).await?;
    Ok(ChannelEntry {
        name,
        channel_id: peer.id.bare_id(),
        encrypted,
    })
}

#[tauri::command]
pub(crate) async fn list_channels(
    state: State<'_, TelegramState>,
) -> Result<Vec<ChannelEntry>, String> {
    discover_channels(&state.service().await?.client).await
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
    let service = state.service().await?;
    ensure_unique_name(&service.client, &name, Some(channel_id)).await?;
    let channel = discover_channels(&service.client)
        .await?
        .into_iter()
        .find(|channel| channel.channel_id == channel_id)
        .ok_or_else(|| "Channel not found".to_string())?;
    let peer = find_peer_by_id(&service.client, channel_id).await?;
    rename_telegram_channel(&service.client, &peer, &name, channel.encrypted).await?;
    Ok(ChannelEntry { name, ..channel })
}

#[tauri::command]
pub(crate) async fn delete_channel(
    channel_id: i64,
    state: State<'_, TelegramState>,
) -> Result<(), String> {
    let service = state.service().await?;
    let channel = discover_channels(&service.client)
        .await?
        .into_iter()
        .find(|channel| channel.channel_id == channel_id)
        .ok_or_else(|| "Channel not found".to_string())?;
    let peer = find_peer_by_id(&service.client, channel.channel_id).await?;
    delete_telegram_channel(&service.client, &peer).await
}
