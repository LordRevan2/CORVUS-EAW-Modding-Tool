import React, { useState, useMemo, useRef } from 'react';
import {
  GitBranch,
  Save,
  Search,
  X,
  Plus,
  Copy,
  Trash2,
  Upload,
  Shield,
  Coins,
  Clock,
  ChevronRight,
  ChevronLeft,
  Code,
  Layers,
  Sparkles,
  Check,
  Database,
  Flag,
  FolderOpen
} from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import { DatRecord } from '../lib/dat';

interface TechTreeEditorProps {
  initialDoc: XMLDocument;
  fileName: string;
  onClose: () => void;
  onError: (err: string) => void;
  workspaceFiles?: File[];
  datRecords?: DatRecord[] | null;
  onSelectWorkspaceFile?: (path: string) => void;
}

export interface FactionNodeData {
  id: string;
  node: Element;
  name: string;
  textId: string;
  iconName: string;
  colorRgba: string;
  primaryEnemy: string;
  isPlayable: string;
  canControlPlanets: string;
  spaceCap: string;
  landCap: string;
  basicAi: string;
  musicEventBattle: string;
  musicEventStrategic: string;
  superweapon: string;
}

export interface TechUnitNodeData {
  id: string;
  node: Element;
  tagName: string;
  name: string;
  textId: string;
  affiliation: string;
  techLevel: number;
  buildCost: string;
  buildTime: string;
  requiredStructures: string;
  requiredPlanets: string;
  health: string;
  shields: string;
  iconName: string;
}

const TECH_UNIT_TAGS = [
  'SpaceUnit',
  'Squadron',
  'GroundVehicle',
  'GroundInfantry',
  'GroundCompany',
  'HeroUnit',
  'UniqueUnit',
  'StarBase',
  'SpecialStructure',
  'Structure'
];

