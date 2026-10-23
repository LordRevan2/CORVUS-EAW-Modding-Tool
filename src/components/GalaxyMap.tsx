import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Planet, TradeRoute, AppSettings, Campaign } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  BoxSelect, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  SlidersHorizontal, 
  Layers, 
  Compass, 
  Sparkles,
  Plus,
  Ruler,
  Crosshair,
  RotateCcw,
  Shield,
  MousePointerClick,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslation, useLanguage, tr } from '../i18n';
import { fileToImageUrl, findGalaxyBackgroundImage } from '../lib/imageUtils';

interface GalaxyMapProps {
  planets: Planet[];
  tradeRoutes?: TradeRoute[];
  settings: AppSettings;
  selectedPlanet: Planet | null;
  onSelectPlanet: (p: Planet) => void;
  onUpdatePlanet: (p: Planet) => void;
  initialBgUrl?: string | null;
  workspaceFiles?: File[];
  onAddPlanet?: () => void;
  activeCampaign?: Campaign | null;
  isCampaignPreview?: boolean;
  onToggleCampaignPreview?: (enabled: boolean) => void;
  hideExcludedInPreview?: boolean;
  onToggleHideExcluded?: (hide: boolean) => void;
  mapClickTogglesCampaignPlanet?: boolean;
  onToggleCampaignPlanet?: (planetName: string) => void;
  onToggleMapClickMode?: (enabled: boolean) => void;
}

