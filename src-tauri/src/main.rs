// Alle Business-Logik (Pterodactyl-API-Zugriff, WebSocket-Konsole, Dateioperationen)
// läuft bewusst im Frontend über die Tauri-Plugins (http, fs, store, dialog).
// Das hält die Rust-Seite minimal und die Architektur einfach nachvollziehbar:
// Der Rust-Prozess ist hier "nur" der native Shell-Host + Plugin-Bridge.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running Pterodactyl Desktop");
}
