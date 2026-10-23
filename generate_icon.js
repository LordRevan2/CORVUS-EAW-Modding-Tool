import sharp from 'sharp';
import fs from 'fs';

/**
 * Convierte un buffer RGB crudo (width x height x 3 bytes) en un archivo Windows BMP de 24 bits sin comprimir,
 * formato obligatorio para NSIS (electron-builder) en installerSidebar.bmp e installerHeader.bmp.
 */
function rawRgbToBmp24(rgbBuffer, width, height) {
  const rowStride = width * 3;
  const padding = (4 - (rowStride % 4)) % 4;
  const paddedRowSize = rowStride + padding;
  const pixelArraySize = paddedRowSize * height;
  const fileSize = 54 + pixelArraySize;

  const bmp = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  bmp.write('BM', 0, 2, 'ascii');
  bmp.writeUInt32LE(fileSize, 2);
  bmp.writeUInt32LE(0, 6);
  bmp.writeUInt32LE(54, 10);

  // BITMAPINFOHEADER (40 bytes)
  bmp.writeUInt32LE(40, 14);
  bmp.writeInt32LE(width, 18);
  bmp.writeInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(0, 30);
  bmp.writeUInt32LE(pixelArraySize, 34);
  bmp.writeInt32LE(2835, 38);
  bmp.writeInt32LE(2835, 42);
  bmp.writeUInt32LE(0, 46);
  bmp.writeUInt32LE(0, 50);

  // Filas bottom-up (RGB -> BGR)
  for (let y = 0; y < height; y++) {
    const srcRow = height - 1 - y;
    const dstRowOffset = 54 + y * paddedRowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcRow * width + x) * 3;
      const dstIdx = dstRowOffset + x * 3;
      bmp[dstIdx] = rgbBuffer[srcIdx + 2];     // B
      bmp[dstIdx + 1] = rgbBuffer[srcIdx + 1]; // G
      bmp[dstIdx + 2] = rgbBuffer[srcIdx];     // R
    }
  }

  return bmp;
}

/**
 * Construye un archivo .ICO multi-resolución (16, 32, 48, 64, 128, 256)
 */
async function buildMultiSizeIco(svgBuffer) {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    const buf = await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size, buffer: buf });
  }

  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  const icoHeader = Buffer.alloc(headerSize);

  icoHeader.writeUInt16LE(0, 0);     // Reserved
  icoHeader.writeUInt16LE(1, 2);     // Type: 1 = ICO
  icoHeader.writeUInt16LE(count, 4); // Number of images

  let currentOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const { size, buffer } = pngBuffers[i];
    const entryOffset = 6 + i * 16;
    icoHeader.writeUInt8(size === 256 ? 0 : size, entryOffset);
    icoHeader.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    icoHeader.writeUInt8(0, entryOffset + 2);
    icoHeader.writeUInt8(0, entryOffset + 3);
    icoHeader.writeUInt16LE(1, entryOffset + 4);
    icoHeader.writeUInt16LE(32, entryOffset + 6);
    icoHeader.writeUInt32LE(buffer.length, entryOffset + 8);
    icoHeader.writeUInt32LE(currentOffset, entryOffset + 12);
    currentOffset += buffer.length;
  }

  return Buffer.concat([icoHeader, ...pngBuffers.map((p) => p.buffer)]);
}

