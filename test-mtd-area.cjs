const fs = require('fs');
const data = fs.readFileSync('resources/Mt_commandbar.mtd');
const count = data.readUInt32LE(0);
let offset = 4;
let area = 0;
for(let i=0; i<count; i++) {
  offset += 64;
  const x = data.readUInt32LE(offset); offset += 4;
  const y = data.readUInt32LE(offset); offset += 4;
  const w = data.readUInt32LE(offset); offset += 4;
  const h = data.readUInt32LE(offset); offset += 4;
  offset += 1;
  area += (w * h);
}
const total = 2048 * 2048;
console.log('Occupied area:', area);
console.log('Total area:', total);
console.log('Free fraction:', ((total - area)/total*100).toFixed(2) + '%');
