import * as fs from 'fs';
import { parseMtd, MtdIcon } from './src/lib/mtd';

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const icons = parseMtd(orig.buffer.slice(orig.byteOffset, orig.byteOffset + orig.byteLength) as ArrayBuffer);

// Let's create an ALAMO format MTD
function serializeAlamo(icons: MtdIcon[], textureName: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const texBytes = encoder.encode(textureName);
  
  // Header: 12 bytes
  // Texture Name: 4 bytes (len) + texBytes.length + 1 (null byte)
  let totalSize = 12 + 4 + texBytes.length + 1;

  const iconNameBytesMap: Uint8Array[] = [];
  
  for (let i = 0; i < icons.length; i++) {
    const iconBytes = encoder.encode(icons[i].name);
    iconNameBytesMap.push(iconBytes);
    // name len (4) + nameBytes + 1 (null byte) + 4 floats (16)
    totalSize += 4 + iconBytes.length + 1 + 16;
  }
  
  const buffer = new ArrayBuffer(totalSize);
  const dt = new DataView(buffer);
  let offset = 0;
  
  // Magic
  new Uint8Array(buffer, offset, 4).set(encoder.encode("MTD ")); offset += 4;
  // Version
  dt.setUint32(offset, 2, true); offset += 4;
  // Count
  dt.setUint32(offset, icons.length, true); offset += 4;
  
  // Texture Name
  dt.setUint32(offset, texBytes.length + 1, true); offset += 4;
  new Uint8Array(buffer, offset, texBytes.length).set(texBytes); offset += texBytes.length;
  dt.setUint8(offset, 0); offset += 1; // null byte
  
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const nameBytes = iconNameBytesMap[i];
    
    // Name Length and string
    dt.setUint32(offset, nameBytes.length + 1, true); offset += 4;
    new Uint8Array(buffer, offset, nameBytes.length).set(nameBytes); offset += nameBytes.length;
    dt.setUint8(offset, 0); offset += 1; // null byte
    
    // X Left, Y Top, X Right, Y Bottom
    const xLeft = Math.max(0, icon.x);
    const xRight = Math.max(0, icon.x + icon.width);
    const yTop = Math.max(0, icon.y);
    const yBottom = Math.max(0, icon.y + icon.height);

    dt.setFloat32(offset, xLeft, true); offset += 4;
    dt.setFloat32(offset, yTop, true); offset += 4;
    dt.setFloat32(offset, xRight, true); offset += 4;
    dt.setFloat32(offset, yBottom, true); offset += 4;
  }
  
  return buffer;
}

const outBuffer = serializeAlamo(icons, "MT_CommandBar.tga");
fs.writeFileSync('test_alamo.mtd', Buffer.from(outBuffer));
console.log("Written test_alamo.mtd successfully");
