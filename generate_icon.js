import sharp from 'sharp';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const VERSION = pkg.version || '3.1.0';

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

  // 3. Generar public/installerSidebar.bmp (164x314) estilo HUD Táctico CORVUS + Badge Plateado con borde Dorado
  const sidebarSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="164" height="314" viewBox="0 0 164 314">
    <defs>
      <linearGradient id="sbBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#091526" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <radialGradient id="sbGlow" cx="50%" cy="28%" r="42%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.48" />
        <stop offset="65%" stop-color="#06b6d4" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="silverBadge" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="50%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
    </defs>

    <!-- Fondo táctico oscuro -->
    <rect width="164" height="314" fill="url(#sbBg)" />

    <!-- Rejilla táctica HUD -->
    <g stroke="#083344" stroke-width="1" opacity="0.45">
      <line x1="0" y1="26" x2="164" y2="26" />
      <line x1="0" y1="52" x2="164" y2="52" />
      <line x1="0" y1="78" x2="164" y2="78" />
      <line x1="0" y1="104" x2="164" y2="104" />
      <line x1="0" y1="130" x2="164" y2="130" />
      <line x1="0" y1="156" x2="164" y2="156" />
      <line x1="0" y1="182" x2="164" y2="182" />
      <line x1="0" y1="208" x2="164" y2="208" />
      <line x1="0" y1="234" x2="164" y2="234" />
      <line x1="0" y1="260" x2="164" y2="260" />
      <line x1="0" y1="286" x2="164" y2="286" />
      <line x1="27" y1="0" x2="27" y2="314" />
      <line x1="54" y1="0" x2="54" y2="314" />
      <line x1="82" y1="0" x2="82" y2="314" />
      <line x1="110" y1="0" x2="110" y2="314" />
      <line x1="137" y1="0" x2="137" y2="314" />
    </g>

    <!-- Barra superior de telemetría -->
    <rect x="10" y="8" width="144" height="12" rx="1" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
    <circle cx="17" cy="14" r="2.2" fill="#10b981" />
    <text x="24" y="16.5" fill="#64748b" font-family="Consolas, monospace" font-weight="700" font-size="6.5" letter-spacing="0.8">SYS // ALAMO ENGINE HUD</text>

    <!-- Borde lateral derecho luminoso -->
    <line x1="162" y1="0" x2="162" y2="314" stroke="#06b6d4" stroke-width="2" opacity="0.9" />
    <line x1="159" y1="24" x2="159" y2="290" stroke="#fbbf24" stroke-width="1" opacity="0.5" />

    <!-- Esquinas HUD superiores e inferiores -->
    <path d="M 10 34 L 10 25 L 24 25" fill="none" stroke="#06b6d4" stroke-width="1.8" />
    <path d="M 152 34 L 152 25 L 138 25" fill="none" stroke="#06b6d4" stroke-width="1.8" />
    <path d="M 10 296 L 10 305 L 24 305" fill="none" stroke="#fbbf24" stroke-width="1.8" />
    <path d="M 152 296 L 152 305 L 138 305" fill="none" stroke="#fbbf24" stroke-width="1.8" />

    <!-- Resplandor Cyan + Icono Oficial de la UI (Cuadrado Cyan + Rombo Oscuro) -->
    <circle cx="82" cy="76" r="54" fill="url(#sbGlow)" />
    <rect x="49" y="43" width="66" height="66" rx="7" fill="#06b6d4" />
    <rect
      x="64"
      y="58"
      width="36"
      height="36"
      rx="1"
      fill="none"
      stroke="#020617"
      stroke-width="4.8"
      stroke-linejoin="round"
      transform="rotate(45 82 76)"
    />

    <!-- Tipografía Táctica -->
    <text x="82" y="132" text-anchor="middle" fill="#f8fafc" font-family="Segoe UI, Arial, sans-serif" font-weight="900" font-size="17" font-style="italic" letter-spacing="3.5">CORVUS</text>
    <text x="82" y="145" text-anchor="middle" fill="#22d3ee" font-family="Consolas, monospace" font-weight="700" font-size="7.8" letter-spacing="1.1">// EAW MODDING TOOL</text>

    <!-- Badge Plateado con Borde Dorado (v3.1.0) -->
    <rect x="52" y="153" width="60" height="15" rx="2.5" fill="url(#silverBadge)" stroke="#fbbf24" stroke-width="1.4" />
    <text x="82" y="163.5" text-anchor="middle" fill="#020617" font-family="Consolas, monospace" font-weight="900" font-size="8.5" letter-spacing="1">v${VERSION}</text>

    <!-- Separador Ámbar / Cyan -->
    <line x1="22" y1="178" x2="142" y2="178" stroke="#0e7490" stroke-width="1" />
    <line x1="52" y1="178" x2="112" y2="178" stroke="#fbbf24" stroke-width="1.5" />

    <!-- Panel de Módulos Incluidos estilo Tarjetas UI -->
    <rect x="14" y="186" width="136" height="86" rx="2" fill="#091326" stroke="#1e293b" stroke-width="1" />
    <g font-family="Consolas, monospace" font-size="7" fill="#cbd5e1">
      <text x="21" y="200" fill="#22d3ee" font-weight="700">▸ GALAXY &amp; PLANETS v2.5</text>
      <text x="21" y="213" fill="#34d399" font-weight="700">▸ GALACTIC CONQUEST v3.1</text>
      <text x="21" y="226" fill="#34d399">▸ STORY &amp; UNITS BALANCER</text>
      <text x="21" y="239" fill="#c084fc">▸ .DAT / .MTD / .TXT HUD</text>
      <text x="21" y="252" fill="#facc15">▸ RAW XML &amp; LUA 5.0 IDE</text>
      <text x="21" y="265" fill="#94a3b8">▸ AUTO-UPDATER // EN-ES-FR</text>
    </g>

    <!-- Badge de sistema inferior -->
    <rect x="18" y="280" width="128" height="17" rx="2" fill="#082f49" stroke="#06b6d4" stroke-width="1" />
    <text x="82" y="291" text-anchor="middle" fill="#fde68a" font-family="Consolas, monospace" font-weight="700" font-size="7.2" letter-spacing="1">TACTICAL SETUP // WIN64</text>
  </svg>`;

  const sidebarRaw = await sharp(Buffer.from(sidebarSvg))
    .resize(164, 314)
    .removeAlpha()
    .raw()
    .toBuffer();
  const sidebarBmp = rawRgbToBmp24(sidebarRaw, 164, 314);
  fs.writeFileSync('public/installerSidebar.bmp', sidebarBmp);
  await sharp(Buffer.from(sidebarSvg)).resize(164, 314).png().toFile('public/installerSidebar.png');
  console.log('✔ public/installerSidebar.bmp (.png) generado (164x314 24-bit BMP)');

  // 4. Generar public/installerHeader.bmp (150x57) estilo HUD Táctico con Badge Plateado/Dorado
  const headerSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="150" height="57" viewBox="0 0 150 57">
    <defs>
      <linearGradient id="hdBg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="70%" stop-color="#091e36" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="hdSilver" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
    </defs>
    <rect width="150" height="57" fill="url(#hdBg)" />
    <g stroke="#083344" stroke-width="1" opacity="0.4">
      <line x1="0" y1="19" x2="150" y2="19" />
      <line x1="0" y1="38" x2="150" y2="38" />
      <line x1="50" y1="0" x2="50" y2="57" />
      <line x1="100" y1="0" x2="100" y2="57" />
    </g>
    <line x1="0" y1="55" x2="150" y2="55" stroke="#06b6d4" stroke-width="2" />
    <line x1="0" y1="52" x2="98" y2="52" stroke="#fbbf24" stroke-width="1" opacity="0.85" />

    <!-- Texto táctico + Badge Plateado/Dorado -->
    <text x="8" y="21" fill="#f8fafc" font-family="Segoe UI, Arial, sans-serif" font-weight="900" font-size="12" font-style="italic" letter-spacing="2">CORVUS</text>
    <rect x="65" y="11" width="34" height="12" rx="2" fill="url(#hdSilver)" stroke="#fbbf24" stroke-width="1" />
    <text x="82" y="19.5" text-anchor="middle" fill="#020617" font-family="Consolas, monospace" font-weight="900" font-size="6.8">v${VERSION}</text>
    <text x="8" y="34" fill="#22d3ee" font-family="Consolas, monospace" font-weight="700" font-size="7" letter-spacing="0.8">// EAW MODDING SUITE</text>
    <text x="8" y="45" fill="#94a3b8" font-family="Consolas, monospace" font-size="6" letter-spacing="0.6">SYS.INSTALLER // READY</text>

    <!-- Icono Oficial de la UI a la derecha -->
    <rect x="108" y="11" width="32" height="32" rx="3.5" fill="#06b6d4" />
    <rect
      x="115"
      y="18"
      width="18"
      height="18"
      rx="0.5"
      fill="none"
      stroke="#020617"
      stroke-width="2.5"
      stroke-linejoin="round"
      transform="rotate(45 124 27)"
    />
  </svg>`;

  const headerRaw = await sharp(Buffer.from(headerSvg))
    .resize(150, 57)
    .removeAlpha()
    .raw()
    .toBuffer();
  const headerBmp = rawRgbToBmp24(headerRaw, 150, 57);
  fs.writeFileSync('public/installerHeader.bmp', headerBmp);
  await sharp(Buffer.from(headerSvg)).resize(150, 57).png().toFile('public/installerHeader.png');
  console.log('✔ public/installerHeader.bmp (.png) generado (150x57 24-bit BMP)');
}

generateAssets().catch(console.error);
