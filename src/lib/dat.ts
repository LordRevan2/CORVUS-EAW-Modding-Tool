export interface DatRecord {
  id: string; // Unique transient UUID for react keys
  key: string; // The localization key (e.g., TEXT_UNIT_X_WING_NAME)
  value: string; // The translated text
}

export interface ParsedDatResult {
  records: DatRecord[];
  format: 'indexed' | 'sequential_mult2' | 'sequential_mult1'; 
}

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
  }
  CRC32_TABLE[i] = crc >>> 0;
}

function getCrc32(str: string): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    // Petroglyph CRC computation truncates UTF-16 chars to 8-bit
    const charCode = str.charCodeAt(i) & 0xFF;
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ charCode) & 0xFF];
  }
  return (~crc) >>> 0;
}

function parseIndexedDat(buffer: ArrayBuffer): DatRecord[] {
  const view = new DataView(buffer);
  if (buffer.byteLength < 4) throw new Error("File too short");
  
  const numRecords = view.getUint32(0, true);
  if (numRecords > 200000) throw new Error(`Suspicious record count: ${numRecords}`);
  
  // Index table takes 12 bytes per record
  const indexTableSize = numRecords * 12;
  if (4 + indexTableSize > buffer.byteLength) {
    throw new Error("File too short to contain index table");
  }

  const indices: Array<{crc: number; valueLen: number; keyLen: number}> = [];
  let offset = 4;
  
  let totalValueBytes = 0;
  let totalKeyBytes = 0;
  
  for (let i = 0; i < numRecords; i++) {
    const crc = view.getUint32(offset, true);
    const valueLen = view.getUint32(offset + 4, true); // Chars
    const keyLen = view.getUint32(offset + 8, true);   // Bytes
    offset += 12;
    
    indices.push({ crc, valueLen, keyLen });
    totalValueBytes += valueLen * 2;
    totalKeyBytes += keyLen;
  }
  
  if (offset + totalValueBytes + totalKeyBytes > buffer.byteLength) {
    throw new Error("File too short to contain all string data declared in index");
  }
  
  // Read all values sequentially
  const values: string[] = [];
  for (let i = 0; i < numRecords; i++) {
    const { valueLen } = indices[i];
    const valByteLen = valueLen * 2;
    const valBytes = new Uint8Array(buffer, offset, valByteLen);
    const value = new TextDecoder("utf-16le").decode(valBytes).replace(/\0/g, '');
    values.push(value);
    offset += valByteLen;
  }
  
  // Read all keys sequentially
  const records: DatRecord[] = [];
  for (let i = 0; i < numRecords; i++) {
    const { keyLen } = indices[i];
    const keyBytes = new Uint8Array(buffer, offset, keyLen);
    const key = new TextDecoder("utf-8").decode(keyBytes).replace(/\0/g, '');
    offset += keyLen;
    
    records.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      key,
      value: values[i]
    });
  }
  
  return records;
}

function parseSequentialDat(buffer: ArrayBuffer, multiplier: number): DatRecord[] {
  const view = new DataView(buffer);
  const records: DatRecord[] = [];
  
  if (buffer.byteLength < 4) throw new Error("File too short");
  
  const numRecords = view.getUint32(0, true);
  if (numRecords > 200000) throw new Error(`Suspicious record count: ${numRecords}`);
  
  let offset = 4;
  for (let i = 0; i < numRecords; i++) {
    if (offset + 8 > buffer.byteLength) throw new Error("Unexpected end of file reading record header");
    
    const keyLen = view.getUint32(offset, true);
    const valLen = view.getUint32(offset + 4, true);
    offset += 8;
    
    if (keyLen === 0 || keyLen > 5000) throw new Error(`Invalid key length: ${keyLen}`);
    
    const keyBytes = new Uint8Array(buffer, offset, keyLen);
    const key = new TextDecoder("utf-8").decode(keyBytes).replace(/\0/g, '');
    offset += keyLen;
    
    const valByteLen = valLen * multiplier;
    if (offset + valByteLen > buffer.byteLength) throw new Error("Unexpected end of file reading value");
    const valBytes = new Uint8Array(buffer, offset, valByteLen);
    const value = new TextDecoder("utf-16le").decode(valBytes).replace(/\0/g, '');
    offset += valByteLen;
    
    records.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      key,
      value
    });
  }
  
  return records;
}

