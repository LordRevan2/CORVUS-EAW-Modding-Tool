import React, { useState, useMemo } from 'react';
import { Campaign, CampaignFactionSetting, StartingForceEntry, Planet, TradeRoute } from '../types';
import {
  Trash2,
  Shield,
  Globe,
  Route,
  Swords,
  Crown,
  Coins,
  Cpu,
  Plus,
  Minus,
  Sparkles,
  CheckSquare,
  Square,
  MousePointerClick,
  Link2,
  Search,
  Trophy,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Undo2,
  Redo2,
  RotateCcw,
  FileCode2
} from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import { DatRecord } from '../lib/dat';

interface CampaignEditorProps {
  campaign: Campaign | null;
  planets: Planet[];
  tradeRoutes: TradeRoute[];
  selectedPlanet: Planet | null;
  onSelectPlanet: (p: Planet | null) => void;
  onUpdateCampaign: (updated: Campaign, actionMeta?: { label: string; coalesceKey?: string }) => void;
  onDeleteCampaign: () => void;
  mapClickTogglesPlanet: boolean;
  onToggleMapClickMode: (enabled: boolean) => void;
  isPreviewMode: boolean;
  onTogglePreviewMode: (enabled: boolean) => void;
  hideExcludedInPreview?: boolean;
  onToggleHideExcluded?: (hide: boolean) => void;
  datRecords?: DatRecord[] | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canRevertNode?: boolean;
  onRevertNode?: () => void;
}

const COMMON_EAW_UNITS = [
  // Starbases
  'Empire_Star_Base_1', 'Empire_Star_Base_2', 'Empire_Star_Base_3', 'Empire_Star_Base_4', 'Empire_Star_Base_5',
  'Rebel_Star_Base_1', 'Rebel_Star_Base_2', 'Rebel_Star_Base_3', 'Rebel_Star_Base_4', 'Rebel_Star_Base_5',
  'Underworld_Star_Base_1', 'Underworld_Star_Base_2', 'Underworld_Star_Base_3', 'Underworld_Star_Base_4', 'Underworld_Star_Base_5',
  // Ground Structures
  'E_Ground_Barracks', 'E_Ground_Light_Vehicle_Factory', 'E_Ground_Heavy_Vehicle_Factory', 'E_Ground_Advanced_Vehicle_Factory',
  'E_Ground_Officer_Academy', 'E_Ground_Research_Facility', 'Empire_Ground_Mining_Facility', 'Empire_Ground_Shutter_Shield', 'E_Ground_Base_Shield', 'E_Ground_Turbolaser_Tower',
  'R_Ground_Barracks', 'R_Ground_Light_Vehicle_Factory', 'R_Ground_Heavy_Vehicle_Factory', 'R_Ground_Officer_Academy',
  'R_Ground_Research_Facility', 'Rebel_Ground_Mining_Facility', 'Rebel_Ground_Shutter_Shield', 'R_Ground_Base_Shield', 'R_Ground_Turbolaser_Tower',
  'U_Ground_Barracks', 'U_Ground_Vehicle_Factory', 'U_Ground_Droid_Works', 'U_Ground_Palace', 'U_Ground_Mining_Facility',
  // Empire Space & Land Units
  'Star_Destroyer', 'Executor_Super_Star_Destroyer', 'Victory_Destroyer', 'Acclamator_Assault_Ship', 'Interdictor_Cruiser',
  'Tartan_Patrol_Cruiser', 'Broadside_Class_Cruiser', 'TIE_Fighter_Squadron', 'TIE_Bomber_Squadron', 'TIE_Interceptor_Squadron',
  'TIE_Scout_Squadron', 'TIE_Defender_Squadron', 'Stormtrooper_Squad', 'Scout_Trooper_Squad', 'Imperial_Artillery_Corp',
  'Imperial_Heavy_Scout_Squad', 'Imperial_Anti_Aircraft_Company', 'Imperial_Armor_Group', 'Imperial_Heavy_Assault_Company',
  // Rebel Space & Land Units
  'Calamari_Cruiser', 'Home_One', 'Alliance_Assault_Frigate', 'Nebulon_B_Frigate', 'Corellian_Corvette', 'Corellian_Gunboat',
  'Marauder_Missile_Cruiser', 'Rebel_X-Wing_Squadron', 'Y-Wing_Squadron', 'A-Wing_Squadron', 'B-Wing_Squadron', 'Z95_Headhunter_Squadron',
  'Rebel_Infantry_Squad', 'Rebel_Tank_Buster_Squad', 'Rebel_Infiltrator_Team', 'Rebel_Light_Tank_Brigade', 'Rebel_Heavy_Tank_Brigade',
  'Rebel_Artillery_Brigade', 'Rebel_Speeder_Wing',
  // Underworld Space & Land Units
  'Vengeance_Frigate', 'Kedri_Destroyer', 'Kedalbe_Battleship', 'Crusader_Gunship', 'Interceptor_Frigate', 'StarViper_Squadron',
  'Skipray_Squadron', 'Underworld_Merc_Squad', 'Underworld_Disruptor_Merc_Squad', 'Underworld_Saboteur_Team',
  'Vornskr_Wolf_Pack', 'Night_Sister', 'F9TZ_Cloaking_Transport_Company', 'MAL_Rocket_Vehicle_Company', 'Canderous_Assault_Tank_Company',
  // Heroes
  'Darth_Vader', 'Emperor_Palpatine', 'Grand_Moff_Tarkin', 'Boba_Fett_Team', 'General_Veers_Team', 'Mara_Jade_Team', 'Thrawn',
  'Mon_Mothma_Team', 'Obi_Wan_Team', 'Han_Solo_Team', 'Luke_Skywalker_Jedi_Team', 'Red_Squadron', 'Rogue_Squadron', 'Sundered_Heart',
  'Tyber_Zann_Team', 'Urai_Fen_Team', 'Bossk_Team', 'IG-88_Team', 'Silri_Team'
];

const VICTORY_CONDITION_PRESETS = [
  'Galactic_All_Planets_Controlled',
  'Galactic_Control_Named_Planets',
  'Galactic_Destroy_Hero',
  'Galactic_Economic_Victory'
];

const AI_PLAYER_PRESETS = [
  'SandboxHuman',
  'BasicEmpire',
  'BasicRebel',
  'UnderworldAI',
  'AggressiveEmpire',
  'AggressiveRebel',
  'DefensiveGalacticAI',
  'None'
];

