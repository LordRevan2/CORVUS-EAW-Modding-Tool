const fs = require('fs');

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer);
const iconCount = dt.getUint32(0, true);
console.log("Count:", iconCount);

let offset = 4;
for (let i = 0; i < 2; i++) {
  const nameBytes = new Uint8Array(orig.buffer, offset, 64);
  const name = new TextDecoder('ascii').decode(nameBytes).replace(/\0/g, '');
  offset += 64;
  
  const xInt = dt.getUint32(offset, true);
  const xFloat = dt.getFloat32(offset, true);
  offset += 4;
  
  const yInt = dt.getUint32(offset, true);
  const yFloat = dt.getFloat32(offset, true);
  offset += 4;
  
  const wInt = dt.getUint32(offset, true);
  const wFloat = dt.getFloat32(offset, true);
  offset += 4;
  
  const hInt = dt.getUint32(offset, true);
  const hFloat = dt.getFloat32(offset, true);
  offset += 4;
  
  const alphaBytes = new Uint8Array(orig.buffer, offset, 4);
  let alphastr = "";
  for(let j=0; j<4; j++) alphastr += alphaBytes[j] + " ";
  
  const alphaByte = dt.getUint8(offset);
  offset += 1; // wait, is it 1 byte or 4 bytes?
  
  console.log(`Icon: ${name}`);
  console.log(`X: int=${xInt}, float=${xFloat}`);
  console.log(`Y: int=${yInt}, float=${yFloat}`);
  console.log(`W: int=${wInt}, float=${wFloat}`);
  console.log(`H: int=${hInt}, float=${hFloat}`);
  console.log(`Alpha byte: ${alphaByte}, 4bytes: ${alphastr}`);
  
  // if Alpha byte is 1 byte, offset increases by 1.
  // Wait, EAW MTD structure:
  // Name 64
  // X (uint16? uint32?)
  // Y
  // W
  // H
  // Wait, let's just log the 16 bytes after Name as floats and uint32s.
}
