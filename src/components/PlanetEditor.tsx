import React, { useEffect, useState, useMemo } from 'react';
import { Planet } from '../types';
import { Trash2, Plus, X, HelpCircle, Undo2, Redo2, RotateCcw, Code } from 'lucide-react';
import { useTranslation, useLanguage, tr } from '../i18n';
import { serializeXml } from '../lib/xml';

interface PlanetEditorProps {
  planet: Planet | null;
  onUpdate: (
    updatedPlanet: Planet,
    nodeUpdates?: { tagName: string; value: string }[],
    actionMeta?: { label: string; coalesceKey?: string }
  ) => void;
  onDelete: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canRevertNode?: boolean;
  onRevertNode?: () => void;
}

export default function PlanetEditor({
  planet,
  onUpdate,
  onDelete,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  canRevertNode = false,
  onRevertNode,
}: PlanetEditorProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const [localName, setLocalName] = useState('');
  const [localX, setLocalX] = useState<number>(0);
  const [localY, setLocalY] = useState<number>(0);
  const [localZ, setLocalZ] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNodeXmlPreview, setShowNodeXmlPreview] = useState<boolean>(false);

  // Dynamic properties from single-text child nodes
  const [dynamicProps, setDynamicProps] = useState<{ tagName: string; value: string }[]>([]);
  const [newNodeName, setNewNodeName] = useState('');

  const KNOWN_TAGS = [
    'Planet_Credit_Value',
    'Special_Structures_Land',
    'Special_Structures_Space',
    'Max_Space_Base',
    'Scale_Factor',
    'Zoomed_Terrain_Index',
  ];

  const getPropValue = (tagName: string) => {
    const prop = dynamicProps.find((p) => p.tagName === tagName);
    return prop ? prop.value : '';
  };

  const updateTag = (tagName: string, value: string) => {
    if (!planet) return;
    const doc = planet.el.ownerDocument;
    if (!doc) return;

    const existingIdx = dynamicProps.findIndex((p) => p.tagName === tagName);
    const updatedProps = [...dynamicProps];

    if (existingIdx >= 0) {
      updatedProps[existingIdx].value = value;
    } else {
      const newNode = doc.createElement(tagName);
      newNode.textContent = value;
      planet.el.appendChild(newNode);
      updatedProps.push({ tagName, value });
    }

    setDynamicProps(updatedProps);
    onUpdate(
      { ...planet },
      [{ tagName, value }],
      {
        label: `${planet.name}: <${tagName}> = ${value || '""'}`,
        coalesceKey: `planet_${planet.id}_tag_${tagName}`,
      }
    );
  };

  useEffect(() => {
    if (planet) {
      setLocalName(planet.name);
      setLocalX(planet.x);
      setLocalY(planet.y);
      setLocalZ(planet.z);
      setErrorMsg(null);

      // Extract all single-node properties (no children, only text) that aren't Galactic_Position
      const extractedProps: { tagName: string; value: string }[] = [];
      Array.from(planet.el.children).forEach((child) => {
        if (child.children.length === 0 && child.tagName.toLowerCase() !== 'galactic_position') {
          extractedProps.push({
            tagName: child.tagName,
            value: child.textContent?.trim() || '',
          });
        }
      });
      setDynamicProps(extractedProps);
    }
  }, [planet]);

  const liveNodeXml = useMemo(() => {
    if (!planet || !planet.el) return '';
    try {
      return serializeXml(planet.el);
    } catch {
      return '';
    }
  }, [planet, localName, localX, localY, localZ, dynamicProps]);

  if (!planet) {
    return (
      <aside className="w-80 border-l border-cyan-800/30 bg-slate-900/40 p-4 flex items-center justify-center text-[10px] font-bold tracking-widest uppercase text-cyan-900/50 z-10 shrink-0">
        {t.planetEditor.noPlanetActive}
      </aside>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', val: string) => {
    const parsed = parseFloat(val);
    const num = Number.isNaN(parsed) ? 0 : parsed;
    if (axis === 'x') setLocalX(num);
    if (axis === 'y') setLocalY(num);
    if (axis === 'z') setLocalZ(num);

    const nextPlanet = {
      ...planet,
      [axis]: num,
    };
    onUpdate(nextPlanet, undefined, {
      label: `${planet.name}: Pos ${axis.toUpperCase()} = ${num}`,
      coalesceKey: `planet_${planet.id}_pos_${axis}`,
    });
  };

  const handleNameChange = (val: string) => {
    setLocalName(val);
    if (!val.trim()) {
      setErrorMsg('Planet name is a required attribute.');
      return;
    }
    setErrorMsg(null);
    onUpdate({ ...planet, name: val }, undefined, {
      label: `${tr(lang, 'Rename planet', 'Renombrar planeta', 'Renommer planète')}: ${val}`,
      coalesceKey: `planet_${planet.id}_name`,
    });
  };

  const handleDynamicPropChange = (index: number, val: string) => {
    const updatedProps = [...dynamicProps];
    const tagName = updatedProps[index].tagName;
    updatedProps[index].value = val;
    setDynamicProps(updatedProps);
    onUpdate(
      { ...planet },
      [{ tagName, value: val }],
      {
        label: `${planet.name}: <${tagName}> = ${val}`,
        coalesceKey: `planet_${planet.id}_tag_${tagName}`,
      }
    );
  };

  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const tagName = newNodeName.trim().replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!tagName) return;

    if (!/^[a-zA-Z_]/.test(tagName)) {
      setErrorMsg(`Invalid XML tag: <${tagName}>. Must start with a letter or underscore.`);
      return;
    }

    setErrorMsg(null);

    const doc = planet.el.ownerDocument;
    if (!doc) return;

    try {
      const newNode = doc.createElement(tagName);
      newNode.textContent = '0';
      planet.el.appendChild(newNode);
      setDynamicProps([...dynamicProps, { tagName, value: '0' }]);
      setNewNodeName('');
      onUpdate(
        { ...planet },
        [{ tagName, value: '0' }],
        {
          label: `${planet.name}: +<${tagName}>`,
        }
      );
    } catch (e) {
      console.error('Invalid XML tag name', e);
    }
  };

  const handleRemoveNode = (index: number) => {
    const propToRemove = dynamicProps[index];
    const childNodes = Array.from(planet.el.children);
    const nodeToRemove = childNodes.find((c) => c.tagName === propToRemove.tagName);
    if (nodeToRemove && nodeToRemove.parentNode) {
      nodeToRemove.parentNode.removeChild(nodeToRemove);
    }

    const updatedProps = [...dynamicProps];
    updatedProps.splice(index, 1);
    setDynamicProps(updatedProps);
    onUpdate({ ...planet }, undefined, {
      label: `${planet.name}: -<${propToRemove.tagName}>`,
    });
  };

  return (
    <aside className="w-80 border-l border-cyan-800/30 bg-slate-900/40 p-5 space-y-4 flex flex-col h-full z-10 shrink-0 overflow-hidden">
      {/* Header + Quick Undo/Redo & XML Node Revert Bar */}
      <div className="space-y-2.5 shrink-0 border-b border-cyan-900/40 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.18em] flex items-center gap-2 font-mono">
            <span className="w-2 h-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            <span>{tr(lang, 'Planet Inspector', 'Inspector de Planeta', 'Inspecteur Planète')}</span>
          </h3>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/50">
            v2.7
          </span>
        </div>

        {/* Intuitive XML Node Undo/Redo & Revert Controls */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-950/80 border border-slate-800/90 p-1.5 rounded-sm">
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-2 py-1 rounded-sm border text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-all ${
                canUndo
                  ? 'border-cyan-700/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 cursor-pointer'
                  : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
              }`}
              title={tr(lang, 'Undo last XML action (Ctrl+Z)', 'Deshacer último cambio XML (Ctrl+Z)', 'Annuler (Ctrl+Z)')}
            >
              <Undo2 className="w-3 h-3" />
              <span>{tr(lang, 'Undo', 'Deshacer', 'Annuler')}</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`px-2 py-1 rounded-sm border text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-all ${
                canRedo
                  ? 'border-cyan-700/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 cursor-pointer'
                  : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
              }`}
              title={tr(lang, 'Redo XML action (Ctrl+Y)', 'Rehacer cambio XML (Ctrl+Y)', 'Rétablir (Ctrl+Y)')}
            >
              <Redo2 className="w-3 h-3" />
              <span>{tr(lang, 'Redo', 'Rehacer', 'Rétablir')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {onRevertNode && (
              <button
                onClick={onRevertNode}
                disabled={!canRevertNode}
                className={`px-2 py-1 rounded-sm border text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-all ${
                  canRevertNode
                    ? 'border-amber-600/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 cursor-pointer'
                    : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                }`}
                title={tr(
                  lang,
                  'Revert this <Planet> XML node to its initial loaded state',
                  'Revertir este nodo <Planet> a su estado XML original al cargar',
                  'Rétablir ce nœud <Planet> à son état initial'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{tr(lang, 'Revert Node', 'Revertir Nodo', 'Rétablir Nœud')}</span>
              </button>
            )}
            <button
              onClick={() => setShowNodeXmlPreview(!showNodeXmlPreview)}
              className={`p-1 rounded-sm border transition-all cursor-pointer ${
                showNodeXmlPreview
                  ? 'border-cyan-500 bg-cyan-900/40 text-cyan-200'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-cyan-300'
              }`}
              title={tr(lang, 'Inspect live <Planet> XML node', 'Inspeccionar nodo XML <Planet> en vivo', 'Inspecter nœud XML <Planet>')}
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showNodeXmlPreview && (
          <div className="bg-slate-950 border border-cyan-800/50 rounded-sm p-2 max-h-36 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                &lt;Planet Name="{planet.name}"&gt; DOM
              </span>
              {canRevertNode && (
                <span className="text-[8px] font-mono text-amber-400 uppercase">
                  ● {tr(lang, 'Modified', 'Modificado', 'Modifié')}
                </span>
              )}
            </div>
            <pre className="text-[9px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
              {liveNodeXml}
            </pre>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-6">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 p-2 rounded text-red-400 text-xs font-bold leading-tight">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.planetEditor.baseName}</label>
              <HelpCircle className="w-3 h-3 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.baseNameHelp} />
            </div>
            <input
              type="text"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-900/40 px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.planetEditor.posX}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.posXHelp} />
              </div>
              <input
                type="number"
                step="0.1"
                value={localX}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-center"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.planetEditor.posY}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.posYHelp} />
              </div>
              <input
                type="number"
                step="0.1"
                value={localY}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-center"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.planetEditor.posZ}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.posZHelp} />
              </div>
              <input
                type="number"
                step="0.1"
                value={localZ}
                onChange={(e) => handlePositionChange('z', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider" title="Planet_Credit_Value">{t.planetEditor.baseIncome}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.baseIncomeHelp} />
              </div>
              <input
                type="number"
                value={getPropValue('Planet_Credit_Value')}
                onChange={(e) => updateTag('Planet_Credit_Value', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider" title="Scale_Factor">{t.planetEditor.modelScale}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.modelScaleHelp} />
              </div>
              <input
                type="number"
                step="0.1"
                value={getPropValue('Scale_Factor')}
                onChange={(e) => updateTag('Scale_Factor', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate" title="Special_Structures_Land">{t.planetEditor.landStructs}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.landStructsHelp} />
              </div>
              <input
                type="number"
                value={getPropValue('Special_Structures_Land')}
                onChange={(e) => updateTag('Special_Structures_Land', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-center"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate" title="Special_Structures_Space">{t.planetEditor.spaceStructs}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.spaceStructsHelp} />
              </div>
              <input
                type="number"
                value={getPropValue('Special_Structures_Space')}
                onChange={(e) => updateTag('Special_Structures_Space', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-center"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate" title="Max_Space_Base">{t.planetEditor.starbase}</label>
                <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.starbaseHelp} />
              </div>
              <input
                type="number"
                value={getPropValue('Max_Space_Base')}
                onChange={(e) => updateTag('Max_Space_Base', e.target.value)}
                className="w-full bg-slate-950 border border-cyan-900/40 px-2 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-center"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider" title="Zoomed_Terrain_Index">{t.planetEditor.battleTerrain}</label>
              <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.battleTerrainHelp} />
            </div>
            <select
              value={getPropValue('Zoomed_Terrain_Index')}
              onChange={(e) => updateTag('Zoomed_Terrain_Index', e.target.value)}
              className="w-full bg-slate-950 border border-cyan-900/40 px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="0">Temperate</option>
              <option value="1">Desert</option>
              <option value="2">Swamp</option>
              <option value="3">Volcanic</option>
              <option value="4">Arctic</option>
              <option value="5">Forest</option>
              <option value="6">Urban (Core)</option>
              <option value="7">Asteroid Base</option>
              <option value="8">None / Empty Space</option>
              <option value="9">Aquatic</option>
              <option value="10">Desert / Rocky</option>
              <option value="11">Urban (Gas Giant)</option>
              <option value="12">Jungle</option>
            </select>
          </div>
        </div>

        <hr className="border-cyan-800/30" />

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-[0.2em]">Other XML Nodes</h3>
          {dynamicProps.map((prop, idx) => {
            if (KNOWN_TAGS.includes(prop.tagName)) return null;
            return (
              <div className="space-y-1.5 group" key={idx}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate" title={`<${prop.tagName}>`}>
                      {prop.tagName}
                    </label>
                    <HelpCircle className="w-3 h-3 shrink-0 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.planetEditor.customNodeHelp} />
                  </div>
                  <button
                    onClick={() => handleRemoveNode(idx)}
                    className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 transition-opacity cursor-pointer"
                    title="Remove Node"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={prop.value}
                  onChange={(e) => handleDynamicPropChange(idx, e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-900/40 px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            );
          })}
          {dynamicProps.filter((p) => !KNOWN_TAGS.includes(p.tagName)).length === 0 && (
            <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest text-center mt-4">No additional editable nodes.</p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="New_XML_Tag"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
              className="flex-1 bg-slate-950 border border-cyan-900/40 px-2 py-1.5 text-[10px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 placeholder:text-slate-700"
            />
            <button
              onClick={handleAddNode}
              className="px-2 py-1.5 bg-cyan-900/40 hover:bg-cyan-800 text-cyan-400 rounded-sm transition-colors border border-cyan-800/50 cursor-pointer"
              title={t.planetEditor.addXmlNode}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-cyan-800/30 shrink-0">
        <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded mb-3">
          <div className="text-[9px] text-cyan-700 uppercase font-bold mb-1">Live Coordinates preview</div>
          <div className="flex gap-4 text-[10px] font-mono text-cyan-500/70">
            <span>
              X:<span className="text-cyan-300">{localX.toFixed(1)}</span>
            </span>
            <span>
              Y:<span className="text-cyan-300">{localY.toFixed(1)}</span>
            </span>
            <span>
              Z:<span className="text-cyan-300">{localZ.toFixed(1)}</span>
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="w-full py-2 bg-red-950/40 border border-red-900/50 text-red-500 hover:bg-red-900/40 hover:text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>{t.planetEditor.deletePlanet}</span>
        </button>
      </div>
    </aside>
  );
}