export default function GalaxyMap({ 
  planets, 
  tradeRoutes = [], 
  settings, 
  selectedPlanet, 
  onSelectPlanet, 
  onUpdatePlanet,
  initialBgUrl,
  workspaceFiles = [],
  onAddPlanet,
  activeCampaign = null,
  isCampaignPreview = true,
  onToggleCampaignPreview,
  hideExcludedInPreview = false,
  onToggleHideExcluded,
  mapClickTogglesCampaignPlanet = false,
  onToggleCampaignPlanet,
  onToggleMapClickMode
}: GalaxyMapProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedPlanet, setDraggedPlanet] = useState<Planet | null>(null);
  
  const [baseBounds, setBaseBounds] = useState<{
    vbMinX: number; vbMinY: number; vbWidth: number; vbHeight: number; planetRadius: number;
  }>({
    vbMinX: -650,
    vbMinY: -650,
    vbWidth: 1300,
    vbHeight: 1300,
    planetRadius: 8
  });

  const [transform, setTransform] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef<{ x: number, y: number } | null>(null);
  const prevPlanetsHashRef = useRef<string>('');

  // Galaxy background states
  const [bgImage, setBgImage] = useState<{ 
    url: string; 
    name?: string;
    width: number; 
    height: number; 
    x: number; 
    y: number; 
    opacity: number;
  } | null>(null);

  const [showDefaultBackdrop, setShowDefaultBackdrop] = useState<boolean>(true);
  const [showSectorLabels, setShowSectorLabels] = useState<boolean>(true);
  const [isBgSettingsOpen, setIsBgSettingsOpen] = useState(false);
  const [isAutoLoadingBg, setIsAutoLoadingBg] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // GALAXY VISUALIZATION SCALE & PRECISION TOOL STATES
  // ============================================================================
  const [isScaleSettingsOpen, setIsScaleSettingsOpen] = useState(false);
  const [galaxyScale, setGalaxyScale] = useState<number>(1.0);          // Scales vector galaxy backdrop & reference rings
  const [planetVisualScale, setPlanetVisualScale] = useState<number>(1.0); // Scales planet node radius & reticles
  const [routeVisualScale, setRouteVisualScale] = useState<number>(1.0);   // Scales trade route stroke width
  const [labelVisualScale, setLabelVisualScale] = useState<number>(1.0);   // Scales planet & sector label font sizes
  const [showPrecisionRuler, setShowPrecisionRuler] = useState<boolean>(true); // Distance/angle vector from selected planet
  const [showAlignmentGuides, setShowAlignmentGuides] = useState<boolean>(false); // X/Y laser crosshairs for exact alignment
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; svgX: number; svgY: number } | null>(null);

  // Apply unified preset for precision placement
  const applyScalePreset = (preset: 'micro' | 'fine' | 'standard' | 'macro') => {
    if (preset === 'micro') {
      setPlanetVisualScale(0.35);
      setRouteVisualScale(0.4);
      setLabelVisualScale(0.5);
      setShowAlignmentGuides(true);
    } else if (preset === 'fine') {
      setPlanetVisualScale(0.65);
      setRouteVisualScale(0.65);
      setLabelVisualScale(0.75);
    } else if (preset === 'standard') {
      setGalaxyScale(1.0);
      setPlanetVisualScale(1.0);
      setRouteVisualScale(1.0);
      setLabelVisualScale(1.0);
      setShowAlignmentGuides(false);
    } else if (preset === 'macro') {
      setPlanetVisualScale(1.6);
      setRouteVisualScale(1.5);
      setLabelVisualScale(1.35);
    }
  };

  // Load initialBgUrl if provided by parent
  useEffect(() => {
    if (initialBgUrl && !bgImage) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = baseBounds.vbWidth * 1.4;
        const h = w / ratio;
        setBgImage({
          url: initialBgUrl,
          name: 'Workspace Texture',
          width: w,
          height: h,
          x: -(w / 2),
          y: -(h / 2),
          opacity: 0.65
        });
      };
      img.src = initialBgUrl;
    }
  }, [initialBgUrl, baseBounds.vbWidth]);

  // Auto-detect galaxy background in workspaceFiles if none loaded
  useEffect(() => {
    if (!bgImage && workspaceFiles && workspaceFiles.length > 0 && !isAutoLoadingBg) {
      const detected = findGalaxyBackgroundImage(workspaceFiles);
      if (detected) {
        setIsAutoLoadingBg(true);
        fileToImageUrl(detected)
          .then((url) => {
            const img = new Image();
            img.onload = () => {
              const ratio = img.width / img.height;
              const w = baseBounds.vbWidth * 1.4;
              const h = w / ratio;
              setBgImage({
                url,
                name: detected.name,
                width: w,
                height: h,
                x: -(w / 2),
                y: -(h / 2),
                opacity: 0.65
              });
              setIsAutoLoadingBg(false);
            };
            img.onerror = () => setIsAutoLoadingBg(false);
            img.src = url;
          })
          .catch(() => setIsAutoLoadingBg(false));
      }
    }
  }, [workspaceFiles, bgImage, isAutoLoadingBg, baseBounds.vbWidth]);

  // Recalculate baseBounds whenever planets change
  useEffect(() => {
    const planetsHash = planets.map(p => `${p.id}:${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('|');
    if (planetsHash === prevPlanetsHashRef.current) return;
    prevPlanetsHashRef.current = planetsHash;

    if (planets.length === 0) {
      setBaseBounds({
        vbMinX: -650,
        vbMinY: -650,
        vbWidth: 1300,
        vbHeight: 1300,
        planetRadius: 8
      });
      return;
    }

    const xs = planets.map((p) => p.x);
    const ys = planets.map((p) => p.y);
    
    // Always encompass Galactic Center (0, 0)
    let minX = Math.min(-150, ...xs);
    let maxX = Math.max(150, ...xs);
    let minY = Math.min(-150, ...ys);
    let maxY = Math.max(150, ...ys);

    if (minX === maxX) { minX -= 300; maxX += 300; }
    if (minY === maxY) { minY -= 300; maxY += 300; }

    const width = Math.max(400, maxX - minX);
    const height = Math.max(400, maxY - minY);
    const padding = Math.max(width, height) * 0.16;
    const planetRadius = Math.max(6, Math.max(width, height) * 0.009);

    setBaseBounds({
      vbMinX: minX - padding,
      vbMinY: -(maxY + padding),
      vbWidth: width + padding * 2,
      vbHeight: height + padding * 2,
      planetRadius
    });
  }, [planets]);

  // Fast O(1) planet lookup map for trade routes rendering
  const planetMap = useMemo(() => {
    const map = new Map<string, Planet>();
    planets.forEach(p => {
      map.set(p.name.toUpperCase(), p);
    });
    return map;
  }, [planets]);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await fileToImageUrl(file);
      const img = new Image();
      img.onload = () => {
        const ratio = (img.width || 1) / (img.height || 1);
        const w = baseBounds.vbWidth * 1.35 * galaxyScale;
        const h = w / ratio;
        setBgImage({
          url,
          name: file.name,
          width: w,
          height: h,
          x: -(w / 2),
          y: -(h / 2),
          opacity: 0.65
        });
        setIsBgSettingsOpen(true);
      };
      img.src = url;
    } catch (err) {
      console.error('Failed to load galaxy background image:', err);
    } finally {
      if (bgInputRef.current) bgInputRef.current.value = '';
    }
  };

  const fitBgToView = useCallback(() => {
    if (!bgImage) return;
    const ratio = (bgImage.width || 1) / (bgImage.height || 1);
    const w = baseBounds.vbWidth * 1.3 * galaxyScale;
    const h = w / ratio;
    setBgImage({
      ...bgImage,
      width: w,
      height: h,
      x: -(w / 2),
      y: -(h / 2)
    });
  }, [bgImage, baseBounds.vbWidth, galaxyScale]);

  const handlePointerDown = (e: React.PointerEvent, planet: Planet) => {
    e.stopPropagation();
    onSelectPlanet(planet);
    if (activeCampaign && mapClickTogglesCampaignPlanet && onToggleCampaignPlanet) {
      onToggleCampaignPlanet(planet.name);
      return;
    }
    setDraggedPlanet(planet);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerDownMap = (e: React.PointerEvent) => {
    const target = e.target as Element;
    if (target === svgRef.current || target.tagName === 'line' || target.tagName === 'rect' || target.tagName === 'path' || target.tagName === 'circle') {
      setIsPanning(true);
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const svgP = pt.matrixTransform(ctm.inverse());
      const galX = parseFloat(svgP.x.toFixed(2));
      const galY = parseFloat((settings.invertY ? svgP.y : -svgP.y).toFixed(2));
      setCursorCoords({ x: galX, y: galY, svgX: svgP.x, svgY: svgP.y });

      if (draggedPlanet) {
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
        return;
      }
    }

    if (isPanning && lastPointerRef.current && svgRef.current) {
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
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
      setDraggedPlanet(null);
    }
    if (isPanning) {
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
      setIsPanning(false);
      lastPointerRef.current = null;
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    handlePointerUp(e);
    setCursorCoords(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const zoomFactor = 1.15;
    const newZoom = e.deltaY < 0 ? transform.zoom * zoomFactor : transform.zoom / zoomFactor;
    const clampedZoom = Math.max(0.05, Math.min(newZoom, 80));
    
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
    const newZoom = Math.max(0.05, Math.min(transform.zoom * zoomFactor, 80));
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
    const terrainNode = planet.el.getElementsByTagName('Zoomed_Terrain_Index')[0];
    const terrainIndex = terrainNode ? terrainNode.textContent : null;

    const idx = parseInt(terrainIndex || '-1', 10);
    switch (idx) {
        case 0: return "fill-emerald-500 hover:fill-emerald-300"; // Temperate
        case 1: return "fill-amber-500 hover:fill-amber-300"; // Desert
        case 2: return "fill-lime-600 hover:fill-lime-400"; // Swamp
        case 3: return "fill-orange-600 hover:fill-orange-400"; // Volcanic
        case 4: return "fill-sky-200 hover:fill-white"; // Arctic
        case 5: return "fill-green-600 hover:fill-green-400"; // Forest
        case 6: return "fill-slate-300 hover:fill-white"; // Urban
        case 7: return "fill-stone-500 hover:fill-stone-300"; // Asteroid
        case 8: return "fill-transparent stroke-slate-500 hover:stroke-cyan-400"; // None / Empty
        case 9: return "fill-blue-500 hover:fill-blue-300"; // Aquatic
        case 10: return "fill-yellow-600 hover:fill-yellow-400"; // Rocky Desert
        case 11: return "fill-indigo-300 hover:fill-indigo-100 opacity-90"; // Gas Giant
        case 12: return "fill-emerald-700 hover:fill-emerald-500"; // Jungle
        default: return "fill-cyan-500 hover:fill-cyan-300"; // Default
    }
  };

  const { vbMinX, vbMinY, vbWidth, vbHeight, planetRadius } = baseBounds;
  const currentVbX = vbMinX + transform.panX;
  const currentVbY = vbMinY + transform.panY;
  const currentVbW = vbWidth / transform.zoom;
  const currentVbH = vbHeight / transform.zoom;

  // Effective scaled visual metrics
  const effectivePlanetRadius = planetRadius * planetVisualScale;
  const effectiveRouteStroke = planetRadius * 0.72 * routeVisualScale;
  const effectiveLabelSize = planetRadius * 1.15 * labelVisualScale;

  // Star Wars Galactic Regions radii (scaled by galaxyScale)
  const galacticRings = [
    { name: 'Deep Core', radius: 70, color: '#f59e0b', opacity: 0.35 },
    { name: 'Core Worlds', radius: 170, color: '#38bdf8', opacity: 0.28 },
    { name: 'Colonies', radius: 280, color: '#06b6d4', opacity: 0.22 },
    { name: 'Inner Rim', radius: 400, color: '#818cf8', opacity: 0.20 },
    { name: 'Expansion Region', radius: 520, color: '#a855f7', opacity: 0.18 },
    { name: 'Mid Rim', radius: 680, color: '#0ea5e9', opacity: 0.16 },
    { name: 'Outer Rim', radius: 860, color: '#64748b', opacity: 0.15 },
    { name: 'Wild Space / Unknown Regions', radius: 1050, color: '#475569', opacity: 0.12 }
  ];

  // Calculate precision ruler metrics between selectedPlanet and cursorCoords
  const precisionMeasurement = useMemo(() => {
    if (!showPrecisionRuler || !selectedPlanet || !cursorCoords) return null;
    const activePlanet = draggedPlanet && draggedPlanet.id === selectedPlanet.id ? draggedPlanet : selectedPlanet;
    const dx = cursorCoords.x - activePlanet.x;
    const dy = cursorCoords.y - activePlanet.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return null;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const pSvgY = settings.invertY ? activePlanet.y : -activePlanet.y;
    return {
      x1: activePlanet.x,
      y1: pSvgY,
      x2: cursorCoords.svgX,
      y2: cursorCoords.svgY,
      dx,
      dy,
      dist,
      angleDeg: (angleDeg + 360) % 360
    };
  }, [showPrecisionRuler, selectedPlanet, draggedPlanet, cursorCoords, settings.invertY]);

  return (
    <section className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden select-none">
      {/* Background starlight shimmer */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#38bdf8 0.6px, transparent 0.6px), radial-gradient(#818cf8 0.4px, transparent 0.4px)', 
          backgroundSize: '40px 40px, 90px 90px' 
        }}
      />
      
      <div className="flex-1 relative overflow-hidden group">
        {/* Top-Left HUD Overlay Info */}
        <div className="absolute top-4 left-4 pointer-events-none opacity-90 font-mono text-[10px] text-cyan-400 z-10 uppercase tracking-widest leading-relaxed bg-slate-950/80 border border-cyan-900/50 px-3 py-2 rounded-sm backdrop-blur-sm shadow-lg">
          <div className="font-bold text-cyan-300 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>GALAXY MAP // V2.5</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{planets.length} {tr(lang, 'planets', 'planetas', 'planètes')}</span>
            <span>•</span>
            <span>{tradeRoutes.length} {tr(lang, 'routes', 'rutas', 'routes')}</span>
          </div>
          <div className="text-[9px] text-cyan-500/90 mt-1 pt-1 border-t border-cyan-950 flex items-center gap-2">
            <span>{tr(lang, 'GALAXY SCALE:', 'ESCALA GALAXIA:', 'ÉCHELLE GALAXIE :')} <strong className="text-cyan-300">{galaxyScale.toFixed(2)}x</strong></span>
            <span>•</span>
            <span>{tr(lang, 'NODES:', 'NODOS:', 'NŒUDS :')} <strong className="text-amber-300">{planetVisualScale.toFixed(2)}x</strong></span>
          </div>
        </div>

        {/* Top-Center Active Galactic Conquest HUD Banner */}
        {activeCampaign && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 font-mono bg-slate-950/90 border border-emerald-500/60 px-4 py-2 rounded-sm backdrop-blur-md shadow-[0_0_25px_rgba(16,185,129,0.18)] flex flex-col items-center gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>GC // {activeCampaign.name}</span>
              </div>

              {onToggleCampaignPreview && (
                <button
                  onClick={() => onToggleCampaignPreview(!isCampaignPreview)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm border transition-all cursor-pointer flex items-center gap-1 ${
                    isCampaignPreview
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-cyan-500 hover:text-cyan-300'
                  }`}
                  title={tr(
                    lang,
                    'Campaign Preview: Dim unselected planets and trade routes on the map',
                    'Vista Previa de Campaña: Atenúa los planetas y rutas que no forman parte de esta campaña',
                    'Aperçu Campagne : Atténuer les planètes et routes non sélectionnées'
                  )}
                >
                  {isCampaignPreview ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                  <span>
                    {tr(lang, 'Preview:', 'Preview:', 'Aperçu :')} {isCampaignPreview ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {isCampaignPreview && onToggleHideExcluded && (
                <button
                  onClick={() => onToggleHideExcluded(!hideExcludedInPreview)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm border transition-all cursor-pointer ${
                    hideExcludedInPreview
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/70'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {hideExcludedInPreview
                    ? tr(lang, 'Excluded: Hidden', 'Excluidos: Ocultos', 'Exclus : Masqués')
                    : tr(lang, 'Excluded: Dimmed', 'Excluidos: Atenuados', 'Exclus : Atténués')}
                </button>
              )}

              {onToggleMapClickMode && (
                <button
                  onClick={() => onToggleMapClickMode(!mapClickTogglesCampaignPlanet)}
                  className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border transition-all cursor-pointer flex items-center gap-1 ${
                    mapClickTogglesCampaignPlanet
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-900 text-cyan-300 border-cyan-800 hover:border-emerald-500'
                  }`}
                >
                  <MousePointerClick className="w-3 h-3" />
                  <span>
                    {mapClickTogglesCampaignPlanet
                      ? tr(lang, 'Map Click: Toggle Planet (ON)', 'Clic Mapa: Activar/Quitar Planeta (ON)', 'Clic Carte : Basculer Planète (ON)')
                      : tr(lang, 'Map Click: Inspect / Move', 'Clic Mapa: Inspeccionar / Mover', 'Clic Carte : Inspecter / Déplacer')}
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[8px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Empire
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Rebel
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Underworld
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Neutral GC
              </span>
              <span className="text-emerald-400 font-bold">
                • {activeCampaign.locations.filter(l => l.toLowerCase() !== 'galaxy_core_art_model').length}/{planets.filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model').length} {tr(lang, 'Planets', 'Planetas', 'Planètes')}
              </span>
              <span className="text-amber-300 font-bold">
                • {activeCampaign.tradeRoutes.length}/{tradeRoutes.length} {tr(lang, 'Routes', 'Rutas', 'Routes')}
              </span>
            </div>
          </div>
        )}

        {/* Top-Right Live Precision Telemetry Badge */}
        {cursorCoords && (
          <div className="absolute top-4 right-4 pointer-events-none font-mono text-[10px] bg-slate-950/85 border border-cyan-800/60 px-3 py-2 rounded-sm z-10 backdrop-blur-sm shadow-lg">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center justify-between gap-4">
              <span>{tr(lang, 'CURSOR TELEMETRY', 'COORDENADAS CURSOR', 'TÉLÉMÉTRIE CURSEUR')}</span>
              <Crosshair className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-cyan-200 font-bold tracking-wider mt-0.5">
              X: <span className="text-white">{cursorCoords.x.toFixed(2)}</span> &nbsp; Y: <span className="text-white">{cursorCoords.y.toFixed(2)}</span>
            </div>
            {precisionMeasurement && (
              <div className="text-[9px] text-amber-300 mt-1 pt-1 border-t border-slate-800 flex items-center gap-2">
                <span>Δd: <strong>{precisionMeasurement.dist.toFixed(1)}</strong></span>
                <span>•</span>
                <span>∠ <strong>{precisionMeasurement.angleDeg.toFixed(1)}°</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Empty state alert banner if 0 planets */}
        {planets.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-slate-900/90 border border-cyan-700/60 shadow-[0_0_40px_rgba(6,182,212,0.15)] p-6 rounded-md max-w-md text-center font-mono backdrop-blur-md">
            <div className="w-10 h-10 mx-auto mb-3 bg-cyan-950/80 border border-cyan-500/50 rounded-full flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-1">
              {tr(lang, 'Blank Galaxy Sector', 'Galaxia en Blanco', 'Secteur Galactique Vierge')}
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed font-sans">
              {tr(
                lang,
                'No planets are currently plotted in this galaxy. You can add a new star system or import a Planets.xml file.',
                'No hay planetas cargados en esta sesión. Puedes crear un nuevo sistema planetario o importar un archivo Planets.xml.',
                'Aucune planète n\'est actuellement chargée dans cette galaxie. Créez un nouveau système stellaire ou importez un fichier Planets.xml.'
              )}
            </p>
            {onAddPlanet && (
              <button 
                onClick={onAddPlanet}
                className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-widest py-2 text-xs rounded transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.planetList.newPlanet}</span>
              </button>
            )}
          </div>
        )}
        
        <svg
          ref={svgRef}
          className={`w-full h-full touch-none relative z-10 ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          viewBox={`${currentVbX} ${currentVbY} ${currentVbW} ${currentVbH}`}
          onPointerDown={handlePointerDownMap}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onWheel={handleWheel}
        >
          <defs>
            {/* Coordinate Grid Pattern */}
            <pattern id="galaxy-grid" width={settings.gridSize || 50} height={settings.gridSize || 50} patternUnits="userSpaceOnUse">
              <path d={`M ${settings.gridSize || 50} 0 L 0 0 0 ${settings.gridSize || 50}`} fill="none" stroke="#0ea5e9" strokeWidth={planetRadius * 0.05} opacity="0.14" />
            </pattern>

            {/* Core Galactic Glow Radial Gradient */}
            <radialGradient id="galactic-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.9" />
              <stop offset="12%" stopColor="#fef08a" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>

            {/* Deep space spiral nebula glow */}
            <radialGradient id="spiral-nebula-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#4f46e5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          {settings.showGrid && (
            <>
              <rect x={vbMinX * 4} y={vbMinY * 4} width={vbWidth * 8} height={vbHeight * 8} fill="url(#galaxy-grid)" />
              <line x1="0" y1={vbMinY * 4} x2="0" y2={vbMinY * 4 + vbHeight * 8} stroke="#0ea5e9" strokeWidth={planetRadius * 0.22} opacity={0.35} strokeDasharray={`${planetRadius * 0.8},${planetRadius * 0.4}`} />
              <line x1={vbMinX * 4} y1="0" x2={vbMinX * 4 + vbWidth * 8} y2="0" stroke="#0ea5e9" strokeWidth={planetRadius * 0.22} opacity={0.35} strokeDasharray={`${planetRadius * 0.8},${planetRadius * 0.4}`} />
            </>
          )}

          {/* ========================================================= */}
          {/* 1. BUILT-IN STAR WARS GALAXY BACKDROP (Scaled by galaxyScale) */}
          {/* ========================================================= */}
          {showDefaultBackdrop && (
            <g className="galaxy-backdrop pointer-events-none" transform={`scale(${galaxyScale})`}>
              {/* Outer Galactic Disc Nebula Glow */}
              <circle cx="0" cy="0" r="1100" fill="url(#spiral-nebula-glow)" />

              {/* Major Galactic Spiral Arms */}
              <g opacity="0.3" stroke="#38bdf8" strokeWidth={(planetRadius * 3) / galaxyScale} fill="none" strokeLinecap="round">
                {/* Corellian Run / Tingel Arm branch */}
                <path d="M 0,0 Q 180,-120 420,-80 T 780,180 T 1000,520" stroke="#0284c7" strokeWidth={(planetRadius * 2.5) / galaxyScale} opacity="0.4" />
                {/* Perlemian Trade Route / Rimward arm */}
                <path d="M 0,0 Q 90,160 280,380 T 540,720 T 780,950" stroke="#38bdf8" strokeWidth={(planetRadius * 2) / galaxyScale} opacity="0.35" />
                {/* Hydian Way / Outer arm */}
                <path d="M 0,0 Q -150,110 -380,260 T -680,480 T -900,750" stroke="#818cf8" strokeWidth={(planetRadius * 2) / galaxyScale} opacity="0.3" />
                {/* Bakura / Unknown Regions arm */}
                <path d="M 0,0 Q -190,-140 -450,-240 T -750,-420 T -980,-600" stroke="#6366f1" strokeWidth={(planetRadius * 2.2) / galaxyScale} opacity="0.25" />
              </g>

              {/* Galactic Sector Boundary Rings */}
              {galacticRings.map((ring, idx) => (
                <g key={idx} opacity={ring.opacity}>
                  <circle 
                    cx="0" 
                    cy="0" 
                    r={ring.radius} 
                    fill="none" 
                    stroke={ring.color} 
                    strokeWidth={(planetRadius * 0.15) / galaxyScale} 
                    strokeDasharray={`${(planetRadius * 1.5) / galaxyScale},${(planetRadius * 1) / galaxyScale}`} 
                  />
                  {showSectorLabels && labelVisualScale > 0 && (
                    <text
                      x={ring.radius * 0.707}
                      y={-ring.radius * 0.707}
                      fill={ring.color}
                      fontSize={((planetRadius * 1.05 * labelVisualScale) / galaxyScale)}
                      fontFamily="monospace"
                      opacity={0.85}
                      textAnchor="start"
                      letterSpacing="0.1em"
                    >
                      {ring.name.toUpperCase()} ({Math.round(ring.radius * galaxyScale)}u)
                    </text>
                  )}
                </g>
              ))}

              {/* Major Galactic Quadrant Crosshair Arcs */}
              <g stroke="#38bdf8" strokeWidth={(planetRadius * 0.12) / galaxyScale} opacity="0.2" fill="none">
                <circle cx="0" cy="0" r="300" strokeDasharray="3,6" />
                <circle cx="0" cy="0" r="600" strokeDasharray="4,8" />
                <circle cx="0" cy="0" r="900" strokeDasharray="5,10" />
              </g>

              {/* Glowing Galactic Core (Deep Core) */}
              <circle cx="0" cy="0" r={(planetRadius * 14) / galaxyScale} fill="url(#galactic-core-glow)" />
              <circle cx="0" cy="0" r={(planetRadius * 4) / galaxyScale} fill="#fef08a" opacity="0.8" filter="blur(2px)" />
            </g>
          )}

          {/* ========================================================= */}
          {/* 2. CUSTOM MOD BACKGROUND IMAGE (TGA/PNG/JPG loaded)       */}
          {/* ========================================================= */}
          {bgImage && (
            <image 
              href={bgImage.url} 
              x={bgImage.x * galaxyScale} 
              y={bgImage.y * galaxyScale} 
              width={bgImage.width * galaxyScale} 
              height={bgImage.height * galaxyScale} 
              opacity={bgImage.opacity}
              preserveAspectRatio="none"
              className="pointer-events-none"
            />
          )}

          {/* Galactic Center Point Marker (0,0) */}
          <g transform="translate(0, 0)" className="pointer-events-none">
            <circle r={effectivePlanetRadius * 0.8} className="fill-red-500/70 animate-ping" opacity="0.3" />
            <circle r={effectivePlanetRadius * 0.6} className="fill-red-500" />
            <line x1={-effectivePlanetRadius * 3} y1="0" x2={effectivePlanetRadius * 3} y2="0" stroke="#ef4444" strokeWidth={effectivePlanetRadius * 0.25} opacity={0.8} />
            <line x1="0" y1={-effectivePlanetRadius * 3} x2="0" y2={effectivePlanetRadius * 3} stroke="#ef4444" strokeWidth={effectivePlanetRadius * 0.25} opacity={0.8} />
            {labelVisualScale > 0 && (
              <text y={effectivePlanetRadius * 2.8} textAnchor="middle" className="fill-red-400 font-mono font-bold select-none" style={{ fontSize: `${effectiveLabelSize * 0.9}px` }}>
                CORE (0,0)
              </text>
            )}
          </g>

          {/* ========================================================= */}
          {/* 3. PRECISION ALIGNMENT LASER GUIDES & RULER               */}
          {/* ========================================================= */}
          {showAlignmentGuides && cursorCoords && (
            <g className="pointer-events-none">
              <line
                x1={vbMinX * 4}
                y1={cursorCoords.svgY}
                x2={vbMinX * 4 + vbWidth * 8}
                y2={cursorCoords.svgY}
                stroke="#22d3ee"
                strokeWidth={effectivePlanetRadius * 0.14}
                strokeDasharray={`${effectivePlanetRadius * 0.8},${effectivePlanetRadius * 0.8}`}
                opacity="0.45"
              />
              <line
                x1={cursorCoords.svgX}
                y1={vbMinY * 4}
                x2={cursorCoords.svgX}
                y2={vbMinY * 4 + vbHeight * 8}
                stroke="#22d3ee"
                strokeWidth={effectivePlanetRadius * 0.14}
                strokeDasharray={`${effectivePlanetRadius * 0.8},${effectivePlanetRadius * 0.8}`}
                opacity="0.45"
              />
            </g>
          )}

          {precisionMeasurement && (
            <g className="pointer-events-none">
              <line
                x1={precisionMeasurement.x1}
                y1={precisionMeasurement.y1}
                x2={precisionMeasurement.x2}
                y2={precisionMeasurement.y2}
                stroke="#fbbf24"
                strokeWidth={effectivePlanetRadius * 0.2}
                strokeDasharray={`${effectivePlanetRadius * 0.7},${effectivePlanetRadius * 0.5}`}
                opacity="0.85"
              />
              <circle
                cx={precisionMeasurement.x2}
                cy={precisionMeasurement.y2}
                r={effectivePlanetRadius * 0.45}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={effectivePlanetRadius * 0.18}
              />
              {labelVisualScale > 0 && (
                <text
                  x={(precisionMeasurement.x1 + precisionMeasurement.x2) / 2}
                  y={(precisionMeasurement.y1 + precisionMeasurement.y2) / 2 - effectivePlanetRadius * 1.1}
                  fill="#fde68a"
                  fontSize={effectiveLabelSize * 0.85}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
                >
                  {precisionMeasurement.dist.toFixed(1)}u ({precisionMeasurement.angleDeg.toFixed(0)}°)
                </text>
              )}
            </g>
          )}

          {/* ========================================================= */}
          {/* 4. TRADE ROUTES (Hyperlanes)                              */}
          {/* ========================================================= */}
          {tradeRoutes.map(tr => {
            const planetA = planetMap.get(tr.pointA.toUpperCase());
            const planetB = planetMap.get(tr.pointB.toUpperCase());
            if (!planetA || !planetB) return null;
            
            const ay = settings.invertY ? planetA.y : -planetA.y;
            const by = settings.invertY ? planetB.y : -planetB.y;
            const isConnectedToSelected = selectedPlanet && (
              selectedPlanet.name.toUpperCase() === tr.pointA.toUpperCase() ||
              selectedPlanet.name.toUpperCase() === tr.pointB.toUpperCase()
            );

            const isInActiveCampaign = activeCampaign
              ? activeCampaign.tradeRoutes.some(r => r.toLowerCase() === tr.name.toLowerCase())
              : true;

            const isDimmedByPreview = Boolean(activeCampaign && isCampaignPreview && !isInActiveCampaign);
            if (isDimmedByPreview && hideExcludedInPreview) {
              return null;
            }

            // Check if this active campaign route connects to an unselected planet
            const hasEndpointA = activeCampaign
              ? activeCampaign.locations.some(l => l.toLowerCase() === tr.pointA.toLowerCase())
              : true;
            const hasEndpointB = activeCampaign
              ? activeCampaign.locations.some(l => l.toLowerCase() === tr.pointB.toLowerCase())
              : true;
            const isDanglingCampaignRoute = Boolean(
              activeCampaign && isCampaignPreview && isInActiveCampaign && (!hasEndpointA || !hasEndpointB)
            );

            return (
              <g key={tr.id}>
                {/* Subtle outer glow for active campaign trade routes in Preview Mode */}
                {activeCampaign && isCampaignPreview && isInActiveCampaign && !isDanglingCampaignRoute && (
                  <line
                    x1={planetA.x}
                    y1={ay}
                    x2={planetB.x}
                    y2={by}
                    stroke="#10b981"
                    strokeWidth={effectiveRouteStroke * 2.1}
                    strokeLinecap="round"
                    opacity={0.18}
                    className="pointer-events-none"
                  />
                )}
                <line 
                  x1={planetA.x}
                  y1={ay}
                  x2={planetB.x}
                  y2={by}
                  className={
                    isDimmedByPreview
                      ? "stroke-slate-700/40 transition-opacity cursor-pointer z-10"
                      : isDanglingCampaignRoute
                      ? "stroke-rose-400 transition-opacity cursor-pointer z-10"
                      : isConnectedToSelected
                      ? "stroke-amber-300 transition-opacity cursor-pointer z-10"
                      : activeCampaign && isCampaignPreview
                      ? "stroke-emerald-400 hover:stroke-emerald-300 transition-opacity cursor-pointer z-10"
                      : "stroke-amber-400/50 hover:stroke-amber-300 transition-opacity cursor-pointer z-10"
                  }
                  strokeWidth={
                    isDimmedByPreview
                      ? effectiveRouteStroke * 0.45
                      : isConnectedToSelected
                      ? effectiveRouteStroke * 1.35
                      : activeCampaign && isCampaignPreview && isInActiveCampaign
                      ? effectiveRouteStroke * 1.15
                      : effectiveRouteStroke
                  }
                  strokeDasharray={
                    isDimmedByPreview
                      ? `${effectivePlanetRadius * 0.7},${effectivePlanetRadius * 0.7}`
                      : isDanglingCampaignRoute
                      ? `${effectivePlanetRadius * 0.9},${effectivePlanetRadius * 0.5}`
                      : undefined
                  }
                  strokeLinecap="round"
                  opacity={isDimmedByPreview ? 0.14 : isConnectedToSelected ? 0.98 : 0.88}
                />
              </g>
            );
          })}

          {/* ========================================================= */}
          {/* 5. PLANETS                                                */}
          {/* ========================================================= */}
          {planets.map((p) => {
            const isDragged = draggedPlanet && draggedPlanet.id === p.id;
            const displayPlanet = isDragged ? draggedPlanet : p;
            const isSelected = selectedPlanet?.id === p.id;

            const scaleNode = displayPlanet.el.getElementsByTagName('Scale_Factor')[0];
            const scaleText = scaleNode ? scaleNode.textContent : null;
            const scaleMult = parseFloat(scaleText || '1') || 1;
            const actualRadius = effectivePlanetRadius * scaleMult;
            const renderY = settings.invertY ? displayPlanet.y : -displayPlanet.y;

            // Galactic Conquest Campaign state for this planet
            const isInCampaign = activeCampaign
              ? activeCampaign.locations.some(loc => loc.toLowerCase() === displayPlanet.name.toLowerCase())
              : true;

            const isDimmedByPreview = Boolean(activeCampaign && isCampaignPreview && !isInCampaign);
            if (isDimmedByPreview && hideExcludedInPreview && !isSelected) {
              return null;
            }

            let campaignOwnerColor: string | null = null;
            let isHomeHQ = false;
            let startingForceCount = 0;

            if (activeCampaign && isInCampaign) {
              const pNameLower = displayPlanet.name.toLowerCase();
              const homeFac = activeCampaign.factions.find(f => f.homeLocation.toLowerCase() === pNameLower);
              if (homeFac) {
                isHomeHQ = true;
              }
              const planetForces = activeCampaign.startingForces.filter(sf => sf.planet.toLowerCase() === pNameLower);
              startingForceCount = planetForces.reduce((acc, item) => acc + (item.count || 1), 0);

              const controllingFac = (homeFac?.faction || planetForces[0]?.faction || '').toLowerCase();
              if (controllingFac.includes('empire')) campaignOwnerColor = '#ef4444';
              else if (controllingFac.includes('rebel')) campaignOwnerColor = '#f97316';
              else if (controllingFac.includes('underworld')) campaignOwnerColor = '#eab308';
              else if (controllingFac.includes('republic')) campaignOwnerColor = '#10b981';
              else if (controllingFac.includes('cis')) campaignOwnerColor = '#6366f1';
              else campaignOwnerColor = '#22d3ee';
            }

            return (
              <g 
                key={p.id} 
                transform={`translate(${displayPlanet.x}, ${renderY})`}
                className="cursor-pointer transition-opacity"
                opacity={isDimmedByPreview ? (isSelected ? 0.65 : 0.15) : 1}
                onPointerDown={(e) => handlePointerDown(e, p)}
              >
                {/* Campaign Faction Control Ring & Halo when in Preview Mode */}
                {activeCampaign && isInCampaign && campaignOwnerColor && (
                  <>
                    {isCampaignPreview && (
                      <circle
                        r={actualRadius * 2.2}
                        fill={campaignOwnerColor}
                        opacity={0.14}
                        className="pointer-events-none"
                      />
                    )}
                    <circle
                      r={actualRadius * 1.75}
                      fill="none"
                      stroke={campaignOwnerColor}
                      strokeWidth={actualRadius * 0.28}
                      opacity={0.92}
                      className="pointer-events-none"
                    />
                  </>
                )}

                {/* Excluded Planet Dashed Ring in Campaign Preview Mode */}
                {isDimmedByPreview && (
                  <circle
                    r={actualRadius * 1.45}
                    fill="none"
                    stroke="#475569"
                    strokeWidth={actualRadius * 0.18}
                    strokeDasharray={`${actualRadius * 0.45},${actualRadius * 0.4}`}
                    className="pointer-events-none"
                  />
                )}

                {/* Capital HQ Star Badge if Home_Location */}
                {activeCampaign && isInCampaign && isHomeHQ && labelVisualScale > 0 && (
                  <text
                    y={-(actualRadius * 2.1)}
                    textAnchor="middle"
                    fill={campaignOwnerColor || '#fbbf24'}
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: `${effectiveLabelSize * 0.85}px`,
                      textShadow: '0 1px 4px rgba(0,0,0,0.95)'
                    }}
                  >
                    ★ HQ
                  </text>
                )}

                {/* Targeting reticle when selected */}
                {isSelected && (
                  <>
                    <circle
                      r={actualRadius * 2.5}
                      className="fill-cyan-500/15 stroke-cyan-400 animate-pulse pointer-events-none"
                      strokeWidth={actualRadius * 0.22}
                    />
                    <line x1={-actualRadius * 3.2} y1="0" x2={actualRadius * 3.2} y2="0" stroke="#22d3ee" strokeWidth={actualRadius * 0.2} opacity="0.7" strokeDasharray={`${actualRadius * 0.4},${actualRadius * 0.3}`} />
                    <line x1="0" y1={-actualRadius * 3.2} x2="0" y2={actualRadius * 3.2} stroke="#22d3ee" strokeWidth={actualRadius * 0.2} opacity="0.7" strokeDasharray={`${actualRadius * 0.4},${actualRadius * 0.3}`} />
                  </>
                )}
                
                {/* Planet Body */}
                <circle
                  r={actualRadius}
                  strokeWidth={actualRadius * 0.28}
                  className={
                    (isDimmedByPreview && !isSelected
                      ? "fill-slate-600 stroke-slate-700"
                      : getTerrainColor(displayPlanet, isSelected) + " drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]") +
                    " transition-colors"
                  }
                />

                {/* Exact Center Pinpoint Dot for High-Precision Placement */}
                <circle
                  r={Math.max(actualRadius * 0.18, 0.4)}
                  className="fill-slate-950 pointer-events-none opacity-70"
                />

                {/* Planet Name Label + Garrison Counter */}
                {labelVisualScale > 0 && (
                  <text
                    y={actualRadius + effectivePlanetRadius * 1.55}
                    textAnchor="middle"
                    className={`font-mono font-bold tracking-wider select-none pointer-events-none uppercase ${
                      isSelected
                        ? 'fill-cyan-300 font-extrabold'
                        : isDimmedByPreview
                        ? 'fill-slate-500 opacity-60'
                        : activeCampaign && isCampaignPreview && isInCampaign
                        ? 'fill-emerald-200'
                        : 'fill-slate-300 opacity-85'
                    }`}
                    style={{ 
                      fontSize: `${effectiveLabelSize * (isSelected ? 1.22 : isDimmedByPreview ? 0.88 : 1.0)}px`,
                      textShadow: isSelected ? '0 0 8px rgba(34,211,238,0.7)' : '0 1px 4px rgba(0,0,0,0.9)'
                    }}
                  >
                    {displayPlanet.name}
                    {activeCampaign && isInCampaign && startingForceCount > 0 ? ` [${startingForceCount}]` : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ========================================================= */}
      {/* TOOLBAR CONTROLS OVERLAY                                  */}
      {/* ========================================================= */}
      <div className="absolute bottom-14 left-4 flex items-center gap-2 z-20">
        <div className="bg-slate-900/95 border border-cyan-800/60 p-1 flex items-center gap-1 rounded-sm shadow-xl backdrop-blur-md">
          {/* Zoom In */}
          <button 
            onClick={() => zoomToCenter(1.4)}
            className="w-8 h-8 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-400 transition-colors rounded-sm cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          {/* Reset View */}
          <button 
            onClick={() => setTransform({ panX: 0, panY: 0, zoom: 1 })}
            className="w-8 h-8 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-400 transition-colors rounded-sm cursor-pointer"
            title={lang === 'es' ? 'Centrar Vista' : 'Reset View'}
          >
            <BoxSelect className="w-4 h-4" />
          </button>
          
          {/* Zoom Out */}
          <button 
            onClick={() => zoomToCenter(1 / 1.4)}
            className="w-8 h-8 flex items-center justify-center hover:bg-cyan-500/20 text-cyan-400 transition-colors rounded-sm cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-cyan-800/50 mx-1"></div>

          {/* Toggle Default Backdrop Vector */}
          <button
            onClick={() => setShowDefaultBackdrop(prev => !prev)}
            className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm cursor-pointer ${
              showDefaultBackdrop ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-700/60' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={showDefaultBackdrop ? (lang === 'es' ? 'Ocultar Mapa Galáctico Vectorial' : 'Disable Vector Galaxy Map') : (lang === 'es' ? 'Mostrar Mapa Galáctico Vectorial' : 'Enable Vector Galaxy Map')}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Galaxy Scale & Precision Tool Button */}
          <button
            onClick={() => {
              setIsScaleSettingsOpen(prev => !prev);
              setIsBgSettingsOpen(false);
            }}
            className={`px-2.5 h-8 flex items-center gap-1.5 transition-colors rounded-sm cursor-pointer font-mono text-[10px] font-bold uppercase tracking-wider ${
              isScaleSettingsOpen || galaxyScale !== 1 || planetVisualScale !== 1 || routeVisualScale !== 1
                ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-600/60'
                : 'text-cyan-400 hover:bg-cyan-500/20'
            }`}
            title={lang === 'es' ? 'Escala de Galaxia y Precisión de Nodos' : 'Galaxy Visualization Scale & Precision'}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Escala' : 'Scale'}</span>
          </button>

          {/* Toggle Alignment Laser Crosshairs */}
          <button
            onClick={() => setShowAlignmentGuides(prev => !prev)}
            className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm cursor-pointer ${
              showAlignmentGuides ? 'text-amber-300 bg-amber-950/60 border border-amber-600/60' : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20'
            }`}
            title={lang === 'es' ? 'Guías Láser de Alineación X/Y' : 'X/Y Laser Alignment Crosshairs'}
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Background Image Settings / Upload */}
          <button 
            onClick={() => {
              setIsBgSettingsOpen(prev => !prev);
              setIsScaleSettingsOpen(false);
            }}
            className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm cursor-pointer ${
              bgImage ? 'text-amber-400 bg-amber-950/40 border border-amber-600/50' : 'text-cyan-400 hover:bg-cyan-500/20'
            }`}
            title={lang === 'es' ? 'Configurar Fondo Galáctico' : 'Galaxy Background Settings'}
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Hidden File Input supporting TGA, PNG, JPG, WebP */}
          <input 
            type="file" 
            ref={bgInputRef} 
            onChange={handleBgUpload} 
            accept=".tga,.png,.jpg,.jpeg,.webp,.bmp,image/*" 
            className="hidden" 
          />
        </div>

        {/* Quick Precision Scale Pill Bar */}
        <div className="hidden md:flex bg-slate-900/95 border border-cyan-800/60 p-1 items-center gap-1 rounded-sm shadow-xl backdrop-blur-md font-mono text-[9px]">
          <span className="text-slate-400 px-1.5 uppercase tracking-wider">
            {lang === 'es' ? 'Precisión:' : 'Precision:'}
          </span>
          {[
            { id: 'micro', label: '0.35x Micro', val: 0.35 },
            { id: 'fine', label: '0.65x Fino', val: 0.65 },
            { id: 'standard', label: '1.0x Normal', val: 1.0 },
            { id: 'macro', label: '1.6x Macro', val: 1.6 }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyScalePreset(preset.id as 'micro' | 'fine' | 'standard' | 'macro')}
              className={`px-2 py-1 rounded-sm uppercase font-bold transition-colors cursor-pointer ${
                Math.abs(planetVisualScale - preset.val) < 0.05
                  ? 'bg-cyan-600 text-slate-950'
                  : 'text-cyan-300 hover:bg-cyan-950/70'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* GALAXY SCALE & PRECISION TOOL POPUP                       */}
      {/* ========================================================= */}
      {isScaleSettingsOpen && (
        <div className="absolute bottom-26 left-4 bg-slate-900/95 border border-cyan-700/80 shadow-2xl rounded-md p-4 w-80 z-30 font-mono text-cyan-100 flex flex-col gap-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-800/50 pb-2">
            <span className="text-[10px] tracking-widest uppercase font-bold text-cyan-300 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'es' ? 'Escala y Precisión Galáctica' : 'Galaxy Scale & Precision'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyScalePreset('standard')}
                className="text-slate-400 hover:text-cyan-300 text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 border border-slate-700 rounded cursor-pointer"
                title={lang === 'es' ? 'Restablecer escalas a 1.0x' : 'Reset scales to 1.0x'}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
              <button 
                onClick={() => setIsScaleSettingsOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5">
              {lang === 'es' ? 'Modos Rápidos de Colocación' : 'Quick Placement Presets'}
            </span>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => applyScalePreset('micro')}
                className={`py-1 px-1.5 text-[9px] font-bold rounded border uppercase cursor-pointer transition-colors ${
                  planetVisualScale === 0.35 ? 'bg-cyan-900/80 border-cyan-400 text-white' : 'bg-slate-950 border-slate-800 text-cyan-300 hover:border-cyan-700'
                }`}
              >
                Micro
              </button>
              <button
                onClick={() => applyScalePreset('fine')}
                className={`py-1 px-1.5 text-[9px] font-bold rounded border uppercase cursor-pointer transition-colors ${
                  planetVisualScale === 0.65 ? 'bg-cyan-900/80 border-cyan-400 text-white' : 'bg-slate-950 border-slate-800 text-cyan-300 hover:border-cyan-700'
                }`}
              >
                {lang === 'es' ? 'Fino' : 'Fine'}
              </button>
              <button
                onClick={() => applyScalePreset('standard')}
                className={`py-1 px-1.5 text-[9px] font-bold rounded border uppercase cursor-pointer transition-colors ${
                  planetVisualScale === 1.0 && galaxyScale === 1.0 ? 'bg-cyan-900/80 border-cyan-400 text-white' : 'bg-slate-950 border-slate-800 text-cyan-300 hover:border-cyan-700'
                }`}
              >
                1.0x
              </button>
              <button
                onClick={() => applyScalePreset('macro')}
                className={`py-1 px-1.5 text-[9px] font-bold rounded border uppercase cursor-pointer transition-colors ${
                  planetVisualScale === 1.6 ? 'bg-cyan-900/80 border-cyan-400 text-white' : 'bg-slate-950 border-slate-800 text-cyan-300 hover:border-cyan-700'
                }`}
              >
                Macro
              </button>
            </div>
          </div>

          {/* 1. Galaxy Reference Backdrop Scale */}
          <div className="pt-1 border-t border-slate-800/80">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] uppercase tracking-wider text-cyan-200 font-bold">
                {lang === 'es' ? 'Escala de la Galaxia (Sectores)' : 'Galaxy Backdrop Scale'}
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5.0"
                value={galaxyScale}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) setGalaxyScale(val);
                }}
                className="w-14 bg-slate-950 border border-slate-700 rounded p-0.5 text-[10px] text-right text-cyan-300 font-bold outline-none"
              />
            </div>
            <input
              type="range"
              min="0.2"
              max="3.5"
              step="0.05"
              value={galaxyScale}
              onChange={(e) => setGalaxyScale(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="text-[8px] text-slate-500 mt-0.5">
              {lang === 'es' ? 'Ajusta el tamaño del mapa base respecto a las coordenadas.' : 'Scales reference rings & backdrop relative to coordinates.'}
            </div>
          </div>

          {/* 2. Planet Node Scale */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">
                {lang === 'es' ? 'Tamaño Visual de Planetas' : 'Planet Node Visual Scale'}
              </label>
              <span className="text-[10px] text-emerald-300 font-bold">{planetVisualScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="2.5"
              step="0.05"
              value={planetVisualScale}
              onChange={(e) => setPlanetVisualScale(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          {/* 3. Trade Route Thickness Scale */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                {lang === 'es' ? 'Grosor de Rutas Comerciales' : 'Trade Route Line Scale'}
              </label>
              <span className="text-[10px] text-amber-300 font-bold">{routeVisualScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="2.5"
              step="0.05"
              value={routeVisualScale}
              onChange={(e) => setRouteVisualScale(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* 4. Label Font Scale */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">
                {lang === 'es' ? 'Escala de Textos / Nombres' : 'Planet Label Scale'}
              </label>
              <span className="text-[10px] text-slate-300 font-bold">
                {labelVisualScale === 0 ? (lang === 'es' ? 'OCULTO' : 'HIDDEN') : `${labelVisualScale.toFixed(2)}x`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2.2"
              step="0.05"
              value={labelVisualScale}
              onChange={(e) => setLabelVisualScale(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* 5. Tactical Precision Aids Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-300">
                {lang === 'es' ? 'Regla de Distancia y Ángulo' : 'Distance & Angle Vector'}
              </span>
              <button
                onClick={() => setShowPrecisionRuler(!showPrecisionRuler)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border cursor-pointer ${
                  showPrecisionRuler ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                {showPrecisionRuler ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-300">
                {lang === 'es' ? 'Guías Láser de Alineación X/Y' : 'X/Y Alignment Guides'}
              </span>
              <button
                onClick={() => setShowAlignmentGuides(!showAlignmentGuides)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border cursor-pointer ${
                  showAlignmentGuides ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                {showAlignmentGuides ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GALAXY BACKGROUND SETTINGS MODAL / POPUP                   */}
      {/* ========================================================= */}
      {isBgSettingsOpen && (
        <div className="absolute bottom-26 left-4 bg-slate-900/95 border border-cyan-800/80 shadow-2xl rounded-md p-4 w-72 z-30 font-mono text-cyan-100 flex flex-col gap-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-800/40 pb-2">
            <span className="text-[10px] tracking-widest uppercase font-bold text-cyan-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'es' ? 'Fondo de Galaxia' : 'Galaxy Background'}
            </span>
            <button 
              onClick={() => setIsBgSettingsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>

          {/* Default Vector Galaxy Backdrop switch */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <span className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">
              {lang === 'es' ? 'Mapa Vectorial 3D' : 'Built-in Vector Map'}
            </span>
            <button
              onClick={() => setShowDefaultBackdrop(!showDefaultBackdrop)}
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border cursor-pointer ${
                showDefaultBackdrop 
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300' 
                  : 'bg-slate-950 border-slate-700 text-slate-500'
              }`}
            >
              {showDefaultBackdrop ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Sector Ring Labels switch */}
          {showDefaultBackdrop && (
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">
                {lang === 'es' ? 'Nombres de Sectores' : 'Sector Ring Labels'}
              </span>
              <button
                onClick={() => setShowSectorLabels(!showSectorLabels)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border cursor-pointer ${
                  showSectorLabels 
                    ? 'bg-cyan-950 border-cyan-600 text-cyan-300' 
                    : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                {showSectorLabels ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Custom Mod Texture Section */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-300">
                {lang === 'es' ? 'Textura Personalizada' : 'Custom Mod Texture'}
              </span>
              {bgImage && (
                <button 
                  onClick={() => setBgImage(null)} 
                  className="text-red-400 hover:text-red-300 text-[9px] flex items-center gap-1 cursor-pointer"
                  title="Remove Texture"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{lang === 'es' ? 'Quitar' : 'Remove'}</span>
                </button>
              )}
            </div>

            {bgImage ? (
              <div className="space-y-2.5">
                <div className="text-[9px] text-slate-400 truncate bg-slate-950 p-1.5 border border-slate-800 rounded">
                  {bgImage.name || 'Texture Loaded'}
                </div>

                {/* Width */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400">Width</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={Number(bgImage.width.toFixed(1))} 
                      onChange={(e) => {
                        const w = parseFloat(e.target.value);
                        if (isNaN(w)) return;
                        const ratio = bgImage.width / bgImage.height;
                        setBgImage({ ...bgImage, width: w, height: w / ratio });
                      }} 
                      className="w-16 bg-slate-950 border border-slate-700 rounded p-0.5 text-xs text-right text-cyan-200 outline-none" 
                    />
                  </div>
                  <input 
                    type="range" 
                    min={100} 
                    max={baseBounds.vbWidth * 5} 
                    value={bgImage.width} 
                    onChange={(e) => {
                      const w = parseFloat(e.target.value);
                      const ratio = bgImage.width / bgImage.height;
                      setBgImage({ ...bgImage, width: w, height: w / ratio });
                    }} 
                    className="w-full accent-cyan-400" 
                  />
                </div>

                {/* X Offset */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400">X Offset</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={Number(bgImage.x.toFixed(1))} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setBgImage({ ...bgImage, x: val });
                      }} 
                      className="w-16 bg-slate-950 border border-slate-700 rounded p-0.5 text-xs text-right text-cyan-200 outline-none" 
                    />
                  </div>
                  <input 
                    type="range" 
                    min={-baseBounds.vbWidth * 2} 
                    max={baseBounds.vbWidth * 2} 
                    value={bgImage.x} 
                    onChange={(e) => setBgImage({ ...bgImage, x: parseFloat(e.target.value) })} 
                    className="w-full accent-cyan-400" 
                  />
                </div>

                {/* Y Offset */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400">Y Offset</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={Number(bgImage.y.toFixed(1))} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setBgImage({ ...bgImage, y: val });
                      }} 
                      className="w-16 bg-slate-950 border border-slate-700 rounded p-0.5 text-xs text-right text-cyan-200 outline-none" 
                    />
                  </div>
                  <input 
                    type="range" 
                    min={-baseBounds.vbHeight * 2} 
                    max={baseBounds.vbHeight * 2} 
                    value={bgImage.y} 
                    onChange={(e) => setBgImage({ ...bgImage, y: parseFloat(e.target.value) })} 
                    className="w-full accent-cyan-400" 
                  />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400">Opacity</label>
                    <span className="text-xs text-cyan-300 font-bold">{Math.round(bgImage.opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="1" 
                    step="0.01" 
                    value={bgImage.opacity} 
                    onChange={(e) => setBgImage({ ...bgImage, opacity: parseFloat(e.target.value) })} 
                    className="w-full accent-amber-400" 
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={fitBgToView}
                    className="flex-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[9px] font-bold py-1 px-2 rounded cursor-pointer transition-colors"
                  >
                    {lang === 'es' ? 'Ajustar al Mapa' : 'Fit to Map'}
                  </button>
                  <button 
                    onClick={() => bgInputRef.current?.click()}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold py-1 px-2 rounded cursor-pointer transition-colors"
                  >
                    {lang === 'es' ? 'Cambiar...' : 'Change...'}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => bgInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 bg-amber-600/90 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest py-2 text-[10px] transition-colors cursor-pointer rounded-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Cargar .TGA / .PNG / .JPG' : 'Upload .TGA / .PNG / .JPG'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STATUS BAR FOOTER                                         */}
      {/* ========================================================= */}
      <div className="h-10 bg-slate-900/90 border-t border-cyan-800/50 px-6 flex items-center justify-between text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest z-10 shrink-0 backdrop-blur-md">
        <div className="flex gap-6 items-center">
          {selectedPlanet ? (
            <>
              <span className="font-bold text-cyan-300 tracking-wider">
                PLANET: <span className="text-white">{selectedPlanet.name}</span>
              </span>
              <span>X: <span className="text-cyan-100 font-bold">{selectedPlanet.x.toFixed(2)}</span></span>
              <span>Y: <span className="text-cyan-100 font-bold">{selectedPlanet.y.toFixed(2)}</span></span>
              <span>Z: <span className="text-cyan-100 font-bold">{selectedPlanet.z.toFixed(2)}</span></span>
            </>
          ) : (
            <span className="text-slate-500">{t.planetEditor.noPlanetActive}</span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-slate-400 text-[9px]">
            {tr(lang, 'SCALE:', 'ESCALA:', 'ÉCHELLE :')} <strong className="text-cyan-300">{galaxyScale.toFixed(2)}x</strong>
          </span>
          <span className="text-slate-500 text-[9px]">
            ZOOM: <strong className="text-cyan-200">{Math.round(transform.zoom * 100)}%</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-500/70 text-[9px] font-bold">ONLINE // V2.5</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
