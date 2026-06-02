import React, { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Planet } from '../types';
import { useTranslation } from '../i18n';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  planets: Planet[];
  onApply: (tagName: string, value: string, excludedIds: Set<string>) => void;
}

export default function BulkEditModal({ isOpen, onClose, planets, onApply }: BulkEditModalProps) {
  const t = useTranslation();
  const [tagName, setTagName] = useState('');
  const [value, setValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTagName('');
      setValue('');
      setSearchTerm('');
      setExcludedIds(new Set());
    }
  }, [isOpen]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    planets.forEach(p => {
      Array.from(p.el.children).forEach(c => {
        // Only allow text-only child nodes for bulk editing to keep it safe
        if (c.children.length === 0) {
            tags.add(c.tagName);
        }
      });
    });
    return Array.from(tags).sort();
  }, [planets]);

  if (!isOpen) return null;

  const filteredPlanets = planets.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleExclusion = (id: string) => {
    const newSet = new Set(excludedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExcludedIds(newSet);
  };

  const handleApply = () => {
    if (!tagName.trim()) return;
    onApply(tagName.trim(), value, excludedIds);
    onClose();
  };

  const includeCount = planets.length - excludedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/50 shrink-0">
            <h2 className="text-sm font-bold tracking-widest uppercase italic text-cyan-400">{t.bulkEdit.title}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-cyan-400 transition-colors">
              <X className="w-5 h-5"/>
            </button>
         </div>
         
         {/* Body */}
         <div className="p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.bulkEdit.targetProperty}</label>
                    <input 
                        list="xmlTagsList" 
                        value={tagName} 
                        placeholder="e.g. Planet_Credit_Value"
                        onChange={(e) => setTagName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} 
                        className="w-full bg-slate-950 border border-cyan-900/40 px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                    <datalist id="xmlTagsList">
                        {uniqueTags.map(t => <option key={t} value={t} />)}
                    </datalist>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.bulkEdit.newValue}</label>
                    <input 
                        type="text" 
                        value={value} 
                        onChange={(e) => setValue(e.target.value)} 
                        placeholder={t.bulkEdit.newValue}
                        className="w-full bg-slate-950 border border-cyan-900/40 px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            <div className="space-y-2 flex flex-col flex-1 min-h-[300px]">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.bulkEdit.warning}</label>
                    <span className="text-[10px] text-cyan-600 font-mono">{excludedIds.size} Excluded</span>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-2h h-3 w-3 text-cyan-800" style={{top: '10px'}} />
                    <input 
                        placeholder="Search planets to exclude..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-900/40 px-8 py-2 text-xs text-cyan-200 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-500"
                    />
                </div>

                <div className="flex-1 bg-slate-950/80 border border-cyan-900/30 p-2 overflow-y-auto custom-scrollbar space-y-1 mt-1">
                    {filteredPlanets.map(p => {
                        const isExcluded = excludedIds.has(p.id);
                        return (
                            <label key={p.id} className="flex items-center gap-3 p-1.5 hover:bg-slate-900 cursor-pointer group transition-colors">
                                <input type="checkbox" className="hidden" checked={isExcluded} onChange={() => toggleExclusion(p.id)} />
                                <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${
                                    isExcluded 
                                    ? 'border-red-500/50 bg-red-500/10' 
                                    : 'border-cyan-900 bg-slate-950 group-hover:border-cyan-500/50'
                                }`}>
                                    {isExcluded && <X className="w-3 h-3 text-red-400" />}
                                </div>
                                <span className={`text-[11px] uppercase tracking-wider truncate flex-1 ${
                                    isExcluded ? 'text-red-400/60 line-through' : 'text-cyan-50'
                                }`}>
                                    {p.name}
                                </span>
                            </label>
                        );
                    })}
                    {filteredPlanets.length === 0 && (
                        <div className="text-center p-4 text-[10px] uppercase font-bold tracking-widest text-slate-600">
                          No matching records
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed pt-2">
                    {t.bulkEdit.warningDesc} <br/><strong className="text-emerald-400 font-mono">[{value}]</strong> &rarr; <strong className="text-cyan-400 font-mono">&lt;{tagName || 'Node'}&gt;</strong>.
                </p>
            </div>
         </div>

         {/* Footer */}
         <div className="p-4 border-t border-cyan-500/20 bg-slate-950 flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose} 
                className="px-6 py-2.5 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
                {t.bulkEdit.cancel}
            </button>
            <button 
                onClick={handleApply} 
                disabled={!tagName}
                className="px-6 py-2.5 bg-cyan-600 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600"
            >
                {t.bulkEdit.apply} ({includeCount})
            </button>
         </div>
      </div>
    </div>
  );
}
