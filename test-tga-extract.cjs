const fs = require('fs');

const path = 'resources/Mt_commandbar.tga';
const file = fs.readFileSync(path);
const width = file.readUInt16LE(12);
const height = file.readUInt16LE(14);
const bpp = file[16];
const descriptor = file[17];
console.log('w:', width, 'h:', height, 'bpp:', bpp, 'desc:', descriptor);

// Let's assume 32-bpp uncompressed since I generated it? No, it's the original file.
const isBottomLeft = (descriptor & 32) === 0;

let fileOffset = 18; // assuming no palette or ID block

function getPixel(x, y) {
   let ty = y;
   let idx = fileOffset + (ty * width + x) * (bpp / 8);
   let b = file[idx];
   let g = file[idx+1];
   let r = file[idx+2];
   let a = file[idx+3];
   return {r,g,b,a};
}

// Icon 17 is at 906, 125, width=31, height=31. 
// Just check the center pixel:
const cx = 906 + 15;
const cy = 125 + 15;
console.log('Center pixel of icon 17:', getPixel(cx, cy));
console.log('Edge pixel of icon 17:', getPixel(906, 125));
