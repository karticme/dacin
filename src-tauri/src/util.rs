use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::Manager;

static APP_DATA_DIR: OnceLock<PathBuf> = OnceLock::new();

pub(crate) fn init_app_data_dir(app: &tauri::App) {
    match app.path().app_local_data_dir() {
        Ok(path) => {
            let app_dir = path.join("Dacin");
            if std::fs::create_dir_all(&app_dir).is_ok() {
                let _ = APP_DATA_DIR.set(app_dir);
            }
        }
        Err(error) => eprintln!("[config] Failed to resolve app data directory: {error}"),
    }
}

pub(crate) const BASE64: base64::engine::GeneralPurpose = base64::engine::general_purpose::STANDARD;
pub(crate) const VERIFICATION_PLAINTEXT: &str = "DACIN_VERIFIED_STORAGE";

pub(crate) fn app_data_dir() -> Result<PathBuf, String> {
    APP_DATA_DIR
        .get()
        .cloned()
        .ok_or_else(|| "Could not resolve a local application data directory".to_string())
}

fn credentials_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("telegram-credentials.json"))
}

pub(crate) fn session_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("telegram-session.sqlite"))
}

/// A zero-byte marker file written after a successful login.
/// Checking its existence is instant (no network) and replaces the
/// live `GetState` Telegram RPC call on cold start.
pub(crate) fn session_marker_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join(".session_active"))
}

pub(crate) fn write_session_marker() {
    if let Ok(path) = session_marker_path() {
        let _ = std::fs::write(path, b"");
    }
}

pub(crate) fn clear_session_marker() {
    if let Ok(path) = session_marker_path() {
        let _ = std::fs::remove_file(path);
    }
}

pub(crate) fn session_marker_exists() -> bool {
    session_marker_path().map(|p| p.exists()).unwrap_or(false)
}

pub(crate) async fn load_credentials() -> Result<Option<crate::types::StoredCredentials>, String> {
    let path = credentials_path()?;
    match tokio::fs::read_to_string(path).await {
        Ok(content) => serde_json::from_str(&content)
            .map(Some)
            .map_err(|error| format!("Failed to parse saved credentials: {error}")),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("Failed to read saved credentials: {error}")),
    }
}

pub(crate) async fn save_credentials(
    credentials: &crate::types::StoredCredentials,
) -> Result<(), String> {
    let path = credentials_path()?;
    let payload = serde_json::to_string(credentials)
        .map_err(|error| format!("Failed to serialize credentials: {error}"))?;
    tokio::fs::write(path, payload)
        .await
        .map_err(|error| format!("Failed to save credentials: {error}"))
}

pub(crate) fn telegram_api_id() -> Result<i32, String> {
    std::env::var("TELEGRAM_API_ID")
        .map_err(|_| "TELEGRAM_API_ID environment variable is not set".to_string())?
        .parse::<i32>()
        .map_err(|error| format!("TELEGRAM_API_ID must be a valid integer: {error}"))
}

pub(crate) fn telegram_api_hash() -> Result<String, String> {
    std::env::var("TELEGRAM_API_HASH")
        .map_err(|_| "TELEGRAM_API_HASH environment variable is not set".to_string())
}

pub(crate) fn status(
    state: crate::types::AuthState,
    message: impl Into<String>,
) -> crate::types::AuthResponse {
    crate::types::AuthResponse {
        state,
        message: message.into(),
    }
}
