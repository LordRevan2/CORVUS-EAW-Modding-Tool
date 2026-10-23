const fs = require('fs');
const { parseMtd, serializeMtd } = require('./src/lib/mtd.ts');

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
// We need to parse using the actual code
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

// Now use the TS serializeMtd manually
const { execSync } = require('child_process');
execSync('npx -y tsx test-serialize-2.ts');
