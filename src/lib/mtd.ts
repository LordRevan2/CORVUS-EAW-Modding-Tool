export interface MtdIcon {
  id: string; // Internal editor UUID
  name: string; // The Icon Name (e.g., I_BUTTON_X_WING)
  x: number; // Left position in pixels
  y: number; // Top position in pixels
  width: number; // Width in pixels
  height: number; // Height in pixels
  alpha: boolean; // Has alpha / active flag, usually true
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

export function serializeMtd(icons: MtdIcon[], textureName: string = "MT_CommandBar.tga"): ArrayBuffer {
  // Ensure uniqueness
  const uniqueIcons = new Map<string, MtdIcon>();
  icons.forEach(i => {
    let name = (i.name || "").trim().toUpperCase();
    if (!name) name = "I_BUTTON_UNKNOWN_" + crypto.randomUUID().substring(0, 8);
    // Add extension if it lacks one (mostly they have .TGA)
    if (!name.includes(".")) name += ".TGA";
    uniqueIcons.set(name, { ...i, name });
  });
  
  // Sorted alphabetically
  const sortedIcons = Array.from(uniqueIcons.values()).sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  const encoder = new TextEncoder();
  const texBytes = encoder.encode(textureName);
  
  // Header: 12 bytes
  // Texture Name: 4 bytes (len) + texBytes.length + 1 (null byte)
  let totalSize = 12 + 4 + texBytes.length + 1;

  const iconNameBytesMap: Uint8Array[] = [];
  
  for (let i = 0; i < sortedIcons.length; i++) {
    const iconBytes = encoder.encode(sortedIcons[i].name);
    iconNameBytesMap.push(iconBytes);
    // name len (4) + nameBytes + 1 (null byte) + 4 floats (16)
    totalSize += 4 + iconBytes.length + 1 + 16;
  }
  
  const buffer = new ArrayBuffer(totalSize);
  const dt = new DataView(buffer);
  let offset = 0;
  
  // Magic
  new Uint8Array(buffer, offset, 4).set(encoder.encode("MTD ")); offset += 4;
  // Version
  dt.setUint32(offset, 2, true); offset += 4;
  // Count
  dt.setUint32(offset, sortedIcons.length, true); offset += 4;
  
  // Texture Name
  dt.setUint32(offset, texBytes.length + 1, true); offset += 4;
  new Uint8Array(buffer, offset, texBytes.length).set(texBytes); offset += texBytes.length;
  dt.setUint8(offset, 0); offset += 1; // null byte
  
  for (let i = 0; i < sortedIcons.length; i++) {
    const icon = sortedIcons[i];
    const nameBytes = iconNameBytesMap[i];
    
    // Name Length and string
    dt.setUint32(offset, nameBytes.length + 1, true); offset += 4;
    new Uint8Array(buffer, offset, nameBytes.length).set(nameBytes); offset += nameBytes.length;
    dt.setUint8(offset, 0); offset += 1; // null byte
    
    // X Left, Y Top, X Right, Y Bottom
    const xLeft = Math.min(icon.x, icon.x + icon.width);
    const xRight = Math.max(icon.x, icon.x + icon.width);
    const yTop = Math.min(icon.y, icon.y + icon.height);
    const yBottom = Math.max(icon.y, icon.y + icon.height);

    dt.setFloat32(offset, xLeft, true); offset += 4;
    dt.setFloat32(offset, yTop, true); offset += 4;
    dt.setFloat32(offset, xRight, true); offset += 4;
    dt.setFloat32(offset, yBottom, true); offset += 4;
  }
  
  return buffer;
}
