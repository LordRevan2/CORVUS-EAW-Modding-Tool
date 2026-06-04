import fs from 'fs';

const serializeMtdMock = (icons: any[]) => {
  const totalSize = 4 + icons.length * 81; // 4 bytes header + (64 bytes name + 4*4 bytes rect + 1 byte alpha) * count
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  
  view.setUint32(0, icons.length, true);
  
  let offset = 4;
  for (const icon of icons) {
    const nameBytes = new Uint8Array(64);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(icon.name);
    // our implementation:
    // nameBytes.set(encoded.slice(0, Math.min(63, encoded.length)));
    nameBytes.set(encoded.slice(0, Math.min(64, encoded.length)));
    
    new Uint8Array(buffer, offset, 64).set(nameBytes);
    offset += 64;
    
    view.setUint32(offset, icon.x, true);
    view.setUint32(offset + 4, icon.y, true);
    view.setUint32(offset + 8, icon.width, true);
    view.setUint32(offset + 12, icon.height, true);
    offset += 16;
    
    view.setUint8(offset, icon.alpha ? 1 : 0);
    offset += 1;
  }
  
  return buffer;
};

const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
// use DataView directly to slice the buffer for parsing
const origView = new DataView(orig.buffer, orig.byteOffset, orig.byteLength);
const count = origView.getUint32(0, true);

const icons: any[] = [];
const decoder = new TextDecoder('ascii');
let offset = 4;

for (let i = 0; i < count; i++) {
  const nameBytes = new Uint8Array(orig.buffer, orig.byteOffset + offset, 64);
  const firstNull = nameBytes.indexOf(0);
  const validBytes = firstNull !== -1 ? nameBytes.subarray(0, firstNull) : nameBytes;
  
  const name = decoder.decode(validBytes);
  offset += 64;
  
  const x = origView.getUint32(offset, true);
  const y = origView.getUint32(offset + 4, true);
  const width = origView.getUint32(offset + 8, true);
  const height = origView.getUint32(offset + 12, true);
  offset += 16;
  
  const alphaByte = origView.getUint8(offset);
  const alpha = alphaByte === 1;
  offset += 1;
  
  icons.push({
    name,
    x,
    y,
    width,
    height,
    alpha
  });
}

const newBuf = serializeMtdMock(icons);

let diffs = 0;
const newArr = new Uint8Array(newBuf);

// original length
console.log(`Original count: ${count}, New buffer size: ${newArr.length}, Original buffer size: ${orig.length}`);

for(let i = 0; i < orig.length; i++) {
  if (orig[i] !== newArr[i]) {
    diffs++;
    if (diffs < 20) {
      console.log(`Diff at offset ${i}: orig=${orig[i]} new=${newArr[i]}`);
    }
  }
}
console.log(`Total diffs: ${diffs}`);

fs.writeFileSync('new_test.mtd', Buffer.from(newBuf));
