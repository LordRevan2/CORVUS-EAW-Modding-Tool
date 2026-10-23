const { Jimp } = require('jimp');

async function main() {
  // NSIS installer sidebar is usually 164x314
  // and header is 150x57. 
  // We'll create simple clean gradient/color backgrounds with the icon.
  try {
    const icon = await Jimp.read('public/icon.png');

    // 1. Sidebar (164x314)
    const sidebar = new Jimp({ width: 164, height: 314, color: 0x0f172aff }); // slate-900 equivalent
    
    // Draw some subtle cyan lines or boxes
    for (let i = 0; i < 314; i += 10) {
      for (let j = 0; j < 164; j += 10) {
        if ((i + j) % 20 === 0) {
          sidebar.setPixelColor(0x1e293bff, j, i); // slate-800
        }
      }
    }
    
    // Top-left cyan border accent
    for (let x = 0; x < 60; x++) {
      sidebar.setPixelColor(0x06b6d4ff, x, 0);
      sidebar.setPixelColor(0x06b6d4ff, x, 1);
      sidebar.setPixelColor(0x06b6d4ff, x, 2);
    }
    for (let y = 0; y < 60; y++) {
      sidebar.setPixelColor(0x06b6d4ff, 0, y);
      sidebar.setPixelColor(0x06b6d4ff, 1, y);
      sidebar.setPixelColor(0x06b6d4ff, 2, y);
    }

    // Resize icon and put in center
    const sbIcon = icon.clone().resize({ w: 80, h: 80 });
    sidebar.composite(sbIcon, 42, 117);

    await sidebar.write('public/installerSidebar.bmp');
    
    // 2. Header (150x57)
    const header = new Jimp({ width: 150, height: 57, color: 0x0f172aff });
    
    // Right side cyan accent
    for (let y = 0; y < 57; y++) {
      header.setPixelColor(0x06b6d4ff, 147, y);
      header.setPixelColor(0x06b6d4ff, 148, y);
      header.setPixelColor(0x06b6d4ff, 149, y);
    }

    // Small icon
    const hdIcon = icon.clone().resize({ w: 40, h: 40 });
    header.composite(hdIcon, 8, 8);

    await header.write('public/installerHeader.bmp');

    console.log("NSIS assets generated!");
  } catch (err) {
    console.error("Error generating assets", err);
  }
}

main();
