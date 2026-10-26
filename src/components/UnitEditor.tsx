import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Save,
  Search,
  X,
  Shield,
  Heart,
  Coins,
  Crosshair,
  Plus,
  Copy,
  Trash2,
  Upload,
  Table,
  Code,
  Sliders,
  Gauge,
  Radar,
  Cpu,
  Layers,
  Percent,
  Check,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import { DatRecord } from '../lib/dat';

interface UnitEditorProps {
  initialDoc: XMLDocument;
  fileName: string;
  onClose: () => void;
  onError: (err: string) => void;
  workspaceFiles?: File[];
  datRecords?: DatRecord[] | null;
  onSelectWorkspaceUnit?: (path: string) => void;
  onAddDatRecord?: (key: string, value: string) => void;
  onOpenHardPointEditor?: (hpName?: string) => void;
  hardPointsDoc?: XMLDocument | null;
}

export interface UnitData {
  id: string;
  node: Element;
  tagName: string;
  name: string;
  variantOf: string;
  textId: string;
  encyclopediaText: string;
  encyclopediaClass: string;
  affiliation: string;
  categoryMask: string;
  techLevel: string;
  buildCost: string;
  buildTime: string;
  populationValue: string;
  sizeValue: string;
  health: string;
  armorType: string;
  shields: string;
  shieldRefresh: string;
  energyCapacity: string;
  energyRefresh: string;
  damageRating: string;
  maxSpeed: string;
  turnRate: string;
  spaceLayer: string;
  movementClass: string;
  hyperspace: string;
  hyperspaceSpeed: string;
  fowRange: string;
  maxAttackDistance: string;
  projectileTypes: string;
  firePulseCount: string;
  fireRecharge: string;
  hardPoints: string;
  squadronUnits: string;
  companyUnits: string;
  spawnedUnits: string;
  reserveSpawnedUnits: string;
  requiredStructures: string;
  requiredPlanets: string;
  spaceModel: string;
  landModel: string;
  iconName: string;
  scaleFactor: string;
  behavior: string;
  unitBehavior: string;
}

const UNIT_TAGS = [
  'SpaceUnit',
  'Squadron',
  'GroundVehicle',
  'GroundInfantry',
  'GroundCompany',
  'HeroUnit',
  'UniqueUnit',
  'StarBase',
  'SpecialStructure',
  'Structure',
  'Container'
];

type InspectorTab = 'identity' | 'economy' | 'combat' | 'movement' | 'weapons' | 'all_tags';
type ViewMode = 'inspector' | 'versus' | 'table' | 'raw_xml';
type DomainFilter = 'all' | 'space' | 'squadron' | 'ground' | 'hero' | 'structure';
type SortField = 'name' | 'affiliation' | 'tech' | 'cost' | 'time' | 'health' | 'shields' | 'speed' | 'ehp_ratio';

