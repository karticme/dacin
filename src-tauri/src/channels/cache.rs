use crate::types::ChannelEntry;
use crate::util;
use std::path::PathBuf;

const CHANNEL_CACHE_FILE: &str = "dacin_channels.json";

fn channel_cache_path() -> Result<PathBuf, String> {
    let data_dir = util::app_data_dir()?;
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    Ok(data_dir.join(CHANNEL_CACHE_FILE))
}

pub(crate) fn read_channel_cache() -> Result<Vec<ChannelEntry>, String> {
    let path = channel_cache_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

pub(crate) fn write_channel_cache(entries: &[ChannelEntry]) -> Result<(), String> {
    let path = channel_cache_path()?;
    let data = serde_json::to_string(entries).map_err(|e| e.to_string())?;
    std::fs::write(&path, &data).map_err(|e| e.to_string())
}
