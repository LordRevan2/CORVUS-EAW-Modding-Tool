import React from 'react';
import { Planet } from '../types';
import { Search, Plus } from 'lucide-react';
import { useTranslation } from '../i18n';

interface PlanetListProps {
  planets: Planet[];
  selectedPlanet: Planet | null;
  onSelectPlanet: (p: Planet) => void;
  onAddPlanet: () => void;
  totalPlanetsCount: number;
  showCore: boolean;
  onToggleShowCore: () => void;
}

export default function PlanetList({ planets, selectedPlanet, onSelectPlanet, onAddPlanet, totalPlanetsCount, showCore, onToggleShowCore }: PlanetListProps) {
  const t = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = planets.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-64 border-r border-cyan-800/30 bg-slate-900/40 flex flex-col h-full z-10 shrink-0">
      <div className="p-4 border-b border-cyan-800/20 backdrop-blur-md flex flex-col gap-3">
        <button 
          onClick={onAddPlanet}
          className="w-full flex items-center justify-center space-x-2 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold tracking-widest uppercase transition-all py-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>{t.planetList.newPlanet}</span>
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-800" />
          <input
            type="text"
            placeholder={t.planetList.search}
            className="w-full bg-slate-950/50 border border-cyan-900/50 px-9 py-1.5 text-xs text-cyan-200 placeholder:text-cyan-800 focus:outline-none focus:border-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-2 py-4 space-y-1">
          {filtered.map((planet) => (
            <div
              key={planet.id}
              onClick={() => onSelectPlanet(planet)}
              className={`group px-3 py-2 flex flex-col justify-center cursor-pointer transition-colors ${
                selectedPlanet?.id === planet.id 
                  ? 'bg-cyan-500/10 border-l-2 border-cyan-500' 
                  : 'hover:bg-slate-800 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                 <span className={`text-xs font-medium uppercase tracking-wider ${
                    selectedPlanet?.id === planet.id ? 'text-cyan-200' : 'text-slate-400'
                  }`}>
                    {planet.name}
                  </span>
                  <span className={`text-[10px] ${
                    selectedPlanet?.id === planet.id ? 'text-cyan-600' : 'text-slate-600'
                  }`}>
                    #{planet.id.replace('p_','').replace('new_','').padStart(3,'0')}
                  </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center p-4 text-[10px] uppercase font-bold tracking-widest text-slate-600">
              {t.planetList.noSignal}
            </div>
          )}
        </div>
      </div>
      <div className="p-3 bg-slate-950/80 border-t border-cyan-800/30 flex flex-col gap-2 shrink-0">
        <label className="flex items-center justify-center gap-2 cursor-pointer group">
           <input type="checkbox" checked={showCore} onChange={onToggleShowCore} className="hidden" />
           <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${showCore ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-700 bg-slate-900 group-hover:border-cyan-700'}`}>
              {showCore && <div className="w-1.5 h-1.5 bg-cyan-400" />}
           </div>
           <span className="text-[9px] uppercase tracking-widest text-slate-500 group-hover:text-cyan-400 transition-colors">{showCore ? t.planetList.hideCore : t.planetList.showCore}</span>
        </label>
        <div className="text-[10px] text-cyan-600 uppercase tracking-widest text-center mt-1">
          {t.planetList.total}: {totalPlanetsCount}
        </div>
      </div>
    </aside>
  );
}
