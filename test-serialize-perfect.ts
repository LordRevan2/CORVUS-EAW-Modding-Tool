import fs from 'fs';
import { parseMtd, serializeMtd } from './src/lib/mtd.ts';

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const origBuf = fs.readFileSync('resources/original/Mt_commandbar.mtd');
const icons = parseMtd(toArrayBuffer(origBuf));

const buenoBuf = fs.readFileSync('resources/bueno/Mt_commandbar.mtd');
const buenoIcons = parseMtd(toArrayBuffer(buenoBuf));

const newIconFromBueno = buenoIcons.find(i => i.name === "I_BUTTON_CIS_DARK_ADEPT_ASAJJ_VENTRESS.TGA");

if (!newIconFromBueno) {
   console.log("Could not find new icon in bueno.");
   process.exit(1);
}

icons.push({
  ...newIconFromBueno, 
  id: "new_123"
});

const generatedBuf = serializeMtd(icons, "MT_CommandBar.tga", "EAW_81");
const generatedBuffer = Buffer.from(generatedBuf);

if (generatedBuffer.equals(buenoBuf)) {
   console.log("PERFECT MATCH! We accurately recreated the valid Bueno file byte-for-byte.");
} else {
   console.log("No perfect match. Length generated=", generatedBuffer.byteLength, "Bueno=", buenoBuf.byteLength);
   let diffs = 0;
   for(let i=0; i<Math.max(generatedBuffer.length, buenoBuf.length); i++) {
     if (generatedBuffer[i] !== buenoBuf[i]) {
       if (diffs < 10) console.log(`Difference at ${i}: gen=${generatedBuffer[i]} bueno=${buenoBuf[i]}`);
       diffs++;
     }
   }
   console.log(`Total diffs: ${diffs}`);
}
