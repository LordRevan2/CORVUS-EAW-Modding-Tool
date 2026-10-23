import React from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { useTranslation } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const t = useTranslation();

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: boolean | number | string) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-900/50 shadow-[0_0_40px_rgba(6,182,212,0.12)] flex flex-col rounded-sm overflow-hidden">
         <div className="p-4 border-b border-cyan-900/40 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-sm bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                  <SettingsIcon className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">{t.settingsModal.title} // HUD</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">
              <X className="w-5 h-5"/>
            </button>
         </div>
         
         <div className="p-5 flex flex-col gap-6">
            <div className="space-y-3">
                <h3 className="text-[10px] font-mono uppercase font-bold text-cyan-500/80 tracking-widest border-b border-slate-800 pb-1.5">
                  {t.settingsModal.language}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'en', code: 'EN', label: 'English' },
                    { id: 'es', code: 'ES', label: 'Español' },
                    { id: 'fr', code: 'FR', label: 'Français' }
                  ] as const).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleChange('language', item.id)}
                      className={`py-2 px-3 rounded-sm border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        settings.language === item.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[11px]">{item.code}</span>
                      <span className="text-[9px] font-sans font-normal opacity-80 capitalize">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                    <select
                        value={settings.language}
                        onChange={(e) => handleChange('language', e.target.value as Language)}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 text-cyan-50 rounded-sm cursor-pointer"
                    >
                        <option value="en">{t.settingsModal.english}</option>
                        <option value="es">{t.settingsModal.spanish}</option>
                        <option value="fr">{t.settingsModal.french}</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-800 pb-1">{t.settingsModal.galaxyMap}</h3>
                
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-slate-300 group-hover:text-cyan-300 transition-colors">{t.settingsModal.showGrid}</span>
                    <input 
                        type="checkbox" 
                        checked={settings.showGrid} 
                        onChange={(e) => handleChange('showGrid', e.target.checked)}
                        className="accent-cyan-500 w-4 h-4"
                    />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-slate-300 group-hover:text-cyan-300 transition-colors">{t.settingsModal.snapToGrid}</span>
                    <input 
                        type="checkbox" 
                        checked={settings.snapToGrid} 
                        onChange={(e) => handleChange('snapToGrid', e.target.checked)}
                        className="accent-cyan-500 w-4 h-4"
                    />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-slate-300 group-hover:text-cyan-300 transition-colors">{t.settingsModal.invertY}</span>
                    <input 
                        type="checkbox" 
                        checked={settings.invertY} 
                        onChange={(e) => handleChange('invertY', e.target.checked)}
                        className="accent-cyan-500 w-4 h-4"
                    />
                </label>

                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.settingsModal.gridSize}</label>
                    <input 
                        type="number" 
                        step="0.1"
                        value={settings.gridSize} 
                        onChange={(e) => handleChange('gridSize', parseFloat(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 text-cyan-50"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-800 pb-1">{t.settingsModal.storyEditor || 'Story Editor'}</h3>
                
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-slate-300 group-hover:text-cyan-300 transition-colors">{t.settingsModal.editableXml || 'Enable XML Editing'}</span>
                    <input 
                        type="checkbox" 
                        checked={settings.storyXmlEditable} 
                        onChange={(e) => handleChange('storyXmlEditable', e.target.checked)}
                        className="accent-cyan-500 w-4 h-4"
                    />
                </label>
            </div>
         </div>

         <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-cyan-600 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors"
            >
                {t.settingsModal.done}
            </button>
         </div>
      </div>
    </div>
  );
}
