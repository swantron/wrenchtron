const fs = require('fs');
const path = require('path');

// Simple favicon generator using Canvas API (built-in to Node 18+)
const { createCanvas, loadImage } = require('canvas');

async function generateFavicon() {
    const svgPath = path.join(__dirname, '../public/icons/icon.svg');
    const outputPath = path.join(__dirname, '../src/app/favicon.ico');

    // Load SVG and render to 32x32 PNG (standard favicon size)
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');

    // Read SVG as text and create data URL
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');

    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0, 32, 32);

    // Write as PNG (browsers accept PNG as .ico)
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log('✓ Generated favicon.ico at', outputPath);
}

generateFavicon().catch(console.error);
