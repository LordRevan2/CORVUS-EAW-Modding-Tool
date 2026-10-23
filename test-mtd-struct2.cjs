const fs = require('fs');
const buf = fs.readFileSync('test1.mtd');
const dt = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

let offset = 4;
const version = dt.getUint32(offset, true); offset += 4;
const count = dt.getUint32(offset, true); offset += 4;
console.log("Version", version, "Count", count);

const texNameLen = dt.getUint32(offset, true); offset += 4;
const texName = new TextDecoder('ascii').decode(buf.slice(offset, offset + texNameLen));
offset += texNameLen;
console.log("Texture Name:", texName);

for (let i = 0; i < Math.min(3, count); i++) {
  const nameLen = dt.getUint32(offset, true); offset += 4;
  const name = new TextDecoder('ascii').decode(buf.slice(offset, offset + nameLen));
  offset += nameLen;
  
  const x1F = dt.getFloat32(offset, true);
  const x1U = dt.getUint32(offset, true);
  
  const x2F = dt.getFloat32(offset + 4, true);
  const x2U = dt.getUint32(offset + 4, true);
  
  offset += 16;
  console.log("Icon:", name);
  console.log("  Float:", x1F, x2F);
  console.log("  Uint:", x1U, x2U);
}
