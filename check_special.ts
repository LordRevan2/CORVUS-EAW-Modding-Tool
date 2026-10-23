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
const origNames = getNames('resources/original/Mt_commandbar.mtd');

let specialCount = 0;
for(const n of origNames) {
   if (/[^A-Z0-9_.-]/.test(n)) {
       console.log(n);
       specialCount++;
   }
}
console.log("Total special:", specialCount);
