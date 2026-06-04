import React, { useEffect, useRef, useState } from 'react';
import { Planet, TradeRoute, AppSettings } from '../types';
import { ZoomIn, ZoomOut, BoxSelect, Image as ImageIcon, Upload, Trash2, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '../i18n';

interface GalaxyMapProps {
  planets: Planet[];
  tradeRoutes?: TradeRoute[];
  settings: AppSettings;
  selectedPlanet: Planet | null;
  onSelectPlanet: (p: Planet) => void;
  onUpdatePlanet: (p: Planet) => void;
}

export default function GalaxyMap({ planets, tradeRoutes, settings, selectedPlanet, onSelectPlanet, onUpdatePlanet }: GalaxyMapProps) {
  const t = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedPlanet, setDraggedPlanet] = useState<Planet | null>(null);
  
  const [baseBounds, setBaseBounds] = useState<{
    vbMinX: number; vbMinY: number; vbWidth: number; vbHeight: number; planetRadius: number;
  } | null>(null);
  const [transform, setTransform] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef<{ x: number, y: number } | null>(null);
  const firstPlanetRefId = useRef<string | null>(null);

  const [bgImage, setBgImage] = useState<{ url: string, width: number, height: number, x: number, y: number, opacity: number } | null>(null);
  const [isBgSettingsOpen, setIsBgSettingsOpen] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = baseBounds ? baseBounds.vbWidth * 1.5 : img.width;
        const h = w / ratio;
        setBgImage({ url, width: w, height: h, x: -(w / 2), y: -(h / 2), opacity: 0.3 });
        setIsBgSettingsOpen(true);
      };
      img.src = url;
    }
  };

  useEffect(() => {
    if (planets.length === 0) return;
    
    const currentFirstId = planets[0].id;
    if (!baseBounds || firstPlanetRefId.current !== currentFirstId) {
      firstPlanetRefId.current = currentFirstId;
      
      const xs = planets.map((p) => p.x);
      const ys = planets.map((p) => p.y);
      let minX = Math.min(...xs);
      let maxX = Math.max(...xs);
      let minY = Math.min(...ys);
      let maxY = Math.max(...ys);

      if (minX === maxX) { minX -= 100; maxX += 100; }
      if (minY === maxY) { minY -= 100; maxY += 100; }

      const width = maxX - minX;
      const height = maxY - minY;
      const padding = Math.max(width, height) * 0.15;
      const planetRadius = Math.max(width, height) * 0.008;

      setBaseBounds({
        vbMinX: minX - padding,
        vbMinY: -(maxY + padding),
        vbWidth: width + padding * 2,
        vbHeight: height + padding * 2,
        planetRadius
      });
      
      setTransform({ panX: 0, panY: 0, zoom: 1 });
    }
  }, [planets, baseBounds]);

  const handlePointerDown = (e: React.PointerEvent, planet: Planet) => {
    e.stopPropagation();
    
    onSelectPlanet(planet);
    setDraggedPlanet(planet);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerDownMap = (e: React.PointerEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'line') {
      setIsPanning(true);
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current || !baseBounds) return;

    if (draggedPlanet) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      
      let newX = svgP.x;
      let newY = settings.invertY ? svgP.y : -svgP.y;

      if (settings.snapToGrid && settings.gridSize > 0) {
          newX = Math.round(newX / settings.gridSize) * settings.gridSize;
          newY = Math.round(newY / settings.gridSize) * settings.gridSize;
      }

      newX = parseFloat(newX.toFixed(2));
      newY = parseFloat(newY.toFixed(2));

      const updated = { ...draggedPlanet, x: newX, y: newY };
      setDraggedPlanet(updated);
      onUpdatePlanet(updated);
    } else if (isPanning && lastPointerRef.current) {
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      
      const wRatio = (baseBounds.vbWidth / transform.zoom) / svgRef.current.clientWidth;
      const hRatio = (baseBounds.vbHeight / transform.zoom) / svgRef.current.clientHeight;

      setTransform(prev => ({
        ...prev,
        panX: prev.panX - dx * wRatio,
        panY: prev.panY - dy * hRatio
      }));

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedPlanet) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggedPlanet(null);
    }
    if (isPanning) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setIsPanning(false);
      lastPointerRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!svgRef.current || !baseBounds) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? transform.zoom * zoomFactor : transform.zoom / zoomFactor;
    const clampedZoom = Math.max(0.1, Math.min(newZoom, 50));
    
    if (clampedZoom === transform.zoom) return;

    const currentViewBoxWidth = baseBounds.vbWidth / transform.zoom;
    const currentViewBoxHeight = baseBounds.vbHeight / transform.zoom;
    const ratioX = (svgP.x - (baseBounds.vbMinX + transform.panX)) / currentViewBoxWidth;
    const ratioY = (svgP.y - (baseBounds.vbMinY + transform.panY)) / currentViewBoxHeight;

    const newViewBoxWidth = baseBounds.vbWidth / clampedZoom;
    const newViewBoxHeight = baseBounds.vbHeight / clampedZoom;

    const newPanX = svgP.x - ratioX * newViewBoxWidth - baseBounds.vbMinX;
    const newPanY = svgP.y - ratioY * newViewBoxHeight - baseBounds.vbMinY;

    setTransform({ zoom: clampedZoom, panX: newPanX, panY: newPanY });
  };

  const zoomToCenter = (zoomFactor: number) => {
    if (!baseBounds) return;
    const newZoom = Math.max(0.1, Math.min(transform.zoom * zoomFactor, 50));
    if (newZoom === transform.zoom) return;

    const currentViewBoxWidth = baseBounds.vbWidth / transform.zoom;
    const currentViewBoxHeight = baseBounds.vbHeight / transform.zoom;
    const centerX = baseBounds.vbMinX + transform.panX + currentViewBoxWidth / 2;
    const centerY = baseBounds.vbMinY + transform.panY + currentViewBoxHeight / 2;

    const newViewBoxWidth = baseBounds.vbWidth / newZoom;
    const newViewBoxHeight = baseBounds.vbHeight / newZoom;

    const newPanX = centerX - newViewBoxWidth / 2 - baseBounds.vbMinX;
    const newPanY = centerY - newViewBoxHeight / 2 - baseBounds.vbMinY;

    setTransform({ zoom: newZoom, panX: newPanX, panY: newPanY });
  };

  const getTerrainColor = (planet: Planet, isSelected: boolean) => {
    if (isSelected) return "fill-cyan-400";
    const terrainNode = planet.el.ownerDocument?.evaluate('Zoomed_Terrain_Index', planet.el, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
    const terrainIndex = terrainNode ? terrainNode.textContent : planet.el.querySelector('Zoomed_Terrain_Index')?.textContent;

    const idx = parseInt(terrainIndex || '-1', 10);
    switch (idx) {
        case 0: return "fill-emerald-600 hover:fill-emerald-400"; // Temperate
        case 1: return "fill-amber-600 hover:fill-amber-400"; // Desert
        case 2: return "fill-lime-700 hover:fill-lime-500"; // Swamp
        case 3: return "fill-orange-600 hover:fill-orange-400"; // Volcanic
        case 4: return "fill-sky-200 hover:fill-white"; // Arctic
        case 5: return "fill-green-700 hover:fill-green-500"; // Forest
        case 6: return "fill-slate-400 hover:fill-slate-300"; // Urban
        case 7: return "fill-stone-600 hover:fill-stone-400"; // Asteroid
        case 8: return "fill-transparent stroke-slate-500 hover:stroke-cyan-400"; // None / Empty
        case 9: return "fill-blue-600 hover:fill-blue-400"; // Aquatic
        case 10: return "fill-yellow-700 hover:fill-yellow-500"; // Rocky Desert
        case 11: return "fill-indigo-300 hover:fill-indigo-200 opacity-80"; // Gas Giant
        case 12: return "fill-emerald-800 hover:fill-emerald-600"; // Jungle
        default: return "fill-slate-600 hover:fill-cyan-200"; // Default
    }
  };

  if (planets.length === 0 || !baseBounds) {
    return (
      <section className="flex-1 flex flex-col relative bg-slate-950">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#22d3ee 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      </section>
    );
  }

  const { vbMinX, vbMinY, vbWidth, vbHeight, planetRadius } = baseBounds;
  const currentVbX = vbMinX + transform.panX;
  const currentVbY = vbMinY + transform.panY;
  const currentVbW = vbWidth / transform.zoom;
  const currentVbH = vbHeight / transform.zoom;

  return (
    <section className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#22d3ee 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="flex-1 relative overflow-hidden group">
        <div className="absolute top-4 left-4 pointer-events-none opacity-50 font-mono text-[10px] text-cyan-400 z-10 uppercase tracking-widest leading-relaxed">
          GALAXY MAP <br /> // DRAG TO MOVE // CLICK TO SELECT
        </div>
        
        <svg
          ref={svgRef}
          className={`w-full h-full touch-none relative z-10 ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          viewBox={`${currentVbX} ${currentVbY} ${currentVbW} ${currentVbH}`}
          onPointerDown={handlePointerDownMap}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {settings.showGrid && (
            <defs>
              <pattern id="galaxy-grid" width={settings.gridSize} height={settings.gridSize} patternUnits="userSpaceOnUse">
                <path d={`M ${settings.gridSize} 0 L 0 0 0 ${settings.gridSize}`} fill="none" stroke="#22d3ee" strokeWidth={planetRadius * 0.05} opacity="0.15" />
              </pattern>
            </defs>
          )}

          {settings.showGrid && (
            <>
              <rect x={vbMinX * 2} y={vbMinY * 2} width={vbWidth * 4} height={vbHeight * 4} fill="url(#galaxy-grid)" />
              <line x1="0" y1={vbMinY * 2} x2="0" y2={vbMinY * 2 + vbHeight * 4} stroke="#22d3ee" strokeWidth={planetRadius * 0.2} opacity={0.3} />
              <line x1={vbMinX * 2} y1="0" x2={vbMinX * 2 + vbWidth * 4} y2="0" stroke="#22d3ee" strokeWidth={planetRadius * 0.2} opacity={0.3} />
            </>
          )}

          {bgImage && (
            <image 
              href={bgImage.url} 
              x={bgImage.x} 
              y={bgImage.y} 
              width={bgImage.width} 
              height={bgImage.height} 
              opacity={bgImage.opacity}
              preserveAspectRatio="none"
              className="pointer-events-none"
            />
          )}

          {/* Galactic Center (0,0) */}
          <g transform={`translate(0, 0)`}>
            <circle r={planetRadius * 0.8} className="fill-red-500/50" />
            <line x1={-planetRadius * 3} y1="0" x2={planetRadius * 3} y2="0" stroke="#ef4444" strokeWidth={planetRadius * 0.2} opacity={0.6} />
            <line x1="0" y1={-planetRadius * 3} x2="0" y2={planetRadius * 3} stroke="#ef4444" strokeWidth={planetRadius * 0.2} opacity={0.6} />
            <text y={planetRadius * 2.5} textAnchor="middle" className="fill-red-500/70 font-mono pointer-events-none select-none" style={{ fontSize: `${planetRadius}px` }}>(0,0)</text>
          </g>

          {tradeRoutes && tradeRoutes.map(tr => {
            const planetA = planets.find(p => p.name.toUpperCase() === tr.pointA.toUpperCase());
            const planetB = planets.find(p => p.name.toUpperCase() === tr.pointB.toUpperCase());
            if (!planetA || !planetB) return null;
            
            return (
              <line 
                key={tr.id}
                x1={planetA.x}
                y1={settings.invertY ? planetA.y : -planetA.y}
                x2={planetB.x}
                y2={settings.invertY ? planetB.y : -planetB.y}
                className="stroke-amber-500/40 transition-opacity cursor-pointer z-10"
                strokeWidth={planetRadius * 0.8}
                strokeLinecap="round"
                opacity={1}
              />
            );
          })}

          {planets.map((p) => {
            const isDragged = draggedPlanet && draggedPlanet.id === p.id;
            const displayPlanet = isDragged ? draggedPlanet : p;
            const isSelected = selectedPlanet?.id === p.id;

            const scaleNode = displayPlanet.el.ownerDocument?.evaluate('Scale_Factor', displayPlanet.el, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
            const scaleText = scaleNode ? scaleNode.textContent : displayPlanet.el.querySelector('Scale_Factor')?.textContent;
            const scaleMult = parseFloat(scaleText || '1') || 1;
            const actualRadius = planetRadius * scaleMult;
            const renderY = settings.invertY ? displayPlanet.y : -displayPlanet.y;

             return (
              <g 
                key={p.id} 
                transform={`translate(${displayPlanet.x}, ${renderY})`}
                className="cursor-pointer transition-opacity"
                onPointerDown={(e) => handlePointerDown(e, p)}
              >
                {isSelected && (
                  <circle
                    r={actualRadius * 2.5}
                    className="fill-cyan-500/10 stroke-cyan-400 animate-pulse pointer-events-none"
                    strokeWidth={actualRadius * 0.2}
                  />
                )}
                <circle
                  r={actualRadius}
                  strokeWidth={actualRadius * 0.3}
                  className={getTerrainColor(displayPlanet, isSelected) + " transition-colors"}
                />
                <text
                  y={actualRadius + planetRadius * 2}
                  textAnchor="middle"
                  className={`font-bold tracking-widest select-none pointer-events-none transition-all uppercase ${
                    isSelected ? 'fill-cyan-400 opacity-100 italic' : 'fill-slate-500 opacity-70'
                  }`}
                  style={{ 
                    fontSize: `${planetRadius * 1.5}px`,
                    textShadow: isSelected ? '0 0 10px rgba(34,211,238,0.5)' : 'none'
                  }}
                >
                  {displayPlanet.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Toolbar Buttons Overlay */}
      <div className="absolute bottom-14 left-4 flex gap-2 z-20">
          <div className="bg-slate-900/90 border border-cyan-800/50 p-1 flex gap-1 rounded">
              <button 
                onClick={() => zoomToCenter(1.5)}
                className="w-8 h-8 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-400 transition-colors"
              >
                  <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => transform.zoom !== 1 || transform.panX !== 0 ? setTransform({ panX: 0, panY: 0, zoom: 1 }) : null}
                className="w-8 h-8 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                title="Reset View"
              >
                  <BoxSelect className="w-4 h-4" />
              </button>
              <button 
                onClick={() => zoomToCenter(1 / 1.5)}
                className="w-8 h-8 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                title="Zoom Out"
              >
                  <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-px bg-cyan-800/50 mx-1"></div>
              <button 
                onClick={() => isBgSettingsOpen ? setIsBgSettingsOpen(false) : (bgImage ? setIsBgSettingsOpen(true) : bgInputRef.current?.click())}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${bgImage ? 'text-amber-400 hover:bg-amber-500/20' : 'text-cyan-400 hover:bg-cyan-500/20'}`}
                title="Background Image"
              >
                  <ImageIcon className="w-4 h-4" />
              </button>
              <input type="file" ref={bgInputRef} onChange={handleBgUpload} accept="image/*" className="hidden" />
          </div>
      </div>

      {isBgSettingsOpen && bgImage && (
        <div className="absolute bottom-14 left-44 bg-slate-900 border border-slate-700 shadow-xl rounded-md p-4 w-64 z-30 font-mono text-cyan-100 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-1">
                <span className="text-[10px] tracking-widest uppercase font-bold text-slate-300 flex items-center gap-1"><SlidersHorizontal className="w-3 h-3"/> BG Config</span>
                <button onClick={() => { setBgImage(null); setIsBgSettingsOpen(false); }} className="text-red-400 hover:text-red-300 transition-colors" title="Remove Background">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="text-[9px] uppercase tracking-widest text-slate-500">Width</label>
                 <input type="number" step="any" value={Number(bgImage.width.toFixed(2))} onChange={(e) => {
                    let w = parseFloat(e.target.value);
                    if (isNaN(w)) return;
                    const ratio = bgImage.width / bgImage.height;
                    setBgImage({ ...bgImage, width: w, height: w / ratio });
                 }} className="w-16 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded p-1 text-xs outline-none text-right" />
               </div>
               <input type="range" min={baseBounds?.vbWidth ? baseBounds.vbWidth * 0.1 : 100} max={baseBounds?.vbWidth ? baseBounds.vbWidth * 5 : 5000} value={bgImage.width} onChange={(e) => {
                  const w = parseFloat(e.target.value);
                  const ratio = bgImage.width / bgImage.height;
                  setBgImage({ ...bgImage, width: w, height: w / ratio });
               }} className="w-full accent-cyan-500" />
            </div>

            <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="text-[9px] uppercase tracking-widest text-slate-500">X Offset</label>
                 <input type="number" step="any" value={Number(bgImage.x.toFixed(2))} onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (!isNaN(val)) setBgImage({ ...bgImage, x: val });
                 }} className="w-16 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded p-1 text-xs outline-none text-right" />
               </div>
               <input type="range" min={baseBounds ? -Math.abs(baseBounds.vbWidth * 2) : -2000} max={baseBounds ? Math.abs(baseBounds.vbWidth * 2) : 2000} value={bgImage.x} onChange={(e) => setBgImage({ ...bgImage, x: parseFloat(e.target.value) })} className="w-full accent-cyan-500" />
            </div>

            <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="text-[9px] uppercase tracking-widest text-slate-500">Y Offset</label>
                 <input type="number" step="any" value={Number(bgImage.y.toFixed(2))} onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (!isNaN(val)) setBgImage({ ...bgImage, y: val });
                 }} className="w-16 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded p-1 text-xs outline-none text-right" />
               </div>
               <input type="range" min={baseBounds ? -Math.abs(baseBounds.vbHeight * 2) : -2000} max={baseBounds ? Math.abs(baseBounds.vbHeight * 2) : 2000} value={bgImage.y} onChange={(e) => setBgImage({ ...bgImage, y: parseFloat(e.target.value) })} className="w-full accent-cyan-500" />
            </div>

            <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="text-[9px] uppercase tracking-widest text-slate-500">Opacity</label>
                 <input type="number" step="0.01" min="0" max="1" value={Number(bgImage.opacity.toFixed(2))} onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (!isNaN(val)) setBgImage({ ...bgImage, opacity: val });
                 }} className="w-16 bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded p-1 text-xs outline-none text-right" />
               </div>
               <input type="range" min="0.1" max="1" step="0.01" value={bgImage.opacity} onChange={(e) => setBgImage({ ...bgImage, opacity: parseFloat(e.target.value) })} className="w-full accent-emerald-500" />
            </div>
        </div>
      )}

      <div className="h-10 bg-slate-900/80 border-t border-cyan-800/50 px-6 flex items-center justify-between text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest z-10 shrink-0">
        <div className="flex gap-8">
            {selectedPlanet ? (
              <>
                <span>X_POS: <span className="text-cyan-100">{selectedPlanet.x.toFixed(2)}</span></span>
                <span>Y_POS: <span className="text-cyan-100">{selectedPlanet.y.toFixed(2)}</span></span>
                <span>Z_POS: <span className="text-cyan-100">{selectedPlanet.z.toFixed(2)}</span></span>
              </>
            ) : (
                <span>{t.planetEditor.noPlanetActive}</span>
            )}
        </div>
        <div className="flex gap-4 items-center">
            <span className="text-cyan-500/50 italic">STATUS: ONLINE</span>
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
