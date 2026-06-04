const fs = require('fs');
const buf = fs.readFileSync('resources/Mt_commandbar.mtd');
console.log(buf.slice(0, 100));
