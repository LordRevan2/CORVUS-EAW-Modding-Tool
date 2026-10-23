import * as fs from 'fs';

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const dt = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);

let offset = 0;
const count = dt.getUint32(offset, true);
offset += 4;
console.log("Count:", count);

for (let i = 0; i < 3; i++) {
    const nameBytes = new Uint8Array(orig.buffer, orig.byteOffset + offset, 64);
    let nameStr = new TextDecoder('ascii').decode(nameBytes).split('\0')[0];
    offset += 64;
    
    const xU = dt.getUint32(offset, true);
    const xF = dt.getFloat32(offset, true);
    offset += 4;
    
    const yU = dt.getUint32(offset, true);
    const yF = dt.getFloat32(offset, true);
    offset += 4;
    
    const wU = dt.getUint32(offset, true);
    const wF = dt.getFloat32(offset, true);
    offset += 4;
    
    const hU = dt.getUint32(offset, true);
    const hF = dt.getFloat32(offset, true);
    offset += 4;
    
    const alpha = dt.getUint8(offset);
    offset += 1;
    
    console.log(`Icon: ${nameStr}`);
    console.log(`  Uint32 coords: X=${xU}, Y=${yU}, W=${wU}, H=${hU}`);
    console.log(`  Float32 coords: X=${xF}, Y=${yF}, W=${wF}, H=${hF}`);
}
