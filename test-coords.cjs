const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dtOrig = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);

let offset = 4;
for(let i=0; i<3; i++) {
  const nameBytes = orig.slice(offset, offset + 64);
  offset += 64;
  
  const x1 = dtOrig.getUint32(offset, true); offset += 4;
  const y1 = dtOrig.getUint32(offset, true); offset += 4;
  const x2 = dtOrig.getUint32(offset, true); offset += 4;
  const y2 = dtOrig.getUint32(offset, true); offset += 4;
  const alpha = dtOrig.getUint8(offset); offset += 1;
  const name = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
  console.log(`Icon ${name}: x1=${x1}, y1=${y1}, x2=${x2}, y2=${y2}, alpha=${alpha}`);
}
