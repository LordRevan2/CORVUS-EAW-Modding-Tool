import fs from 'fs';

function readTgaDimensions(filePath: string) {
  const buf = fs.readFileSync(filePath);
  // TGA Header is 18 bytes.
  // Bytes 12-13: Width
  // Bytes 14-15: Height
  const width = buf.readUInt16LE(12);
  const height = buf.readUInt16LE(14);
  console.log(`TGA Size: ${width}x${height}`);
}

readTgaDimensions('resources/Mt_commandbar.tga');
