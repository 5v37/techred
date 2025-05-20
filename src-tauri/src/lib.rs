#[tauri::command]
fn file_path() -> String {
    if let Some(path) = std::env::args().nth(1) {
        return path;
    };
    String::new()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
