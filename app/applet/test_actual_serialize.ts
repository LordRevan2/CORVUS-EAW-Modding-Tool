import fs from 'fs';
import { parseMtd, serializeMtd } from './src/lib/mtd';

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const icons = parseMtd(orig.buffer.slice(orig.byteOffset, orig.byteOffset + orig.byteLength));
const newBuf = serializeMtd(icons);
const newArr = new Uint8Array(newBuf);

let diffs = 0;
console.log(`orig: ${orig.length}, new: ${newArr.length}`);
for(let i=0; i<orig.length; i++){
  if (orig[i] !== newArr[i]) {
    diffs++;
    if(diffs < 20) console.log(`Diff at ${i} orig=${orig[i]} new=${newArr[i]}`);
  }
}
console.log('Total diffs:', diffs);
