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

const sorted1 = [...names].sort();
const sorted2 = [...names].sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
const sorted3 = [...names].sort((a,b) => {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al < bl) return -1;
  if (al > bl) return 1;
  return 0;
});

let ok1=true, ok2=true, ok3=true;
for(let i=0; i<count; i++) {
   if (names[i] !== sorted1[i]) ok1=false;
   if (names[i] !== sorted2[i]) ok2=false;
   if (names[i] !== sorted3[i]) ok3=false;
}

console.log("Native JS sort match?", ok1);
console.log("LocaleCompare lower?", ok2);
console.log("Strict Lowercase match?", ok3);
