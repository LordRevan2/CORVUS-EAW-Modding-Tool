import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Crosshair,
  Save,
  Search,
  X,
  Plus,
  Copy,
  Trash2,
  Upload,
  Table,
  Code,
  Sliders,
  Shield,
  Zap,
  Radar,
  Flame,
  Check,
  ArrowUpDown,
  Layers
} from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import { DatRecord } from '../lib/dat';

interface HardPointEditorProps {
  initialDoc: XMLDocument;
  fileName: string;
  onClose: () => void;
  onError: (err: string) => void;
  workspaceFiles?: File[];
  datRecords?: DatRecord[] | null;
  onSelectWorkspaceFile?: (path: string) => void;
  initialFilterQuery?: string;
}

export interface HardPointEntry {
  id: string;
  node: Element;
  kind: 'hardpoint' | 'projectile';
  tagName: string;
  name: string;
  // HardPoint fields
  hpType: string;
  textId: string;
  tooltipText: string;
  isTargetable: string;
  isDestroyable: string;
  health: string;
  attachmentBone: string;
  collisionMesh: string;
  fireBoneA: string;
  fireBoneB: string;
  fireConeWidth: string;
  fireConeHeight: string;
  fireProjectileType: string;
  fireMinRecharge: string;
  fireMaxRecharge: string;
  firePulseCount: string;
  firePulseDelay: string;
  fireRangeDistance: string;
  fireSfxEvent: string;
  // Projectile fields
  projCategory: string;
  projDamage: string;
  projShieldDamage: string;
  projMaxFlightDist: string;
  projMaxSpeed: string;
  projWidth: string;
  projLength: string;
  projLaserColor: string;
  projDoesShieldDamage: string;
  projDoesEnergyDamage: string;
  projDoesHitPointDamage: string;
  projExplosionParticle: string;
}

const HARDPOINT_TYPES = [
  'HARD_POINT_WEAPON_LASER',
  'HARD_POINT_WEAPON_TORPEDO',
  'HARD_POINT_WEAPON_MISSILE',
  'HARD_POINT_WEAPON_ION_CANNON',
  'HARD_POINT_WEAPON_MASS_DRIVER',
  'HARD_POINT_WEAPON_SPECIAL',
  'HARD_POINT_SHIELD_GENERATOR',
  'HARD_POINT_ENGINE',
  'HARD_POINT_FIGHTER_BAY',
  'HARD_POINT_TRACTOR_BEAM',
  'HARD_POINT_GRAVITY_WELL',
  'HARD_POINT_ENABLE_SPECIAL_ABILITY',
  'HARD_POINT_DUMMY_ART'
];

const PROJECTILE_CATEGORIES = [
  'Laser',
  'Torpedo',
  'Missile',
  'Ion',
  'Bomb',
  'Beam',
  'Grenade'
];

