import * as fs from 'fs';
import { parseMtd, serializeMtd } from './src/lib/mtd';

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
// Convert to ArrayBuffer cleanly
const arrayBuffer = orig.buffer.slice(orig.byteOffset, orig.byteOffset + orig.byteLength);
const icons = parseMtd(arrayBuffer);
const newBuf = serializeMtd(icons);
const newBufView = new Uint8Array(newBuf);

if(orig.byteLength !== newBuf.byteLength) {
    console.log("Length mismatch:", orig.byteLength, newBuf.byteLength);
} else {
    console.log("Lengths match!");
}

let mismatches = 0;
for(let i=0; i<orig.byteLength; i++) {
    if(orig[i] !== newBufView[i]) {
        console.log(`Mismatch at ${i}: orig=${orig[i]} new=${newBufView[i]}`);
        mismatches++;
        if(mismatches > 10) break;
    }
}
if(mismatches === 0) {
    console.log("Perfect match!");
}
