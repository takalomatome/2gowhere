from PIL import Image, ImageDraw
import os

image_dir = r"c:\Users\THLOLELO\Desktop\2gowhere final with unsplash\images"
width, height = 1920, 1080

colors = [
    (102, 126, 234),   # Blue
    (240, 147, 251),   # Pink
    (79, 172, 254),    # Light Blue
    (67, 233, 123),    # Green
    (250, 154, 158),   # Coral
    (48, 207, 208),    # Teal
    (168, 237, 234),   # Cyan
    (255, 154, 86),    # Orange
    (46, 46, 120),     # Dark Blue
    (189, 195, 199),   # Gray
    (137, 247, 254),   # Light Cyan
    (224, 195, 252)    # Lavender
]

for i in range(12):
    img = Image.new('RGB', (width, height), color=colors[i])
    filename = os.path.join(image_dir, f"placeholder_{i+1}.jpg")
    img.save(filename, 'JPEG', quality=95)
    print(f"Created {filename}")

print("All images created successfully!")