async function generateAssets() {
  const svgBuffer = fs.readFileSync('public/icon.svg');

  // 1. Generar public/icon.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icon.png');
  console.log('✔ public/icon.png generado (512x512)');

  // 2. Generar public/icon.ico multi-resolución (16..256px)
  const icoBuffer = await buildMultiSizeIco(svgBuffer);
  fs.writeFileSync('public/icon.ico', icoBuffer);
  console.log('✔ public/icon.ico multi-resolución generado (16, 32, 48, 64, 128, 256px)');

  // 3. Generar public/installerSidebar.bmp (164x314) para el instalador propio NSIS con el icono oficial de la UI
  const sidebarSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="164" height="314" viewBox="0 0 164 314">
    <defs>
      <linearGradient id="sbBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#07162c" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <radialGradient id="sbGlow" cx="50%" cy="32%" r="42%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.45" />
        <stop offset="65%" stop-color="#06b6d4" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Fondo táctico oscuro -->
    <rect width="164" height="314" fill="url(#sbBg)" />

    <!-- Rejilla táctica sutil -->
    <g stroke="#083344" stroke-width="1" opacity="0.5">
      <line x1="0" y1="30" x2="164" y2="30" />
      <line x1="0" y1="60" x2="164" y2="60" />
      <line x1="0" y1="90" x2="164" y2="90" />
      <line x1="0" y1="120" x2="164" y2="120" />
      <line x1="0" y1="150" x2="164" y2="150" />
      <line x1="0" y1="180" x2="164" y2="180" />
      <line x1="0" y1="210" x2="164" y2="210" />
      <line x1="0" y1="240" x2="164" y2="240" />
      <line x1="0" y1="270" x2="164" y2="270" />
      <line x1="27" y1="0" x2="27" y2="314" />
      <line x1="54" y1="0" x2="54" y2="314" />
      <line x1="82" y1="0" x2="82" y2="314" />
      <line x1="110" y1="0" x2="110" y2="314" />
      <line x1="137" y1="0" x2="137" y2="314" />
    </g>

    <!-- Borde lateral derecho luminoso -->
    <line x1="162" y1="0" x2="162" y2="314" stroke="#06b6d4" stroke-width="2" opacity="0.85" />
    <line x1="159" y1="20" x2="159" y2="294" stroke="#f59e0b" stroke-width="1" opacity="0.45" />

    <!-- Esquinas HUD superiores e inferiores -->
    <path d="M 10 18 L 10 10 L 26 10" fill="none" stroke="#06b6d4" stroke-width="2" />
    <path d="M 150 18 L 150 10 L 134 10" fill="none" stroke="#06b6d4" stroke-width="2" />
    <path d="M 10 296 L 10 304 L 26 304" fill="none" stroke="#f59e0b" stroke-width="2" />
    <path d="M 150 296 L 150 304 L 134 304" fill="none" stroke="#f59e0b" stroke-width="2" />

    <!-- Resplandor Cyan + Icono Oficial de la UI (Cuadrado Cyan + Rombo Oscuro) -->
    <circle cx="82" cy="96" r="64" fill="url(#sbGlow)" />
    <rect x="42" y="56" width="80" height="80" rx="8" fill="#06b6d4" />
    <rect
      x="60"
      y="74"
      width="44"
      height="44"
      rx="1"
      fill="none"
      stroke="#020617"
      stroke-width="5.5"
      stroke-linejoin="round"
      transform="rotate(45 82 96)"
    />

    <!-- Tipografía Táctica -->
    <text x="82" y="172" text-anchor="middle" fill="#ecfeff" font-family="Segoe UI, Arial, sans-serif" font-weight="900" font-size="18" font-style="italic" letter-spacing="3.5">CORVUS</text>
    <text x="82" y="188" text-anchor="middle" fill="#22d3ee" font-family="Consolas, monospace" font-weight="700" font-size="8.5" letter-spacing="1.2">// EAW MODDING TOOL</text>

    <!-- Separador Ámbar -->
    <line x1="30" y1="202" x2="134" y2="202" stroke="#f59e0b" stroke-width="1.5" opacity="0.8" />

    <!-- Módulos Incluidos -->
    <g font-family="Consolas, monospace" font-size="7.5" fill="#94a3b8">
      <text x="20" y="222" fill="#67e8f9">▸ GALAXY &amp; CAMPAIGNS</text>
      <text x="20" y="236">▸ XML / LUA IDE STUDIO</text>
      <text x="20" y="250">▸ MASTER TEXT (.DAT)</text>
      <text x="20" y="264">▸ COMMAND BAR (.MTD)</text>
    </g>

    <!-- Badge de sistema inferior -->
    <rect x="26" y="280" width="112" height="16" rx="2" fill="#082f49" stroke="#06b6d4" stroke-width="1" />
    <text x="82" y="291" text-anchor="middle" fill="#fde68a" font-family="Consolas, monospace" font-weight="700" font-size="7.5" letter-spacing="1">SETUP WIZARD // WIN64</text>
  </svg>`;

  const sidebarRaw = await sharp(Buffer.from(sidebarSvg))
    .resize(164, 314)
    .removeAlpha()
    .raw()
    .toBuffer();
  const sidebarBmp = rawRgbToBmp24(sidebarRaw, 164, 314);
  fs.writeFileSync('public/installerSidebar.bmp', sidebarBmp);
  console.log('✔ public/installerSidebar.bmp generado (164x314 24-bit BMP)');

  // 4. Generar public/installerHeader.bmp (150x57) para NSIS con el icono oficial de la UI
  const headerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="150" height="57" viewBox="0 0 150 57">
    <defs>
      <linearGradient id="hdBg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="70%" stop-color="#082038" />
        <stop offset="100%" stop-color="#041020" />
      </linearGradient>
    </defs>
    <rect width="150" height="57" fill="url(#hdBg)" />
    <line x1="0" y1="55" x2="150" y2="55" stroke="#06b6d4" stroke-width="2" />
    <line x1="0" y1="52" x2="95" y2="52" stroke="#f59e0b" stroke-width="1" opacity="0.7" />

    <!-- Texto táctico -->
    <text x="10" y="25" fill="#ecfeff" font-family="Segoe UI, Arial, sans-serif" font-weight="900" font-size="13" font-style="italic" letter-spacing="2">CORVUS</text>
    <text x="10" y="38" fill="#22d3ee" font-family="Consolas, monospace" font-weight="700" font-size="7.5" letter-spacing="0.8">// EAW MOD TOOL</text>

    <!-- Icono Oficial de la UI a la derecha -->
    <rect x="106" y="10" width="32" height="32" rx="3.5" fill="#06b6d4" />
    <rect
      x="113"
      y="17"
      width="18"
      height="18"
      rx="0.5"
      fill="none"
      stroke="#020617"
      stroke-width="2.5"
      stroke-linejoin="round"
      transform="rotate(45 122 26)"
    />
  </svg>`;

  const headerRaw = await sharp(Buffer.from(headerSvg))
    .resize(150, 57)
    .removeAlpha()
    .raw()
    .toBuffer();
  const headerBmp = rawRgbToBmp24(headerRaw, 150, 57);
  fs.writeFileSync('public/installerHeader.bmp', headerBmp);
  console.log('✔ public/installerHeader.bmp generado (150x57 24-bit BMP)');
}

generateAssets().catch(console.error);
