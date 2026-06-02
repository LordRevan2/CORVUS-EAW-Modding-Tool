import React, { useEffect, useState } from 'react';
import { TradeRoute } from '../types';
import { Trash2, HelpCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

interface TradeRouteEditorProps {
  route: TradeRoute | null;
  onUpdate: (r: TradeRoute, nodeUpdates?: {tagName: string, value: string}[]) => void;
  onDelete: () => void;
}

export default function TradeRouteEditor({ route, onUpdate, onDelete }: TradeRouteEditorProps) {
  const t = useTranslation();
  const [localName, setLocalName] = useState('');

  useEffect(() => {
    if (route) {
      setLocalName(route.name);
    }
  }, [route]);

  if (!route) {
    return (
      <aside className="w-80 bg-slate-900/40 border-l border-cyan-800/30 flex items-center justify-center p-6 text-center z-10 shrink-0">
        <div className="text-[10px] uppercase font-bold tracking-widest text-cyan-800">{t.routeEditor.noRouteActive}</div>
      </aside>
    );
  }

  const getPropValue = (tagName: string) => {
    const node = Array.from(route.el.children).find(c => c.tagName === tagName);
    return node ? node.textContent || '' : '';
  };

  const updateTag = (tagName: string, value: string) => {
    onUpdate(route, [{ tagName, value }]);
  };

  const handleNameBlur = () => {
    if (localName !== route.name) {
      const updated = { ...route, name: localName };
      updated.el.setAttribute('Name', localName);
      onUpdate(updated);
    }
  };

  const handlePointABlur = (value: string) => {
      const updated = { ...route, pointA: value };
      onUpdate(updated, [{ tagName: 'Point_A', value }]);
  };

  const handlePointBBlur = (value: string) => {
      const updated = { ...route, pointB: value };
      onUpdate(updated, [{ tagName: 'Point_B', value }]);
  };
  
  return (
    <aside className="w-80 bg-slate-900 border-l border-cyan-800/30 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 shrink-0">
      <div className="p-4 border-b border-cyan-800/20 bg-slate-950/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest truncate mr-2" title={route.name}>
          {route.name || 'Unnamed Route'}
        </h2>
        <button 
          onClick={onDelete}
          className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors rounded"
          title={t.routeEditor.deleteRoute}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.routeEditor.routeName}</label>
            </div>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              className="w-full bg-slate-950 border border-cyan-900/50 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500 text-amber-200"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.routeEditor.pointA}</label>
              <HelpCircle className="w-3 h-3 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.routeEditor.pointAHelp} />
            </div>
            <input
              type="text"
              value={getPropValue('Point_A')}
              onChange={(e) => updateTag('Point_A', e.target.value)}
              onBlur={(e) => handlePointABlur(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-900/50 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 text-cyan-100 uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.routeEditor.pointB}</label>
              <HelpCircle className="w-3 h-3 text-cyan-800 hover:text-cyan-400 cursor-help" title={t.routeEditor.pointBHelp} />
            </div>
            <input
              type="text"
              value={getPropValue('Point_B')}
              onChange={(e) => updateTag('Point_B', e.target.value)}
              onBlur={(e) => handlePointBBlur(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-900/50 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 text-cyan-100 uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.routeEditor.speedFactor}</label>
            </div>
            <input
              type="number"
              step="0.1"
              value={getPropValue('HS_Speed_Factor')}
              onChange={(e) => updateTag('HS_Speed_Factor', e.target.value)}
              className="w-full bg-slate-950 border border-cyan-900/50 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 text-cyan-100"
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.routeEditor.creditGain}</label>
            </div>
            <input
              type="number"
              step="0.01"
              value={getPropValue('Credit_Gain_Factor')}
              onChange={(e) => updateTag('Credit_Gain_Factor', e.target.value)}
              className="w-full bg-slate-950 border border-cyan-900/50 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-400"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