export default function CampaignEditor({
  campaign,
  planets,
  tradeRoutes,
  selectedPlanet,
  onSelectPlanet,
  onUpdateCampaign,
  onDeleteCampaign,
  mapClickTogglesPlanet,
  onToggleMapClickMode,
  isPreviewMode,
  onTogglePreviewMode,
  hideExcludedInPreview = false,
  onToggleHideExcluded,
  datRecords,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  canRevertNode = false,
  onRevertNode
}: CampaignEditorProps) {
  const lang = useLanguage();
  const [subTab, setSubTab] = useState<'general' | 'factions' | 'theater' | 'forces'>('general');
  const [showNodeXmlPreview, setShowNodeXmlPreview] = useState(false);

  // State for Theater tab
  const [theaterView, setTheaterView] = useState<'planets' | 'routes'>('planets');
  const [theaterSearch, setTheaterSearch] = useState('');

  // State for Adding Faction
  const [newFactionName, setNewFactionName] = useState('');

  // State for Starting Forces tab
  const [forceFilterScope, setForceFilterScope] = useState<'selected' | 'all'>('all');
  const [forceFactionFilter, setForceFactionFilter] = useState<string>('ALL');
  const [newForceFaction, setNewForceFaction] = useState<string>('Empire');
  const [newForcePlanet, setNewForcePlanet] = useState<string>('');
  const [newForceUnit, setNewForceUnit] = useState<string>('Empire_Star_Base_1');
  const [newForceQty, setNewForceQty] = useState<number>(1);
  const [newCustomVictory, setNewCustomVictory] = useState<string>('');

  // Resolve .DAT text if available
  const datLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (datRecords) {
      datRecords.forEach(r => map.set(r.key.toUpperCase(), r.value));
    }
    return map;
  }, [datRecords]);

  if (!campaign) {
    return (
      <aside className="w-96 bg-slate-900/40 border-l border-cyan-800/30 flex flex-col items-center justify-center p-6 text-center z-10 shrink-0 gap-3">
        <Shield className="w-8 h-8 text-emerald-500/30" />
        <div className="text-[10px] uppercase font-bold tracking-widest text-cyan-700 font-mono">
          {lang === 'es'
            ? 'Selecciona o crea una Conquista Galáctica (Campaigns.xml) para configurar su teatro de guerra'
            : 'Select or create a Galactic Conquest campaign to configure its war theater'}
        </div>
      </aside>
    );
  }

  const activePlanetForForces = selectedPlanet?.name || newForcePlanet || campaign.locations.find(l => l.toLowerCase() !== 'galaxy_core_art_model') || 'Coruscant';

  // Helper to determine controlling faction of a planet in this campaign
  const getPlanetControllingFaction = (planetName: string): string | null => {
    const pLower = planetName.toLowerCase();
    // Check Home_Location first
    const homeFaction = campaign.factions.find(f => f.homeLocation.toLowerCase() === pLower);
    if (homeFaction) return homeFaction.faction;
    // Otherwise check Starting_Forces
    const forceEntry = campaign.startingForces.find(sf => sf.planet.toLowerCase() === pLower);
    return forceEntry ? forceEntry.faction : null;
  };

  const getFactionAccent = (faction: string | null) => {
    if (!faction) return 'text-slate-400 border-slate-700 bg-slate-900/50';
    const f = faction.toLowerCase();
    if (f.includes('empire')) return 'text-red-400 border-red-700/60 bg-red-950/50';
    if (f.includes('rebel')) return 'text-orange-400 border-orange-700/60 bg-orange-950/50';
    if (f.includes('underworld')) return 'text-amber-300 border-amber-700/60 bg-amber-950/50';
    if (f.includes('republic')) return 'text-emerald-400 border-emerald-700/60 bg-emerald-950/50';
    if (f.includes('cis')) return 'text-indigo-400 border-indigo-700/60 bg-indigo-950/50';
    return 'text-purple-300 border-purple-700/60 bg-purple-950/50';
  };

  // Toggle a planet in campaign.locations
  const togglePlanetInLocations = (planetName: string) => {
    const exists = campaign.locations.some(l => l.toLowerCase() === planetName.toLowerCase());
    const nextLocations = exists
      ? campaign.locations.filter(l => l.toLowerCase() !== planetName.toLowerCase())
      : [...campaign.locations, planetName];
    onUpdateCampaign(
      { ...campaign, locations: nextLocations },
      { label: `${campaign.name}: ${exists ? '-' : '+'}<Locations> ${planetName}` }
    );
  };

  // Toggle a trade route in campaign.tradeRoutes
  const toggleRouteInCampaign = (routeName: string) => {
    const exists = campaign.tradeRoutes.some(r => r.toLowerCase() === routeName.toLowerCase());
    const nextRoutes = exists
      ? campaign.tradeRoutes.filter(r => r.toLowerCase() !== routeName.toLowerCase())
      : [...campaign.tradeRoutes, routeName];
    onUpdateCampaign(
      { ...campaign, tradeRoutes: nextRoutes },
      { label: `${campaign.name}: ${exists ? '-' : '+'}<Trade_Routes> ${routeName}` }
    );
  };

  // Auto-link Trade Routes where both Point_A and Point_B are active in campaign.locations
  const handleAutoLinkRoutes = () => {
    const locSet = new Set(campaign.locations.map(l => l.toLowerCase()));
    const validRoutes = tradeRoutes
      .filter(r => locSet.has(r.pointA.toLowerCase()) && locSet.has(r.pointB.toLowerCase()))
      .map(r => r.name);
    onUpdateCampaign(
      { ...campaign, tradeRoutes: validRoutes },
      { label: `${campaign.name}: Auto-link <Trade_Routes> (${validRoutes.length})` }
    );
  };

  // Include all planets from Planets.xml
  const handleSelectAllPlanets = () => {
    const allNames = ['Galaxy_Core_Art_Model', ...planets.filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model').map(p => p.name)];
    onUpdateCampaign(
      { ...campaign, locations: Array.from(new Set(allNames)) },
      { label: `${campaign.name}: <Locations> (${allNames.length} planetas)` }
    );
  };

  // Clear all planets except Galaxy_Core_Art_Model
  const handleClearPlanets = () => {
    onUpdateCampaign(
      { ...campaign, locations: ['Galaxy_Core_Art_Model'] },
      { label: `${campaign.name}: Limpiar <Locations>` }
    );
  };

  // Update a specific faction setting
  const handleUpdateFaction = (factionName: string, patch: Partial<CampaignFactionSetting>) => {
    const patchKey = Object.keys(patch)[0] || 'setting';
    const nextFactions = campaign.factions.map(f =>
      f.faction.toLowerCase() === factionName.toLowerCase() ? { ...f, ...patch } : f
    );
    onUpdateCampaign(
      { ...campaign, factions: nextFactions },
      {
        label: `${campaign.name}: [${factionName}] ${patchKey}`,
        coalesceKey: `gc_${campaign.id}_fac_${factionName}_${patchKey}`
      }
    );
  };

  const handleAddFaction = () => {
    const clean = newFactionName.trim();
    if (!clean) return;
    if (campaign.factions.some(f => f.faction.toLowerCase() === clean.toLowerCase())) {
      setNewFactionName('');
      return;
    }
    const added: CampaignFactionSetting = {
      faction: clean,
      homeLocation: '',
      startingCredits: 3000,
      startingTechLevel: 1,
      maxTechLevel: 5,
      aiPlayerControl: 'BasicEmpire',
      markupFilename: 'DefaultGalacticHints.xml',
      storyName: ''
    };
    onUpdateCampaign(
      { ...campaign, factions: [...campaign.factions, added] },
      { label: `${campaign.name}: +Facción ${clean}` }
    );
    setNewFactionName('');
  };

  const handleRemoveFaction = (factionName: string) => {
    onUpdateCampaign(
      {
        ...campaign,
        factions: campaign.factions.filter(f => f.faction.toLowerCase() !== factionName.toLowerCase())
      },
      { label: `${campaign.name}: -Facción ${factionName}` }
    );
  };

  // Add a Starting Force entry (or increment count if identical tuple exists)
  const handleAddStartingForce = () => {
    const targetPlanet = (selectedPlanet && forceFilterScope === 'selected')
      ? selectedPlanet.name
      : (newForcePlanet || activePlanetForForces);
    const cleanUnit = newForceUnit.trim();
    const cleanFaction = newForceFaction.trim() || 'Empire';
    if (!targetPlanet || !cleanUnit) return;

    // Also ensure targetPlanet is in campaign.locations
    const inLocations = campaign.locations.some(l => l.toLowerCase() === targetPlanet.toLowerCase());
    const nextLocations = inLocations ? campaign.locations : [...campaign.locations, targetPlanet];

    const existingIdx = campaign.startingForces.findIndex(
      sf =>
        sf.faction.toLowerCase() === cleanFaction.toLowerCase() &&
        sf.planet.toLowerCase() === targetPlanet.toLowerCase() &&
        sf.unitType.toLowerCase() === cleanUnit.toLowerCase()
    );

    let nextForces: StartingForceEntry[];
    if (existingIdx >= 0) {
      nextForces = campaign.startingForces.map((sf, idx) =>
        idx === existingIdx ? { ...sf, count: sf.count + Math.max(1, newForceQty) } : sf
      );
    } else {
      nextForces = [
        ...campaign.startingForces,
        {
          id: `sf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          faction: cleanFaction,
          planet: targetPlanet,
          unitType: cleanUnit,
          count: Math.max(1, newForceQty)
        }
      ];
    }

    onUpdateCampaign(
      {
        ...campaign,
        locations: nextLocations,
        startingForces: nextForces
      },
      { label: `${campaign.name}: +<Starting_Forces> ${cleanUnit} @ ${targetPlanet}` }
    );
  };

  // 1-Click Starter Base & Garrison template on target planet
  const handleApplyStarterGarrison = (faction: string, planetName: string) => {
    if (!planetName) return;
    const fLower = faction.toLowerCase();
    let templates: string[] = [];
    if (fLower.includes('rebel')) {
      templates = ['Rebel_Star_Base_2', 'R_Ground_Barracks', 'R_Ground_Light_Vehicle_Factory', 'Calamari_Cruiser', 'Rebel_X-Wing_Squadron', 'Rebel_Infantry_Squad'];
    } else if (fLower.includes('underworld')) {
      templates = ['Underworld_Star_Base_2', 'U_Ground_Barracks', 'U_Ground_Vehicle_Factory', 'Vengeance_Frigate', 'StarViper_Squadron', 'Underworld_Merc_Squad'];
    } else {
      templates = ['Empire_Star_Base_2', 'E_Ground_Barracks', 'E_Ground_Light_Vehicle_Factory', 'Star_Destroyer', 'TIE_Fighter_Squadron', 'Stormtrooper_Squad'];
    }

    const inLocations = campaign.locations.some(l => l.toLowerCase() === planetName.toLowerCase());
    const nextLocations = inLocations ? campaign.locations : [...campaign.locations, planetName];

    const nextForces = [...campaign.startingForces];
    templates.forEach(unitType => {
      const existing = nextForces.find(
        sf =>
          sf.faction.toLowerCase() === faction.toLowerCase() &&
          sf.planet.toLowerCase() === planetName.toLowerCase() &&
          sf.unitType.toLowerCase() === unitType.toLowerCase()
      );
      if (!existing) {
        nextForces.push({
          id: `sf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          faction,
          planet: planetName,
          unitType,
          count: 1
        });
      }
    });

    onUpdateCampaign(
      {
        ...campaign,
        locations: nextLocations,
        startingForces: nextForces
      },
      { label: `${campaign.name}: Guarnición Base [${faction}] @ ${planetName}` }
    );
  };

  const handleUpdateForceCount = (id: string, delta: number) => {
    const targetForce = campaign.startingForces.find(sf => sf.id === id);
    const nextForces = campaign.startingForces
      .map(sf => (sf.id === id ? { ...sf, count: sf.count + delta } : sf))
      .filter(sf => sf.count > 0);
    onUpdateCampaign(
      { ...campaign, startingForces: nextForces },
      {
        label: `${campaign.name}: <Starting_Forces> ${targetForce?.unitType || ''} (${delta > 0 ? '+' : ''}${delta})`,
        coalesceKey: `gc_${campaign.id}_sf_${id}`
      }
    );
  };

  const handleDeleteForce = (id: string) => {
    const targetForce = campaign.startingForces.find(sf => sf.id === id);
    onUpdateCampaign(
      {
        ...campaign,
        startingForces: campaign.startingForces.filter(sf => sf.id !== id)
      },
      { label: `${campaign.name}: -<Starting_Forces> ${targetForce?.unitType || ''}` }
    );
  };

  const nonCorePlanets = planets.filter(
    p => p.name.toLowerCase() !== 'galaxy_core_art_model'
  );
  const nonCoreLocationsCount = campaign.locations.filter(
    l => l.toLowerCase() !== 'galaxy_core_art_model'
  ).length;
  const dimmedPlanetsCount = Math.max(0, nonCorePlanets.length - nonCoreLocationsCount);
  const dimmedRoutesCount = Math.max(0, tradeRoutes.length - campaign.tradeRoutes.length);

  // Layout Integrity Check: verify that all active campaign Trade_Routes have both endpoints in campaign.locations
  const locLowerSet = new Set(campaign.locations.map(l => l.toLowerCase()));
  const danglingRoutes = tradeRoutes.filter(tr => {
    const isRouteInCampaign = campaign.tradeRoutes.some(r => r.toLowerCase() === tr.name.toLowerCase());
    if (!isRouteInCampaign) return false;
    return !locLowerSet.has(tr.pointA.toLowerCase()) || !locLowerSet.has(tr.pointB.toLowerCase());
  });

  // Verify that all Home_Location and Starting_Forces planets are included in campaign.locations
  const missingRefPlanets = Array.from(
    new Set([
      ...campaign.factions.map(f => f.homeLocation).filter(Boolean),
      ...campaign.startingForces.map(sf => sf.planet).filter(Boolean)
    ])
  ).filter(pName => !locLowerSet.has(pName.toLowerCase()));

  const handleAutoFixLayoutIssues = () => {
    const nextLocs = [...campaign.locations];
    const addIfMissing = (pName: string) => {
      if (pName && !nextLocs.some(l => l.toLowerCase() === pName.toLowerCase())) {
        nextLocs.push(pName);
      }
    };
    missingRefPlanets.forEach(addIfMissing);
    danglingRoutes.forEach(tr => {
      addIfMissing(tr.pointA);
      addIfMissing(tr.pointB);
    });
    onUpdateCampaign(
      { ...campaign, locations: nextLocs },
      { label: `${campaign.name}: Auto-Fix <Locations>` }
    );
  };

  const campaignXmlSnippet = useMemo(() => {
    if (campaign.xmlNode) {
      return new XMLSerializer().serializeToString(campaign.xmlNode);
    }
    return `<Campaign Name="${campaign.name}">\n  <Campaign_Set>${campaign.campaignSet}</Campaign_Set>\n  <Locations>${campaign.locations.join(', ')}</Locations>\n  <Trade_Routes>${campaign.tradeRoutes.join(', ')}</Trade_Routes>\n</Campaign>`;
  }, [campaign]);

  return (
    <aside className="w-[400px] bg-slate-900 border-l border-cyan-800/30 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-cyan-800/20 bg-slate-950/70 backdrop-blur-md flex items-center justify-between shrink-0 gap-2">
        <div className="min-w-0 pr-1 flex-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-widest truncate font-mono" title={campaign.name}>
              {campaign.name}
            </h2>
            <span className="px-1.5 py-0.2 rounded-sm bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold shrink-0">
              v3.3
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{nonCoreLocationsCount} {tr(lang, 'planets', 'planetas', 'planètes')}</span>
            <span>•</span>
            <span>{campaign.tradeRoutes.length} {tr(lang, 'routes', 'rutas', 'routes')}</span>
            <span>•</span>
            <span>{campaign.startingForces.reduce((a, b) => a + b.count, 0)} {tr(lang, 'units', 'unidades', 'unités')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Explicit Preview Mode Toggle Button */}
          <button
            onClick={() => onTogglePreviewMode(!isPreviewMode)}
            className={`px-2.5 py-1 rounded-sm border font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isPreviewMode
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-600 hover:text-cyan-300'
            }`}
            title={tr(
              lang,
              'Preview Mode: Dims unselected planets and trade routes on the main GalaxyMap',
              'Modo Vista Previa: Atenúa en el mapa galáctico los planetas y rutas no incluidos en esta campaña',
              'Mode Aperçu : Atténue sur la carte galactique les planètes et routes non incluses'
            )}
          >
            {isPreviewMode ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{tr(lang, 'Preview', 'Preview', 'Aperçu')}</span>
            <span className={`px-1 rounded text-[8px] ${isPreviewMode ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
              {isPreviewMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={onDeleteCampaign}
            className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors rounded cursor-pointer shrink-0"
            title={tr(lang, 'Delete Campaign', 'Eliminar Campaña', 'Supprimer la Campagne')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* XML Node History & Revert Strip (v3.3) */}
      <div className="px-3.5 py-2 border-b border-cyan-900/30 bg-slate-950/90 flex items-center justify-between gap-1.5 shrink-0 font-mono text-[9px]">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2 py-1 rounded-sm border border-cyan-800/50 bg-slate-900 text-cyan-300 hover:bg-cyan-950/60 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
            title={tr(lang, 'Undo last XML action (Ctrl+Z)', 'Deshacer último cambio XML (Ctrl+Z)', 'Annuler la dernière action XML (Ctrl+Z)')}
          >
            <Undo2 className="w-3 h-3" />
            <span>{tr(lang, 'Undo', 'Deshacer', 'Annuler')}</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2 py-1 rounded-sm border border-cyan-800/50 bg-slate-900 text-cyan-300 hover:bg-cyan-950/60 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
            title={tr(lang, 'Redo XML action (Ctrl+Y)', 'Rehacer cambio XML (Ctrl+Y)', 'Rétablir l’action XML (Ctrl+Y)')}
          >
            <Redo2 className="w-3 h-3" />
            <span>{tr(lang, 'Redo', 'Rehacer', 'Rétablir')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNodeXmlPreview(v => !v)}
            className={`px-2 py-1 rounded-sm border flex items-center gap-1 cursor-pointer transition-colors ${
              showNodeXmlPreview
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
            }`}
            title={tr(lang, 'Inspect live <Campaign> XML node', 'Inspeccionar nodo XML <Campaign> en vivo', 'Inspecter le nœud XML <Campaign>')}
          >
            <FileCode2 className="w-3 h-3" />
            <span>&lt;XML&gt;</span>
          </button>
          <button
            onClick={onRevertNode}
            disabled={!canRevertNode}
            className="px-2 py-1 rounded-sm border border-amber-600/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
            title={tr(
              lang,
              'Revert this <Campaign> XML node to its initial loaded state',
              'Revertir este nodo <Campaign> a su estado XML original cargado',
              'Rétablir ce nœud <Campaign> à son état XML initial'
            )}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{tr(lang, 'Revert Node', 'Revertir Nodo', 'Rétablir Nœud')}</span>
          </button>
        </div>
      </div>

      {showNodeXmlPreview && (
        <div className="px-3.5 py-2.5 bg-slate-950 border-b border-emerald-800/40 max-h-40 overflow-y-auto custom-scrollbar shrink-0">
          <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 uppercase mb-1">
            <span>DOM &lt;Campaign Name=&quot;{campaign.name}&quot;&gt;</span>
            {canRevertNode && (
              <span className="text-amber-300">{tr(lang, 'Modified from baseline', 'Modificado respecto al original', 'Modifié par rapport à l’original')}</span>
            )}
          </div>
          <pre className="text-[9px] font-mono text-cyan-200/90 whitespace-pre-wrap break-all leading-relaxed bg-slate-900/90 p-2 rounded border border-cyan-900/40">
            {campaignXmlSnippet}
          </pre>
        </div>
      )}

      {/* Campaign Map Preview & Layout Verification Strip */}
      <div className={`px-3.5 py-2 border-b font-mono text-[9px] shrink-0 transition-colors ${
        isPreviewMode
          ? 'bg-emerald-950/25 border-emerald-800/40'
          : 'bg-slate-950/60 border-slate-800/70'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${isPreviewMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="uppercase tracking-wider font-bold text-[9px]">
              {isPreviewMode
                ? tr(
                    lang,
                    `Preview Active (${dimmedPlanetsCount} planets / ${dimmedRoutesCount} routes dimmed)`,
                    `Vista Previa Activa (${dimmedPlanetsCount} planetas / ${dimmedRoutesCount} rutas atenuados)`,
                    `Aperçu Actif (${dimmedPlanetsCount} planètes / ${dimmedRoutesCount} routes atténuées)`
                  )
                : tr(
                    lang,
                    'Preview Disabled (Showing full galaxy)',
                    'Vista Previa Desactivada (Mostrando galaxia completa)',
                    'Aperçu Désactivé (Galaxie complète)'
                  )}
            </span>
          </div>

          {isPreviewMode && onToggleHideExcluded && (
            <button
              onClick={() => onToggleHideExcluded(!hideExcludedInPreview)}
              className={`px-1.5 py-0.5 rounded border text-[8px] uppercase font-bold cursor-pointer transition-colors shrink-0 ${
                hideExcludedInPreview
                  ? 'bg-amber-500/20 border-amber-400/70 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={tr(
                lang,
                'Switch between dimming unselected planets (15%) or hiding them completely',
                'Alternar entre atenuar planetas excluidos (15%) u ocultarlos por completo',
                'Basculer entre atténuer les planètes exclues (15%) ou les masquer'
              )}
            >
              {hideExcludedInPreview
                ? tr(lang, 'Hide Excluded', 'Ocultar Excluidos', 'Masquer Exclus')
                : tr(lang, 'Dim Excluded', 'Atenuar Excluidos', 'Atténuer Exclus')}
            </button>
          )}
        </div>

        {/* Layout Integrity Diagnostics */}
        {(danglingRoutes.length > 0 || missingRefPlanets.length > 0) ? (
          <div className="mt-1.5 pt-1.5 border-t border-amber-800/40 flex items-center justify-between gap-2 text-amber-300">
            <div className="flex items-center gap-1.5 truncate" title={
              [
                missingRefPlanets.length > 0 ? `Missing planets: ${missingRefPlanets.join(', ')}` : '',
                danglingRoutes.length > 0 ? `Routes with unselected endpoints: ${danglingRoutes.map(r => r.name).join(', ')}` : ''
              ].filter(Boolean).join(' | ')
            }>
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">
                {tr(
                  lang,
                  `${missingRefPlanets.length} planets / ${danglingRoutes.length} routes have unselected nodes`,
                  `${missingRefPlanets.length} planetas / ${danglingRoutes.length} rutas con nodos fuera de campaña`,
                  `${missingRefPlanets.length} planètes / ${danglingRoutes.length} routes hors campagne`
                )}
              </span>
            </div>
            <button
              onClick={handleAutoFixLayoutIssues}
              className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-sm text-[8px] uppercase shrink-0 cursor-pointer"
            >
              {tr(lang, 'Fix Layout', 'Incluir Nodos', 'Corriger')}
            </button>
          </div>
        ) : isPreviewMode ? (
          <div className="mt-1 flex items-center gap-1.5 text-[8px] text-emerald-400/90">
            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
            <span>
              {tr(
                lang,
                'Layout verified: All active routes, HQs & forces belong to selected planets.',
                'Layout verificado: Todas las rutas, capitales y fuerzas pertenecen a planetas activos.',
                'Disposition vérifiée : Toutes les routes, capitales et forces appartiennent aux planètes actives.'
              )}
            </span>
          </div>
        ) : null}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="grid grid-cols-4 bg-slate-950 border-b border-cyan-900/40 shrink-0 font-mono text-[9px] uppercase font-bold tracking-wider">
        <button
          onClick={() => setSubTab('general')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors cursor-pointer ${
            subTab === 'general'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{tr(lang, 'General', 'General', 'Général')}</span>
        </button>

        <button
          onClick={() => setSubTab('factions')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors cursor-pointer ${
            subTab === 'factions'
              ? 'border-amber-400 text-amber-300 bg-amber-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{tr(lang, 'Factions', 'Facciones', 'Factions')}</span>
        </button>

        <button
          onClick={() => setSubTab('theater')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors cursor-pointer ${
            subTab === 'theater'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{tr(lang, 'Theater', 'Mapa GC', 'Théâtre')}</span>
        </button>

        <button
          onClick={() => setSubTab('forces')}
          className={`py-2.5 flex flex-col items-center gap-1 border-b-2 transition-colors cursor-pointer ${
            subTab === 'forces'
              ? 'border-purple-400 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{tr(lang, 'Forces', 'Fuerzas', 'Forces')}</span>
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {/* ============================================================ */}
        {/* TAB 1: GENERAL & VICTORY CONDITIONS                          */}
        {/* ============================================================ */}
        {subTab === 'general' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                {lang === 'es' ? 'Identificador XML (Campaign Name)' : 'XML Campaign Identifier (Name)'}
              </label>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) =>
                  onUpdateCampaign(
                    { ...campaign, name: e.target.value },
                    { label: `${campaign.name}: @Name = ${e.target.value}`, coalesceKey: `gc_${campaign.id}_name` }
                  )
                }
                className="w-full bg-slate-950 border border-cyan-900/60 px-3 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                  Campaign_Set
                </label>
                <input
                  type="text"
                  value={campaign.campaignSet}
                  onChange={(e) =>
                    onUpdateCampaign(
                      { ...campaign, campaignSet: e.target.value },
                      { label: `${campaign.name}: <Campaign_Set>`, coalesceKey: `gc_${campaign.id}_set` }
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                  Sort_Order
                </label>
                <input
                  type="number"
                  value={campaign.sortOrder}
                  onChange={(e) =>
                    onUpdateCampaign(
                      { ...campaign, sortOrder: parseInt(e.target.value, 10) || 1 },
                      { label: `${campaign.name}: <Sort_Order>`, coalesceKey: `gc_${campaign.id}_sort` }
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Text_ID & Description_Text */}
            <div className="space-y-2 bg-slate-950/60 p-3 border border-slate-800/80 rounded-sm">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-purple-400 tracking-wider font-mono">
                  Text_ID ({lang === 'es' ? 'Nombre en .DAT' : 'Title in .DAT'})
                </label>
                <input
                  type="text"
                  value={campaign.textId}
                  onChange={(e) =>
                    onUpdateCampaign(
                      { ...campaign, textId: e.target.value },
                      { label: `${campaign.name}: <Text_ID>`, coalesceKey: `gc_${campaign.id}_textid` }
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                />
                {datLookup.get(campaign.textId.toUpperCase()) && (
                  <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                    “{datLookup.get(campaign.textId.toUpperCase())}”
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[9px] uppercase font-bold text-purple-400 tracking-wider font-mono">
                  Description_Text ({lang === 'es' ? 'Descripción .DAT' : 'Description .DAT'})
                </label>
                <input
                  type="text"
                  value={campaign.descriptionText}
                  onChange={(e) =>
                    onUpdateCampaign(
                      { ...campaign, descriptionText: e.target.value },
                      { label: `${campaign.name}: <Description_Text>`, coalesceKey: `gc_${campaign.id}_desc` }
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                />
                {datLookup.get(campaign.descriptionText.toUpperCase()) && (
                  <div className="text-[10px] text-slate-300 font-sans italic bg-slate-900 px-2 py-1 rounded border border-slate-800 line-clamp-2">
                    {datLookup.get(campaign.descriptionText.toUpperCase())}
                  </div>
                )}
              </div>
            </div>

            {/* Starting Active Player */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">
                {lang === 'es' ? 'Facción Jugador Activo (Starting_Active_Player)' : 'Starting Active Player'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {campaign.factions.map((f) => (
                  <button
                    key={f.faction}
                    onClick={() =>
                      onUpdateCampaign(
                        { ...campaign, startingActivePlayer: f.faction },
                        { label: `${campaign.name}: <Starting_Active_Player> = ${f.faction}` }
                      )
                    }
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-sm border transition-all cursor-pointer ${
                      campaign.startingActivePlayer.toLowerCase() === f.faction.toLowerCase()
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-amber-600/50 hover:text-amber-300'
                    }`}
                  >
                    {f.faction}
                  </button>
                ))}
              </div>
            </div>

            {/* Victory Conditions */}
            <div className="space-y-2.5 bg-slate-950/70 p-3 border border-emerald-900/40 rounded-sm">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Condiciones de Victoria' : 'Victory Conditions'}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {VICTORY_CONDITION_PRESETS.map((cond) => {
                  const isActive = campaign.humanVictoryConditions.some(
                    c => c.toLowerCase() === cond.toLowerCase()
                  );
                  return (
                    <button
                      key={cond}
                      onClick={() => {
                        const next = isActive
                          ? campaign.humanVictoryConditions.filter(c => c.toLowerCase() !== cond.toLowerCase())
                          : [...campaign.humanVictoryConditions, cond];
                        onUpdateCampaign(
                          {
                            ...campaign,
                            humanVictoryConditions: next,
                            aiVictoryConditions: next
                          },
                          { label: `${campaign.name}: ${isActive ? '-' : '+'}<Victory_Conditions> ${cond}` }
                        );
                      }}
                      className={`px-2 py-1 text-[9px] font-mono rounded-sm border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {cond.replace('Galactic_', '')}
                    </button>
                  );
                })}
              </div>

              {/* Add custom victory condition */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder={lang === 'es' ? 'Condición personalizada...' : 'Custom condition...'}
                  value={newCustomVictory}
                  onChange={(e) => setNewCustomVictory(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono text-cyan-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (!newCustomVictory.trim()) return;
                    const cleanCond = newCustomVictory.trim();
                    const next = [...campaign.humanVictoryConditions, cleanCond];
                    onUpdateCampaign(
                      {
                        ...campaign,
                        humanVictoryConditions: next,
                        aiVictoryConditions: next
                      },
                      { label: `${campaign.name}: +<Victory_Conditions> ${cleanCond}` }
                    );
                    setNewCustomVictory('');
                  }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-slate-950 font-mono font-bold text-[10px] uppercase rounded-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Boolean Victory & Campaign Flags */}
              <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                {[
                  {
                    key: 'conquerAllPlanets' as const,
                    label: lang === 'es' ? 'Conquistar Todos los Planetas (Conquer_All_Planets)' : 'Conquer All Planets'
                  },
                  {
                    key: 'specialStructuresLandVictory' as const,
                    label: lang === 'es' ? 'Destruir Estructuras Terrestres (Special_Structures_Land)' : 'Special Structures Land Victory'
                  },
                  {
                    key: 'winLeaderDestruction' as const,
                    label: lang === 'es' ? 'Victoria por Destrucción de Líder (Win_Leader_Destruction)' : 'Win Leader Destruction'
                  },
                  {
                    key: 'isMultiplayer' as const,
                    label: lang === 'es' ? 'Campaña Multijugador (Is_Multiplayer)' : 'Multiplayer Campaign (Is_Multiplayer)'
                  },
                  {
                    key: 'supportsCustomSettings' as const,
                    label: lang === 'es' ? 'Ajustes Personalizables (Supports_Custom_Settings)' : 'Supports Custom Settings'
                  },
                  {
                    key: 'showCompletedTab' as const,
                    label: lang === 'es' ? 'Mostrar Pestaña Completada (Show_Completed_Tab)' : 'Show Completed Tab'
                  }
                ].map((flag) => (
                  <label
                    key={flag.key}
                    className="flex items-center justify-between py-1 px-2 bg-slate-900/70 rounded border border-slate-800/60 cursor-pointer hover:border-slate-700"
                  >
                    <span className="text-slate-300 text-[9px]">{flag.label}</span>
                    <input
                      type="checkbox"
                      checked={campaign[flag.key]}
                      onChange={(e) =>
                        onUpdateCampaign(
                          { ...campaign, [flag.key]: e.target.checked },
                          { label: `${campaign.name}: <${flag.key}> = ${e.target.checked ? 'Yes' : 'No'}` }
                        )
                      }
                      className="accent-emerald-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Camera Shift & Distance */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                {lang === 'es' ? 'Cámara Galáctica Inicial (X / Y / Distancia)' : 'Initial Galactic Camera (X / Y / Distance)'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[8px] font-mono text-slate-500 block">Shift X</span>
                  <input
                    type="number"
                    step="10"
                    value={campaign.cameraShiftX}
                    onChange={(e) =>
                      onUpdateCampaign(
                        { ...campaign, cameraShiftX: parseFloat(e.target.value) || 0 },
                        { label: `${campaign.name}: <Camera_Shift_X>`, coalesceKey: `gc_${campaign.id}_camx` }
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 px-2 py-1 text-xs font-mono text-cyan-200"
                  />
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-500 block">Shift Y</span>
                  <input
                    type="number"
                    step="10"
                    value={campaign.cameraShiftY}
                    onChange={(e) =>
                      onUpdateCampaign(
                        { ...campaign, cameraShiftY: parseFloat(e.target.value) || 0 },
                        { label: `${campaign.name}: <Camera_Shift_Y>`, coalesceKey: `gc_${campaign.id}_camy` }
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 px-2 py-1 text-xs font-mono text-cyan-200"
                  />
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-500 block">Distance</span>
                  <input
                    type="number"
                    step="50"
                    value={campaign.cameraDistance}
                    onChange={(e) =>
                      onUpdateCampaign(
                        { ...campaign, cameraDistance: parseFloat(e.target.value) || 1000 },
                        { label: `${campaign.name}: <Camera_Distance>`, coalesceKey: `gc_${campaign.id}_camdist` }
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 px-2 py-1 text-xs font-mono text-cyan-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PLAYABLE FACTIONS, CREDITS, TECH LEVEL & CAPITALS      */}
        {/* ============================================================ */}
        {subTab === 'factions' && (
          <div className="space-y-4">
            {/* Galactic Economy & Faction Income Telemetry Summary (v3.2) */}
            <div className="bg-slate-950/80 border border-emerald-900/50 p-3 rounded-sm space-y-2 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {tr(lang, 'Galactic Economy & Starting Balance (v3.2)', 'Economía Galáctica y Balance Inicial (v3.2)', 'Économie Galactique & Équilibre (v3.2)')}
                </span>
              </div>
              <div className="space-y-1.5">
                {campaign.factions.map((fac) => {
                  const facLower = fac.faction.toLowerCase();
                  // Planets controlled by this faction
                  const controlledPlanetNames = new Set<string>();
                  if (fac.homeLocation) controlledPlanetNames.add(fac.homeLocation.toLowerCase());
                  campaign.startingForces.forEach(sf => {
                    if (sf.faction.toLowerCase() === facLower && sf.planet) {
                      controlledPlanetNames.add(sf.planet.toLowerCase());
                    }
                  });

                  let baseCycleIncome = 0;
                  controlledPlanetNames.forEach(pLower => {
                    const pObj = planets.find(p => p.name.toLowerCase() === pLower);
                    if (pObj) {
                      const creditNode = pObj.el.getElementsByTagName('Planet_Credit_Value')[0];
                      const val = parseFloat(creditNode?.textContent || '120') || 120;
                      baseCycleIncome += val;
                    } else {
                      baseCycleIncome += 100;
                    }
                  });

                  const totalUnits = campaign.startingForces
                    .filter(sf => sf.faction.toLowerCase() === facLower)
                    .reduce((acc, s) => acc + s.count, 0);

                  return (
                    <div
                      key={fac.faction}
                      className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-sm text-[10px]"
                    >
                      <span className="font-bold text-slate-200 uppercase truncate max-w-[110px]">
                        {fac.faction}
                      </span>
                      <div className="flex items-center gap-2.5 tabular-nums text-[9px]">
                        <span className="text-cyan-300" title="Controlled Planets">
                          {controlledPlanetNames.size} {tr(lang, 'pl.', 'plan.', 'pl.')}
                        </span>
                        <span className="text-emerald-400 font-bold" title="Cycle Credit Income from Planet_Credit_Value">
                          +{baseCycleIncome} cr/ciclo
                        </span>
                        <span className="text-purple-300" title="Starting Force Units">
                          {totalUnits} {tr(lang, 'u.', 'uds.', 'u.')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Mod Faction */}
            <div className="flex gap-1.5 bg-slate-950/70 p-2.5 border border-slate-800 rounded-sm">
              <input
                type="text"
                placeholder={lang === 'es' ? 'Nueva facción (ej. Republic, CIS, Chiss)...' : 'Add faction (e.g. Republic, CIS)...'}
                value={newFactionName}
                onChange={(e) => setNewFactionName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-cyan-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleAddFaction}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded-sm cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{lang === 'es' ? 'Añadir' : 'Add'}</span>
              </button>
            </div>

            {campaign.factions.map((fac) => {
              const isStandard = ['empire', 'rebel', 'underworld'].includes(fac.faction.toLowerCase());
              return (
                <div
                  key={fac.faction}
                  className={`p-3 rounded-sm border space-y-3 ${getFactionAccent(fac.faction)}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span className="font-mono font-bold text-xs uppercase tracking-widest">
                        {fac.faction}
                      </span>
                    </div>
                    {!isStandard && (
                      <button
                        onClick={() => handleRemoveFaction(fac.faction)}
                        className="text-slate-400 hover:text-red-400 text-[10px] cursor-pointer"
                        title={lang === 'es' ? 'Quitar facción' : 'Remove faction'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Home_Location (Capital Planet) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase font-bold text-slate-300 font-mono">
                        {lang === 'es' ? 'Planeta Capital (Home_Location)' : 'Capital Planet (Home_Location)'}
                      </label>
                      {selectedPlanet && (
                        <button
                          onClick={() => handleUpdateFaction(fac.faction, { homeLocation: selectedPlanet.name })}
                          className="text-[8px] font-mono uppercase px-1.5 py-0.5 bg-cyan-950 border border-cyan-700 text-cyan-300 rounded hover:bg-cyan-900 cursor-pointer"
                        >
                          {lang === 'es' ? `Usar ${selectedPlanet.name}` : `Use ${selectedPlanet.name}`}
                        </button>
                      )}
                    </div>
                    <select
                      value={fac.homeLocation}
                      onChange={(e) => handleUpdateFaction(fac.faction, { homeLocation: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">{lang === 'es' ? '-- Sin Capital Asignada --' : '-- No Home Location --'}</option>
                      {Array.from(
                        new Set([
                          ...campaign.locations.filter(l => l.toLowerCase() !== 'galaxy_core_art_model'),
                          ...planets.filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model').map(p => p.name)
                        ])
                      ).map((pName) => (
                        <option key={pName} value={pName}>
                          {pName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Starting Credits */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="uppercase font-bold text-slate-300 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-400" />
                        {lang === 'es' ? 'Créditos Iniciales' : 'Starting Credits'}
                      </span>
                      <div className="flex gap-1">
                        {[1500, 3000, 5000, 10000].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => handleUpdateFaction(fac.faction, { startingCredits: preset })}
                            className="px-1.5 py-0.5 text-[8px] bg-slate-950 border border-slate-700 hover:border-amber-500 text-amber-300 rounded cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={fac.startingCredits}
                      onChange={(e) =>
                        handleUpdateFaction(fac.faction, { startingCredits: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-mono text-amber-300 font-bold"
                    />
                  </div>

                  {/* Tech Levels (Starting_Tech_Level & Max_Tech_Level) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-300 font-mono flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>{lang === 'es' ? 'Tech Inicial' : 'Start Tech'}</span>
                      </label>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleUpdateFaction(fac.faction, { startingTechLevel: lvl })}
                            className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-sm border cursor-pointer ${
                              fac.startingTechLevel === lvl
                                ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-cyan-700'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-300 font-mono flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-emerald-400" />
                        <span>{lang === 'es' ? 'Tech Máximo' : 'Max Tech'}</span>
                      </label>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleUpdateFaction(fac.faction, { maxTechLevel: lvl })}
                            className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-sm border cursor-pointer ${
                              fac.maxTechLevel === lvl
                                ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-emerald-700'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Player Control & Story Plot */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase font-bold text-slate-400 font-mono">
                        AI_Player_Control
                      </label>
                      <input
                        type="text"
                        list="ai-presets-list"
                        value={fac.aiPlayerControl}
                        onChange={(e) => handleUpdateFaction(fac.faction, { aiPlayerControl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] font-mono text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase font-bold text-slate-400 font-mono">
                        Story_Name (.xml)
                      </label>
                      <input
                        type="text"
                        value={fac.storyName}
                        placeholder="Story_Plots_..."
                        onChange={(e) => handleUpdateFaction(fac.faction, { storyName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <datalist id="ai-presets-list">
              {AI_PLAYER_PRESETS.map((ai) => (
                <option key={ai} value={ai} />
              ))}
            </datalist>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: GALACTIC THEATER (LOCATIONS & TRADE ROUTES)           */}
        {/* ============================================================ */}
        {subTab === 'theater' && (
          <div className="space-y-3">
            {/* Interactive Map Click Toggle Banner */}
            <div
              onClick={() => onToggleMapClickMode(!mapClickTogglesPlanet)}
              className={`p-3 rounded-sm border transition-all cursor-pointer flex items-center justify-between ${
                mapClickTogglesPlanet
                  ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-950/80 border-slate-800 hover:border-cyan-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MousePointerClick
                  className={`w-5 h-5 shrink-0 ${
                    mapClickTogglesPlanet ? 'text-emerald-300 animate-bounce' : 'text-cyan-400'
                  }`}
                />
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-100">
                    {lang === 'es' ? 'Seleccionar Planetas en el Mapa' : 'Toggle Planets via Map Click'}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {mapClickTogglesPlanet
                      ? lang === 'es'
                        ? 'ACTIVO: Haz clic en cualquier planeta del mapa para incluirlo o quitarlo.'
                        : 'ACTIVE: Click any planet on the galaxy map to include or exclude it.'
                      : lang === 'es'
                      ? 'Actívalo para añadir/quitar planetas de la campaña tocando el mapa.'
                      : 'Enable to add/remove campaign planets by clicking the map.'}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                  mapClickTogglesPlanet ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {mapClickTogglesPlanet ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Quick Automation Buttons */}
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px]">
              <button
                onClick={handleSelectAllPlanets}
                className="py-1.5 px-2 bg-slate-950 hover:bg-cyan-950/50 border border-cyan-800/50 text-cyan-300 rounded-sm uppercase font-bold cursor-pointer transition-colors"
              >
                {lang === 'es' ? '+ Todos' : '+ All Planets'}
              </button>
              <button
                onClick={handleClearPlanets}
                className="py-1.5 px-2 bg-slate-950 hover:bg-red-950/50 border border-red-900/40 text-red-300 rounded-sm uppercase font-bold cursor-pointer transition-colors"
              >
                {lang === 'es' ? 'Vaciar' : 'Clear All'}
              </button>
              <button
                onClick={handleAutoLinkRoutes}
                className="py-1.5 px-2 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 rounded-sm uppercase font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                title={lang === 'es' ? 'Activa automáticamente las rutas cuyos 2 planetas estén en la campaña' : 'Auto-enable routes connecting active campaign planets'}
              >
                <Link2 className="w-3 h-3" />
                <span>{lang === 'es' ? 'Auto-Rutas' : 'Sync Routes'}</span>
              </button>
            </div>

            {/* Sub-switch Planets vs Routes */}
            <div className="flex bg-slate-950 p-1 rounded-sm border border-slate-800 font-mono text-[10px]">
              <button
                onClick={() => setTheaterView('planets')}
                className={`flex-1 py-1 rounded-sm uppercase font-bold transition-colors cursor-pointer ${
                  theaterView === 'planets' ? 'bg-cyan-900/60 text-cyan-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang === 'es' ? `Planetas (${nonCoreLocationsCount}/${planets.length})` : `Planets (${nonCoreLocationsCount}/${planets.length})`}
              </button>
              <button
                onClick={() => setTheaterView('routes')}
                className={`flex-1 py-1 rounded-sm uppercase font-bold transition-colors cursor-pointer ${
                  theaterView === 'routes' ? 'bg-amber-900/60 text-amber-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang === 'es' ? `Rutas (${campaign.tradeRoutes.length}/${tradeRoutes.length})` : `Routes (${campaign.tradeRoutes.length}/${tradeRoutes.length})`}
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder={lang === 'es' ? 'Filtrar lista...' : 'Filter list...'}
                value={theaterSearch}
                onChange={(e) => setTheaterSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-1 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Checklist */}
            {theaterView === 'planets' ? (
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {planets
                  .filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model')
                  .filter(p => p.name.toLowerCase().includes(theaterSearch.toLowerCase()))
                  .map((p) => {
                    const included = campaign.locations.some(
                      l => l.toLowerCase() === p.name.toLowerCase()
                    );
                    const owner = getPlanetControllingFaction(p.name);
                    const unitCount = campaign.startingForces
                      .filter(sf => sf.planet.toLowerCase() === p.name.toLowerCase())
                      .reduce((a, b) => a + b.count, 0);

                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlanetInLocations(p.name)}
                        className={`px-2.5 py-1.5 rounded-sm border flex items-center justify-between cursor-pointer transition-colors font-mono text-xs ${
                          included
                            ? 'bg-cyan-950/30 border-cyan-800/60 text-cyan-100'
                            : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {included ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{p.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-[9px]">
                          {owner && (
                            <span className={`px-1.5 py-0.2 rounded border uppercase ${getFactionAccent(owner)}`}>
                              {owner}
                            </span>
                          )}
                          {unitCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                              ⚔ {unitCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {tradeRoutes
                  .filter(r => r.name.toLowerCase().includes(theaterSearch.toLowerCase()))
                  .map((r) => {
                    const included = campaign.tradeRoutes.some(
                      tr => tr.toLowerCase() === r.name.toLowerCase()
                    );
                    const hasA = locLowerSet.has(r.pointA.toLowerCase());
                    const hasB = locLowerSet.has(r.pointB.toLowerCase());
                    const bothEndpointsActive = hasA && hasB;

                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleRouteInCampaign(r.name)}
                        className={`px-2.5 py-1.5 rounded-sm border flex items-center justify-between cursor-pointer transition-colors font-mono text-xs ${
                          included
                            ? bothEndpointsActive
                              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                              : 'bg-rose-950/30 border-rose-700/60 text-rose-200'
                            : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {included ? (
                            <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="truncate font-bold">{r.name}</div>
                            <div className="text-[9px] flex items-center gap-1">
                              <span className={hasA ? 'text-emerald-400' : 'text-slate-600 line-through'}>{r.pointA}</span>
                              <span className="text-slate-500">⇄</span>
                              <span className={hasB ? 'text-emerald-400' : 'text-slate-600 line-through'}>{r.pointB}</span>
                            </div>
                          </div>
                        </div>

                        {included && !bothEndpointsActive && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700/60 text-rose-300 shrink-0 uppercase">
                            {lang === 'es' ? 'Nodo Excluido' : 'Missing Node'}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: STARTING FORCES (GARRISONS & FLEETS PER PLANET)       */}
        {/* ============================================================ */}
        {subTab === 'forces' && (
          <div className="space-y-3.5">
            {/* Scope Switch: Selected Planet vs All Planets */}
            <div className="flex bg-slate-950 p-1 rounded-sm border border-slate-800 font-mono text-[9px]">
              <button
                onClick={() => setForceFilterScope('selected')}
                className={`flex-1 py-1.5 px-2 rounded-sm uppercase font-bold transition-colors cursor-pointer truncate ${
                  forceFilterScope === 'selected'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {selectedPlanet
                  ? `${lang === 'es' ? 'Planeta:' : 'Planet:'} ${selectedPlanet.name}`
                  : lang === 'es'
                  ? 'Planeta Seleccionado'
                  : 'Selected Planet'}
              </button>
              <button
                onClick={() => setForceFilterScope('all')}
                className={`flex-1 py-1.5 px-2 rounded-sm uppercase font-bold transition-colors cursor-pointer ${
                  forceFilterScope === 'all'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang === 'es' ? 'Toda la Galaxia' : 'All Campaign Planets'}
              </button>
            </div>

            {/* Quick Add Starting Force Box */}
            <div className="bg-slate-950/90 border border-purple-800/50 p-3 rounded-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-purple-400" />
                  <span>{lang === 'es' ? 'Desplegar Fuerza Inicial' : 'Deploy Starting Force'}</span>
                </span>

                {/* 1-Click Starter Garrison Preset */}
                <button
                  onClick={() =>
                    handleApplyStarterGarrison(
                      newForceFaction,
                      selectedPlanet ? selectedPlanet.name : activePlanetForForces
                    )
                  }
                  className="text-[8px] font-mono uppercase px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 rounded flex items-center gap-1 cursor-pointer"
                  title={lang === 'es' ? 'Añade Base Estelar + Cuartel + Fábrica + Flota básica al planeta' : 'Add Starbase + Barracks + Factory + Starter Fleet to planet'}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{lang === 'es' ? '+ Base Inicial' : '+ Starter Base'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Faction */}
                <div>
                  <label className="text-[8px] font-mono uppercase text-slate-500 block mb-0.5">
                    {lang === 'es' ? 'Facción' : 'Faction'}
                  </label>
                  <select
                    value={newForceFaction}
                    onChange={(e) => setNewForceFaction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-2 py-1 text-xs font-mono text-amber-300"
                  >
                    {campaign.factions.map((f) => (
                      <option key={f.faction} value={f.faction}>
                        {f.faction}
                      </option>
                    ))}
                    <option value="Pirates">Pirates</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Hostile">Hostile</option>
                  </select>
                </div>

                {/* Target Planet */}
                <div>
                  <label className="text-[8px] font-mono uppercase text-slate-500 block mb-0.5">
                    {lang === 'es' ? 'Planeta Destino' : 'Target Planet'}
                  </label>
                  <select
                    value={selectedPlanet && forceFilterScope === 'selected' ? selectedPlanet.name : (newForcePlanet || activePlanetForForces)}
                    onChange={(e) => {
                      setNewForcePlanet(e.target.value);
                      const found = planets.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                      if (found) onSelectPlanet(found);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 px-2 py-1 text-xs font-mono text-cyan-200"
                  >
                    {Array.from(
                      new Set([
                        ...campaign.locations.filter(l => l.toLowerCase() !== 'galaxy_core_art_model'),
                        ...planets.filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model').map(p => p.name)
                      ])
                    ).map((pName) => (
                      <option key={pName} value={pName}>
                        {pName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit / Structure Name + Quantity */}
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <label className="text-[8px] font-mono uppercase text-slate-500 block mb-0.5">
                    {lang === 'es' ? 'Unidad / Estructura XML' : 'XML Unit / Structure Name'}
                  </label>
                  <input
                    type="text"
                    list="eaw-units-datalist"
                    value={newForceUnit}
                    onChange={(e) => setNewForceUnit(e.target.value)}
                    placeholder="Star_Destroyer, Empire_Star_Base_1..."
                    className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-emerald-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="w-16">
                  <label className="text-[8px] font-mono uppercase text-slate-500 block mb-0.5">
                    {lang === 'es' ? 'Cant.' : 'Qty'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newForceQty}
                    onChange={(e) => setNewForceQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-slate-900 border border-slate-800 px-2 py-1 text-xs font-mono text-center text-white font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleAddStartingForce}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-widest rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Añadir a Starting_Forces' : 'Add to Starting_Forces'}</span>
              </button>

              <datalist id="eaw-units-datalist">
                {COMMON_EAW_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            {/* Filter by Faction */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 font-mono text-[9px]">
              <button
                onClick={() => setForceFactionFilter('ALL')}
                className={`px-2 py-0.5 rounded border uppercase cursor-pointer ${
                  forceFactionFilter === 'ALL'
                    ? 'bg-cyan-900/60 border-cyan-400 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {lang === 'es' ? 'Todas' : 'All'}
              </button>
              {campaign.factions.map((f) => (
                <button
                  key={f.faction}
                  onClick={() => setForceFactionFilter(f.faction)}
                  className={`px-2 py-0.5 rounded border uppercase cursor-pointer ${
                    forceFactionFilter.toLowerCase() === f.faction.toLowerCase()
                      ? 'bg-amber-900/60 border-amber-400 text-amber-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {f.faction}
                </button>
              ))}
            </div>

            {/* Starting Forces List */}
            <div className="space-y-1.5 max-h-[330px] overflow-y-auto pr-1 custom-scrollbar">
              {campaign.startingForces
                .filter((sf) => {
                  if (forceFilterScope === 'selected' && selectedPlanet) {
                    if (sf.planet.toLowerCase() !== selectedPlanet.name.toLowerCase()) return false;
                  }
                  if (forceFactionFilter !== 'ALL') {
                    if (sf.faction.toLowerCase() !== forceFactionFilter.toLowerCase()) return false;
                  }
                  return true;
                })
                .map((sf) => (
                  <div
                    key={sf.id}
                    className="p-2 bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-sm flex items-center justify-between gap-2 font-mono"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-emerald-300 truncate" title={sf.unitType}>
                        {sf.unitType}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5">
                        <span className={`px-1 rounded border uppercase ${getFactionAccent(sf.faction)}`}>
                          {sf.faction}
                        </span>
                        <span>•</span>
                        <span
                          onClick={() => {
                            const found = planets.find(p => p.name.toLowerCase() === sf.planet.toLowerCase());
                            if (found) onSelectPlanet(found);
                          }}
                          className="text-cyan-300 hover:underline cursor-pointer truncate"
                        >
                          {sf.planet}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateForceCount(sf.id, -1)}
                        className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-7 text-center text-[10px] font-bold text-amber-300">
                        x{sf.count}
                      </span>
                      <button
                        onClick={() => handleUpdateForceCount(sf.id, 1)}
                        className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteForce(sf.id)}
                        className="p-1 text-slate-500 hover:text-red-400 cursor-pointer ml-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {campaign.startingForces.length === 0 && (
                <div className="text-center py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  {lang === 'es'
                    ? 'Sin fuerzas iniciales registradas en esta campaña'
                    : 'No starting forces configured for this campaign'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
