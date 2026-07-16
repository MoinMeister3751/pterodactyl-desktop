// Nativer WebSocket-Proxy für die Wings-Live-Konsole.
//
// Warum das nötig ist: Wings validiert beim WebSocket-Handshake den Origin-Header
// gegen die im Node/Wings-Config hinterlegte Panel-URL und lehnt jede Verbindung ab,
// deren Origin nicht exakt passt (HTTP 403) - sowohl ein falscher Origin
// (`tauri://localhost` aus dem WebView) als auch ein fehlender Origin werden abgelehnt.
// Da das WebView den eigenen Origin nicht überschreiben lässt, läuft die Verbindung
// nativ über tokio-tungstenite, wo wir den Origin-Header explizit auf die echte
// Panel-URL des jeweiligen Profils setzen können.
//
// Nachrichten werden per Tauri-Event ans Frontend durchgereicht (siehe
// src/lib/ws/tauriWebSocket.ts), Befehle vom Frontend kommen über ws_send() zurück.

use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::mpsc;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{client::IntoClientRequest, http::HeaderValue, Message},
};

#[derive(Default)]
pub struct WsState(pub Mutex<HashMap<String, mpsc::UnboundedSender<Message>>>);

#[derive(Clone, Serialize)]
struct WsMessagePayload {
    #[serde(rename = "connectionId")]
    connection_id: String,
    data: String,
}

#[derive(Clone, Serialize)]
struct WsErrorPayload {
    #[serde(rename = "connectionId")]
    connection_id: String,
    message: String,
}

#[derive(Clone, Serialize)]
struct WsClosedPayload {
    #[serde(rename = "connectionId")]
    connection_id: String,
}

#[tauri::command]
pub async fn ws_connect(
    app: AppHandle,
    state: State<'_, WsState>,
    url: String,
    origin: String,
) -> Result<String, String> {
    let mut request = url
        .as_str()
        .into_client_request()
        .map_err(|e| format!("Ungültige Konsolen-URL: {e}"))?;
    let origin_value = HeaderValue::from_str(&origin)
        .map_err(|e| format!("Ungültiger Origin-Wert '{origin}': {e}"))?;
    request.headers_mut().insert("Origin", origin_value);

    let (ws_stream, _response) = connect_async(request)
        .await
        .map_err(|e| format!("Verbindung zur Konsole fehlgeschlagen: {e}"))?;

    let connection_id = format!(
        "{:x}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
    );

    let (mut write, mut read) = ws_stream.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    state.0.lock().unwrap().insert(connection_id.clone(), tx);

    // Schreiber-Task: nimmt Nachrichten aus dem Channel entgegen und sendet sie über den Socket.
    tauri::async_runtime::spawn(async move {
        while let Some(msg) = rx.recv().await {
            let is_close = msg.is_close();
            if write.send(msg).await.is_err() || is_close {
                break;
            }
        }
    });

    // Leser-Task: liest eingehende Nachrichten und reicht sie als Event ans Frontend durch.
    let app_handle = app.clone();
    let read_id = connection_id.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            match read.next().await {
                Some(Ok(Message::Text(text))) => {
                    let _ = app_handle.emit(
                        &format!("ws-message://{read_id}"),
                        WsMessagePayload {
                            connection_id: read_id.clone(),
                            data: text.to_string(),
                        },
                    );
                }
                Some(Ok(Message::Close(_))) | None => break,
                Some(Ok(_)) => {
                    // Ping/Pong/Binary werden für die Konsole (reines JSON-über-Text-Protokoll) ignoriert.
                }
                Some(Err(e)) => {
                    let _ = app_handle.emit(
                        &format!("ws-error://{read_id}"),
                        WsErrorPayload {
                            connection_id: read_id.clone(),
                            message: e.to_string(),
                        },
                    );
                    break;
                }
            }
        }
        let _ = app_handle.emit(
            &format!("ws-closed://{read_id}"),
            WsClosedPayload { connection_id: read_id.clone() },
        );
    });

    Ok(connection_id)
}

#[tauri::command]
pub fn ws_send(state: State<'_, WsState>, connection_id: String, message: String) -> Result<(), String> {
    let map = state.0.lock().unwrap();
    let sender = map.get(&connection_id).ok_or_else(|| "Verbindung nicht gefunden".to_string())?;
    sender.send(Message::Text(message.into())).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ws_close(state: State<'_, WsState>, connection_id: String) -> Result<(), String> {
    let mut map = state.0.lock().unwrap();
    if let Some(sender) = map.remove(&connection_id) {
        let _ = sender.send(Message::Close(None));
    }
    Ok(())
}
