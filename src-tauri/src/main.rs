// Business-Logik (Pterodactyl-API-Zugriff, Dateioperationen) läuft bewusst im
// Frontend über die Tauri-Plugins (http, fs, store, dialog). Die einzige Ausnahme
// ist die Live-Konsole: Wings lehnt WebSocket-Verbindungen mit Browser-Origin-Header
// oft ab, daher läuft die Konsolen-Verbindung nativ über ws_proxy.rs (siehe dort).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod discord_rpc;
mod ws_proxy;

use discord_rpc::DiscordRpcState;
use tauri::Manager;
use ws_proxy::WsState;

fn main() {
    tauri::Builder::default()
        // Muss laut Tauri-Doku als allererstes Plugin registriert werden. Ein zweiter
        // Programmstart holt stattdessen einfach das schon laufende Fenster in den
        // Vordergrund, statt eine zweite Instanz zu öffnen.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(WsState::default())
        .manage(DiscordRpcState::default())
        .invoke_handler(tauri::generate_handler![
            ws_proxy::ws_connect,
            ws_proxy::ws_send,
            ws_proxy::ws_close,
            discord_rpc::discord_connect,
            discord_rpc::discord_update_presence,
            discord_rpc::discord_disconnect
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pterodactyl Desktop");
}