export function createSampleUnitsXmlString(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<Units>
  <SpaceUnit Name="Imperial_Star_Destroyer">
    <Text_ID>TEXT_UNIT_STAR_DESTROYER</Text_ID>
    <Encyclopedia_Text>TEXT_TOOLTIP_STAR_DESTROYER</Encyclopedia_Text>
    <Encyclopedia_Unit_Class>TEXT_ENCYCLOPEDIA_CLASS_CAPITAL</Encyclopedia_Unit_Class>
    <Affiliation>Empire</Affiliation>
    <CategoryMask>Capital | AntiFrigate</CategoryMask>
    <Space_Model_Name>EV_StarDestroyer.ALO</Space_Model_Name>
    <Icon_Name>i_button_imperator.tga</Icon_Name>
    <Scale_Factor>1.0</Scale_Factor>
    <Tech_Level>3</Tech_Level>
    <Build_Cost_Credits>5900</Build_Cost_Credits>
    <Build_Time_Seconds>65</Build_Time_Seconds>
    <Population_Value>4</Population_Value>
    <Size_Value>8</Size_Value>
    <Tactical_Health>7500</Tactical_Health>
    <Armor_Type>Armor_Star_Destroyer</Armor_Type>
    <Energy_Capacity>9500</Energy_Capacity>
    <Shield_Refresh_Rate>85</Shield_Refresh_Rate>
    <Energy_Refresh_Rate>800</Energy_Refresh_Rate>
    <Damage>70</Damage>
    <Max_Speed>1.45</Max_Speed>
    <Max_Rate_Of_Turn>0.3</Max_Rate_Of_Turn>
    <Space_Layer>Capital</Space_Layer>
    <Hyperspace>Yes</Hyperspace>
    <Hyperspace_Speed>1.5</Hyperspace_Speed>
    <Space_FOW_Reveal_Range>2200.0</Space_FOW_Reveal_Range>
    <Targeting_Max_Attack_Distance>1850.0</Targeting_Max_Attack_Distance>
    <HardPoints>
      HP_Star_Destroyer_Weapon_FL,
      HP_Star_Destroyer_Weapon_FR,
      HP_Star_Destroyer_Ion_BL,
      HP_Star_Destroyer_Ion_BR,
      HP_Star_Destroyer_Shield_Gen,
      HP_Star_Destroyer_Engines,
      HP_Star_Destroyer_Tractor_Beam
    </HardPoints>
    <Starting_Spawned_Units_Tech_0>TIE_Fighter_Squadron, 2</Starting_Spawned_Units_Tech_0>
    <Reserve_Spawned_Units_Tech_0>TIE_Bomber_Squadron, 1</Reserve_Spawned_Units_Tech_0>
    <Required_Star_Base_Level>4</Required_Star_Base_Level>
    <Behavior>DUMMY_STARSHIP, SELECTABLE</Behavior>
    <SpaceBehavior>ABILITY_COUNTDOWN, SIMPLE_SPACE_LOCOMOTOR, POWERED, SHIELDED, HIDE_WHEN_FOGGED, REVEAL, TARGETING, UNIT_AI, ASTEROID_FIELD_DAMAGE, SPAWN_SQUADRON, DAMAGE_TRACKING, ION_STUN_EFFECT, NEBULA</SpaceBehavior>
  </SpaceUnit>

  <SpaceUnit Name="Calamari_Cruiser">
    <Text_ID>TEXT_UNIT_CALAMARI_CRUISER</Text_ID>
    <Encyclopedia_Text>TEXT_TOOLTIP_CALAMARI_CRUISER</Encyclopedia_Text>
    <Encyclopedia_Unit_Class>TEXT_ENCYCLOPEDIA_CLASS_CAPITAL</Encyclopedia_Unit_Class>
    <Affiliation>Rebel</Affiliation>
    <CategoryMask>Capital | AntiFrigate</CategoryMask>
    <Space_Model_Name>RV_MonCalCruiser.ALO</Space_Model_Name>
    <Icon_Name>i_button_mon_calimari_cruiser.tga</Icon_Name>
    <Scale_Factor>1.0</Scale_Factor>
    <Tech_Level>3</Tech_Level>
    <Build_Cost_Credits>5600</Build_Cost_Credits>
    <Build_Time_Seconds>60</Build_Time_Seconds>
    <Population_Value>4</Population_Value>
    <Size_Value>8</Size_Value>
    <Tactical_Health>6800</Tactical_Health>
    <Armor_Type>Armor_Calamari_Cruiser</Armor_Type>
    <Energy_Capacity>11500</Energy_Capacity>
    <Shield_Refresh_Rate>110</Shield_Refresh_Rate>
    <Energy_Refresh_Rate>850</Energy_Refresh_Rate>
    <Damage>65</Damage>
    <Max_Speed>1.6</Max_Speed>
    <Max_Rate_Of_Turn>0.35</Max_Rate_Of_Turn>
    <Space_Layer>Capital</Space_Layer>
    <Hyperspace>Yes</Hyperspace>
    <Hyperspace_Speed>1.5</Hyperspace_Speed>
    <Space_FOW_Reveal_Range>2200.0</Space_FOW_Reveal_Range>
    <Targeting_Max_Attack_Distance>1800.0</Targeting_Max_Attack_Distance>
    <HardPoints>
      HP_Calamari_Cruiser_Turbolaser_01,
      HP_Calamari_Cruiser_Turbolaser_02,
      HP_Calamari_Cruiser_Ion_01,
      HP_Calamari_Cruiser_Ion_02,
      HP_Calamari_Cruiser_Shield_Gen,
      HP_Calamari_Cruiser_Engines
    </HardPoints>
    <Required_Star_Base_Level>4</Required_Star_Base_Level>
  </SpaceUnit>

  <GroundVehicle Name="Imperial_Heavy_Assault_Walker">
    <Text_ID>TEXT_UNIT_AT_AT_WALKER</Text_ID>
    <Encyclopedia_Text>TEXT_TOOLTIP_AT_AT</Encyclopedia_Text>
    <Encyclopedia_Unit_Class>TEXT_ENCYCLOPEDIA_CLASS_HEAVY_WALKER</Encyclopedia_Unit_Class>
    <Affiliation>Empire</Affiliation>
    <CategoryMask>Vehicle | AntiVehicle | AntiStructure</CategoryMask>
    <Land_Model_Name>EV_AT-AT.ALO</Land_Model_Name>
    <Icon_Name>i_button_atat.tga</Icon_Name>
    <Scale_Factor>1.1</Scale_Factor>
    <Tech_Level>3</Tech_Level>
    <Build_Cost_Credits>2200</Build_Cost_Credits>
    <Build_Time_Seconds>42</Build_Time_Seconds>
    <Size_Value>150</Size_Value>
    <Tactical_Health>2400</Tactical_Health>
    <Armor_Type>Armor_AT_AT</Armor_Type>
    <Energy_Capacity>0</Energy_Capacity>
    <Damage>45</Damage>
    <Max_Speed>0.65</Max_Speed>
    <Max_Rate_Of_Turn>1.2</Max_Rate_Of_Turn>
    <MovementClass>Walker</MovementClass>
    <Land_FOW_Reveal_Range>450.0</Land_FOW_Reveal_Range>
    <Targeting_Max_Attack_Distance>400.0</Targeting_Max_Attack_Distance>
    <Projectile_Types>Proj_Ground_Turbolaser_Red</Projectile_Types>
    <Projectile_Fire_Pulse_Count>2</Projectile_Fire_Pulse_Count>
    <Projectile_Fire_Recharge_Seconds>2.5</Projectile_Fire_Recharge_Seconds>
  </GroundVehicle>
</Units>`;
}

export default function UnitEditor({
  initialDoc,
  fileName: initialFileName,
  onClose,
  onError,
  workspaceFiles = [],
  datRecords = null,
  hardPointsDoc = null,
  onSelectWorkspaceUnit,
  onAddDatRecord,
  onOpenHardPointEditor
}: UnitEditorProps) {
  const lang = useLanguage();

  const [doc, setDoc] = useState<XMLDocument>(initialDoc);
  const [editableFileName, setEditableFileName] = useState<string>(initialFileName || 'Units.xml');
  const [units, setUnits] = useState<UnitData[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Filters & View State
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [factionFilter, setFactionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('inspector');
  const [activeTab, setActiveTab] = useState<InspectorTab>('identity');
  const [versusUnitBId, setVersusUnitBId] = useState<string>('');

  // Table Sorting State
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Modals & Drawers State
  const [showBatchBalance, setShowBatchBalance] = useState<boolean>(false);
  const [batchField, setBatchField] = useState<'Build_Cost_Credits' | 'Build_Time_Seconds' | 'Tactical_Health' | 'Energy_Capacity' | 'Max_Speed'>('Build_Cost_Credits');
  const [batchPercent, setBatchPercent] = useState<number>(-10);

  const [showNewUnitModal, setShowNewUnitModal] = useState<boolean>(false);
  const [newUnitTag, setNewUnitTag] = useState<string>('SpaceUnit');
  const [newUnitName, setNewUnitName] = useState<string>('');
  const [newUnitFaction, setNewUnitFaction] = useState<string>('Empire');

  // Custom XML Tag Adder in Advanced Tab
  const [customTagName, setCustomTagName] = useState<string>('');
  const [customTagValue, setCustomTagValue] = useState<string>('');
  const [newHardPointInput, setNewHardPointInput] = useState<string>('');

  // Raw Node XML editing
  const [rawNodeXml, setRawNodeXml] = useState<string>('');
  const [rawNodeError, setRawNodeError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileDownloadAnchorRef = useRef<HTMLAnchorElement>(null);
  const uploadXmlInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Build Map of DAT translations for fast lookup
  const datMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!datRecords) return map;
    for (const r of datRecords) {
      map.set(r.key.trim().toUpperCase(), r.value);
    }
    return map;
  }, [datRecords]);

  // Extract UnitData from an XML Element
  const extractUnitFromElement = useCallback((node: Element, idx: number): UnitData => {
    const tagName = node.tagName;
    const nameAttr = node.getAttribute('Name') || `Unnamed_${idx}`;

    const getTag = (tag: string, fallbackTag?: string): string => {
      const child = Array.from(node.children).find(
        c => c.tagName.toLowerCase() === tag.toLowerCase()
      );
      if (child && child.textContent !== null) return child.textContent.trim();
      if (fallbackTag) {
        const fb = Array.from(node.children).find(
          c => c.tagName.toLowerCase() === fallbackTag.toLowerCase()
        );
        if (fb && fb.textContent !== null) return fb.textContent.trim();
      }
      return '';
    };

    const isGround = tagName === 'GroundVehicle' || tagName === 'GroundInfantry' || tagName === 'GroundCompany';

    return {
      id: `${tagName}_${nameAttr}_${idx}`,
      node,
      tagName,
      name: nameAttr,
      variantOf: getTag('Variant_Of_Existing_Type'),
      textId: getTag('Text_ID'),
      encyclopediaText: getTag('Encyclopedia_Text'),
      encyclopediaClass: getTag('Encyclopedia_Unit_Class'),
      affiliation: getTag('Affiliation'),
      categoryMask: getTag('CategoryMask'),
      techLevel: getTag('Tech_Level', 'Required_Timeline'),
      buildCost: getTag('Build_Cost_Credits', 'Tactical_Build_Cost_Multiplayer'),
      buildTime: getTag('Build_Time_Seconds', 'Tactical_Build_Time_Seconds'),
      populationValue: getTag('Population_Value'),
      sizeValue: getTag('Size_Value'),
      health: getTag('Tactical_Health', 'Health'),
      armorType: getTag('Armor_Type'),
      shields: getTag('Shield_Points', 'Energy_Capacity'),
      shieldRefresh: getTag('Shield_Refresh_Rate'),
      energyCapacity: getTag('Energy_Capacity'),
      energyRefresh: getTag('Energy_Refresh_Rate'),
      damageRating: getTag('Damage'),
      maxSpeed: getTag('Max_Speed'),
      turnRate: getTag('Max_Rate_Of_Turn'),
      spaceLayer: getTag('Space_Layer'),
      movementClass: getTag('MovementClass'),
      hyperspace: getTag('Hyperspace'),
      hyperspaceSpeed: getTag('Hyperspace_Speed'),
      fowRange: isGround
        ? getTag('Land_FOW_Reveal_Range', 'Space_FOW_Reveal_Range')
        : getTag('Space_FOW_Reveal_Range', 'Land_FOW_Reveal_Range'),
      maxAttackDistance: getTag('Targeting_Max_Attack_Distance'),
      projectileTypes: getTag('Projectile_Types'),
      firePulseCount: getTag('Projectile_Fire_Pulse_Count'),
      fireRecharge: getTag('Projectile_Fire_Recharge_Seconds'),
      hardPoints: getTag('HardPoints'),
      squadronUnits: getTag('Squadron_Units'),
      companyUnits: getTag('Company_Units'),
      spawnedUnits: getTag('Starting_Spawned_Units_Tech_0'),
      reserveSpawnedUnits: getTag('Reserve_Spawned_Units_Tech_0'),
      requiredStructures: getTag('Required_Special_Structures'),
      requiredPlanets: getTag('Required_Planets'),
      spaceModel: getTag('Space_Model_Name'),
      landModel: getTag('Land_Model_Name'),
      iconName: getTag('Icon_Name'),
      scaleFactor: getTag('Scale_Factor'),
      behavior: getTag('Behavior'),
      unitBehavior: isGround ? getTag('LandBehavior', 'SpaceBehavior') : getTag('SpaceBehavior', 'LandBehavior')
    };
  }, []);

  const parseAllUnitsFromDoc = useCallback((xmlDoc: XMLDocument) => {
    const parsedUnits: UnitData[] = [];
    let counter = 0;

    // Preserve document order across all unit tags
    const rootChildren = xmlDoc.documentElement ? Array.from(xmlDoc.documentElement.children) : [];
    const matchedDirect = rootChildren.filter(el => UNIT_TAGS.includes(el.tagName));

    if (matchedDirect.length > 0) {
      for (const el of matchedDirect) {
        parsedUnits.push(extractUnitFromElement(el, counter++));
      }
    } else {
      UNIT_TAGS.forEach(tag => {
        const nodes = xmlDoc.getElementsByTagName(tag);
        for (let i = 0; i < nodes.length; i++) {
          parsedUnits.push(extractUnitFromElement(nodes[i], counter++));
        }
      });
    }

    setUnits(parsedUnits);
    return parsedUnits;
  }, [extractUnitFromElement]);

  useEffect(() => {
    setDoc(initialDoc);
    setEditableFileName(initialFileName || 'Units.xml');
    const list = parseAllUnitsFromDoc(initialDoc);
    if (list.length > 0) {
      setSelectedUnitId(list[0].id);
      setVersusUnitBId(list[1]?.id || list[0].id);
    } else {
      setSelectedUnitId(null);
    }
  }, [initialDoc, initialFileName, parseAllUnitsFromDoc]);

  const selectedUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || null;
  }, [units, selectedUnitId]);

  const versusUnitB = useMemo(() => {
    return units.find(u => u.id === versusUnitBId) || units[1] || units[0] || null;
  }, [units, versusUnitBId]);

  // Format XML helper
  const formatXmlNode = useCallback((element: Node): string => {
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(element);
    let pad = 0;
    let formatted = '';
    raw
      .replace(/>\s*</g, '>\n<')
      .split('\n')
      .forEach(line => {
        if (line.match(/^<\/\w/)) pad = Math.max(0, pad - 1);
        formatted += '  '.repeat(pad) + line + '\n';
        if (line.match(/^<\w[^>]*[^/]>.*$/) && !line.match(/<\/.+>$/)) pad += 1;
      });
    return formatted.trim();
  }, []);

  // Sync raw XML editor when selectedUnit changes
  useEffect(() => {
    if (selectedUnit) {
      setRawNodeXml(formatXmlNode(selectedUnit.node));
      setRawNodeError(null);
    }
  }, [selectedUnit, formatXmlNode]);

  // Workspace Unit XML files
  const workspaceUnitXmlFiles = useMemo(() => {
    const allXml = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml'));
    return allXml.sort((a, b) => {
      const aScore = /unit|squadron|vehicle|infantry|hero|company|starbase|structure|corvette|frigate|capital|fighter/i.test(a.name) ? 0 : 1;
      const bScore = /unit|squadron|vehicle|infantry|hero|company|starbase|structure|corvette|frigate|capital|fighter/i.test(b.name) ? 0 : 1;
      if (aScore !== bScore) return aScore - bScore;
      return a.name.localeCompare(b.name);
    });
  }, [workspaceFiles]);

  // Distinct Factions present in current XML
  const availableFactions = useMemo(() => {
    const set = new Set<string>();
    units.forEach(u => {
      if (u.affiliation) {
        u.affiliation.split(',').forEach(part => {
          const clean = part.trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set).sort();
  }, [units]);

  // Domain Category Matcher
  const matchesDomain = useCallback((tagName: string, domain: DomainFilter): boolean => {
    if (domain === 'all') return true;
    if (domain === 'space') return tagName === 'SpaceUnit';
    if (domain === 'squadron') return tagName === 'Squadron' || tagName === 'Container';
    if (domain === 'ground') return tagName === 'GroundVehicle' || tagName === 'GroundInfantry' || tagName === 'GroundCompany';
    if (domain === 'hero') return tagName === 'HeroUnit' || tagName === 'UniqueUnit';
    if (domain === 'structure') return tagName === 'StarBase' || tagName === 'SpecialStructure' || tagName === 'Structure';
    return true;
  }, []);

  // Filtered & Sorted Units
  const filteredUnits = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = units.filter(u => {
      if (!matchesDomain(u.tagName, domainFilter)) return false;
      if (factionFilter !== 'all') {
        const affs = u.affiliation.split(',').map(s => s.trim().toLowerCase());
        if (!affs.includes(factionFilter.toLowerCase())) return false;
      }
      if (!q) return true;
      const locName = u.textId ? (datMap.get(u.textId.toUpperCase()) || '').toLowerCase() : '';
      return (
        u.name.toLowerCase().includes(q) ||
        u.tagName.toLowerCase().includes(q) ||
        u.affiliation.toLowerCase().includes(q) ||
        u.categoryMask.toLowerCase().includes(q) ||
        u.variantOf.toLowerCase().includes(q) ||
        locName.includes(q)
      );
    });

    if (viewMode === 'table') {
      const sorted = [...list];
      sorted.sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
        if (sortField === 'affiliation') return a.affiliation.localeCompare(b.affiliation) * dir;
        if (sortField === 'tech') return ((parseFloat(a.techLevel) || 0) - (parseFloat(b.techLevel) || 0)) * dir;
        if (sortField === 'cost') return ((parseFloat(a.buildCost) || 0) - (parseFloat(b.buildCost) || 0)) * dir;
        if (sortField === 'time') return ((parseFloat(a.buildTime) || 0) - (parseFloat(b.buildTime) || 0)) * dir;
        if (sortField === 'health') return ((parseFloat(a.health) || 0) - (parseFloat(b.health) || 0)) * dir;
        if (sortField === 'shields') return ((parseFloat(a.energyCapacity) || 0) - (parseFloat(b.energyCapacity) || 0)) * dir;
        if (sortField === 'speed') return ((parseFloat(a.maxSpeed) || 0) - (parseFloat(b.maxSpeed) || 0)) * dir;
        if (sortField === 'ehp_ratio') {
          const ehpA = ((parseFloat(a.health) || 0) + (parseFloat(a.energyCapacity) || 0)) / Math.max(1, parseFloat(a.buildCost) || 1);
          const ehpB = ((parseFloat(b.health) || 0) + (parseFloat(b.energyCapacity) || 0)) / Math.max(1, parseFloat(b.buildCost) || 1);
          return (ehpA - ehpB) * dir;
        }
        return 0;
      });
      return sorted;
    }

    return list;
  }, [units, search, domainFilter, factionFilter, matchesDomain, datMap, viewMode, sortField, sortAsc]);

  // Update a specific XML tag or attribute on a unit
  const handleUpdateUnitXmlTag = useCallback((unitId: string, xmlTag: string, value: string) => {
    setUnits(prev =>
      prev.map((u, idx) => {
        if (u.id !== unitId) return u;

        if (xmlTag === '@Name') {
          u.node.setAttribute('Name', value);
        } else {
          let childNode = Array.from(u.node.children).find(
            c => c.tagName.toLowerCase() === xmlTag.toLowerCase()
          ) as Element | undefined;

          if (!childNode) {
            if (value.trim() === '') return u;
            childNode = doc.createElement(xmlTag);
            u.node.appendChild(childNode);
          }

          if (value.trim() === '') {
            u.node.removeChild(childNode);
          } else {
            childNode.textContent = value;
          }
        }

        const refreshed = extractUnitFromElement(u.node, idx);
        return { ...refreshed, id: u.id };
      })
    );
  }, [doc, extractUnitFromElement]);

  const handleFieldChange = (xmlTag: string, value: string) => {
    if (!selectedUnit) return;
    handleUpdateUnitXmlTag(selectedUnit.id, xmlTag, value);
  };

  // Clone Selected Unit
  const handleCloneUnit = () => {
    if (!selectedUnit || !doc.documentElement) return;
    const clonedNode = selectedUnit.node.cloneNode(true) as Element;
    const newName = `${selectedUnit.name}_Copy`;
    clonedNode.setAttribute('Name', newName);
    doc.documentElement.appendChild(clonedNode);

    const refreshed = parseAllUnitsFromDoc(doc);
    const created = refreshed[refreshed.length - 1];
    if (created) setSelectedUnitId(created.id);
    showToast(tr(lang, `Cloned as ${newName}`, `Clonada como ${newName}`, `Clonée sous ${newName}`));
  };

  // Delete Selected Unit
  const handleDeleteUnit = () => {
    if (!selectedUnit) return;
    if (selectedUnit.node.parentNode) {
      selectedUnit.node.parentNode.removeChild(selectedUnit.node);
    }
    const refreshed = parseAllUnitsFromDoc(doc);
    setSelectedUnitId(refreshed[0]?.id || null);
    showToast(tr(lang, `Deleted ${selectedUnit.name}`, `Eliminada ${selectedUnit.name}`, `Supprimée ${selectedUnit.name}`));
  };

  // Create New Unit from Preset
  const handleCreateNewUnit = () => {
    const cleanName = newUnitName.trim().replace(/\s+/g, '_') || `Custom_${newUnitTag}_${units.length + 1}`;
    const root = doc.documentElement;
    if (!root) return;

    const el = doc.createElement(newUnitTag);
    el.setAttribute('Name', cleanName);

    const addChild = (tag: string, val: string) => {
      const c = doc.createElement(tag);
      c.textContent = val;
      el.appendChild(c);
    };

    const upperId = cleanName.toUpperCase();
    addChild('Text_ID', `TEXT_UNIT_${upperId}`);
    addChild('Encyclopedia_Text', `TEXT_TOOLTIP_${upperId}`);
    addChild('Affiliation', newUnitFaction);
    addChild('Tech_Level', '1');
    addChild('Build_Cost_Credits', newUnitTag === 'SpaceUnit' ? '2500' : '600');
    addChild('Build_Time_Seconds', newUnitTag === 'SpaceUnit' ? '35' : '18');
    addChild('Tactical_Health', newUnitTag === 'SpaceUnit' ? '3000' : '800');

    if (newUnitTag === 'SpaceUnit' || newUnitTag === 'StarBase') {
      addChild('Energy_Capacity', '3500');
      addChild('Shield_Refresh_Rate', '50');
      addChild('Space_Layer', 'Frigate');
      addChild('Max_Speed', '2.0');
      addChild('Max_Rate_Of_Turn', '0.5');
      addChild('Space_FOW_Reveal_Range', '2000.0');
      addChild('CategoryMask', 'Frigate | AntiCorvette');
    } else if (newUnitTag === 'Squadron') {
      addChild('Squadron_Units', 'TIE_Fighter, TIE_Fighter, TIE_Fighter');
      addChild('Population_Value', '1');
    } else {
      addChild('Max_Speed', '1.2');
      addChild('MovementClass', newUnitTag === 'GroundInfantry' ? 'Infantry' : 'Tracked');
      addChild('Land_FOW_Reveal_Range', '350.0');
      addChild('CategoryMask', newUnitTag === 'GroundInfantry' ? 'Infantry' : 'Vehicle');
    }

    root.appendChild(el);
    const refreshed = parseAllUnitsFromDoc(doc);
    const created = refreshed[refreshed.length - 1];
    if (created) setSelectedUnitId(created.id);
    setShowNewUnitModal(false);
    setNewUnitName('');
    showToast(tr(lang, `Created <${newUnitTag} Name="${cleanName}">`, `Creada <${newUnitTag} Name="${cleanName}">`, `Créée ${cleanName}`));
  };

  // Batch Percentage Balance Adjustment across filtered units
  const handleApplyBatchPercentage = () => {
    if (filteredUnits.length === 0 || batchPercent === 0) return;
    const multiplier = 1 + batchPercent / 100;
    const filteredIds = new Set(filteredUnits.map(u => u.id));
    let updatedCount = 0;

    units.forEach(u => {
      if (!filteredIds.has(u.id)) return;
      const child = Array.from(u.node.children).find(
        c => c.tagName.toLowerCase() === batchField.toLowerCase()
      );
      if (child && child.textContent) {
        const currentVal = parseFloat(child.textContent.trim());
        if (!isNaN(currentVal) && currentVal > 0) {
          const isFloat = batchField === 'Max_Speed' || child.textContent.includes('.');
          const nextVal = isFloat
            ? Math.max(0.05, Number((currentVal * multiplier).toFixed(2)))
            : Math.max(1, Math.round(currentVal * multiplier));
          child.textContent = String(nextVal);
          updatedCount++;
        }
      }
    });

    parseAllUnitsFromDoc(doc);
    showToast(
      tr(
        lang,
        `Adjusted ${batchField} by ${batchPercent > 0 ? '+' : ''}${batchPercent}% on ${updatedCount} units`,
        `Ajustado ${batchField} un ${batchPercent > 0 ? '+' : ''}${batchPercent}% en ${updatedCount} unidades`,
        `${batchField} ajusté de ${batchPercent}% sur ${updatedCount} unités`
      )
    );
  };

  // Apply Raw Node XML edits back into the DOM
  const handleApplyRawNodeXml = () => {
    if (!selectedUnit || !selectedUnit.node.parentNode) return;
    try {
      const parser = new DOMParser();
      const parsedFrag = parser.parseFromString(rawNodeXml, 'application/xml');
      const err = parsedFrag.querySelector('parsererror');
      if (err) {
        setRawNodeError(err.textContent || 'Invalid XML syntax');
        return;
      }
      const importedNode = doc.importNode(parsedFrag.documentElement, true);
      selectedUnit.node.parentNode.replaceChild(importedNode, selectedUnit.node);
      const refreshed = parseAllUnitsFromDoc(doc);
      const match = refreshed.find(u => u.node === importedNode) || refreshed[0];
      if (match) setSelectedUnitId(match.id);
      setRawNodeError(null);
      showToast(tr(lang, 'Unit XML node updated', 'Nodo XML de la unidad actualizado', 'Nœud XML mis à jour'));
    } catch (e: any) {
      setRawNodeError(e.message || 'Error parsing node XML');
    }
  };

  // Upload another Unit XML from disk
  const handleUploadUnitXmlFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(content, 'application/xml');
        if (parsedDoc.querySelector('parsererror')) {
          onError('Invalid XML structure');
          return;
        }
        setDoc(parsedDoc);
        setEditableFileName(file.name);
        const list = parseAllUnitsFromDoc(parsedDoc);
        setSelectedUnitId(list[0]?.id || null);
        showToast(tr(lang, `Loaded ${file.name} (${list.length} units)`, `Cargado ${file.name} (${list.length} unidades)`, `Chargé ${file.name}`));
      } catch (err: any) {
        onError(err.message || 'Error reading XML');
      }
    };
    reader.readAsText(file);
    if (uploadXmlInputRef.current) uploadXmlInputRef.current.value = '';
  };

  // Save full XML document
  const handleSave = () => {
    try {
      const formatted = '<?xml version="1.0" encoding="utf-8"?>\n' + formatXmlNode(doc.documentElement);
      const blob = new Blob([formatted], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      let outName = editableFileName.trim() || 'Units.xml';
      if (!outName.toLowerCase().endsWith('.xml')) outName += '.xml';

      if (fileDownloadAnchorRef.current) {
        fileDownloadAnchorRef.current.href = url;
        fileDownloadAnchorRef.current.download = outName;
        fileDownloadAnchorRef.current.click();
      }
      URL.revokeObjectURL(url);
      showToast(tr(lang, `Saved ${outName}`, `Guardado ${outName}`, `Enregistré ${outName}`));
    } catch (err: any) {
      onError(err.message || 'Failed to save file.');
    }
  };

  // Parsed HardPoints list for selected unit
  const parsedHardPointsList = useMemo(() => {
    if (!selectedUnit || !selectedUnit.hardPoints) return [];
    return selectedUnit.hardPoints
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [selectedUnit]);

  const handleAddHardPoint = () => {
    if (!selectedUnit || !newHardPointInput.trim()) return;
    const updated = [...parsedHardPointsList, newHardPointInput.trim()].join(',\n      ');
    handleFieldChange('HardPoints', updated);
    setNewHardPointInput('');
  };

  const handleRemoveHardPoint = (hpToRemove: string) => {
    if (!selectedUnit) return;
    const updated = parsedHardPointsList.filter(hp => hp !== hpToRemove).join(',\n      ');
    handleFieldChange('HardPoints', updated);
  };

  // All direct child XML elements of selectedUnit for the "All Tags" tab
  const allDirectChildTags = useMemo(() => {
    if (!selectedUnit) return [];
    return Array.from(selectedUnit.node.children).map((el, index) => ({
      index,
      tagName: el.tagName,
      value: el.textContent || ''
    }));
  }, [selectedUnit]);

  // Effective Health & Efficiency metrics for Selected Unit
  const combatMetrics = useMemo(() => {
    if (!selectedUnit) return { hull: 0, shields: 0, ehp: 0, cost: 0, ehpPerCredit: '0.00', rechargeTime: '0s' };
    const hull = parseFloat(selectedUnit.health) || 0;
    const shields = parseFloat(selectedUnit.energyCapacity) || 0;
    const ehp = hull + shields;
    const cost = parseFloat(selectedUnit.buildCost) || 0;
    const refresh = parseFloat(selectedUnit.shieldRefresh) || 0;
    const ehpPerCredit = cost > 0 ? (ehp / cost).toFixed(2) : '—';
    const rechargeTime = shields > 0 && refresh > 0 ? `${Math.round(shields / refresh)}s` : '—';
    return { hull, shields, ehp, cost, ehpPerCredit, rechargeTime };
  }, [selectedUnit]);

  // Tactical 1v1 Time-To-Kill (TTK) Combat Simulator (v1.4)
  const ttkSimulation = useMemo(() => {
    if (!selectedUnit || !versusUnitB) return null;

    const hpDpsMap = new Map<string, { shieldDps: number; hullDps: number }>();
    if (hardPointsDoc?.documentElement) {
      const projDamageMap = new Map<string, { hull: number; shield: number }>();
      Array.from(hardPointsDoc.documentElement.children).forEach((el) => {
        if (el.tagName.toLowerCase() === 'projectile') {
          const pName = (el.getAttribute('Name') || '').trim().toLowerCase();
          const dmgEl = Array.from(el.children).find((c) => c.tagName.toLowerCase() === 'projectile_damage');
          const shdEl = Array.from(el.children).find((c) => c.tagName.toLowerCase() === 'projectile_shield_damage');
          const hull = parseFloat(dmgEl?.textContent || '35') || 35;
          const shield = parseFloat(shdEl?.textContent || String(hull)) || hull;
          if (pName) projDamageMap.set(pName, { hull, shield });
        }
      });

      Array.from(hardPointsDoc.documentElement.children).forEach((el) => {
        if (el.tagName.toLowerCase() === 'hardpoint') {
          const hpName = (el.getAttribute('Name') || '').trim().toLowerCase();
          const getVal = (t: string) =>
            Array.from(el.children)
              .find((c) => c.tagName.toLowerCase() === t.toLowerCase())
              ?.textContent?.trim() || '';
          const hpType = getVal('Type');
          if (!hpType.includes('WEAPON')) return;
          const pulses = Math.max(1, parseFloat(getVal('Fire_Pulse_Count')) || 2);
          const delay = Math.max(0.05, parseFloat(getVal('Fire_Pulse_Delay_Seconds')) || 0.25);
          const minR = Math.max(0.5, parseFloat(getVal('Fire_Min_Recharge_Seconds')) || 3.5);
          const maxR = Math.max(minR, parseFloat(getVal('Fire_Max_Recharge_Seconds')) || minR);
          const cycle = (minR + maxR) / 2 + Math.max(0, pulses - 1) * delay;
          const projName = getVal('Fire_Projectile_Type').toLowerCase();
          const projStats = projDamageMap.get(projName) || {
            hull: hpType.includes('ION') ? 10 : 42,
            shield: hpType.includes('ION') ? 95 : 42
          };
          hpDpsMap.set(hpName, {
            hullDps: (pulses * projStats.hull) / cycle,
            shieldDps: (pulses * projStats.shield) / cycle
          });
        }
      });
    }

    const computeUnitDps = (u: UnitData) => {
      const hps = u.hardPoints
        ? u.hardPoints
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      let shieldDps = 0;
      let hullDps = 0;
      let resolvedCount = 0;

      hps.forEach((hp) => {
        const match = hpDpsMap.get(hp.toLowerCase());
        if (match) {
          shieldDps += match.shieldDps;
          hullDps += match.hullDps;
          resolvedCount++;
        } else if (/weapon|laser|turbo|ion|torp|missile/i.test(hp)) {
          const isIon = /ion/i.test(hp);
          shieldDps += isIon ? 48 : 30;
          hullDps += isIon ? 8 : 30;
        }
      });

      const baseDamageRating = parseFloat(u.damageRating) || 25;
      if (shieldDps === 0 && hullDps === 0) {
        const pulses = Math.max(1, parseFloat(u.firePulseCount) || 2);
        const rech = Math.max(1, parseFloat(u.fireRecharge) || 3.0);
        const est = Math.max(12, (baseDamageRating * pulses) / rech);
        shieldDps = est;
        hullDps = est;
      }

      return {
        shieldDps: Math.round(shieldDps),
        hullDps: Math.round(hullDps),
        resolvedCount
      };
    };

    const dpsA = computeUnitDps(selectedUnit);
    const dpsB = computeUnitDps(versusUnitB);

    const calcTimeToKill = (attackerDps: { shieldDps: number; hullDps: number }, defender: UnitData) => {
      const defShields = parseFloat(defender.energyCapacity || defender.shields) || 0;
      const defRegen = (parseFloat(defender.shieldRefresh) || 0) * 0.25;
      const defHull = Math.max(1, parseFloat(defender.health) || 500);

      const netShieldDps = Math.max(5, attackerDps.shieldDps - defRegen);
      const shieldBreakSec = defShields > 0 ? defShields / netShieldDps : 0;
      const hullBreakSec = defHull / Math.max(5, attackerDps.hullDps);
      const totalSec = shieldBreakSec + hullBreakSec;

      return {
        shieldBreakSec: Number(shieldBreakSec.toFixed(1)),
        hullBreakSec: Number(hullBreakSec.toFixed(1)),
        totalSec: Number(totalSec.toFixed(1))
      };
    };

    const aKillsB = calcTimeToKill(dpsA, versusUnitB);
    const bKillsA = calcTimeToKill(dpsB, selectedUnit);

    const winner =
      aKillsB.totalSec < bKillsA.totalSec
        ? 'A'
        : bKillsA.totalSec < aKillsB.totalSec
        ? 'B'
        : 'TIE';

    const survivorHullPct =
      winner === 'A'
        ? Math.max(1, Math.min(99, Math.round((1 - aKillsB.totalSec / Math.max(1, bKillsA.totalSec)) * 100)))
        : winner === 'B'
        ? Math.max(1, Math.min(99, Math.round((1 - bKillsA.totalSec / Math.max(1, aKillsB.totalSec)) * 100)))
        : 0;

    return { dpsA, dpsB, aKillsB, bKillsA, winner, survivorHullPct };
  }, [selectedUnit, versusUnitB, hardPointsDoc]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-none">
      <input
        ref={uploadXmlInputRef}
        type="file"
        accept=".xml"
        className="hidden"
        onChange={handleUploadUnitXmlFile}
      />

      {/* Top Command Bar — Unified Tactical HUD (v1.2) */}
      <div className="min-h-14 py-2 bg-slate-900/80 backdrop-blur-md border-b border-emerald-900/40 px-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left Block: 2-Row Metadata & File Selector */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)] shrink-0">
            <Crosshair className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            {/* Row 1: Title + v1.3 Badge + Counts */}
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-emerald-300 font-bold uppercase tracking-widest text-xs font-mono">
                {tr(lang, 'Alamo Unit & Roster Editor', 'Editor de Unidades y Flotas', 'Éditeur d\'Unités & Flottes')}
              </h2>
              <span className="px-1.5 py-0.5 rounded-sm bg-emerald-950/90 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                v1.4
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {units.length} {tr(lang, 'units', 'unidades', 'unités')} · {availableFactions.length} {tr(lang, 'factions', 'facciones', 'factions')}
              </span>
            </div>

            {/* Row 2: Editable Filename + Workspace XML Switcher + .DAT Indicator */}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <input
                type="text"
                value={editableFileName}
                onChange={(e) => setEditableFileName(e.target.value)}
                className="bg-slate-950/90 border border-slate-800 focus:border-emerald-500/60 rounded-sm px-2 py-0.5 text-[11px] font-mono text-cyan-200 outline-none w-52"
                title={tr(lang, 'Output XML filename', 'Nombre del archivo XML de salida', 'Nom du fichier XML')}
              />

              {workspaceUnitXmlFiles.length > 0 && onSelectWorkspaceUnit && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectWorkspaceUnit(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-950 border border-emerald-800/50 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-sm outline-none cursor-pointer focus:border-emerald-500 max-w-[210px]"
                >
                  <option value="">
                    {tr(lang, `Workspace XML (${workspaceUnitXmlFiles.length})`, `Cambiar XML del Workspace (${workspaceUnitXmlFiles.length})`, `Workspace XML (${workspaceUnitXmlFiles.length})`)}
                  </option>
                  {workspaceUnitXmlFiles.map((f, i) => (
                    <option key={i} value={f.webkitRelativePath || f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}

              {datRecords && (
                <span className="px-1.5 py-0.5 rounded-sm bg-purple-950/70 border border-purple-700/40 text-[9px] font-mono text-purple-300">
                  .DAT LINKED ({datRecords.length})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Toolbar: Anchored to Right Margin (ml-auto) */}
        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
          {/* View Mode Segmented Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm p-0.5 mr-1">
            <button
              onClick={() => setViewMode('inspector')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'inspector'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>{tr(lang, 'Inspector', 'Inspector', 'Inspecteur')}</span>
            </button>
            <button
              onClick={() => setViewMode('versus')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'versus'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{tr(lang, 'Versus 1v1', 'Versus 1v1', 'Versus 1v1')}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>{tr(lang, 'Compare Table', 'Tabla Balance', 'Tableau')}</span>
            </button>
            <button
              onClick={() => setViewMode('raw_xml')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'raw_xml'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>XML</span>
            </button>
          </div>

          {/* Batch Balance % Scaler */}
          <button
            onClick={() => setShowBatchBalance(!showBatchBalance)}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all cursor-pointer ${
              showBatchBalance
                ? 'border-amber-500/60 bg-amber-950/50 text-amber-300'
                : 'border-slate-700/70 hover:bg-slate-800 text-slate-300'
            }`}
            title={tr(lang, 'Batch Scale Stats by Percentage (%)', 'Ajustar Estadísticas en Lote por Porcentaje (%)', 'Ajustement en lot (%)')}
          >
            <Percent className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{tr(lang, 'Batch %', 'Balance %', 'Lot %')}</span>
          </button>

          {/* New Unit Button */}
          <button
            onClick={() => setShowNewUnitModal(true)}
            className="px-2.5 py-1.5 border border-emerald-500/50 hover:bg-emerald-900/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{tr(lang, 'New Unit', 'Nueva Unidad', 'Nouvelle Unité')}</span>
          </button>

          {/* Upload XML */}
          <button
            onClick={() => uploadXmlInputRef.current?.click()}
            className="p-1.5 border border-slate-700/70 hover:bg-slate-800 text-slate-300 rounded-sm transition-colors cursor-pointer"
            title={tr(lang, 'Load another Units XML from disk', 'Cargar otro archivo XML de unidades del disco', 'Charger un fichier XML')}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Save XML */}
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-[11px] uppercase tracking-widest transition-all flex items-center space-x-1.5 rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Save XML', 'Guardar XML', 'Enregistrer XML')}</span>
          </button>

          {/* Close Button anchored to right edge */}
          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={tr(lang, 'Close', 'Cerrar', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Batch Balance Percentage Drawer */}
      {showBatchBalance && (
        <div className="border-b border-amber-900/50 bg-slate-900/95 px-5 py-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>{tr(lang, 'Batch Roster Balance Scaler (%)', 'Ajuste Masivo de Balance por Porcentaje (%)', 'Ajustement d\'Équilibrage en Lot (%)')}</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {tr(
                  lang,
                  `Applies to the ${filteredUnits.length} currently filtered units (filter by Faction or Category first to target a specific group).`,
                  `Se aplicará sobre las ${filteredUnits.length} unidades actualmente filtradas (puedes filtrar antes por Facción o Categoría).`,
                  `S'applique aux ${filteredUnits.length} unités filtrées.`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={batchField}
                onChange={(e) => setBatchField(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-amber-200 font-mono text-xs px-2.5 py-1.5 rounded-sm outline-none"
              >
                <option value="Build_Cost_Credits">Build_Cost_Credits (Coste Créditos)</option>
                <option value="Build_Time_Seconds">Build_Time_Seconds (Tiempo Segundos)</option>
                <option value="Tactical_Health">Tactical_Health (Casco / Vida)</option>
                <option value="Energy_Capacity">Energy_Capacity (Escudos)</option>
                <option value="Max_Speed">Max_Speed (Velocidad Máx.)</option>
              </select>

              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm px-2 py-1">
                <button
                  onClick={() => setBatchPercent(-20)}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-rose-400 hover:bg-slate-800 rounded-sm cursor-pointer"
                >
                  -20%
                </button>
                <button
                  onClick={() => setBatchPercent(-10)}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-amber-400 hover:bg-slate-800 rounded-sm cursor-pointer"
                >
                  -10%
                </button>
                <input
                  type="number"
                  value={batchPercent}
                  onChange={(e) => setBatchPercent(Number(e.target.value))}
                  className="w-16 bg-transparent text-center font-mono text-xs text-slate-100 outline-none"
                />
                <span className="text-xs font-mono text-slate-400 mr-1">%</span>
                <button
                  onClick={() => setBatchPercent(10)}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 hover:bg-slate-800 rounded-sm cursor-pointer"
                >
                  +10%
                </button>
                <button
                  onClick={() => setBatchPercent(20)}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 hover:bg-slate-800 rounded-sm cursor-pointer"
                >
                  +20%
                </button>
              </div>

              <button
                onClick={handleApplyBatchPercentage}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer"
              >
                {tr(lang, `Apply (${batchPercent > 0 ? '+' : ''}${batchPercent}%)`, `Aplicar (${batchPercent > 0 ? '+' : ''}${batchPercent}%)`, `Appliquer (${batchPercent}%)`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel - Unit Roster Explorer */}
        <div className="w-84 bg-slate-900/50 border-r border-emerald-900/30 flex flex-col shrink-0">
          {/* Domain Tabs */}
          <div className="p-2 border-b border-slate-900 bg-slate-950/70 flex flex-wrap gap-1">
            {[
              { id: 'all', label: tr(lang, 'All', 'Todas', 'Toutes') },
              { id: 'space', label: tr(lang, 'Space', 'Naves', 'Espace') },
              { id: 'squadron', label: tr(lang, 'Squadrons', 'Escuadr.', 'Escadrons') },
              { id: 'ground', label: tr(lang, 'Ground', 'Tierra', 'Sol') },
              { id: 'hero', label: tr(lang, 'Heroes', 'Héroes', 'Héros') },
              { id: 'structure', label: tr(lang, 'Bases', 'Bases', 'Bases') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDomainFilter(tab.id as DomainFilter)}
                className={`px-2 py-1 text-[9px] font-mono uppercase rounded-sm transition-colors cursor-pointer ${
                  domainFilter === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Faction Filter */}
          <div className="p-2.5 border-b border-emerald-900/30 bg-slate-950/60 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder={tr(lang, 'Search Name, Text_ID, Category...', 'Buscar nombre, traducción, categoría...', 'Rechercher...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 transition-colors text-slate-200 text-xs font-mono pl-8 pr-6 py-1 rounded-sm outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={factionFilter}
                onChange={(e) => setFactionFilter(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[10px] px-2 py-1 rounded-sm outline-none cursor-pointer"
              >
                <option value="all">{tr(lang, 'All Factions', 'Todas las Facciones', 'Toutes les Factions')}</option>
                {availableFactions.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                {filteredUnits.length}/{units.length}
              </span>
            </div>
          </div>

          {/* Roster List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredUnits.map(u => {
              const translatedName = u.textId ? datMap.get(u.textId.toUpperCase()) : null;
              const isSelected = selectedUnitId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUnitId(u.id)}
                  className={`w-full text-left p-2.5 rounded-sm flex flex-col gap-1 transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/45 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-950/40 border-slate-800/70 text-slate-300 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono font-bold text-xs truncate text-emerald-300">{u.name}</span>
                    {u.techLevel && (
                      <span className="text-[9px] font-mono text-amber-400 shrink-0">
                        T{u.techLevel}
                      </span>
                    )}
                  </div>

                  {translatedName && (
                    <span className="text-[11px] text-purple-300 font-sans truncate">
                      {translatedName}
                    </span>
                  )}

                  <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-slate-500">
                      {u.tagName} · <span className="text-cyan-400/90">{u.affiliation || 'Neutral'}</span>
                    </span>
                    <span className="tabular-nums text-amber-300/90">
                      {u.buildCost ? `${u.buildCost} cr` : ''}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredUnits.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs font-mono">
                {tr(lang, 'No units matched your filter.', 'Ninguna unidad coincide con el filtro.', 'Aucune unité trouvée.')}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Either Table View, Raw XML View, or 6-Tab Visual Inspector */}
        <div className="flex-1 bg-slate-950/80 flex flex-col relative overflow-hidden">
          {viewMode === 'table' ? (
            /* TABLE COMPARATIVE VIEW */
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                    {tr(lang, 'Interactive Roster Balance Spreadsheet', 'Hoja de Balance Comparativo en Vivo', 'Tableau Comparatif d\'Équilibrage')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tr(
                      lang,
                      'Click any column header to sort, or edit numerical balance cells directly in place.',
                      'Haz clic en cualquier cabecera de columna para ordenar, o edita cualquier celda numérica directamente en la tabla.',
                      'Cliquez sur une colonne pour trier ou modifiez directement les valeurs.'
                    )}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {filteredUnits.length} {tr(lang, 'units displayed', 'unidades mostradas', 'unités affichées')}
                </span>
              </div>

              <div className="flex-1 overflow-auto border border-slate-800 rounded-sm bg-slate-900/40">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                    <tr>
                      {[
                        { id: 'name', label: tr(lang, 'Unit Name', 'Unidad', 'Unité') },
                        { id: 'affiliation', label: tr(lang, 'Faction', 'Facción', 'Faction') },
                        { id: 'tech', label: 'Tech' },
                        { id: 'cost', label: tr(lang, 'Cost (Cr)', 'Coste (Cr)', 'Coût') },
                        { id: 'time', label: tr(lang, 'Time (s)', 'Tiempo (s)', 'Temps') },
                        { id: 'health', label: tr(lang, 'Hull (HP)', 'Casco (HP)', 'Coque') },
                        { id: 'shields', label: tr(lang, 'Shields', 'Escudos', 'Boucliers') },
                        { id: 'speed', label: tr(lang, 'Speed', 'Velocidad', 'Vitesse') },
                        { id: 'ehp_ratio', label: 'EHP / Cr' }
                      ].map(col => (
                        <th
                          key={col.id}
                          onClick={() => {
                            if (sortField === col.id) setSortAsc(!sortAsc);
                            else {
                              setSortField(col.id as SortField);
                              setSortAsc(true);
                            }
                          }}
                          className="p-2.5 cursor-pointer hover:text-cyan-300 select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>{col.label}</span>
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredUnits.map(u => {
                      const ehp = (parseFloat(u.health) || 0) + (parseFloat(u.energyCapacity) || 0);
                      const cost = parseFloat(u.buildCost) || 0;
                      const ratio = cost > 0 ? (ehp / cost).toFixed(2) : '—';
                      const loc = u.textId ? datMap.get(u.textId.toUpperCase()) : null;

                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUnitId(u.id)}
                          className={`hover:bg-slate-900/80 transition-colors ${
                            selectedUnitId === u.id ? 'bg-emerald-950/30' : ''
                          }`}
                        >
                          <td className="p-2 max-w-[220px]">
                            <div className="font-bold text-emerald-300 truncate">{u.name}</div>
                            {loc && <div className="text-[10px] text-purple-300 font-sans truncate">{loc}</div>}
                          </td>
                          <td className="p-2 text-cyan-300 text-[11px]">{u.affiliation || '—'}</td>
                          <td className="p-1.5 w-16">
                            <input
                              type="number"
                              value={u.techLevel}
                              onChange={e => handleUpdateUnitXmlTag(u.id, 'Tech_Level', e.target.value)}
                              className="w-14 bg-slate-950 border border-slate-800 focus:border-emerald-500 px-1.5 py-1 rounded-sm text-amber-300 tabular-nums outline-none"
                            />
                          </td>
                          <td className="p-1.5 w-24">
                            <input
                              type="number"
                              value={u.buildCost}
                              onChange={e => handleUpdateUnitXmlTag(u.id, 'Build_Cost_Credits', e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 focus:border-emerald-500 px-1.5 py-1 rounded-sm text-amber-200 tabular-nums outline-none"
                            />
                          </td>
                          <td className="p-1.5 w-20">
                            <input
                              type="number"
                              value={u.buildTime}
                              onChange={e => handleUpdateUnitXmlTag(u.id, 'Build_Time_Seconds', e.target.value)}
                              className="w-16 bg-slate-950 border border-slate-800 focus:border-emerald-500 px-1.5 py-1 rounded-sm text-slate-200 tabular-nums outline-none"
                            />
                          </td>
                          <td className="p-1.5 w-24">
                            <input
                              type="number"
                              value={u.health}
                              onChange={e => handleUpdateUnitXmlTag(u.id, 'Tactical_Health', e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 focus:border-emerald-500 px-1.5 py-1 rounded-sm text-cyan-200 tabular-nums outline-none"
                            />
                          </td>
                          <td className="p-1.5 w-24">
                            <input
                              type="number"
                              value={u.energyCapacity}
                              onChange={e => handleUpdateUnitXmlTag(u.id, 'Energy_Capacity', e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 focus:border-emerald-500 px-1.5 py-1 rounded-sm text-indigo-300 tabular-nums outline-none"
                            />
                          </td>
                          <td className="p-1.5 w-20">
                            <input
                              type="number"
                              step="0.1"
                              value={u.maxSpeed}
                              onChange={e => handleUpdateUnitXmlTag(u.id, 'Max_Speed', e.target.value)}
                              className="w-16 bg-slate-950 border border-slate-800 focus:border-emerald-500 px-1.5 py-1 rounded-sm text-emerald-200 tabular-nums outline-none"
                            />
                          </td>
                          <td className="p-2 text-slate-400 tabular-nums">{ratio}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewMode === 'versus' && selectedUnit && versusUnitB ? (
            /* SIDE-BY-SIDE VERSUS 1V1 COMPARATOR VIEW (v1.3) */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold block">
                    {tr(lang, 'Tactical Unit Matchup & TTK Duel Simulator (v1.4)', 'Comparador Táctico y Simulador de Duelo TTK 1v1 (v1.4)', 'Comparateur Tactique & Simulateur TTK 1v1 (v1.4)')}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                    {selectedUnit.name} <span className="text-purple-400 px-2">VS</span> {versusUnitB.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[9px] text-emerald-400 uppercase block mb-0.5">
                      {tr(lang, 'Unit A (Selected)', 'Unidad A (Seleccionada)', 'Unité A')}
                    </label>
                    <select
                      value={selectedUnit.id}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="bg-slate-900 border border-emerald-700/60 text-emerald-300 text-xs px-2.5 py-1.5 rounded-sm outline-none"
                    >
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.affiliation || 'Neutral'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-cyan-400 uppercase block mb-0.5">
                      {tr(lang, 'Unit B (Opponent)', 'Unidad B (Oponente)', 'Unité B')}
                    </label>
                    <select
                      value={versusUnitB.id}
                      onChange={(e) => setVersusUnitBId(e.target.value)}
                      className="bg-slate-900 border border-cyan-700/60 text-cyan-300 text-xs px-2.5 py-1.5 rounded-sm outline-none"
                    >
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.affiliation || 'Neutral'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Comparative Bars Grid */}
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-sm space-y-4">
                {[
                  {
                    label: tr(lang, 'Total Effective Health (Hull + Shields)', 'Salud Efectiva Total (Casco + Escudos)', 'Santé Effective Totale (EHP)'),
                    valA: (parseFloat(selectedUnit.health) || 0) + (parseFloat(selectedUnit.energyCapacity || selectedUnit.shields) || 0),
                    valB: (parseFloat(versusUnitB.health) || 0) + (parseFloat(versusUnitB.energyCapacity || versusUnitB.shields) || 0),
                    unit: 'EHP',
                    higherIsBetter: true
                  },
                  {
                    label: tr(lang, 'Tactical Hull Health', 'Salud del Casco (Tactical_Health)', 'Santé Coque'),
                    valA: parseFloat(selectedUnit.health) || 0,
                    valB: parseFloat(versusUnitB.health) || 0,
                    unit: 'HP',
                    higherIsBetter: true
                  },
                  {
                    label: tr(lang, 'Shield Capacity', 'Capacidad de Escudos', 'Boucliers'),
                    valA: parseFloat(selectedUnit.energyCapacity || selectedUnit.shields) || 0,
                    valB: parseFloat(versusUnitB.energyCapacity || versusUnitB.shields) || 0,
                    unit: 'SHD',
                    higherIsBetter: true
                  },
                  {
                    label: tr(lang, 'Build Cost (Credits)', 'Coste de Construcción (Créditos)', 'Coût de Construction'),
                    valA: parseFloat(selectedUnit.buildCost) || 0,
                    valB: parseFloat(versusUnitB.buildCost) || 0,
                    unit: 'cr',
                    higherIsBetter: false
                  },
                  {
                    label: tr(lang, 'Build Time (Seconds)', 'Tiempo de Producción (Segundos)', 'Temps de Production'),
                    valA: parseFloat(selectedUnit.buildTime) || 0,
                    valB: parseFloat(versusUnitB.buildTime) || 0,
                    unit: 's',
                    higherIsBetter: false
                  },
                  {
                    label: tr(lang, 'Max Tactical Speed', 'Velocidad Táctica Máxima (Max_Speed)', 'Vitesse Maximale'),
                    valA: parseFloat(selectedUnit.maxSpeed) || 0,
                    valB: parseFloat(versusUnitB.maxSpeed) || 0,
                    unit: 'u/s',
                    higherIsBetter: true
                  },
                  {
                    label: tr(lang, 'Max Attack Range', 'Alcance Máximo de Disparo', 'Portée d\'Attaque'),
                    valA: parseFloat(selectedUnit.maxAttackDistance) || 0,
                    valB: parseFloat(versusUnitB.maxAttackDistance) || 0,
                    unit: 'u',
                    higherIsBetter: true
                  },
                  {
                    label: tr(lang, 'Attached HardPoints Count', 'Número de Subsistemas (HardPoints)', 'Nombre de HardPoints'),
                    valA: selectedUnit.hardPoints ? selectedUnit.hardPoints.split(/[\n,]+/).filter(s => s.trim()).length : 0,
                    valB: versusUnitB.hardPoints ? versusUnitB.hardPoints.split(/[\n,]+/).filter(s => s.trim()).length : 0,
                    unit: 'HP',
                    higherIsBetter: true
                  }
                ].map((metric, idx) => {
                  const maxVal = Math.max(metric.valA, metric.valB, 1);
                  const pctA = Math.min(100, (metric.valA / maxVal) * 100);
                  const pctB = Math.min(100, (metric.valB / maxVal) * 100);
                  const diffPct = metric.valB > 0 ? ((metric.valA - metric.valB) / metric.valB) * 100 : 0;
                  const aWins = metric.higherIsBetter ? metric.valA > metric.valB : (metric.valA > 0 && metric.valA < metric.valB);
                  const bWins = metric.higherIsBetter ? metric.valB > metric.valA : (metric.valB > 0 && metric.valB < metric.valA);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`tabular-nums font-bold ${aWins ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {metric.valA} {metric.unit}
                          {metric.valB > 0 && metric.valA !== metric.valB && (
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({diffPct > 0 ? `+${diffPct.toFixed(0)}%` : `${diffPct.toFixed(0)}%`})
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                          {metric.label}
                        </span>
                        <span className={`tabular-nums font-bold ${bWins ? 'text-cyan-400' : 'text-slate-300'}`}>
                          {metric.valB} {metric.unit}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 h-2.5">
                        <div className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden flex justify-end">
                          <div
                            className={`h-full transition-all ${aWins ? 'bg-emerald-500' : 'bg-emerald-800/70'}`}
                            style={{ width: `${pctA}%` }}
                          />
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden">
                          <div
                            className={`h-full transition-all ${bWins ? 'bg-cyan-400' : 'bg-cyan-800/70'}`}
                            style={{ width: `${pctB}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Side-by-Side HardPoints Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { unit: selectedUnit, accent: 'border-emerald-800/50 text-emerald-300' },
                  { unit: versusUnitB, accent: 'border-cyan-800/50 text-cyan-300' }
                ].map(({ unit, accent }, idx) => {
                  const hps = unit.hardPoints
                    ? unit.hardPoints.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <div key={idx} className={`bg-slate-900/50 border ${accent} p-4 rounded-sm space-y-2`}>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold uppercase">{unit.name} // HardPoints ({hps.length})</span>
                        <span className="text-[10px] text-slate-400">{unit.armorType || 'Standard Armor'}</span>
                      </div>
                      {hps.length === 0 ? (
                        <div className="text-[11px] text-slate-500 py-2">
                          {tr(lang, 'No HardPoints assigned', 'Sin HardPoints asignados', 'Aucun HardPoint')}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {hps.map((hp, i) => (
                            <button
                              key={i}
                              onClick={() => onOpenHardPointEditor && onOpenHardPointEditor(hp)}
                              className="px-2 py-0.5 bg-slate-950 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/50 text-[10px] text-slate-300 hover:text-rose-200 rounded-sm cursor-pointer transition-colors"
                              title={tr(lang, 'Click to inspect in HardPoints Editor v1.1', 'Clic para abrir en Editor de HardPoints v1.1', 'Inspecter dans HardPoints v1.1')}
                            >
                              {hp} ↗
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tactical 1v1 Time-To-Kill (TTK) Combat Simulation Panel (v1.4) */}
              {ttkSimulation && (
                <div className="bg-slate-900/70 border border-rose-500/40 p-5 rounded-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold block">
                        {tr(
                          lang,
                          '1v1 Time-To-Kill (TTK) Combat Telemetry',
                          'Simulación de Combate Directo Time-To-Kill (TTK 1v1)',
                          'Simulation de Combat Time-To-Kill (TTK 1v1)'
                        )}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tr(
                          lang,
                          'Calculates sustained Shield & Hull DPS across mounted HardPoints to estimate time until shield collapse and hull destruction.',
                          'Calcula el DPS sostenido contra escudos y casco sumando sus HardPoints para estimar el tiempo exacto hasta destruir al oponente.',
                          'Calcule le DPS soutenu contre les boucliers et la coque pour estimer le temps de destruction.'
                        )}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-sm text-xs">
                      {ttkSimulation.winner === 'A' ? (
                        <span className="text-emerald-400 font-bold">
                          ★ {selectedUnit.name} {tr(lang, 'WINS', 'GANA EN', 'GAGNE EN')} {ttkSimulation.aKillsB.totalSec}s ({ttkSimulation.survivorHullPct}% HP {tr(lang, 'left', 'restante', 'restant')})
                        </span>
                      ) : ttkSimulation.winner === 'B' ? (
                        <span className="text-cyan-400 font-bold">
                          ★ {versusUnitB.name} {tr(lang, 'WINS', 'GANA EN', 'GAGNE EN')} {ttkSimulation.bKillsA.totalSec}s ({ttkSimulation.survivorHullPct}% HP {tr(lang, 'left', 'restante', 'restant')})
                        </span>
                      ) : (
                        <span className="text-amber-300 font-bold">
                          {tr(lang, 'MUTUAL DESTRUCTION (DRAW)', 'EMPATE TÉCNICO', 'ÉGALITÉ')} ({ttkSimulation.aKillsB.totalSec}s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs tabular-nums">
                    <div className="bg-slate-950 border border-emerald-900/50 p-3.5 rounded-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300">{selectedUnit.name} → {versusUnitB.name}</span>
                        <span className="text-amber-300 font-bold">TTK: {ttkSimulation.aKillsB.totalSec}s</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>Shield DPS: <strong className="text-cyan-300">{ttkSimulation.dpsA.shieldDps}/s</strong></div>
                        <div>Hull DPS: <strong className="text-rose-300">{ttkSimulation.dpsA.hullDps}/s</strong></div>
                        <div>{tr(lang, 'Strip Shields:', 'Caída Escudos:', 'Chute Boucliers:')} <strong className="text-slate-200">{ttkSimulation.aKillsB.shieldBreakSec}s</strong></div>
                        <div>{tr(lang, 'Destroy Hull:', 'Romper Casco:', 'Destruction Coque:')} <strong className="text-slate-200">{ttkSimulation.aKillsB.hullBreakSec}s</strong></div>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-cyan-900/50 p-3.5 rounded-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{versusUnitB.name} → {selectedUnit.name}</span>
                        <span className="text-amber-300 font-bold">TTK: {ttkSimulation.bKillsA.totalSec}s</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>Shield DPS: <strong className="text-cyan-300">{ttkSimulation.dpsB.shieldDps}/s</strong></div>
                        <div>Hull DPS: <strong className="text-rose-300">{ttkSimulation.dpsB.hullDps}/s</strong></div>
                        <div>{tr(lang, 'Strip Shields:', 'Caída Escudos:', 'Chute Boucliers:')} <strong className="text-slate-200">{ttkSimulation.bKillsA.shieldBreakSec}s</strong></div>
                        <div>{tr(lang, 'Destroy Hull:', 'Romper Casco:', 'Destruction Coque:')} <strong className="text-slate-200">{ttkSimulation.bKillsA.hullBreakSec}s</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedUnit && viewMode === 'raw_xml' ? (
            /* RAW NODE XML EDITOR VIEW */
            <div className="flex-1 flex flex-col p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase text-amber-300">
                    &lt;{selectedUnit.tagName} Name=&quot;{selectedUnit.name}&quot;&gt;
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tr(
                      lang,
                      'Edit the complete XML DOM node for this unit directly and click Apply Node Changes.',
                      'Edita directamente el nodo XML completo de esta unidad y pulsa Aplicar Cambios al Nodo.',
                      'Modifiez directement le nœud XML de cette unité.'
                    )}
                  </p>
                </div>
                <button
                  onClick={handleApplyRawNodeXml}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer"
                >
                  {tr(lang, 'Apply Node XML', 'Aplicar Cambios al Nodo', 'Appliquer le XML')}
                </button>
              </div>

              {rawNodeError && (
                <div className="mb-2 p-2.5 bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-mono rounded-sm">
                  {rawNodeError}
                </div>
              )}

              <textarea
                value={rawNodeXml}
                onChange={(e) => setRawNodeXml(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-slate-950 border border-slate-800 focus:border-amber-500 p-4 rounded-sm font-mono text-xs text-amber-100 leading-relaxed outline-none resize-none"
              />
            </div>
          ) : selectedUnit ? (
            /* 6-TAB VISUAL UNIT INSPECTOR */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selected Unit Hero Summary Header */}
              <div className="bg-slate-900/70 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-base font-mono font-bold tracking-wider uppercase text-emerald-400">
                      {selectedUnit.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      · &lt;{selectedUnit.tagName}&gt;
                    </span>
                    {selectedUnit.variantOf && (
                      <span className="text-[11px] font-mono text-amber-300">
                        · {tr(lang, 'Inherits:', 'Hereda de:', 'Hérite de:')} {selectedUnit.variantOf}
                      </span>
                    )}
                  </div>
                  {selectedUnit.textId && datMap.get(selectedUnit.textId.toUpperCase()) && (
                    <div className="text-xs text-purple-300 font-sans mt-0.5">
                      {datMap.get(selectedUnit.textId.toUpperCase())}
                    </div>
                  )}
                </div>

                {/* Live Combat & Cost Summary Bar + Clone/Delete Actions */}
                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex items-center gap-4 text-xs font-mono tabular-nums bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-sm">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">EHP Total</span>
                      <span className="text-cyan-300 font-bold">{combatMetrics.ehp}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">EHP / Cr</span>
                      <span className="text-emerald-300 font-bold">{combatMetrics.ehpPerCredit}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">{tr(lang, 'Shield Regen', 'Recarga Esc.', 'Regen Bouclier')}</span>
                      <span className="text-indigo-300 font-bold">{combatMetrics.rechargeTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCloneUnit}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 cursor-pointer"
                      title={tr(lang, 'Clone this unit', 'Clonar esta unidad', 'Cloner cette unité')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{tr(lang, 'Clone', 'Clonar', 'Cloner')}</span>
                    </button>
                    <button
                      onClick={handleDeleteUnit}
                      className="p-1.5 bg-slate-950 hover:bg-red-950/50 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-sm cursor-pointer"
                      title={tr(lang, 'Delete unit from XML', 'Eliminar unidad del XML', 'Supprimer l\'unité')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 6-Tab Navigation Bar */}
              <div className="bg-slate-950 border-b border-slate-800 px-6 flex items-center gap-1 overflow-x-auto shrink-0">
                {[
                  { id: 'identity', label: tr(lang, '1. Identity & Models', '1. Identidad y Modelos', '1. Identité & Modèles'), icon: Shield },
                  { id: 'economy', label: tr(lang, '2. Economy & Tech', '2. Economía y Requisitos', '2. Économie & Tech'), icon: Coins },
                  { id: 'combat', label: tr(lang, '3. Hull & Shields', '3. Casco y Escudos', '3. Coque & Boucliers'), icon: Heart },
                  { id: 'movement', label: tr(lang, '4. Propulsion & Sensors', '4. Movimiento y Radar', '4. Mouvement & Radar'), icon: Gauge },
                  { id: 'weapons', label: tr(lang, '5. Weapons & Hangar', '5. Armamento y Hangar', '5. Armes & Hangar'), icon: Crosshair },
                  { id: 'all_tags', label: tr(lang, `6. All XML Tags (${allDirectChildTags.length})`, `6. Todas las Etiquetas (${allDirectChildTags.length})`, `6. Toutes les Balises (${allDirectChildTags.length})`), icon: Layers }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as InspectorTab)}
                      className={`px-3.5 py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        activeTab === tab.id
                          ? 'border-emerald-400 text-emerald-300 font-bold bg-emerald-950/20'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl space-y-6">
                  {/* TAB 1: IDENTITY, FACTION & 3D MODELS */}
                  {activeTab === 'identity' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Unit Identity & Inheritance', 'Identidad de Unidad y Herencia', 'Identité & Héritage')}
                        </h4>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Name ({tr(lang, 'Internal XML Attribute', 'Atributo Name del XML', 'Attribut Name')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.name}
                            onChange={e => handleFieldChange('@Name', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-emerald-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Variant_Of_Existing_Type ({tr(lang, 'Base Template Unit', 'Unidad Base Heredada', 'Unité Parente')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.variantOf}
                            onChange={e => handleFieldChange('Variant_Of_Existing_Type', e.target.value)}
                            placeholder="e.g. Generic_Star_Destroyer"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Affiliation ({tr(lang, 'Owner Factions', 'Facción / Facciones', 'Factions')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.affiliation}
                            onChange={e => handleFieldChange('Affiliation', e.target.value)}
                            placeholder="Empire, Rebel, Underworld, Pirates"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-cyan-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['Empire', 'Rebel', 'Underworld', 'Pirates', 'Hostile', 'Neutral'].map(fac => (
                              <button
                                key={fac}
                                onClick={() => handleFieldChange('Affiliation', fac)}
                                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-300 rounded-sm cursor-pointer"
                              >
                                {fac}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            CategoryMask ({tr(lang, 'AI & Target Classification', 'Máscara de Categoría Táctica', 'Masque de Catégorie')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.categoryMask}
                            onChange={e => handleFieldChange('CategoryMask', e.target.value)}
                            placeholder="Capital | AntiFrigate"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['Capital', 'Frigate', 'Corvette', 'Fighter', 'Bomber', 'Vehicle', 'Infantry', 'Structure', 'SpaceHero', 'LandHero'].map(mask => (
                              <button
                                key={mask}
                                onClick={() => {
                                  const curr = selectedUnit.categoryMask ? `${selectedUnit.categoryMask} | ${mask}` : mask;
                                  handleFieldChange('CategoryMask', curr);
                                }}
                                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-400 hover:text-emerald-300 rounded-sm cursor-pointer"
                              >
                                + {mask}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Localization & 3D Models */}
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Localization (.DAT) & 3D Assets (.ALO / .MTD)', 'Textos (.DAT) y Modelos 3D (.ALO / .MTD)', 'Localisation & Modèles 3D')}
                        </h4>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Text_ID</label>
                            {selectedUnit.textId && datMap.get(selectedUnit.textId.toUpperCase()) && (
                              <span className="text-[10px] text-purple-300 font-sans truncate max-w-[220px]">
                                &ldquo;{datMap.get(selectedUnit.textId.toUpperCase())}&rdquo;
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={selectedUnit.textId}
                            onChange={e => handleFieldChange('Text_ID', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs font-mono text-purple-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Encyclopedia_Text</label>
                            {selectedUnit.encyclopediaText && datMap.get(selectedUnit.encyclopediaText.toUpperCase()) && (
                              <span className="text-[10px] text-purple-300 font-sans truncate max-w-[220px]">
                                &ldquo;{datMap.get(selectedUnit.encyclopediaText.toUpperCase())}&rdquo;
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={selectedUnit.encyclopediaText}
                            onChange={e => handleFieldChange('Encyclopedia_Text', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs font-mono text-purple-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Space_Model_Name (.ALO)</label>
                            <input
                              type="text"
                              value={selectedUnit.spaceModel}
                              onChange={e => handleFieldChange('Space_Model_Name', e.target.value)}
                              placeholder="EV_StarDestroyer.ALO"
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Land_Model_Name (.ALO)</label>
                            <input
                              type="text"
                              value={selectedUnit.landModel}
                              onChange={e => handleFieldChange('Land_Model_Name', e.target.value)}
                              placeholder="EV_AT-AT.ALO"
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Icon_Name (.MTD / .TGA)</label>
                            <input
                              type="text"
                              value={selectedUnit.iconName}
                              onChange={e => handleFieldChange('Icon_Name', e.target.value)}
                              placeholder="i_button_unit.tga"
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-amber-200 px-2.5 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Scale_Factor</label>
                            <input
                              type="number"
                              step="0.05"
                              value={selectedUnit.scaleFactor}
                              onChange={e => handleFieldChange('Scale_Factor', e.target.value)}
                              placeholder="1.0"
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ECONOMY, TECH & PRODUCTION REQUIREMENTS */}
                  {activeTab === 'economy' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Production Cost & Population', 'Coste de Producción y Población', 'Coût de Production & Population')}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Build_Cost_Credits</label>
                            <input
                              type="number"
                              value={selectedUnit.buildCost}
                              onChange={e => handleFieldChange('Build_Cost_Credits', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-amber-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Build_Time_Seconds</label>
                            <input
                              type="number"
                              value={selectedUnit.buildTime}
                              onChange={e => handleFieldChange('Build_Time_Seconds', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-amber-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Tech_Level (0-5 / 99)</label>
                            <input
                              type="number"
                              value={selectedUnit.techLevel}
                              onChange={e => handleFieldChange('Tech_Level', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Population_Value</label>
                            <input
                              type="number"
                              value={selectedUnit.populationValue}
                              onChange={e => handleFieldChange('Population_Value', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Size_Value</label>
                            <input
                              type="number"
                              value={selectedUnit.sizeValue}
                              onChange={e => handleFieldChange('Size_Value', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Planet & Structure Prerequisites', 'Requisitos de Planetas y Estructuras', 'Prérequis de Construction')}
                        </h4>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Required_Special_Structures
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.requiredStructures}
                            onChange={e => handleFieldChange('Required_Special_Structures', e.target.value)}
                            placeholder="e.g. E_Ground_Heavy_Vehicle_Factory"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Required_Planets ({tr(lang, 'Restricted Shipyards/Worlds', 'Restricción Planetaria ej. Kuat, MonCalimari', 'Planètes Requises')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.requiredPlanets}
                            onChange={e => handleFieldChange('Required_Planets', e.target.value)}
                            placeholder="e.g. Kuat, Corellia, Fondor"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-cyan-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: HULL, ARMOR & SHIELDS */}
                  {activeTab === 'combat' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Hull Integrity & Armor Class', 'Integridad de Casco y Blindaje', 'Intégrité Coque & Blindage')}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Tactical_Health (HP)</label>
                            <input
                              type="number"
                              value={selectedUnit.health}
                              onChange={e => handleFieldChange('Tactical_Health', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-cyan-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Damage (Auto-Resolve Score)</label>
                            <input
                              type="number"
                              value={selectedUnit.damageRating}
                              onChange={e => handleFieldChange('Damage', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-rose-300 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Armor_Type</label>
                          <input
                            type="text"
                            value={selectedUnit.armorType}
                            onChange={e => handleFieldChange('Armor_Type', e.target.value)}
                            placeholder="Armor_Star_Destroyer"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {['Armor_Star_Destroyer', 'Armor_Frigate', 'Armor_Corellian_Corvette', 'Armor_Fighter', 'Armor_Bomber', 'Armor_AT_AT', 'Armor_Tank', 'Armor_Infantry'].map(arm => (
                              <button
                                key={arm}
                                onClick={() => handleFieldChange('Armor_Type', arm)}
                                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono text-slate-400 hover:text-cyan-300 rounded-sm cursor-pointer"
                              >
                                {arm.replace('Armor_', '')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Deflector Shields & Reactor Energy', 'Escudos Deflectores y Energía', 'Boucliers & Énergie')}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Energy_Capacity (Shields)</label>
                            <input
                              type="number"
                              value={selectedUnit.energyCapacity}
                              onChange={e => handleFieldChange('Energy_Capacity', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-indigo-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Shield_Refresh_Rate (/s)</label>
                            <input
                              type="number"
                              value={selectedUnit.shieldRefresh}
                              onChange={e => handleFieldChange('Shield_Refresh_Rate', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-indigo-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Energy_Refresh_Rate</label>
                          <input
                            type="number"
                            value={selectedUnit.energyRefresh}
                            onChange={e => handleFieldChange('Energy_Refresh_Rate', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PROPULSION, NAVIGATION & SENSORS */}
                  {activeTab === 'movement' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Sublight Engines & Locomotion', 'Motores Sublumínicos y Locomoción', 'Propulsion & Locomotion')}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Max_Speed</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedUnit.maxSpeed}
                              onChange={e => handleFieldChange('Max_Speed', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-emerald-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Max_Rate_Of_Turn</label>
                            <input
                              type="number"
                              step="0.05"
                              value={selectedUnit.turnRate}
                              onChange={e => handleFieldChange('Max_Rate_Of_Turn', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-emerald-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Space_Layer</label>
                            <select
                              value={selectedUnit.spaceLayer}
                              onChange={e => handleFieldChange('Space_Layer', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            >
                              <option value="">(None)</option>
                              <option value="Fighter">Fighter</option>
                              <option value="Corvette">Corvette</option>
                              <option value="Frigate">Frigate</option>
                              <option value="Capital">Capital</option>
                              <option value="SuperCapital">SuperCapital</option>
                              <option value="StaticObject">StaticObject</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">MovementClass (Ground)</label>
                            <select
                              value={selectedUnit.movementClass}
                              onChange={e => handleFieldChange('MovementClass', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            >
                              <option value="">(None)</option>
                              <option value="Space">Space</option>
                              <option value="Infantry">Infantry</option>
                              <option value="Tracked">Tracked</option>
                              <option value="Wheeled">Wheeled</option>
                              <option value="Walker">Walker</option>
                              <option value="Hover">Hover</option>
                              <option value="Lancet">Lancet</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Hyperspace & Fog of War Sensors', 'Hiperespacio y Rango de Radar (FOW)', 'Hyperespace & Radar')}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Hyperspace</label>
                            <select
                              value={selectedUnit.hyperspace}
                              onChange={e => handleFieldChange('Hyperspace', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            >
                              <option value="">(Default)</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Hyperspace_Speed</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedUnit.hyperspaceSpeed}
                              onChange={e => handleFieldChange('Hyperspace_Speed', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                              FOW_Reveal_Range ({tr(lang, 'Radar Vision', 'Visión Radar', 'Portée Radar')})
                            </label>
                            <input
                              type="number"
                              value={selectedUnit.fowRange}
                              onChange={e => {
                                const isGround = selectedUnit.tagName.startsWith('Ground');
                                handleFieldChange(isGround ? 'Land_FOW_Reveal_Range' : 'Space_FOW_Reveal_Range', e.target.value);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-cyan-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                              Targeting_Max_Attack_Distance
                            </label>
                            <input
                              type="number"
                              value={selectedUnit.maxAttackDistance}
                              onChange={e => handleFieldChange('Targeting_Max_Attack_Distance', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-rose-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: WEAPONS, HARDPOINTS, SQUADRONS & HANGAR GARRISON */}
                  {activeTab === 'weapons' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* HardPoints Manager */}
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                            {tr(lang, `Mounted HardPoints (${parsedHardPointsList.length})`, `HardPoints Acoplados (${parsedHardPointsList.length})`, `HardPoints (${parsedHardPointsList.length})`)}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newHardPointInput}
                            onChange={e => setNewHardPointInput(e.target.value)}
                            placeholder="e.g. HP_Star_Destroyer_Laser_01"
                            className="flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-sm outline-none"
                            onKeyDown={e => { if (e.key === 'Enter') handleAddHardPoint(); }}
                          />
                          <button
                            onClick={handleAddHardPoint}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono font-bold text-xs uppercase rounded-sm cursor-pointer"
                          >
                            + HP
                          </button>
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {parsedHardPointsList.length === 0 ? (
                            <p className="text-xs text-slate-500 font-mono py-4 text-center">
                              {tr(lang, 'No HardPoints defined on this unit.', 'Esta unidad no tiene HardPoints asignados.', 'Aucun HardPoint.')}
                            </p>
                          ) : (
                            parsedHardPointsList.map((hp, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded-sm text-xs font-mono text-slate-200"
                              >
                                <span className="truncate">{hp}</span>
                                <div className="flex items-center space-x-2 ml-2">
                                  {onOpenHardPointEditor && (
                                    <button
                                      onClick={() => onOpenHardPointEditor(hp)}
                                      className="text-[10px] text-rose-400 hover:text-rose-300 uppercase cursor-pointer"
                                      title={tr(lang, 'Inspect in HardPoint Editor v1.1', 'Inspeccionar en Editor de HardPoints v1.1', 'Inspecter dans HardPoints v1.1')}
                                    >
                                      {tr(lang, 'Inspect ↗', 'Editar HP ↗', 'Éditer ↗')}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveHardPoint(hp)}
                                    className="text-slate-500 hover:text-red-400 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Direct Projectiles & Hangar / Squadron Composition */}
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-3.5">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                          {tr(lang, 'Direct Projectiles & Hangar Garrison', 'Proyectiles Directos, Escuadrón y Hangar', 'Projectiles & Hangar')}
                        </h4>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Projectile_Types</label>
                          <input
                            type="text"
                            value={selectedUnit.projectileTypes}
                            onChange={e => handleFieldChange('Projectile_Types', e.target.value)}
                            placeholder="Proj_Ship_Turbolaser_Green"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-amber-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Projectile_Fire_Pulse_Count</label>
                            <input
                              type="number"
                              value={selectedUnit.firePulseCount}
                              onChange={e => handleFieldChange('Projectile_Fire_Pulse_Count', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Projectile_Fire_Recharge_Seconds</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedUnit.fireRecharge}
                              onChange={e => handleFieldChange('Projectile_Fire_Recharge_Seconds', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-sm outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Starting_Spawned_Units_Tech_0 ({tr(lang, 'Hangar Deployed Squadrons', 'Cazas Desplegados del Hangar', 'Escadrons du Hangar')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.spawnedUnits}
                            onChange={e => handleFieldChange('Starting_Spawned_Units_Tech_0', e.target.value)}
                            placeholder="TIE_Fighter_Squadron, 2"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-emerald-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Squadron_Units / Company_Units ({tr(lang, 'Member Units', 'Unidades Integrantes del Escuadrón/Compañía', 'Unités Membres')})
                          </label>
                          <input
                            type="text"
                            value={selectedUnit.squadronUnits || selectedUnit.companyUnits}
                            onChange={e => {
                              const tag = selectedUnit.tagName === 'GroundCompany' ? 'Company_Units' : 'Squadron_Units';
                              handleFieldChange(tag, e.target.value);
                            }}
                            placeholder="X-Wing, X-Wing, X-Wing"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-cyan-200 px-3 py-1.5 rounded-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: ALL XML TAGS & CUSTOM TAG INJECTOR */}
                  {activeTab === 'all_tags' && (
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                            {tr(lang, 'Complete Unit XML Tag Inspector', 'Inspector Completo de Etiquetas XML de la Unidad', 'Inspecteur Complet des Balises XML')}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {tr(
                              lang,
                              'Inspect or modify any XML property present on this unit, or inject a new Alamo Engine tag below.',
                              'Inspecciona o edita cualquier etiqueta XML presente en esta unidad, o inyecta una nueva propiedad del motor Alamo.',
                              'Inspectez ou modifiez toutes les balises XML de cette unité.'
                            )}
                          </p>
                        </div>

                        {/* Add Custom Tag Bar */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customTagName}
                            onChange={e => setCustomTagName(e.target.value)}
                            placeholder={tr(lang, 'Tag (e.g. Lua_Script)', 'Etiqueta (ej. Lua_Script)', 'Balise')}
                            className="bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-emerald-200 px-2.5 py-1 rounded-sm outline-none w-44"
                          />
                          <input
                            type="text"
                            value={customTagValue}
                            onChange={e => setCustomTagValue(e.target.value)}
                            placeholder={tr(lang, 'Value...', 'Valor...', 'Valeur...')}
                            className="bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-200 px-2.5 py-1 rounded-sm outline-none w-48"
                          />
                          <button
                            onClick={() => {
                              if (!customTagName.trim()) return;
                              handleFieldChange(customTagName.trim(), customTagValue);
                              setCustomTagName('');
                              setCustomTagValue('');
                            }}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase rounded-sm cursor-pointer"
                          >
                            + Tag
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                        {allDirectChildTags.map((item) => (
                          <div key={`${item.tagName}_${item.index}`} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono font-bold text-cyan-400 truncate">
                                &lt;{item.tagName}&gt;
                              </span>
                              <button
                                onClick={() => {
                                  const child = selectedUnit.node.children[item.index];
                                  if (child) {
                                    selectedUnit.node.removeChild(child);
                                    parseAllUnitsFromDoc(doc);
                                  }
                                }}
                                className="text-slate-600 hover:text-red-400 text-[10px] font-mono cursor-pointer"
                                title={tr(lang, 'Remove tag', 'Eliminar etiqueta', 'Supprimer')}
                              >
                                ×
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.value}
                              onChange={e => {
                                const child = selectedUnit.node.children[item.index];
                                if (child) {
                                  child.textContent = e.target.value;
                                  parseAllUnitsFromDoc(doc);
                                }
                              }}
                              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 px-2 py-1 rounded-sm outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 flex-col space-y-4 font-mono">
              <Crosshair className="w-12 h-12 text-slate-800" />
              <p className="text-xs font-bold tracking-widest uppercase">
                {tr(lang, 'Select a unit to edit its properties', 'Selecciona una unidad para editar sus propiedades', 'Sélectionnez une unité')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create New Unit Modal */}
      {showNewUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-sm shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-300">
                {tr(lang, 'Create New Alamo Engine Unit', 'Crear Nueva Unidad del Motor Alamo', 'Créer une Nouvelle Unité')}
              </h3>
              <button onClick={() => setShowNewUnitModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {tr(lang, 'XML Entity Tag', 'Tipo de Etiqueta XML', 'Type d\'Entité XML')}
                </label>
                <select
                  value={newUnitTag}
                  onChange={e => setNewUnitTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs p-2 rounded-sm outline-none"
                >
                  <option value="SpaceUnit">&lt;SpaceUnit&gt; (Nave Capital / Fragata / Corbeta)</option>
                  <option value="Squadron">&lt;Squadron&gt; (Escuadrón Espacial)</option>
                  <option value="GroundVehicle">&lt;GroundVehicle&gt; (Vehículo / Walker Terrestre)</option>
                  <option value="GroundInfantry">&lt;GroundInfantry&gt; (Infantería Terrestre)</option>
                  <option value="GroundCompany">&lt;GroundCompany&gt; (Compañía de Despliegue)</option>
                  <option value="HeroUnit">&lt;HeroUnit&gt; (Héroe Galáctico)</option>
                  <option value="StarBase">&lt;StarBase&gt; (Estación Espacial)</option>
                  <option value="SpecialStructure">&lt;SpecialStructure&gt; (Estructura Terrestre)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {tr(lang, 'Internal Unit Name', 'Nombre Interno (Atributo Name)', 'Nom Interne')}
                </label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={e => setNewUnitName(e.target.value)}
                  placeholder="e.g. Imperial_Victory_Destroyer_MK2"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-slate-100 p-2 rounded-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  {tr(lang, 'Affiliation (Faction)', 'Facción (Affiliation)', 'Faction')}
                </label>
                <input
                  type="text"
                  value={newUnitFaction}
                  onChange={e => setNewUnitFaction(e.target.value)}
                  placeholder="Empire"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs font-mono text-cyan-200 p-2 rounded-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewUnitModal(false)}
                className="px-4 py-1.5 text-xs font-mono uppercase text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {tr(lang, 'Cancel', 'Cancelar', 'Annuler')}
              </button>
              <button
                onClick={handleCreateNewUnit}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm cursor-pointer"
              >
                {tr(lang, 'Create Unit', 'Crear Unidad', 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-sm shadow-xl flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      <a ref={fileDownloadAnchorRef} className="hidden" />
    </div>
  );
}
