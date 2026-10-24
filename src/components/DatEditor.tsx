import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Upload,
  X, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Copy, 
  Check, 
  AlertCircle, 
  FileText, 
  Type, 
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  Undo2,
  Redo2,
  ArrowUpDown,
  Replace,
  GitCompare,
  Layers,
  Code,
  Wand2,
  FileSpreadsheet,
  Folder,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DatRecord, serializeDatFile, parseDatFile, getCrc32, formatCrc32Hex } from '../lib/dat';
import { useTranslation, useLanguage, tr } from '../i18n';

interface DatEditorProps {
  initialRecords: DatRecord[];
  fileName: string;
  onClose: () => void;
  format?: 'indexed' | 'sequential_mult2' | 'sequential_mult1';
  workspaceFiles?: File[];
  onUpdateRecords?: (records: DatRecord[], fileName?: string, format?: 'indexed' | 'sequential_mult2' | 'sequential_mult1') => void;
}

type PrefixCategory = 'all' | 'units' | 'planets' | 'story' | 'ui' | 'heroes';
type StatusFilter = 'all' | 'empty' | 'duplicates' | 'untranslated_ref' | 'long';
type SortMode = 'original' | 'key_asc' | 'key_desc' | 'crc_asc' | 'len_desc';
type SearchScope = 'both' | 'key' | 'value';

