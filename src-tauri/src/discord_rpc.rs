// Discord Rich Presence: zeigt in Discord an, dass gerade Pterodactyl Desktop
// läuft (z. B. "Verwaltet einen Server"). Optional, standardmäßig deaktiviert
// (siehe Einstellungen) - verbindet sich per lokaler IPC mit dem Discord-Client,
// falls dieser läuft. Ist Discord nicht offen, schlägt discord_connect einfach
// fehl und das Feature bleibt inaktiv, ohne die App zu stören.

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::Mutex;
use tauri::State;

const DISCORD_CLIENT_ID: &str = "1527966785687523370";

#[derive(Default)]
pub struct DiscordRpcState(pub Mutex<Option<DiscordIpcClient>>);

#[tauri::command]
pub fn discord_connect(state: State<'_, DiscordRpcState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    if guard.is_some() {
        return Ok(());
    }
    let mut client = DiscordIpcClient::new(DISCORD_CLIENT_ID).map_err(|e| e.to_string())?;
    client.connect().map_err(|e| e.to_string())?;
    *guard = Some(client);
    Ok(())
}

#[tauri::command]
pub fn discord_update_presence(
    state: State<'_, DiscordRpcState>,
    details: String,
    state_text: String,
    start_timestamp: i64,
) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    let client = guard.as_mut().ok_or_else(|| "Discord nicht verbunden".to_string())?;
    let payload = activity::Activity::new()
        .details(&details)
        .state(&state_text)
        .timestamps(activity::Timestamps::new().start(start_timestamp))
        .assets(activity::Assets::new().large_image("logo").large_text("Pterodactyl Desktop"));
    client.set_activity(payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn discord_disconnect(state: State<'_, DiscordRpcState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    if let Some(mut client) = guard.take() {
        let _ = client.close();
    }
    Ok(())
}
