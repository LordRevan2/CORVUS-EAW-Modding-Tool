import TGA from 'tga-js';
const tga = new TGA();
const buf = new Uint8Array(18); // minimal header
buf[2] = 2; // uncompressed rgb
buf[12] = 100; buf[13] = 0; // width 100
buf[14] = 100; buf[15] = 0; // height 100
buf[16] = 24; // 24 bpp
try {
  tga.load(buf);
  console.log("Width:", tga.width, "Height:", tga.height, "Header:", tga.header);
  console.log("Object:", tga);
} catch (e) {
  console.log("error", e.message);
}
