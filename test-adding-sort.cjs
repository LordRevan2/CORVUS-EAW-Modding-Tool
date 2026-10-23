const { serializeMtd } = require('./src/lib/mtd.ts');

const icons = [
  { id: '1', name: 'ADVANCE_BUILD_BUTTON.TGA', x: 0, y: 0, width: 10, height: 10, alpha: true },
  { id: '2', name: 'BACK_BUTTON.TGA', x: 0, y: 0, width: 10, height: 10, alpha: true },
  { id: '3', name: 'my_new_icon', x: 0, y: 0, width: 10, height: 10, alpha: true }
];

const buf = serializeMtd(icons, "Test.tga");
console.log("Length:", buf.byteLength);

const dt = new DataView(buf);
const count = dt.getUint32(0, true);
console.log("Count:", count);

for(let i=0; i<count; i++) {
  const nameBytes = new Uint8Array(buf, 4 + (i * 81), 64);
  const name = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
  console.log(`[${i}]`, name);
}

// Test against sorting array
const names = ['ADVANCE_BUILD_BUTTON.TGA', 'BACK_BUTTON.TGA', 'MY_NEW_ICON.TGA'];
const sorted = [...names].sort();
console.log("Expected sorting:", sorted);

// Check binary mismatch
let match = true;
for(let i=0; i<3; i++) {
   const readName = (new TextDecoder('ascii').decode(new Uint8Array(buf, 4+(i*81), 64))).split('\0')[0];
   if (readName !== sorted[i]) match = false;
}
console.log("Matches pure JS sort perfectly = ", match);

