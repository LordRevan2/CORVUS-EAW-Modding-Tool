
interface Icon { x: number; y: number; w: number; h: number; }

function packIcon(icons: Icon[], reqW: number, reqH: number) {
  let texW = 0; let texH = 0;
  icons.forEach(i => {
    texW = Math.max(texW, i.x + i.w);
    texH = Math.max(texH, i.y + i.h);
  });
  
  const toPOT = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)));
  texW = Math.max(256, toPOT(texW));
  texH = Math.max(256, toPOT(texH));
  
  const grid = new Uint8Array(texW * texH);
  
  icons.forEach(i => {
    for (let y = i.y - 1; y < i.y + i.h + 1; y++) {
      if (y < 0 || y >= texH) continue;
      for (let x = i.x - 1; x < i.x + i.w + 1; x++) {
        if (x < 0 || x >= texW) continue;
        grid[y * texW + x] = 1;
      }
    }
  });

  for (let y = 0; y <= texH - reqH; y+=4) {
    for (let x = 0; x <= texW - reqW; x+=4) {
      let free = true;
      for (let dy = 0; dy < reqH; dy++) {
        let row = (y + dy) * texW;
        for (let dx = 0; dx < reqW; dx++) {
          if (grid[row + (x + dx)] === 1) {
            free = false;
            break;
          }
        }
        if (!free) break;
      }
      if (free) return { x, y };
    }
  }
  return { x: 0, y: texH };
}

let icons = [];
for(let i=0; i<2000; i++) {
  icons.push({x: Math.random()*2000, y: Math.random()*2000, w: 32, h: 32});
}
console.time("pack");
let res = packIcon(icons, 32, 32);
console.timeEnd("pack");
console.log(res);
