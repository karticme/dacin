use crate::types::*;
use crate::util;
use grammers_client::SignInError;
use std::time::Duration;
use tauri::State;

async fn check_authorized(client: &grammers_client::Client) -> Result<Option<bool>, String> {
    match tokio::time::timeout(Duration::from_secs(10), client.is_authorized()).await {
        Ok(Ok(authorized)) => Ok(Some(authorized)),
        Ok(Err(error)) => Err(format!("Failed to verify Telegram session: {error}")),
        Err(_) => Ok(None),
    }
}

fn authorized_message() -> AuthResponse {
    util::status(AuthState::Authorized, "Telegram session is active.")
}

#[tauri::command]
pub(crate) async fn set_credentials(
    phone: String,
    state: State<'_, TelegramState>,
) -> Result<AuthResponse, String> {
    let credentials = StoredCredentials { phone };
    util::save_credentials(&credentials).await?;
    let service = state.set_service(credentials).await?;

    match check_authorized(&service.client).await? {
        Some(true) => Ok(authorized_message()),
        Some(false) | None => Ok(util::status(
            AuthState::Ready,
            "Credentials saved. Send a login code to continue.",
        )),
    }
}

#[tauri::command]
pub(crate) async fn start_auth(state: State<'_, TelegramState>) -> Result<AuthResponse, String> {
    let service = state.service().await?;
    if matches!(check_authorized(&service.client).await?, Some(true)) {
        return Ok(authorized_message());
    }

    let token = service
        .client
        .request_login_code(&service.credentials.phone, &util::telegram_api_hash()?)
        .await
        .map_err(|error| format!("Failed to send login code: {error}"))?;
    *service.login_token.lock().await = Some(token);
    *service.password_token.lock().await = None;

    Ok(util::status(
        AuthState::CodeSent,
        "Telegram sent a login code. Enter it to continue.",
    ))
}

#[tauri::command]
pub(crate) async fn submit_code(
    code: String,
    state: State<'_, TelegramState>,
) -> Result<AuthResponse, String> {
    let service = state.service().await?;
    let token = service
        .login_token
        .lock()
        .await
        .take()
        .ok_or_else(|| "Request a login code before submitting it".to_string())?;

    match service.client.sign_in(&token, &code).await {
        Ok(_) => {
            *service.password_token.lock().await = None;
            Ok(authorized_message())
        }
        Err(SignInError::PasswordRequired(password_token)) => {
            *service.password_token.lock().await = Some(password_token);
            Ok(util::status(
                AuthState::NeedsPassword,
                "Two-factor authentication is enabled. Enter your Telegram password.",
            ))
        }
        Err(SignInError::InvalidCode) => {
            *service.login_token.lock().await = Some(token);
            Err("That login code is not valid.".to_string())
        }
        Err(SignInError::SignUpRequired) => {
            *service.login_token.lock().await = Some(token);
            Err("Telegram sign-up must be completed in an official client first.".to_string())
        }
        Err(SignInError::InvalidPassword(_)) => {
            *service.login_token.lock().await = Some(token);
            Err("Telegram reported an invalid password for this session.".to_string())
        }
        Err(SignInError::Other(error)) => {
            *service.login_token.lock().await = Some(token);
            Err(error.to_string())
        }
    }
}

#[tauri::command]
pub(crate) async fn check_password(
    password: String,
    state: State<'_, TelegramState>,
) -> Result<AuthResponse, String> {
    let service = state.service().await?;
    let password_token = service
        .password_token
        .lock()
        .await
        .take()
        .ok_or_else(|| "Telegram has not requested a password yet".to_string())?;

    match service
        .client
        .check_password(password_token, password.as_bytes())
        .await
    {
        Ok(_) => {
            *service.login_token.lock().await = None;
            Ok(authorized_message())
        }
        Err(SignInError::InvalidPassword(password_token)) => {
            *service.password_token.lock().await = Some(password_token);
            Err("That Telegram password is not valid.".to_string())
        }
        Err(SignInError::PasswordRequired(password_token)) => {
            *service.password_token.lock().await = Some(password_token);
            Err("Telegram still requires a password for this session.".to_string())
        }
        Err(SignInError::Other(error)) => Err(error.to_string()),
        Err(SignInError::InvalidCode) => Err(
            "Telegram no longer accepts the previous code token. Request a new code.".to_string(),
        ),
        Err(SignInError::SignUpRequired) => {
            Err("Telegram sign-up is required before password verification can finish.".to_string())
        }
    }
}

#[tauri::command]
pub(crate) async fn restore_session(
    state: State<'_, TelegramState>,
) -> Result<AuthResponse, String> {
    let service = match state.service().await {
        Ok(service) => service,
        Err(_) => match util::load_credentials().await? {
            Some(credentials) => state.set_service(credentials).await?,
            None => {
                return Ok(util::status(
                    AuthState::MissingCredentials,
                    "No saved Telegram session found. Enter your phone number to sign in.",
                ))
            }
        },
    };

    if matches!(check_authorized(&service.client).await?, Some(true)) {
        return Ok(authorized_message());
    }
    if service.password_token.lock().await.is_some() {
        return Ok(util::status(
            AuthState::NeedsPassword,
            "Enter your Telegram password to finish signing in.",
        ));
    }
    if service.login_token.lock().await.is_some() {
        return Ok(util::status(
            AuthState::CodeSent,
            "Enter the login code Telegram already sent.",
        ));
    }

    Ok(util::status(
        AuthState::Ready,
        "Credentials loaded. Send a login code to continue.",
    ))
}

#[tauri::command]
pub(crate) async fn is_authorized(state: State<'_, TelegramState>) -> Result<bool, String> {
    Ok(check_authorized(&state.service().await?.client)
        .await?
        .unwrap_or(false))
}

#[tauri::command]
pub(crate) async fn sign_out(state: State<'_, TelegramState>) -> Result<AuthResponse, String> {
    let service = state.service().await?;
    service
        .client
        .sign_out()
        .await
        .map_err(|error| format!("Failed to sign out: {error}"))?;
    *service.login_token.lock().await = None;
    *service.password_token.lock().await = None;
    Ok(util::status(AuthState::Ready, "Signed out."))
}
