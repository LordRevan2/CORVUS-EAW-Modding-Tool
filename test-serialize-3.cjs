const fs = require('fs');
const { parseMtd, serializeMtd } = require('./src/lib/mtd.ts');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');

const dt = new DataView(orig.buffer);
const iconCount = dt.getUint32(0, true);
const icons = [];
let offset = 4;
for (let i = 0; i < iconCount; i++) {
    const nameBytes = new Uint8Array(orig.buffer, offset, 64);
    let nameStr = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
    offset += 64;
    const x = dt.getUint32(offset, true); offset += 4;
    const y = dt.getUint32(offset, true); offset += 4;
    const width = dt.getUint32(offset, true); offset += 4;
    const height = dt.getUint32(offset, true); offset += 4;
    const alpha = dt.getUint8(offset); offset += 1;
    icons.push({ id: String(i), name: nameStr, x, y, width, height, alpha: alpha !== 0 });
}

// Ensure the name is uppercase when passed
icons.forEach(i => i.name = i.name.toUpperCase());

// Test raw export
const buf = serializeMtd(icons, "Test.tga");
const outBuffer = Buffer.from(buf);

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

// Now let's try with ONE new icon added
const iconsModified = [...icons];
iconsModified.push({ id: 'new_my_icon', name: 'MY_NEW_ICON.TGA', x: 0, y: 0, width: 20, height: 20, alpha: true });
const bufMod = serializeMtd(iconsModified, "Test.tga");
const outMod = Buffer.from(bufMod);

fs.writeFileSync('test_mod.mtd', outMod);

console.log("Length of modified:", outMod.byteLength);

