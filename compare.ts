import fs from 'fs';

function dumpMtd(path) {
  const data = fs.readFileSync(path);
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  
  // Try to determine format
  // ALAMO is "MTD "
  const sig = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (sig === "MTD ") {
    console.log(path, "is ALAMO format");
    return;
  }
  
  const count = dv.getUint32(0, true);
  console.log(`\n--- ${path}: ${count} icons ---`);
  
  if (count * 81 + 4 !== data.byteLength) {
    console.log(`WARNING: file size is ${data.byteLength}, expected ${count * 81 + 4}`);
  }
  
  let i = 0;
  // read just a couple of icons
  let firstIcon = Array.from(data.slice(4, 4 + 81));
  let lastIcon = Array.from(data.slice(4 + (count - 1) * 81, 4 + count * 81));
  
  return data;
}

const orig = dumpMtd('resources/original/Mt_commandbar.mtd');
const mod = dumpMtd('resources/modificado/Mt_commandbar.mtd');
const bueno = dumpMtd('resources/bueno/Mt_commandbar.mtd');

// Let's do a strict binary diff between Bueno and Modificado
if (mod && bueno) {
  let diffCount = 0;
  for(let i=0; i<Math.max(mod.byteLength, bueno.byteLength); i++) {
    const mb = mod[i] !== undefined ? mod[i] : -1;
    const bb = bueno[i] !== undefined ? bueno[i] : -1;
    if (mb !== bb) {
      if (diffCount < 20) {
        console.log(`Difference at byte ${i}: mod=${mb.toString(16)} bueno=${bb.toString(16)}`);
      }
      diffCount++;
    }
  }
  console.log(`Total bytes different: ${diffCount} / mod: ${mod.byteLength} bueno: ${bueno.byteLength}`);
}
