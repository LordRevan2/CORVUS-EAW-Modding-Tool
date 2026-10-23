const fs = require('fs');
const orig = fs.readFileSync('resources/Mt_commandbar.mtd');
console.log("Original byte length:", orig.byteLength);
console.log("Aligned to 4?", orig.byteLength % 4 === 0);
console.log("Aligned to 16?", orig.byteLength % 16 === 0);

const dt = new DataView(orig.buffer);
const iconCount = dt.getUint32(0, true);
const calculatedCountLength = 4 + iconCount * 81;
console.log("Calculated length:", calculatedCountLength);
console.log("Matches original?", orig.byteLength === calculatedCountLength);