export function createSampleHardPointsXmlString(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<HardPointsAndProjectiles>

  <HardPoint Name="HP_Star_Destroyer_Weapon_01">
    <Type>HARD_POINT_WEAPON_LASER</Type>
    <Is_Targetable>Yes</Is_Targetable>
    <Is_Destroyable>Yes</Is_Destroyable>
    <Tooltip_Text>TEXT_WEAPON_TURBOLASER_HEAVY</Tooltip_Text>
    <Health>650.0</Health>
    <Attachment_Bone>HP_T_L_01</Attachment_Bone>
    <Collision_Mesh>HP_T_L_01_COLL</Collision_Mesh>
    <Fire_Bone_A>FP_T_L_01A</Fire_Bone_A>
    <Fire_Bone_B>FP_T_L_01B</Fire_Bone_B>
    <Fire_Cone_Width>135.0</Fire_Cone_Width>
    <Fire_Cone_Height>90.0</Fire_Cone_Height>
    <Fire_Projectile_Type>Proj_Ship_Turbolaser_Green_Heavy</Fire_Projectile_Type>
    <Fire_Min_Recharge_Seconds>3.5</Fire_Min_Recharge_Seconds>
    <Fire_Max_Recharge_Seconds>4.5</Fire_Max_Recharge_Seconds>
    <Fire_Pulse_Count>4</Fire_Pulse_Count>
    <Fire_Pulse_Delay_Seconds>0.25</Fire_Pulse_Delay_Seconds>
    <Fire_Range_Distance>1850.0</Fire_Range_Distance>
    <Fire_SFXEvent>Unit_Turbo_Fire</Fire_SFXEvent>
  </HardPoint>

  <HardPoint Name="HP_Star_Destroyer_Ion_01">
    <Type>HARD_POINT_WEAPON_ION_CANNON</Type>
    <Is_Targetable>Yes</Is_Targetable>
    <Is_Destroyable>Yes</Is_Destroyable>
    <Tooltip_Text>TEXT_WEAPON_ION_CANNON</Tooltip_Text>
    <Health>520.0</Health>
    <Attachment_Bone>HP_ION_01</Attachment_Bone>
    <Collision_Mesh>HP_ION_01_COLL</Collision_Mesh>
    <Fire_Bone_A>FP_ION_01A</Fire_Bone_A>
    <Fire_Bone_B>FP_ION_01B</Fire_Bone_B>
    <Fire_Cone_Width>120.0</Fire_Cone_Width>
    <Fire_Cone_Height>85.0</Fire_Cone_Height>
    <Fire_Projectile_Type>Proj_Ship_Ion_Cannon_Large</Fire_Projectile_Type>
    <Fire_Min_Recharge_Seconds>5.0</Fire_Min_Recharge_Seconds>
    <Fire_Max_Recharge_Seconds>6.0</Fire_Max_Recharge_Seconds>
    <Fire_Pulse_Count>2</Fire_Pulse_Count>
    <Fire_Pulse_Delay_Seconds>0.3</Fire_Pulse_Delay_Seconds>
    <Fire_Range_Distance>1950.0</Fire_Range_Distance>
    <Fire_SFXEvent>Unit_Ion_Fire</Fire_SFXEvent>
  </HardPoint>

  <HardPoint Name="HP_Star_Destroyer_Shield_Gen">
    <Type>HARD_POINT_SHIELD_GENERATOR</Type>
    <Is_Targetable>Yes</Is_Targetable>
    <Is_Destroyable>Yes</Is_Destroyable>
    <Tooltip_Text>TEXT_HARDPOINT_SHIELD_GENERATOR</Tooltip_Text>
    <Health>950.0</Health>
    <Attachment_Bone>HP_SHIELD_01</Attachment_Bone>
    <Collision_Mesh>HP_SHIELD_01_COLL</Collision_Mesh>
  </HardPoint>

  <HardPoint Name="HP_Star_Destroyer_Engines">
    <Type>HARD_POINT_ENGINE</Type>
    <Is_Targetable>Yes</Is_Targetable>
    <Is_Destroyable>Yes</Is_Destroyable>
    <Tooltip_Text>TEXT_HARDPOINT_ENGINES</Tooltip_Text>
    <Health>1100.0</Health>
    <Attachment_Bone>HP_ENGINE_01</Attachment_Bone>
    <Collision_Mesh>HP_ENGINE_01_COLL</Collision_Mesh>
  </HardPoint>

  <HardPoint Name="HP_Calamari_Proton_Torpedo_01">
    <Type>HARD_POINT_WEAPON_TORPEDO</Type>
    <Is_Targetable>Yes</Is_Targetable>
    <Is_Destroyable>Yes</Is_Destroyable>
    <Tooltip_Text>TEXT_WEAPON_PROTON_TORPEDO</Tooltip_Text>
    <Health>580.0</Health>
    <Attachment_Bone>HP_TORP_01</Attachment_Bone>
    <Collision_Mesh>HP_TORP_01_COLL</Collision_Mesh>
    <Fire_Bone_A>FP_TORP_01</Fire_Bone_A>
    <Fire_Bone_B>FP_TORP_01</Fire_Bone_B>
    <Fire_Cone_Width>90.0</Fire_Cone_Width>
    <Fire_Cone_Height>60.0</Fire_Cone_Height>
    <Fire_Projectile_Type>Proj_Ship_Proton_Torpedo</Fire_Projectile_Type>
    <Fire_Min_Recharge_Seconds>7.0</Fire_Min_Recharge_Seconds>
    <Fire_Max_Recharge_Seconds>8.5</Fire_Max_Recharge_Seconds>
    <Fire_Pulse_Count>2</Fire_Pulse_Count>
    <Fire_Pulse_Delay_Seconds>0.4</Fire_Pulse_Delay_Seconds>
    <Fire_Range_Distance>2100.0</Fire_Range_Distance>
    <Fire_SFXEvent>Unit_Torpedo_Fire</Fire_SFXEvent>
  </HardPoint>

  <Projectile Name="Proj_Ship_Turbolaser_Green_Heavy">
    <Text_ID>TEXT_PROJECTILE_TURBOLASER</Text_ID>
    <Projectile_Category>Laser</Projectile_Category>
    <Projectile_Damage>42.0</Projectile_Damage>
    <Projectile_Shield_Damage>48.0</Projectile_Shield_Damage>
    <Projectile_Max_Flight_Distance>2000.0</Projectile_Max_Flight_Distance>
    <Projectile_Max_Speed>28.0</Projectile_Max_Speed>
    <Projectile_Width>3.5</Projectile_Width>
    <Projectile_Length>38.0</Projectile_Length>
    <Projectile_Laser_Color>45, 255, 90, 255</Projectile_Laser_Color>
    <Projectile_Does_Shield_Damage>Yes</Projectile_Does_Shield_Damage>
    <Projectile_Does_Energy_Damage>No</Projectile_Does_Energy_Damage>
    <Projectile_Does_Hit_Point_Damage>Yes</Projectile_Does_Hit_Point_Damage>
    <Projectile_Object_Detonation_Particle>Small_Damage_Space</Projectile_Object_Detonation_Particle>
  </Projectile>

  <Projectile Name="Proj_Ship_Ion_Cannon_Large">
    <Text_ID>TEXT_PROJECTILE_ION_CANNON</Text_ID>
    <Projectile_Category>Ion</Projectile_Category>
    <Projectile_Damage>8.0</Projectile_Damage>
    <Projectile_Shield_Damage>135.0</Projectile_Shield_Damage>
    <Projectile_Max_Flight_Distance>2100.0</Projectile_Max_Flight_Distance>
    <Projectile_Max_Speed>26.0</Projectile_Max_Speed>
    <Projectile_Width>4.2</Projectile_Width>
    <Projectile_Length>42.0</Projectile_Length>
    <Projectile_Laser_Color>70, 175, 255, 255</Projectile_Laser_Color>
    <Projectile_Does_Shield_Damage>Yes</Projectile_Does_Shield_Damage>
    <Projectile_Does_Energy_Damage>Yes</Projectile_Does_Energy_Damage>
    <Projectile_Does_Hit_Point_Damage>No</Projectile_Does_Hit_Point_Damage>
    <Projectile_Object_Detonation_Particle>Ion_Cannon_Hit_Particle</Projectile_Object_Detonation_Particle>
  </Projectile>

  <Projectile Name="Proj_Ship_Proton_Torpedo">
    <Text_ID>TEXT_PROJECTILE_PROTON_TORPEDO</Text_ID>
    <Projectile_Category>Torpedo</Projectile_Category>
    <Projectile_Damage>110.0</Projectile_Damage>
    <Projectile_Shield_Damage>35.0</Projectile_Shield_Damage>
    <Projectile_Max_Flight_Distance>2300.0</Projectile_Max_Flight_Distance>
    <Projectile_Max_Speed>18.5</Projectile_Max_Speed>
    <Projectile_Width>4.0</Projectile_Width>
    <Projectile_Length>16.0</Projectile_Length>
    <Projectile_Laser_Color>255, 190, 50, 255</Projectile_Laser_Color>
    <Projectile_Does_Shield_Damage>No</Projectile_Does_Shield_Damage>
    <Projectile_Does_Energy_Damage>No</Projectile_Does_Energy_Damage>
    <Projectile_Does_Hit_Point_Damage>Yes</Projectile_Does_Hit_Point_Damage>
    <Projectile_Object_Detonation_Particle>Proton_Torpedo_Explosion</Projectile_Object_Detonation_Particle>
  </Projectile>

</HardPointsAndProjectiles>`;
}

function getChildVal(el: Element, tagName: string): string {
  const lower = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].tagName.toLowerCase() === lower) {
      return el.children[i].textContent?.trim() || '';
    }
  }
  return '';
}

function setChildVal(doc: XMLDocument, el: Element, tagName: string, val: string) {
  const lower = tagName.toLowerCase();
  for (let i = 0; i < el.children.length; i++) {
    if (el.children[i].tagName.toLowerCase() === lower) {
      el.children[i].textContent = val;
      return;
    }
  }
  if (val.trim() !== '') {
    const created = doc.createElement(tagName);
    created.textContent = val;
    el.appendChild(created);
  }
}

function formatXmlElement(node: Node, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    let attrs = '';
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      attrs += ` ${a.name}="${a.value}"`;
    }
    const children = Array.from(el.childNodes).filter(
      c => c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.textContent?.trim())
    );
    if (children.length === 0) {
      return `${pad}<${el.tagName}${attrs} />\n`;
    }
    if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
      return `${pad}<${el.tagName}${attrs}>${children[0].textContent?.trim()}</${el.tagName}>\n`;
    }
    let out = `${pad}<${el.tagName}${attrs}>\n`;
    for (const child of children) {
      out += formatXmlElement(child, indent + 1);
    }
    out += `${pad}</${el.tagName}>\n`;
    return out;
  }
  return '';
}

function parseRgbaToHex(rgbaStr: string): string {
  const parts = rgbaStr
    .split(',')
    .map(p => Math.max(0, Math.min(255, parseInt(p.trim(), 10) || 0)));
  if (parts.length < 3) return '#22d3ee';
  const [r, g, b] = parts;
  return (
    '#' +
    [r, g, b]
      .map(n => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

function hexToRgbaString(hex: string, alpha = 255): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '45, 255, 90, 255';
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}, ${alpha}`;
}

