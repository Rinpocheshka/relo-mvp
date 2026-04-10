import shutil
import os

source_dir = r"C:\Users\messs\Desktop\Cursor\Relo\drive-download-20260402T032016Z-1-001\color pics"
target_dir = r"c:\Users\messs\Desktop\Cursor\Relo\Figma\public\assets\icons\custom"

os.makedirs(target_dir, exist_ok=True)

mapping = {
    "люди 2.png": "people_tab.png",
    "люди 1.png": "people_all.png",
    "глобус.png": "people_planning.png",
    "люди 3.png": "people_settling.png",
    "карта с точкой.png": "people_sharing.png",
    "мир самолет.png": "people_moving.png",
    "люди 4.png": "support_tab.png",
    "афиша.png": "events_all.png",
    "мяч.png": "events_entertainment.png",
    "книги.png": "events_business.png",
    "серф.png": "events_sport.png",
    "дети 2.png": "events_kids.png",
    "солнце.png": "events_other.png"
}

for src_name, target_name in mapping.items():
    src_path = os.path.join(source_dir, src_name)
    target_path = os.path.join(target_dir, target_name)
    
    if os.path.exists(src_path):
        print(f"Copying {src_name} -> {target_name}")
        shutil.copy2(src_path, target_path)
    else:
        print(f"WARNING: Source file not found: {src_name}")

print("Done!")
