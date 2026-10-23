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
  const dt = new DataView(buffer);
  
  if (dt.byteLength >= 4) {
    const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
    if (magic === "MTD ") {
      // ALAMO FORMAT
      let offset = 4;
      const version = dt.getUint32(offset, true); offset += 4;
      const count = dt.getUint32(offset, true); offset += 4;
      
      const texNameLen = dt.getUint32(offset, true); offset += 4;
      // Skip texture name
      offset += texNameLen;
      
      const icons: MtdIcon[] = [];
      for (let i = 0; i < count; i++) {
        if (offset + 4 > buffer.byteLength) break;
        const nameLen = dt.getUint32(offset, true); offset += 4;
        
        if (offset + nameLen > buffer.byteLength) break;
        let iconName = new TextDecoder('ascii').decode(new Uint8Array(buffer, offset, nameLen));
        offset += nameLen;
        // remove null if present
        if (iconName.endsWith('\0')) iconName = iconName.slice(0, -1);
        
        const xLeft = dt.getFloat32(offset, true); offset += 4;
        const yTop = dt.getFloat32(offset, true); offset += 4;
        const xRight = dt.getFloat32(offset, true); offset += 4;
        const yBottom = dt.getFloat32(offset, true); offset += 4;
        
        icons.push({
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          name: iconName.toUpperCase(),
          x: xLeft,
          y: yTop,
          width: xRight - xLeft,
          height: yBottom - yTop,
          alpha: true
        });
      }
      return icons;
    }
  }

  // 81-BYTE FORMAT (Community Editor)
  let offset = 0;
  
  const iconCount = dt.getUint32(offset, true);
  offset += 4;
  
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
    
    const x = dt.getUint32(offset, true); offset += 4;
    const y = dt.getUint32(offset, true); offset += 4;
    const width = dt.getUint32(offset, true); offset += 4;
    const height = dt.getUint32(offset, true); offset += 4;
    
    const alphaByte = dt.getUint8(offset); offset += 1;
    
    icons.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: nameStr.toUpperCase(),
      x, 
      y, 
      width, 
      height,
      alpha: alphaByte !== 0
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