export function createSampleTechTreeAndFactionsXmlString(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<FactionsAndTechTree>
  <!-- ==================== FACTIONS ==================== -->
  <Faction Name="Empire">
    <Text_ID>TEXT_FACTION_EMPIRE</Text_ID>
    <Icon_Name>i_icon_e_empire.tga</Icon_Name>
    <Color>185, 40, 40, 255</Color>
    <Primary_Enemy>Rebel</Primary_Enemy>
    <Is_Playable> true </Is_Playable>
    <Can_Control_Planets> true </Can_Control_Planets>
    <Space_Tactical_Unit_Cap>25</Space_Tactical_Unit_Cap>
    <Land_Tactical_Unit_Cap>10</Land_Tactical_Unit_Cap>
    <Basic_AI>BasicEmpire</Basic_AI>
    <Music_Event_Battle_Load_Screen>Empire_Tactical_Battle_Loading_Loop</Music_Event_Battle_Load_Screen>
    <Music_Event_Strategic_Theme>Empire_Galactic_Map_Loop</Music_Event_Strategic_Theme>
    <Superweapon>Death_Star</Superweapon>
  </Faction>

  <Faction Name="Rebel">
    <Text_ID>TEXT_FACTION_REBEL</Text_ID>
    <Icon_Name>i_icon_r_rebel.tga</Icon_Name>
    <Color>45, 160, 245, 255</Color>
    <Primary_Enemy>Empire</Primary_Enemy>
    <Is_Playable> true </Is_Playable>
    <Can_Control_Planets> true </Can_Control_Planets>
    <Space_Tactical_Unit_Cap>20</Space_Tactical_Unit_Cap>
    <Land_Tactical_Unit_Cap>10</Land_Tactical_Unit_Cap>
    <Basic_AI>BasicRebel</Basic_AI>
    <Music_Event_Battle_Load_Screen>Rebel_Tactical_Battle_Loading_Loop</Music_Event_Battle_Load_Screen>
    <Music_Event_Strategic_Theme>Rebel_Galactic_Map_Loop</Music_Event_Strategic_Theme>
    <Superweapon>None</Superweapon>
  </Faction>

  <Faction Name="Underworld">
    <Text_ID>TEXT_FACTION_UNDERWORLD</Text_ID>
    <Icon_Name>i_icon_u_underworld.tga</Icon_Name>
    <Color>235, 175, 40, 255</Color>
    <Primary_Enemy>Empire</Primary_Enemy>
    <Is_Playable> true </Is_Playable>
    <Can_Control_Planets> true </Can_Control_Planets>
    <Space_Tactical_Unit_Cap>22</Space_Tactical_Unit_Cap>
    <Land_Tactical_Unit_Cap>10</Land_Tactical_Unit_Cap>
    <Basic_AI>UnderworldAI</Basic_AI>
    <Music_Event_Battle_Load_Screen>Underworld_Battle_Load_Loop</Music_Event_Battle_Load_Screen>
    <Music_Event_Strategic_Theme>Underworld_Galactic_Loop</Music_Event_Strategic_Theme>
    <Superweapon>Eclipse_Super_Star_Destroyer</Superweapon>
  </Faction>

  <!-- ==================== TECH TREE ROSTER ==================== -->
  <Squadron Name="TIE_Fighter_Squadron">
    <Text_ID>TEXT_UNIT_TIE_FIGHTER</Text_ID>
    <Affiliation>Empire</Affiliation>
    <Tech_Level>0</Tech_Level>
    <Build_Cost_Credits>300</Build_Cost_Credits>
    <Build_Time_Seconds>12</Build_Time_Seconds>
    <Required_Special_Structures>Empire_Star_Base_1</Required_Special_Structures>
    <Tactical_Health>180</Tactical_Health>
    <Shield_Points>0</Shield_Points>
    <Icon_Name>i_button_tie_fighter.tga</Icon_Name>
  </Squadron>

  <SpaceUnit Name="Tartan_Patrol_Cruiser">
    <Text_ID>TEXT_UNIT_TARTAN_CRUISER</Text_ID>
    <Affiliation>Empire</Affiliation>
    <Tech_Level>1</Tech_Level>
    <Build_Cost_Credits>1150</Build_Cost_Credits>
    <Build_Time_Seconds>22</Build_Time_Seconds>
    <Required_Special_Structures>Empire_Star_Base_1</Required_Special_Structures>
    <Tactical_Health>1400</Tactical_Health>
    <Shield_Points>600</Shield_Points>
    <Icon_Name>i_button_tartan.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Acclamator_Assault_Ship">
    <Text_ID>TEXT_UNIT_ACCLAMATOR</Text_ID>
    <Affiliation>Empire</Affiliation>
    <Tech_Level>2</Tech_Level>
    <Build_Cost_Credits>2300</Build_Cost_Credits>
    <Build_Time_Seconds>34</Build_Time_Seconds>
    <Required_Special_Structures>Empire_Star_Base_2</Required_Special_Structures>
    <Tactical_Health>2800</Tactical_Health>
    <Shield_Points>1200</Shield_Points>
    <Icon_Name>i_button_acclamator.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Victory_Destroyer">
    <Text_ID>TEXT_UNIT_VICTORY_DESTROYER</Text_ID>
    <Affiliation>Empire</Affiliation>
    <Tech_Level>3</Tech_Level>
    <Build_Cost_Credits>3500</Build_Cost_Credits>
    <Build_Time_Seconds>45</Build_Time_Seconds>
    <Required_Special_Structures>Empire_Star_Base_3</Required_Special_Structures>
    <Tactical_Health>4600</Tactical_Health>
    <Shield_Points>2100</Shield_Points>
    <Icon_Name>i_button_victory.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Imperial_Star_Destroyer">
    <Text_ID>TEXT_UNIT_STAR_DESTROYER</Text_ID>
    <Affiliation>Empire</Affiliation>
    <Tech_Level>4</Tech_Level>
    <Build_Cost_Credits>5900</Build_Cost_Credits>
    <Build_Time_Seconds>65</Build_Time_Seconds>
    <Required_Special_Structures>Empire_Star_Base_4</Required_Special_Structures>
    <Required_Planets>Kuat, Fondor, Corellia</Required_Planets>
    <Tactical_Health>7500</Tactical_Health>
    <Shield_Points>3500</Shield_Points>
    <Icon_Name>i_button_imperator.tga</Icon_Name>
  </SpaceUnit>

  <HeroUnit Name="Executor_Super_Star_Destroyer">
    <Text_ID>TEXT_UNIT_EXECUTOR</Text_ID>
    <Affiliation>Empire</Affiliation>
    <Tech_Level>5</Tech_Level>
    <Build_Cost_Credits>15000</Build_Cost_Credits>
    <Build_Time_Seconds>120</Build_Time_Seconds>
    <Required_Special_Structures>Empire_Star_Base_5</Required_Special_Structures>
    <Required_Planets>Kuat, Fondor</Required_Planets>
    <Tactical_Health>22000</Tactical_Health>
    <Shield_Points>12000</Shield_Points>
    <Icon_Name>i_button_executor.tga</Icon_Name>
  </HeroUnit>

  <Squadron Name="Rebel_X-Wing_Squadron">
    <Text_ID>TEXT_UNIT_X_WING</Text_ID>
    <Affiliation>Rebel</Affiliation>
    <Tech_Level>0</Tech_Level>
    <Build_Cost_Credits>550</Build_Cost_Credits>
    <Build_Time_Seconds>16</Build_Time_Seconds>
    <Required_Special_Structures>Rebel_Star_Base_1</Required_Special_Structures>
    <Tactical_Health>320</Tactical_Health>
    <Shield_Points>150</Shield_Points>
    <Icon_Name>i_button_x_wing.tga</Icon_Name>
  </Squadron>

  <SpaceUnit Name="Corellian_Corvette">
    <Text_ID>TEXT_UNIT_CORELLIAN_CORVETTE</Text_ID>
    <Affiliation>Rebel</Affiliation>
    <Tech_Level>1</Tech_Level>
    <Build_Cost_Credits>1200</Build_Cost_Credits>
    <Build_Time_Seconds>20</Build_Time_Seconds>
    <Required_Special_Structures>Rebel_Star_Base_1</Required_Special_Structures>
    <Tactical_Health>1350</Tactical_Health>
    <Shield_Points>650</Shield_Points>
    <Icon_Name>i_button_corvette.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Nebulon_B_Frigate">
    <Text_ID>TEXT_UNIT_NEBULON_FRIGATE</Text_ID>
    <Affiliation>Rebel</Affiliation>
    <Tech_Level>2</Tech_Level>
    <Build_Cost_Credits>2100</Build_Cost_Credits>
    <Build_Time_Seconds>30</Build_Time_Seconds>
    <Required_Special_Structures>Rebel_Star_Base_2</Required_Special_Structures>
    <Tactical_Health>2600</Tactical_Health>
    <Shield_Points>1400</Shield_Points>
    <Icon_Name>i_button_nebulon.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Alliance_Assault_Frigate">
    <Text_ID>TEXT_UNIT_ASSAULT_FRIGATE</Text_ID>
    <Affiliation>Rebel</Affiliation>
    <Tech_Level>3</Tech_Level>
    <Build_Cost_Credits>3400</Build_Cost_Credits>
    <Build_Time_Seconds>42</Build_Time_Seconds>
    <Required_Special_Structures>Rebel_Star_Base_3</Required_Special_Structures>
    <Tactical_Health>4100</Tactical_Health>
    <Shield_Points>2400</Shield_Points>
    <Icon_Name>i_button_assault_frigate.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Calamari_Cruiser">
    <Text_ID>TEXT_UNIT_CALAMARI_CRUISER</Text_ID>
    <Affiliation>Rebel</Affiliation>
    <Tech_Level>4</Tech_Level>
    <Build_Cost_Credits>5600</Build_Cost_Credits>
    <Build_Time_Seconds>60</Build_Time_Seconds>
    <Required_Special_Structures>Rebel_Star_Base_4</Required_Special_Structures>
    <Required_Planets>MonCalimari</Required_Planets>
    <Tactical_Health>6800</Tactical_Health>
    <Shield_Points>5200</Shield_Points>
    <Icon_Name>i_button_calamari.tga</Icon_Name>
  </SpaceUnit>

  <HeroUnit Name="Home_One">
    <Text_ID>TEXT_UNIT_HOME_ONE</Text_ID>
    <Affiliation>Rebel</Affiliation>
    <Tech_Level>5</Tech_Level>
    <Build_Cost_Credits>11500</Build_Cost_Credits>
    <Build_Time_Seconds>95</Build_Time_Seconds>
    <Required_Special_Structures>Rebel_Star_Base_5</Required_Special_Structures>
    <Required_Planets>MonCalimari</Required_Planets>
    <Tactical_Health>14500</Tactical_Health>
    <Shield_Points>11000</Shield_Points>
    <Icon_Name>i_button_home_one.tga</Icon_Name>
  </HeroUnit>

  <SpaceUnit Name="Vengeance_Frigate">
    <Text_ID>TEXT_UNIT_VENGEANCE_FRIGATE</Text_ID>
    <Affiliation>Underworld</Affiliation>
    <Tech_Level>2</Tech_Level>
    <Build_Cost_Credits>2750</Build_Cost_Credits>
    <Build_Time_Seconds>34</Build_Time_Seconds>
    <Required_Special_Structures>Underworld_Star_Base_2</Required_Special_Structures>
    <Tactical_Health>2900</Tactical_Health>
    <Shield_Points>1100</Shield_Points>
    <Icon_Name>i_button_vengeance.tga</Icon_Name>
  </SpaceUnit>

  <SpaceUnit Name="Kedai_Battleship">
    <Text_ID>TEXT_UNIT_KEDALBE_BATTLESHIP</Text_ID>
    <Affiliation>Underworld</Affiliation>
    <Tech_Level>4</Tech_Level>
    <Build_Cost_Credits>6100</Build_Cost_Credits>
    <Build_Time_Seconds>64</Build_Time_Seconds>
    <Required_Special_Structures>Underworld_Star_Base_4</Required_Special_Structures>
    <Required_Planets>Mandalore, Hypori</Required_Planets>
    <Tactical_Health>7800</Tactical_Health>
    <Shield_Points>3200</Shield_Points>
    <Icon_Name>i_button_kedalbe.tga</Icon_Name>
  </SpaceUnit>
</FactionsAndTechTree>`;
}

function getChildValue(el: Element, tagName: string): string {
  const target = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.tagName.toLowerCase() === target) {
      return (child.textContent || '').trim();
    }
  }
  return '';
}

function setChildValue(doc: XMLDocument, el: Element, tagName: string, value: string) {
  const target = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.tagName.toLowerCase() === target) {
      child.textContent = value;
      return;
    }
  }
  if (value.trim() !== '') {
    const newChild = doc.createElement(tagName);
    newChild.textContent = value;
    el.appendChild(newChild);
  }
}

function parseRgbaToHex(rgbaStr: string): string {
  const parts = rgbaStr
    .split(',')
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => !isNaN(n));
  if (parts.length >= 3) {
    const r = Math.max(0, Math.min(255, parts[0])).toString(16).padStart(2, '0');
    const g = Math.max(0, Math.min(255, parts[1])).toString(16).padStart(2, '0');
    const b = Math.max(0, Math.min(255, parts[2])).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#6366f1';
}

function hexToRgbaString(hex: string, alpha = 255): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `120, 140, 255, ${alpha}`;
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}, ${alpha}`;
}

