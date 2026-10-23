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

// Ensure all are uppercase?
let allUpper = true;
let anyLower = false;
for (let n of names) {
  if (n !== n.toUpperCase()) allUpper = false;
  if (n !== n.toUpperCase() && /[a-z]/.test(n)) anyLower = true;
}
console.log("All upper?", allUpper, "Any lower?", anyLower);
