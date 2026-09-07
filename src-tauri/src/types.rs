use grammers_client::client::{LoginToken, PasswordToken};
use grammers_client::Client;
use grammers_mtsender::SenderPool;
use grammers_session::storages::SqliteSession;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub(crate) struct StoredCredentials {
    pub phone: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub(crate) enum AuthState {
    MissingCredentials,
    Ready,
    CodeSent,
    NeedsPassword,
    Authorized,
}

#[derive(Debug, Serialize)]
pub(crate) struct AuthResponse {
    pub state: AuthState,
    pub message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TelegramProfile {
    pub id: i64,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub full_name: String,
    pub username: Option<String>,
    pub phone: Option<String>,
    pub photo_bytes: Option<Vec<u8>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct ChannelEntry {
    pub name: String,
    pub channel_id: i64,
    pub access_hash: i64,
    pub encrypted: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FileItem {
    pub id: String,
    pub name: String,
    pub item_type: String,
    pub mime_type: String,
    pub size: u64,
    pub parent_id: String,
    pub channel_id: i64,
    pub message_id: i32,
    pub document_message_id: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
    pub encrypted_file_key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct InnerMeta {
    pub id: String,
    pub n: String,
    pub t: String,
    pub m: String,
    pub s: u64,
    pub p: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub d: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub k: Option<String>,
    pub c: String,
    pub u: String,
}

pub(crate) struct TelegramService {
    pub client: Client,
    pub credentials: StoredCredentials,
    pub login_token: Mutex<Option<LoginToken>>,
    pub password_token: Mutex<Option<PasswordToken>>,
    /// Per-channel metadata keys derived from Argon2(phone, salt).
    /// Populated by `setup_storage` for encrypted channels.
    pub channel_keys: Mutex<HashMap<i64, [u8; 32]>>,
}

pub(crate) struct TelegramState {
    pub service: Mutex<Option<Arc<TelegramService>>>,
}

impl TelegramState {
    pub fn new() -> Self {
        Self {
            service: Mutex::new(None),
        }
    }

    pub async fn set_service(
        &self,
        credentials: StoredCredentials,
    ) -> Result<Arc<TelegramService>, String> {
        let mut guard = self.service.lock().await;
        let service = Arc::new(TelegramService::new(credentials).await?);
        *guard = Some(service.clone());
        Ok(service)
    }

    pub async fn service(&self) -> Result<Arc<TelegramService>, String> {
        let mut guard = self.service.lock().await;
        if let Some(service) = guard.as_ref() {
            return Ok(service.clone());
        }

        let credentials = crate::util::load_credentials()
            .await?
            .ok_or_else(|| "Telegram credentials are not set yet".to_string())?;

        let service = Arc::new(TelegramService::new(credentials).await?);
        *guard = Some(service.clone());
        Ok(service)
    }
}

impl TelegramService {
    async fn new(credentials: StoredCredentials) -> Result<Self, String> {
        let session_path = crate::util::session_path()?;
        if let Some(parent) = session_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|error| format!("Failed to create session directory: {error}"))?;
        }

        let session = Arc::new(
            SqliteSession::open(&session_path)
                .await
                .map_err(|error| format!("Failed to open session database: {error}"))?,
        );
        let api_id = crate::util::telegram_api_id()?;
        let pool = SenderPool::new(session, api_id);
        let client = Client::new(pool.handle.clone());
        tauri::async_runtime::spawn(pool.runner.run());

        Ok(Self {
            client,
            credentials,
            login_token: Mutex::new(None),
            password_token: Mutex::new(None),
            channel_keys: Mutex::new(HashMap::new()),
        })
    }
}
