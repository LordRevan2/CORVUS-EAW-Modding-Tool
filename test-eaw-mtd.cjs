const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');

// Let's create our own buffer using the same logic
const dtOrig = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);
const count = dtOrig.getUint32(0, true);

const outBuffer = Buffer.alloc(4 + count * 81);
outBuffer.writeUInt32LE(count, 0);

let offset = 4;
for(let i=0; i<count; i++) {
  // Read name
  const nameBytes = orig.slice(offset, offset + 64);
  offset += 64;
  
  const x = dtOrig.getUint32(offset, true); offset += 4;
  const y = dtOrig.getUint32(offset, true); offset += 4;
  const w = dtOrig.getUint32(offset, true); offset += 4;
  const h = dtOrig.getUint32(offset, true); offset += 4;
  const alpha = dtOrig.getUint8(offset); offset += 1;
  
  // write out
  let outOffset = 4 + (i * 81);
  nameBytes.copy(outBuffer, outOffset, 0, 64);
  outOffset += 64;
  outBuffer.writeUInt32LE(x, outOffset); outOffset += 4;
  outBuffer.writeUInt32LE(y, outOffset); outOffset += 4;
  outBuffer.writeUInt32LE(w, outOffset); outOffset += 4;
  outBuffer.writeUInt32LE(h, outOffset); outOffset += 4;
  outBuffer.writeUInt8(alpha, outOffset);
}

const areEqual = orig.equals(outBuffer);
console.log("Are equal directly?", areEqual);

if (!areEqual) {
  for(let j=0; j<orig.byteLength; j++) {
    if (orig[j] !== outBuffer[j]) {
      console.log(`Mismatch at ${j}: orig=${orig[j]} out=${outBuffer[j]}`);
      break;
    }
  }
}
