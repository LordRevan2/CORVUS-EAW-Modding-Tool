import fs from 'fs';
import { parseMtd, serializeMtd } from './src/lib/mtd.ts';

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const origBuf = fs.readFileSync('resources/original/Mt_commandbar.mtd');
const icons = parseMtd(toArrayBuffer(origBuf));

// FORCE regex back temporarily
icons.forEach(i => i.name = i.name.replace(/[^A-Z0-9_.-]/g, "_"));

const origGeneratedBuf = serializeMtd(icons, "MT_CommandBar.tga", "EAW_81");
const origGeneratedBuffer = Buffer.from(origGeneratedBuf);

let diffs = 0;
for(let i=0; i<Math.max(origGeneratedBuffer.length, origBuf.length); i++) {
  if (origGeneratedBuffer[i] !== origBuf[i]) {
    diffs++;
  }
}
console.log(`With REGEX diffs = ${diffs}`);
