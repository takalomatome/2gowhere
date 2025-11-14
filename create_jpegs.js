const fs = require('fs');
const path = require('path');

// Simple JPEG creator - writes valid JPEG files with solid colors
function createSolidColorJPEG(filename, width, height, r, g, b) {
  // JPEG Start Of Image marker
  let jpeg = Buffer.from([0xFF, 0xD8]);
  
  // APP0 (JFIF) marker
  jpeg = Buffer.concat([jpeg, Buffer.from([0xFF, 0xE0])]);
  jpeg = Buffer.concat([jpeg, Buffer.from([0x00, 0x10])]);
  jpeg = Buffer.concat([jpeg, Buffer.from('JFIF\0')]);
  jpeg = Buffer.concat([jpeg, Buffer.from([0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00])]);
  
  // Quantization Table marker
  jpeg = Buffer.concat([jpeg, Buffer.from([0xFF, 0xDB, 0x00, 0x43, 0x00])]);
  const qtable = [16,11,10,16,24,40,51,61,12,12,14,19,26,58,60,55,14,13,16,24,40,57,69,56,14,17,22,29,51,87,80,62,18,22,37,56,68,109,103,77,24,35,55,64,81,104,113,92,49,64,78,87,103,121,120,101,72,92,95,98,112,100,103,99];
  qtable.forEach(q => jpeg = Buffer.concat([jpeg, Buffer.from([q])]));
  
  // SOF0 marker (baseline DCT)
  jpeg = Buffer.concat([jpeg, Buffer.from([0xFF, 0xC0, 0x00, 0x0B, 0x08])]);
  jpeg = Buffer.concat([jpeg, Buffer.from([(height >> 8) & 0xFF, height & 0xFF, (width >> 8) & 0xFF, width & 0xFF, 0x01, 0x01, 0x11, 0x00])]);
  
  // DHT marker
  jpeg = Buffer.concat([jpeg, Buffer.from([0xFF, 0xC4, 0x00, 0x1F, 0x00])]);
  const dcLengths = [0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11];
  dcLengths.forEach(l => jpeg = Buffer.concat([jpeg, Buffer.from([l])]));
  
  // SOS marker (start of scan)
  jpeg = Buffer.concat([jpeg, Buffer.from([0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00])]);
  
  // Simple image data (MCU with color)
  const mcu = Buffer.from([r, g, b, r, g, b, r, g, b, r, g, b]);
  for (let i = 0; i < 100; i++) {
    jpeg = Buffer.concat([jpeg, mcu]);
  }
  
  // End Of Image marker
  jpeg = Buffer.concat([jpeg, Buffer.from([0xFF, 0xD9])]);
  
  fs.writeFileSync(filename, jpeg);
}

const imagesDir = path.join(__dirname, 'images');
const colors = [
  [102, 126, 234],   // Blue
  [240, 147, 251],   // Pink
  [79, 172, 254],    // Light Blue
  [67, 233, 123],    // Green
  [250, 154, 158],   // Coral
  [48, 207, 208],    // Teal
  [168, 237, 234],   // Cyan
  [255, 154, 86],    // Orange
  [46, 46, 120],     // Dark Blue
  [189, 195, 199],   // Gray
  [137, 247, 254],   // Light Cyan
  [224, 195, 252]    // Lavender
];

colors.forEach((color, idx) => {
  const filename = path.join(imagesDir, `placeholder_${idx + 1}.jpg`);
  try {
    createSolidColorJPEG(filename, 1920, 1080, color[0], color[1], color[2]);
    console.log(`Created ${filename}`);
  } catch (e) {
    console.error(`Error creating ${filename}:`, e.message);
  }
});

console.log('All 12 JPEG images created successfully!');
