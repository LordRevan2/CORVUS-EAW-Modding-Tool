const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
const nameBytes = new Uint8Array(orig.buffer, 4, 64);
console.log(nameBytes);