export function getHexDump(buffer: ArrayBuffer, length: number = 64): string {
  const bytes = new Uint8Array(buffer.slice(0, Math.min(length, buffer.byteLength)));
  let result = "";
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, "0")).join(" ");
    const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : ".").join("");
    result += `${i.toString(16).padStart(4, "0")}: ${hex.padEnd(48, " ")} | ${ascii}\n`;
  }
  return result;
}

export function parseDatFile(buffer: ArrayBuffer): ParsedDatResult {
  let errIndexed = "";
  try {
    const records = parseIndexedDat(buffer);
    return { records, format: 'indexed' };
  } catch (err: any) {
    errIndexed = err.message || String(err);
  }

  let errSeq2 = "";
  try {
    const records = parseSequentialDat(buffer, 2);
    return { records, format: 'sequential_mult2' };
  } catch (err: any) {
    errSeq2 = err.message || String(err);
  }

  let errSeq1 = "";
  try {
    const records = parseSequentialDat(buffer, 1);
    return { records, format: 'sequential_mult1' };
  } catch (err: any) {
    errSeq1 = err.message || String(err);
  }

  const hexDump = getHexDump(buffer, 64);
  throw new Error(
    `FAILED TO PARSE DAT FILE. IT MIGHT BE CORRUPTED OR RUN AN INCOMPATIBLE FORMAT.\n\n` +
    `File size: ${buffer.byteLength} bytes\n\n` +
    `First 64 bytes of file (Hex/ASCII):\n${hexDump}\n` +
    `Indexed format error: ${errIndexed}\n` +
    `Sequential (x2) error: ${errSeq2}\n` +
    `Sequential (x1) error: ${errSeq1}`
  );
}

export function serializeDatFile(records: DatRecord[], format: ParsedDatResult['format'] = 'indexed'): ArrayBuffer {
  // Always sort records by CRC32 to ensure compatibility with Empire at War game engine
  const sortedRecords = [...records].map(r => ({
    ...r,
    crc: getCrc32(r.key)
  })).sort((a, b) => a.crc - b.crc);

  const textEncoder = new TextEncoder();
  
  if (format === 'indexed') {
    let totalValueBytes = 0;
    let totalKeyBytes = 0;
    
    const encoded = sortedRecords.map(rec => {
      const keyBytes = textEncoder.encode(rec.key);
      const valLen = rec.value.length; // Chars
      const valByteLen = valLen * 2;
      
      totalValueBytes += valByteLen;
      totalKeyBytes += keyBytes.length;
      
      return { rec, keyBytes, valLen, valByteLen, crc: rec.crc };
    });
    
    const totalBytes = 4 + (encoded.length * 12) + totalValueBytes + totalKeyBytes;
    const buffer = new ArrayBuffer(totalBytes);
    const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);
    
    view.setUint32(0, encoded.length, true);
    let offset = 4;
    
    // Write index table
    for (const item of encoded) {
      view.setUint32(offset, item.crc, true);
      view.setUint32(offset + 4, item.valLen, true);
      view.setUint32(offset + 8, item.keyBytes.length, true);
      offset += 12;
    }
    
    // Write values
    for (const item of encoded) {
      for (let i = 0; i < item.rec.value.length; i++) {
        view.setUint16(offset, item.rec.value.charCodeAt(i), true);
        offset += 2;
      }
    }
    
    // Write keys
    for (const item of encoded) {
      uint8View.set(item.keyBytes, offset);
      offset += item.keyBytes.length;
    }
    
    return buffer;
  } else {
    // Sequential fallback format
    const multiplier = format === 'sequential_mult1' ? 1 : 2;
    
    let totalBytes = 4;
    const encoded = sortedRecords.map(item => {
      const keyBytes = textEncoder.encode(item.key);
      const valLen = item.value.length;
      const valHeaderValue = multiplier === 1 ? valLen * 2 : valLen;
      totalBytes += 8 + keyBytes.length + (valLen * 2);
      return { rec: item, keyBytes, valHeaderValue, valLen };
    });
    
    const buffer = new ArrayBuffer(totalBytes);
    const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);
    
    view.setUint32(0, encoded.length, true);
    let offset = 4;
    
    for (const item of encoded) {
      view.setUint32(offset, item.keyBytes.length, true);
      view.setUint32(offset + 4, item.valHeaderValue, true);
      offset += 8;
      
      uint8View.set(item.keyBytes, offset);
      offset += item.keyBytes.length;
      
      for (let i = 0; i < item.valLen; i++) {
        view.setUint16(offset, item.rec.value.charCodeAt(i), true);
        offset += 2;
      }
    }
    
    return buffer;
  }
}
