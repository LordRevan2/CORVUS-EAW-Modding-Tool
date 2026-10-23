const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer);
const count = dt.getUint32(0, true);
let offset = 4;
const alphaVals = new Set();
for (let i = 0; i < count; i++) {
  offset += 64 + 16;
  alphaVals.add(dt.getUint8(offset));
  offset += 1;
}
console.log("Alpha values in vanilla:", Array.from(alphaVals));
