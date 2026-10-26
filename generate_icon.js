import sharp from 'sharp';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const VERSION = pkg.version || '4.0.0-beta';
const CODENAME = 'REVAN';

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
      <linearGradient id="revanPurpleBadge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b0764" />
        <stop offset="50%" stop-color="#6b21a8" />
        <stop offset="100%" stop-color="#2e1065" />
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

    <!-- Badge Morado con Borde Dorado (v4.0.0-beta // REVAN) -->
    <rect x="18" y="152" width="128" height="16" rx="2.5" fill="url(#revanPurpleBadge)" stroke="#fbbf24" stroke-width="1.4" />
    <text x="82" y="163" text-anchor="middle" fill="#f3e8ff" font-family="Consolas, monospace" font-weight="900" font-size="7.4" letter-spacing="0.6">v${VERSION} <tspan fill="#fde047">// ${CODENAME}</tspan></text>

    <!-- Separador Ámbar / Cyan -->
    <line x1="22" y1="178" x2="142" y2="178" stroke="#0e7490" stroke-width="1" />
    <line x1="52" y1="178" x2="112" y2="178" stroke="#fbbf24" stroke-width="1.5" />

    <!-- Panel de Módulos Incluidos estilo Tarjetas UI -->
    <rect x="14" y="186" width="136" height="86" rx="2" fill="#091326" stroke="#1e293b" stroke-width="1" />
    <g font-family="Consolas, monospace" font-size="7" fill="#cbd5e1">
      <text x="21" y="200" fill="#22d3ee" font-weight="700">▸ GALAXY v2.7 &amp; GC v3.3</text>
      <text x="21" y="213" fill="#34d399" font-weight="700">▸ STORY v2.2 &amp; TECH v1.0</text>
      <text x="21" y="226" fill="#fb7185" font-weight="700">▸ UNITS v1.4 &amp; HP v1.1</text>
      <text x="21" y="239" fill="#c084fc">▸ .DAT v1.3 / SFX v1.0</text>
      <text x="21" y="252" fill="#facc15">▸ XML v2.1 &amp; LUA 5.0 v2.2</text>
      <text x="21" y="265" fill="#94a3b8">▸ MOD VALIDATOR v1.0 // HUD</text>
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
      <linearGradient id="hdRevanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b0764" />
        <stop offset="50%" stop-color="#6b21a8" />
        <stop offset="100%" stop-color="#2e1065" />
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

    <!-- Texto táctico + Badge Morado/Dorado (Revan) -->
    <text x="7" y="19" fill="#f8fafc" font-family="Segoe UI, Arial, sans-serif" font-weight="900" font-size="11" font-style="italic" letter-spacing="1.6">CORVUS</text>
    <rect x="7" y="23" width="95" height="12" rx="2" fill="url(#hdRevanPurple)" stroke="#fbbf24" stroke-width="1" />
    <text x="54.5" y="31.2" text-anchor="middle" fill="#f3e8ff" font-family="Consolas, monospace" font-weight="900" font-size="5.8">v${VERSION} <tspan fill="#fde047">// ${CODENAME}</tspan></text>
    <text x="7" y="45" fill="#22d3ee" font-family="Consolas, monospace" font-weight="700" font-size="6.2" letter-spacing="0.6">EAW MODDING // READY</text>

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

  // 5. Asegurar carpeta build/ y generar build/installer.nsh + build/LICENSE.txt
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build', { recursive: true });
  }

  const nshContent = `; ============================================================================
; CORVUS // EAW MODDING TOOL - CUSTOM DARK TACTICAL HUD NSIS SCRIPT (v${VERSION})
; ============================================================================

!macro customHeader
  !ifdef MUI_BGCOLOR
    !undef MUI_BGCOLOR
  !endif
  !define MUI_BGCOLOR "020617"

  !ifdef MUI_TEXTCOLOR
    !undef MUI_TEXTCOLOR
  !endif
  !define MUI_TEXTCOLOR "E2E8F0"

  !ifdef MUI_LICENSEPAGE_BGCOLOR
    !undef MUI_LICENSEPAGE_BGCOLOR
  !endif
  !define MUI_LICENSEPAGE_BGCOLOR "0F172A"

  BrandingText "CORVUS // GALACTIC ENGINE v${VERSION} (${CODENAME}) - TACTICAL SETUP"
!macroend

!macro customInstall
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Version" "${VERSION}"
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Codename" "${CODENAME}"
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Engine" "Alamo-EAW-FoC"
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Theme" "Tactical-HUD-Dark"
!macroend

!macro customUnInstall
  DeleteRegKey SHCTX "Software\\CORVUS"
!macroend
`;
  fs.writeFileSync('build/installer.nsh', nshContent, 'utf8');
  console.log('✔ build/installer.nsh generado');

  const licenseContent = `\uFEFF================================================================================
   CORVUS // STAR WARS: EMPIRE AT WAR TACTICAL MODDING SUITE (v${VERSION} // ${CODENAME})
   PROTOCOLO DE LICENCIA Y USO PARA MODDERS // LICENSE & USAGE AGREEMENT
================================================================================

1. PROPÓSITO DE LA SUITE // SUITE PURPOSE
   CORVUS es una estación de trabajo e ingeniería de modding desarrollada para
   la comunidad de Star Wars: Empire at War y Forces of Corruption (Alamo Engine).

   CORVUS is a tactical modding workstation and engineering suite built for the
   Star Wars: Empire at War and Forces of Corruption modding community.

2. HERRAMIENTAS INCLUIDAS // INCLUDED WORKSTATION MODULES (v${VERSION} // ${CODENAME})
   * Editor de Galaxia, Planetas, Undo/Redo y Pathfinding A* (v2.7)
   * Editor de Conquista Galáctica, Undo/Redo y Economía por Facción (v3.3)
   * Editor de Eventos de Historia con Grafo Nodal 2D - Story_*.xml (v2.2)
   * Editor de Unidades + Simulador Duelo TTK 1v1 Versus (v1.4)
   * Editor de HardPoints, Conos de Disparo y Proyectiles XML + TTK (v1.1)
   * Arquitecto de Árbol Tecnológico y Facciones XML (v1.0)
   * Estudio de Audio y Efectos SFXEvents.xml (v1.0)
   * Compilador Binario de Traducciones .DAT UTF-16LE (v1.3)
   * Gestor de Atlas Mega-Texturas .MTD + UV (v1.3)
   * Editor de Diálogos y Simulador de Holo-Terminal .TXT (v1.1)
   * Editor de Código XML DOM (v2.1)
   * Entorno de Desarrollo LUA 5.0 con Auditor Semántico (v2.2)
   * Auditor Global de Integridad del Mod (v1.0)

3. LIBERTAD DE CREACIÓN // MODDER OWNERSHIP
   Todos los archivos XML, LUA, DAT, MTD y TXT generados o modificados con
   CORVUS pertenecen íntegramente al autor del mod. Sin restricciones de uso
   ni distribución en Steam Workshop, ModDB o repositorios comunitarios.

4. GARANTÍA Y RESPALDO // DISCLAIMER
   Este software se proporciona "TAL CUAL" ("AS IS"), sin garantías expresas o
   implícitas. Se recomienda mantener copias de seguridad (backups) de los
   archivos originales del juego antes de compilar cambios masivos.

================================================================================
   CORVUS GALACTIC ENGINE // PETROGLYPH ALAMO ENGINE MODDING WORKSTATION
================================================================================
`;
  fs.writeFileSync('build/LICENSE.txt', licenseContent, 'utf8');
  console.log('✔ build/LICENSE.txt generado');
}

generateAssets().catch(console.error);
