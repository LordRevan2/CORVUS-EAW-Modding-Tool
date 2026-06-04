const fs = require('fs');
const data = fs.readFileSync('resources/Mt_commandbar.tga');
// TGA header: 
// Byte 12: width (2 bytes)
// Byte 14: height (2 bytes)
const width = data.readUInt16LE(12);
const height = data.readUInt16LE(14);
const descriptor = data.readUInt8(17);
console.log('TGA width:', width, 'height:', height, 'descriptor:', descriptor);
