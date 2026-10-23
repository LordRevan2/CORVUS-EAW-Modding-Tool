const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);
const count = dt.getUint32(0, true);
let prevName = "";
for (let i = 0; i < count; i++) {
  const nameBytes = new Uint8Array(orig.buffer, orig.byteOffset + 4 + (i * 81), 64);
  const name = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
  if (name < prevName) {
    console.log(`Not sorted! ${prevName} comes before ${name}`);
  }
  prevName = name;
}
console.log("Checked sorting.");
