var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/mtd.ts
var mtd_exports = {};
__export(mtd_exports, {
  parseMtd: () => parseMtd,
  serializeMtd: () => serializeMtd
});
module.exports = __toCommonJS(mtd_exports);
function parseMtd(buffer) {
  const dt = new DataView(buffer);
  if (dt.byteLength >= 4) {
    const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
    if (magic === "MTD ") {
      let offset2 = 4;
      const version = dt.getUint32(offset2, true);
      offset2 += 4;
      const count = dt.getUint32(offset2, true);
      offset2 += 4;
      const texNameLen = dt.getUint32(offset2, true);
      offset2 += 4;
      offset2 += texNameLen;
      const icons2 = [];
      for (let i = 0; i < count; i++) {
        if (offset2 + 4 > buffer.byteLength) break;
        const nameLen = dt.getUint32(offset2, true);
        offset2 += 4;
        if (offset2 + nameLen > buffer.byteLength) break;
        let iconName = new TextDecoder("ascii").decode(new Uint8Array(buffer, offset2, nameLen));
        offset2 += nameLen;
        if (iconName.endsWith("\0")) iconName = iconName.slice(0, -1);
        const xLeft = dt.getFloat32(offset2, true);
        offset2 += 4;
        const yTop = dt.getFloat32(offset2, true);
        offset2 += 4;
        const xRight = dt.getFloat32(offset2, true);
        offset2 += 4;
        const yBottom = dt.getFloat32(offset2, true);
        offset2 += 4;
        icons2.push({
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          name: iconName.toUpperCase(),
          x: xLeft,
          y: yTop,
          width: xRight - xLeft,
          height: yBottom - yTop,
          alpha: true
        });
      }
      return icons2;
    }
  }
  let offset = 0;
  const iconCount = dt.getUint32(offset, true);
  offset += 4;
  const icons = [];
  const textDecoder = new TextDecoder("ascii");
  for (let i = 0; i < iconCount; i++) {
    if (offset + 81 > buffer.byteLength) {
      break;
    }
    const nameBytes = new Uint8Array(buffer, offset, 64);
    offset += 64;
    let nameStr = textDecoder.decode(nameBytes);
    const nullIdx = nameStr.indexOf("\0");
    if (nullIdx !== -1) {
      nameStr = nameStr.substring(0, nullIdx);
    }
    const x = dt.getUint32(offset, true);
    offset += 4;
    const y = dt.getUint32(offset, true);
    offset += 4;
    const width = dt.getUint32(offset, true);
    offset += 4;
    const height = dt.getUint32(offset, true);
    offset += 4;
    const alphaByte = dt.getUint8(offset);
    offset += 1;
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
function serializeMtd(icons, textureName = "MT_CommandBar.tga", format = "EAW_81") {
  const uniqueIcons = /* @__PURE__ */ new Map();
  icons.forEach((i) => {
    let name = (i.name || "").trim().toUpperCase();
    if (!name) name = "I_BUTTON_UNKNOWN_" + crypto.randomUUID().substring(0, 8);
    name = name.replace(/\.[^/.]+$/, "") + ".TGA";
    if (!name.endsWith(".TGA")) name += ".TGA";
    if (format === "EAW_81" && name.length > 63) {
      name = name.substring(0, 63 - 4) + ".TGA";
    }
    uniqueIcons.set(name, { ...i, name });
  });
  const sortedIcons = Array.from(uniqueIcons.values()).sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  const encoder = new TextEncoder();
  if (format === "ALAMO") {
    const texBytes = encoder.encode(textureName);
    let totalSize2 = 12 + 4 + texBytes.length + 1;
    const iconNameBytesMap = [];
    for (let i = 0; i < sortedIcons.length; i++) {
      const iconBytes = encoder.encode(sortedIcons[i].name);
      iconNameBytesMap.push(iconBytes);
      totalSize2 += 4 + iconBytes.length + 1 + 16;
    }
    const buffer2 = new ArrayBuffer(totalSize2);
    const dt2 = new DataView(buffer2);
    let offset2 = 0;
    new Uint8Array(buffer2, offset2, 4).set(encoder.encode("MTD "));
    offset2 += 4;
    dt2.setUint32(offset2, 2, true);
    offset2 += 4;
    dt2.setUint32(offset2, sortedIcons.length, true);
    offset2 += 4;
    dt2.setUint32(offset2, texBytes.length + 1, true);
    offset2 += 4;
    new Uint8Array(buffer2, offset2, texBytes.length).set(texBytes);
    offset2 += texBytes.length;
    dt2.setUint8(offset2, 0);
    offset2 += 1;
    for (let i = 0; i < sortedIcons.length; i++) {
      const icon = sortedIcons[i];
      const nameBytes = iconNameBytesMap[i];
      dt2.setUint32(offset2, nameBytes.length + 1, true);
      offset2 += 4;
      new Uint8Array(buffer2, offset2, nameBytes.length).set(nameBytes);
      offset2 += nameBytes.length;
      dt2.setUint8(offset2, 0);
      offset2 += 1;
      const xLeft = Math.max(0, icon.x);
      const xRight = Math.max(0, icon.x + icon.width);
      const yTop = Math.max(0, icon.y);
      const yBottom = Math.max(0, icon.y + icon.height);
      dt2.setFloat32(offset2, xLeft, true);
      offset2 += 4;
      dt2.setFloat32(offset2, yTop, true);
      offset2 += 4;
      dt2.setFloat32(offset2, xRight, true);
      offset2 += 4;
      dt2.setFloat32(offset2, yBottom, true);
      offset2 += 4;
    }
    return buffer2;
  }
  const totalSize = 4 + sortedIcons.length * 81;
  const buffer = new ArrayBuffer(totalSize);
  const dt = new DataView(buffer);
  let offset = 0;
  dt.setUint32(offset, sortedIcons.length, true);
  offset += 4;
  for (let i = 0; i < sortedIcons.length; i++) {
    const icon = sortedIcons[i];
    const nameBytes = encoder.encode(icon.name);
    const nameBuffer = new Uint8Array(buffer, offset, 64);
    const copyLen = Math.min(nameBytes.length, 63);
    nameBuffer.set(nameBytes.slice(0, copyLen));
    offset += 64;
    const x = Math.max(0, Math.round(icon.x));
    const y = Math.max(0, Math.round(icon.y));
    const w = Math.max(0, Math.round(icon.width));
    const h = Math.max(0, Math.round(icon.height));
    dt.setUint32(offset, x, true);
    offset += 4;
    dt.setUint32(offset, y, true);
    offset += 4;
    dt.setUint32(offset, w, true);
    offset += 4;
    dt.setUint32(offset, h, true);
    offset += 4;
    const hasAlpha = icon.alpha !== false ? 1 : 0;
    dt.setUint8(offset, hasAlpha);
    offset += 1;
  }
  return buffer;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseMtd,
  serializeMtd
});
