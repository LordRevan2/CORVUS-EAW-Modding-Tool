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
  let offset = 0;
  
  // EAW MTD starts with uint32 icon count
  const iconCount = dt.getUint32(offset, true);
  offset += 4;
  
  const icons: MtdIcon[] = [];
  const textDecoder = new TextDecoder('ascii');
  
  for (let i = 0; i < iconCount; i++) {
    // Safety check just in case it's malformed
    if (offset + 81 > buffer.byteLength) {
      console.warn("Malformed MTD at icon index " + i + " - offset: " + offset + ", buf: " + buffer.byteLength);
      break;
    }
    
    // Fixed length 64-byte null-padded string
    const nameBytes = new Uint8Array(buffer, offset, 64);
    offset += 64;
    
    // Decode and remove null terminators
    let nameStr = textDecoder.decode(nameBytes);
    const nullIdx = nameStr.indexOf('\0');
    if (nullIdx !== -1) {
      nameStr = nameStr.substring(0, nullIdx);
    }
    
    // Read 4 x uint32 for X, Y, Width, Height
    const x = dt.getUint32(offset, true); offset += 4;
    const y = dt.getUint32(offset, true); offset += 4;
    const width = dt.getUint32(offset, true); offset += 4;
    const height = dt.getUint32(offset, true); offset += 4;
    
    // Read 1 x uint8 for alpha / flag
    const alphaByte = dt.getUint8(offset); offset += 1;
    
    icons.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: nameStr.toUpperCase(),
      x, y, width, height,
      alpha: alphaByte !== 0
    });
  }
  
  return icons;
}

export function serializeMtd(icons: MtdIcon[]): ArrayBuffer {
  // Ensure uniqueness - EAW and community tools crash on duplicates due to binary search
  const uniqueIcons = new Map<string, MtdIcon>();
  icons.forEach(i => {
    uniqueIcons.set(i.name, i);
  });
  
  // EAW MTD requires icons to be strictly sorted by name (ASCII) because the engine/tools use binary search
  const sortedIcons = Array.from(uniqueIcons.values()).sort((a, b) => {
    let nameA = a.name.toUpperCase();
    let nameB = b.name.toUpperCase();
    if (!nameA.endsWith(".TGA")) nameA += ".TGA";
    if (!nameB.endsWith(".TGA")) nameB += ".TGA";
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  // calculate total size
  // 4 bytes count + 81 bytes per icon
  const totalSize = 4 + (sortedIcons.length * 81);
  
  const buffer = new ArrayBuffer(totalSize);
  const dt = new DataView(buffer);
  
  dt.setUint32(0, sortedIcons.length, true);
  let offset = 4;
  
  const encoder = new TextEncoder();
  
  for (let i = 0; i < sortedIcons.length; i++) {
    const icon = sortedIcons[i];
    
    // Ensure name is correct before saving
    let finalName = icon.name.toUpperCase();
    if (!finalName.endsWith(".TGA")) finalName += ".TGA";

    // Exact 64 byte padding
    const nameBytes = new Uint8Array(64);
    const encodedName = encoder.encode(finalName.substring(0, 63)); // Leave 1 null
    nameBytes.set(encodedName, 0);
    
    new Uint8Array(buffer, offset, 64).set(nameBytes);
    offset += 64;
    
    dt.setUint32(offset, Math.round(Math.max(0, icon.x)), true); offset += 4;
    dt.setUint32(offset, Math.round(Math.max(0, icon.y)), true); offset += 4;
    dt.setUint32(offset, Math.round(Math.max(0, icon.width)), true); offset += 4;
    dt.setUint32(offset, Math.round(Math.max(0, icon.height)), true); offset += 4;
    dt.setUint8(offset, icon.alpha ? 1 : 0); offset += 1;
  }
  
  return buffer;
}
