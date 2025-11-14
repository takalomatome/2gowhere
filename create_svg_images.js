const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');

const colors = [
  ['#667eea', '#764ba2'],   // Blue-Purple
  ['#f093fb', '#f5576c'],   // Pink-Red
  ['#4facfe', '#00f2fe'],   // Cyan-Blue
  ['#43e97b', '#38f9d7'],   // Green-Teal
  ['#fa709a', '#fee140'],   // Coral-Yellow
  ['#30cfd0', '#330867'],   // Teal-Purple
  ['#a8edea', '#fed6e3'],   // Mint-Pink
  ['#ff9a56', '#ff6a88'],   // Orange-Pink
  ['#2e2e78', '#662d8c'],   // Dark Blue-Purple
  ['#bdc3c7', '#2c3e50'],   // Gray-Dark
  ['#89f7fe', '#66a6ff'],   // Cyan-Blue
  ['#e0c3fc', '#8ec5fc']    // Lavender-Blue
];

colors.forEach((colorPair, i) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#grad)"/>
  </svg>`;

  const filename = path.join(imagesDir, `placeholder_${i + 1}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('All SVG images created!');