export default function TechTreeEditor({
  initialDoc,
  fileName: initialFileName,
  onClose,
  onError,
  workspaceFiles = [],
  datRecords,
  onSelectWorkspaceFile
}: TechTreeEditorProps) {
  const lang = useLanguage();
  const [xmlDoc, setXmlDoc] = useState<XMLDocument>(initialDoc);
  const [currentFileName, setCurrentFileName] = useState<string>(initialFileName);
  const [revision, setRevision] = useState<number>(0);

  const [viewMode, setViewMode] = useState<'tech_board' | 'factions' | 'raw_xml'>('tech_board');
  const [selectedFactionFilter, setSelectedFactionFilter] = useState<string>('ALL');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<'all' | 'space' | 'ground' | 'hero' | 'structure'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const datMap = useMemo(() => {
    const map = new Map<string, string>();
    if (datRecords) {
      for (const r of datRecords) {
        map.set(r.key.toUpperCase(), r.value);
      }
    }
    return map;
  }, [datRecords]);

  // Parse Factions and Tech Units from current XMLDocument
  const { factions, units } = useMemo(() => {
    const parsedFactions: FactionNodeData[] = [];
    const parsedUnits: TechUnitNodeData[] = [];
    const root = xmlDoc.documentElement;
    if (!root) return { factions: parsedFactions, units: parsedUnits };

    const unitTagSet = new Set(TECH_UNIT_TAGS.map((t) => t.toLowerCase()));

    for (let i = 0; i < root.children.length; i++) {
      const el = root.children[i];
      const tagLower = el.tagName.toLowerCase();
      const nameAttr = el.getAttribute('Name') || `${el.tagName}_${i + 1}`;

      if (tagLower === 'faction') {
        parsedFactions.push({
          id: `faction_${i}_${nameAttr}`,
          node: el,
          name: nameAttr,
          textId: getChildValue(el, 'Text_ID'),
          iconName: getChildValue(el, 'Icon_Name'),
          colorRgba: getChildValue(el, 'Color') || '120, 160, 255, 255',
          primaryEnemy: getChildValue(el, 'Primary_Enemy'),
          isPlayable: getChildValue(el, 'Is_Playable') || 'true',
          canControlPlanets: getChildValue(el, 'Can_Control_Planets') || 'true',
          spaceCap: getChildValue(el, 'Space_Tactical_Unit_Cap') || '20',
          landCap: getChildValue(el, 'Land_Tactical_Unit_Cap') || '10',
          basicAi: getChildValue(el, 'Basic_AI') || 'DefaultGalacticAI',
          musicEventBattle: getChildValue(el, 'Music_Event_Battle_Load_Screen'),
          musicEventStrategic: getChildValue(el, 'Music_Event_Strategic_Theme'),
          superweapon: getChildValue(el, 'Superweapon')
        });
      } else if (unitTagSet.has(tagLower)) {
        const rawTech = parseInt(getChildValue(el, 'Tech_Level') || '0', 10);
        const clampedTech = isNaN(rawTech) ? 0 : Math.max(-1, Math.min(5, rawTech));
        parsedUnits.push({
          id: `unit_${i}_${nameAttr}`,
          node: el,
          tagName: el.tagName,
          name: nameAttr,
          textId: getChildValue(el, 'Text_ID'),
          affiliation: (getChildValue(el, 'Affiliation') || 'Neutral').split(',')[0].trim(),
          techLevel: clampedTech < 0 ? 5 : clampedTech,
          buildCost: getChildValue(el, 'Build_Cost_Credits') || '0',
          buildTime: getChildValue(el, 'Build_Time_Seconds') || '0',
          requiredStructures: getChildValue(el, 'Required_Special_Structures'),
          requiredPlanets: getChildValue(el, 'Required_Planets'),
          health: getChildValue(el, 'Tactical_Health') || getChildValue(el, 'Health') || '0',
          shields: getChildValue(el, 'Shield_Points') || '0',
          iconName: getChildValue(el, 'Icon_Name')
        });
      }
    }

    return { factions: parsedFactions, units: parsedUnits };
  }, [xmlDoc, revision]);

  // All available faction names
  const availableFactions = useMemo(() => {
    const set = new Set<string>();
    factions.forEach((f) => set.add(f.name));
    units.forEach((u) => {
      if (u.affiliation) set.add(u.affiliation);
    });
    if (set.size === 0) {
      set.add('Empire');
      set.add('Rebel');
      set.add('Underworld');
    }
    return Array.from(set);
  }, [factions, units]);

  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return units.filter((u) => {
      if (selectedFactionFilter !== 'ALL' && u.affiliation.toLowerCase() !== selectedFactionFilter.toLowerCase()) {
        return false;
      }
      if (selectedDomainFilter !== 'all') {
        const tag = u.tagName.toLowerCase();
        if (selectedDomainFilter === 'space' && tag !== 'spaceunit' && tag !== 'squadron') return false;
        if (
          selectedDomainFilter === 'ground' &&
          tag !== 'groundvehicle' &&
          tag !== 'groundinfantry' &&
          tag !== 'groundcompany'
        )
          return false;
        if (selectedDomainFilter === 'hero' && tag !== 'herounit' && tag !== 'uniqueunit') return false;
        if (
          selectedDomainFilter === 'structure' &&
          tag !== 'starbase' &&
          tag !== 'specialstructure' &&
          tag !== 'structure'
        )
          return false;
      }
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.textId.toLowerCase().includes(q) ||
        u.requiredStructures.toLowerCase().includes(q) ||
        u.requiredPlanets.toLowerCase().includes(q)
      );
    });
  }, [units, selectedFactionFilter, selectedDomainFilter, searchQuery]);

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId) || units[0] || null,
    [units, selectedUnitId]
  );

  const selectedFaction = useMemo(
    () => factions.find((f) => f.id === selectedFactionId) || factions[0] || null,
    [factions, selectedFactionId]
  );

  const handleUpdateUnitField = (unit: TechUnitNodeData, xmlTag: string, value: string) => {
    setChildValue(xmlDoc, unit.node, xmlTag, value);
    setRevision((r) => r + 1);
  };

  const handleStepUnitTech = (unit: TechUnitNodeData, delta: number) => {
    const nextTech = Math.max(0, Math.min(5, unit.techLevel + delta));
    setChildValue(xmlDoc, unit.node, 'Tech_Level', String(nextTech));
    setRevision((r) => r + 1);
    showToast(
      tr(
        lang,
        `${unit.name} moved to Tech ${nextTech}`,
        `${unit.name} movido a Tech ${nextTech}`,
        `${unit.name} déplacé vers Tech ${nextTech}`
      )
    );
  };

  const handleUpdateFactionField = (faction: FactionNodeData, xmlTag: string, value: string) => {
    setChildValue(xmlDoc, faction.node, xmlTag, value);
    setRevision((r) => r + 1);
  };

  const handleCreateFaction = () => {
    const root = xmlDoc.documentElement;
    if (!root) return;
    const newName = `Custom_Faction_${factions.length + 1}`;
    const el = xmlDoc.createElement('Faction');
    el.setAttribute('Name', newName);
    setChildValue(xmlDoc, el, 'Text_ID', `TEXT_FACTION_${newName.toUpperCase()}`);
    setChildValue(xmlDoc, el, 'Icon_Name', 'i_icon_custom_faction.tga');
    setChildValue(xmlDoc, el, 'Color', '168, 85, 247, 255');
    setChildValue(xmlDoc, el, 'Primary_Enemy', 'Empire');
    setChildValue(xmlDoc, el, 'Is_Playable', 'true');
    setChildValue(xmlDoc, el, 'Can_Control_Planets', 'true');
    setChildValue(xmlDoc, el, 'Space_Tactical_Unit_Cap', '25');
    setChildValue(xmlDoc, el, 'Land_Tactical_Unit_Cap', '10');
    setChildValue(xmlDoc, el, 'Basic_AI', 'DefaultGalacticAI');
    root.insertBefore(el, root.firstChild);
    setRevision((r) => r + 1);
    setViewMode('factions');
    showToast(tr(lang, `Created ${newName}`, `Facción ${newName} creada`, `Faction ${newName} créée`));
  };

  const handleCreateUnitInTech = (techLevel: number) => {
    const root = xmlDoc.documentElement;
    if (!root) return;
    const factionName = selectedFactionFilter !== 'ALL' ? selectedFactionFilter : 'Empire';
    const newName = `${factionName}_Unit_Tech${techLevel}_${units.length + 1}`;
    const el = xmlDoc.createElement('SpaceUnit');
    el.setAttribute('Name', newName);
    setChildValue(xmlDoc, el, 'Text_ID', `TEXT_UNIT_${newName.toUpperCase()}`);
    setChildValue(xmlDoc, el, 'Affiliation', factionName);
    setChildValue(xmlDoc, el, 'Tech_Level', String(techLevel));
    setChildValue(xmlDoc, el, 'Build_Cost_Credits', String((techLevel + 1) * 900));
    setChildValue(xmlDoc, el, 'Build_Time_Seconds', String((techLevel + 1) * 14));
    setChildValue(xmlDoc, el, 'Required_Special_Structures', `${factionName}_Star_Base_${Math.max(1, techLevel)}`);
    setChildValue(xmlDoc, el, 'Tactical_Health', String((techLevel + 1) * 1200));
    setChildValue(xmlDoc, el, 'Shield_Points', String((techLevel + 1) * 600));
    setChildValue(xmlDoc, el, 'Icon_Name', 'i_button_new_unit.tga');
    root.appendChild(el);
    setRevision((r) => r + 1);
    showToast(tr(lang, `Added ${newName} at Tech ${techLevel}`, `Añadida ${newName} en Tech ${techLevel}`, `Ajouté ${newName}`));
  };

  const handleScanWorkspaceRoster = async () => {
    const xmlFiles = workspaceFiles.filter((f) => {
      const p = (f.webkitRelativePath || f.name).toLowerCase();
      return (
        p.endsWith('.xml') &&
        (p.includes('unit') || p.includes('squadron') || p.includes('hero') || p.includes('faction') || p.includes('starbase'))
      );
    });
    if (xmlFiles.length === 0) {
      onError(
        tr(
          lang,
          'No unit or faction XML files found in loaded Data/ folder.',
          'No se encontraron archivos XML de unidades o facciones en la carpeta Data/ cargada.',
          'Aucun fichier XML d\'unité ou faction trouvé dans Data/.'
        )
      );
      return;
    }

    const parser = new DOMParser();
    const mergedDoc = parser.parseFromString('<?xml version="1.0" encoding="utf-8"?>\n<FactionsAndTechTree>\n</FactionsAndTechTree>', 'text/xml');
    const mergedRoot = mergedDoc.documentElement;
    const unitTagSet = new Set(TECH_UNIT_TAGS.map((t) => t.toLowerCase()));
    let importedCount = 0;

    for (const file of xmlFiles.slice(0, 35)) {
      try {
        const text = await file.text();
        const doc = parser.parseFromString(text, 'text/xml');
        if (!doc.documentElement || doc.getElementsByTagName('parsererror').length > 0) continue;
        for (let i = 0; i < doc.documentElement.children.length; i++) {
          const child = doc.documentElement.children[i];
          const tLower = child.tagName.toLowerCase();
          if (tLower === 'faction' || unitTagSet.has(tLower)) {
            mergedRoot.appendChild(mergedDoc.importNode(child, true));
            importedCount++;
          }
        }
      } catch {
        // ignore malformed file
      }
    }

    setXmlDoc(mergedDoc);
    setCurrentFileName('Workspace_TechTree_Factions.xml');
    setRevision((r) => r + 1);
    showToast(
      tr(
        lang,
        `Scanned ${importedCount} entities from Workspace Data/XML`,
        `Escaneadas ${importedCount} entidades desde Data/XML`,
        `${importedCount} entités analysées depuis Data/XML`
      )
    );
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      if (doc.getElementsByTagName('parsererror').length > 0) {
        onError(tr(lang, 'Invalid XML syntax in file.', 'Sintaxis XML inválida en el archivo.', 'Syntaxe XML invalide.'));
        return;
      }
      setXmlDoc(doc);
      setCurrentFileName(file.name);
      setRevision((r) => r + 1);
    } catch {
      onError(tr(lang, 'Failed to read XML file.', 'Error al leer el archivo XML.', 'Erreur de lecture XML.'));
    }
    e.target.value = '';
  };

  const handleSaveXml = () => {
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(xmlDoc);
    const blob = new Blob([raw], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'Factions_TechTree.xml';
    a.click();
    URL.revokeObjectURL(url);
    showToast(tr(lang, 'Exported XML successfully', 'XML exportado correctamente', 'XML exporté avec succès'));
  };

  const rawXmlPreview = useMemo(() => {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }, [xmlDoc, revision]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-indigo-900/50 bg-slate-900/90 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-300 truncate">
                {tr(
                  lang,
                  'Tech Tree & Factions Studio',
                  'Estudio de Árbol Tecnológico y Facciones',
                  'Studio Arbre Technologique & Factions'
                )}
              </h2>
              <span className="text-[10px] font-mono text-indigo-400/90">v1.0</span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-slate-400 truncate">{currentFileName}</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 truncate">
              {factions.length} {tr(lang, 'Factions', 'Facciones', 'Factions')} · {units.length}{' '}
              {tr(lang, 'Tech Entities (Tech 0–5)', 'Entidades en Árbol (Tech 0–5)', 'Entités (Tech 0–5)')}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-sm">
            <button
              onClick={() => setViewMode('tech_board')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'tech_board'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tr(lang, 'Tech 0–5 Board', 'Tablero Tech 0–5', 'Tableau Tech 0–5')}
            </button>
            <button
              onClick={() => setViewMode('factions')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'factions'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tr(lang, 'Factions.xml Inspector', 'Inspector Factions.xml', 'Inspecteur Factions.xml')} ({factions.length})
            </button>
            <button
              onClick={() => setViewMode('raw_xml')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-xs transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'raw_xml'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XML
            </button>
          </div>

          {workspaceFiles.length > 0 && (
            <button
              onClick={handleScanWorkspaceRoster}
              className="px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 rounded-sm text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
              title={tr(lang, 'Scan all Unit & Faction XMLs in Data/XML', 'Escanear todos los XML de Unidades y Facciones en Data/XML', 'Scanner tous les XML dans Data/XML')}
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{tr(lang, 'Scan Data/XML', 'Escanear Data/XML', 'Scanner Data/XML')}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm text-[10px] font-mono uppercase tracking-wider flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tr(lang, 'Import XML', 'Importar XML', 'Importer XML')}</span>
          </button>

          <button
            onClick={handleSaveXml}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-sm flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Export XML', 'Exportar XML', 'Exporter XML')}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-indigo-950/90 border-b border-indigo-500/40 px-4 py-1.5 flex items-center justify-center space-x-2 text-xs font-mono text-indigo-200">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* VIEW 1: TECH TREE 0-5 BOARD */}
      {viewMode === 'tech_board' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-header Filter Bar */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {tr(lang, 'Faction:', 'Facción:', 'Faction :')}
              </span>
              <button
                onClick={() => setSelectedFactionFilter('ALL')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-xs border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedFactionFilter === 'ALL'
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tr(lang, 'All Factions', 'Todas', 'Toutes')}
              </button>
              {availableFactions.map((fac) => (
                <button
                  key={fac}
                  onClick={() => setSelectedFactionFilter(fac)}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-xs border transition-colors whitespace-nowrap cursor-pointer ${
                    selectedFactionFilter.toLowerCase() === fac.toLowerCase()
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {fac}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-sm text-[10px] font-mono">
                {(
                  [
                    { id: 'all', label: tr(lang, 'All', 'Todo', 'Tout') },
                    { id: 'space', label: tr(lang, 'Space', 'Espacio', 'Espace') },
                    { id: 'ground', label: tr(lang, 'Ground', 'Tierra', 'Sol') },
                    { id: 'hero', label: tr(lang, 'Heroes', 'Héroes', 'Héros') },
                    { id: 'structure', label: tr(lang, 'Bases', 'Bases', 'Bases') }
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomainFilter(d.id)}
                    className={`px-2.5 py-1 rounded-xs uppercase transition-colors cursor-pointer ${
                      selectedDomainFilter === d.id
                        ? 'bg-slate-800 text-indigo-300 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr(lang, 'Filter units or planets...', 'Filtrar unidad o planeta...', 'Filtrer unité ou planète...')}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 6-Column Tech Level Progression Board + Right Quick Inspector */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 grid grid-cols-6 gap-2.5 p-3 overflow-x-auto overflow-y-hidden bg-slate-950">
              {[0, 1, 2, 3, 4, 5].map((tech) => {
                const colUnits = filteredUnits.filter((u) => u.techLevel === tech);
                const avgCost =
                  colUnits.length > 0
                    ? Math.round(
                        colUnits.reduce((acc, item) => acc + (parseFloat(item.buildCost) || 0), 0) / colUnits.length
                      )
                    : 0;

                return (
                  <div
                    key={tech}
                    className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-sm overflow-hidden min-w-[205px]"
                  >
                    {/* Column Header */}
                    <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider block">
                          TECH {tech}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                          {colUnits.length} {tr(lang, 'units', 'unidades', 'unités')} · Ø {avgCost} cr
                        </span>
                      </div>
                      <button
                        onClick={() => handleCreateUnitInTech(tech)}
                        className="p-1 bg-indigo-950/80 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/50 rounded-xs transition-colors cursor-pointer"
                        title={tr(lang, `New Unit at Tech ${tech}`, `Nueva unidad en Tech ${tech}`, `Nouvelle unité Tech ${tech}`)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Units List in Column */}
                    <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-2">
                      {colUnits.length === 0 ? (
                        <div className="h-32 border border-dashed border-slate-800 rounded-sm flex flex-col items-center justify-center p-3 text-center">
                          <span className="text-[10px] font-mono text-slate-500">
                            {tr(lang, `No units at Tech ${tech}`, `Sin unidades en Tech ${tech}`, `Aucune unité en Tech ${tech}`)}
                          </span>
                        </div>
                      ) : (
                        colUnits.map((u) => {
                          const isSelected = selectedUnit?.id === u.id;
                          const localizedName = u.textId ? datMap.get(u.textId.toUpperCase()) : undefined;
                          return (
                            <div
                              key={u.id}
                              onClick={() => setSelectedUnitId(u.id)}
                              className={`p-2.5 rounded-sm border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-950/50 border-indigo-400'
                                  : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-xs font-mono font-bold text-slate-100 truncate">
                                  {localizedName || u.name}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                {u.affiliation} · {u.tagName}
                              </div>

                              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono tabular-nums">
                                <span className="text-amber-300">{u.buildCost} cr</span>
                                <span className="text-cyan-300">{u.buildTime}s</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    disabled={tech === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepUnitTech(u, -1);
                                    }}
                                    className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 rounded-xs text-slate-300 cursor-pointer"
                                    title={tr(lang, 'Demote Tech Level (-1)', 'Bajar Nivel Tech (-1)', 'Réduire Tech (-1)')}
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    disabled={tech === 5}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepUnitTech(u, 1);
                                    }}
                                    className="px-1 py-0.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 rounded-xs text-slate-300 cursor-pointer"
                                    title={tr(lang, 'Promote Tech Level (+1)', 'Subir Nivel Tech (+1)', 'Augmenter Tech (+1)')}
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {u.requiredStructures && (
                                <div className="mt-1.5 text-[9px] font-mono text-slate-500 truncate">
                                  Req: {u.requiredStructures}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Selected Unit Progression Inspector */}
            {selectedUnit && (
              <div className="w-80 border-l border-slate-800 bg-slate-900/70 p-4 overflow-y-auto custom-scrollbar shrink-0 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block">
                    {tr(lang, 'Tech Node Inspector', 'Inspector de Nodo Tech', 'Inspecteur de Nœud Tech')}
                  </span>
                  <h3 className="text-sm font-mono font-bold text-white truncate mt-0.5">{selectedUnit.name}</h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    {selectedUnit.tagName} · {selectedUnit.affiliation}
                  </p>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      {tr(lang, 'Faction Affiliation (<Affiliation>)', 'Facción (<Affiliation>)', 'Faction (<Affiliation>)')}
                    </label>
                    <input
                      type="text"
                      value={selectedUnit.affiliation}
                      onChange={(e) => handleUpdateUnitField(selectedUnit, 'Affiliation', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] uppercase text-slate-400 block mb-1">
                        Tech Level (0–5)
                      </label>
                      <select
                        value={selectedUnit.techLevel}
                        onChange={(e) => handleUpdateUnitField(selectedUnit, 'Tech_Level', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-indigo-300 font-bold"
                      >
                        {[0, 1, 2, 3, 4, 5].map((lv) => (
                          <option key={lv} value={lv}>
                            Tech {lv}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-400 block mb-1">
                        {tr(lang, 'Credits Cost', 'Coste Créditos', 'Coût Crédits')}
                      </label>
                      <input
                        type="number"
                        value={selectedUnit.buildCost}
                        onChange={(e) => handleUpdateUnitField(selectedUnit, 'Build_Cost_Credits', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-amber-300 tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] uppercase text-slate-400 block mb-1">
                        {tr(lang, 'Build Time (s)', 'Tiempo (seg)', 'Temps (s)')}
                      </label>
                      <input
                        type="number"
                        value={selectedUnit.buildTime}
                        onChange={(e) => handleUpdateUnitField(selectedUnit, 'Build_Time_Seconds', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-cyan-300 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-slate-400 block mb-1">
                        {tr(lang, 'Hull Health', 'Vida Casco', 'Santé Coque')}
                      </label>
                      <input
                        type="number"
                        value={selectedUnit.health}
                        onChange={(e) => handleUpdateUnitField(selectedUnit, 'Tactical_Health', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-emerald-300 tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Required_Special_Structures&gt;
                    </label>
                    <input
                      type="text"
                      value={selectedUnit.requiredStructures}
                      onChange={(e) =>
                        handleUpdateUnitField(selectedUnit, 'Required_Special_Structures', e.target.value)
                      }
                      placeholder="Empire_Star_Base_3"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Required_Planets&gt;
                    </label>
                    <input
                      type="text"
                      value={selectedUnit.requiredPlanets}
                      onChange={(e) => handleUpdateUnitField(selectedUnit, 'Required_Planets', e.target.value)}
                      placeholder="Kuat, Fondor"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Text_ID&gt;
                    </label>
                    <input
                      type="text"
                      value={selectedUnit.textId}
                      onChange={(e) => handleUpdateUnitField(selectedUnit, 'Text_ID', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-sm px-2.5 py-1.5 text-purple-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FACTIONS.XML INSPECTOR */}
      {viewMode === 'factions' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Faction List */}
          <div className="w-72 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {tr(lang, 'Factions in XML', 'Facciones en XML', 'Factions dans XML')} ({factions.length})
              </span>
              <button
                onClick={handleCreateFaction}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase rounded-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{tr(lang, 'New Faction', 'Nueva Facción', 'Nouvelle')}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {factions.map((fac) => {
                const isSelected = selectedFaction?.id === fac.id;
                const hexColor = parseRgbaToHex(fac.colorRgba);
                return (
                  <button
                    key={fac.id}
                    onClick={() => setSelectedFactionId(fac.id)}
                    className={`w-full text-left p-2.5 rounded-sm border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-xs border border-white/20 shrink-0"
                        style={{ backgroundColor: hexColor }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold truncate">{fac.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          AI: {fac.basicAi} · Cap: {fac.spaceCap}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Faction Editor */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {selectedFaction ? (
              <div className="max-w-3xl space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-sm border border-white/20 flex items-center justify-center"
                      style={{ backgroundColor: parseRgbaToHex(selectedFaction.colorRgba) }}
                    >
                      <Flag className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-base font-mono font-bold text-white">{selectedFaction.name}</h3>
                      <p className="text-xs font-mono text-slate-400">
                        {selectedFaction.textId} · RGBA ({selectedFaction.colorRgba})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={parseRgbaToHex(selectedFaction.colorRgba)}
                      onChange={(e) =>
                        handleUpdateFactionField(selectedFaction, 'Color', hexToRgbaString(e.target.value))
                      }
                      className="w-9 h-9 bg-slate-950 border border-slate-700 rounded-sm cursor-pointer p-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Text_ID&gt;</label>
                    <input
                      type="text"
                      value={selectedFaction.textId}
                      onChange={(e) => handleUpdateFactionField(selectedFaction, 'Text_ID', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-purple-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Icon_Name&gt;</label>
                    <input
                      type="text"
                      value={selectedFaction.iconName}
                      onChange={(e) => handleUpdateFactionField(selectedFaction, 'Icon_Name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-amber-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Color&gt; (R, G, B, A)</label>
                    <input
                      type="text"
                      value={selectedFaction.colorRgba}
                      onChange={(e) => handleUpdateFactionField(selectedFaction, 'Color', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-slate-200 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Primary_Enemy&gt;</label>
                    <input
                      type="text"
                      value={selectedFaction.primaryEnemy}
                      onChange={(e) => handleUpdateFactionField(selectedFaction, 'Primary_Enemy', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-rose-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Space_Tactical_Unit_Cap&gt;
                    </label>
                    <input
                      type="number"
                      value={selectedFaction.spaceCap}
                      onChange={(e) =>
                        handleUpdateFactionField(selectedFaction, 'Space_Tactical_Unit_Cap', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-cyan-300 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Land_Tactical_Unit_Cap&gt;
                    </label>
                    <input
                      type="number"
                      value={selectedFaction.landCap}
                      onChange={(e) =>
                        handleUpdateFactionField(selectedFaction, 'Land_Tactical_Unit_Cap', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-emerald-300 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Basic_AI&gt;</label>
                    <input
                      type="text"
                      value={selectedFaction.basicAi}
                      onChange={(e) => handleUpdateFactionField(selectedFaction, 'Basic_AI', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">&lt;Superweapon&gt;</label>
                    <input
                      type="text"
                      value={selectedFaction.superweapon}
                      onChange={(e) => handleUpdateFactionField(selectedFaction, 'Superweapon', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Music_Event_Battle_Load_Screen&gt;
                    </label>
                    <input
                      type="text"
                      value={selectedFaction.musicEventBattle}
                      onChange={(e) =>
                        handleUpdateFactionField(selectedFaction, 'Music_Event_Battle_Load_Screen', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-400 block mb-1">
                      &lt;Music_Event_Strategic_Theme&gt;
                    </label>
                    <input
                      type="text"
                      value={selectedFaction.musicEventStrategic}
                      onChange={(e) =>
                        handleUpdateFactionField(selectedFaction, 'Music_Event_Strategic_Theme', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-sm px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-mono text-xs space-y-3">
                <p>
                  {tr(
                    lang,
                    'No <Faction> nodes in current XML file.',
                    'No hay nodos <Faction> en el archivo XML actual.',
                    'Aucun nœud <Faction> dans ce fichier XML.'
                  )}
                </p>
                <button
                  onClick={handleCreateFaction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm uppercase text-[10px] font-bold cursor-pointer"
                >
                  {tr(lang, 'Create First Faction', 'Crear Primera Facción', 'Créer une Faction')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: RAW XML */}
      {viewMode === 'raw_xml' && (
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <pre className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-sm font-mono text-xs text-slate-300 overflow-auto custom-scrollbar">
            {rawXmlPreview}
          </pre>
        </div>
      )}
    </div>
  );
}
