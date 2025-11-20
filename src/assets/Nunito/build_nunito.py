#!/usr/bin/env python3
import subprocess
import sys
import os
from pathlib import Path

# === 1. Установка зависимостей ===
def install_package(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def ensure_dependencies():
    try:
        import fontmake
        import fontTools.ttLib
        import brotli
    except ImportError as e:
        missing = str(e).split()[-1].strip("'")
        print(f"Устанавливаю недостающий пакет: {missing}")
        if "fontmake" in str(e):
            install_package("fontmake")
        elif "fontTools" in str(e):
            install_package("fonttools")
        elif "brotli" in str(e):
            install_package("brotli")
        # Рекурсивно проверим снова
        ensure_dependencies()

# === 2. Сборка TTF из .glyphs ===
def build_ttf():
    glyphs_file = "sources/Nunito.glyphs"
    if not Path(glyphs_file).exists():
        print(f"Ошибка: файл {glyphs_file} не найден. Запускайте скрипт из корня репозитория Nunito.")
        sys.exit(1)

    out_dir = Path("fonts/ttf")
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Собираю TTF-шрифты...")
    subprocess.check_call([
        "fontmake", "-g", glyphs_file, "-i", "--output-dir", str(out_dir)
    ])
    print("✅ TTF-шрифты собраны.")

# === 3. Конвертация TTF → WOFF2 ===
def ttf_to_woff2(ttf_path: Path, woff2_path: Path):
    from fontTools.ttLib import TTFont
    font = TTFont(ttf_path)
    font.flavor = "woff2"
    font.save(woff2_path)
    font.close()

def convert_to_woff2():
    ttf_dir = Path("fonts/ttf")
    woff2_dir = Path("fonts/woff2")
    woff2_dir.mkdir(parents=True, exist_ok=True)

    if not ttf_dir.exists():
        print("Ошибка: папка fonts/ttf не найдена. Сначала соберите TTF.")
        sys.exit(1)

    ttf_to_woff2("fonts/ttf/Nunito-Regular.ttf", "fonts/woff2/Nunito-Regular.woff2")
    ttf_to_woff2("fonts/ttf/Nunito-Bold.ttf", "fonts/woff2/Nunito-Bold.woff2")
    ttf_to_woff2("fonts/ttf/Nunito-Italic.ttf", "fonts/woff2/Nunito-Italic.woff2")
    ttf_to_woff2("fonts/ttf/Nunito-BoldItalic.ttf", "fonts/woff2/Nunito-BoldItalic.woff2")
    print("✅ WOFF2-шрифты созданы.")

# === 4. Запуск всего по порядку ===
def main():
    print("Скрипт для сборки шрифтов Nunito (https://github.com/googlefonts/nunito.git).")
    ensure_dependencies()
    build_ttf()
    convert_to_woff2()
    print("\n🎉 Готово! Шрифты Nunito собраны и доступны из папки fonts/woff2/.")

if __name__ == "__main__":
    main()