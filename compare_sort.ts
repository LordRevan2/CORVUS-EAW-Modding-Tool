import fs from 'fs';

function getNames(path) {
  const data = fs.readFileSync(path);
  const count = data.readUInt32LE(0);
  let names = [];
  for (let i = 0; i < count; i++) {
    const nameBytes = data.slice(4 + i*81, 4 + i*81 + 64);
    const nameStr = nameBytes.toString('ascii').split('\0')[0];
    names.push(nameStr);
  }
  return names;
}

const modNames = getNames('resources/modificado/Mt_commandbar.mtd');
const buenoNames = getNames('resources/bueno/Mt_commandbar.mtd');

let hasDiff = false;
for (let i = 0; i < modNames.length; i++) {
  if (modNames[i] !== buenoNames[i]) {
    console.log(`Diff at ${i}: mod = "${modNames[i]}"  vs bueno = "${buenoNames[i]}"`);
    hasDiff = true;
    break;
  }
}