export default function DatEditor({
  initialRecords,
  fileName: initialFileName,
  onClose,
  format: initialFormat = 'indexed',
  workspaceFiles = [],
  onUpdateRecords
}: DatEditorProps) {
  const t = useTranslation();
  const lang = useLanguage();

  const [records, setRecordsState] = useState<DatRecord[]>(initialRecords);
  const [editableFileName, setEditableFileName] = useState<string>(initialFileName || 'MasterTextFile.dat');
  const [activeFormat, setActiveFormat] = useState<'indexed' | 'sequential_mult2' | 'sequential_mult1'>(initialFormat);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    initialRecords.length > 0 ? initialRecords[0].id : null
  );

  // Undo / Redo History Stack
  const [history, setHistory] = useState<DatRecord[][]>([initialRecords]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushRecordsUpdate = useCallback((nextRecords: DatRecord[] | ((prev: DatRecord[]) => DatRecord[]), recordHistory = true) => {
    setRecordsState(prev => {
      const resolved = typeof nextRecords === 'function' ? nextRecords(prev) : nextRecords;
      if (recordHistory) {
        setHistory(h => {
          const sliced = h.slice(0, historyIndex + 1);
          const next = [...sliced, resolved];
          if (next.length > 35) next.shift();
          return next;
        });
        setHistoryIndex(idx => Math.min(idx + 1, 34));
      }
      if (onUpdateRecords) {
        onUpdateRecords(resolved, editableFileName, activeFormat);
      }
      return resolved;
    });
  }, [historyIndex, onUpdateRecords, editableFileName, activeFormat]);

  // Sync when parent initialRecords / initialFileName change (e.g. loading another file)
  useEffect(() => {
    setRecordsState(initialRecords);
    setEditableFileName(initialFileName || 'MasterTextFile.dat');
    setActiveFormat(initialFormat);
    setHistory([initialRecords]);
    setHistoryIndex(0);
    setSelectedRecordId(initialRecords.length > 0 ? initialRecords[0].id : null);
  }, [initialRecords, initialFileName, initialFormat]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const target = history[nextIdx];
      setHistoryIndex(nextIdx);
      setRecordsState(target);
      if (onUpdateRecords) onUpdateRecords(target, editableFileName, activeFormat);
    }
  }, [history, historyIndex, onUpdateRecords, editableFileName, activeFormat]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const target = history[nextIdx];
      setHistoryIndex(nextIdx);
      setRecordsState(target);
      if (onUpdateRecords) onUpdateRecords(target, editableFileName, activeFormat);
    }
  }, [history, historyIndex, onUpdateRecords, editableFileName, activeFormat]);

  // Keyboard shortcuts for Undo/Redo and Find
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditingInput = activeTag === 'input' || activeTag === 'textarea';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !isEditingInput) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isEditingInput) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Search, Prefix Category, Status Filter & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('both');
  const [prefixCategory, setPrefixCategory] = useState<PrefixCategory>('all');
  const [filterType, setFilterType] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('original');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Panels & Modals State
  const [activeToolPanel, setActiveToolPanel] = useState<'none' | 'bulk' | 'replace' | 'pack' | 'compare'>('none');
  const [showInGamePreview, setShowInGamePreview] = useState<boolean>(true);

  // Bulk Import / Export state
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'merge' | 'prepend'>('merge');
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);

  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replaceTarget, setReplaceTarget] = useState<'value' | 'key'>('value');
  const [replaceCaseSensitive, setReplaceCaseSensitive] = useState(false);

  // Entity Key Pack Generator state
  const [packType, setPackType] = useState<'unit' | 'planet' | 'hero' | 'building'>('unit');
  const [packIdentifier, setPackIdentifier] = useState('');
  const [packDisplayName, setPackDisplayName] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packTooltip, setPackTooltip] = useState('');

  // Bilingual Reference .DAT Comparison state
  const [referenceRecords, setReferenceRecords] = useState<DatRecord[] | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const uploadDatInputRef = useRef<HTMLInputElement>(null);

  // Copy Feedback & Toast state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Confirmation State
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Workspace .DAT files
  const workspaceDatFiles = useMemo(() => {
    return workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.dat'));
  }, [workspaceFiles]);

  // Reference Map (Key Uppercase -> Value)
  const referenceMap = useMemo(() => {
    if (!referenceRecords) return null;
    const map = new Map<string, string>();
    for (const r of referenceRecords) {
      map.set(r.key.trim().toUpperCase(), r.value);
    }
    return map;
  }, [referenceRecords]);

  // Missing keys in current .DAT compared to Reference .DAT
  const missingFromCurrentRecords = useMemo(() => {
    if (!referenceRecords) return [];
    const currentSet = new Set(records.map(r => r.key.trim().toUpperCase()));
    return referenceRecords.filter(r => !currentSet.has(r.key.trim().toUpperCase()));
  }, [records, referenceRecords]);

  // Current selected record
  const selectedRecord = useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Statistics & Diagnostics
  const {
    total,
    emptyCount,
    duplicateKeysCount,
    uniqueKeysCount,
    duplicateKeysSet,
    untranslatedRefCount,
    estimatedBinarySizeKb
  } = useMemo(() => {
    const total = records.length;
    let emptyCount = 0;
    const uniqueKeys = new Set<string>();
    const duplicateKeysSet = new Set<string>();
    let duplicateKeysCount = 0;
    let untranslatedRefCount = 0;
    let totalBytes = 4 + total * 12;

    for (const r of records) {
      const trimmedVal = r.value.trim();
      if (!trimmedVal) {
        emptyCount++;
      }
      const normKey = r.key.trim().toUpperCase();
      if (uniqueKeys.has(normKey)) {
        duplicateKeysCount++;
        duplicateKeysSet.add(normKey);
      } else {
        uniqueKeys.add(normKey);
      }
      if (referenceMap) {
        const refVal = referenceMap.get(normKey);
        if (refVal && refVal.trim() !== '' && r.value.trim() === refVal.trim()) {
          untranslatedRefCount++;
        }
      }
      totalBytes += r.key.length + r.value.length * 2;
    }

    return {
      total,
      emptyCount,
      duplicateKeysCount,
      uniqueKeysCount: uniqueKeys.size,
      duplicateKeysSet,
      untranslatedRefCount,
      estimatedBinarySizeKb: (totalBytes / 1024).toFixed(1)
    };
  }, [records, referenceMap]);

  // Helper to match Prefix Category
  const matchesPrefixCategory = useCallback((keyUpper: string, category: PrefixCategory): boolean => {
    if (category === 'all') return true;
    if (category === 'units') {
      return keyUpper.startsWith('TEXT_UNIT_') || keyUpper.startsWith('TEXT_SQUADRON_') || keyUpper.startsWith('TEXT_GROUND_') || keyUpper.startsWith('TEXT_SPACE_') || keyUpper.startsWith('TEXT_STARBASE_');
    }
    if (category === 'planets') {
      return keyUpper.startsWith('TEXT_PLANET_') || keyUpper.startsWith('TEXT_SYSTEM_') || keyUpper.startsWith('TEXT_WEATHER_');
    }
    if (category === 'story') {
      return keyUpper.startsWith('TEXT_STORY_') || keyUpper.startsWith('TEXT_CAMPAIGN_') || keyUpper.startsWith('TEXT_CONQUEST_') || keyUpper.startsWith('TEXT_SPEECH_') || keyUpper.startsWith('TEXT_MISSION_');
    }
    if (category === 'ui') {
      return keyUpper.startsWith('TEXT_UI_') || keyUpper.startsWith('TEXT_TOOLTIP_') || keyUpper.startsWith('TEXT_BUTTON_') || keyUpper.startsWith('TEXT_FACTION_') || keyUpper.startsWith('TEXT_GUI_') || keyUpper.startsWith('TEXT_ENC_');
    }
    if (category === 'heroes') {
      return keyUpper.startsWith('TEXT_HERO_') || keyUpper.startsWith('TEXT_NAMED_') || keyUpper.startsWith('TEXT_ABILITY_') || keyUpper.startsWith('TEXT_SFX_');
    }
    return true;
  }, []);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = records.filter(r => {
      const keyUpper = r.key.trim().toUpperCase();

      // Prefix Category filter
      if (!matchesPrefixCategory(keyUpper, prefixCategory)) return false;

      // Text Search
      if (query) {
        const matchesKey = r.key.toLowerCase().includes(query);
        const matchesVal = r.value.toLowerCase().includes(query);
        const matchesRef = referenceMap ? (referenceMap.get(keyUpper) || '').toLowerCase().includes(query) : false;

        if (searchScope === 'key' && !matchesKey) return false;
        if (searchScope === 'value' && !matchesVal && !matchesRef) return false;
        if (searchScope === 'both' && !matchesKey && !matchesVal && !matchesRef) return false;
      }

      // Status Filter
      if (filterType === 'empty') {
        return !r.value.trim();
      }
      if (filterType === 'duplicates') {
        return duplicateKeysSet.has(keyUpper);
      }
      if (filterType === 'untranslated_ref' && referenceMap) {
        const refVal = referenceMap.get(keyUpper);
        return Boolean(refVal && refVal.trim() !== '' && r.value.trim() === refVal.trim());
      }
      if (filterType === 'long') {
        return r.value.length > 250;
      }
      return true;
    });

    if (sortMode === 'original') return filtered;
    const copy = [...filtered];
    if (sortMode === 'key_asc') {
      copy.sort((a, b) => a.key.localeCompare(b.key));
    } else if (sortMode === 'key_desc') {
      copy.sort((a, b) => b.key.localeCompare(a.key));
    } else if (sortMode === 'crc_asc') {
      copy.sort((a, b) => getCrc32(a.key) - getCrc32(b.key));
    } else if (sortMode === 'len_desc') {
      copy.sort((a, b) => b.value.length - a.value.length);
    }
    return copy;
  }, [records, searchQuery, searchScope, prefixCategory, filterType, sortMode, duplicateKeysSet, matchesPrefixCategory, referenceMap]);

  // Paginated Records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchScope, prefixCategory, filterType, sortMode, itemsPerPage]);

  // Duplicate occurrences of the currently selected record
  const selectedKeyDuplicates = useMemo(() => {
    if (!selectedRecord) return [];
    const norm = selectedRecord.key.trim().toUpperCase();
    return records.filter(r => r.key.trim().toUpperCase() === norm);
  }, [records, selectedRecord]);

  // Handlers
  const handleRecordChange = (id: string, updates: Partial<Pick<DatRecord, 'key' | 'value'>>) => {
    pushRecordsUpdate(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r), true);
  };

  const handleCreateRecord = () => {
    const defaultPrefix =
      prefixCategory === 'units' ? 'TEXT_UNIT_NEW_' :
      prefixCategory === 'planets' ? 'TEXT_PLANET_NEW_' :
      prefixCategory === 'story' ? 'TEXT_STORY_NEW_' :
      prefixCategory === 'ui' ? 'TEXT_UI_NEW_' :
      prefixCategory === 'heroes' ? 'TEXT_HERO_NEW_' : 'TEXT_NEW_KEY_';

    const newRecord: DatRecord = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      key: `${defaultPrefix}${records.length + 1}`,
      value: t.datEditor.toastNewKey
    };
    pushRecordsUpdate(prev => [newRecord, ...prev]);
    setSelectedRecordId(newRecord.id);
    setCurrentPage(1);
    showToast(tr(lang, 'New localization key created', 'Nueva clave de traducción creada', 'Nouvelle clé créée'));
  };

  const handleDuplicateSingleRecord = (rec: DatRecord) => {
    const copyRec: DatRecord = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      key: `${rec.key}_COPY`,
      value: rec.value
    };
    const idx = records.findIndex(r => r.id === rec.id);
    const next = [...records];
    next.splice(idx + 1, 0, copyRec);
    pushRecordsUpdate(next);
    setSelectedRecordId(copyRec.id);
    showToast(tr(lang, 'Key duplicated', 'Clave duplicada', 'Clé dupliquée'));
  };

  const handleDeduplicateAll = () => {
    if (duplicateKeysCount === 0) return;
    const seen = new Map<string, DatRecord>();
    const deduplicated: DatRecord[] = [];

    for (const r of records) {
      const norm = r.key.trim().toUpperCase();
      const existing = seen.get(norm);
      if (!existing) {
        const cleanRec = { ...r, key: r.key.trim() };
        seen.set(norm, cleanRec);
        deduplicated.push(cleanRec);
      } else if (!existing.value.trim() && r.value.trim()) {
        // Prefer non-empty translation if earlier occurrence was empty
        existing.value = r.value;
      }
    }

    const removedCount = records.length - deduplicated.length;
    pushRecordsUpdate(deduplicated);
    showToast(
      tr(
        lang,
        `Cleaned ${removedCount} duplicate keys`,
        `Se han fusionado y eliminado ${removedCount} claves duplicadas`,
        `${removedCount} clés en double supprimées`
      )
    );
  };

  const handleKeepOnlyThisDuplicate = (keepRecord: DatRecord) => {
    const norm = keepRecord.key.trim().toUpperCase();
    const next = records.filter(r => r.key.trim().toUpperCase() !== norm || r.id === keepRecord.id);
    pushRecordsUpdate(next);
    showToast(tr(lang, 'Duplicate occurrences removed', 'Instancias duplicadas eliminadas', 'Doublons supprimés'));
  };

  const confirmDeleteRecord = (id: string) => {
    setRecordToDelete(id);
  };

  const executeDeleteRecord = () => {
    if (recordToDelete) {
      const remaining = records.filter(r => r.id !== recordToDelete);
      pushRecordsUpdate(remaining);
      if (selectedRecordId === recordToDelete) {
        setSelectedRecordId(remaining.length > 0 ? remaining[0].id : null);
      }
      setRecordToDelete(null);
      showToast(tr(lang, 'Key deleted', 'Clave eliminada', 'Clé supprimée'));
    }
  };

  const handleExportDat = () => {
    try {
      const buffer = serializeDatFile(records, activeFormat);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let outName = editableFileName.trim() || 'MasterTextFile.dat';
      if (!outName.toLowerCase().endsWith('.dat')) {
        outName += '.dat';
      }
      a.download = outName;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        tr(
          lang,
          `Compiled ${records.length} keys (${outName})`,
          `Compiladas ${records.length} claves en ${outName}`,
          `${records.length} clés compilées dans ${outName}`
        )
      );
    } catch (err: any) {
      setBulkImportError(`Error al compilar .DAT: ${err.message}`);
    }
  };

  const handleExportFlatFormat = (formatType: 'csv' | 'tsv' | 'json') => {
    let content = '';
    let mime = 'text/plain;charset=utf-8';
    const baseName = (editableFileName.replace(/\.dat$/i, '') || 'MasterTextFile');

    if (formatType === 'json') {
      const obj = records.map(r => ({ key: r.key, value: r.value, crc32: formatCrc32Hex(r.key) }));
      content = JSON.stringify(obj, null, 2);
      mime = 'application/json;charset=utf-8';
    } else if (formatType === 'tsv') {
      content = records.map(r => `${r.key}\t${r.value.replace(/\r?\n/g, '\\n')}`).join('\n');
      mime = 'text/tab-separated-values;charset=utf-8';
    } else {
      const escapeCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
      content = 'Key,Value,CRC32\n' + records.map(r => `${escapeCsv(r.key)},${escapeCsv(r.value)},${formatCrc32Hex(r.key)}`).join('\n');
      mime = 'text/csv;charset=utf-8';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.${formatType}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(tr(lang, `Exported ${baseName}.${formatType}`, `Exportado ${baseName}.${formatType}`, `Exporté ${baseName}.${formatType}`));
  };

  const handleUploadPrimaryDat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseDatFile(buffer);
      setEditableFileName(file.name);
      setActiveFormat(parsed.format);
      pushRecordsUpdate(parsed.records);
      setSelectedRecordId(parsed.records[0]?.id || null);
      showToast(tr(lang, `Loaded ${file.name} (${parsed.records.length} keys)`, `Cargado ${file.name} (${parsed.records.length} claves)`, `Chargé ${file.name}`));
    } catch (err: any) {
      setBulkImportError(err.message || 'Error parsing .DAT file');
    }
    if (uploadDatInputRef.current) uploadDatInputRef.current.value = '';
  };

  const handleSwitchWorkspaceDat = async (pathOrName: string) => {
    const target = workspaceDatFiles.find(f => (f.webkitRelativePath || f.name) === pathOrName);
    if (!target) return;
    try {
      const buffer = await target.arrayBuffer();
      const parsed = parseDatFile(buffer);
      setEditableFileName(target.name);
      setActiveFormat(parsed.format);
      pushRecordsUpdate(parsed.records);
      setSelectedRecordId(parsed.records[0]?.id || null);
      showToast(tr(lang, `Switched to ${target.name}`, `Cambiado a ${target.name}`, `Basculé vers ${target.name}`));
    } catch (err: any) {
      setBulkImportError(err.message || 'Error loading workspace .DAT');
    }
  };

  const handleLoadReferenceDatFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseDatFile(buffer);
      setReferenceRecords(parsed.records);
      setReferenceFileName(file.name);
      showToast(
        tr(
          lang,
          `Reference loaded: ${file.name} (${parsed.records.length} keys)`,
          `Referencia cargada: ${file.name} (${parsed.records.length} claves)`,
          `Référence chargée : ${file.name}`
        )
      );
    } catch (err: any) {
      setBulkImportError(err.message || 'Error parsing reference .DAT');
    }
  };

  const handleImportMissingFromReference = () => {
    if (missingFromCurrentRecords.length === 0) return;
    const clonedMissing: DatRecord[] = missingFromCurrentRecords.map(r => ({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      key: r.key,
      value: r.value
    }));
    pushRecordsUpdate(prev => [...clonedMissing, ...prev]);
    setSelectedRecordId(clonedMissing[0].id);
    setCurrentPage(1);
    showToast(
      tr(
        lang,
        `Imported ${clonedMissing.length} missing keys from ${referenceFileName}`,
        `Importadas ${clonedMissing.length} claves faltantes desde ${referenceFileName}`,
        `${clonedMissing.length} clés manquantes importées`
      )
    );
  };

  const handleCopyText = (text: string, idTag: string, customToast?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(idTag);
      showToast(customToast || t.datEditor.toastCopied);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleBulkImport = () => {
    setBulkImportError(null);
    const raw = bulkText.trim();
    if (!raw) {
      setBulkImportError(t.datEditor.bulkImport.errorNoText);
      return;
    }

    const imported: DatRecord[] = [];
    let errorCount = 0;

    // Support JSON array import if input starts with '['
    if (raw.startsWith('[')) {
      try {
        const parsedJson = JSON.parse(raw);
        if (Array.isArray(parsedJson)) {
          for (const item of parsedJson) {
            if (item && typeof item.key === 'string' && item.key.trim()) {
              imported.push({
                id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
                key: item.key.trim(),
                value: String(item.value ?? '')
              });
            } else {
              errorCount++;
            }
          }
        }
      } catch {
        setBulkImportError(tr(lang, 'Invalid JSON format', 'Formato JSON inválido', 'Format JSON invalide'));
        return;
      }
    } else {
      const lines = raw.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let separator = '\t';
        if (!line.includes('\t')) {
          if (line.includes('=')) separator = '=';
          else if (line.includes(';')) separator = ';';
          else if (line.includes(',')) separator = ',';
          else {
            errorCount++;
            continue;
          }
        }

        const parts = line.split(separator);
        const key = parts[0]?.trim().replace(/^"|"$/g, '');
        const value = parts.slice(1).join(separator)?.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');

        // Skip CSV header row
        if (i === 0 && key.toLowerCase() === 'key' && value.toLowerCase().startsWith('value')) {
          continue;
        }

        if (key) {
          imported.push({
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
            key,
            value: value || ''
          });
        } else {
          errorCount++;
        }
      }
    }

    if (imported.length === 0) {
      setBulkImportError(t.datEditor.bulkImport.errorNoKeys);
      return;
    }

    if (bulkMode === 'merge') {
      const importedByNorm = new Map<string, DatRecord>();
      for (const imp of imported) {
        importedByNorm.set(imp.key.trim().toUpperCase(), imp);
      }
      const updatedExisting = records.map(r => {
        const norm = r.key.trim().toUpperCase();
        const match = importedByNorm.get(norm);
        if (match) {
          importedByNorm.delete(norm);
          return { ...r, value: match.value };
        }
        return r;
      });
      const brandNew = Array.from(importedByNorm.values());
      pushRecordsUpdate([...brandNew, ...updatedExisting]);
    } else {
      pushRecordsUpdate(prev => [...imported, ...prev]);
    }

    setActiveToolPanel('none');
    setBulkText('');
    setSelectedRecordId(imported[0].id);
    setCurrentPage(1);

    const baseMsg = t.datEditor.bulkImport.success.replace('{count}', imported.length.toString());
    const ignoredMsg = errorCount > 0 ? t.datEditor.bulkImport.ignored.replace('{count}', errorCount.toString()) : '';
    showToast(baseMsg + ignoredMsg);
  };

  // Batch Find & Replace handler
  const handleBatchReplace = () => {
    if (!findText) return;
    let replacedRecordsCount = 0;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, replaceCaseSensitive ? 'g' : 'gi');

    const next = records.map(r => {
      const targetStr = replaceTarget === 'key' ? r.key : r.value;
      if (regex.test(targetStr)) {
        replacedRecordsCount++;
        regex.lastIndex = 0;
        const newStr = targetStr.replace(regex, replaceText);
        return replaceTarget === 'key' ? { ...r, key: newStr } : { ...r, value: newStr };
      }
      return r;
    });

    if (replacedRecordsCount > 0) {
      pushRecordsUpdate(next);
      showToast(
        tr(
          lang,
          `Replaced in ${replacedRecordsCount} records`,
          `Reemplazado en ${replacedRecordsCount} registros`,
          `Remplacé dans ${replacedRecordsCount} entrées`
        )
      );
    } else {
      showToast(tr(lang, 'No matching records found', 'No se encontraron coincidencias', 'Aucune correspondance trouvée'));
    }
  };

  // Entity Key Pack Generator handler
  const handleGenerateKeyPack = () => {
    const cleanId = packIdentifier.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanId) return;

    const nameVal = packDisplayName.trim() || cleanId;
    const descVal = packDescription.trim() || `${nameVal} — Descripción enciclopédica táctica.`;
    const tooltipVal = packTooltip.trim() || `${nameVal}`;

    let generated: DatRecord[] = [];
    if (packType === 'unit') {
      generated = [
        { id: crypto.randomUUID?.() || `${Date.now()}-1`, key: `TEXT_UNIT_${cleanId}`, value: nameVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-2`, key: `TEXT_TOOLTIP_${cleanId}`, value: tooltipVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-3`, key: `TEXT_ENC_UNIT_${cleanId}`, value: descVal }
      ];
    } else if (packType === 'planet') {
      generated = [
        { id: crypto.randomUUID?.() || `${Date.now()}-1`, key: `TEXT_PLANET_${cleanId}`, value: nameVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-2`, key: `TEXT_ENC_PLANET_${cleanId}`, value: descVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-3`, key: `TEXT_PLANET_${cleanId}_BONUS`, value: tooltipVal }
      ];
    } else if (packType === 'hero') {
      generated = [
        { id: crypto.randomUUID?.() || `${Date.now()}-1`, key: `TEXT_HERO_${cleanId}`, value: nameVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-2`, key: `TEXT_TOOLTIP_HERO_${cleanId}`, value: tooltipVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-3`, key: `TEXT_ENC_HERO_${cleanId}`, value: descVal }
      ];
    } else {
      generated = [
        { id: crypto.randomUUID?.() || `${Date.now()}-1`, key: `TEXT_BUILDING_${cleanId}`, value: nameVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-2`, key: `TEXT_TOOLTIP_BUILDING_${cleanId}`, value: tooltipVal },
        { id: crypto.randomUUID?.() || `${Date.now()}-3`, key: `TEXT_ENC_BUILDING_${cleanId}`, value: descVal }
      ];
    }

    pushRecordsUpdate(prev => [...generated, ...prev]);
    setSelectedRecordId(generated[0].id);
    setCurrentPage(1);
    setActiveToolPanel('none');
    setPackIdentifier('');
    setPackDisplayName('');
    setPackDescription('');
    setPackTooltip('');
    showToast(
      tr(
        lang,
        `Generated 3 localization keys for ${cleanId}`,
        `Generadas 3 claves de localización para ${cleanId}`,
        `3 clés générées pour ${cleanId}`
      )
    );
  };

  const selectedRefText = useMemo(() => {
    if (!selectedRecord || !referenceMap) return null;
    return referenceMap.get(selectedRecord.key.trim().toUpperCase()) ?? null;
  }, [selectedRecord, referenceMap]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-none">
      {/* Hidden File Inputs */}
      <input
        ref={uploadDatInputRef}
        type="file"
        accept=".dat"
        className="hidden"
        onChange={handleUploadPrimaryDat}
      />
      <input
        ref={refFileInputRef}
        type="file"
        accept=".dat"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleLoadReferenceDatFile(f);
          if (refFileInputRef.current) refFileInputRef.current.value = '';
        }}
      />

      {/* DAT Header Panel — Unified Tactical HUD (Matches XML / LUA / MTD Editors) */}
      <div className="min-h-14 py-2 border-b border-purple-900/40 bg-slate-900/80 backdrop-blur-md px-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left Block: 2-Row Metadata & File Selector */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 bg-purple-500/15 border border-purple-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)] shrink-0">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            {/* Row 1: Title + v1.3 Badge + Binary Format + Quick Metrics */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs uppercase tracking-widest text-purple-300 font-bold font-mono">
                {t.datEditor.editorTitle}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-purple-950/90 border border-purple-500/40 text-[9px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                v1.3
              </span>
              <select
                value={activeFormat}
                onChange={(e) => {
                  const nextFmt = e.target.value as 'indexed' | 'sequential_mult2' | 'sequential_mult1';
                  setActiveFormat(nextFmt);
                  if (onUpdateRecords) onUpdateRecords(records, editableFileName, nextFmt);
                }}
                className="px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-800 text-[9px] font-mono text-cyan-300 uppercase outline-none cursor-pointer focus:border-purple-500"
                title={tr(lang, 'Binary .DAT Serialization Format', 'Formato de Compilación Binaria .DAT', 'Format binaire .DAT')}
              >
                <option value="indexed">INDEXED CRC32 (EAW/FoC)</option>
                <option value="sequential_mult2">SEQUENTIAL UTF-16 (x2)</option>
                <option value="sequential_mult1">SEQUENTIAL BYTE (x1)</option>
              </select>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                {total} {tr(lang, 'keys', 'claves', 'clés')} · {estimatedBinarySizeKb} KB
              </span>
            </div>

            {/* Row 2: Editable Filename + Workspace .DAT Switcher + Reference Indicator */}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <input
                type="text"
                value={editableFileName}
                onChange={(e) => {
                  setEditableFileName(e.target.value);
                  if (onUpdateRecords) onUpdateRecords(records, e.target.value, activeFormat);
                }}
                className="bg-slate-950/90 border border-slate-800 focus:border-purple-500/60 rounded-sm px-2 py-0.5 text-[11px] font-mono text-cyan-200 outline-none w-52"
                title={tr(lang, 'Output .DAT filename', 'Nombre del archivo .DAT de salida', 'Nom du fichier .DAT')}
              />

              {workspaceDatFiles.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleSwitchWorkspaceDat(e.target.value);
                  }}
                  className="bg-slate-950 border border-purple-800/50 text-purple-300 font-mono text-[10px] px-2 py-0.5 rounded-sm outline-none cursor-pointer focus:border-purple-500 max-w-[190px]"
                >
                  <option value="">
                    {tr(lang, `Workspace .DAT (${workspaceDatFiles.length})`, `Workspace .DAT (${workspaceDatFiles.length})`, `Workspace .DAT (${workspaceDatFiles.length})`)}
                  </option>
                  {workspaceDatFiles.map((f, idx) => (
                    <option key={idx} value={f.webkitRelativePath || f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}

              {referenceRecords && (
                <span className="px-1.5 py-0.5 rounded-sm bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 flex items-center gap-1">
                  <GitCompare className="w-3 h-3" />
                  <span>REF: {referenceFileName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Toolbar: Anchored to Right Margin (ml-auto) */}
        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 border border-slate-800 bg-slate-950/70 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-sm transition-colors cursor-pointer"
            title={tr(lang, 'Undo (Ctrl+Z)', 'Deshacer (Ctrl+Z)', 'Annuler (Ctrl+Z)')}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 border border-slate-800 bg-slate-950/70 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-sm transition-colors cursor-pointer"
            title={tr(lang, 'Redo (Ctrl+Y)', 'Rehacer (Ctrl+Y)', 'Rétablir (Ctrl+Y)')}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Bilingual Compare / Diff .DAT */}
          <button
            onClick={() => setActiveToolPanel(activeToolPanel === 'compare' ? 'none' : 'compare')}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1 rounded-sm cursor-pointer ${
              activeToolPanel === 'compare' || referenceRecords
                ? 'border-cyan-500/60 bg-cyan-950/50 text-cyan-300'
                : 'border-slate-700/70 hover:bg-slate-800 text-slate-300'
            }`}
            title={tr(lang, 'Compare with another .DAT file (Bilingual Diff)', 'Comparar con otro .DAT (Traductor Bilingüe / Claves Faltantes)', 'Comparer avec un autre .DAT')}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{tr(lang, 'Compare .DAT', 'Comparar .DAT', 'Comparer .DAT')}</span>
          </button>

          {/* Find & Replace */}
          <button
            onClick={() => setActiveToolPanel(activeToolPanel === 'replace' ? 'none' : 'replace')}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1 rounded-sm cursor-pointer ${
              activeToolPanel === 'replace'
                ? 'border-amber-500/60 bg-amber-950/50 text-amber-300'
                : 'border-slate-700/70 hover:bg-slate-800 text-slate-300'
            }`}
            title={tr(lang, 'Batch Find & Replace', 'Buscar y Reemplazar en Lote', 'Rechercher et Remplacer')}
          >
            <Replace className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{tr(lang, 'Replace', 'Reemplazar', 'Remplacer')}</span>
          </button>

          {/* Entity Key Pack Generator */}
          <button
            onClick={() => setActiveToolPanel(activeToolPanel === 'pack' ? 'none' : 'pack')}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1 rounded-sm cursor-pointer ${
              activeToolPanel === 'pack'
                ? 'border-emerald-500/60 bg-emerald-950/50 text-emerald-300'
                : 'border-slate-700/70 hover:bg-slate-800 text-slate-300'
            }`}
            title={tr(lang, 'Generate Entity Key Pack (Name + Tooltip + Encyclopedia)', 'Generador de Pack de Claves (Nombre + Tooltip + Enciclopedia)', 'Générateur de Pack de Clés')}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{tr(lang, '+ Key Pack', '+ Pack Claves', '+ Pack Clés')}</span>
          </button>

          {/* Bulk Import / Export CSV/TSV/JSON */}
          <button
            onClick={() => setActiveToolPanel(activeToolPanel === 'bulk' ? 'none' : 'bulk')}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-1 rounded-sm cursor-pointer ${
              activeToolPanel === 'bulk'
                ? 'border-purple-400 bg-purple-900/40 text-purple-200'
                : 'border-purple-500/40 hover:bg-purple-900/20 text-purple-300'
            }`}
            title={t.datEditor.bulkImportBtn}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.datEditor.bulkImportBtn}</span>
          </button>

          {/* Upload .DAT */}
          <button
            onClick={() => uploadDatInputRef.current?.click()}
            className="p-1.5 border border-slate-700/70 hover:bg-slate-800 text-slate-300 rounded-sm transition-colors cursor-pointer"
            title={tr(lang, 'Load another .DAT from disk', 'Cargar otro archivo .DAT del disco', 'Charger un fichier .DAT')}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Save / Compile .DAT */}
          <button
            onClick={handleExportDat}
            className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 text-[11px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm shadow-[0_0_15px_rgba(168,85,247,0.25)] cursor-pointer"
            title={t.datEditor.saveDatBtn}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.datEditor.saveDatBtn}</span>
          </button>

          {/* Close Button anchored at right edge */}
          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={t.datEditor.closeBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Power Tool Drawers (Compare, Replace, Key Pack, Bulk Import/Export) */}
      {activeToolPanel === 'compare' && (
        <div className="border-b border-cyan-900/50 bg-slate-900/95 px-5 py-3.5 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>{tr(lang, 'Bilingual .DAT Comparator & Missing Key Synchronizer', 'Comparador Bilingüe .DAT y Sincronizador de Claves Faltantes', 'Comparateur Bilingue .DAT')}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tr(
                  lang,
                  'Load a reference MasterTextFile (e.g. MasterTextFile_ENGLISH.dat) to detect missing keys in your translation and view original reference strings side-by-side.',
                  'Carga un archivo MasterTextFile de referencia (ej. MasterTextFile_ENGLISH.dat) para detectar qué claves faltan en tu traducción y ver el texto original de referencia mientras traduces.',
                  'Chargez un fichier MasterTextFile de référence pour détecter les clés manquantes et traduire côte à côte.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {workspaceDatFiles.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const f = workspaceDatFiles.find(wf => (wf.webkitRelativePath || wf.name) === e.target.value);
                    if (f) handleLoadReferenceDatFile(f);
                  }}
                  className="bg-slate-950 border border-cyan-800/60 text-cyan-300 font-mono text-[10px] px-2.5 py-1.5 rounded-sm outline-none cursor-pointer"
                >
                  <option value="">{tr(lang, 'Select Reference from Workspace...', 'Elegir Referencia del Workspace...', 'Choisir depuis le Workspace...')}</option>
                  {workspaceDatFiles.map((f, i) => (
                    <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => refFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{tr(lang, 'Load Reference .DAT', 'Subir .DAT de Referencia', 'Charger .DAT Référence')}</span>
              </button>

              {referenceRecords && (
                <>
                  <button
                    onClick={handleImportMissingFromReference}
                    disabled={missingFromCurrentRecords.length === 0}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {tr(
                        lang,
                        `Import ${missingFromCurrentRecords.length} Missing Keys`,
                        `Importar ${missingFromCurrentRecords.length} Claves Faltantes`,
                        `Importer ${missingFromCurrentRecords.length} Clés Manquantes`
                      )}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setReferenceRecords(null);
                      setReferenceFileName('');
                      if (filterType === 'untranslated_ref') setFilterType('all');
                    }}
                    className="px-2.5 py-1.5 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 text-[10px] font-mono uppercase rounded-sm cursor-pointer"
                  >
                    {tr(lang, 'Clear Ref', 'Quitar Ref', 'Effacer Réf')}
                  </button>
                </>
              )}
            </div>
          </div>

          {referenceRecords && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] font-mono">
              <span className="text-slate-400">
                {tr(lang, 'Reference File:', 'Archivo Referencia:', 'Fichier Référence:')} <strong className="text-cyan-300">{referenceFileName}</strong> ({referenceRecords.length} {tr(lang, 'keys', 'claves', 'clés')})
              </span>
              <span className={missingFromCurrentRecords.length > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {tr(lang, 'Missing in Current .DAT:', 'Faltan en tu .DAT actual:', 'Manquantes:')} <strong>{missingFromCurrentRecords.length}</strong>
              </span>
              <span className={untranslatedRefCount > 0 ? 'text-purple-300' : 'text-slate-400'}>
                {tr(lang, 'Identical to Reference (Untranslated):', 'Idénticas a Referencia (Sin traducir):', 'Identiques à la référence:')} <strong>{untranslatedRefCount}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {activeToolPanel === 'replace' && (
        <div className="border-b border-amber-900/50 bg-slate-900/95 px-5 py-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Replace className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                {tr(lang, 'Batch Find & Replace', 'Buscar y Reemplazar en Lote', 'Rechercher et Remplacer en Lot')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-4xl justify-end">
              <select
                value={replaceTarget}
                onChange={(e) => setReplaceTarget(e.target.value as 'value' | 'key')}
                className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] px-2.5 py-1.5 rounded-sm outline-none"
              >
                <option value="value">{tr(lang, 'In Localized Texts', 'En Textos Traducidos', 'Dans les Textes')}</option>
                <option value="key">{tr(lang, 'In Key IDs (TEXT_*)', 'En Claves (TEXT_*)', 'Dans les Clés (TEXT_*)')}</option>
              </select>

              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder={tr(lang, 'Find text...', 'Texto a buscar...', 'Rechercher...')}
                className="bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-2.5 py-1 rounded-sm outline-none w-44"
              />

              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder={tr(lang, 'Replace with...', 'Reemplazar por...', 'Remplacer par...')}
                className="bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-2.5 py-1 rounded-sm outline-none w-44"
              />

              <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceCaseSensitive}
                  onChange={(e) => setReplaceCaseSensitive(e.target.checked)}
                  className="accent-amber-500"
                />
                <span>Aa</span>
              </label>

              <button
                onClick={handleBatchReplace}
                disabled={!findText}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded-sm cursor-pointer"
              >
                {tr(lang, 'Replace All', 'Reemplazar Todo', 'Tout Remplacer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeToolPanel === 'pack' && (
        <div className="border-b border-emerald-900/50 bg-slate-900/95 px-5 py-3.5 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                {tr(lang, 'Entity Localization Key Pack Generator (3-in-1)', 'Generador de Pack de Claves para Entidad (Nombre + Tooltip + Enciclopedia)', 'Générateur de Pack de Clés (3-en-1)')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {tr(lang, 'Creates Name, Tooltip, and Encyclopedia keys automatically', 'Crea las 3 claves estándar del motor Alamo en un solo paso', 'Crée les 3 clés standard Alamo')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-end">
            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                {tr(lang, 'Entity Type', 'Tipo de Entidad', 'Type d\'Entité')}
              </label>
              <select
                value={packType}
                onChange={(e) => setPackType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs p-1.5 rounded-sm outline-none"
              >
                <option value="unit">{tr(lang, 'Unit / Squadron (TEXT_UNIT_*)', 'Unidad / Escuadrón (TEXT_UNIT_*)', 'Unité (TEXT_UNIT_*)')}</option>
                <option value="planet">{tr(lang, 'Planet (TEXT_PLANET_*)', 'Planeta (TEXT_PLANET_*)', 'Planète (TEXT_PLANET_*)')}</option>
                <option value="hero">{tr(lang, 'Hero (TEXT_HERO_*)', 'Héroe (TEXT_HERO_*)', 'Héros (TEXT_HERO_*)')}</option>
                <option value="building">{tr(lang, 'Building (TEXT_BUILDING_*)', 'Edificio (TEXT_BUILDING_*)', 'Bâtiment (TEXT_BUILDING_*)')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                {tr(lang, 'Internal ID (e.g. TIE_DEFENDER)', 'ID Interno (ej. TIE_DEFENDER)', 'ID Interne')}
              </label>
              <input
                type="text"
                value={packIdentifier}
                onChange={(e) => setPackIdentifier(e.target.value)}
                placeholder="TIE_DEFENDER"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 p-1.5 rounded-sm uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                {tr(lang, 'Display Name', 'Nombre Visible en Juego', 'Nom Affiché')}
              </label>
              <input
                type="text"
                value={packDisplayName}
                onChange={(e) => setPackDisplayName(e.target.value)}
                placeholder="Defensor TIE"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 p-1.5 rounded-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                {tr(lang, 'Encyclopedia / Tooltip Summary', 'Resumen Enciclopedia / Tooltip', 'Description Encyclopédie')}
              </label>
              <input
                type="text"
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                placeholder={tr(lang, 'Heavy superiority starfighter equipped with shields...', 'Caza estelar pesado equipado con escudos e hiperimpulsor...', 'Chasseur lourd...')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 p-1.5 rounded-sm outline-none"
              />
            </div>

            <button
              onClick={handleGenerateKeyPack}
              disabled={!packIdentifier.trim()}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer h-[32px]"
            >
              {tr(lang, 'Create 3 Keys', 'Crear las 3 Claves', 'Créer 3 Clés')}
            </button>
          </div>
        </div>
      )}

      {activeToolPanel === 'bulk' && (
        <div className="border-b border-purple-900/60 bg-slate-900/95 px-5 py-3.5 shrink-0 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.datEditor.bulkImport.title} // CSV · TSV · JSON · TXT</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {t.datEditor.bulkImport.desc1}{' '}
                <code className="text-purple-400 font-mono">{t.datEditor.bulkImport.desc2}</code>
              </p>
            </div>

            {/* Export Flat Formats */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 mr-1">
                {tr(lang, 'Export Table:', 'Exportar Tabla:', 'Exporter Table:')}
              </span>
              <button
                onClick={() => handleExportFlatFormat('csv')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono rounded-sm cursor-pointer"
              >
                .CSV
              </button>
              <button
                onClick={() => handleExportFlatFormat('tsv')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono rounded-sm cursor-pointer"
              >
                .TSV
              </button>
              <button
                onClick={() => handleExportFlatFormat('json')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono rounded-sm cursor-pointer"
              >
                .JSON
              </button>
            </div>
          </div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={t.datEditor.bulkImport.placeholder}
            className="w-full h-28 bg-slate-950 border border-purple-900/60 p-2.5 rounded-sm text-xs font-mono text-purple-200 placeholder-slate-600 focus:border-purple-500 outline-none"
          />

          {bulkImportError && (
            <div className="mt-1.5 p-2 bg-red-950/40 border border-red-900/50 text-red-400 text-[10px] font-mono rounded-sm flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{bulkImportError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="bulkMode"
                  checked={bulkMode === 'merge'}
                  onChange={() => setBulkMode('merge')}
                  className="accent-purple-500"
                />
                <span>{tr(lang, 'Smart Merge (Update existing keys & add new)', 'Fusión Inteligente (Actualizar existentes y añadir nuevas)', 'Fusion Intelligente')}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="bulkMode"
                  checked={bulkMode === 'prepend'}
                  onChange={() => setBulkMode('prepend')}
                  className="accent-purple-500"
                />
                <span>{tr(lang, 'Insert All at Top', 'Insertar todas al principio', 'Tout insérer en haut')}</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setActiveToolPanel('none'); setBulkImportError(null); }}
                className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {t.datEditor.bulkImport.cancel}
              </button>
              <button
                onClick={handleBulkImport}
                className="px-3.5 py-1 text-[10px] uppercase font-bold tracking-wider font-mono bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-sm cursor-pointer"
              >
                {t.datEditor.bulkImport.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Explorer, Prefix Categories & Table */}
        <div className="flex-1 flex flex-col border-r border-slate-800/80 bg-slate-950/80 p-4 min-w-[360px]">
          {/* Quick Realtime Telemetry Bar */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded-sm bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.total}</span>
                <span className="text-sm font-bold font-mono tabular-nums text-cyan-400">{total}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">{estimatedBinarySizeKb} KB</span>
            </div>

            <div className="p-2 rounded-sm bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.unique}</span>
                <span className="text-sm font-bold font-mono tabular-nums text-indigo-400">{uniqueKeysCount}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">CRC32</span>
            </div>

            <div
              onClick={() => setFilterType(filterType === 'empty' ? 'all' : 'empty')}
              className="p-2 rounded-sm bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div>
                <span className="block text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.empty}</span>
                <span className={`text-sm font-bold font-mono tabular-nums ${emptyCount > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                  {emptyCount}
                </span>
              </div>
              {emptyCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70" />}
            </div>

            <div className="p-2 rounded-sm bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div
                onClick={() => setFilterType(filterType === 'duplicates' ? 'all' : 'duplicates')}
                className="cursor-pointer flex-1"
              >
                <span className="block text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.duplicates}</span>
                <span className={`text-sm font-bold font-mono tabular-nums ${duplicateKeysCount > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                  {duplicateKeysCount}
                </span>
              </div>
              {duplicateKeysCount > 0 && (
                <button
                  onClick={handleDeduplicateAll}
                  className="px-1.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[9px] font-mono uppercase rounded-sm cursor-pointer"
                  title={tr(lang, 'Auto-merge and remove all duplicate keys', 'Fusionar y limpiar claves duplicadas automáticamente', 'Supprimer automatiquement les doublons')}
                >
                  {tr(lang, 'Clean', 'Limpiar', 'Nettoyer')}
                </button>
              )}
            </div>
          </div>

          {/* Alamo Engine Prefix Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 border-b border-slate-900">
            {[
              { id: 'all', label: tr(lang, 'All Keys', 'Todas', 'Toutes') },
              { id: 'units', label: tr(lang, 'Units (UNIT_*)', 'Unidades', 'Unités') },
              { id: 'planets', label: tr(lang, 'Planets (PLANET_*)', 'Planetas', 'Planètes') },
              { id: 'story', label: tr(lang, 'Story & GC', 'Historia y GC', 'Histoire & GC') },
              { id: 'ui', label: tr(lang, 'UI & Tooltips', 'UI y Tooltips', 'UI & Tooltips') },
              { id: 'heroes', label: tr(lang, 'Heroes & Abilities', 'Héroes y Hab.', 'Héros') }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setPrefixCategory(cat.id as PrefixCategory)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors whitespace-nowrap cursor-pointer ${
                  prefixCategory === cat.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search, Scope, Sort & Status Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={t.datEditor.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 focus:border-cyan-500/70 py-1.5 pl-8 pr-7 rounded-sm text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 p-0.5 hover:bg-slate-800 rounded text-slate-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Scope */}
            <select
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as SearchScope)}
              className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] py-1.5 px-2 rounded-sm outline-none cursor-pointer"
              title={tr(lang, 'Search Scope', 'Ámbito de Búsqueda', 'Portée de la recherche')}
            >
              <option value="both">{tr(lang, 'Key + Text', 'Clave + Texto', 'Clé + Texte')}</option>
              <option value="key">{tr(lang, 'Only Keys', 'Solo Claves', 'Clés seules')}</option>
              <option value="value">{tr(lang, 'Only Texts', 'Solo Textos', 'Textes seuls')}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] py-1.5 px-2 rounded-sm outline-none cursor-pointer"
              title={tr(lang, 'Sort Order', 'Orden de Clasificación', 'Ordre de tri')}
            >
              <option value="original">{tr(lang, 'Order: Original', 'Orden: Original', 'Ordre : Original')}</option>
              <option value="key_asc">{tr(lang, 'Key: A → Z', 'Clave: A → Z', 'Clé : A → Z')}</option>
              <option value="key_desc">{tr(lang, 'Key: Z → A', 'Clave: Z → A', 'Clé : Z → A')}</option>
              <option value="crc_asc">{tr(lang, 'CRC32 Checksum', 'Hash CRC32 (Motor)', 'CRC32')}</option>
              <option value="len_desc">{tr(lang, 'Longest Text', 'Mayor Longitud', 'Plus long texte')}</option>
            </select>

            {/* Diagnostic Filter Buttons */}
            <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-sm p-0.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider font-mono font-semibold rounded-sm transition-colors cursor-pointer ${
                  filterType === 'all' 
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.datEditor.filters.all}
              </button>
              <button
                onClick={() => setFilterType('empty')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider font-mono font-semibold rounded-sm transition-colors cursor-pointer ${
                  filterType === 'empty' 
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.datEditor.filters.empty.replace('{count}', emptyCount.toString())}
              </button>
              <button
                onClick={() => setFilterType('duplicates')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider font-mono font-semibold rounded-sm transition-colors cursor-pointer ${
                  filterType === 'duplicates' 
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.datEditor.filters.duplicates.replace('{count}', duplicateKeysCount.toString())}
              </button>
              {referenceRecords && (
                <button
                  onClick={() => setFilterType('untranslated_ref')}
                  className={`px-2 py-1 text-[9px] uppercase tracking-wider font-mono font-semibold rounded-sm transition-colors cursor-pointer ${
                    filterType === 'untranslated_ref' 
                      ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={tr(lang, 'Strings identical to Reference .DAT (not yet translated)', 'Cadenas idénticas al archivo .DAT de referencia (aún sin traducir)', 'Textes identiques à la référence')}
                >
                  {tr(lang, `Untranslated (${untranslatedRefCount})`, `Sin Traducir (${untranslatedRefCount})`, `Non traduits (${untranslatedRefCount})`)}
                </button>
              )}
            </div>

            {/* Quick Insert Key Button */}
            <button
              onClick={handleCreateRecord}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] uppercase rounded-sm flex items-center space-x-1 transition-all cursor-pointer"
              title={t.datEditor.quickInsertTitle}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span className="hidden sm:inline">{tr(lang, 'New Key', 'Nueva', 'Nouvelle')}</span>
            </button>
          </div>

          {/* Table List Container */}
          <div className="flex-1 overflow-y-auto mb-3 border border-slate-900 bg-slate-950 rounded-sm">
            {filteredRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Database className="w-8 h-8 opacity-30 mb-2 text-slate-400" />
                <span className="text-xs font-mono">{t.datEditor.list.noResults}</span>
                {searchQuery && <span className="text-[10px] max-w-xs mt-1">{t.datEditor.list.changeSearch}</span>}
              </div>
            ) : (
              <div className="divide-y divide-slate-900/80">
                {paginatedRecords.map((rec) => {
                  const isSelected = rec.id === selectedRecordId;
                  const isRecordEmpty = !rec.value.trim();
                  const normKey = rec.key.trim().toUpperCase();
                  const isRecordDuplicate = duplicateKeysSet.has(normKey);
                  const refString = referenceMap ? referenceMap.get(normKey) : null;
                  const isSameAsRef = Boolean(refString && refString.trim() !== '' && rec.value.trim() === refString.trim());

                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecordId(rec.id)}
                      className={`p-2.5 text-left flex items-start justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-cyan-950/45 text-cyan-200 ring-1 ring-inset ring-cyan-500/40' 
                          : isRecordDuplicate
                            ? 'bg-rose-500/5 hover:bg-slate-900/60 text-slate-300'
                            : isRecordEmpty 
                              ? 'bg-amber-500/5 hover:bg-slate-900/60 text-slate-300'
                              : 'hover:bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-medium text-cyan-400/95 truncate" title={rec.key}>
                            {rec.key}
                          </span>
                          {isRecordDuplicate && (
                            <span className="text-[9px] font-mono text-rose-400 uppercase shrink-0">
                              · DUP
                            </span>
                          )}
                          {isSameAsRef && (
                            <span className="text-[9px] font-mono text-purple-400 uppercase shrink-0">
                              · =REF
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate ${isRecordEmpty ? 'text-amber-500/70 italic' : 'text-slate-400'}`}>
                          {isRecordEmpty ? t.datEditor.list.untranslated : rec.value}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-mono text-slate-600 mr-1 hidden xl:inline">
                          {formatCrc32Hex(rec.key)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyText(rec.key, rec.id); }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                          title={t.datEditor.list.copyKey}
                        >
                          {copiedId === rec.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); confirmDeleteRecord(rec.id); }}
                          className="p-1 hover:bg-red-950/40 hover:text-red-400 rounded text-slate-400 cursor-pointer"
                          title={t.datEditor.list.deleteTitle}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table Footer with Pagination */}
          <div className="h-10 bg-slate-950 border border-slate-900 rounded-sm shrink-0 flex items-center justify-between px-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500">{t.datEditor.pagination.rowsPerPage}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-300 font-mono text-[10px] rounded-sm p-0.5 outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="font-mono text-[11px] tabular-nums">
              {filteredRecords.length > 0 ? (
                <span>
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)} {t.datEditor.pagination.of} {filteredRecords.length}
                </span>
              ) : (
                <span>0-0 {t.datEditor.pagination.of} 0</span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 bg-slate-900 border border-slate-800 rounded-sm hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[10px] px-1.5 text-slate-400 tabular-nums">
                {currentPage}/{totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 bg-slate-900 border border-slate-800 rounded-sm hover:bg-slate-800 disabled:opacity-30 text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Inspector, Bilingual Reference, UTF-16LE Editor & In-Game Tooltip Preview */}
        <div className="w-full md:w-[460px] lg:w-[540px] xl:w-[600px] bg-slate-900/40 p-4 shrink-0 flex flex-col text-left border-l border-slate-900/40 overflow-y-auto">
          {selectedRecord ? (
            <div className="flex-1 flex flex-col space-y-3">
              {/* Key ID & CRC32 Inspector Box */}
              <div className="p-3 bg-slate-900/80 border border-cyan-800/40 rounded-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold font-mono">
                      {t.datEditor.editor.idName}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-700/40 px-1.5 py-0.2 rounded-sm">
                      CRC32: {formatCrc32Hex(selectedRecord.key)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const normalized = selectedRecord.key.trim().toUpperCase().replace(/[\s-]+/g, '_');
                        handleRecordChange(selectedRecord.id, { key: normalized });
                      }}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[9px] font-mono text-slate-300 rounded-sm cursor-pointer"
                      title={tr(lang, 'Normalize key to UPPER_SNAKE_CASE', 'Normalizar clave a MAYUSCULAS_CON_GUIONES', 'Normaliser en MAJUSCULES')}
                    >
                      UPPER_CASE
                    </button>
                    <button
                      onClick={() => handleDuplicateSingleRecord(selectedRecord)}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[9px] font-mono text-cyan-300 rounded-sm cursor-pointer"
                      title={tr(lang, 'Clone this record', 'Clonar este registro', 'Cloner cette clé')}
                    >
                      {tr(lang, 'Clone', 'Clonar', 'Cloner')}
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <Type className="absolute left-2.5 text-slate-500 top-2.5 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={selectedRecord.key}
                    onChange={(e) => handleRecordChange(selectedRecord.id, { key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-1.5 pl-8 rounded-sm font-mono text-xs text-slate-100 uppercase outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Quick Copy XML Snippets */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[9px] text-slate-400 font-mono">
                    {tr(lang, 'Quick Copy XML:', 'Copiar etiqueta XML:', 'Copier balise XML:')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyText(
                        `<Text_ID>${selectedRecord.key}</Text_ID>`,
                        'xml_text_id',
                        tr(lang, 'Copied <Text_ID> tag', 'Copiada etiqueta <Text_ID>', 'Balise <Text_ID> copiée')
                      )}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[9px] font-mono text-cyan-300 rounded-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Code className="w-3 h-3" />
                      <span>&lt;Text_ID&gt;</span>
                    </button>
                    <button
                      onClick={() => handleCopyText(
                        `<Encyclopedia_Text>${selectedRecord.key}</Encyclopedia_Text>`,
                        'xml_enc_id',
                        tr(lang, 'Copied <Encyclopedia_Text> tag', 'Copiada etiqueta <Encyclopedia_Text>', 'Balise <Encyclopedia_Text> copiée')
                      )}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/40 text-[9px] font-mono text-purple-300 rounded-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Code className="w-3 h-3" />
                      <span>&lt;Encyclopedia_Text&gt;</span>
                    </button>
                  </div>
                </div>

                {/* Duplicate Key Collision Warning & Resolver */}
                {selectedKeyDuplicates.length > 1 && (
                  <div className="mt-2 p-2 bg-rose-950/40 border border-rose-500/40 rounded-sm flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono text-rose-300">
                      <strong className="uppercase">{tr(lang, 'Duplicate Key Collision:', 'Colisión de Clave Duplicada:', 'Collision de doublon:')}</strong>{' '}
                      {selectedKeyDuplicates.length} {tr(lang, 'records share this ID', 'registros comparten este ID', 'entrées partagent cet ID')}
                    </div>
                    <button
                      onClick={() => handleKeepOnlyThisDuplicate(selectedRecord)}
                      className="px-2 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono font-bold text-[9px] uppercase rounded-sm shrink-0 cursor-pointer"
                    >
                      {tr(lang, 'Keep Only This', 'Conservar Solo Esta', 'Garder celle-ci')}
                    </button>
                  </div>
                )}
              </div>

              {/* Bilingual Reference Text Card (visible when Reference .DAT is loaded) */}
              {referenceRecords && (
                <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase font-bold text-cyan-300 flex items-center gap-1">
                      <GitCompare className="w-3 h-3" />
                      <span>{tr(lang, `Reference (${referenceFileName})`, `Texto de Referencia (${referenceFileName})`, `Référence (${referenceFileName})`)}</span>
                    </span>
                    {selectedRefText && (
                      <button
                        onClick={() => handleRecordChange(selectedRecord.id, { value: selectedRefText })}
                        className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/40 text-cyan-200 text-[9px] font-mono rounded-sm cursor-pointer"
                      >
                        {tr(lang, 'Copy to Editor', 'Copiar al Editor', 'Copier vers l\'éditeur')}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 font-sans bg-slate-950/80 border border-slate-800/80 p-2 rounded-sm max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {selectedRefText !== null ? (
                      selectedRefText || <span className="italic text-slate-500">{tr(lang, '(Empty in reference)', '(Vacío en referencia)', '(Vide)')}</span>
                    ) : (
                      <span className="italic text-amber-400/80">{tr(lang, 'Key does not exist in Reference .DAT', 'Esta clave no existe en el .DAT de referencia', 'Clé absente de la référence')}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Translation Text Editor Card */}
              <div className="flex-1 flex flex-col p-3.5 bg-slate-900/85 border border-slate-800 rounded-sm min-h-[220px]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold font-mono">
                    {t.datEditor.editor.localizedText}
                  </span>

                  {/* Quick Text Formatting Helpers */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRecordChange(selectedRecord.id, { value: selectedRecord.value + '\n• ' })}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-300 rounded-sm cursor-pointer"
                      title={tr(lang, 'Insert Encyclopedia Bullet Point', 'Insertar viñeta de enciclopedia (•)', 'Insérer puce (•)')}
                    >
                      + • Viñeta
                    </button>
                    <button
                      onClick={() => handleRecordChange(selectedRecord.id, { value: selectedRecord.value.toUpperCase() })}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-300 rounded-sm cursor-pointer"
                      title={tr(lang, 'Convert text to UPPERCASE', 'Convertir texto a MAYÚSCULAS', 'Tout en MAJUSCULES')}
                    >
                      AA
                    </button>
                    <button
                      onClick={() => {
                        const cleaned = selectedRecord.value.replace(/[ \t]+$/gm, '').trim();
                        handleRecordChange(selectedRecord.id, { value: cleaned });
                      }}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-300 rounded-sm cursor-pointer"
                      title={tr(lang, 'Trim extra spaces', 'Limpiar espacios sobrantes', 'Nettoyer les espaces')}
                    >
                      Trim
                    </button>
                    <button
                      onClick={() => setShowInGamePreview(!showInGamePreview)}
                      className={`px-2 py-0.5 border text-[9px] font-mono rounded-sm flex items-center gap-1 cursor-pointer ${
                        showInGamePreview
                          ? 'bg-purple-950/70 border-purple-500/50 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>HUD</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative mb-2.5 min-h-[130px]">
                  <textarea
                    value={selectedRecord.value}
                    onChange={(e) => handleRecordChange(selectedRecord.id, { value: e.target.value })}
                    className="w-full h-full bg-slate-950 border border-slate-800 p-3 rounded-sm text-xs text-slate-100 font-sans leading-relaxed focus:border-cyan-500 outline-none resize-none placeholder-slate-600"
                    placeholder={t.datEditor.editor.placeholder}
                  />
                </div>

                {/* String Telemetry Bar */}
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded-sm border border-slate-900 font-mono tabular-nums">
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t.datEditor.editor.charSize}</span>
                    <span className="text-cyan-400 font-bold">{selectedRecord.value.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t.datEditor.editor.byteSize}</span>
                    <span className="text-cyan-400 font-bold">{selectedRecord.value.length * 2} {t.datEditor.editor.b}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{t.datEditor.editor.textLines}</span>
                    <span className="text-slate-300 font-bold">{selectedRecord.value ? selectedRecord.value.split('\n').length : 0}</span>
                  </div>
                </div>
              </div>

              {/* In-Game EAW Tactical Tooltip & Encyclopedia Simulator */}
              {showInGamePreview && (
                <div className="p-3 bg-slate-950 border border-cyan-900/50 rounded-sm shadow-inner">
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-cyan-950">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                      {tr(lang, 'Alamo Engine HUD Tooltip Preview', 'Simulador de Tooltip / Enciclopedia en Juego (EAW HUD)', 'Aperçu HUD en jeu')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">UTF-16LE</span>
                  </div>
                  <div className="p-2.5 bg-[#04111d] border border-cyan-500/30 rounded-sm text-xs text-cyan-100 font-sans leading-snug whitespace-pre-wrap max-h-36 overflow-y-auto shadow-[inset_0_0_14px_rgba(6,182,212,0.08)]">
                    {selectedRecord.value ? (
                      selectedRecord.value
                    ) : (
                      <span className="text-amber-400/70 italic font-mono text-[11px]">
                        [MISSING STRING: {selectedRecord.key}]
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions tip */}
              <div className="p-2.5 border border-indigo-900/30 bg-indigo-950/10 rounded-sm flex items-start space-x-2">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-indigo-300 font-mono leading-normal">
                  {t.datEditor.editor.tipBox}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-6 border border-dashed border-slate-800 bg-slate-900/10">
              <Database className="w-10 h-10 opacity-20 mb-2 text-slate-500" />
              <span className="text-xs font-mono">{t.datEditor.editor.noSelection}</span>
              <p className="text-[10px] max-w-xs mt-1 text-slate-500">
                {t.datEditor.editor.noSelectionDesc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-sm shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-slate-100 text-base font-bold font-mono uppercase mb-2">{t.datEditor.modal.deleteTitle}</h3>
            <p className="text-slate-400 text-xs mb-6">
              {t.datEditor.modal.deleteDesc}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-1.5 text-slate-300 hover:bg-slate-800 rounded-sm font-mono text-xs uppercase transition-colors cursor-pointer"
              >
                {t.datEditor.modal.cancel}
              </button>
              <button
                onClick={executeDeleteRecord}
                className="px-4 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-sm font-mono font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                {t.datEditor.modal.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-sm shadow-xl flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
