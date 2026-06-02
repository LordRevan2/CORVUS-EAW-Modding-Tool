import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Database, 
  Copy, 
  Check, 
  AlertCircle, 
  FileText, 
  Type, 
  Sparkles,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { DatRecord, serializeDatFile } from '../lib/dat';
import { useTranslation } from '../i18n';

interface DatEditorProps {
  initialRecords: DatRecord[];
  fileName: string;
  onClose: () => void;
  format?: 'indexed' | 'sequential_mult2' | 'sequential_mult1';
}

export default function DatEditor({ initialRecords, fileName, onClose, format = 'indexed' }: DatEditorProps) {
  const t = useTranslation();
  const [records, setRecords] = useState<DatRecord[]>(initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    initialRecords.length > 0 ? initialRecords[0].id : null
  );
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'empty' | 'uppercase' | 'duplicates'>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Bulk Import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);

  // Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Confirmation State
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Current selected record for editing
  const selectedRecord = useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Statistics
  const { total, emptyCount, duplicateKeysCount, uniqueKeysCount, duplicateKeysSet } = useMemo(() => {
    const total = records.length;
    let emptyCount = 0;
    const uniqueKeys = new Set<string>();
    const duplicateKeysSet = new Set<string>();
    let duplicateKeysCount = 0;

    for (const r of records) {
      if (!r.value.trim()) {
        emptyCount++;
      }
      const normKey = r.key.trim().toUpperCase();
      if (uniqueKeys.has(normKey)) {
        duplicateKeysCount++;
        duplicateKeysSet.add(normKey);
      } else {
        uniqueKeys.add(normKey);
      }
    }

    return {
      total,
      emptyCount,
      duplicateKeysCount,
      uniqueKeysCount: uniqueKeys.size,
      duplicateKeysSet
    };
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return records.filter(r => {
      // Text Search
      const matchesSearch = 
        r.key.toLowerCase().includes(query) || 
        r.value.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;

      // Filter category
      if (filterType === 'empty') {
        return !r.value.trim();
      }
      if (filterType === 'uppercase') {
        return r.key === r.key.toUpperCase();
      }
      if (filterType === 'duplicates') {
        return duplicateKeysSet.has(r.key.trim().toUpperCase());
      }
      return true;
    });
  }, [records, searchQuery, filterType, duplicateKeysSet]);

  // Paginated Records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, itemsPerPage]);

  // Handlers
  const handleRecordChange = (id: string, updates: Partial<Pick<DatRecord, 'key' | 'value'>>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleCreateRecord = () => {
    const newRecord: DatRecord = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      key: `TEXT_NEW_KEY_${records.length + 1}`,
      value: t.datEditor.toastNewKey
    };
    
    setRecords(prev => [newRecord, ...prev]);
    setSelectedRecordId(newRecord.id);
    setCurrentPage(1);
  };

  const confirmDeleteRecord = (id: string) => {
    setRecordToDelete(id);
  };

  const executeDeleteRecord = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      if (selectedRecordId === recordToDelete) {
        const remaining = records.filter(r => r.id !== recordToDelete);
        setSelectedRecordId(remaining.length > 0 ? remaining[0].id : null);
      }
      setRecordToDelete(null);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportDat = () => {
    try {
      const buffer = serializeDatFile(records, format);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Keep or transform original filename
      let outName = fileName;
      if (!outName.toLowerCase().endsWith('.dat')) {
        outName += '.dat';
      }
      if (outName.toLowerCase() === 'mastertextfile.dat') {
        outName = 'MasterTextFile_Modified.dat';
      }
      a.download = outName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error al exportar el archivo DAT: ${err.message}`);
    }
  };

  const handleCopyKey = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText).then(() => {
      setCopiedId(id);
      showToast(t.datEditor.toastCopied);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleBulkImport = () => {
    setBulkImportError(null);
    if (!bulkText.trim()) {
      setBulkImportError(t.datEditor.bulkImport.errorNoText);
      return;
    }

    const lines = bulkText.split('\n');
    const imported: DatRecord[] = [];
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      // Support Tab, Semicolon (;), or Equals (=) as separator
      let separator = '\t';
      if (!line.includes('\t')) {
        if (line.includes('=')) separator = '=';
        else if (line.includes(';')) separator = ';';
        else {
          errorCount++;
          continue;
        }
      }

      const parts = line.split(separator);
      const key = parts[0]?.trim();
      const value = parts.slice(1).join(separator)?.trim();

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

    if (imported.length === 0) {
      setBulkImportError(t.datEditor.bulkImport.errorNoKeys);
      return;
    }

    setRecords(prev => [...imported, ...prev]);
    setShowBulkImport(false);
    setBulkText('');
    setSelectedRecordId(imported[0].id);
    setCurrentPage(1);

    const baseMsg = t.datEditor.bulkImport.success.replace('{count}', imported.length.toString());
    const ignoredMsg = errorCount > 0 ? t.datEditor.bulkImport.ignored.replace('{count}', errorCount.toString()) : '';
    alert(baseMsg + ignoredMsg);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* DAT Header Panel */}
      <div className="h-16 border-b border-cyan-900 bg-slate-900/60 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cyan-900/40 border border-cyan-500/30 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">{t.datEditor.editorTitle}</span>
              <span className="px-2 py-0.5 rounded-sm bg-cyan-950 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-tighter">
                v1.1 DAT Spec
              </span>
            </div>
            <h2 className="text-sm font-semibold font-mono text-cyan-200 truncate max-w-md">{fileName}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="px-3 py-1.5 border border-purple-500/40 hover:bg-purple-900/20 text-purple-400 hover:text-purple-300 text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1.5 font-mono"
            title={t.datEditor.bulkImportBtn}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.datEditor.bulkImportBtn}</span>
          </button>

          <button
            onClick={handleExportDat}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5"
            title={t.datEditor.saveDatBtn}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.datEditor.saveDatBtn}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 px-2 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center space-x-1"
            title={t.datEditor.closeBtn}
          >
            <X className="w-4 h-4" />
            <span>{t.datEditor.closeBtn}</span>
          </button>
        </div>
      </div>

      {/* Main interactive area split into list and editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Translation lines table */}
        <div className="flex-1 flex flex-col border-r border-slate-800/80 bg-slate-950/80 p-4 min-w-[320px]">
          {/* Quick Realtime Stats cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex flex-col">
              <span className="text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.total}</span>
              <span className="text-sm font-bold font-mono text-cyan-400">{total}</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex flex-col">
              <span className="text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.unique}</span>
              <span className="text-sm font-bold font-mono text-indigo-400">{uniqueKeysCount}</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex flex-col">
              <span className="text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.empty}</span>
              <span className={`text-sm font-bold font-mono ${emptyCount > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                {emptyCount}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex flex-col">
              <span className="text-[9px] uppercase tracking-tighter text-slate-500">{t.datEditor.stats.duplicates}</span>
              <span className={`text-sm font-bold font-mono ${duplicateKeysCount > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                {duplicateKeysCount}
              </span>
            </div>
          </div>

          {/* Filtering and search row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={t.datEditor.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 focus:border-cyan-500/70 p-2 pl-9 rounded text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-0.5 hover:bg-slate-800 rounded text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 text-[9px] max-md:hidden uppercase tracking-wider font-semibold rounded-sm transition-colors ${
                  filterType === 'all' 
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t.datEditor.filters.all}
              >
                {t.datEditor.filters.all}
              </button>
              <button
                onClick={() => setFilterType('empty')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded-sm transition-colors ${
                  filterType === 'empty' 
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.datEditor.filters.empty.replace('{count}', emptyCount.toString())}
              </button>
              <button
                onClick={() => setFilterType('duplicates')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider font-semibold rounded-sm transition-colors ${
                  filterType === 'duplicates' 
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.datEditor.filters.duplicates.replace('{count}', duplicateKeysCount.toString())}
              </button>
            </div>

            {/* Quick insert button */}
            <button
              onClick={handleCreateRecord}
              className="p-2 bg-emerald-600/80 hover:bg-emerald-500/90 text-slate-950 rounded flex items-center justify-center space-x-1 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
              title={t.datEditor.quickInsertTitle}
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>

          {/* Bulk Import text area panel (hidden by default) */}
          {showBulkImport && (
            <div className="bg-slate-900 border border-purple-900/60 p-3 rounded mb-3 text-left">
              <h3 className="text-xs font-bold text-purple-300 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {t.datEditor.bulkImport.title}
              </h3>
              <p className="text-[10px] text-slate-400 mb-2">
                {t.datEditor.bulkImport.desc1} 
                <br /><code className="text-purple-400 font-mono">{t.datEditor.bulkImport.desc2}</code>
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={t.datEditor.bulkImport.placeholder}
                className="w-full h-32 bg-slate-950 border border-purple-950 p-2 rounded text-xs font-mono text-purple-200 placeholder-purple-950/80 focus:border-purple-500 outline-none"
              ></textarea>
              
              {bulkImportError && (
                <div className="mt-1 p-2 bg-red-950/40 border border-red-900/50 text-red-400 text-[9px] rounded flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{bulkImportError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  onClick={() => { setShowBulkImport(false); setBulkImportError(null); }}
                  className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono text-slate-400 hover:text-slate-200"
                >
                  {t.datEditor.bulkImport.cancel}
                </button>
                <button
                  onClick={handleBulkImport}
                  className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider font-mono bg-purple-600 hover:bg-purple-500 text-slate-950"
                >
                  {t.datEditor.bulkImport.confirm}
                </button>
              </div>
            </div>
          )}

          {/* Table List Container */}
          <div className="flex-1 overflow-y-auto mb-3 border border-slate-900 bg-slate-950 rounded">
            {filteredRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Database className="w-8 h-8 opacity-30 mb-2 text-slate-400" />
                <span className="text-xs">{t.datEditor.list.noResults}</span>
                {searchQuery && <span className="text-[10px] max-w-xs mt-1">{t.datEditor.list.changeSearch}</span>}
              </div>
            ) : (
              <div className="divide-y divide-slate-900/80">
                {paginatedRecords.map((rec) => {
                  const isSelected = rec.id === selectedRecordId;
                  const isRecordEmpty = !rec.value.trim();
                  const isRecordDuplicate = duplicateKeysSet.has(rec.key.trim().toUpperCase());
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecordId(rec.id)}
                      className={`p-2.5 text-left flex items-start justify-between cursor-pointer transition-all border-l-2 ${
                        isSelected 
                          ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 hover:bg-cyan-950/50' 
                          : isRecordDuplicate
                            ? 'border-transparent border-l-rose-500 bg-rose-500/5 hover:bg-slate-900/60 text-slate-300'
                            : isRecordEmpty 
                              ? 'border-transparent border-l-amber-500 bg-amber-500/5 hover:bg-slate-900/60 text-slate-300'
                              : 'border-transparent hover:bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-2 mb-0.5">
                          <span className="font-mono text-xs font-medium text-cyan-400/90 truncate inline-block w-full" title={rec.key}>
                            {rec.key}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isRecordEmpty ? 'text-amber-500/70 italic' : 'text-slate-400'}`}>
                          {isRecordEmpty ? t.datEditor.list.untranslated : rec.value}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyKey(rec.key, rec.id); }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-300"
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
                          className="p-1 hover:bg-red-950/40 hover:text-red-400 rounded text-slate-400"
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

          {/* Table Footer with Snappy Pagination */}
          <div className="h-10 bg-slate-950 border border-slate-900 rounded shrink-0 flex items-center justify-between px-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500">{t.datEditor.pagination.rowsPerPage}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-300 font-mono text-[10px] rounded p-0.5 outline-none"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="font-mono text-[11px]">
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
                className="p-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[10px] px-1 text-slate-400">
                {currentPage}/{totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Split translation row editor */}
        <div className="w-[450px] bg-slate-900/40 p-4 shrink-0 flex flex-col text-left">
          {selectedRecord ? (
            <div className="h-full flex flex-col">
              <div className="p-3 bg-slate-900/80 border border-cyan-800/40 rounded mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-bold font-mono">{t.datEditor.editor.idName}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{t.datEditor.editor.datKey}</span>
                </div>
                
                <div className="relative">
                  <Type className="absolute left-2 text-slate-600 top-2.5 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={selectedRecord.key}
                    onChange={(e) => handleRecordChange(selectedRecord.id, { key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-1.5 pl-8 rounded font-mono text-xs text-slate-200 uppercase outline-none focus:border-cyan-500"
                  />
                </div>
                
                <p className="text-[9px] text-slate-500 mt-1.5 font-mono">
                  {t.datEditor.editor.keyHint} <code className="text-cyan-500/80">Text_ID="{selectedRecord.key || "CLAVE"}"</code>.
                </p>
              </div>

              {/* Translation text card */}
              <div className="flex-1 flex flex-col p-4 bg-slate-900/85 border border-slate-800 rounded">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80">
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold font-mono">{t.datEditor.editor.localizedText}</span>
                  <span className="text-[10px] font-mono text-slate-500">{t.datEditor.editor.formatUTF16}</span>
                </div>

                <div className="flex-1 relative mb-3">
                  <textarea
                    value={selectedRecord.value}
                    onChange={(e) => handleRecordChange(selectedRecord.id, { value: e.target.value })}
                    className="w-full h-full bg-slate-950 border border-slate-850 p-3 rounded text-xs text-slate-200 font-sans leading-relaxed focus:border-cyan-500 outline-none resize-none placeholder-slate-700"
                    placeholder={t.datEditor.editor.placeholder}
                  />
                </div>

                {/* String health and features */}
                <div className="text-[10px] text-slate-500 space-y-1 bg-slate-950/60 p-2.5 rounded border border-slate-900 font-mono">
                  <div className="flex justify-between">
                    <span>{t.datEditor.editor.charSize}</span>
                    <span className="text-cyan-400 font-bold">{selectedRecord.value.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.datEditor.editor.byteSize}</span>
                    <span className="text-cyan-400 font-bold">{selectedRecord.value.length * 2} {t.datEditor.editor.b}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.datEditor.editor.textLines}</span>
                    <span className="text-slate-400">{selectedRecord.value.split('\n').length}</span>
                  </div>
                </div>
              </div>

              {/* Instructions tip */}
              <div className="mt-4 p-3 border border-indigo-900/30 bg-indigo-950/10 rounded flex items-start space-x-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-indigo-300 font-mono italic leading-normal">
                  {t.datEditor.editor.tipBox}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-6 border border-dashed border-slate-850 bg-slate-900/10">
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
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-slate-100 text-lg font-bold mb-2">{t.datEditor.modal.deleteTitle}</h3>
            <p className="text-slate-400 text-sm mb-6">
              {t.datEditor.modal.deleteDesc}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded font-semibold text-sm transition-colors"
              >
                {t.datEditor.modal.cancel}
              </button>
              <button
                onClick={executeDeleteRecord}
                className="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded font-semibold text-sm transition-colors shadow-lg shadow-red-900/20"
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
          <div className="bg-slate-800 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded shadow-xl flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
