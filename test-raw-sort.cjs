const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);
const count = dt.getUint32(0, true);
let names = [];
for (let i = 0; i < count; i++) {
  const nameBytes = new Uint8Array(orig.buffer, orig.byteOffset + 4 + (i * 81), 64);
  const name = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
  names.push(name);
}

// Ensure it's sorted
let isSorted = true;
for (let i = 1; i < names.length; i++) {
  if (names[i - 1] > names[i]) {
    console.log("Not strict JS sorted! At index", i);
    console.log("  ", names[i-1]);
    console.log("  ", names[i]);
    isSorted = false;
  }
}
console.log("Is pure JS array sorted?", isSorted);
