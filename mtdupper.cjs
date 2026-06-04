const fs = require('fs');

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer);
const iconCount = dt.getUint32(0, true);

let offset = 4;
let foundLower = 0;
for (let i = 0; i < iconCount; i++) {
  const nameBytes = new Uint8Array(orig.buffer, offset, 64);
  const name = new TextDecoder('ascii').decode(nameBytes).replace(/\0/g, '');
  if (name !== name.toUpperCase()) {
      console.log("Found non-upper:", name);
      foundLower++;
  }
  offset += 81;
}
console.log("Non-upper count:", foundLower);
