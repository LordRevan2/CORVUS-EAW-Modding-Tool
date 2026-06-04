const fs = require('fs');

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer);
const iconCount = dt.getUint32(0, true);

let offset = 4;
const origOrder = [];
for (let i = 0; i < iconCount; i++) {
  const nameBytes = new Uint8Array(orig.buffer, offset, 64);
  const name = new TextDecoder('ascii').decode(nameBytes).replace(/\0/g, '');
  origOrder.push(name);
  offset += 81;
}

const jsSorted = [...origOrder].sort((a,b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
});

let mismatch = -1;
for (let i = 0; i < origOrder.length; i++) {
   if (origOrder[i] !== jsSorted[i]) {
       console.log(`Mismatch at ${i}: Orig=${origOrder[i]}, JS=${jsSorted[i]}`);
       mismatch = i;
       break;
   }
}
if (mismatch === -1) {
    console.log("Original is sorted exactly like JS ASCII sort!");
}
