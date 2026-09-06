mod auth;
mod channels;
pub(crate) mod crypto;
mod files;
mod types;
pub(crate) mod util;

use dotenvy::dotenv;

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| format!("Failed to open URL: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(types::TelegramState::new())
        .setup(|app| {
            util::init_app_data_dir(app);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::set_credentials,
            auth::start_auth,
            auth::submit_code,
            auth::check_password,
            auth::is_authorized,
            auth::get_profile,
            auth::restore_session,
            auth::sign_out,
            channels::commands::get_cached_channels,
            channels::commands::create_channel,
            channels::commands::list_channels,
            channels::commands::rename_channel,
            channels::commands::delete_channel,
            files::storage::setup_storage,
            files::storage::list_files,
            files::commands::create_folder,
            files::commands::rename_item,
            files::commands::delete_item,
            open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
