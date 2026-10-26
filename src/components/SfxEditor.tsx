import React, { useState, useMemo, useRef } from 'react';
import {
  Volume2,
  Save,
  Search,
  X,
  Plus,
  Copy,
  Trash2,
  Upload,
  Play,
  Sliders,
  Table,
  Code,
  Check,
  Radio,
  Music
} from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import { DatRecord } from '../lib/dat';

interface SfxEditorProps {
  initialDoc: XMLDocument;
  fileName: string;
  onClose: () => void;
  onError: (err: string) => void;
  workspaceFiles?: File[];
  datRecords?: DatRecord[] | null;
}

export interface SfxEventData {
  id: string;
  node: Element;
  name: string;
  usePreset: string;
  samples: string;
  minVolume: string;
  maxVolume: string;
  minPitch: string;
  maxPitch: string;
  probability: string;
  playCount: string;
  maxInstances: string;
  volumeSaturationDist: string;
  killsPrevious: string;
  playSequentially: string;
  textId: string;
  category: 'weapon' | 'engine' | 'voice' | 'gui' | 'explosion' | 'music';
}

export function createSampleSfxEventsXmlString(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<SFXEvents>
  <SFXEvent Name="Unit_Turbo_Fire">
    <Use_Preset>Preset_GunS</Use_Preset>
    <Samples>GW_Turbolaser_1.wav, GW_Turbolaser_2.wav, GW_Turbolaser_3.wav</Samples>
    <Min_Volume>85</Min_Volume>
    <Max_Volume>100</Max_Volume>
    <Min_Pitch>92</Min_Pitch>
    <Max_Pitch>108</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>1</Play_Count>
    <Max_Instances>6</Max_Instances>
    <Volume_Saturation_Distance>250.0</Volume_Saturation_Distance>
    <Play_Sequentially>No</Play_Sequentially>
  </SFXEvent>

  <SFXEvent Name="Unit_Ion_Fire">
    <Use_Preset>Preset_GunS</Use_Preset>
    <Samples>GW_Ion_Cannon_1.wav, GW_Ion_Cannon_2.wav</Samples>
    <Min_Volume>80</Min_Volume>
    <Max_Volume>98</Max_Volume>
    <Min_Pitch>88</Min_Pitch>
    <Max_Pitch>104</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>1</Play_Count>
    <Max_Instances>4</Max_Instances>
    <Volume_Saturation_Distance>280.0</Volume_Saturation_Distance>
    <Play_Sequentially>No</Play_Sequentially>
  </SFXEvent>

  <SFXEvent Name="Unit_Torpedo_Fire">
    <Use_Preset>Preset_GunS</Use_Preset>
    <Samples>GW_Proton_Torpedo_1.wav, GW_Proton_Torpedo_2.wav</Samples>
    <Min_Volume>90</Min_Volume>
    <Max_Volume>100</Max_Volume>
    <Min_Pitch>95</Min_Pitch>
    <Max_Pitch>105</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>1</Play_Count>
    <Max_Instances>4</Max_Instances>
    <Volume_Saturation_Distance>320.0</Volume_Saturation_Distance>
    <Play_Sequentially>No</Play_Sequentially>
  </SFXEvent>

  <SFXEvent Name="Unit_Star_Destroyer_Cinematic_Engine_Loop">
    <Use_Preset>Preset_EgL</Use_Preset>
    <Samples>EL_Star_Destroyer_Engine_1.wav</Samples>
    <Min_Volume>75</Min_Volume>
    <Max_Volume>85</Max_Volume>
    <Min_Pitch>98</Min_Pitch>
    <Max_Pitch>102</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>-1</Play_Count>
    <Max_Instances>2</Max_Instances>
    <Volume_Saturation_Distance>400.0</Volume_Saturation_Distance>
  </SFXEvent>

  <SFXEvent Name="Unit_Select_Star_Destroyer">
    <Use_Preset>Preset_UR</Use_Preset>
    <Samples>ISD_Select_01.wav, ISD_Select_02.wav, ISD_Select_03.wav</Samples>
    <Min_Volume>100</Min_Volume>
    <Max_Volume>100</Max_Volume>
    <Min_Pitch>100</Min_Pitch>
    <Max_Pitch>100</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>1</Play_Count>
    <Max_Instances>1</Max_Instances>
    <Kills_Previous_Object_SFX>Yes</Kills_Previous_Object_SFX>
    <Text_ID>TEXT_SFX_ISD_SELECT_SUBTITLE</Text_ID>
  </SFXEvent>

  <SFXEvent Name="Unit_Star_Destroyer_Death_SFX">
    <Use_Preset>Preset_ExpC</Use_Preset>
    <Samples>EXP_Capital_Ship_Large_1.wav, EXP_Capital_Ship_Large_2.wav</Samples>
    <Min_Volume>95</Min_Volume>
    <Max_Volume>100</Max_Volume>
    <Min_Pitch>85</Min_Pitch>
    <Max_Pitch>105</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>1</Play_Count>
    <Max_Instances>3</Max_Instances>
    <Volume_Saturation_Distance>600.0</Volume_Saturation_Distance>
  </SFXEvent>

  <SFXEvent Name="GUI_Button_Press">
    <Use_Preset>Preset_GUI</Use_Preset>
    <Samples>GUI_Click_01.wav</Samples>
    <Min_Volume>90</Min_Volume>
    <Max_Volume>90</Max_Volume>
    <Min_Pitch>100</Min_Pitch>
    <Max_Pitch>100</Max_Pitch>
    <Probability>100</Probability>
    <Play_Count>1</Play_Count>
    <Max_Instances>2</Max_Instances>
  </SFXEvent>
</SFXEvents>`;
}

function getChildValue(el: Element, tagName: string): string {
  const target = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.tagName.toLowerCase() === target) {
      return (child.textContent || '').trim();
    }
  }
  return '';
}

function setChildValue(doc: XMLDocument, el: Element, tagName: string, value: string) {
  const target = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.tagName.toLowerCase() === target) {
      child.textContent = value;
      return;
    }
  }
  if (value.trim() !== '') {
    const newChild = doc.createElement(tagName);
    newChild.textContent = value;
    el.appendChild(newChild);
  }
}

function classifySfxCategory(name: string, preset: string): SfxEventData['category'] {
  const n = `${name} ${preset}`.toLowerCase();
  if (n.includes('fire') || n.includes('laser') || n.includes('ion') || n.includes('torpedo') || n.includes('gun'))
    return 'weapon';
  if (n.includes('engine') || n.includes('loop') || n.includes('ambient') || n.includes('egl')) return 'engine';
  if (n.includes('gui') || n.includes('button') || n.includes('holo') || n.includes('radar')) return 'gui';
  if (n.includes('exp') || n.includes('death') || n.includes('impact') || n.includes('hit')) return 'explosion';
  if (n.includes('music') || n.includes('theme')) return 'music';
  return 'voice';
}

export default function SfxEditor({
  initialDoc,
  fileName: initialFileName,
  onClose,
  onError,
  datRecords
}: SfxEditorProps) {
  const lang = useLanguage();
  const [xmlDoc, setXmlDoc] = useState<XMLDocument>(initialDoc);
  const [currentFileName, setCurrentFileName] = useState<string>(initialFileName);
  const [revision, setRevision] = useState<number>(0);

  const [viewMode, setViewMode] = useState<'inspector' | 'table' | 'raw_xml'>('inspector');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SfxEventData['category']>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newSampleInput, setNewSampleInput] = useState<string>('');
  const [lastAuditionInfo, setLastAuditionInfo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const datMap = useMemo(() => {
    const map = new Map<string, string>();
    if (datRecords) {
      for (const r of datRecords) {
        map.set(r.key.toUpperCase(), r.value);
      }
    }
    return map;
  }, [datRecords]);

  const events = useMemo(() => {
    const list: SfxEventData[] = [];
    const root = xmlDoc.documentElement;
    if (!root) return list;

    for (let i = 0; i < root.children.length; i++) {
      const el = root.children[i];
      if (el.tagName.toLowerCase() !== 'sfxevent') continue;
      const name = el.getAttribute('Name') || `SFXEvent_${i + 1}`;
      const usePreset = getChildValue(el, 'Use_Preset');
      list.push({
        id: `sfx_${i}_${name}`,
        node: el,
        name,
        usePreset,
        samples: getChildValue(el, 'Samples'),
        minVolume: getChildValue(el, 'Min_Volume') || '85',
        maxVolume: getChildValue(el, 'Max_Volume') || '100',
        minPitch: getChildValue(el, 'Min_Pitch') || '95',
        maxPitch: getChildValue(el, 'Max_Pitch') || '105',
        probability: getChildValue(el, 'Probability') || '100',
        playCount: getChildValue(el, 'Play_Count') || '1',
        maxInstances: getChildValue(el, 'Max_Instances') || '3',
        volumeSaturationDist: getChildValue(el, 'Volume_Saturation_Distance') || '200.0',
        killsPrevious: getChildValue(el, 'Kills_Previous_Object_SFX') || 'No',
        playSequentially: getChildValue(el, 'Play_Sequentially') || 'No',
        textId: getChildValue(el, 'Text_ID'),
        category: classifySfxCategory(name, usePreset)
      });
    }
    return list;
  }, [xmlDoc, revision]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        ev.name.toLowerCase().includes(q) ||
        ev.samples.toLowerCase().includes(q) ||
        ev.usePreset.toLowerCase().includes(q)
      );
    });
  }, [events, categoryFilter, searchQuery]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) || filteredEvents[0] || events[0] || null,
    [events, filteredEvents, selectedId]
  );

  const handleUpdateField = (ev: SfxEventData, xmlTag: string, value: string) => {
    setChildValue(xmlDoc, ev.node, xmlTag, value);
    setRevision((r) => r + 1);
  };

  const handleRenameEvent = (ev: SfxEventData, newName: string) => {
    if (!newName.trim()) return;
    ev.node.setAttribute('Name', newName.trim());
    setRevision((r) => r + 1);
  };

  const handleAddSample = (ev: SfxEventData) => {
    const trimmed = newSampleInput.trim();
    if (!trimmed) return;
    const currentList = ev.samples
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const formatted = trimmed.toLowerCase().endsWith('.wav') || trimmed.toLowerCase().endsWith('.mp3')
      ? trimmed
      : `${trimmed}.wav`;
    currentList.push(formatted);
    handleUpdateField(ev, 'Samples', currentList.join(', '));
    setNewSampleInput('');
  };

  const handleRemoveSample = (ev: SfxEventData, targetSample: string) => {
    const currentList = ev.samples
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== targetSample);
    handleUpdateField(ev, 'Samples', currentList.join(', '));
  };

  const handleCreateNewEvent = () => {
    const root = xmlDoc.documentElement;
    if (!root) return;
    const newName = `SFX_Custom_Event_${events.length + 1}`;
    const el = xmlDoc.createElement('SFXEvent');
    el.setAttribute('Name', newName);
    setChildValue(xmlDoc, el, 'Use_Preset', 'Preset_GunS');
    setChildValue(xmlDoc, el, 'Samples', 'Custom_Sound_01.wav');
    setChildValue(xmlDoc, el, 'Min_Volume', '85');
    setChildValue(xmlDoc, el, 'Max_Volume', '100');
    setChildValue(xmlDoc, el, 'Min_Pitch', '95');
    setChildValue(xmlDoc, el, 'Max_Pitch', '105');
    setChildValue(xmlDoc, el, 'Probability', '100');
    setChildValue(xmlDoc, el, 'Play_Count', '1');
    setChildValue(xmlDoc, el, 'Max_Instances', '4');
    setChildValue(xmlDoc, el, 'Volume_Saturation_Distance', '250.0');
    root.insertBefore(el, root.firstChild);
    setRevision((r) => r + 1);
  };

  const handleAuditionSound = (ev: SfxEventData) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const minV = Math.max(0, Math.min(100, parseFloat(ev.minVolume) || 85));
      const maxV = Math.max(minV, Math.min(100, parseFloat(ev.maxVolume) || 100));
      const minP = Math.max(50, Math.min(200, parseFloat(ev.minPitch) || 95));
      const maxP = Math.max(minP, Math.min(200, parseFloat(ev.maxPitch) || 105));

      const rolledVol = Math.round(minV + Math.random() * (maxV - minV));
      const rolledPitch = Math.round(minP + Math.random() * (maxP - minP));
      const pitchRatio = rolledPitch / 100;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const gainVal = (rolledVol / 100) * 0.25;

      if (ev.category === 'weapon') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520 * pitchRatio, now);
        osc.frequency.exponentialRampToValueAtTime(110 * pitchRatio, now + 0.18);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (ev.category === 'explosion') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 * pitchRatio, now);
        osc.frequency.exponentialRampToValueAtTime(32 * pitchRatio, now + 0.45);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
        osc.start(now);
        osc.stop(now + 0.47);
      } else if (ev.category === 'engine') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95 * pitchRatio, now);
        osc.frequency.linearRampToValueAtTime(105 * pitchRatio, now + 0.35);
        gain.gain.setValueAtTime(gainVal * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.42);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660 * pitchRatio, now);
        osc.frequency.setValueAtTime(880 * pitchRatio, now + 0.08);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      const sampleList = ev.samples
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const chosenSample =
        sampleList.length > 0 ? sampleList[Math.floor(Math.random() * sampleList.length)] : 'Synth_Preview.wav';

      setLastAuditionInfo(`${chosenSample} · Vol: ${rolledVol}% · Pitch: ${rolledPitch}%`);
    } catch {
      // ignore if audio context blocked
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      if (doc.getElementsByTagName('parsererror').length > 0) {
        onError(tr(lang, 'Invalid XML syntax in SFXEvents file.', 'Sintaxis XML inválida en archivo SFXEvents.', 'Syntaxe XML invalide.'));
        return;
      }
      setXmlDoc(doc);
      setCurrentFileName(file.name);
      setRevision((r) => r + 1);
    } catch {
      onError(tr(lang, 'Error loading SFXEvents XML.', 'Error al cargar el XML de SFXEvents.', 'Erreur de chargement XML.'));
    }
    e.target.value = '';
  };

  const handleSaveXml = () => {
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(xmlDoc);
    const blob = new Blob([raw], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'SFXEvents.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-pink-900/50 bg-slate-900/90 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-pink-500/15 border border-pink-500/40 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-pink-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-pink-300 truncate">
                {tr(
                  lang,
                  'Alamo Audio & SFXEvents Studio',
                  'Estudio de Audio y Efectos SFXEvents.xml',
                  'Studio Audio & SFXEvents.xml'
                )}
              </h2>
              <span className="text-[10px] font-mono text-pink-400">v1.0</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-slate-400 truncate">{currentFileName}</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 truncate">
              {events.length} {tr(lang, 'Audio Events Configured', 'Eventos de Audio Configurados', 'Événements Audio Configurés')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-sm">
            <button
              onClick={() => setViewMode('inspector')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded-xs transition-colors cursor-pointer ${
                viewMode === 'inspector' ? 'bg-pink-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tr(lang, 'Acoustic Inspector', 'Inspector Acústico', 'Inspecteur Acoustique')}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-pink-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tr(lang, 'Table', 'Tabla', 'Tableau')}
            </button>
            <button
              onClick={() => setViewMode('raw_xml')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase rounded-xs transition-colors cursor-pointer ${
                viewMode === 'raw_xml' ? 'bg-pink-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XML
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept=".xml" onChange={handleImportFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-pink-400" />
            <span>{tr(lang, 'Import XML', 'Importar XML', 'Importer XML')}</span>
          </button>

          <button
            onClick={handleSaveXml}
            className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Export XML', 'Exportar XML', 'Exporter XML')}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'inspector' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar List */}
          <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  SFXEvents ({filteredEvents.length})
                </span>
                <button
                  onClick={handleCreateNewEvent}
                  className="px-2 py-1 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-mono uppercase rounded-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{tr(lang, 'New SFX', 'Nuevo SFX', 'Nouveau SFX')}</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr(lang, 'Search SFX or .wav...', 'Buscar SFX o .wav...', 'Chercher SFX ou .wav...')}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-sm pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                {(
                  [
                    { id: 'all', label: tr(lang, 'All', 'Todos', 'Tous') },
                    { id: 'weapon', label: tr(lang, 'Weapons', 'Armas', 'Armes') },
                    { id: 'engine', label: tr(lang, 'Engines', 'Motores', 'Moteurs') },
                    { id: 'voice', label: tr(lang, 'Voices', 'Voces', 'Voix') },
                    { id: 'explosion', label: tr(lang, 'Explosions', 'Explosiones', 'Explosions') },
                    { id: 'gui', label: 'GUI' }
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2 py-0.5 rounded-xs uppercase transition-colors cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-pink-600/30 text-pink-200 border border-pink-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredEvents.map((ev) => {
                const isSelected = selectedEvent?.id === ev.id;
                const sampleCount = ev.samples
                  .split(/[\s,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean).length;
                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedId(ev.id)}
                    className={`w-full text-left p-2.5 rounded-sm border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-pink-950/40 border-pink-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold truncate">{ev.name}</span>
                      <span className="text-[9px] font-mono text-pink-400 uppercase">{ev.category}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-between tabular-nums">
                      <span>
                        {sampleCount} .wav · {ev.usePreset || 'Custom'}
                      </span>
                      <span>
                        Vol {ev.minVolume}–{ev.maxVolume}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Acoustic Inspector */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {selectedEvent ? (
              <div className="max-w-4xl space-y-6">
                {/* Header & Audition Synth */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-[240px]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400 block">
                      SFXEvent Name
                    </span>
                    <input
                      type="text"
                      value={selectedEvent.name}
                      onChange={(e) => handleRenameEvent(selectedEvent, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-sm px-3 py-1.5 text-sm font-mono font-bold text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    {lastAuditionInfo && (
                      <span className="text-[10px] font-mono text-cyan-300 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-sm tabular-nums">
                        {lastAuditionInfo}
                      </span>
                    )}
                    <button
                      onClick={() => handleAuditionSound(selectedEvent)}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-sm flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {tr(lang, 'Test Pitch & Volume Roll', 'Probar Variación Pitch/Vol', 'Tester Pitch & Volume')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Acoustic Envelope & 3D Attenuation Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-bold block">
                      {tr(
                        lang,
                        '1. Dynamic Volume & Pitch Randomizer',
                        '1. Rango Dinámico de Volumen y Tono (Pitch)',
                        '1. Plage Dynamique Volume & Pitch'
                      )}
                    </span>

                    <div className="space-y-3 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1 tabular-nums">
                          <span className="text-slate-400">Min_Volume / Max_Volume</span>
                          <span className="text-pink-300 font-bold">
                            {selectedEvent.minVolume}% — {selectedEvent.maxVolume}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={parseInt(selectedEvent.minVolume, 10) || 0}
                            onChange={(e) => handleUpdateField(selectedEvent, 'Min_Volume', e.target.value)}
                            className="accent-pink-500 cursor-pointer"
                          />
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={parseInt(selectedEvent.maxVolume, 10) || 100}
                            onChange={(e) => handleUpdateField(selectedEvent, 'Max_Volume', e.target.value)}
                            className="accent-pink-400 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1 tabular-nums">
                          <span className="text-slate-400">Min_Pitch / Max_Pitch (100 = 1.0x)</span>
                          <span className="text-cyan-300 font-bold">
                            {selectedEvent.minPitch}% — {selectedEvent.maxPitch}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="range"
                            min={50}
                            max={150}
                            value={parseInt(selectedEvent.minPitch, 10) || 95}
                            onChange={(e) => handleUpdateField(selectedEvent, 'Min_Pitch', e.target.value)}
                            className="accent-cyan-500 cursor-pointer"
                          />
                          <input
                            type="range"
                            min={50}
                            max={150}
                            value={parseInt(selectedEvent.maxPitch, 10) || 105}
                            onChange={(e) => handleUpdateField(selectedEvent, 'Max_Pitch', e.target.value)}
                            className="accent-cyan-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3D Attenuation & Concurrency */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-3 font-mono text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold block">
                      {tr(
                        lang,
                        '2. 3D Spatialization & Polyphony Limits',
                        '2. Espacialización 3D y Límites de Polifonía',
                        '2. Spatialisation 3D & Polyphonie'
                      )}
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Use_Preset&gt;</label>
                        <input
                          type="text"
                          value={selectedEvent.usePreset}
                          onChange={(e) => handleUpdateField(selectedEvent, 'Use_Preset', e.target.value)}
                          placeholder="Preset_GunS"
                          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">
                          &lt;Max_Instances&gt;
                        </label>
                        <input
                          type="number"
                          value={selectedEvent.maxInstances}
                          onChange={(e) => handleUpdateField(selectedEvent, 'Max_Instances', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-amber-300 tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">
                          &lt;Volume_Saturation_Distance&gt;
                        </label>
                        <input
                          type="number"
                          value={selectedEvent.volumeSaturationDist}
                          onChange={(e) =>
                            handleUpdateField(selectedEvent, 'Volume_Saturation_Distance', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-cyan-300 tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase text-slate-400 block mb-1">
                          &lt;Probability&gt; (%)
                        </label>
                        <input
                          type="number"
                          value={selectedEvent.probability}
                          onChange={(e) => handleUpdateField(selectedEvent, 'Probability', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-emerald-300 tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audio Samples (.WAV / .MP3) Pool */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      {tr(
                        lang,
                        '3. Audio Samples Pool (<Samples> — Data/Audio/SFX/)',
                        '3. Pool de Archivos de Sonido (<Samples> — Data/Audio/SFX/)',
                        '3. Fichiers Audio (<Samples> — Data/Audio/SFX/)'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSampleInput}
                      onChange={(e) => setNewSampleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSample(selectedEvent);
                      }}
                      placeholder="GW_New_Laser_01.wav"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-sm px-3 py-1.5 text-xs font-mono text-slate-200"
                    />
                    <button
                      onClick={() => handleAddSample(selectedEvent)}
                      className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs uppercase rounded-sm flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tr(lang, 'Add .WAV', 'Añadir .WAV', 'Ajouter .WAV')}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedEvent.samples
                      .split(/[\s,]+/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((sample, idx) => (
                        <div
                          key={`${sample}_${idx}`}
                          className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-sm flex items-center space-x-2 text-xs font-mono"
                        >
                          <Music className="w-3.5 h-3.5 text-pink-400" />
                          <span className="text-slate-200">{sample}</span>
                          <button
                            onClick={() => handleRemoveSample(selectedEvent, sample)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Subtitle Localization Link */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-2 font-mono text-xs">
                  <label className="text-[10px] uppercase text-purple-400 font-bold block">
                    &lt;Text_ID&gt; ({tr(lang, 'Optional Radio Subtitle in .DAT', 'Subtítulo Opcional en .DAT', 'Sous-titre .DAT')})
                  </label>
                  <input
                    type="text"
                    value={selectedEvent.textId}
                    onChange={(e) => handleUpdateField(selectedEvent, 'Text_ID', e.target.value)}
                    placeholder="TEXT_SFX_UNIT_RESPONSE"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-sm px-3 py-1.5 text-purple-300"
                  />
                  {selectedEvent.textId && datMap.get(selectedEvent.textId.toUpperCase()) && (
                    <div className="text-[11px] text-slate-300 bg-slate-950 border border-purple-900/40 p-2 rounded-sm">
                      “{datMap.get(selectedEvent.textId.toUpperCase())}”
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 bg-slate-900/80">
                <th className="p-2.5">SFXEvent Name</th>
                <th className="p-2.5">Preset</th>
                <th className="p-2.5">Samples (.WAV)</th>
                <th className="p-2.5 text-right">Volume (%)</th>
                <th className="p-2.5 text-right">Pitch (%)</th>
                <th className="p-2.5 text-right">3D Dist</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => {
                    setSelectedId(ev.id);
                    setViewMode('inspector');
                  }}
                  className="border-b border-slate-900 hover:bg-slate-900/60 cursor-pointer"
                >
                  <td className="p-2.5 font-bold text-pink-300">{ev.name}</td>
                  <td className="p-2.5 text-slate-300">{ev.usePreset}</td>
                  <td className="p-2.5 text-slate-400 truncate max-w-md">{ev.samples}</td>
                  <td className="p-2.5 text-right tabular-nums text-slate-200">
                    {ev.minVolume}–{ev.maxVolume}
                  </td>
                  <td className="p-2.5 text-right tabular-nums text-cyan-300">
                    {ev.minPitch}–{ev.maxPitch}
                  </td>
                  <td className="p-2.5 text-right tabular-nums text-amber-300">{ev.volumeSaturationDist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw XML View */}
      {viewMode === 'raw_xml' && (
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <pre className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-sm font-mono text-xs text-slate-300 overflow-auto custom-scrollbar">
            {new XMLSerializer().serializeToString(xmlDoc)}
          </pre>
        </div>
      )}
    </div>
  );
}
