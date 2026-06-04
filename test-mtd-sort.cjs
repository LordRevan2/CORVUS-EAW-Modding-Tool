const fs = require('fs');

const path = 'resources/Mt_commandbar.mtd';
const data = fs.readFileSync(path);
const count = data.readUInt32LE(0);
let offset = 4;
let prevName = "";
for(let i=0; i<count; i++) {
  const nameBuffer = data.slice(offset, offset + 64);
  let name = '';
  for (let j = 0; j < 64; j++) {
    if (nameBuffer[j] === 0) break;
    name += String.fromCharCode(nameBuffer[j]);
  }
  offset += 64 + 17;
  if(name < prevName) {
    console.log("NOT SORTED:", prevName, "comes before", name);
  }
  prevName = name;
}
console.log("Check complete.");
