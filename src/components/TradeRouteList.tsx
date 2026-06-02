import React from 'react';
import { TradeRoute } from '../types';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n';

interface TradeRouteListProps {
  tradeRoutes: TradeRoute[];
  selectedRoute: TradeRoute | null;
  onSelectRoute: (r: TradeRoute) => void;
  onAddRoute: () => void;
  onDeleteRoute: (id: string) => void;
}

export default function TradeRouteList({ tradeRoutes, selectedRoute, onSelectRoute, onAddRoute, onDeleteRoute }: TradeRouteListProps) {
  const t = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = tradeRoutes.filter((r) => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-64 border-r border-cyan-800/30 bg-slate-900/40 flex flex-col h-full z-10 shrink-0">
      <div className="p-4 border-b border-cyan-800/20 backdrop-blur-md flex flex-col gap-3">
        <button 
          onClick={onAddRoute}
          className="w-full flex items-center justify-center space-x-2 border border-amber-500/50 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold tracking-widest uppercase transition-all py-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>{t.routeList.newRoute}</span>
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-800" />
          <input
            type="text"
            placeholder={t.routeList.search}
            className="w-full bg-slate-950/50 border border-cyan-900/50 px-9 py-1.5 text-xs text-cyan-200 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-2 py-4 space-y-1">
          {filtered.map((route) => (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className={`group px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                selectedRoute?.id === route.id 
                  ? 'bg-amber-500/10 border-l-2 border-amber-500' 
                  : 'hover:bg-slate-800 border-l-2 border-transparent'
              }`}
            >
              <div className="flex flex-col">
                 <span className={`text-xs font-medium uppercase tracking-wider ${
                    selectedRoute?.id === route.id ? 'text-amber-300' : 'text-slate-400'
                  }`}>
                    {route.name}
                  </span>
                  <span className={`text-[9px] uppercase tracking-widest ${
                    selectedRoute?.id === route.id ? 'text-amber-500/70' : 'text-slate-600'
                  }`}>
                    {route.pointA} ⇄ {route.pointB}
                  </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRoute(route.id);
                }}
                className={`p-1.5 rounded transition-all ${
                  selectedRoute?.id === route.id
                    ? 'text-red-400 hover:bg-red-500/20'
                    : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                }`}
                title={t.routeList.deleteRoute}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center p-4 text-[10px] uppercase font-bold tracking-widest text-slate-600">
              {t.routeList.noSignal}
            </div>
          )}
        </div>
      </div>
      <div className="p-3 bg-slate-950/80 border-t border-cyan-800/30 flex flex-col gap-2 shrink-0">
        <div className="text-[10px] text-amber-600/70 uppercase tracking-widest text-center mt-1">
          {t.routeList.total}: {tradeRoutes.length}
        </div>
      </div>
    </aside>
  );
}
