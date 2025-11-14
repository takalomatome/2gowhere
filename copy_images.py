import os
import shutil

image_dir = r"c:\Users\THLOLELO\Desktop\2gowhere final with unsplash\images"

# Map of source files to target names
mapping = {
    "placeholder_1.svg": "placeholder_1.jpg",
    "placeholder_2.jpg.jpg": "placeholder_2.jpg",
    "placeholder_3.svg": "placeholder_3.jpg",
    "placeholder_4.jpg.jpg": "placeholder_4.jpg",
    "placeholder_5.jpg.jpg": "placeholder_5.jpg",
    "placeholder_6.jpg.webp": "placeholder_6.jpg",
    "placeholder_7.jpg.webp": "placeholder_7.jpg",
    "placeholder_8.jpg.webp": "placeholder_8.jpg",
    "placeholder_9.jpg.webp": "placeholder_9.jpg",
    "placeholder_10.jpg.jpg": "placeholder_10.jpg",
    "placeholder_11.jpg.jpg": "placeholder_11.jpg",
    "placeholder_12.jpg.jpg": "placeholder_12.jpg",
}

for src, dst in mapping.items():
    src_path = os.path.join(image_dir, src)
    dst_path = os.path.join(image_dir, dst)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src} -> {dst}")
    else:
        print(f"Source not found: {src}")

print("\nFinal files in images folder:")
for f in sorted(os.listdir(image_dir)):
    if f.startswith("placeholder_") and f.endswith(".jpg"):
        fsize = os.path.getsize(os.path.join(image_dir, f))
        print(f"  {f}: {fsize} bytes")
