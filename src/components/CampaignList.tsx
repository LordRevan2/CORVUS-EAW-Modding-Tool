import React, { useState } from 'react';
import { Campaign } from '../types';
import { Search, Plus, Trash2, Copy, Upload, FilePlus2, Shield, Globe, Route, Swords } from 'lucide-react';
import { useLanguage, tr } from '../i18n';

interface CampaignListProps {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  onSelectCampaign: (c: Campaign) => void;
  onAddCampaign: () => void;
  onDuplicateCampaign: (c: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onImportCampaignsXml: () => void;
  onCreateSampleCampaigns: () => void;
  workspaceCampaignFiles?: File[];
  activeCampaignFileName?: string;
  onSelectWorkspaceCampaignFile?: (path: string) => void;
}

export default function CampaignList({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  onAddCampaign,
  onDuplicateCampaign,
  onDeleteCampaign,
  onImportCampaignsXml,
  onCreateSampleCampaigns,
  workspaceCampaignFiles = [],
  activeCampaignFileName = 'Campaigns.xml',
  onSelectWorkspaceCampaignFile
}: CampaignListProps) {
  const lang = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campaignSet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlayerBadgeColor = (player: string) => {
    const p = player.toLowerCase();
    if (p.includes('empire')) return 'text-red-400 bg-red-950/60 border-red-800/50';
    if (p.includes('rebel')) return 'text-orange-400 bg-orange-950/60 border-orange-800/50';
    if (p.includes('underworld')) return 'text-amber-300 bg-amber-950/60 border-amber-800/50';
    if (p.includes('republic')) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';
    if (p.includes('cis')) return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50';
    return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50';
  };

  return (
    <aside className="w-64 border-r border-cyan-800/30 bg-slate-900/40 flex flex-col h-full z-10 shrink-0">
      <div className="p-3.5 border-b border-cyan-800/20 backdrop-blur-md flex flex-col gap-2.5">
        {/* Workspace Campaign File Selector if available */}
        {workspaceCampaignFiles.length > 0 && onSelectWorkspaceCampaignFile && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onSelectWorkspaceCampaignFile(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full bg-slate-950 border border-emerald-800/60 text-emerald-300 font-mono text-[9px] uppercase tracking-widest py-1.5 px-2 rounded-sm cursor-pointer focus:outline-none focus:border-emerald-400"
          >
            <option value="">
              {tr(lang, `File: ${activeCampaignFileName}`, `Archivo: ${activeCampaignFileName}`, `Fichier : ${activeCampaignFileName}`)}
            </option>
            {workspaceCampaignFiles.map((f, i) => (
              <option key={i} value={f.webkitRelativePath || f.name}>
                {f.name}
              </option>
            ))}
          </select>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onAddCampaign}
            className="flex items-center justify-center space-x-1 border border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-widest uppercase transition-all py-1.5 px-2 cursor-pointer rounded-sm"
            title={tr(lang, 'Add New Galactic Conquest', 'Añadir Nueva Conquista Galáctica', 'Ajouter une Conquête Galactique')}
          >
            <Plus className="w-3 h-3 shrink-0" />
            <span className="truncate">{tr(lang, 'New GC', 'Nueva GC', 'Nouv. CG')}</span>
          </button>

          <button
            onClick={onImportCampaignsXml}
            className="flex items-center justify-center space-x-1 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-bold tracking-widest uppercase transition-all py-1.5 px-2 cursor-pointer rounded-sm"
            title={tr(lang, 'Import Campaigns.xml file', 'Importar archivo Campaigns.xml', 'Importer un fichier Campaigns.xml')}
          >
            <Upload className="w-3 h-3 shrink-0" />
            <span className="truncate">{tr(lang, 'Import', 'Importar', 'Importer')}</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-cyan-800" />
          <input
            type="text"
            placeholder={tr(lang, 'Search campaign or set...', 'Buscar campaña o set...', 'Rechercher campagne...')}
            className="w-full bg-slate-950/60 border border-cyan-900/50 pl-8 pr-3 py-1.5 text-xs text-cyan-200 placeholder:text-cyan-800 focus:outline-none focus:border-emerald-500 font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {campaigns.length === 0 ? (
          <div className="p-5 text-center flex flex-col items-center justify-center h-full gap-3">
            <Shield className="w-8 h-8 text-emerald-500/40" />
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              {tr(lang, 'No Campaigns Loaded', 'Sin Campañas Cargadas', 'Aucune Campagne Chargée')}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {tr(
                lang,
                'Import a Campaigns.xml file from your mod or initialize a Galactic Conquest template using current planets.',
                'Importa un archivo Campaigns.xml de tu mod o genera una plantilla de Conquista Galáctica usando los planetas actuales.',
                'Importez un fichier Campaigns.xml de votre mod ou initialisez un modèle de Conquête Galactique.'
              )}
            </p>
            <button
              onClick={onCreateSampleCampaigns}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-2 px-3 text-[10px] rounded-sm transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Init Campaigns.xml', 'Crear Campaigns.xml', 'Créer Campaigns.xml')}</span>
            </button>
          </div>
        ) : (
          <div className="px-2 py-3 space-y-1.5">
            {filtered.map((camp) => {
              const isSelected = selectedCampaign?.id === camp.id;
              const planetCount = camp.locations.filter(
                (l) => l.toLowerCase() !== 'galaxy_core_art_model'
              ).length;
              const totalUnits = camp.startingForces.reduce((acc, sf) => acc + (sf.count || 1), 0);

              return (
                <div
                  key={camp.id}
                  onClick={() => onSelectCampaign(camp)}
                  className={`group p-2.5 flex flex-col gap-1.5 cursor-pointer transition-all rounded-sm border ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                      : 'bg-slate-950/40 hover:bg-slate-900/80 border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider break-all leading-tight ${
                        isSelected ? 'text-emerald-300' : 'text-slate-300'
                      }`}
                    >
                      {camp.name}
                    </span>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateCampaign(camp);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                        title={tr(lang, 'Duplicate Campaign', 'Duplicar Campaña', 'Dupliquer la Campagne')}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCampaign(camp.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={tr(lang, 'Delete Campaign', 'Eliminar Campaña', 'Supprimer la Campagne')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-slate-500 truncate" title={camp.campaignSet}>
                    SET: <span className="text-slate-400">{camp.campaignSet || 'None'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px] font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded-sm border uppercase font-bold ${getPlayerBadgeColor(
                        camp.startingActivePlayer
                      )}`}
                    >
                      {camp.startingActivePlayer || 'Empire'}
                    </span>

                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="flex items-center gap-0.5" title={tr(lang, 'Planets in Campaign', 'Planetas en Campaña', 'Planètes de la Campagne')}>
                        <Globe className="w-2.5 h-2.5 text-cyan-400" />
                        {planetCount}
                      </span>
                      <span className="flex items-center gap-0.5" title={tr(lang, 'Trade Routes', 'Rutas Comerciales', 'Routes Commerciales')}>
                        <Route className="w-2.5 h-2.5 text-amber-400" />
                        {camp.tradeRoutes.length}
                      </span>
                      <span className="flex items-center gap-0.5" title={tr(lang, 'Starting Forces', 'Fuerzas Iniciales', 'Forces de Départ')}>
                        <Swords className="w-2.5 h-2.5 text-emerald-400" />
                        {totalUnits}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center p-4 text-[10px] uppercase font-bold tracking-widest text-slate-600 font-mono">
                {tr(lang, 'No matching campaign', 'Ninguna campaña coincide', 'Aucune campagne ne correspond')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-2.5 bg-slate-950/80 border-t border-cyan-800/30 flex items-center justify-between text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest shrink-0">
        <span>{tr(lang, 'GC v3.1', 'GC v3.1', 'CG v3.1')} ({campaigns.length})</span>
        <span className="text-[9px] text-slate-500 truncate max-w-[110px]" title={activeCampaignFileName}>
          {activeCampaignFileName}
        </span>
      </div>
    </aside>
  );
}
