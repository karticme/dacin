mod auth;
mod types;
mod util;

use dotenvy::dotenv;

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
            auth::restore_session,
            auth::sign_out,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
