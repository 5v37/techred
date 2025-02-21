use std::io::Read;
use std::io::Write;

#[tauri::command]
fn file_path() -> String {
    if let Some(path) = std::env::args().nth(1) {
        return path;
    };
    String::new()
}

fn extract_file(file_path: String) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open(file_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    let count = archive.len();
    if count == 0 {
        Err("Файл архива пустой".into())
    } else if count > 1 {
        Err("Файл архива содержит больше одного файла".into())
    } else {
        let mut file = archive.by_index(0)?;
        if file.is_dir() {
            return Err("Файл архива содержит директорию".into());
        }
        let mut content = Vec::new();
        file.read_to_end(&mut content)?;
        Ok(content)
    }
}

fn pack_to_archive(file_path: String, content: String) -> Result<(), Box<dyn std::error::Error>> {
    let path = std::path::PathBuf::from(file_path.clone());
    let mut file_name = path.file_stem().unwrap().to_str().unwrap().to_string();
    if file_path.ends_with(".fbz") {
        file_name.push_str(".fb2");
    };

    let file = std::fs::File::create(file_path)?;
    let mut zip = zip::ZipWriter::new(file);

    zip.start_file(
        file_name,
        zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::DEFLATE),
    )?;
    zip.write_all(content.as_bytes())?;
    zip.finish()?;
    Ok(())
}

#[tauri::command]
fn open_file(file_path: String) -> Result<tauri::ipc::Response, String> {
    let data = if file_path.ends_with(".fb2") {
        std::fs::read(file_path).map_err(|err| Box::from(err))
    } else if file_path.ends_with(".fbz") || file_path.ends_with(".fb2.zip") {
        extract_file(file_path)
    } else {
        Err("Неподдерживаемый формат файла".into())
    };
    return match data {
        Ok(vec) => Ok(tauri::ipc::Response::new(vec)),
        Err(e) => Err(e.to_string()),
    };
}

#[tauri::command]
fn save_file(file_path: String, content: String) -> Result<(), String> {
    if file_path.ends_with(".fb2") {
        return std::fs::write(file_path, content).map_err(|err| err.to_string());
    } else if file_path.ends_with(".fbz") || file_path.ends_with(".fb2.zip") {
        return pack_to_archive(file_path, content).map_err(|err| err.to_string());
    } else {
        return Err("Неподдерживаемый формат файла".into());
    };
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![file_path, open_file, save_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
