import fs from 'fs';
import { parseMtd } from './src/lib/mtd.ts';

const buf = fs.readFileSync('resources/Mt_commandbar.mtd');
const icons = parseMtd(buf.buffer);
let maxX = 0;
let maxY = 0;
for (const i of icons) {
  maxX = Math.max(maxX, i.x + i.width);
  maxY = Math.max(maxY, i.y + i.height);
}
console.log(`Max used coords: X=${maxX}, Y=${maxY}`);
