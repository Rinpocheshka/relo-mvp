import shutil
import os

source_dir = r"C:\Users\messs\Desktop\Cursor\Relo\drive-download-20260402T032016Z-1-001\color pics"
target_dir = r"c:\Users\messs\Desktop\Cursor\Relo\Figma\public\assets\icons\custom"

os.makedirs(target_dir, exist_ok=True)

mapping = {
    "жилье.png": "category_housing.png",
    "вентилятор.png": "category_stuff.png",
    "уборка.png": "category_services.png",
    "деньги.png": "category_finance.png",
    "бесплатно.png": "category_free.png",
    "с детьми.png": "category_kids_support.png",
    "карта с точкой.png": "category_city.png",
    "указатель.jpg": "category_places.jpg",
    "d0b622cd15b5f5f61d8ddb479dfca42c.png": "category_health.png"
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
