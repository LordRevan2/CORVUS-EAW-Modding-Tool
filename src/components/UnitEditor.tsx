import React, { useState, useRef, useEffect } from 'react';
import { Save, Search, X, Shield, Heart, Coins, Crosshair } from 'lucide-react';
import { useLanguage, tr } from '../i18n';

interface UnitEditorProps {
  initialDoc: XMLDocument;
  fileName: string;
  onClose: () => void;
  onError: (err: string) => void;
}

interface UnitData {
  id: string;
  node: Element;
  tagName: string;
  name: string;
  textId: string;
  affiliation: string;
  health: string;
  shields: string;
  buildCost: string;
  buildTime: string;
}

const UNIT_TAGS = ['SpaceUnit', 'GroundVehicle', 'GroundInfantry', 'Squadron', 'HeroUnit', 'UniqueUnit', 'StarBase', 'GroundCompany'];

export default function UnitEditor({ initialDoc, fileName, onClose, onError }: UnitEditorProps) {
  const lang = useLanguage();
  const [units, setUnits] = useState<UnitData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const fileDownloadAnchorRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const parsedUnits: UnitData[] = [];

    UNIT_TAGS.forEach(tag => {
      const nodes = initialDoc.getElementsByTagName(tag);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nameAttr = node.getAttribute('Name') || 'Unknown';

        const getTagContent = (tagName: string) => {
          const child = Array.from(node.children).find(c => c.tagName === tagName);
          return child?.textContent || '';
        };

        parsedUnits.push({
          id: `${tag}_${nameAttr}_${i}`,
          node,
          tagName: tag,
          name: nameAttr,
          textId: getTagContent('Text_ID'),
          affiliation: getTagContent('Affiliation'),
          health: getTagContent('Tactical_Health'),
          shields: getTagContent('Energy_Capacity'),
          buildCost: getTagContent('Build_Cost_Credits'),
          buildTime: getTagContent('Build_Time_Seconds')
        });
      }
    });

    setUnits(parsedUnits);
    if (parsedUnits.length > 0 && !selectedUnitId) {
      setSelectedUnitId(parsedUnits[0].id);
    }
  }, [initialDoc]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const filteredUnits = units.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.tagName.toLowerCase().includes(search.toLowerCase()) ||
      u.affiliation.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateField = (field: string, value: string) => {
    if (!selectedUnit) return;

    let childNode = Array.from(selectedUnit.node.children).find(c => (c as Element).tagName === field) as Element;
    if (!childNode) {
      if (value.trim() === '') return;
      childNode = initialDoc.createElement(field);
      selectedUnit.node.appendChild(childNode);
    }

    if (value.trim() === '') {
      selectedUnit.node.removeChild(childNode);
    } else {
      childNode.textContent = value;
    }

    setUnits(prev =>
      prev.map(u => {
        if (u.id === selectedUnit.id) {
          return {
            ...u,
            textId: field === 'Text_ID' ? value : u.textId,
            affiliation: field === 'Affiliation' ? value : u.affiliation,
            health: field === 'Tactical_Health' ? value : u.health,
            shields: field === 'Energy_Capacity' ? value : u.shields,
            buildCost: field === 'Build_Cost_Credits' ? value : u.buildCost,
            buildTime: field === 'Build_Time_Seconds' ? value : u.buildTime
          };
        }
        return u;
      })
    );
  };

  const handleSave = () => {
    try {
      const serializer = new XMLSerializer();
      const rawXml = serializer.serializeToString(initialDoc);

      let pad = 0;
      let formatted = '';
      rawXml
        .replace(/>\s*</g, '>\n<')
        .split('\n')
        .forEach(node => {
          if (node.match(/^<\/\w/)) pad -= 1;
          formatted += '  '.repeat(Math.max(0, pad)) + node + '\n';
          if (node.match(/^<\w[^>]*[^/]>.*$/) && !node.match(/<\/.+>$/)) pad += 1;
        });

      const blob = new Blob([formatted.trim()], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      if (fileDownloadAnchorRef.current) {
        fileDownloadAnchorRef.current.href = url;
        fileDownloadAnchorRef.current.download = fileName || 'Units.xml';
        fileDownloadAnchorRef.current.click();
      }
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onError(err.message || 'Failed to save file.');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Command Bar — Unified Tactical HUD */}
      <div className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-emerald-900/40 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Crosshair className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-emerald-300 font-bold uppercase tracking-widest text-xs font-mono">
                {tr(lang, 'Unit Balance Editor', 'Editor de Balance de Unidades', 'Éditeur d\'Équilibrage d\'Unités')}
              </h2>
              <span className="px-1.5 py-0.5 rounded-sm bg-emerald-950/90 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                v1.1
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 uppercase">
                {units.length} {tr(lang, 'UNITS', 'UNIDADES', 'UNITÉS')}
              </span>
            </div>
            <div className="text-[11px] text-cyan-200/90 font-mono mt-0.5 truncate max-w-md">
              {fileName}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-[11px] uppercase tracking-widest transition-all flex items-center space-x-1.5 rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Save XML', 'Guardar XML', 'Enregistrer XML')}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={tr(lang, 'Close', 'Cerrar', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Unit List */}
        <div className="w-80 bg-slate-900/50 border-r border-emerald-900/30 flex flex-col shrink-0">
          <div className="p-3 border-b border-emerald-900/30 bg-slate-950/60 relative">
            <input
              type="text"
              placeholder={tr(lang, 'Search units, tags, faction...', 'Buscar unidades, etiquetas, facción...', 'Rechercher unité, balise, faction...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 transition-colors text-slate-200 text-xs font-mono pl-8 pr-3 py-1.5 rounded-sm outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredUnits.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                className={`w-full text-left p-2.5 rounded-sm flex flex-col gap-1 transition-all border cursor-pointer ${
                  selectedUnitId === u.id
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                    : 'bg-slate-950/40 border-slate-800/70 text-slate-300 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <span className="font-mono font-bold text-xs truncate uppercase tracking-wide">{u.name}</span>
                <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between gap-2">
                  <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded-sm uppercase text-emerald-400/90">
                    {u.tagName}
                  </span>
                  <span className="truncate text-cyan-400/80">{u.affiliation || 'Neutral'}</span>
                </div>
              </button>
            ))}
            {filteredUnits.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs font-mono">
                {tr(lang, 'No units matched your search.', 'Ninguna unidad coincide con la búsqueda.', 'Aucune unité ne correspond à votre recherche.')}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Unit Properties */}
        <div className="flex-1 bg-slate-950/80 flex flex-col relative overflow-hidden">
          {selectedUnit ? (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="max-w-4xl space-y-6">
                <div className="bg-slate-900/60 border border-emerald-900/40 p-4 rounded-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-mono font-bold tracking-widest uppercase text-emerald-400">
                      {selectedUnit.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-sm text-emerald-300">
                        &lt;{selectedUnit.tagName}&gt;
                      </span>
                      {selectedUnit.affiliation && (
                        <span className="px-2 py-0.5 bg-cyan-950/60 border border-cyan-800/40 rounded-sm text-cyan-300">
                          {selectedUnit.affiliation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* General / Identity */}
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-sm space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{tr(lang, 'Identity & Faction', 'Identidad y Facción', 'Identité & Faction')}</span>
                    </h4>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Text_ID</label>
                      <input
                        type="text"
                        value={selectedUnit.textId}
                        onChange={e => handleUpdateField('Text_ID', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Affiliation</label>
                      <input
                        type="text"
                        value={selectedUnit.affiliation}
                        onChange={e => handleUpdateField('Affiliation', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors"
                        placeholder="e.g. Empire, Rebel, Underworld"
                      />
                    </div>
                  </div>

                  {/* Economy */}
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-sm space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{tr(lang, 'Economy & Production', 'Economía y Producción', 'Économie & Production')}</span>
                    </h4>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Build_Cost_Credits</label>
                      <input
                        type="number"
                        value={selectedUnit.buildCost}
                        onChange={e => handleUpdateField('Build_Cost_Credits', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-amber-200 text-xs px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Build_Time_Seconds</label>
                      <input
                        type="number"
                        value={selectedUnit.buildTime}
                        onChange={e => handleUpdateField('Build_Time_Seconds', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-amber-200 text-xs px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Combat / Stats */}
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-sm space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-cyan-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{tr(lang, 'Combat Telemetry', 'Estadísticas de Combate', 'Télémétrie de Combat')}</span>
                    </h4>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Tactical_Health</label>
                      <input
                        type="number"
                        value={selectedUnit.health}
                        onChange={e => handleUpdateField('Tactical_Health', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-cyan-200 text-xs px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Energy_Capacity (Shields)</label>
                      <input
                        type="number"
                        value={selectedUnit.shields}
                        onChange={e => handleUpdateField('Energy_Capacity', e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-cyan-200 text-xs px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 flex-col space-y-4 font-mono">
              <Crosshair className="w-12 h-12 text-slate-800" />
              <p className="text-xs font-bold tracking-widest uppercase">
                {tr(lang, 'Select a unit to edit its balance data', 'Selecciona una unidad para editar su balance', 'Sélectionnez une unité pour modifier son équilibrage')}
              </p>
            </div>
          )}
        </div>
      </div>
      <a ref={fileDownloadAnchorRef} className="hidden" />
    </div>
  );
}
