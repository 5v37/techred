use std::sync::{Mutex, OnceLock};

static FILE_PATH: OnceLock<Mutex<Option<String>>> = OnceLock::new();

#[tauri::command]
fn file_path() -> String {
    if let Some(cell) = FILE_PATH.get() {
        cell.lock().unwrap().take().unwrap_or_default()
    } else {
        String::new()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    FILE_PATH.set(Mutex::new(std::env::args().nth(1))).unwrap();
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}