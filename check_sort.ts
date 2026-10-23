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
const buenoNames = getNames('resources/bueno/Mt_commandbar.mtd');

let isJsSorted = true;
// pure js
const jsSorted = [...buenoNames].sort();

for(let i=0; i<buenoNames.length; i++) {
  if (buenoNames[i] !== jsSorted[i]) {
     console.log(`Diff at ${i}: bueno="${buenoNames[i]}" vs jsSorted="${jsSorted[i]}"`);
     isJsSorted = false;
     break;
  }
}
console.log("Is bueno purely JS sorted?", isJsSorted);
