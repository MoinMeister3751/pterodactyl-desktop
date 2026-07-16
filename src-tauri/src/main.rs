// Business-Logik (Pterodactyl-API-Zugriff, Dateioperationen) läuft bewusst im
// Frontend über die Tauri-Plugins (http, fs, store, dialog). Die einzige Ausnahme
// ist die Live-Konsole: Wings lehnt WebSocket-Verbindungen mit Browser-Origin-Header
// oft ab, daher läuft die Konsolen-Verbindung nativ über ws_proxy.rs (siehe dort).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ws_proxy;

use ws_proxy::WsState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(WsState::default())
        .invoke_handler(tauri::generate_handler![
            ws_proxy::ws_connect,
            ws_proxy::ws_send,
            ws_proxy::ws_close
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pterodactyl Desktop");
}
