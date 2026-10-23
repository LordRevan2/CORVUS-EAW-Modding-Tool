import * as fs from 'fs';

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);

let offset = 0;
const count = dt.getUint32(offset, true);
offset += 4;

for (let i = 0; i < 3; i++) {
    const nameBytes = new Uint8Array(orig.buffer, orig.byteOffset + offset, 64);
    let nameStr = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
    offset += 64;
    offset += 16;
    
    const alpha = dt.getUint8(offset);
    offset += 1;
    
    console.log(`Icon: ${nameStr}, Alpha: ${alpha}`);
}
