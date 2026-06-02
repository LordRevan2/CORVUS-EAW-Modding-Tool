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

    console.log("All app icons successfully generated!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generate();
