import fs from 'fs';
import { parseMtd, serializeMtd } from './src/lib/mtd.ts';

const buf = fs.readFileSync('resources/Mt_commandbar.mtd');
const icons = parseMtd(buf.buffer);

icons.push({
  id: "test",
  name: "I_BUTTON_TEST.TGA",
  x: 0, y: 0, width: 32, height: 32, alpha: true
});

const outBuf = serializeMtd(icons);
fs.writeFileSync('test-out.mtd', Buffer.from(outBuf));