export default function HardPointEditor({
  initialDoc,
  fileName,
  onClose,
  onError,
  workspaceFiles = [],
  datRecords,
  onSelectWorkspaceFile,
  initialFilterQuery = ''
}: HardPointEditorProps) {
  const lang = useLanguage();
  const [doc, setDoc] = useState<XMLDocument>(initialDoc);
  const [editableFileName, setEditableFileName] = useState<string>(fileName);
  const [entries, setEntries] = useState<HardPointEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<'all' | 'hardpoint' | 'projectile'>('all');
  const [search, setSearch] = useState<string>(initialFilterQuery);
  const [viewMode, setViewMode] = useState<'inspector' | 'table' | 'raw_xml'>('inspector');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [rawXmlText, setRawXmlText] = useState<string>('');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const parseDocEntries = (xmlDoc: XMLDocument): HardPointEntry[] => {
    const parsed: HardPointEntry[] = [];
    const allElements = Array.from(xmlDoc.getElementsByTagName('*'));
    let idx = 0;
    for (const el of allElements) {
      const tagLower = el.tagName.toLowerCase();
      if (tagLower === 'hardpoint' || tagLower === 'projectile') {
        const isHp = tagLower === 'hardpoint';
        const name = el.getAttribute('Name') || getChildVal(el, 'Name') || `${el.tagName}_${idx + 1}`;
        parsed.push({
          id: `${tagLower}_${idx}_${name}`,
          node: el,
          kind: isHp ? 'hardpoint' : 'projectile',
          tagName: el.tagName,
          name,
          hpType: getChildVal(el, 'Type'),
          textId: getChildVal(el, 'Text_ID'),
          tooltipText: getChildVal(el, 'Tooltip_Text'),
          isTargetable: getChildVal(el, 'Is_Targetable') || 'Yes',
          isDestroyable: getChildVal(el, 'Is_Destroyable') || 'Yes',
          health: getChildVal(el, 'Health'),
          attachmentBone: getChildVal(el, 'Attachment_Bone'),
          collisionMesh: getChildVal(el, 'Collision_Mesh'),
          fireBoneA: getChildVal(el, 'Fire_Bone_A'),
          fireBoneB: getChildVal(el, 'Fire_Bone_B'),
          fireConeWidth: getChildVal(el, 'Fire_Cone_Width'),
          fireConeHeight: getChildVal(el, 'Fire_Cone_Height'),
          fireProjectileType: getChildVal(el, 'Fire_Projectile_Type'),
          fireMinRecharge: getChildVal(el, 'Fire_Min_Recharge_Seconds'),
          fireMaxRecharge: getChildVal(el, 'Fire_Max_Recharge_Seconds'),
          firePulseCount: getChildVal(el, 'Fire_Pulse_Count'),
          firePulseDelay: getChildVal(el, 'Fire_Pulse_Delay_Seconds'),
          fireRangeDistance: getChildVal(el, 'Fire_Range_Distance'),
          fireSfxEvent: getChildVal(el, 'Fire_SFXEvent'),
          projCategory: getChildVal(el, 'Projectile_Category'),
          projDamage: getChildVal(el, 'Projectile_Damage'),
          projShieldDamage: getChildVal(el, 'Projectile_Shield_Damage'),
          projMaxFlightDist: getChildVal(el, 'Projectile_Max_Flight_Distance'),
          projMaxSpeed: getChildVal(el, 'Projectile_Max_Speed'),
          projWidth: getChildVal(el, 'Projectile_Width'),
          projLength: getChildVal(el, 'Projectile_Length'),
          projLaserColor: getChildVal(el, 'Projectile_Laser_Color') || '45, 255, 90, 255',
          projDoesShieldDamage: getChildVal(el, 'Projectile_Does_Shield_Damage') || 'Yes',
          projDoesEnergyDamage: getChildVal(el, 'Projectile_Does_Energy_Damage') || 'No',
          projDoesHitPointDamage: getChildVal(el, 'Projectile_Does_Hit_Point_Damage') || 'Yes',
          projExplosionParticle: getChildVal(el, 'Projectile_Object_Detonation_Particle')
        });
        idx++;
      }
    }
    return parsed;
  };

  useEffect(() => {
    setDoc(initialDoc);
    setEditableFileName(fileName);
    const list = parseDocEntries(initialDoc);
    setEntries(list);
    if (initialFilterQuery) {
      setSearch(initialFilterQuery);
      const matched = list.find(e => e.name.toLowerCase().includes(initialFilterQuery.toLowerCase()));
      setSelectedId(matched?.id || list[0]?.id || null);
    } else {
      setSelectedId(list[0]?.id || null);
    }
  }, [initialDoc, fileName, initialFilterQuery]);

  const selectedEntry = useMemo(
    () => entries.find(e => e.id === selectedId) || null,
    [entries, selectedId]
  );

  useEffect(() => {
    if (selectedEntry) {
      setRawXmlText(formatXmlElement(selectedEntry.node, 0).trim());
    }
  }, [selectedEntry]);

  const datMap = useMemo(() => {
    const map = new Map<string, string>();
    if (datRecords) {
      datRecords.forEach(r => map.set(r.key.toUpperCase(), r.value));
    }
    return map;
  }, [datRecords]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.hpType.toLowerCase().includes(q) ||
        e.fireProjectileType.toLowerCase().includes(q) ||
        e.projCategory.toLowerCase().includes(q)
      );
    });
  }, [entries, kindFilter, search]);

  const handleFieldUpdate = (entryId: string, xmlTag: string, value: string, isAttrName = false) => {
    const target = entries.find(e => e.id === entryId);
    if (!target) return;
    if (isAttrName) {
      target.node.setAttribute('Name', value);
    } else {
      setChildVal(doc, target.node, xmlTag, value);
    }
    const refreshed = parseDocEntries(doc);
    setEntries(refreshed);
  };

  const handleAddEntry = (kind: 'hardpoint' | 'projectile') => {
    const root = doc.documentElement;
    const isHp = kind === 'hardpoint';
    const el = doc.createElement(isHp ? 'HardPoint' : 'Projectile');
    const newName = isHp
      ? `HP_Custom_Turret_${entries.filter(e => e.kind === 'hardpoint').length + 1}`
      : `Proj_Custom_Laser_${entries.filter(e => e.kind === 'projectile').length + 1}`;
    el.setAttribute('Name', newName);

    if (isHp) {
      setChildVal(doc, el, 'Type', 'HARD_POINT_WEAPON_LASER');
      setChildVal(doc, el, 'Is_Targetable', 'Yes');
      setChildVal(doc, el, 'Is_Destroyable', 'Yes');
      setChildVal(doc, el, 'Health', '600.0');
      setChildVal(doc, el, 'Attachment_Bone', 'HP_BONE_01');
      setChildVal(doc, el, 'Fire_Bone_A', 'FP_BONE_01A');
      setChildVal(doc, el, 'Fire_Cone_Width', '120.0');
      setChildVal(doc, el, 'Fire_Cone_Height', '90.0');
      setChildVal(doc, el, 'Fire_Projectile_Type', 'Proj_Ship_Turbolaser_Green_Heavy');
      setChildVal(doc, el, 'Fire_Min_Recharge_Seconds', '3.5');
      setChildVal(doc, el, 'Fire_Max_Recharge_Seconds', '4.5');
      setChildVal(doc, el, 'Fire_Pulse_Count', '3');
      setChildVal(doc, el, 'Fire_Pulse_Delay_Seconds', '0.25');
      setChildVal(doc, el, 'Fire_Range_Distance', '1800.0');
    } else {
      setChildVal(doc, el, 'Projectile_Category', 'Laser');
      setChildVal(doc, el, 'Projectile_Damage', '40.0');
      setChildVal(doc, el, 'Projectile_Shield_Damage', '40.0');
      setChildVal(doc, el, 'Projectile_Max_Flight_Distance', '1900.0');
      setChildVal(doc, el, 'Projectile_Max_Speed', '26.0');
      setChildVal(doc, el, 'Projectile_Width', '3.0');
      setChildVal(doc, el, 'Projectile_Length', '35.0');
      setChildVal(doc, el, 'Projectile_Laser_Color', '255, 65, 65, 255');
      setChildVal(doc, el, 'Projectile_Does_Shield_Damage', 'Yes');
      setChildVal(doc, el, 'Projectile_Does_Hit_Point_Damage', 'Yes');
    }

    root.appendChild(el);
    const refreshed = parseDocEntries(doc);
    setEntries(refreshed);
    const created = refreshed[refreshed.length - 1];
    if (created) setSelectedId(created.id);
    showToast(tr(lang, `Added ${newName}`, `Añadido ${newName}`, `Ajouté ${newName}`));
  };

  const handleDuplicateSelected = () => {
    if (!selectedEntry || !selectedEntry.node.parentNode) return;
    const cloned = selectedEntry.node.cloneNode(true) as Element;
    const cloneName = `${selectedEntry.name}_Copy`;
    cloned.setAttribute('Name', cloneName);
    selectedEntry.node.parentNode.appendChild(cloned);
    const refreshed = parseDocEntries(doc);
    setEntries(refreshed);
    const added = refreshed[refreshed.length - 1];
    if (added) setSelectedId(added.id);
    showToast(tr(lang, `Cloned ${cloneName}`, `Clonado ${cloneName}`, `Cloné ${cloneName}`));
  };

  const handleDeleteSelected = () => {
    if (!selectedEntry || !selectedEntry.node.parentNode) return;
    selectedEntry.node.parentNode.removeChild(selectedEntry.node);
    const refreshed = parseDocEntries(doc);
    setEntries(refreshed);
    setSelectedId(refreshed[0]?.id || null);
    showToast(tr(lang, 'Deleted node', 'Nodo eliminado', 'Nœud supprimé'));
  };

  const handleSaveXml = () => {
    try {
      const content = '<?xml version="1.0" encoding="utf-8"?>\n' + formatXmlElement(doc.documentElement, 0);
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = editableFileName.endsWith('.xml') ? editableFileName : `${editableFileName}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(tr(lang, `Saved ${a.download}`, `Guardado ${a.download}`, `Enregistré ${a.download}`));
    } catch (err: any) {
      onError(err.message || 'Error saving XML');
    }
  };

  const handleApplyRawNodeXml = () => {
    if (!selectedEntry || !selectedEntry.node.parentNode) return;
    try {
      const parser = new DOMParser();
      const frag = parser.parseFromString(rawXmlText, 'application/xml');
      if (frag.querySelector('parsererror')) {
        onError(tr(lang, 'Invalid XML syntax in node', 'Sintaxis XML inválida en el nodo', 'Syntaxe XML invalide'));
        return;
      }
      const imported = doc.importNode(frag.documentElement, true);
      selectedEntry.node.parentNode.replaceChild(imported, selectedEntry.node);
      const refreshed = parseDocEntries(doc);
      setEntries(refreshed);
      const match = refreshed.find(e => e.node === imported) || refreshed[0];
      if (match) setSelectedId(match.id);
      showToast(tr(lang, 'XML Node updated', 'Nodo XML actualizado', 'Nœud XML mis à jour'));
    } catch (err: any) {
      onError(err.message || 'Error updating XML');
    }
  };

  // Linked projectile & DPS calculation for selected HardPoint
  const linkedProjectile = useMemo(() => {
    if (!selectedEntry || selectedEntry.kind !== 'hardpoint' || !selectedEntry.fireProjectileType) return null;
    return (
      entries.find(
        e =>
          e.kind === 'projectile' &&
          e.name.toLowerCase() === selectedEntry.fireProjectileType.toLowerCase()
      ) || null
    );
  }, [entries, selectedEntry]);

  const weaponTelemetry = useMemo(() => {
    if (!selectedEntry || selectedEntry.kind !== 'hardpoint') {
      return null;
    }
    const pulses = Math.max(1, parseFloat(selectedEntry.firePulseCount) || 1);
    const pulseDelay = Math.max(0, parseFloat(selectedEntry.firePulseDelay) || 0.2);
    const minRech = Math.max(0.1, parseFloat(selectedEntry.fireMinRecharge) || 3.0);
    const maxRech = Math.max(minRech, parseFloat(selectedEntry.fireMaxRecharge) || minRech);
    const avgRecharge = (minRech + maxRech) / 2;
    const cycleSeconds = avgRecharge + Math.max(0, pulses - 1) * pulseDelay;

    const hullPerShot = parseFloat(linkedProjectile?.projDamage || '35') || 35;
    const shieldPerShot = parseFloat(linkedProjectile?.projShieldDamage || String(hullPerShot)) || hullPerShot;

    const salvoHull = pulses * hullPerShot;
    const salvoShield = pulses * shieldPerShot;
    const hullDps = cycleSeconds > 0 ? salvoHull / cycleSeconds : 0;
    const shieldDps = cycleSeconds > 0 ? salvoShield / cycleSeconds : 0;

    return {
      pulses,
      avgRecharge: avgRecharge.toFixed(2),
      cycleSeconds: cycleSeconds.toFixed(2),
      salvoHull: salvoHull.toFixed(0),
      salvoShield: salvoShield.toFixed(0),
      hullDps: hullDps.toFixed(1),
      shieldDps: shieldDps.toFixed(1),
      laserHex: parseRgbaToHex(linkedProjectile?.projLaserColor || '45, 255, 90, 255')
    };
  }, [selectedEntry, linkedProjectile]);

  const workspaceHpFiles = useMemo(
    () =>
      workspaceFiles.filter(
        f =>
          f.name.toLowerCase().endsWith('.xml') &&
          /hardpoint|projectile|weapon|turret/i.test(f.name)
      ),
    [workspaceFiles]
  );

  const hpCount = entries.filter(e => e.kind === 'hardpoint').length;
  const projCount = entries.filter(e => e.kind === 'projectile').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-none">
      <input
        ref={uploadInputRef}
        type="file"
        accept=".xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const content = ev.target?.result as string;
              const parser = new DOMParser();
              const parsed = parser.parseFromString(content, 'application/xml');
              if (parsed.querySelector('parsererror')) {
                onError('Invalid XML file');
                return;
              }
              setDoc(parsed);
              setEditableFileName(file.name);
              const list = parseDocEntries(parsed);
              setEntries(list);
              setSelectedId(list[0]?.id || null);
            } catch (err: any) {
              onError(err.message || 'Error reading XML');
            }
          };
          reader.readAsText(file);
          if (uploadInputRef.current) uploadInputRef.current.value = '';
        }}
      />

      {/* Top Command Bar */}
      <div className="min-h-14 py-2 bg-slate-900/80 backdrop-blur-md border-b border-amber-900/40 px-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/40 rounded-sm flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-amber-300 font-bold uppercase tracking-widest text-xs font-mono">
                {tr(
                  lang,
                  'HardPoints & Projectiles Editor',
                  'Editor de HardPoints y Proyectiles',
                  'Éditeur de HardPoints & Projectiles'
                )}
              </h2>
              <span className="px-1.5 py-0.5 rounded-sm bg-amber-950/90 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300">
                v1.1
              </span>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                {hpCount} HardPoints · {projCount} {tr(lang, 'Projectiles', 'Proyectiles', 'Projectiles')}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2 mt-1">
              <input
                type="text"
                value={editableFileName}
                onChange={(e) => setEditableFileName(e.target.value)}
                className="bg-slate-950/90 border border-slate-800 focus:border-amber-500/60 rounded-sm px-2 py-0.5 text-[11px] font-mono text-amber-200 outline-none w-56"
              />
              {workspaceHpFiles.length > 0 && onSelectWorkspaceFile && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectWorkspaceFile(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-950 border border-amber-800/50 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-sm outline-none cursor-pointer"
                >
                  <option value="">
                    {tr(lang, `Workspace XML (${workspaceHpFiles.length})`, `XML del Workspace (${workspaceHpFiles.length})`, `XML Workspace (${workspaceHpFiles.length})`)}
                  </option>
                  {workspaceHpFiles.map((f, i) => (
                    <option key={i} value={f.webkitRelativePath || f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-sm p-0.5 mr-1">
            <button
              onClick={() => setViewMode('inspector')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 cursor-pointer ${
                viewMode === 'inspector'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>{tr(lang, 'Inspector & Radar', 'Inspector y Radar', 'Inspecteur & Radar')}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>{tr(lang, 'Table', 'Tabla', 'Tableau')}</span>
            </button>
            <button
              onClick={() => setViewMode('raw_xml')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm flex items-center gap-1 cursor-pointer ${
                viewMode === 'raw_xml'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>XML</span>
            </button>
          </div>

          <button
            onClick={() => handleAddEntry('hardpoint')}
            className="px-2.5 py-1.5 border border-amber-500/50 hover:bg-amber-900/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ HardPoint</span>
          </button>

          <button
            onClick={() => handleAddEntry('projectile')}
            className="px-2.5 py-1.5 border border-cyan-500/50 hover:bg-cyan-900/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Projectile</span>
          </button>

          <button
            onClick={() => uploadInputRef.current?.click()}
            className="p-1.5 border border-slate-700/70 hover:bg-slate-800 text-slate-300 rounded-sm cursor-pointer"
            title={tr(lang, 'Load XML from disk', 'Cargar XML desde disco', 'Charger XML')}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSaveXml}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-[11px] uppercase tracking-widest flex items-center space-x-1.5 rounded-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Save XML', 'Guardar XML', 'Enregistrer XML')}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 rounded-sm ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar List */}
        <div className="w-80 bg-slate-900/50 border-r border-amber-900/30 flex flex-col shrink-0">
          <div className="p-2 border-b border-slate-900 bg-slate-950/70 grid grid-cols-3 gap-1">
            {[
              { id: 'all', label: tr(lang, `All (${entries.length})`, `Todos (${entries.length})`, `Tous (${entries.length})`) },
              { id: 'hardpoint', label: `HardPoints (${hpCount})` },
              { id: 'projectile', label: `Projectiles (${projCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setKindFilter(tab.id as any)}
                className={`py-1 px-1.5 text-[9px] font-mono uppercase rounded-sm cursor-pointer ${
                  kindFilter === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder={tr(lang, 'Filter HardPoints or Projectiles...', 'Filtrar HardPoints o Proyectiles...', 'Filtrer...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs font-mono pl-8 pr-6 py-1 rounded-sm outline-none"
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
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredEntries.map((item) => {
              const isSelected = item.id === selectedId;
              const isHp = item.kind === 'hardpoint';
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-2.5 rounded-sm border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? isHp
                        ? 'bg-amber-950/45 border-amber-500/60 text-amber-200'
                        : 'bg-cyan-950/45 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-950/40 border-slate-800/70 text-slate-300 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs truncate">
                      {item.name}
                    </span>
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-sm ${
                      isHp ? 'text-amber-300 bg-amber-950/80' : 'text-cyan-300 bg-cyan-950/80'
                    }`}>
                      {isHp ? 'HP' : 'PROJ'}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {isHp ? item.hpType.replace('HARD_POINT_', '') : item.projCategory || 'Laser'}
                    </span>
                    <span className="tabular-nums text-slate-300">
                      {isHp
                        ? item.health ? `${item.health} HP` : ''
                        : item.projDamage ? `${item.projDamage} DMG` : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-slate-950/90 flex flex-col overflow-hidden">
          {viewMode === 'table' ? (
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full border-collapse font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="py-2 px-2">Kind</th>
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">Type / Category</th>
                    <th className="py-2 px-2 text-right">Health / Damage</th>
                    <th className="py-2 px-2 text-right">Range / Speed</th>
                    <th className="py-2 px-2">Linked Projectile / Color</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredEntries.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`hover:bg-slate-900/70 cursor-pointer ${
                        selectedId === item.id ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-2">
                        <span className={item.kind === 'hardpoint' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                          {item.tagName}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-200 font-bold">{item.name}</td>
                      <td className="py-2 px-2 text-slate-400">
                        {item.kind === 'hardpoint' ? item.hpType : item.projCategory}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {item.kind === 'hardpoint' ? (
                          <input
                            type="text"
                            value={item.health}
                            onChange={(e) => handleFieldUpdate(item.id, 'Health', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-right text-emerald-300 rounded-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={item.projDamage}
                            onChange={(e) => handleFieldUpdate(item.id, 'Projectile_Damage', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-right text-rose-300 rounded-sm"
                          />
                        )}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {item.kind === 'hardpoint' ? (
                          <input
                            type="text"
                            value={item.fireRangeDistance}
                            onChange={(e) => handleFieldUpdate(item.id, 'Fire_Range_Distance', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-right text-cyan-300 rounded-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={item.projMaxSpeed}
                            onChange={(e) => handleFieldUpdate(item.id, 'Projectile_Max_Speed', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-right text-amber-300 rounded-sm"
                          />
                        )}
                      </td>
                      <td className="py-2 px-2 text-slate-300">
                        {item.kind === 'hardpoint' ? item.fireProjectileType || '—' : item.projLaserColor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === 'raw_xml' ? (
            <div className="flex-1 flex flex-col p-4 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                  {selectedEntry ? `${selectedEntry.tagName} // ${selectedEntry.name}` : 'XML Node'}
                </span>
                <button
                  onClick={handleApplyRawNodeXml}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase rounded-sm cursor-pointer"
                >
                  {tr(lang, 'Apply Node XML', 'Aplicar XML del Nodo', 'Appliquer XML')}
                </button>
              </div>
              <textarea
                value={rawXmlText}
                onChange={(e) => setRawXmlText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 p-3 font-mono text-xs text-slate-200 rounded-sm outline-none resize-none"
                spellCheck={false}
              />
            </div>
          ) : selectedEntry ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Inspector Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                    {selectedEntry.kind === 'hardpoint'
                      ? tr(lang, 'HardPoint Subsystem Configuration', 'Configuración de Subsistema HardPoint', 'Configuration HardPoint')
                      : tr(lang, 'Ordnance & Projectile Ballistics', 'Balística y Munición de Proyectil', 'Balistique de Projectile')}
                  </span>
                  <h3 className="text-lg font-mono font-bold text-slate-100 mt-0.5">
                    {selectedEntry.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDuplicateSelected}
                    className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-200 font-mono text-xs rounded-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Duplicate', 'Duplicar', 'Dupliquer')}</span>
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 border border-rose-800/60 hover:bg-rose-950/50 text-rose-300 font-mono text-xs rounded-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Delete', 'Eliminar', 'Supprimer')}</span>
                  </button>
                </div>
              </div>

              {selectedEntry.kind === 'hardpoint' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Columns: HardPoint Parameters */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-4">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                        {tr(lang, '1. Identity, Mesh & Survivability', '1. Identidad, Huesos 3D y Supervivencia', '1. Identité, Os 3D & Survie')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">HardPoint Name</label>
                          <input
                            type="text"
                            value={selectedEntry.name}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Name', e.target.value, true)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-amber-200 rounded-sm outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Type</label>
                          <select
                            value={selectedEntry.hpType}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Type', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-cyan-200 rounded-sm outline-none focus:border-amber-500"
                          >
                            {HARDPOINT_TYPES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Health (HitPoints)</label>
                          <input
                            type="number"
                            step="25"
                            value={selectedEntry.health}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Health', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-emerald-300 font-bold tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Tooltip_Text (.DAT)</label>
                          <input
                            type="text"
                            value={selectedEntry.tooltipText}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Tooltip_Text', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-purple-200 rounded-sm outline-none"
                          />
                          {selectedEntry.tooltipText && datMap.get(selectedEntry.tooltipText.toUpperCase()) && (
                            <span className="text-[10px] text-emerald-400 block mt-0.5">
                              “{datMap.get(selectedEntry.tooltipText.toUpperCase())}”
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Attachment_Bone (.ALO)</label>
                          <input
                            type="text"
                            value={selectedEntry.attachmentBone}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Attachment_Bone', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Collision_Mesh</label>
                          <input
                            type="text"
                            value={selectedEntry.collisionMesh}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Collision_Mesh', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Is_Targetable</label>
                          <select
                            value={selectedEntry.isTargetable}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Is_Targetable', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Is_Destroyable</label>
                          <select
                            value={selectedEntry.isDestroyable}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Is_Destroyable', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                          {tr(lang, '2. Weapon Firing Arc, Recharge & Projectile Link', '2. Arco de Fuego, Recarga y Proyectil Asociado', '2. Arc de Tir, Recharge & Projectile')}
                        </h4>
                        {linkedProjectile && (
                          <button
                            onClick={() => setSelectedId(linkedProjectile.id)}
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] rounded-sm cursor-pointer"
                          >
                            {tr(lang, `Inspect ${linkedProjectile.name} →`, `Inspeccionar ${linkedProjectile.name} →`, `Inspecter ${linkedProjectile.name} →`)}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Projectile_Type</label>
                          <input
                            type="text"
                            list="projectiles-datalist"
                            value={selectedEntry.fireProjectileType}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Projectile_Type', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-cyan-300 font-bold rounded-sm outline-none"
                          />
                          <datalist id="projectiles-datalist">
                            {entries.filter(e => e.kind === 'projectile').map(p => (
                              <option key={p.id} value={p.name} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Range_Distance</label>
                          <input
                            type="number"
                            step="50"
                            value={selectedEntry.fireRangeDistance}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Range_Distance', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-amber-300 font-bold tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Cone_Width (deg)</label>
                          <input
                            type="number"
                            min="5"
                            max="360"
                            step="5"
                            value={selectedEntry.fireConeWidth}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Cone_Width', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Cone_Height (deg)</label>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            step="5"
                            value={selectedEntry.fireConeHeight}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Cone_Height', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Pulse_Count</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={selectedEntry.firePulseCount}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Pulse_Count', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-emerald-300 font-bold tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Min_Recharge_Seconds</label>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedEntry.fireMinRecharge}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Min_Recharge_Seconds', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Max_Recharge_Seconds</label>
                          <input
                            type="number"
                            step="0.25"
                            value={selectedEntry.fireMaxRecharge}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Max_Recharge_Seconds', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Pulse_Delay_Seconds</label>
                          <input
                            type="number"
                            step="0.05"
                            value={selectedEntry.firePulseDelay}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Pulse_Delay_Seconds', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Bone_A</label>
                          <input
                            type="text"
                            value={selectedEntry.fireBoneA}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Bone_A', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_Bone_B</label>
                          <input
                            type="text"
                            value={selectedEntry.fireBoneB}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_Bone_B', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Fire_SFXEvent</label>
                          <input
                            type="text"
                            value={selectedEntry.fireSfxEvent}
                            onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Fire_SFXEvent', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 2D Firing Arc Radar & Live DPS Telemetry */}
                  <div className="space-y-4">
                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm flex flex-col items-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 self-start mb-2">
                        {tr(lang, '2D Firing Cone Schematic', 'Esquema Táctico del Cono de Disparo', 'Schéma du Cône de Tir 2D')}
                      </span>
                      {(() => {
                        const deg = Math.max(5, Math.min(360, parseFloat(selectedEntry.fireConeWidth) || 120));
                        const halfRad = ((deg / 2) * Math.PI) / 180;
                        const r = 82;
                        const cx = 100;
                        const cy = 100;
                        const x1 = cx + r * Math.sin(-halfRad);
                        const y1 = cy - r * Math.cos(-halfRad);
                        const x2 = cx + r * Math.sin(halfRad);
                        const y2 = cy - r * Math.cos(halfRad);
                        const largeArc = deg > 180 ? 1 : 0;
                        const laserColor = weaponTelemetry?.laserHex || '#22d3ee';

                        return (
                          <svg width="200" height="200" viewBox="0 0 200 200" className="bg-slate-950 border border-slate-800 rounded-sm">
                            <circle cx="100" cy="100" r="82" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                            <circle cx="100" cy="100" r="50" fill="none" stroke="#1e293b" strokeWidth="1" />
                            <line x1="100" y1="10" x2="100" y2="190" stroke="#1e293b" strokeWidth="1" />
                            <line x1="10" y1="100" x2="190" y2="100" stroke="#1e293b" strokeWidth="1" />

                            {deg >= 360 ? (
                              <circle cx="100" cy="100" r="82" fill={laserColor} fillOpacity="0.18" stroke={laserColor} strokeWidth="1.5" />
                            ) : (
                              <path
                                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={laserColor}
                                fillOpacity="0.2"
                                stroke={laserColor}
                                strokeWidth="1.8"
                              />
                            )}

                            {/* Ship Hull Wedge Silhouette */}
                            <polygon
                              points="100,72 86,122 100,115 114,122"
                              fill="#0f172a"
                              stroke="#94a3b8"
                              strokeWidth="1.5"
                            />
                            <circle cx="100" cy="100" r="3.5" fill={laserColor} />
                            <text x="100" y="188" textAnchor="middle" fill="#cbd5e1" fontFamily="monospace" fontSize="9">
                              ARC: {deg.toFixed(0)}° · RNG: {selectedEntry.fireRangeDistance || '0'}u
                            </text>
                          </svg>
                        );
                      })()}
                    </div>

                    {weaponTelemetry && (
                      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-2.5 font-mono">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                          {tr(lang, 'Ballistic Salvo & DPS Output', 'Cálculo de Salva y DPS Efectivo', 'Calcul de Salve & DPS')}
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-950 border border-slate-800 p-2 rounded-sm">
                            <span className="text-[9px] text-slate-500 block uppercase">Hull DPS</span>
                            <span className="text-sm font-bold text-rose-400 tabular-nums">{weaponTelemetry.hullDps} /s</span>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 p-2 rounded-sm">
                            <span className="text-[9px] text-slate-500 block uppercase">Shield DPS</span>
                            <span className="text-sm font-bold text-cyan-400 tabular-nums">{weaponTelemetry.shieldDps} /s</span>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 p-2 rounded-sm">
                            <span className="text-[9px] text-slate-500 block uppercase">Salvo Damage</span>
                            <span className="text-xs font-bold text-amber-300 tabular-nums">{weaponTelemetry.salvoHull} ({weaponTelemetry.pulses}x)</span>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 p-2 rounded-sm">
                            <span className="text-[9px] text-slate-500 block uppercase">Full Cycle</span>
                            <span className="text-xs font-bold text-slate-200 tabular-nums">{weaponTelemetry.cycleSeconds}s</span>
                          </div>
                        </div>

                        {/* Target Class TTK Simulator (v1.1) */}
                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                            {tr(
                              lang,
                              'Target Class TTK (1x Turret / 4x Battery)',
                              'Simulador TTK por Objetivo (1x Torreta / Batería 4x)',
                              'Simulateur TTK par Cible (1x Tourelle / 4x Batterie)'
                            )}
                          </span>
                          {[
                            { name: tr(lang, 'Corvette (1.4k EHP)', 'Corbeta (1.4k EHP)', 'Corvette (1.4k)'), shd: 500, hull: 900 },
                            { name: tr(lang, 'Frigate (3.8k EHP)', 'Fragata (3.8k EHP)', 'Frégate (3.8k)'), shd: 1400, hull: 2400 },
                            { name: tr(lang, 'Capital (9.5k EHP)', 'Capital (9.5k EHP)', 'Capital (9.5k)'), shd: 3500, hull: 6000 },
                            { name: tr(lang, 'Starbase (18k EHP)', 'Estación (18k EHP)', 'Base Spatiale (18k)'), shd: 7500, hull: 10500 }
                          ].map((tgt, idx) => {
                            const sDps = Math.max(1, parseFloat(weaponTelemetry.shieldDps) || 15);
                            const hDps = Math.max(1, parseFloat(weaponTelemetry.hullDps) || 15);
                            const singleSec = Math.round(tgt.shd / sDps + tgt.hull / hDps);
                            const quadSec = Math.max(1, Math.round(singleSec / 4));
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[10px] bg-slate-950/90 border border-slate-800/80 px-2 py-1 rounded-xs tabular-nums"
                              >
                                <span className="text-slate-300">{tgt.name}</span>
                                <span className="text-cyan-300 font-bold">
                                  {singleSec}s <span className="text-slate-500">/</span>{' '}
                                  <span className="text-emerald-400">{quadSec}s (4x)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* PROJECTILE INSPECTOR */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                      {tr(lang, 'Projectile Damage, Speed & Geometry', 'Daño, Velocidad y Geometría del Proyectil', 'Dégâts, Vitesse & Géométrie du Projectile')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile Name</label>
                        <input
                          type="text"
                          value={selectedEntry.name}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Name', e.target.value, true)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-cyan-200 rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Category</label>
                        <select
                          value={selectedEntry.projCategory}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Category', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-amber-200 rounded-sm outline-none"
                        >
                          {PROJECTILE_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Damage (Hull)</label>
                        <input
                          type="number"
                          step="5"
                          value={selectedEntry.projDamage}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Damage', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-rose-300 font-bold tabular-nums rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Shield_Damage</label>
                        <input
                          type="number"
                          step="5"
                          value={selectedEntry.projShieldDamage}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Shield_Damage', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-cyan-300 font-bold tabular-nums rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Max_Flight_Distance</label>
                        <input
                          type="number"
                          step="50"
                          value={selectedEntry.projMaxFlightDist}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Max_Flight_Distance', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Max_Speed</label>
                        <input
                          type="number"
                          step="1"
                          value={selectedEntry.projMaxSpeed}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Max_Speed', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-amber-300 tabular-nums rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Width</label>
                        <input
                          type="number"
                          step="0.5"
                          value={selectedEntry.projWidth}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Width', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">Projectile_Length</label>
                        <input
                          type="number"
                          step="1"
                          value={selectedEntry.projLength}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Length', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 tabular-nums rounded-sm outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase block mb-1">
                          Projectile_Object_Detonation_Particle
                        </label>
                        <input
                          type="text"
                          value={selectedEntry.projExplosionParticle}
                          onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Object_Detonation_Particle', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-slate-200 rounded-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Projectile Laser Color Picker & Preview */}
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-sm space-y-4 font-mono">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                      {tr(lang, 'Laser Bolt Color (R, G, B, A)', 'Color del Haz Láser (R, G, B, A)', 'Couleur du Laser (R, G, B, A)')}
                    </span>

                    <div className="h-24 bg-slate-950 border border-slate-800 rounded-sm flex items-center justify-center relative overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: '130px',
                          backgroundColor: parseRgbaToHex(selectedEntry.projLaserColor),
                          boxShadow: `0 0 18px ${parseRgbaToHex(selectedEntry.projLaserColor)}`
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={parseRgbaToHex(selectedEntry.projLaserColor)}
                        onChange={(e) =>
                          handleFieldUpdate(
                            selectedEntry.id,
                            'Projectile_Laser_Color',
                            hexToRgbaString(e.target.value, 255)
                          )
                        }
                        className="w-10 h-8 bg-slate-950 border border-slate-700 rounded-sm cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedEntry.projLaserColor}
                        onChange={(e) => handleFieldUpdate(selectedEntry.id, 'Projectile_Laser_Color', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 rounded-sm outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {[
                        { label: 'Imperial Green', val: '45, 255, 90, 255' },
                        { label: 'Rebel Red', val: '255, 55, 55, 255' },
                        { label: 'Ion Blue', val: '70, 175, 255, 255' },
                        { label: 'Proton Gold', val: '255, 195, 45, 255' },
                        { label: 'Plasma Purple', val: '190, 90, 255, 255' },
                        { label: 'Mandalorian', val: '255, 140, 30, 255' }
                      ].map(p => (
                        <button
                          key={p.label}
                          onClick={() => handleFieldUpdate(selectedEntry.id, 'Projectile_Laser_Color', p.val)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-sm text-slate-300 cursor-pointer truncate"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-amber-500/60 text-amber-200 px-4 py-2 rounded-sm font-mono text-xs flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
