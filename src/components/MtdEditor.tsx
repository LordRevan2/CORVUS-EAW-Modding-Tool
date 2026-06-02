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

  const buffer = new ArrayBuffer(18 + width * height * 4);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Type: Uncompressed True-Color
  u8[2] = 2; 
  view.setUint16(12, width, true);
  view.setUint16(14, height, true);
  u8[16] = 32; // 32 bits per pixel
  u8[17] = 8; // 8 attribute bits (alpha), Bottom-Left origin (bit 5 = 0)

  let offset = 18;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      u8[offset++] = imgData[idx + 2]; // B
      u8[offset++] = imgData[idx + 1]; // G
      u8[offset++] = imgData[idx + 0]; // R
      u8[offset++] = imgData[idx + 3]; // A
    }
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
  const [icons, setIcons] = useState<MtdIcon[]>(initialIcons);
  const [selectedId, setSelectedId] = useState<string | null>(initialIcons.length > 0 ? initialIcons[0].id : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [textureSize, setTextureSize] = useState<{w: number, h: number} | null>(null);
  
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
            setTextureUrl(url);
            setTextureSize({ w: tga.header.width, h: tga.header.height });
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
          setTextureUrl(url);
          setTextureSize({ w: tga.header.width, h: tga.header.height });
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
    
    if (!textureUrl) {
      const getNextPowerOfTwo = (n: number) => {
         let p = 1;
         while (p < n) p *= 2;
         return p;
      };
      const finalW = getNextPowerOfTwo(w);
      const finalH = getNextPowerOfTwo(h);

      const canvas = document.createElement('canvas');
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.clearRect(0, 0, finalW, finalH);
         ctx.drawImage(img, 0, 0);
      }
      setTextureSize({ w: finalW, h: finalH });
      setTextureUrl(canvas.toDataURL('image/png'));
      
      const newIcon: MtdIcon = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        name, x: 0, y: 0, width: w, height: h, alpha: true
      };
      setIcons(prev => [newIcon, ...prev]);
      setSelectedId(newIcon.id);
      setSearchQuery('');
      setPendingUpload(null);
    } else {
      const atlasImg = new Image();
      atlasImg.onload = () => {
        let bestX = 0;
        let bestY = 0;
        let found = false;
        const atlasW = atlasImg.width;
        const atlasH = atlasImg.height;

        const points = [{x: 0, y: 0}];
        icons.forEach(i => {
          points.push({x: i.x + i.width, y: i.y});
          points.push({x: i.x, y: i.y + i.height});
        });
        
        // Sort points to prefer top-left
        points.sort((a,b) => a.y === b.y ? a.x - b.x : a.y - b.y);

        for (const p of points) {
          if (p.x + w <= atlasW && p.y + h <= atlasH) {
            let overlap = false;
            for (const i of icons) {
              if (p.x < i.x + i.width && p.x + w > i.x &&
                  p.y < i.y + i.height && p.y + h > i.y) {
                overlap = true;
                break;
              }
            }
            if (!overlap) {
              bestX = p.x;
              bestY = p.y;
              found = true;
              break;
            }
          }
        }

        let finalW = atlasW;
        let finalH = atlasH;

        if (!found) {
          const maxUsedY = icons.reduce((max, icon) => Math.max(max, icon.y + icon.height), 0);
          bestX = 0;
          bestY = maxUsedY;
          
          let targetH = maxUsedY + h;
          let targetW = Math.max(atlasW, w);
          
          // EAW Textures MUST be power of two
          const getNextPowerOfTwo = (n: number) => {
             let p = 1;
             while (p < n) p *= 2;
             return p;
          };
          
          finalH = getNextPowerOfTwo(Math.max(atlasH, targetH));
          finalW = getNextPowerOfTwo(Math.max(atlasW, targetW));
        }

        const canvas = document.createElement('canvas');
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill new background completely transparent to prevent artifact bugs in EAW tools
          ctx.clearRect(0, 0, finalW, finalH);
          ctx.drawImage(atlasImg, 0, 0);
          ctx.drawImage(img, bestX, bestY);
        }
        
        setTextureSize({ w: finalW, h: finalH });
        setTextureUrl(canvas.toDataURL('image/png'));
        
        const newIcon: MtdIcon = {
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          name, x: bestX, y: bestY, width: w, height: h, alpha: true
        };
        setIcons(prev => [newIcon, ...prev]);
        setSelectedId(newIcon.id);
        setSearchQuery('');
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
    setIcons(prev => prev.map(icon => icon.id === id ? { ...icon, ...updates } : icon));
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

  const saveMtd = () => {
    try {
      const buffer = serializeMtd(icons);
      const mtdBlob = new Blob([buffer], { type: 'application/octet-stream' });
      const mtdUrl = URL.createObjectURL(mtdBlob);
      
      const downloadFile = (url: string, name: string) => {
        if (fileDownloadAnchorRef.current) {
          fileDownloadAnchorRef.current.href = url;
          fileDownloadAnchorRef.current.download = name;
          fileDownloadAnchorRef.current.click();
          URL.revokeObjectURL(url);
        }
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
      
      {/* Editor Header */}
      <div className="h-14 bg-slate-900 border-b border-cyan-900/50 flex items-center justify-between px-4 shrink-0 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-cyan-100 font-bold uppercase tracking-widest text-sm flex items-center space-x-2">
              <span>{fileName}</span>
            </h2>
          </div>
          <div>
            <div className="flex items-center space-x-2">
               <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">{t.mtdEditor.title}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
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
            className="px-3 py-1.5 border border-purple-500/40 hover:bg-purple-900/20 text-purple-400 hover:text-purple-300 text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1.5 font-mono"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t.mtdEditor.loadTexture}</span>
          </button>

          <button
            onClick={saveMtd}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.mtdEditor.saveBtn}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 px-2 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>{t.mtdEditor.closeBtn}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Area - Table */}
        <div className="flex-1 bg-[#0b0f19] flex flex-col border-r border-slate-800">
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
              className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500/90 text-slate-50 rounded flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              <span>{t.mtdEditor.quickInsertTitle || 'Add Icon'}</span>
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
        <div className="w-[340px] bg-slate-950 flex flex-col z-20 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.2)]">
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
                    
                    const validSize = wPx > 0 && hPx > 0 && wPx < 2000 && hPx < 2000;
                    
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
