import fs from "fs";
import sharp from "sharp";

async function generate() {
  try {
    console.log("Generating app icons from public/icon.png...");

    // 1. Generate 256x256 PNG buffer to wrap into public/icon.ico for Windows
    const png256Buffer = await sharp("public/icon.png")
      .resize(256, 256)
      .png()
      .toBuffer();

    // ICO header & directory entry for 1 image (size 256x256, offset 22)
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Resource Type (1 = Icon)
    header.writeUInt16LE(1, 4); // Number of Images (1)

    const entry = Buffer.alloc(16);
    entry.writeUInt8(0, 0); // Width: 0 means 256
    entry.writeUInt8(0, 1); // Height: 0 means 256
    entry.writeUInt8(0, 2); // Number of colors in palette (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color Planes (1)
    entry.writeUInt16LE(32, 6); // Bits per Pixel (32)
    entry.writeUInt32LE(png256Buffer.length, 8); // Size of image data
    entry.writeUInt32LE(22, 12); // Offset to image data (6-byte header + 16-byte entry = 22)

    const icoBuffer = Buffer.concat([header, entry, png256Buffer]);
    await fs.promises.writeFile("public/icon.ico", icoBuffer);
    console.log("✓ Created public/icon.ico (256x256 wrapped in ICO format)");

    // 2. Generate NSIS installer aesthetics
    console.log("Generating NSIS installer graphics...");
    if (!fs.existsSync("build")) {
      fs.mkdirSync("build");
    }

    const sidebarSvg = `
    <svg width="164" height="314" xmlns="http://www.w3.org/2000/svg">
      <rect width="164" height="314" fill="#0f172a" />
      <polygon points="0,0 40,0 120,314 0,314" fill="#164e63" opacity="0.5"/>
      <polygon points="20,0 45,0 125,314 20,314" fill="#0891b2" opacity="0.3"/>
      <polygon points="0,290 164,220 164,314 0,314" fill="#f59e0b" opacity="0.15"/>
      <text x="20" y="275" fill="#06b6d4" font-family="sans-serif" font-size="22" font-weight="bold">CORVUS</text>
      <text x="22" y="295" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="normal">EAW MOD TOOL</text>
    </svg>`;

    const headerSvg = `
    <svg width="150" height="57" xmlns="http://www.w3.org/2000/svg">
       <rect width="150" height="57" fill="#ffffff" />
       <circle cx="120" cy="28" r="20" fill="#0f172a" />
       <text x="120" y="34" fill="#06b6d4" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">CV</text>
       <text x="10" y="34" fill="#0f172a" font-family="sans-serif" font-size="16" font-weight="bold">CORVUS</text>
    </svg>`;

    await sharp(Buffer.from(sidebarSvg))
      .png()
      .toFile("build/installerSidebar.png");
    console.log("✓ Created build/installerSidebar.png");

    await sharp(Buffer.from(headerSvg))
      .png()
      .toFile("build/installerHeader.png");
    console.log("✓ Created build/installerHeader.png");

    console.log("All app icons successfully generated!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generate();
