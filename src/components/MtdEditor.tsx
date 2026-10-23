import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  X, 
  Image as ImageIcon, 
  Search, 
  Plus,
  Trash2,
  ImageOff,
  Maximize
} from 'lucide-react';
import { MtdIcon, serializeMtd } from '../lib/mtd';
import { useTranslation } from '../i18n';
// @ts-ignore
import TGA from 'tga-js';

export function exportTGA(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx!.getImageData(0, 0, width, height).data;

  // 18 bytes for header, plus 26 bytes for TGA 2.0 footer
  const buffer = new ArrayBuffer(18 + (width * height * 4) + 26);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Type: Uncompressed True-Color
  u8[2] = 2; 
  view.setUint16(12, width, true);
  view.setUint16(14, height, true);
  u8[16] = 32; // 32 bits per pixel
  u8[17] = 40; // 8 alpha bits, Top-Left origin (bit 5 = 1) -> 32 + 8 = 40

  let offset = 18;
  // Write pixels top-to-bottom to match Top-Left origin
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = imgData[idx + 3];
      
      if (a === 0) {
        // Force black background on transparent pixels, standard EAW practice
        u8[offset++] = 0; // B
        u8[offset++] = 0; // G
        u8[offset++] = 0; // R
        u8[offset++] = 0; // A
      } else {
        u8[offset++] = imgData[idx + 2]; // B
        u8[offset++] = imgData[idx + 1]; // G
        u8[offset++] = imgData[idx + 0]; // R
        u8[offset++] = a; // A
      }
    }
  }

  // TGA 2.0 Signature Footer
  const signature = "TRUEVISION-XFILE.";
  for (let i = 0; i < signature.length; i++) {
    u8[offset + 8 + i] = signature.charCodeAt(i);
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

interface MtdEditorProps {
  initialIcons: MtdIcon[];
  fileName: string;
  initialTextureFile?: File | null;
  onClose: () => void;
  onError: (msg: string) => void;
}

export default function MtdEditor({ initialIcons, fileName, initialTextureFile, onClose, onError }: MtdEditorProps) {
  const t = useTranslation();
  
  const sortIcons = (iconsToSort: MtdIcon[]) => {
    return [...iconsToSort].sort((a,b) => {
      const nameA = (a.name || "").toUpperCase();
      const nameB = (b.name || "").toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  };

  const [icons, setIcons] = useState<MtdIcon[]>(sortIcons(initialIcons));
  const [selectedId, setSelectedId] = useState<string | null>(initialIcons.length > 0 ? initialIcons[0].id : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [textureSize, setTextureSize] = useState<{w: number, h: number} | null>(null);
  
  const [scale, setScale] = useState(1);

  // Handle initial texture load
  useEffect(() => {
    if (initialTextureFile) {
      const file = initialTextureFile;
      if (file.name.toLowerCase().endsWith('.tga')) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const tga = new TGA();
            tga.load(new Uint8Array(reader.result as ArrayBuffer));
            const url = tga.getDataURL('image/png');
            const img = new Image();
            img.onload = () => {
              setTextureSize({ w: img.width, h: img.height });
              setTextureUrl(url);
            };
            img.src = url;
          } catch (err: any) {
            onError("Error reading initial TGA: " + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setTextureSize({ w: img.width, h: img.height });
            setTextureUrl(e.target?.result as string);
          }
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }, [initialTextureFile, onError]);

  const [pendingUpload, setPendingUpload] = useState<{ img: HTMLImageElement, w: number, h: number } | null>(null);
  const [coordsEnabled, setCoordsEnabled] = useState(false);
  const [pendingIconName, setPendingIconName] = useState("");

  const textureInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const fileDownloadAnchorRef = useRef<HTMLAnchorElement>(null);
  
  const selectedIcon = icons.find(i => i.id === selectedId) || null;


  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.tga')) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const tga = new TGA();
          tga.load(new Uint8Array(reader.result as ArrayBuffer));
          const url = tga.getDataURL('image/png');
          const img = new Image();
          img.onload = () => {
             setTextureSize({ w: img.width, h: img.height });
             setTextureUrl(url);
          };
          img.src = url;
        } catch (err: any) {
          onError("Error reading TGA: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setTextureSize({ w: img.width, h: img.height });
          setTextureUrl(e.target?.result as string);
        }
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmIconUpload = () => {
    if (!pendingUpload) return;
    const { img, w, h } = pendingUpload;
    const name = pendingIconName;
    
    const getNextPowerOfTwo = (n: number) => {
       let p = 1;
       while (p < n) p *= 2;
       return p;
    };

    if (!textureUrl) {
      let maxW = w;
      let maxH = h;
      icons.forEach(i => {
         if (i.x + i.width > maxW) maxW = i.x + i.width;
         if (i.y + i.height > maxH) maxH = i.y + i.height;
      });

      let texW = getNextPowerOfTwo(maxW);
      let texH = getNextPowerOfTwo(maxH);
      
      const PADDING = 2; // ENFORCE padding to avoid MTD Editor "archive corrupt" bug
      let bestX = PADDING;
      let bestY = PADDING;
      let foundSpot = false;
      const stepX = 2; const stepY = 2;
      
      for (let y = PADDING; y <= texH - h - PADDING; y += stepY) {
         for (let x = PADDING; x <= texW - w - PADDING; x += stepX) {
            let overlap = false;
            for (let i = 0; i < icons.length; i++) {
               const ic = icons[i];
               if (x < ic.x + ic.width + PADDING && x + w + PADDING > ic.x && y < ic.y + ic.height + PADDING && y + h + PADDING > ic.y) {
                  overlap = true;
                  x = Math.max(x, ic.x + ic.width + PADDING - stepX);
                  break;
               }
            }
            if (!overlap) { bestX = x; bestY = y; foundSpot = true; break; }
         }
         if (foundSpot) break;
      }
      
      if (!foundSpot) {
          bestX = PADDING;
          bestY = texH + PADDING;
          texH = getNextPowerOfTwo(texH + h + PADDING * 2);
      }

      const canvas = document.createElement("canvas");
      canvas.width = texW;
      canvas.height = texH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
         ctx.clearRect(0, 0, texW, texH);
         ctx.drawImage(img, bestX, bestY); 
      }
      setTextureSize({ w: texW, h: texH });
      setTextureUrl(canvas.toDataURL("image/png"));
      
      let hasTransparency = false;
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = w; tmpCanvas.height = h;
      const tmpCtx = tmpCanvas.getContext("2d");
      if (tmpCtx) {
         tmpCtx.drawImage(img, 0, 0);
         const pxData = tmpCtx.getImageData(0, 0, w, h).data;
         for (let p = 3; p < pxData.length; p += 4) {
            if (pxData[p] < 255) { hasTransparency = true; break; }
         }
      }

      const newIcon: MtdIcon = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        name, x: bestX, y: bestY, width: w, height: h, alpha: hasTransparency, imageData: img.src
      };
      
      if (icons.some(i => i.name === newIcon.name)) {
        onError(`An icon named '${newIcon.name}' already exists.`);
        return;
      }

      setIcons(prev => sortIcons([...prev, newIcon]));
      setSelectedId(newIcon.id);
      setSearchQuery("");
      setPendingUpload(null);
    } else {
      const atlasImg = new Image();
      atlasImg.onload = () => {
        let atlasW = atlasImg.width;
        let atlasH = atlasImg.height;

        const PADDING = 2; // Enforce EAW padding
        let bestX = PADDING;
        let bestY = PADDING;
        let foundSpot = false;
        const stepX = 2; const stepY = 2;
        
        for (let y = PADDING; y <= atlasH - h - PADDING; y += stepY) {
           for (let x = PADDING; x <= atlasW - w - PADDING; x += stepX) {
              let overlap = false;
              for (let i = 0; i < icons.length; i++) {
                 const ic = icons[i];
                 if (x < ic.x + ic.width + PADDING && x + w + PADDING > ic.x && y < ic.y + ic.height + PADDING && y + h + PADDING > ic.y) {
                    overlap = true;
                    x = Math.max(x, ic.x + ic.width + PADDING - stepX);
                    break;
                 }
              }
              if (!overlap) { bestX = x; bestY = y; foundSpot = true; break; }
           }
           if (foundSpot) break;
        }

        if (!foundSpot) {
          bestX = PADDING;
          bestY = atlasH + PADDING;
          atlasH = getNextPowerOfTwo(atlasH + h + PADDING * 2);
        }

        const finalW = Math.max(atlasW, atlasW); // Not changing width for now
        const finalH = Math.max(atlasH, atlasH);

        const canvas = document.createElement("canvas");
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, finalW, finalH);
          ctx.drawImage(atlasImg, 0, 0);
          ctx.drawImage(img, bestX, bestY);
        }
        
        const newTextureUrl = canvas.toDataURL("image/png");
        setTextureUrl(newTextureUrl);
        setTextureSize({ w: finalW, h: finalH });
        
        let hasTransparency = false;
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = w; tmpCanvas.height = h;
        const tmpCtx = tmpCanvas.getContext("2d");
        if (tmpCtx) {
           tmpCtx.drawImage(img, 0, 0);
           const pxData = tmpCtx.getImageData(0, 0, w, h).data;
           for (let p = 3; p < pxData.length; p += 4) {
              if (pxData[p] < 255) { hasTransparency = true; break; }
           }
        }

        const newIcon: MtdIcon = {
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          name, x: bestX, y: bestY, width: w, height: h, alpha: hasTransparency, imageData: img.src
        };
        
        if (icons.some(i => i.name === newIcon.name)) {
          onError(`An icon named '${newIcon.name}' already exists.`);
          return;
        }

        setIcons(prev => sortIcons([...prev, newIcon]));
        setSelectedId(newIcon.id);
        setSearchQuery("");
        setPendingUpload(null);
      };
      atlasImg.src = textureUrl;
    }
  };


  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let name = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
        if (!name.startsWith("I_BUTTON_")) name = "I_BUTTON_" + name;
        if (!name.endsWith(".TGA")) name = name + ".TGA";
        
        setPendingIconName(name);
        setPendingUpload({ img, w: img.width, h: img.height });
      };
      img.src = src;
    };

    if (file.name.toLowerCase().endsWith('.tga')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const tga = new TGA();
          tga.load(new Uint8Array(ev.target?.result as ArrayBuffer));
          const dataUrl = tga.getDataURL('image/png');
          processImage(dataUrl);
        } catch (err: any) {
          onError("Could not decode TGA icon: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        processImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    if (iconInputRef.current) iconInputRef.current.value = '';
  };

  const filteredIcons = icons.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateIcon = () => {
    iconInputRef.current?.click();
  };

  const handleUpdate = (id: string, updates: Partial<MtdIcon>) => {
    if (updates.name !== undefined) {
      if (icons.some(i => i.name === updates.name && i.id !== id)) {
        onError(`An icon named '${updates.name}' already exists.`);
        return;
      }
    }
    setIcons(prev => {
      const next = prev.map(icon => icon.id === id ? { ...icon, ...updates } : icon);
      if (updates.name !== undefined) return sortIcons(next);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    const iconToDelete = icons.find(i => i.id === id);
    if (iconToDelete && textureUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = textureSize?.w || img.width;
        canvas.height = textureSize?.h || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          ctx.clearRect(iconToDelete.x, iconToDelete.y, iconToDelete.width, iconToDelete.height);
          setTextureUrl(canvas.toDataURL('image/png'));
        }
      };
      img.src = textureUrl;
    }
    setIcons(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const [exportFormat, setExportFormat] = useState<'EAW_81' | 'ALAMO'>('EAW_81');

  const saveMtd = () => {
    try {
      const invalidIcons = icons.filter(i => i.width === 0 || i.height === 0);
      if (invalidIcons.length > 0) {
         if (!window.confirm(`Warning: There are ${invalidIcons.length} icons with 0 width or height (e.g. ${invalidIcons[0].name}). They will be invisible in game. Do you wish to continue saving?`)) {
             return;
         }
      }
      
      if (textureSize) {
         const outOfBounds = icons.filter(i => 
             i.x < 0 || i.y < 0 || 
             (i.x + i.width) > textureSize.w || 
             (i.y + i.height) > textureSize.h
         );
         if (outOfBounds.length > 0) {
             if (!window.confirm(`Critical Warning: ${outOfBounds.length} icon(s) exceed the texture bounds (${textureSize.w}x${textureSize.h}). (e.g. ${outOfBounds[0].name}). This WILL crash the game engine. Continue anyway?`)) {
                 return;
             }
         }
      }
      
      const textureName = fileName.replace(/\.[^/.]+$/, "") + ".tga";
      const buffer = serializeMtd(icons, textureName, exportFormat);
      const mtdBlob = new Blob([buffer], { type: 'application/octet-stream' });
      const mtdUrl = URL.createObjectURL(mtdBlob);
      
      const downloadFile = (url: string, name: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      };

      downloadFile(mtdUrl, fileName.replace(/\.[^/.]+$/, "") + ".mtd");

      if (textureUrl) {
         setTimeout(() => {
           const img = new Image();
           img.onload = () => {
             const canvas = document.createElement('canvas');
             canvas.width = textureSize?.w || img.width;
             canvas.height = textureSize?.h || img.height;
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(img, 0, 0);
             const tgaBlob = exportTGA(canvas);
             const tgaUrl = URL.createObjectURL(tgaBlob);
             downloadFile(tgaUrl, fileName.replace(/\.[^/.]+$/, "") + ".tga");
           };
           img.src = textureUrl;
         }, 300);
      }
    } catch (err: any) {
      onError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 font-sans overflow-hidden relative">
      <a ref={fileDownloadAnchorRef} className="hidden" />
      
      {/* Editor Header — Unified Tactical HUD */}
      <div className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-amber-900/40 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <ImageIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold font-mono">{t.mtdEditor.title}</span>
              <span className="px-1.5 py-0.5 rounded-sm bg-amber-950/90 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                v1.1
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase">
                {icons.length} {t.mtdEditor.iconsCount} {textureSize ? `// ${textureSize.w}×${textureSize.h}` : ''}
              </span>
            </div>
            <h2 className="text-[11px] font-mono text-cyan-200/90 truncate max-w-md mt-0.5">{fileName}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <input 
            type="file" 
            ref={iconInputRef} 
            onChange={handleIconUpload}
            className="hidden"
            accept=".tga,.png,.jpg,.jpeg"
          />
          <input 
            type="file" 
            ref={textureInputRef} 
            onChange={handleTextureUpload}
            className="hidden"
            accept=".tga,.png,.jpg,.jpeg"
          />

          <button
            onClick={() => textureInputRef.current?.click()}
            className="px-3 py-1.5 border border-amber-500/40 hover:bg-amber-900/20 text-amber-300 hover:text-amber-200 text-[10px] font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 font-mono rounded-sm cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t.mtdEditor.loadTexture}</span>
          </button>
          
          <button
            onClick={saveMtd}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.mtdEditor.saveBtn}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={t.mtdEditor.closeBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Area - Table */}
        <div className="flex-1 bg-[#0b0f19] flex flex-col border-r border-slate-800 shrink-0">
          <div className="px-4 py-3 flex items-center justify-between shadow-sm bg-slate-950/40 border-b border-slate-800/80 shrink-0">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-[8px] w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={t.mtdEditor.searchPlaceholder || "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/70 py-1.5 pl-8 pr-2 rounded text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleCreateIcon}
              title={t.mtdEditor.quickInsertTitle || 'Add Icon'}
              className="p-1.5 bg-emerald-600/80 hover:bg-emerald-500/90 text-slate-50 rounded flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-12 text-center text-slate-500">#</th>
                  <th className="py-2.5 px-4 font-semibold">{t.mtdEditor.editor.idName || 'Icon Name'}</th>
                  <th className="py-2.5 px-4 font-semibold">X</th>
                  <th className="py-2.5 px-4 font-semibold">Y</th>
                  <th className="py-2.5 px-4 font-semibold">{t.mtdEditor.editor.width || 'Width'}</th>
                  <th className="py-2.5 px-4 font-semibold">{t.mtdEditor.editor.height || 'Height'}</th>
                  <th className="py-2.5 px-4 font-semibold w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredIcons.map((icon, idx) => {
                  const isSelected = selectedId === icon.id;
                  
                  return (
                    <tr 
                      key={icon.id}
                      onClick={() => setSelectedId(icon.id)}
                      className={`cursor-pointer hover:bg-slate-900/50 transition-colors group ${isSelected ? 'bg-cyan-900/20 shadow-[inset_2px_0_0_#06b6d4]' : ''}`}
                    >
                      <td className="py-2.5 px-4 text-center text-slate-600 font-mono text-[10px]">{idx + 1}</td>
                      <td className={`py-2.5 px-4 font-mono font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                        {icon.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{icon.x}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{icon.y}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{icon.width}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{icon.height}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(icon.id); }}
                          className={`p-1.5 rounded transition-all ${isSelected ? 'text-cyan-400 hover:bg-cyan-400/20 hover:text-cyan-300' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-slate-800'}`}
                          title={t.mtdEditor.list?.deleteTitle || 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredIcons.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                {t.mtdEditor.list.noResults || 'No icons found.'}
              </div>
            )}
          </div>
        </div>



        {/* Right Sidebar - Specific Icon Editor */}
        <div className="w-full md:w-[340px] lg:w-[400px] xl:w-[450px] bg-slate-950 flex flex-col z-20 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.2)] border-l border-slate-900">
          <div className="h-10 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 justify-between shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">
              {t.mtdEditor.editor?.iconProperties || 'Icon Properties'}
            </span>
          </div>

          {selectedIcon ? (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
              {/* Specific Icon VISUAL Preview */}
              <div className="h-48 border-b border-slate-800 bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:16px_16px] flex flex-col items-center justify-center p-4 relative shrink-0">
                {textureUrl ? (
                  (() => {
                    const wPx = selectedIcon.width;
                    const hPx = selectedIcon.height;
                    const xPx = selectedIcon.x;
                    const yPx = selectedIcon.y;
                    
                    const validSize = wPx > 0 && hPx > 0 && wPx <= 8192 && hPx <= 8192;
                    
                    return validSize ? (
                      <div 
                        className="shadow-2xl shadow-black ring-1 ring-cyan-500/50 max-w-[180px] max-h-[160px]"
                        style={{
                          width: `${wPx}px`,
                          height: `${hPx}px`,
                          backgroundImage: `url(${textureUrl})`,
                          backgroundPosition: `-${xPx}px -${yPx}px`,
                          backgroundSize: `${textureSize?.w}px ${textureSize?.h}px`,
                          backgroundRepeat: 'no-repeat',
                          imageRendering: 'pixelated',
                          transformOrigin: 'center center',
                          transform: wPx > 180 || hPx > 160 ? `scale(${Math.min(180/wPx, 160/hPx)})` : 'none'
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-red-400 font-mono">{t.mtdEditor.invalidDimensions || 'Invalid dimensions'}</span>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <ImageOff className="w-8 h-8 opacity-40 mb-2" />
                    <span className="text-[10px] font-mono text-slate-500 w-3/4 text-center">
                      {t.mtdEditor.loadTexturePreview || 'Load texture to preview graphic'}
                    </span>
                  </div>
                )}
              </div>

              {/* Form Editor */}
              <div className="p-4 space-y-5">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-cyan-500 font-bold font-mono mb-1.5">
                    {t.mtdEditor.editor.idName || 'Icon Name'}
                  </label>
                  <input 
                    type="text" 
                    value={selectedIcon.name}
                    onChange={(e) => handleUpdate(selectedIcon.id, { name: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded p-2 text-xs font-mono text-cyan-100 outline-none transition-colors shadow-inner"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">
                      {t.mtdEditor.editor.boundsInfo || 'Pixel Coordinates'}
                    </label>
                    <button onClick={() => setCoordsEnabled(!coordsEnabled)} className={`px-2 py-1 flex items-center space-x-1 border rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-colors ${coordsEnabled ? 'bg-cyan-900/60 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${coordsEnabled ? 'bg-cyan-400' : 'bg-slate-600'}`}/>
                      <span>{coordsEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 transition-opacity ${coordsEnabled ? '' : 'opacity-40 pointer-events-none grayscale'}`}>
                    {['x', 'y', 'width', 'height'].map((key) => {
                      //@ts-ignore
                      const val = selectedIcon[key];
                      
                      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        let num = parseInt(e.target.value, 10);
                        if (isNaN(num)) num = 0;
                        handleUpdate(selectedIcon.id, { [key]: num });
                      };

                      return (
                         <div key={key}>
                            <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">
                              {key}
                            </label>
                            <input 
                              type="number" 
                              step={1}
                              value={Math.round(val)}
                              onChange={handleChange}
                              className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded p-1.5 pl-2.5 text-xs font-mono text-slate-300 outline-none shadow-inner"
                            />
                         </div>
                      )
                    })}
                  </div>
                </div>

                {/* Expert UV Notice */}
                <div className="mt-6 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-sm">
                   <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-indigo-300 tracking-widest uppercase font-mono">{t.mtdEditor.expertUv || 'Expert: UV Coords'}</span>
                       <Maximize className="w-3.5 h-3.5 text-indigo-400" />
                   </div>
                   {textureSize ? (
                      <div className="grid grid-cols-2 gap-2 text-indigo-200/70 font-mono text-[9px]">
                         <div>U0:<br/><span className="text-indigo-100">{(selectedIcon.x / textureSize.w).toFixed(6)}</span></div>
                         <div>V0:<br/><span className="text-indigo-100">{(selectedIcon.y / textureSize.h).toFixed(6)}</span></div>
                         <div>U1:<br/><span className="text-indigo-100">{((selectedIcon.x + selectedIcon.width) / textureSize.w).toFixed(6)}</span></div>
                         <div>V1:<br/><span className="text-indigo-100">{((selectedIcon.y + selectedIcon.height) / textureSize.h).toFixed(6)}</span></div>
                      </div>
                   ) : (
                      <div className="text-[9px] text-indigo-300/50 leading-relaxed font-mono">
                         {t.mtdEditor.loadTextureAtlas || 'Load a texture atlas to view the calculated UV float mapping (0.0 - 1.0).'}
                      </div>
                   )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">{t.mtdEditor.noIconSelected || 'No Icon Selected'}</span>
              <div className="w-12 h-12 border-2 border-dashed border-slate-800 rounded mb-3"></div>
            </div>
          )}
        </div>
      </div>
      {/* Pending Upload Modal */}
      {pendingUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 font-sans backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 max-w-sm w-full relative">
            <button 
              onClick={() => setPendingUpload(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-slate-100 text-lg font-bold mb-4 font-mono tracking-widest uppercase">{t.mtdEditor.nameNewIcon || 'Name New Icon'}</h3>
            <div className="mb-6">
              <label className="block text-[10px] uppercase tracking-widest text-cyan-500 font-bold font-mono mb-2">
                {t.mtdEditor.editor.idName || 'Icon Name'}
              </label>
              <input 
                type="text" 
                value={pendingIconName}
                onChange={(e) => setPendingIconName(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded p-3 text-sm font-mono text-cyan-100 outline-none transition-colors shadow-inner uppercase"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmIconUpload();
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingUpload(null)}
                className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded font-mono text-[11px] uppercase tracking-wider font-semibold transition-colors"
              >
                {t.mtdEditor.cancelBtn || 'Cancel'}
              </button>
              <button
                onClick={confirmIconUpload}
                className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded font-mono text-[11px] uppercase tracking-wider font-semibold shadow-lg shadow-emerald-900/20 transition-all border border-emerald-400/30"
              >
                {t.mtdEditor.addIconBtn || 'Add Icon'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
