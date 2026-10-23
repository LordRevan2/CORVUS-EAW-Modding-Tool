import React, { useState, useEffect, useRef } from 'react';
import { 
  parseDialog, 
  serializeDialog, 
  parseTextColorToCss, 
  DialogChapter, 
  DialogLine 
} from '../lib/dialog';
import { DatRecord } from '../lib/dat';
import { useLanguage, tr } from '../i18n';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Edit3, 
  FileText, 
  Volume2, 
  Clock, 
  Sparkles, 
  Grid,
  Search,
  BookOpen,
  ArrowRight,
  Eye,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Layers,
  FileCode,
  Copy,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';

interface DialogEditorProps {
  initialContent: string;
  datRecords: DatRecord[] | null;
  fileName: string;
  onSave: (newContent: string, fileName: string) => void;
  onClose: () => void;
  onAddDatRecord?: (key: string, value: string) => void;
  workspaceFiles?: File[];
  datFileName?: string;
  onLoadDatFile?: (file: File) => Promise<void>;
}

export default function DialogEditor({
  initialContent,
  datRecords,
  fileName,
  onSave,
  onClose,
  onAddDatRecord,
  workspaceFiles = [],
  datFileName = '',
  onLoadDatFile
}: DialogEditorProps) {
  const lang = useLanguage();
  const [chapters, setChapters] = useState<DialogChapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'split' | 'raw'>('visual');
  const [rawText, setRawText] = useState(initialContent);
  const [parseError, setParseError] = useState<string | null>(null);

  // Playback Simulation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackLineIndex, setPlaybackLineIndex] = useState<number>(-1);
  const [playbackTextList, setPlaybackTextList] = useState<Array<{ text: string; color: string; newlineCount: number }>>([]);
  const [simulatedSfx, setSimulatedSfx] = useState<string | null>(null);
  const [sfxFlash, setSfxFlash] = useState(false);
  
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse initial content
  useEffect(() => {
    try {
      const parsed = parseDialog(initialContent);
      setChapters(parsed);
      setRawText(initialContent);
      if (parsed.length > 0) {
        setSelectedChapterId(parsed[0].id);
      } else {
        setSelectedChapterId(null);
      }
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || "Failed to parse dialog file");
    }
  }, [initialContent]);

  // Sync chapters to raw code when modified in visual mode
  const syncChaptersToRaw = (updatedChapters: DialogChapter[]) => {
    const serialized = serializeDialog(updatedChapters);
    setRawText(serialized);
    return serialized;
  };

  // Helper to resolve translation key
  const resolveTranslation = (key: string, chapterLines: DialogLine[], currentLineIndex: number): string => {
    if (!key) return '';
    
    // 1. Try to find in DAT records if available
    if (datRecords) {
      const r = datRecords.find(rec => rec.key.trim().toUpperCase() === key.trim().toUpperCase());
      if (r) return r.value;
    }

    // 2. Fall back to search the subsequent comments in the chapter for a translation helper
    for (let i = currentLineIndex + 1; i < Math.min(currentLineIndex + 4, chapterLines.length); i++) {
      const nextLine = chapterLines[i];
      if (nextLine.type === 'comment') {
        // Strip comment hash
        const commentClean = nextLine.value.replace(/^#\s*/, '').trim();
        // Skip metadata hints
        if (!commentClean.toUpperCase().startsWith('TASK:') && !commentClean.toUpperCase().startsWith('TITLE')) {
          return commentClean;
        }
      }
    }

    return `[UNTRANSLATED: ${key}]`;
  };

  const staticPlaybackTextList = React.useMemo(() => {
    const ch = chapters.find(c => c.id === selectedChapterId);
    if (!ch) return [];
    
    let currentColor = 'rgba(255, 255, 255, 1)';
    let tempTextList: Array<{ text: string; color: string; newlineCount: number }> = [];
    
    for (let i = 0; i < ch.lines.length; i++) {
      const line = ch.lines[i];
      if (line.type === 'textcolor') {
        currentColor = parseTextColorToCss(line.value);
      } else if (line.type === 'text' || line.type === 'title') {
        const resolvedText = resolveTranslation(line.value, ch.lines, i);
        tempTextList.push({
          text: resolvedText || `(${line.value})`,
          color: currentColor,
          newlineCount: 0
        });
      } else if (line.type === 'newline') {
        const count = parseInt(line.value, 10) || 1;
        if (tempTextList.length > 0) {
          tempTextList[tempTextList.length - 1].newlineCount += count;
        }
      }
    }
    return tempTextList;
  }, [selectedChapterId, chapters, datRecords]);

  const handleSelectedChapterChange = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    stopPlayback();
  };

  // Timeline commands edits
  const updateLine = (chapterId: number, lineId: string, updatedFields: Partial<DialogLine>) => {
    const updated = chapters.map(ch => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          lines: ch.lines.map(ln => ln.id === lineId ? { ...ln, ...updatedFields } : ln)
        };
      }
      return ch;
    });
    setChapters(updated);
    syncChaptersToRaw(updated);
  };

  const deleteLine = (chapterId: number, lineId: string) => {
    const updated = chapters.map(ch => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          lines: ch.lines.filter(ln => ln.id !== lineId)
        };
      }
      return ch;
    });
    setChapters(updated);
    syncChaptersToRaw(updated);
  };

  const moveLineInChapter = (chapterId: number, lineIndex: number, direction: 'up' | 'down') => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const newIndex = direction === 'up' ? lineIndex - 1 : lineIndex + 1;
    if (newIndex < 0 || newIndex >= chapter.lines.length) return;

    const updatedLines = [...chapter.lines];
    const temp = updatedLines[lineIndex];
    updatedLines[lineIndex] = updatedLines[newIndex];
    updatedLines[newIndex] = temp;

    const updated = chapters.map(ch => {
      if (ch.id === chapterId) {
        return { ...ch, lines: updatedLines };
      }
      return ch;
    });

    setChapters(updated);
    syncChaptersToRaw(updated);
  };

  const insertLineInChapter = (chapterId: number, index: number, type: DialogLine['type']) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    let defaultValue = '';
    if (type === 'wait') defaultValue = '500';
    if (type === 'textcolor') defaultValue = '000 193 091 255';
    if (type === 'text') defaultValue = 'TEXT_STORY_NEW_KEY';
    if (type === 'newline') defaultValue = '1';
    if (type === 'sfx') defaultValue = 'Button_Press';
    if (type === 'comment') defaultValue = '# Nuevo comentario';

    const newLine: DialogLine = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
      type,
      value: defaultValue
    };

    const newLines = [...chapter.lines];
    newLines.splice(index + 1, 0, newLine);

    const updated = chapters.map(ch => {
      if (ch.id === chapterId) {
        return { ...ch, lines: newLines };
      }
      return ch;
    });

    setChapters(updated);
    syncChaptersToRaw(updated);
  };

  const handleAddNewChapter = () => {
    const maxId = chapters.length > 0 ? Math.max(...chapters.map(c => c.id)) : -1;
    const nextId = maxId + 1;

    const newChapter: DialogChapter = {
      id: nextId,
      lines: [
        { id: Math.random().toString(), type: 'comment', value: '# Transmisión del Capítulo' },
        { id: Math.random().toString(), type: 'wait', value: '500' },
        { id: Math.random().toString(), type: 'sfx', value: 'Button_Press' },
        { id: Math.random().toString(), type: 'textcolor', value: '109 247 255 255' },
        { id: Math.random().toString(), type: 'text', value: 'TEXT_STORY_TRANSMISSION_INTRO' },
      ]
    };

    const updated = [...chapters, newChapter].sort((a,b) => a.id - b.id);
    setChapters(updated);
    setSelectedChapterId(nextId);
    syncChaptersToRaw(updated);
  };

  const handleDeleteChapter = (chId: number) => {
    if (!confirm(`Delete Chapter [CHAPTER ${chId}]?`)) return;
    const updated = chapters.filter(c => c.id !== chId);
    setChapters(updated);
    if (selectedChapterId === chId) {
      setSelectedChapterId(updated.length > 0 ? updated[0].id : null);
    }
    syncChaptersToRaw(updated);
  };

  const handleRawTextChange = (val: string) => {
    setRawText(val);
    try {
      const parsed = parseDialog(val);
      setChapters(parsed);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || "Strict Syntax Parsing Error");
    }
  };

  const handleSaveAll = () => {
    onSave(rawText, fileName);
    alert("Díalog script autosynced and saved to workspace successfully!");
  };

  // SIMULATOR RUNNER
  const stopPlayback = () => {
    setIsPlaying(false);
    setPlaybackLineIndex(-1);
    setPlaybackTextList([]);
    setSimulatedSfx(null);
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  const playChapterSimulation = () => {
    if (selectedChapterId === null) return;
    const ch = chapters.find(c => c.id === selectedChapterId);
    if (!ch) return;

    stopPlayback();
    setIsPlaying(true);
    
    let currentLineIdx = 0;
    let currentColor = 'rgba(255, 255, 255, 1)';
    let tempTextList: Array<{ text: string; color: string; newlineCount: number }> = [];

    const playNext = () => {
      if (currentLineIdx >= ch.lines.length) {
        setIsPlaying(false);
        return;
      }

      setPlaybackLineIndex(currentLineIdx);
      const line = ch.lines[currentLineIdx];

      let delay = 350; // standard command step delay

      if (line.type === 'textcolor') {
        currentColor = parseTextColorToCss(line.value);
      } else if (line.type === 'sfx') {
        setSimulatedSfx(line.value);
        setSfxFlash(true);
        setTimeout(() => setSfxFlash(false), 200);
        
        // Attempt browser synthesized click just for playfulness
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.frequency.setValueAtTime(line.value.toLowerCase().includes('press') ? 850 : 350, context.currentTime);
          gain.gain.setValueAtTime(0.08, context.currentTime);
          osc.start();
          osc.stop(context.currentTime + 0.08);
        } catch(e) {}

      } else if (line.type === 'wait') {
        const ms = parseInt(line.value, 10);
        if (!isNaN(ms)) {
          delay = ms;
        } else {
          delay = 1200; // wait speech long delay
        }
      } else if (line.type === 'text' || line.type === 'title') {
        const resolvedText = resolveTranslation(line.value, ch.lines, currentLineIdx);
        tempTextList.push({
          text: resolvedText || `(${line.value})`,
          color: currentColor,
          newlineCount: 0
        });
        setPlaybackTextList([...tempTextList]);
        delay = Math.max(800, resolvedText.length * 35); // dynamic reading delay
      } else if (line.type === 'newline') {
        const count = parseInt(line.value, 10) || 1;
        if (tempTextList.length > 0) {
          tempTextList[tempTextList.length - 1].newlineCount += count;
          setPlaybackTextList([...tempTextList]);
        }
      }

      currentLineIdx++;
      playbackTimerRef.current = setTimeout(playNext, delay);
    };

    playNext();
  };

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, []);

  const filteredChapters = chapters.filter(ch => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const chComment = ch.comment?.toLowerCase() || '';
    const matchLine = ch.lines.some(l => l.value.toLowerCase().includes(q) || (l.rawComment && l.rawComment.toLowerCase().includes(q)));
    return ch.id.toString().includes(q) || chComment.includes(q) || matchLine;
  });

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-950 text-slate-100 border border-slate-900 rounded-sm shadow-2xl relative">
      {/* Unified CORVUS Tactical HUD Header (v1.1) */}
      <div className="h-14 border-b border-cyan-900/60 bg-slate-900/90 px-4 flex items-center justify-between shrink-0 gap-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>{tr(lang, 'DIALOG & NARRATIVE EDITOR', 'EDITOR DE DIÁLOGOS Y GUIONES', 'ÉDITEUR DE DIALOGUES ET RÉCITS')}</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/50">
                v1.1
              </span>
              <span className="px-2 py-0.5 rounded-sm bg-slate-950 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-tighter">
                {chapters.length} {tr(lang, 'Chapters', 'Capítulos', 'Chapitres')}
              </span>
            </div>
            <h2 className="text-[11px] font-mono text-slate-400 truncate max-w-md">{fileName}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode Selectors */}
          <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-sm mr-2 select-none">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1 text-[9px] uppercase font-mono tracking-wider font-bold rounded-sm transition-colors cursor-pointer ${
                viewMode === 'visual' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tr(lang, 'Visual Builder', 'Constructor Visual', 'Constructeur Visuel')}
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-[9px] uppercase font-mono tracking-wider font-bold rounded-sm transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tr(lang, 'Split Screen', 'Vista Dividida', 'Écran Scindé')}
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-[9px] uppercase font-mono tracking-wider font-bold rounded-sm transition-colors cursor-pointer ${
                viewMode === 'raw' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tr(lang, 'Raw Code', 'Código Crudo', 'Code Brut')}
            </button>

            <span className="w-px h-4 bg-slate-800 mx-1"></span>

            {workspaceFiles && workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.dat')).length > 0 ? (
              <div className="flex items-center space-x-1 px-1">
                <select
                  value={datFileName || ''}
                  onChange={async (e) => {
                    const chosenVal = e.target.value;
                    const foundFile = workspaceFiles.find(f => f.webkitRelativePath === chosenVal || f.name === chosenVal);
                    if (foundFile && onLoadDatFile) {
                      await onLoadDatFile(foundFile);
                    }
                  }}
                  className="bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-yellow-500 uppercase py-1 px-2.5 rounded-sm outline-none focus:border-cyan-800 max-w-[140px] truncate cursor-pointer"
                  title={tr(lang, 'Select active localization database (.DAT) file', 'Seleccionar archivo .DAT de localización activo', 'Sélectionner le fichier de localisation (.DAT) actif')}
                >
                  <option value="" disabled>{tr(lang, 'Select .DAT File...', 'Seleccionar .DAT...', 'Choisir .DAT...')}</option>
                  {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.dat')).map(f => (
                    <option key={f.name} value={f.webkitRelativePath || f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-[9px] font-mono text-slate-500 px-1.5">
                {tr(lang, 'No .DAT files found', 'Sin archivos .DAT', 'Aucun fichier .DAT')}
              </span>
            )}

            <div className="relative">
              <input
                type="file"
                id="dialog-dat-upload-direct"
                accept=".dat"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && onLoadDatFile) {
                    await onLoadDatFile(file);
                  }
                }}
              />
              <label
                htmlFor="dialog-dat-upload-direct"
                className="px-2 py-1 bg-yellow-950/25 hover:bg-yellow-900/30 text-[9px] font-mono text-yellow-500 hover:text-yellow-400 border border-yellow-900/40 hover:border-yellow-500/50 rounded-sm transition-all cursor-pointer uppercase font-bold text-center block"
                title={tr(lang, 'Import/Load a local .DAT file from your computer', 'Importar archivo .DAT local', 'Importer un fichier .DAT local')}
              >
                {tr(lang, 'Import .DAT', 'Importar .DAT', 'Importer .DAT')}
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 cursor-pointer rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            title={tr(lang, 'Save Dialog file', 'Guardar archivo de diálogo', 'Enregistrer le fichier de dialogue')}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Save Dialog', 'Guardar Diálogo', 'Enregistrer')}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={tr(lang, 'Close Editor', 'Cerrar Editor', 'Fermer l\'Éditeur')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {parseError && (
        <div className="bg-red-950/60 border-b border-red-800/40 text-red-200 p-2.5 px-4 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span><strong>Syntax Error:</strong> {parseError}</span>
          </div>
          <span className="text-[10px] tracking-wider text-red-400 uppercase font-mono">Check Dialog Format</span>
        </div>
      )}

      {/* Main Multi-grid Body layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-950">
        
        {/* SIDE BAR: Chapters Selection Directory */}
        <div className="w-64 border-r border-slate-900 bg-slate-960 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-900">
            <div className="relative font-mono">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Chapter..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 font-bold text-[10px] tracking-widest py-2 pl-3 pr-8 rounded-sm focus:outline-none focus:border-cyan-850 uppercase"
              />
              <Search className="w-3.5 h-3.5 text-slate-650 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredChapters.map((ch) => {
              const isSelected = selectedChapterId === ch.id;
              // Extract preview title or comments
              const firstTitleLine = ch.lines.find(l => l.type === 'title');
              const firstTextLine = ch.lines.find(l => l.type === 'text');
              const previewLabel = firstTitleLine 
                ? firstTitleLine.value 
                : (firstTextLine ? firstTextLine.value : '');
              
              const resolvedPreview = previewLabel 
                ? resolveTranslation(previewLabel, ch.lines, ch.lines.indexOf(firstTitleLine || firstTextLine!))
                : '';

              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectedChapterChange(ch.id)}
                  className={`w-full text-left p-2.5 rounded-sm transition-all group flex items-start justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-850 text-cyan-300'
                      : 'border-transparent hover:bg-slate-900/40 hover:border-slate-850 text-slate-400'
                  }`}
                >
                  <div className="min-w-0 pr-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-100">
                        [CHAPTER {ch.id}]
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {ch.lines.filter(l => l.type !== 'blank').length} CMD
                      </span>
                    </div>

                    {resolvedPreview ? (
                      <p className="text-[10px] text-slate-500 font-sans mt-1 line-clamp-1 italic max-w-full">
                        "{resolvedPreview}"
                      </p>
                    ) : previewLabel ? (
                      <p className="text-[9px] text-slate-600 font-mono mt-1 line-clamp-1 max-w-full">
                        {previewLabel}
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-700 font-mono mt-1 uppercase italic">
                        Empty transmission / vacío
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChapter(ch.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded-sm transition-opacity self-center shrink-0 cursor-pointer"
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {filteredChapters.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-600 italic font-mono uppercase tracking-wider">
                No Chapters Found
              </div>
            )}
          </div>

          <div className="p-2 border-t border-slate-900">
            <button
              onClick={handleAddNewChapter}
              className="w-full flex items-center justify-center space-x-2 border border-dashed border-cyan-900 hover:border-cyan-500 bg-cyan-950/10 hover:bg-cyan-950/30 text-cyan-400 hover:text-cyan-300 py-2 text-[10px] uppercase font-mono tracking-widest font-bold rounded-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </div>
        </div>

        {/* COMPONENT BODY */}
        <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
                 {/* VISUAL & BUILDER PANEL (shown if mode not purely raw) */}
          {(viewMode === 'visual' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              
              {/* HOLOGRAM PREVIEWER INTERACTIVE SIMULATION */}
              <div className="bg-slate-950 border-2 border-cyan-950 rounded-sm relative overflow-hidden flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.03)] group" style={{ height: '240px' }}>
                
                {/* Retro Monitor Glare Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] pointer-events-none opacity-40"></div>
                
                {/* Matrix overlay scanline */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950 pointer-events-none opacity-30"></div>

                {/* Sound Action Overlay Alert */}
                {sfxFlash && (
                  <div className="absolute inset-0 bg-cyan-500/10 border-2 border-cyan-400 z-10 transition-all duration-75 flex items-center justify-center">
                    <div className="bg-slate-950 border border-cyan-400 px-4 py-1.5 rounded-sm flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-widest anim-pulse">
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>PLAYING SFX: {simulatedSfx}</span>
                    </div>
                  </div>
                )}

                {/* Monitor Top Status Indicators */}
                <div className="bg-slate-930/80 p-2.5 px-4 border-b border-cyan-950/80 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-slate-400 select-none z-10">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 ${(isPlaying && selectedChapter) ? 'block' : 'hidden'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${(isPlaying && selectedChapter) ? 'bg-cyan-500' : 'bg-slate-600'}`}></span>
                    </div>
                    <span className="font-bold text-slate-300">HOLO-TERMINAL SIMULATOR // TRANSMISIÓN</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-500 font-bold">CHAPTER: <span className="text-cyan-400 font-bold">{selectedChapter ? selectedChapter.id : 'N/A'}</span></span>
                    <div className="text-[8px] bg-slate-950 text-slate-500 px-1 border border-slate-800 rounded">60 FPS</div>
                  </div>
                </div>

                {/* Play Area Screen Monitor */}
                <div className="flex-1 p-5 font-mono text-xs text-slate-350 overflow-y-auto space-y-2 relative select-text">
                  
                  {selectedChapter ? (
                    <div className="relative h-full">
                      <div className={`space-y-3 transition-all duration-300 ${!isPlaying ? 'opacity-30 blur-[2px]' : ''}`}>
                        {(isPlaying ? playbackTextList : staticPlaybackTextList).map((item, idx) => {
                          // Render text blocks
                          return (
                            <div 
                              key={idx} 
                              style={{ color: item.color }} 
                              className="leading-relaxed animate-fade-in font-sans font-medium text-[13px] tracking-wide"
                            >
                              {item.text}
                              {/* Render newlines */}
                              {Array.from({ length: item.newlineCount }).map((_, n) => (
                                <div key={n} className="h-2.5" />
                              ))}
                            </div>
                          );
                        })}
                        {isPlaying && (
                          <div className="text-[10px] text-cyan-500 animate-pulse font-bold tracking-widest pt-2">
                            ▶ RECEIVING ENCRYPTED STREAM...
                          </div>
                        )}
                      </div>

                      {!isPlaying && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 z-20">
                          <div 
                            className="w-12 h-12 rounded-full border border-cyan-900/40 bg-cyan-950/40 backdrop-blur-sm flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-400 hover:bg-cyan-900/60 transition-colors cursor-pointer group"
                            onClick={playChapterSimulation}
                          >
                            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded backdrop-blur-sm">
                            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest select-none drop-shadow-md">INTERACTIVE STORY SIMULATOR</div>
                            <p className="text-[10px] text-cyan-200/50 max-w-sm mt-1 select-none uppercase tracking-wide">
                              Simula los saltos de línea, tiempos de espera, colores y textos reales traducidos desde el DAT en tiempo real.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full border border-slate-900 bg-slate-900/40 flex items-center justify-center text-slate-500">
                        <Volume2 className="w-5 h-5 opacity-60" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest select-none">TERMINAL STANDBY</div>
                        <p className="text-[10px] text-slate-400 max-w-sm mt-1 select-none uppercase tracking-wide">
                          Por favor, selecciona un capítulo de la barra lateral para iniciar la transmisión holográfica y la simulación.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulator Action control bar footer */}
                <div className="bg-slate-935 p-2 px-4 border-t border-cyan-950/80 flex items-center justify-between z-10 font-mono">
                  <div className="flex items-center space-x-2">
                    {selectedChapter ? (
                      isPlaying ? (
                        <button
                          onClick={stopPlayback}
                          className="bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800/50 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          onClick={playChapterSimulation}
                          className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Simulate Chapter</span>
                        </button>
                      )
                    ) : (
                      <button
                        disabled
                        className="bg-slate-950 text-slate-650 border border-slate-900 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-sm opacity-50 cursor-not-allowed flex items-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Simulate Chapter</span>
                      </button>
                    )}
                    
                    {selectedChapter ? (
                      <button
                        onClick={() => { stopPlayback(); playChapterSimulation(); }}
                        className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 px-2 py-1 text-[9px] uppercase font-bold tracking-widest rounded-sm transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restart</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-slate-950 text-slate-650 border border-slate-900 px-2 py-1 text-[9px] uppercase font-bold tracking-widest rounded-sm opacity-50 cursor-not-allowed flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart</span>
                      </button>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-bold">
                    {selectedChapter && isPlaying && playbackLineIndex !== -1 ? (
                      <span className="text-cyan-400 uppercase tracking-wider animate-pulse">
                        CMD {playbackLineIndex + 1} / {selectedChapter.lines.length} : {selectedChapter.lines[playbackLineIndex].type.toUpperCase()}
                      </span>
                    ) : (
                      <span className="uppercase tracking-wider">HOLO CHNL STANDBY</span>
                    )}
                  </div>
                </div>
              </div>

              {/* TIMELINE COMMAND BUILDER */}
              {selectedChapter ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-bold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-cyan-500" />
                      <span>Chapter Playlist / Timeline</span>
                    </h3>
                    <div className="flex items-center space-x-1 bg-slate-900 p-0.5 border border-slate-800 rounded-sm">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold px-1.5">Insert:</span>
                      {[
                        { type: 'text', label: 'Text', color: 'hover:bg-cyan-950 text-cyan-400' },
                        { type: 'wait', label: 'Wait', color: 'hover:bg-yellow-950 text-yellow-400' },
                        { type: 'textcolor', label: 'Color', color: 'hover:bg-emerald-950 text-emerald-400' },
                        { type: 'sfx', label: 'SFX', color: 'hover:bg-purple-950 text-purple-400' },
                        { type: 'newline', label: 'Break', color: 'hover:bg-blue-950 text-blue-400' },
                        { type: 'comment', label: 'Comment', color: 'hover:bg-slate-800 text-slate-400' },
                      ].map((btn) => (
                        <button
                          key={btn.type}
                          onClick={() => insertLineInChapter(selectedChapter.id, selectedChapter.lines.length - 1, btn.type as any)}
                          className={`px-1.5 py-1 text-[9px] uppercase tracking-wider font-bold font-mono transition-all rounded-sm cursor-pointer ${btn.color}`}
                        >
                          + {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline items stack */}
                  <div className="space-y-2 pb-12">
                    {selectedChapter.lines.map((line, idx) => {
                      const isSimulatingThisLine = isPlaying && playbackLineIndex === idx;

                      return (
                        <div
                          key={line.id}
                          className={`p-3 border rounded-sm transition-all relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                            isSimulatingThisLine 
                              ? 'bg-cyan-950/20 border-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                              : line.type === 'comment' 
                              ? 'bg-slate-900/20 border-slate-800/40 text-slate-500 italic' 
                              : line.type === 'blank'
                              ? 'bg-transparent border-dashed border-slate-900/60 py-1'
                              : 'bg-slate-900/40 hover:bg-slate-900/60 border-slate-900 hover:border-slate-800'
                          }`}
                        >
                          
                          {/* Command Header Type Indicator */}
                          <div className="flex items-center space-x-3 shrink-0">
                            {/* Reorder and sorting triggers */}
                            <div className="flex flex-col items-center gap-0.5 text-slate-650">
                              <button
                                disabled={idx === 0}
                                onClick={() => moveLineInChapter(selectedChapter.id, idx, 'up')}
                                className="hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-650 cursor-pointer p-0.5"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={idx === selectedChapter.lines.length - 1}
                                onClick={() => moveLineInChapter(selectedChapter.id, idx, 'down')}
                                className="hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-650 cursor-pointer p-0.5"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Action tag identifier */}
                            <div className="min-w-24">
                              {line.type === 'comment' ? (
                                <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-600">
                                  Comment
                                </span>
                              ) : line.type === 'blank' ? (
                                <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-700">
                                  Empty Line
                                </span>
                              ) : (
                                <span className={`text-[10px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${
                                  line.type === 'text' ? 'text-cyan-400 bg-cyan-950/40 border-cyan-900/40' :
                                  line.type === 'title' ? 'text-amber-400 bg-amber-950/40 border-amber-900/40' :
                                  line.type === 'wait' ? 'text-yellow-400 bg-yellow-950/40 border-yellow-900/40' :
                                  line.type === 'textcolor' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40' :
                                  line.type === 'sfx' ? 'text-purple-400 bg-purple-950/40 border-purple-900/40' :
                                  line.type === 'newline' ? 'text-blue-400 bg-blue-950/40 border-blue-900/40' :
                                  'text-slate-400 bg-slate-950 border-slate-800'
                                }`}>
                                  {line.type}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Center Value Inputs / Translation Lookups */}
                          <div className="flex-1 min-w-0 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                            
                            {/* Main Parameter Input field */}
                            {line.type !== 'blank' && line.type !== 'extra_text' && (
                              <input
                                type="text"
                                value={line.value}
                                onChange={(e) => updateLine(selectedChapter.id, line.id, { value: e.target.value })}
                                placeholder="Command Argument // Valor"
                                className={`bg-slate-950 border text-xs font-mono px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-cyan-600 flex-1 ${
                                  line.type === 'comment' ? 'text-slate-500 border-slate-900 italic' : 'text-slate-100 border-slate-800 font-bold'
                                }`}
                              />
                            )}

                            {/* Special helper for SFX preset drop downs */}
                            {line.type === 'sfx' && (
                              <select
                                value={line.value}
                                onChange={(e) => updateLine(selectedChapter.id, line.id, { value: e.target.value })}
                                className="bg-slate-950 border border-slate-800 text-purple-300 font-mono text-[10px] uppercase py-1 px-1.5 rounded-sm focus:outline-none"
                              >
                                <option value="">Custom SFX</option>
                                <option value="Button_Press">Button_Press</option>
                                <option value="Hologram_Open">Hologram_Open</option>
                                <option value="Transmission_Loop">Transmission_Loop</option>
                                <option value="Incoming_Transmission">Incoming_Transmission</option>
                                <option value="Alarm_Siren">Alarm_Siren</option>
                                <option value="Tactical_Select">Tactical_Select</option>
                              </select>
                            )}

                            {/* Special helper for color visual picker */}
                            {line.type === 'textcolor' && (
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-5 h-5 rounded-sm border border-slate-800 shrink-0"
                                  style={{ backgroundColor: parseTextColorToCss(line.value) }}
                                  title="Active color swatch"
                                />
                                <input 
                                  type="color"
                                  onChange={(e) => {
                                    // Convert pick back to rgb space-separated string for EaW
                                    const hex = e.target.value;
                                    const r = parseInt(hex.slice(1, 3), 16);
                                    const g = parseInt(hex.slice(3, 5), 16);
                                    const b = parseInt(hex.slice(5, 7), 16);
                                    updateLine(selectedChapter.id, line.id, { value: `${r.toString().padStart(3, '0')} ${g.toString().padStart(3, '0')} ${b.toString().padStart(3, '0')} 255` });
                                  }}
                                  className="w-6 h-6 bg-transparent border-0 cursor-pointer shrink-0 outline-none"
                                />
                              </div>
                            )}

                            {/* Translation Preview Box for TEXT lines */}
                            {(line.type === 'text' || line.type === 'title') && (
                              <div className="md:w-60 shrink-0 bg-slate-950 p-2 border border-slate-900/60 rounded-sm text-left relative flex flex-col justify-center">
                                <div className="text-[8px] uppercase tracking-wider text-slate-600 font-mono font-bold mb-0.5 flex items-center justify-between">
                                  <span>Resolved Translation:</span>
                                  {datRecords && !datRecords.some(r => r.key.trim().toUpperCase() === line.value.trim().toUpperCase()) && (
                                    <button
                                      onClick={() => {
                                        if (onAddDatRecord) {
                                          const val = prompt(`Añadir traducción para key: ${line.value}`);
                                          if (val !== null) onAddDatRecord(line.value, val);
                                        }
                                      }}
                                      className="text-[8px] bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-cyan-850 px-1 py-0.2 rounded font-sans cursor-pointer uppercase font-bold"
                                      title="Assign to DAT"
                                    >
                                      + DAT Key
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-snug">
                                  "{resolveTranslation(line.value, selectedChapter.lines, idx) || '[No Value defined]'}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Node action keys */}
                          <div className="flex items-center space-x-1 border-t border-slate-900/50 md:border-t-0 pt-2 md:pt-0 justify-end shrink-0">
                            <button
                              onClick={() => insertLineInChapter(selectedChapter.id, idx, 'text')}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-cyan-400 px-1.5 py-1 text-[9px] font-bold uppercase rounded-sm transition-colors cursor-pointer"
                              title="Insert Command Below"
                            >
                              Insert
                            </button>
                            <button
                              onClick={() => deleteLine(selectedChapter.id, line.id)}
                              className="bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-900 text-slate-450 hover:text-red-400 px-1.5 py-1 text-[9px] font-bold uppercase rounded-sm transition-colors cursor-pointer"
                              title="Remove Command"
                            >
                              Delete
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border border-dashed border-slate-900 bg-slate-950/20 rounded">
                  <BookOpen className="w-10 h-10 text-slate-850 mb-2" />
                  <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">Chapter Timeline Standby</p>
                  <p className="text-slate-650 text-[10px] uppercase font-mono mt-1">Select a chapter from the Directory left panel to display visual tracks</p>
                </div>
              )}

            </div>
          )}

          {/* RAW SOURCE CODE EDITOR PANEL */}
          {(viewMode === 'raw' || viewMode === 'split') && (
            <div className={`border-t md:border-t-0 border-slate-900 bg-slate-960 flex flex-col shrink-0 transition-all ${
              viewMode === 'raw' 
                ? 'flex-1 md:w-auto' 
                : 'w-full md:w-[450px] lg:w-[500px] xl:w-[550px] md:border-l'
            }`}>
              <div className="p-3 bg-slate-920 border-b border-slate-900 flex items-center justify-between font-mono text-[10px] uppercase font-bold text-slate-400 select-none">
                <span className="flex items-center space-x-1.5">
                  <FileCode className="w-4 h-4 text-slate-500" />
                  <span>Interactive Source File Editor</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(rawText);
                    alert("TXT content copied to clipboard!");
                  }}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-300 rounded transitions-colors cursor-pointer font-bold"
                >
                  Copy All
                </button>
              </div>

              <div className="flex-1 p-1 relative">
                <textarea
                  value={rawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  className="w-full h-full bg-slate-955 text-slate-300 font-mono text-xs p-4 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                  placeholder="Paste or write your EaW dialog scripts here..."
                  style={{ tabSize: 4 }}
                />
              </div>

              <div className="p-3 border-t border-slate-900 bg-slate-950 text-[9px] font-mono uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span>EaW Compliant Format</span>
                <span className="text-emerald-500 font-bold">Auto-validating</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
