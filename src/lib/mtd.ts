export interface MtdIcon {
  id: string; // Internal editor UUID
  name: string; // The Icon Name (e.g., I_BUTTON_X_WING)
  x: number; // Left position in pixels
  y: number; // Top position in pixels
  width: number; // Width in pixels
  height: number; // Height in pixels
  alpha: boolean; // Has alpha / active flag, usually true
  imageData?: string;
}

export function parseMtd(buffer: ArrayBuffer): MtdIcon[] {
  if (!buffer || buffer.byteLength < 4) {
    return [];
  }

  const dt = new DataView(buffer);

  if (dt.byteLength >= 16) {
    const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
    if (magic === "MTD ") {
      // ALAMO FORMAT
      let offset = 4;
      const _version = dt.getUint32(offset, true);
      offset += 4;
      const rawCount = dt.getUint32(offset, true);
      offset += 4;

      const texNameLen = dt.getUint32(offset, true);
      offset += 4;
      if (texNameLen > buffer.byteLength - offset) {
        return [];
      }
      // Skip texture name
      offset += texNameLen;

      const maxPossible = Math.min(rawCount, Math.floor((buffer.byteLength - offset) / 20), 25000);
      const icons: MtdIcon[] = [];
      const textDecoder = new TextDecoder('ascii');

      for (let i = 0; i < maxPossible; i++) {
        if (offset + 4 > buffer.byteLength) break;
        const nameLen = dt.getUint32(offset, true);
        offset += 4;

        if (nameLen > 512 || offset + nameLen + 16 > buffer.byteLength) break;
        let iconName = textDecoder.decode(new Uint8Array(buffer, offset, nameLen));
        offset += nameLen;
        const nullPos = iconName.indexOf('\0');
        if (nullPos !== -1) iconName = iconName.slice(0, nullPos);

        const xLeftRaw = dt.getFloat32(offset, true);
        offset += 4;
        const yTopRaw = dt.getFloat32(offset, true);
        offset += 4;
        const xRightRaw = dt.getFloat32(offset, true);
        offset += 4;
        const yBottomRaw = dt.getFloat32(offset, true);
        offset += 4;

        const xLeft = Number.isFinite(xLeftRaw) ? Math.max(0, Math.round(xLeftRaw)) : 0;
        const yTop = Number.isFinite(yTopRaw) ? Math.max(0, Math.round(yTopRaw)) : 0;
        const xRight = Number.isFinite(xRightRaw) ? Math.max(xLeft, Math.round(xRightRaw)) : xLeft;
        const yBottom = Number.isFinite(yBottomRaw) ? Math.max(yTop, Math.round(yBottomRaw)) : yTop;

        icons.push({
          id: crypto.randomUUID?.() || `${Date.now()}-${i}-${Math.random()}`,
          name: iconName.trim().toUpperCase(),
          x: Math.min(xLeft, 16384),
          y: Math.min(yTop, 16384),
          width: Math.min(Math.max(0, xRight - xLeft), 16384),
          height: Math.min(Math.max(0, yBottom - yTop), 16384),
          alpha: true,
        });
      }
      return icons;
    }
  }

  // 81-BYTE FORMAT (Community / Standard EAW Editor)
  let offset = 0;
  const rawIconCount = dt.getUint32(offset, true);
  offset += 4;

  const maxRecordsInBuffer = Math.floor((buffer.byteLength - 4) / 81);
  const iconCount = Math.min(rawIconCount, maxRecordsInBuffer, 25000);

  const icons: MtdIcon[] = [];
  const textDecoder = new TextDecoder('ascii');

  for (let i = 0; i < iconCount; i++) {
    if (offset + 81 > buffer.byteLength) {
      break;
    }

    const nameBytes = new Uint8Array(buffer, offset, 64);
    offset += 64;

    let nameStr = textDecoder.decode(nameBytes);
    const nullIdx = nameStr.indexOf('\0');
    if (nullIdx !== -1) {
      nameStr = nameStr.substring(0, nullIdx);
    }

    const rawX = dt.getUint32(offset, true);
    offset += 4;
    const rawY = dt.getUint32(offset, true);
    offset += 4;
    const rawW = dt.getUint32(offset, true);
    offset += 4;
    const rawH = dt.getUint32(offset, true);
    offset += 4;

    const alphaByte = dt.getUint8(offset);
    offset += 1;

    // Guard against signed-to-unsigned wraparound (e.g., 0xFFFFFFFF)
    const x = rawX > 32768 ? 0 : rawX;
    const y = rawY > 32768 ? 0 : rawY;
    const width = rawW > 32768 ? 0 : rawW;
    const height = rawH > 32768 ? 0 : rawH;

    icons.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${i}-${Math.random()}`,
      name: nameStr.trim().toUpperCase(),
      x,
      y,
      width,
      height,
      alpha: alphaByte !== 0,
    });
  }

  return icons;
}

export function serializeMtd(icons: MtdIcon[], textureName: string = "MT_CommandBar.tga", format: 'EAW_81' | 'ALAMO' = 'EAW_81'): ArrayBuffer {
  // Ensure uniqueness
  const uniqueIcons = new Map<string, MtdIcon>();
  icons.forEach(i => {
    let name = (i.name || "").trim().toUpperCase();

    // Ensure we don't end up with completely empty names
    if (!name) name = "I_BUTTON_UNKNOWN_" + crypto.randomUUID().substring(0, 8);
    name = name.replace(/\.[^/.]+$/, "") + ".TGA";
    if (!name.endsWith(".TGA")) name += ".TGA";
    
    if (format === 'EAW_81' && name.length > 63) {
       name = name.substring(0, 63 - 4) + ".TGA";
    }
    
    uniqueIcons.set(name, { ...i, name });
  });
  
  // Sorted alphabetically
  const sortedIcons = Array.from(uniqueIcons.values()).sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  const encoder = new TextEncoder();
  
  if (format === 'ALAMO') {
     const texBytes = encoder.encode(textureName);
     let totalSize = 12 + 4 + texBytes.length + 1;

     const iconNameBytesMap: Uint8Array[] = [];
     for (let i = 0; i < sortedIcons.length; i++) {
        const iconBytes = encoder.encode(sortedIcons[i].name);
        iconNameBytesMap.push(iconBytes);
        totalSize += 4 + iconBytes.length + 1 + 16;
     }

     const buffer = new ArrayBuffer(totalSize);
     const dt = new DataView(buffer);
     let offset = 0;

     new Uint8Array(buffer, offset, 4).set(encoder.encode("MTD ")); offset += 4;
     dt.setUint32(offset, 2, true); offset += 4;
     dt.setUint32(offset, sortedIcons.length, true); offset += 4;

     dt.setUint32(offset, texBytes.length + 1, true); offset += 4;
     new Uint8Array(buffer, offset, texBytes.length).set(texBytes); offset += texBytes.length;
     dt.setUint8(offset, 0); offset += 1;

     for (let i = 0; i < sortedIcons.length; i++) {
        const icon = sortedIcons[i];
        const nameBytes = iconNameBytesMap[i];
        
        dt.setUint32(offset, nameBytes.length + 1, true); offset += 4;
        new Uint8Array(buffer, offset, nameBytes.length).set(nameBytes); offset += nameBytes.length;
        dt.setUint8(offset, 0); offset += 1;

        const xLeft = Math.max(0, icon.x);
        const xRight = Math.max(0, icon.x + icon.width);
        const yTop = Math.max(0, icon.y);
        const yBottom = Math.max(0, icon.y + icon.height);

        dt.setFloat32(offset, xLeft, true); offset += 4;
        dt.setFloat32(offset, yTop, true); offset += 4;
        dt.setFloat32(offset, xRight, true); offset += 4;
        dt.setFloat32(offset, yBottom, true); offset += 4;
     }
     return buffer;
  }
  
  // 81-BYTE EAW FORMAT
  // Count: 4 bytes
  // Each Icon: 81 bytes (64 byte name, 4 uint32s for X,Y,W,H, 1 byte Alpha)
  const totalSize = 4 + (sortedIcons.length * 81);
  const buffer = new ArrayBuffer(totalSize);
  const dt = new DataView(buffer);
  let offset = 0;
  
  // Count
  dt.setUint32(offset, sortedIcons.length, true); offset += 4;
  
  for (let i = 0; i < sortedIcons.length; i++) {
    const icon = sortedIcons[i];
    
    // 1. Name 64 bytes (null-terminated and padded)
    const nameBytes = encoder.encode(icon.name);
    const nameBuffer = new Uint8Array(buffer, offset, 64);
    // Copy bytes, ensuring we don't exceed 63 bytes to leave room for null terminator
    const copyLen = Math.min(nameBytes.length, 63);
    nameBuffer.set(nameBytes.slice(0, copyLen));
    offset += 64;
    
    const x = Math.max(0, Math.round(icon.x));
    const y = Math.max(0, Math.round(icon.y));
    const w = Math.max(0, Math.round(icon.width));
    const h = Math.max(0, Math.round(icon.height));
    
    dt.setUint32(offset, x, true); offset += 4;
    dt.setUint32(offset, y, true); offset += 4;
    dt.setUint32(offset, w, true); offset += 4;
    dt.setUint32(offset, h, true); offset += 4;
    
    const hasAlpha = icon.alpha !== false ? 1 : 0;
    dt.setUint8(offset, hasAlpha); offset += 1;
  }
  
  return buffer;
}
