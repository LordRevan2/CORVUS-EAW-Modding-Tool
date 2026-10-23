const fs = require('fs');
const buf = fs.readFileSync('resources/Mt_commandbar.mtd');
const text = new TextDecoder('ascii').decode(buf.slice(0, 4));
console.log("First 4 bytes:", text);
console.log("As Uint32:", new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(0, true));
