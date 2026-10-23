import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import {
  Save,
  X,
  Download,
  AlignLeft,
  Trash2,
  Search,
  Replace,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Code,
  FileCode,
  Plus,
  Sparkles,
  Undo2,
  Redo2,
  Upload,
  Filter,
  ArrowUp,
  ArrowDown,
  Eye,
  Wrench,
  BookOpen,
  Minimize2,
  MessageSquareOff,
  Sliders,
  Folder
} from 'lucide-react';
import { useTranslation, useLanguage } from '../i18n';
import xmlFormat from 'xml-formatter';
import { EAW_TAGS } from '../data/eawTags';
import { DatRecord } from '../lib/dat';

export interface XmlEditorProps {
  initialContent: string;
  fileName: string;
  onClose: () => void;
  onSave: (content: string, fileName: string) => void;
  workspaceFiles?: File[];
  onSelectWorkspaceXml?: (path: string) => void;
  datRecords?: DatRecord[] | null;
}

export interface TagMetadata {
  tag: string;
  category: 'combat' | 'movement' | 'ai' | 'galaxy' | 'abilities' | 'audio' | 'ui' | 'models' | 'general';
  descEn: string;
  descEs: string;
  example?: string;
}

const RICH_TAG_CATALOG: Record<string, Omit<TagMetadata, 'tag'>> = {
  // UI & Localization
  Text_ID: {
    category: 'ui',
    descEn: 'Primary localization key in MasterTextFile.dat for the object name.',
    descEs: 'Clave principal de traducción en MasterTextFile.dat para el nombre del objeto.',
    example: 'TEXT_UNIT_STAR_DESTROYER'
  },
  Encyclopedia_Text: {
    category: 'ui',
    descEn: 'Localization key(s) displayed in the tactical/galactic tooltip encyclopedia.',
    descEs: 'Clave(s) .DAT mostradas en la descripción enciclopédica del tooltip.',
    example: 'TEXT_TOOLTIP_STAR_DESTROYER'
  },
  Encyclopedia_Unit_Class: {
    category: 'ui',
    descEn: 'Localization key indicating the unit class subtitle (e.g. Capital, Frigate, Fighter).',
    descEs: 'Clave .DAT que indica el subtítulo de clase de unidad (Capital, Fragata, Caza).',
    example: 'TEXT_ENCYCLOPEDIA_CLASS_CAPITAL'
  },
  Encyclopedia_Good_Against: {
    category: 'ui',
    descEn: 'Space/comma-separated list of unit Text_IDs this unit excels against.',
    descEs: 'Lista de Text_IDs de unidades contra las que esta unidad es fuerte.',
    example: 'TEXT_UNIT_CORELLIAN_CORVETTE TEXT_UNIT_NEBULON_B'
  },
  Encyclopedia_Vulnerable_To: {
    category: 'ui',
    descEn: 'Space/comma-separated list of unit Text_IDs that counter this unit.',
    descEs: 'Lista de Text_IDs de unidades ante las cuales esta unidad es vulnerable.',
    example: 'TEXT_UNIT_Y_WING TEXT_UNIT_B_WING'
  },
  Icon_Name: {
    category: 'ui',
    descEn: '2D command bar icon name mapped inside an .MTD MegaTexture atlas.',
    descEs: 'Nombre del icono 2D en la barra de comando mapeado en un archivo .MTD.',
    example: 'i_button_imperator.tga'
  },
  GUI_Row: {
    category: 'ui',
    descEn: 'Production build bar row index (0 = top row, 1 = bottom row).',
    descEs: 'Fila en la barra de construcción (0 = fila superior, 1 = fila inferior).',
    example: '1'
  },
  // Models & Visuals
  Space_Model_Name: {
    category: 'models',
    descEn: '3D Alamo model (.ALO) used when rendering the unit in space battles.',
    descEs: 'Modelo 3D Alamo (.ALO) utilizado para renderizar la unidad en batallas espaciales.',
    example: 'EV_StarDestroyer.ALO'
  },
  Land_Model_Name: {
    category: 'models',
    descEn: '3D Alamo model (.ALO) used when rendering the unit in ground battles.',
    descEs: 'Modelo 3D Alamo (.ALO) utilizado en batallas terrestres.',
    example: 'EI_Stormtrooper.ALO'
  },
  Galactic_Model_Name: {
    category: 'models',
    descEn: '3D model (.ALO) used on the Galactic Conquest star map.',
    descEs: 'Modelo 3D (.ALO) mostrado sobre el mapa estelar de Conquista Galáctica.',
    example: 'W_Planet_Temperate01.alo'
  },
  Scale_Factor: {
    category: 'models',
    descEn: 'Visual multiplier applied to the 3D .ALO model size.',
    descEs: 'Multiplicador de escala visual aplicado al tamaño del modelo 3D .ALO.',
    example: '1.0'
  },
  Variant_Of_Existing_Type: {
    category: 'models',
    descEn: 'Inherits all XML tags and properties from the specified base unit Name.',
    descEs: 'Hereda todas las etiquetas y propiedades XML de la unidad base indicada.',
    example: 'Generic_Star_Destroyer'
  },
  Attachment_Bone: {
    category: 'models',
    descEn: '3D skeleton bone name on the parent model where this HardPoint attaches.',
    descEs: 'Nombre del hueso 3D del modelo principal donde se ancla este HardPoint.',
    example: 'HP_Turbolaser_01'
  },
  Fire_Bone_A: {
    category: 'models',
    descEn: 'Primary muzzle bone name from which projectiles spawn when firing.',
    descEs: 'Hueso principal del cañón desde donde se disparan los proyectiles.',
    example: 'FP_Turbolaser_01A'
  },
  Fire_Bone_B: {
    category: 'models',
    descEn: 'Secondary muzzle bone name for dual-barrel turrets or alternating fire.',
    descEs: 'Hueso secundario para torretas de doble cañón o fuego alterno.',
    example: 'FP_Turbolaser_01B'
  },
  Collision_Box_Modifier: {
    category: 'models',
    descEn: 'Multiplier adjusting the physical hitbox/selection bounds of the model.',
    descEs: 'Multiplicador que ajusta el tamaño de la caja de colisión del modelo.',
    example: '1.2'
  },
  // Combat, Health & Weapons
  Tactical_Health: {
    category: 'combat',
    descEn: 'Total hull hit points in tactical battles (if not split into destructible HardPoints).',
    descEs: 'Puntos de vida totales del casco en combate táctico.',
    example: '7500'
  },
  Shield_Points: {
    category: 'combat',
    descEn: 'Maximum energy shield capacity before hull or HardPoints take damage.',
    descEs: 'Capacidad máxima de escudos de energía antes de recibir daño al casco.',
    example: '3000'
  },
  Shield_Refresh_Rate: {
    category: 'combat',
    descEn: 'Shield points regenerated per second while shields are online.',
    descEs: 'Puntos de escudo regenerados por segundo mientras el generador esté activo.',
    example: '50'
  },
  Armor_Type: {
    category: 'combat',
    descEn: 'Armor classification defined in ArmorTypes matching Damage_To_Armor_Mod tables.',
    descEs: 'Tipo de blindaje que determina los multiplicadores de daño recibido.',
    example: 'Armor_Star_Destroyer'
  },
  Shield_Armor_Type: {
    category: 'combat',
    descEn: 'Armor classification specifically used for shield damage calculations.',
    descEs: 'Clasificación de blindaje específica para el cálculo de daño contra escudos.',
    example: 'Shield_Capital'
  },
  HardPoints: {
    category: 'combat',
    descEn: 'Comma-separated list of HardPoint names mounted on this unit.',
    descEs: 'Lista separada por comas de los HardPoints montados en esta unidad.',
    example: 'HP_Star_Destroyer_Shield_Gen, HP_Star_Destroyer_Engines, HP_Star_Destroyer_Weapon_01'
  },
  CategoryMask: {
    category: 'combat',
    descEn: 'Unit classification flags used by targeting priorities and AI evaluators.',
    descEs: 'Máscara de categoría de unidad usada por prioridades de puntería y la IA.',
    example: 'Capital | AntiFrigate'
  },
  Damage_Type: {
    category: 'combat',
    descEn: 'Damage classification matched against target Armor_Type.',
    descEs: 'Tipo de daño que se compara contra el Armor_Type del objetivo.',
    example: 'Damage_Turbolaser'
  },
  Projectile_Types: {
    category: 'combat',
    descEn: 'Name of the Projectile XML object fired by this unit or weapon.',
    descEs: 'Nombre del objeto Projectile disparado por esta unidad o arma.',
    example: 'Proj_Ship_Turbolaser_Green'
  },
  Projectile_Damage: {
    category: 'combat',
    descEn: 'Direct hit damage inflicted by a single projectile impact.',
    descEs: 'Daño directo infligido por el impacto de cada proyectil.',
    example: '40.0'
  },
  Projectile_Max_Flight_Distance: {
    category: 'combat',
    descEn: 'Maximum travel range of the projectile before dissipating.',
    descEs: 'Alcance máximo de vuelo del proyectil antes de disiparse.',
    example: '1800.0'
  },
  Projectile_Max_Speed: {
    category: 'combat',
    descEn: 'Velocity of the projectile in tactical units per second.',
    descEs: 'Velocidad de desplazamiento del proyectil en combate táctico.',
    example: '25.0'
  },
  Fire_Pulse_Count: {
    category: 'combat',
    descEn: 'Number of shots fired per burst cycle.',
    descEs: 'Número de disparos efectuados en cada ráfaga.',
    example: '4'
  },
  Fire_Pulse_Delay_Seconds: {
    category: 'combat',
    descEn: 'Delay in seconds between individual shots within a burst.',
    descEs: 'Tiempo en segundos entre cada disparo individual dentro de una ráfaga.',
    example: '0.2'
  },
  Fire_Recharge_Seconds: {
    category: 'combat',
    descEn: 'Cooldown time in seconds between weapon bursts.',
    descEs: 'Tiempo de recarga en segundos entre ráfagas de disparo.',
    example: '3.0'
  },
  Fire_Cone_Width: {
    category: 'combat',
    descEn: 'Horizontal firing arc in degrees for this turret or HardPoint.',
    descEs: 'Arco horizontal de disparo en grados para esta torreta o HardPoint.',
    example: '140.0'
  },
  Fire_Cone_Height: {
    category: 'combat',
    descEn: 'Vertical firing arc in degrees for this turret or HardPoint.',
    descEs: 'Arco vertical de disparo en grados para esta torreta o HardPoint.',
    example: '90.0'
  },
  Targeting_Max_Attack_Distance: {
    category: 'combat',
    descEn: 'Maximum range at which the unit or HardPoint can acquire targets.',
    descEs: 'Distancia máxima a la que la unidad o HardPoint puede adquirir objetivos.',
    example: '1600.0'
  },
  Targeting_Priority_Set: {
    category: 'combat',
    descEn: 'Reference to a TargetingPrioritySet defining preferred enemy classes.',
    descEs: 'Conjunto de prioridad de blancos que define qué clases enemigas atacar primero.',
    example: 'Capital'
  },
  Starting_Spawned_Units_Tech_0: {
    category: 'combat',
    descEn: 'Fighter/bomber squadrons held in hangar reserve and launched automatically.',
    descEs: 'Escuadrones en el hangar desplegados automáticamente al entrar en combate.',
    example: 'TIE_Fighter_Squadron, 2'
  },
  Reserve_Spawned_Units_Tech_0: {
    category: 'combat',
    descEn: 'Total replacement squadrons kept in hangar reserves after initial launch.',
    descEs: 'Escuadrones de reemplazo disponibles en la reserva del hangar.',
    example: 'TIE_Fighter_Squadron, 4'
  },
  // Movement & Physics
  Max_Speed: {
    category: 'movement',
    descEn: 'Maximum forward movement speed in tactical space or land mode.',
    descEs: 'Velocidad máxima de avance en combate táctico espacial o terrestre.',
    example: '1.8'
  },
  Max_Rate_Of_Turn: {
    category: 'movement',
    descEn: 'Turning speed in degrees per second.',
    descEs: 'Velocidad de giro en grados por segundo.',
    example: '0.4'
  },
  Max_Thrust: {
    category: 'movement',
    descEn: 'Acceleration thrust force applied when changing speed.',
    descEs: 'Fuerza de aceleración / empuje de los motores.',
    example: '0.2'
  },
  Hyperspace: {
    category: 'movement',
    descEn: 'Whether the space unit is equipped with a hyperdrive (Yes / No).',
    descEs: 'Indica si la nave cuenta con hiperimpulsor para viajar entre sistemas (Yes / No).',
    example: 'Yes'
  },
  Hyperspace_Speed: {
    category: 'movement',
    descEn: 'Travel speed multiplier along trade routes on the galactic map.',
    descEs: 'Multiplicador de velocidad de viaje por hiperrutas en el mapa galáctico.',
    example: '1.5'
  },
  Space_Layer: {
    category: 'movement',
    descEn: 'Vertical Z-plane layer in space battles (Fighter, Corvette, Frigate, Capital, Super).',
    descEs: 'Capa de altura Z en batallas espaciales (Fighter, Corvette, Frigate, Capital, Super).',
    example: 'Capital'
  },
  MovementClass: {
    category: 'movement',
    descEn: 'Locomotion type defining terrain passability (Space, Infantry, Vehicle, Hover, Walker).',
    descEs: 'Clase de movimiento que define qué terrenos puede cruzar.',
    example: 'Space'
  },
  // Galaxy, Cost & Economy
  Affiliation: {
    category: 'galaxy',
    descEn: 'Faction(s) that own or can construct this object (Empire, Rebel, Underworld, Neutral).',
    descEs: 'Facción o facciones que poseen o pueden construir este objeto.',
    example: 'Empire'
  },
  Tech_Level: {
    category: 'galaxy',
    descEn: 'Minimum faction technology tier required to build this unit (0-5, or 99 to lock).',
    descEs: 'Nivel tecnológico mínimo para producir la unidad (0-5, o 99 para bloquear).',
    example: '4'
  },
  Build_Cost_Credits: {
    category: 'galaxy',
    descEn: 'Galactic credit cost to construct the unit in campaign mode.',
    descEs: 'Coste en créditos galácticos para construir la unidad en campaña.',
    example: '5500'
  },
  Build_Time_Seconds: {
    category: 'galaxy',
    descEn: 'Base construction duration in seconds at a single production facility.',
    descEs: 'Tiempo base de construcción en segundos.',
    example: '60'
  },
  Tactical_Build_Cost_Multiplayer: {
    category: 'galaxy',
    descEn: 'Credit cost to purchase this unit in Skirmish / Multiplayer mode.',
    descEs: 'Coste en créditos para comprar la unidad en modo Escaramuza / Multijugador.',
    example: '5200'
  },
  Required_Star_Base_Level: {
    category: 'galaxy',
    descEn: 'Minimum orbital starbase level (1-5) required to construct this space unit.',
    descEs: 'Nivel mínimo de estación espacial (1-5) requerido para construir esta nave.',
    example: '4'
  },
  Required_Ground_Base_Level: {
    category: 'galaxy',
    descEn: 'Minimum ground base level required to construct this land unit.',
    descEs: 'Nivel mínimo de base terrestre requerido para producir esta unidad.',
    example: '2'
  },
  Required_Special_Structures: {
    category: 'galaxy',
    descEn: 'Specific planetary building(s) required before this unit can be produced.',
    descEs: 'Estructura(s) especial(es) requeridas en el planeta para producir la unidad.',
    example: 'E_Ground_Light_Vehicle_Factory'
  },
  Required_Planets: {
    category: 'galaxy',
    descEn: 'Restricts production of this unit solely to the specified planet Name(s).',
    descEs: 'Restringe la producción de esta unidad exclusivamente a los planetas indicados.',
    example: 'Kuat, Fondor, Corellia'
  },
  Population_Value: {
    category: 'galaxy',
    descEn: 'Galactic population cap points consumed by this unit or company.',
    descEs: 'Puntos de límite de población galáctica que consume esta unidad.',
    example: '4'
  },
  Space_Capacity: {
    category: 'galaxy',
    descEn: 'Tactical fleet pop-cap weight consumed when deployed into space battle.',
    descEs: 'Capacidad táctica de flota que ocupa al desplegarse en batalla espacial.',
    example: '4'
  },
  Galactic_Position: {
    category: 'galaxy',
    descEn: '3D coordinates (X, Y, Z) of a planet on the Galactic Conquest star map.',
    descEs: 'Coordenadas 3D (X, Y, Z) de un planeta en el mapa de Conquista Galáctica.',
    example: '120.0, -85.0, 10.0'
  },
  Planet_Credit_Value: {
    category: 'galaxy',
    descEn: 'Base tax income generated by this planet each galactic cycle.',
    descEs: 'Ingresos base en créditos generados por este planeta en cada ciclo galáctico.',
    example: '150'
  },
  // AI & Threat
  AI_Combat_Power: {
    category: 'ai',
    descEn: 'Numeric combat rating used by the AI and Auto-Resolve to evaluate fleet strength.',
    descEs: 'Valor numérico de poder de combate usado por la IA y el Auto-Resolver.',
    example: '4500'
  },
  Space_FOW_Reveal_Range: {
    category: 'ai',
    descEn: 'Fog of War sight radius in space tactical battles.',
    descEs: 'Radio de visión para revelar la Niebla de Guerra en batallas espaciales.',
    example: '2200.0'
  },
  Land_FOW_Reveal_Range: {
    category: 'ai',
    descEn: 'Fog of War sight radius in ground tactical battles.',
    descEs: 'Radio de visión para revelar la Niebla de Guerra en batallas terrestres.',
    example: '400.0'
  },
  Behavior: {
    category: 'ai',
    descEn: 'Top-level engine behavior flags (e.g. DUMMY_STARSHIP, SELECTABLE, TRANSPORT).',
    descEs: 'Comportamientos principales del motor (ej. DUMMY_STARSHIP, SELECTABLE, TRANSPORT).',
    example: 'DUMMY_STARSHIP, SELECTABLE, POWERED, SHIELDED'
  },
  SpaceBehavior: {
    category: 'ai',
    descEn: 'Active subsystem behaviors in space battles (ABILITY_COUNTDOWN, SPAWN_SQUADRON, TARGETING).',
    descEs: 'Comportamientos activos en batallas espaciales (ABILITY_COUNTDOWN, SPAWN_SQUADRON, TARGETING).',
    example: 'ABILITY_COUNTDOWN, SIMPLE_SPACE_LOCOMOTOR, TARGETING, POWERED, SHIELDED, HIDE_WHEN_FOGGED, REVEAL, UNIT_AI, DAMAGE_TRACKING'
  },
  LandBehavior: {
    category: 'ai',
    descEn: 'Active subsystem behaviors in ground battles (WALK_LOCOMOTOR, TURRET, TARGETING).',
    descEs: 'Comportamientos activos en batallas terrestres (WALK_LOCOMOTOR, TURRET, TARGETING).',
    example: 'ABILITY_COUNTDOWN, WALK_LOCOMOTOR, IDLE, TARGETING, WEAPON, REVEAL, HIDE_WHEN_FOGGED, UNIT_AI'
  },
  // Abilities
  Unit_Abilities_Data: {
    category: 'abilities',
    descEn: 'Container block defining active and passive abilities for the unit.',
    descEs: 'Bloque contenedor que define las habilidades activas y pasivas de la unidad.',
    example: '<Unit_Ability>\n\t<Type>POWER_TO_WEAPONS</Type>\n</Unit_Ability>'
  },
  Abilities: {
    category: 'abilities',
    descEn: 'Container block for passive/special ability modifiers (Ion_Cannon_Shot_Attack_Ability, Tractor_Beam).',
    descEs: 'Bloque contenedor para modificadores de habilidades especiales o pasivas.',
    example: '<Tractor_Beam_Attack_Ability Name="ISD_Tractor_Beam">...</Tractor_Beam_Attack_Ability>'
  },
  // Audio
  SFXEvent_Select: {
    category: 'audio',
    descEn: 'Sound effect event triggered when the player selects this unit.',
    descEs: 'Evento de sonido (SFXEvent) reproducido al seleccionar la unidad.',
    example: 'Unit_Select_Star_Destroyer'
  },
  SFXEvent_Move: {
    category: 'audio',
    descEn: 'Sound effect event triggered when issuing a movement order.',
    descEs: 'Evento de sonido reproducido al ordenar movimiento a la unidad.',
    example: 'Unit_Move_Star_Destroyer'
  },
  SFXEvent_Attack: {
    category: 'audio',
    descEn: 'Sound effect event triggered when issuing an attack order.',
    descEs: 'Evento de sonido reproducido al ordenar atacar a un objetivo.',
    example: 'Unit_Attack_Star_Destroyer'
  },
  SFXEvent_Fire: {
    category: 'audio',
    descEn: 'Sound effect played each time the weapon or HardPoint fires.',
    descEs: 'Efecto de sonido reproducido cada vez que el arma o HardPoint dispara.',
    example: 'Unit_Turbolaser_Fire'
  }
};

function inferCategoryAndDesc(tag: string): TagMetadata {
  if (RICH_TAG_CATALOG[tag]) {
    return { tag, ...RICH_TAG_CATALOG[tag] };
  }
  const lower = tag.toLowerCase();
  if (lower.includes('sfx') || lower.includes('audio') || lower.includes('music') || lower.includes('voice') || lower.includes('speech')) {
    return {
      tag,
      category: 'audio',
      descEn: `Audio & SFX engine property (${tag.replace(/_/g, ' ')}).`,
      descEs: `Propiedad de sonido o audio del motor (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('ability') || lower.includes('abilities') || lower.includes('recharge') || lower.includes('cooldown')) {
    return {
      tag,
      category: 'abilities',
      descEn: `Unit ability parameter (${tag.replace(/_/g, ' ')}).`,
      descEs: `Parámetro de habilidad de unidad (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('projectile') || lower.includes('damage') || lower.includes('fire') || lower.includes('weapon') || lower.includes('shield') || lower.includes('health') || lower.includes('armor') || lower.includes('turret') || lower.includes('hardpoint') || lower.includes('attack') || lower.includes('target')) {
    return {
      tag,
      category: 'combat',
      descEn: `Combat, weapon, or survivability attribute (${tag.replace(/_/g, ' ')}).`,
      descEs: `Atributo de combate, armamento o supervivencia (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('speed') || lower.includes('turn') || lower.includes('thrust') || lower.includes('move') || lower.includes('locomotor') || lower.includes('hyperspace') || lower.includes('layer')) {
    return {
      tag,
      category: 'movement',
      descEn: `Locomotion and physics parameter (${tag.replace(/_/g, ' ')}).`,
      descEs: `Parámetro de movimiento y física (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('ai_') || lower.includes('threat') || lower.includes('fow') || lower.includes('behavior') || lower.includes('autoresolve') || lower.includes('goal')) {
    return {
      tag,
      category: 'ai',
      descEn: `AI evaluation, Fog of War, or behavior tag (${tag.replace(/_/g, ' ')}).`,
      descEs: `Etiqueta de IA, Niebla de Guerra o comportamiento (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('model') || lower.includes('bone') || lower.includes('anim') || lower.includes('scale') || lower.includes('particle') || lower.includes('decal') || lower.includes('mesh') || lower.includes('variant')) {
    return {
      tag,
      category: 'models',
      descEn: `3D model, bone attachment, or visual effect tag (${tag.replace(/_/g, ' ')}).`,
      descEs: `Etiqueta de modelo 3D, hueso o efecto visual (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('text_') || lower.includes('icon') || lower.includes('encyclopedia') || lower.includes('gui') || lower.includes('radar') || lower.includes('tooltip')) {
    return {
      tag,
      category: 'ui',
      descEn: `UI, icon, or localization reference (${tag.replace(/_/g, ' ')}).`,
      descEs: `Referencia de interfaz, icono o localización (${tag.replace(/_/g, ' ')}).`
    };
  }
  if (lower.includes('build') || lower.includes('cost') || lower.includes('credit') || lower.includes('planet') || lower.includes('galactic') || lower.includes('tech') || lower.includes('affiliation') || lower.includes('population') || lower.includes('star_base')) {
    return {
      tag,
      category: 'galaxy',
      descEn: `Galactic economy, production, or campaign property (${tag.replace(/_/g, ' ')}).`,
      descEs: `Propiedad de economía galáctica, producción o campaña (${tag.replace(/_/g, ' ')}).`
    };
  }
  return {
    tag,
    category: 'general',
    descEn: `Empire at War XML property (${tag.replace(/_/g, ' ')}).`,
    descEs: `Propiedad XML de Empire at War (${tag.replace(/_/g, ' ')}).`
  };
}

export const EAW_TAG_DEFINITIONS: { tag: string; desc: string }[] = Array.from(new Set(EAW_TAGS))
  .sort()
  .map(tag => {
    const meta = inferCategoryAndDesc(tag);
    return {
      tag,
      desc: meta.descEn
    };
  });

const FULL_TAG_METADATA: TagMetadata[] = Array.from(new Set([...Object.keys(RICH_TAG_CATALOG), ...EAW_TAGS]))
  .sort()
  .map(tag => inferCategoryAndDesc(tag));

interface XmlTemplate {
  id: string;
  nameEn: string;
  nameEs: string;
  descEn: string;
  descEs: string;
  badge: string;
  code: string;
}

const XML_TEMPLATES: XmlTemplate[] = [
  {
    id: 'space_unit',
    nameEn: 'Space Unit (Capital / Frigate)',
    nameEs: 'Unidad Espacial (Capital / Fragata)',
    descEn: 'Complete SpaceUnit block with shields, locomotor, FOW, production cost, and HardPoints.',
    descEs: 'Bloque completo de SpaceUnit con escudos, movimiento, coste de producción y HardPoints.',
    badge: 'SpaceUnit',
    code: `\t<SpaceUnit Name="Custom_Capital_Ship">
\t\t<Text_ID>TEXT_UNIT_CUSTOM_CAPITAL_SHIP</Text_ID>
\t\t<Encyclopedia_Unit_Class>TEXT_ENCYCLOPEDIA_CLASS_CAPITAL</Encyclopedia_Unit_Class>
\t\t<Encyclopedia_Text>TEXT_TOOLTIP_CUSTOM_CAPITAL_SHIP</Encyclopedia_Text>
\t\t<Icon_Name>i_button_imperator.tga</Icon_Name>
\t\t<Space_Model_Name>EV_StarDestroyer.ALO</Space_Model_Name>
\t\t<Scale_Factor>1.0</Scale_Factor>
\t\t<Affiliation>Empire</Affiliation>
\t\t<Tech_Level>3</Tech_Level>
\t\t<Required_Star_Base_Level>3</Required_Star_Base_Level>
\t\t<Build_Cost_Credits>4800</Build_Cost_Credits>
\t\t<Build_Time_Seconds>55</Build_Time_Seconds>
\t\t<Population_Value>4</Population_Value>
\t\t<Space_Capacity>4</Space_Capacity>
\t\t<CategoryMask>Capital | AntiFrigate</CategoryMask>
\t\t<Space_Layer>Capital</Space_Layer>
\t\t<Tactical_Health>6500</Tactical_Health>
\t\t<Shield_Points>2500</Shield_Points>
\t\t<Shield_Refresh_Rate>45</Shield_Refresh_Rate>
\t\t<Armor_Type>Armor_Star_Destroyer</Armor_Type>
\t\t<Shield_Armor_Type>Shield_Capital</Shield_Armor_Type>
\t\t<Max_Speed>1.6</Max_Speed>
\t\t<Max_Rate_Of_Turn>0.35</Max_Rate_Of_Turn>
\t\t<Max_Thrust>0.18</Max_Thrust>
\t\t<Hyperspace>Yes</Hyperspace>
\t\t<Hyperspace_Speed>1.5</Hyperspace_Speed>
\t\t<Space_FOW_Reveal_Range>2000.0</Space_FOW_Reveal_Range>
\t\t<Targeting_Max_Attack_Distance>1600.0</Targeting_Max_Attack_Distance>
\t\t<AI_Combat_Power>4200</AI_Combat_Power>
\t\t<Behavior>DUMMY_STARSHIP, SELECTABLE, POWERED, SHIELDED</Behavior>
\t\t<SpaceBehavior>ABILITY_COUNTDOWN, SIMPLE_SPACE_LOCOMOTOR, TARGETING, POWERED, SHIELDED, HIDE_WHEN_FOGGED, REVEAL, UNIT_AI, DAMAGE_TRACKING</SpaceBehavior>
\t\t<HardPoints>
\t\t\tHP_Star_Destroyer_Shield_Gen,
\t\t\tHP_Star_Destroyer_Engines,
\t\t\tHP_Star_Destroyer_Weapon_01
\t\t</HardPoints>
\t</SpaceUnit>`
  },
  {
    id: 'variant_unit',
    nameEn: 'Unit Variant (Inheritance)',
    nameEs: 'Variante de Unidad (Herencia)',
    descEn: 'Lightweight unit definition inheriting properties via <Variant_Of_Existing_Type>.',
    descEs: 'Definición ligera que hereda todas las propiedades mediante <Variant_Of_Existing_Type>.',
    badge: 'Variant',
    code: `\t<SpaceUnit Name="Custom_Ship_Variant">
\t\t<Variant_Of_Existing_Type>Generic_Star_Destroyer</Variant_Of_Existing_Type>
\t\t<Text_ID>TEXT_UNIT_CUSTOM_SHIP_VARIANT</Text_ID>
\t\t<Encyclopedia_Text>TEXT_TOOLTIP_CUSTOM_SHIP_VARIANT</Encyclopedia_Text>
\t\t<Affiliation>Empire</Affiliation>
\t\t<Tech_Level>4</Tech_Level>
\t\t<Build_Cost_Credits>5200</Build_Cost_Credits>
\t\t<Shield_Points>3200</Shield_Points>
\t\t<Tactical_Health>7800</Tactical_Health>
\t\t<AI_Combat_Power>4800</AI_Combat_Power>
\t</SpaceUnit>`
  },
  {
    id: 'hardpoint',
    nameEn: 'HardPoint (Weapon / Subsystem)',
    nameEs: 'HardPoint (Torreta / Subsistema)',
    descEn: 'Destructible HardPoint block with bone attachment, fire cone, and projectile config.',
    descEs: 'Bloque de HardPoint destructible con huesos de anclaje, arco de fuego y proyectil.',
    badge: 'HardPoint',
    code: `\t<HardPoint Name="HP_Custom_Turbolaser_01">
\t\t<Type>HARD_POINT_WEAPON_LASER</Type>
\t\t<Is_Targetable>Yes</Is_Targetable>
\t\t<Is_Destroyable>Yes</Is_Destroyable>
\t\t<Tooltip_Text>TEXT_WEAPON_TURBOLASER</Tooltip_Text>
\t\t<Health>450.0</Health>
\t\t<Attachment_Bone>HP_TL_01</Attachment_Bone>
\t\t<Collision_Mesh>HP_TL_01</Collision_Mesh>
\t\t<Damage_Decal>HP_TL_01_B</Damage_Decal>
\t\t<Damage_Particles>HP_TL_01_Emit</Damage_Particles>
\t\t<Fire_Bone_A>FP_TL_01A</Fire_Bone_A>
\t\t<Fire_Bone_B>FP_TL_01B</Fire_Bone_B>
\t\t<Fire_Cone_Width>130.0</Fire_Cone_Width>
\t\t<Fire_Cone_Height>80.0</Fire_Cone_Height>
\t\t<Fire_Projectile_Type>Proj_Ship_Turbolaser_Green</Fire_Projectile_Type>
\t\t<Fire_Min_Recharge_Seconds>2.5</Fire_Min_Recharge_Seconds>
\t\t<Fire_Max_Recharge_Seconds>3.5</Fire_Max_Recharge_Seconds>
\t\t<Fire_Pulse_Count>4</Fire_Pulse_Count>
\t\t<Fire_Pulse_Delay_Seconds>0.2</Fire_Pulse_Delay_Seconds>
\t\t<Fire_Range_Distance>1600.0</Fire_Range_Distance>
\t\t<Fire_SFXEvent>Unit_Turbolaser_Fire</Fire_SFXEvent>
\t</HardPoint>`
  },
  {
    id: 'projectile',
    nameEn: 'Projectile (Laser / Torpedo)',
    nameEs: 'Proyectil (Láser / Torpedo)',
    descEn: 'Projectile definition with speed, flight range, damage type, and impact effects.',
    descEs: 'Definición de proyectil con velocidad, alcance máximo, tipo de daño y partículas.',
    badge: 'Projectile',
    code: `\t<Projectile Name="Proj_Custom_Heavy_Turbolaser">
\t\t<Text_ID>TEXT_NONE</Text_ID>
\t\t<Space_Model_Name>Laser_Green.alo</Space_Model_Name>
\t\t<Scale_Factor>1.2</Scale_Factor>
\t\t<Projectile_Category>Laser</Projectile_Category>
\t\t<Projectile_Max_Flight_Distance>1800.0</Projectile_Max_Flight_Distance>
\t\t<Projectile_Max_Speed>28.0</Projectile_Max_Speed>
\t\t<Projectile_Damage>45.0</Projectile_Damage>
\t\t<Damage_Type>Damage_Turbolaser</Damage_Type>
\t\t<Projectile_Does_Shield_Damage>Yes</Projectile_Does_Shield_Damage>
\t\t<Projectile_Does_Energy_Damage>No</Projectile_Does_Energy_Damage>
\t\t<Projectile_Does_Hit_Point_Damage>Yes</Projectile_Does_Hit_Point_Damage>
\t\t<Projectile_Object_Detonation_Particle>Small_Damage_Space</Projectile_Object_Detonation_Particle>
\t\t<AI_Combat_Power>50</AI_Combat_Power>
\t</Projectile>`
  },
  {
    id: 'abilities_block',
    nameEn: 'Unit Abilities Block',
    nameEs: 'Bloque de Habilidades Activas',
    descEn: 'Unit_Abilities_Data block for tactical abilities (Power to Weapons, Turbo, Hunt).',
    descEs: 'Bloque Unit_Abilities_Data para habilidades tácticas (Potencia a las Armas, Turbo, Caza).',
    badge: 'Abilities',
    code: `\t\t<Unit_Abilities_Data SubObjectList="Yes">
\t\t\t<Unit_Ability>
\t\t\t\t<Type>POWER_TO_WEAPONS</Type>
\t\t\t\t<Mod_Multiplier>WEAPON_DELAY_MULTIPLIER, 0.5f</Mod_Multiplier>
\t\t\t\t<Mod_Multiplier>SHIELD_REGEN_MULTIPLIER, -3f</Mod_Multiplier>
\t\t\t\t<Mod_Multiplier>SPEED_MULTIPLIER, 0.5f</Mod_Multiplier>
\t\t\t\t<Recharge_Seconds>60</Recharge_Seconds>
\t\t\t\t<Expiration_Seconds>15</Expiration_Seconds>
\t\t\t\t<Alternate_Name_Text>TEXT_TOOLTIP_ABILITY_FIRE_BATTERIES_NAME</Alternate_Name_Text>
\t\t\t\t<Alternate_Description_Text>TEXT_TOOLTIP_ABILITY_FIRE_BATTERIES_DESCRIPTION</Alternate_Description_Text>
\t\t\t</Unit_Ability>
\t\t</Unit_Abilities_Data>`
  },
  {
    id: 'ground_company',
    nameEn: 'Ground Company (Galactic Roster)',
    nameEs: 'Compañía Terrestre (Producción)',
    descEn: 'GroundCompany definition linking individual infantry/vehicles to galactic production.',
    descEs: 'Definición de GroundCompany que vincula escuadrones o vehículos a la producción galáctica.',
    badge: 'GroundCompany',
    code: `\t<GroundCompany Name="Custom_Infantry_Squad_Company">
\t\t<Text_ID>TEXT_IMPERIAL_STORMTROOPER_SQUAD</Text_ID>
\t\t<Encyclopedia_Good_Against>Rebel_Trooper</Encyclopedia_Good_Against>
\t\t<Encyclopedia_Vulnerable_To>MPTL T4B_Tank</Encyclopedia_Vulnerable_To>
\t\t<Encyclopedia_Text>TEXT_TOOLTIP_STORMTROOPER</Encyclopedia_Text>
\t\t<Encyclopedia_Unit_Class>TEXT_ENCYCLOPEDIA_CLASS_INFANTRY</Encyclopedia_Unit_Class>
\t\t<Icon_Name>i_button_stormtrooper.tga</Icon_Name>
\t\t<GUI_Row>1</GUI_Row>
\t\t<Is_Dummy>Yes</Is_Dummy>
\t\t<Affiliation>Empire</Affiliation>
\t\t<Build_Cost_Credits>120</Build_Cost_Credits>
\t\t<Build_Time_Seconds>15</Build_Time_Seconds>
\t\t<Tech_Level>1</Tech_Level>
\t\t<Required_Ground_Base_Level>1</Required_Ground_Base_Level>
\t\t<Required_Special_Structures>E_Ground_Barracks</Required_Special_Structures>
\t\t<Behavior>DUMMY_GROUND_COMPANY</Behavior>
\t\t<Company_Transport_Unit>Imperial_Landing_Craft</Company_Transport_Unit>
\t\t<Company_Units>Squad_Stormtrooper, Squad_Stormtrooper, Squad_Stormtrooper</Company_Units>
\t\t<Max_Squad_Size>9</Max_Squad_Size>
\t\t<Population_Value>1</Population_Value>
\t</GroundCompany>`
  }
];

export interface CodeEditorWithLinesProps {
  value: string;
  onChange?: (val: string) => void;
  className?: string;
  readOnly?: boolean;
  errorLine?: number | null;
  highlightedLine?: number | null;
  scrollToLineKey?: number;
  onCursorChange?: (line: number, col: number, selectedText: string) => void;
  tabSize?: number;
}

export const CodeEditorWithLines = ({
  value,
  onChange,
  className = '',
  readOnly = false,
  errorLine = null,
  highlightedLine = null,
  scrollToLineKey = 0,
  onCursorChange,
  tabSize = 4
}: CodeEditorWithLinesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetLine = highlightedLine ?? errorLine;
    if (targetLine && scrollContainerRef.current) {
      const topOffset = Math.max(0, 16 + (targetLine - 1) * 18 - 140);
      scrollContainerRef.current.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  }, [highlightedLine, errorLine, scrollToLineKey]);

  const updateCursorMetrics = () => {
    if (!onCursorChange) return;
    const textarea = document.getElementById('xml-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = value.slice(0, start);
    const linesBefore = before.split('\n');
    const line = linesBefore.length;
    const col = linesBefore[linesBefore.length - 1].length + 1;
    const selectedText = start !== end ? value.slice(start, end) : '';
    onCursorChange(line, col, selectedText);
  };

  const lines = useMemo(() => value.split('\n'), [value]);

  return (
    <div className={`flex-1 flex flex-col items-stretch relative bg-slate-950 border border-slate-800 rounded mx-1 mb-1 overflow-hidden min-h-0 ${className}`}>
      <div ref={scrollContainerRef} className="flex-1 flex overflow-auto custom-scrollbar h-full relative">
        {/* Line numbers gutter */}
        <div
          className="bg-slate-900 border-r border-slate-800 text-slate-500 text-right text-[12px] font-mono p-4 pr-3 pt-[16px] select-none sticky left-0 z-20 min-w-[3.75rem]"
          style={{ lineHeight: '18px' }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isError = errorLine === lineNum;
            const isHighlighted = highlightedLine === lineNum;
            return (
              <div
                key={i}
                className={`h-[18px] transition-colors ${
                  isError
                    ? 'text-red-400 font-bold bg-red-900/30 -mx-3 px-3'
                    : isHighlighted
                    ? 'text-rose-300 font-bold bg-rose-500/20 -mx-3 px-3'
                    : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>
        {/* Editor */}
        <div className="flex-1 h-full relative z-10" style={{ minWidth: 'max-content' }}>
          {errorLine !== null && (
            <div
              className="absolute left-0 right-0 pointer-events-none bg-red-500/15 border-b border-red-500/60 z-0"
              style={{ top: 16 + (errorLine - 1) * 18, height: 18 }}
            />
          )}
          {highlightedLine !== null && highlightedLine !== errorLine && (
            <div
              className="absolute left-0 right-0 pointer-events-none bg-rose-500/15 border-y border-rose-500/40 z-0"
              style={{ top: 16 + (highlightedLine - 1) * 18, height: 18 }}
            />
          )}
          <Editor
            textareaId="xml-editor-textarea"
            value={value}
            onValueChange={v => onChange?.(v)}
            onClick={updateCursorMetrics}
            onKeyUp={updateCursorMetrics}
            highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
            padding={16}
            insertSpaces={false}
            tabSize={tabSize}
            readOnly={readOnly}
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: '18px',
              minHeight: '100%',
              whiteSpace: 'pre',
              position: 'relative',
              zIndex: 1,
              background: 'transparent'
            }}
            className={`min-h-full outline-none xml-editor-styles ${readOnly ? 'opacity-80' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};

interface ParsedXmlEntity {
  index: number;
  tagName: string;
  nameAttr: string;
  line: number;
  endLine: number;
  variantOf?: string;
  affiliation?: string;
  textId?: string;
  encyclopediaText?: string;
  childTags: { tag: string; value: string }[];
  rawBlock: string;
}

interface XmlDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
  line: number | null;
}

export default function XmlEditor({
  initialContent,
  fileName: initialFileName,
  onClose,
  onSave,
  workspaceFiles = [],
  onSelectWorkspaceXml,
  datRecords = null
}: XmlEditorProps) {
  const t = useTranslation();
  const lang = useLanguage();

  const [content, setContent] = useState(initialContent);
  const [editableFileName, setEditableFileName] = useState(initialFileName);

  // Undo / Redo History
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isInternalHistoryChange = useRef(false);

  // Left Sidebar Tabs: 'outline' | 'tags' | 'templates'
  const [leftTab, setLeftTab] = useState<'outline' | 'tags' | 'templates'>('outline');
  const [outlineSearch, setOutlineSearch] = useState('');
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number | null>(null);

  // Tags Library state
  const [tagSearch, setTagSearch] = useState('');
  const [tagCategory, setTagCategory] = useState<'all' | TagMetadata['category']>('all');
  const [tagPage, setTagPage] = useState(1);

  // Right Inspector Panel
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightTab, setRightTab] = useState<'inspector' | 'diagnostics'>('inspector');
  const [newPropTag, setNewPropTag] = useState('');
  const [newPropValue, setNewPropValue] = useState('');

  // Search & Replace Bar
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Editor navigation & UI state
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [scrollToLineKey, setScrollToLineKey] = useState(0);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number; selectedText: string }>({
    line: 1,
    col: 1,
    selectedText: ''
  });
  const [indentMode, setIndentMode] = useState<'tab' | '2' | '4'>('tab');
  const [goToLineInput, setGoToLineInput] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Sync when new file is loaded from parent
  useEffect(() => {
    setContent(initialContent);
    setEditableFileName(initialFileName);
    setHistory([initialContent]);
    setHistoryIndex(0);
    setSelectedEntityIndex(null);
    setHighlightedLine(null);
  }, [initialContent, initialFileName]);

  // Update content with history tracking
  const updateContentWithHistory = useCallback(
    (newVal: string) => {
      setContent(newVal);
      if (isInternalHistoryChange.current) {
        isInternalHistoryChange.current = false;
        return;
      }
      setHistory(prev => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, newVal].slice(-40);
        setHistoryIndex(next.length - 1);
        return next;
      });
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      isInternalHistoryChange.current = true;
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isInternalHistoryChange.current = true;
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
    }
  };

  const jumpToLine = useCallback((line: number) => {
    setHighlightedLine(line);
    setScrollToLineKey(prev => prev + 1);
  }, []);

  // Fast DAT Lookup Map
  const datLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (datRecords) {
      for (const r of datRecords) {
        map.set(r.key.toUpperCase(), r.value);
      }
    }
    return map;
  }, [datRecords]);

  // Parse XML DOM, Outline Entities, and EaW Diagnostics
  const { rootTagName, entities, diagnostics, validationError } = useMemo(() => {
    const diags: XmlDiagnostic[] = [];
    const parsedEntities: ParsedXmlEntity[] = [];
    let detectedRoot = 'Root';
    let syntaxErr: { message: string; line: number | null } | null = null;

    if (!content.trim()) {
      return { rootTagName: 'Empty', entities: [], diagnostics: [], validationError: null };
    }

    const lines = content.split('\n');

    // 1. DOMParser Syntax Check
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    const parseError = xmlDoc.getElementsByTagName('parsererror');

    if (parseError.length > 0) {
      const errorText = parseError[0].textContent || 'XML Syntax Error';
      const lineMatch = errorText.match(/line\s+(\d+)/i) || errorText.match(/línea\s+(\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1], 10) : null;
      const cleanMessage = errorText
        .replace(/This page contains the following errors:/i, '')
        .replace(/Below is a rendering of the page up to the first error\./i, '')
        .trim();

      syntaxErr = { message: cleanMessage, line };
      diags.push({
        id: 'syntax_err',
        severity: 'error',
        title: lang === 'es' ? 'Error de Sintaxis XML' : 'XML Syntax Error',
        detail: cleanMessage,
        line
      });
    } else if (xmlDoc.documentElement) {
      detectedRoot = xmlDoc.documentElement.tagName;
    }

    // 2. Extract Top-Level Entity Nodes & Line Numbers via line scan + DOM children
    if (!syntaxErr && xmlDoc.documentElement) {
      const children = Array.from(xmlDoc.documentElement.children);
      let searchFromLine = 0;

      children.forEach((el, idx) => {
        const tagName = el.tagName;
        const nameAttr = el.getAttribute('Name') || el.getAttribute('name') || el.getAttribute('ID') || `${tagName}_${idx + 1}`;

        // Locate starting line in raw text
        let foundStartLine = searchFromLine + 1;
        const escapedName = nameAttr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRegex = new RegExp(`<${tagName}\\b[^>]*Name\\s*=\\s*["']${escapedName}["']`, 'i');
        const tagOnlyRegex = new RegExp(`<${tagName}\\b`, 'i');

        for (let i = searchFromLine; i < lines.length; i++) {
          if (nameRegex.test(lines[i])) {
            foundStartLine = i + 1;
            searchFromLine = i + 1;
            break;
          }
        }
        if (foundStartLine === searchFromLine + 1) {
          for (let i = searchFromLine; i < lines.length; i++) {
            if (tagOnlyRegex.test(lines[i])) {
              foundStartLine = i + 1;
              searchFromLine = i + 1;
              break;
            }
          }
        }

        // Locate closing line
        let foundEndLine = foundStartLine;
        const closeRegex = new RegExp(`</${tagName}\\s*>`, 'i');
        const selfCloseRegex = new RegExp(`<${tagName}\\b[^>]*/>`, 'i');
        if (selfCloseRegex.test(lines[foundStartLine - 1] || '')) {
          foundEndLine = foundStartLine;
        } else {
          for (let i = foundStartLine - 1; i < lines.length; i++) {
            if (closeRegex.test(lines[i])) {
              foundEndLine = i + 1;
              break;
            }
          }
        }

        const childTags: { tag: string; value: string }[] = [];
        Array.from(el.children).forEach(child => {
          if (child.children.length === 0) {
            childTags.push({
              tag: child.tagName,
              value: (child.textContent || '').trim()
            });
          } else {
            childTags.push({
              tag: child.tagName,
              value: `[${child.children.length} sub-nodes]`
            });
          }
        });

        const getChildText = (tName: string) => {
          const found = childTags.find(c => c.tag.toLowerCase() === tName.toLowerCase());
          return found?.value;
        };

        parsedEntities.push({
          index: idx,
          tagName,
          nameAttr,
          line: foundStartLine,
          endLine: foundEndLine,
          variantOf: getChildText('Variant_Of_Existing_Type'),
          affiliation: getChildText('Affiliation'),
          textId: getChildText('Text_ID'),
          encyclopediaText: getChildText('Encyclopedia_Text'),
          childTags,
          rawBlock: lines.slice(foundStartLine - 1, foundEndLine).join('\n')
        });
      });

      // 3. EaW Semantic Checks
      // Check duplicate Name attributes
      const seenNames = new Map<string, number>();
      parsedEntities.forEach(ent => {
        const key = `${ent.tagName}:${ent.nameAttr.toUpperCase()}`;
        if (seenNames.has(key)) {
          diags.push({
            id: `dup_${ent.index}`,
            severity: 'error',
            title: lang === 'es' ? `Identificador Name Duplicado: "${ent.nameAttr}"` : `Duplicate Name Identifier: "${ent.nameAttr}"`,
            detail:
              lang === 'es'
                ? `Ya definido en la línea ${seenNames.get(key)}. En el motor Alamo esto provoca sobrescrituras silenciosas o cuelgues.`
                : `Already defined at line ${seenNames.get(key)}. In the Alamo engine this causes silent overrides or crashes.`,
            line: ent.line
          });
        } else {
          seenNames.set(key, ent.line);
        }

        // Check empty critical model tags
        const criticalTags = ['Space_Model_Name', 'Land_Model_Name', 'HardPoints', 'Projectile_Types'];
        ent.childTags.forEach(ct => {
          if (criticalTags.includes(ct.tag) && ct.value === '') {
            diags.push({
              id: `empty_${ent.index}_${ct.tag}`,
              severity: 'warning',
              title: lang === 'es' ? `Etiqueta Crítica Vacía: <${ct.tag}>` : `Empty Critical Tag: <${ct.tag}>`,
              detail:
                lang === 'es'
                  ? `En "${ent.nameAttr}" la etiqueta <${ct.tag}> está vacía.`
                  : `In "${ent.nameAttr}" the tag <${ct.tag}> has an empty value.`,
              line: ent.line
            });
          }
        });

        // Check missing DAT key if datRecords are loaded
        if (datRecords && datRecords.length > 0 && ent.textId && ent.textId !== 'TEXT_NONE') {
          if (!datLookup.has(ent.textId.toUpperCase())) {
            diags.push({
              id: `dat_${ent.index}`,
              severity: 'info',
              title: lang === 'es' ? `Clave .DAT no encontrada: ${ent.textId}` : `Missing .DAT Key: ${ent.textId}`,
              detail:
                lang === 'es'
                  ? `La entidad "${ent.nameAttr}" referencia <Text_ID>${ent.textId}</Text_ID>, que no figura en el archivo .DAT cargado.`
                  : `Entity "${ent.nameAttr}" references <Text_ID>${ent.textId}</Text_ID>, which is not in the loaded .DAT file.`,
              line: ent.line
            });
          }
        }
      });
    }

    return {
      rootTagName: detectedRoot,
      entities: parsedEntities,
      diagnostics: diags,
      validationError: syntaxErr
    };
  }, [content, lang, datRecords, datLookup]);

  // Search Matches Computation
  const searchMatches = useMemo(() => {
    if (!searchQuery) return [];
    const results: { start: number; end: number; line: number; preview: string }[] = [];
    const lines = content.split('\n');

    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(pattern, flags);

      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        if (match[0].length === 0) {
          regex.lastIndex++;
          continue;
        }
        const before = content.slice(0, match.index);
        const lineNum = before.split('\n').length;
        results.push({
          start: match.index,
          end: match.index + match[0].length,
          line: lineNum,
          preview: (lines[lineNum - 1] || '').trim()
        });
        if (results.length >= 500) break;
      }
    } catch {
      // Invalid regex while typing
    }
    return results;
  }, [content, searchQuery, caseSensitive, useRegex]);

  const handleNavigateMatch = (direction: 1 | -1) => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIdx + direction + searchMatches.length) % searchMatches.length;
    setCurrentMatchIdx(nextIdx);
    const match = searchMatches[nextIdx];
    jumpToLine(match.line);
  };

  const handleReplaceCurrent = () => {
    if (searchMatches.length === 0) return;
    const idx = Math.min(currentMatchIdx, searchMatches.length - 1);
    const match = searchMatches[idx];
    const nextContent = content.slice(0, match.start) + replaceQuery + content.slice(match.end);
    updateContentWithHistory(nextContent);
  };

  const handleReplaceAll = () => {
    if (!searchQuery || searchMatches.length === 0) return;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(pattern, flags);
      const nextContent = content.replace(regex, replaceQuery);
      updateContentWithHistory(nextContent);
      setCurrentMatchIdx(0);
    } catch {
      // Ignore invalid regex
    }
  };

  // Filtered tags for EaW Tag Library
  const filteredTags = useMemo(() => {
    return FULL_TAG_METADATA.filter(item => {
      const matchesCat = tagCategory === 'all' || item.category === tagCategory;
      if (!matchesCat) return false;
      if (!tagSearch.trim()) return true;
      const q = tagSearch.toLowerCase();
      return (
        item.tag.toLowerCase().includes(q) ||
        item.descEn.toLowerCase().includes(q) ||
        item.descEs.toLowerCase().includes(q)
      );
    });
  }, [tagSearch, tagCategory]);

  const PAGE_SIZE = 45;
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / PAGE_SIZE));
  const paginatedTags = filteredTags.slice((tagPage - 1) * PAGE_SIZE, tagPage * PAGE_SIZE);

  // Filtered Outline Entities
  const filteredEntities = useMemo(() => {
    if (!outlineSearch.trim()) return entities;
    const q = outlineSearch.toLowerCase();
    return entities.filter(
      e =>
        e.nameAttr.toLowerCase().includes(q) ||
        e.tagName.toLowerCase().includes(q) ||
        (e.affiliation && e.affiliation.toLowerCase().includes(q)) ||
        (e.variantOf && e.variantOf.toLowerCase().includes(q))
    );
  }, [entities, outlineSearch]);

  const activeEntity = useMemo(() => {
    if (selectedEntityIndex !== null && entities[selectedEntityIndex]) {
      return entities[selectedEntityIndex];
    }
    // Otherwise auto-detect entity containing current cursor line
    const byLine = entities.find(e => cursorPos.line >= e.line && cursorPos.line <= e.endLine);
    return byLine || entities[0] || null;
  }, [selectedEntityIndex, entities, cursorPos.line]);

  // Formatting & Code Transformations
  const formatXml = () => {
    if (!content.trim()) return;
    try {
      const indentation = indentMode === 'tab' ? '\t' : indentMode === '2' ? '  ' : '    ';
      const formatted = xmlFormat(content, {
        indentation,
        collapseContent: true,
        lineSeparator: '\n'
      });
      updateContentWithHistory(formatted);
    } catch (e) {
      console.error('Failed to format XML', e);
    }
  };

  const minifyXml = () => {
    if (!content.trim()) return;
    try {
      const minified = xmlFormat.minify(content, {
        filter: node => node.type !== 'Comment',
        collapseContent: true
      });
      updateContentWithHistory(minified);
    } catch (e) {
      console.error('Failed to minify XML', e);
    }
  };

  const stripComments = () => {
    if (!content.trim()) return;
    const stripped = content.replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*\n\s*\n/g, '\n\n');
    updateContentWithHistory(stripped);
  };

  const insertAtCursor = (snippet: string) => {
    const textarea = document.getElementById('xml-editor-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + snippet + content.substring(end);
      updateContentWithHistory(newContent);
      setTimeout(() => {
        textarea.focus();
        const pos = start + snippet.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
      }, 0);
    } else {
      updateContentWithHistory(content + '\n' + snippet);
    }
  };

  const insertTag = (tag: string, exampleValue?: string) => {
    const textarea = document.getElementById('xml-editor-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      const inner = selected || exampleValue || '';
      const insertion = `<${tag}>${inner}</${tag}>`;
      const newContent = content.substring(0, start) + insertion + content.substring(end);
      updateContentWithHistory(newContent);

      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + `<${tag}>`.length + inner.length;
        textarea.selectionStart = start + `<${tag}>`.length;
        textarea.selectionEnd = cursorPosition;
      }, 0);
    } else {
      updateContentWithHistory(content + `\n<${tag}>${exampleValue || ''}</${tag}>`);
    }
  };

  // Entity Operations (Duplicate, Delete, Update Child Tag)
  const handleDuplicateEntity = (ent: ParsedXmlEntity) => {
    const lines = content.split('\n');
    const entityLines = lines.slice(ent.line - 1, ent.endLine);
    const clonedBlock = entityLines
      .join('\n')
      .replace(
        new RegExp(`(<${ent.tagName}\\b[^>]*Name\\s*=\\s*["'])${ent.nameAttr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`),
        `$1${ent.nameAttr}_Copy$2`
      );
    const updatedLines = [
      ...lines.slice(0, ent.endLine),
      '',
      clonedBlock,
      ...lines.slice(ent.endLine)
    ];
    updateContentWithHistory(updatedLines.join('\n'));
    jumpToLine(ent.endLine + 2);
  };

  const handleDeleteEntity = (ent: ParsedXmlEntity) => {
    const lines = content.split('\n');
    const updatedLines = [...lines.slice(0, ent.line - 1), ...lines.slice(ent.endLine)];
    updateContentWithHistory(updatedLines.join('\n'));
    setSelectedEntityIndex(null);
  };

  const handleUpdateEntityChildTag = (ent: ParsedXmlEntity, tagName: string, newValue: string) => {
    const lines = content.split('\n');
    const entitySlice = lines.slice(ent.line - 1, ent.endLine);
    const tagRegex = new RegExp(`(<${tagName}\\b[^>]*>)([\\s\\S]*?)(</${tagName}>)`, 'i');
    let replaced = false;

    const updatedSlice = entitySlice.map(line => {
      if (!replaced && tagRegex.test(line)) {
        replaced = true;
        return line.replace(tagRegex, `$1${newValue}$3`);
      }
      return line;
    });

    if (replaced) {
      const nextLines = [...lines.slice(0, ent.line - 1), ...updatedSlice, ...lines.slice(ent.endLine)];
      updateContentWithHistory(nextLines.join('\n'));
    }
  };

  const handleUpdateEntityNameAttr = (ent: ParsedXmlEntity, newName: string) => {
    if (!newName.trim()) return;
    const lines = content.split('\n');
    const startLine = lines[ent.line - 1];
    if (!startLine) return;
    const updatedStartLine = startLine.replace(/Name\s*=\s*["'][^"']*["']/i, `Name="${newName.trim()}"`);
    lines[ent.line - 1] = updatedStartLine;
    updateContentWithHistory(lines.join('\n'));
  };

  const handleAddPropertyToEntity = (ent: ParsedXmlEntity) => {
    if (!newPropTag.trim()) return;
    const cleanTag = newPropTag.trim().replace(/[<>/\s]/g, '');
    if (!cleanTag) return;
    const lines = content.split('\n');
    const newLine = `\t\t<${cleanTag}>${newPropValue.trim()}</${cleanTag}>`;
    const insertPos = Math.max(ent.line, ent.endLine - 1);
    const nextLines = [...lines.slice(0, insertPos), newLine, ...lines.slice(insertPos)];
    updateContentWithHistory(nextLines.join('\n'));
    setNewPropTag('');
    setNewPropValue('');
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 1800);
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (typeof text === 'string') {
        setEditableFileName(file.name);
        updateContentWithHistory(text);
      }
    };
    reader.readAsText(file);
    if (localFileInputRef.current) localFileInputRef.current.value = '';
  };

  // Keyboard shortcuts inside editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearchBar(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave(content, editableFileName);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, editableFileName, onSave]);

  const workspaceXmlFiles = useMemo(
    () => workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml')),
    [workspaceFiles]
  );

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-950 text-slate-300 select-none overflow-hidden">
      {/* Top Primary Header (v2.1) */}
      <div className="flex-none min-h-[3.5rem] px-4 py-2 border-b border-rose-900/50 flex flex-wrap justify-between items-center gap-3 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-sm bg-rose-500/15 border border-rose-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <FileCode className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-rose-400 font-bold uppercase tracking-widest text-xs font-mono flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${validationError ? 'bg-red-500' : 'bg-emerald-400'} animate-pulse`} />
                <span>{t.home?.xmlTitle || 'Raw XML Editor'}</span>
              </h2>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-700/50">
                v2.1
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                &lt;{rootTagName}&gt;
              </span>
            </div>

            <div className="flex items-center space-x-2 mt-1">
              <input
                type="text"
                value={editableFileName}
                onChange={e => setEditableFileName(e.target.value)}
                className="text-[11px] text-slate-200 font-mono bg-slate-950/90 border border-slate-800 focus:border-rose-500/60 rounded px-2 py-0.5 outline-none w-48"
                title={lang === 'es' ? 'Nombre del archivo al exportar' : lang === 'fr' ? 'Nom du fichier à exporter' : 'Export file name'}
              />

              {workspaceXmlFiles.length > 0 && onSelectWorkspaceXml && (
                <div className="flex items-center space-x-1">
                  <Folder className="w-3 h-3 text-rose-400/70" />
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) {
                        onSelectWorkspaceXml(e.target.value);
                      }
                    }}
                    className="bg-slate-950 border border-rose-900/50 text-rose-300 font-mono text-[10px] py-0.5 px-1.5 rounded outline-none focus:border-rose-500 cursor-pointer max-w-[180px]"
                  >
                    <option value="">
                      {lang === 'es'
                        ? `Cambiar XML (${workspaceXmlFiles.length})...`
                        : lang === 'fr'
                        ? `Changer XML (${workspaceXmlFiles.length})...`
                        : `Switch XML (${workspaceXmlFiles.length})...`}
                    </option>
                    {workspaceXmlFiles.map((f, i) => (
                      <option key={i} value={f.webkitRelativePath || f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {validationError ? (
                <button
                  onClick={() => {
                    setShowRightPanel(true);
                    setRightTab('diagnostics');
                    if (validationError.line) jumpToLine(validationError.line);
                  }}
                  className="text-[10px] text-red-400 font-mono font-bold bg-red-500/15 border border-red-500/40 px-2 py-0.5 rounded flex items-center space-x-1 hover:bg-red-500/25 cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {lang === 'es' ? 'Error XML' : lang === 'fr' ? 'Erreur XML' : 'XML Error'}
                    {validationError.line ? ` (L:${validationError.line})` : ''}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowRightPanel(true);
                    setRightTab('diagnostics');
                  }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer border ${
                    errorCount > 0
                      ? 'text-red-400 bg-red-500/15 border-red-500/40'
                      : warningCount > 0
                      ? 'text-amber-400 bg-amber-500/15 border-amber-500/40'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    {errorCount > 0
                      ? `${errorCount} ${lang === 'es' ? 'Duplicados/Errores' : lang === 'fr' ? 'Doublons/Erreurs' : 'Duplicates/Errors'}`
                      : warningCount > 0
                      ? `${warningCount} ${lang === 'es' ? 'Avisos EaW' : lang === 'fr' ? 'Alertes EaW' : 'EaW Warnings'}`
                      : lang === 'es'
                      ? 'Sintaxis XML Válida'
                      : lang === 'fr'
                      ? 'Syntaxe XML Valide'
                      : 'Valid XML Syntax'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Primary Actions */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-700/70 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Deshacer (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-700/70 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Rehacer (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={() => setShowSearchBar(prev => !prev)}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5 rounded-sm cursor-pointer ${
              showSearchBar
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title={lang === 'es' ? 'Buscar y Reemplazar (Ctrl+F)' : 'Find & Replace (Ctrl+F)'}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{lang === 'es' ? 'Buscar' : 'Find'}</span>
          </button>

          {/* Indentation selector + Format */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-sm overflow-hidden">
            <select
              value={indentMode}
              onChange={e => setIndentMode(e.target.value as 'tab' | '2' | '4')}
              className="bg-slate-950 text-slate-300 text-[10px] font-mono px-1.5 py-1.5 border-r border-slate-700 outline-none cursor-pointer"
              title={lang === 'es' ? 'Tipo de sangría al formatear' : 'Format indentation style'}
            >
              <option value="tab">TAB</option>
              <option value="2">2 SP</option>
              <option value="4">4 SP</option>
            </select>
            <button
              onClick={formatXml}
              className="px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 font-bold text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center space-x-1.5 cursor-pointer"
              title={lang === 'es' ? 'Embellecer e indentar XML' : 'Pretty-print and indent XML'}
            >
              <AlignLeft className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{lang === 'es' ? 'Formatear' : 'Format'}</span>
            </button>
          </div>

          <button
            onClick={minifyXml}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Compactar / Minificar XML' : 'Compact / Minify XML'}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={stripComments}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Eliminar todos los comentarios <!-- -->' : 'Strip all <!-- --> XML comments'}
          >
            <MessageSquareOff className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyAll}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] uppercase tracking-wider rounded-sm flex items-center space-x-1 cursor-pointer"
            title={lang === 'es' ? 'Copiar todo el XML al portapapeles' : 'Copy full XML to clipboard'}
          >
            {copiedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{copiedFeedback ? (lang === 'es' ? 'Copiado' : 'Copied') : 'Copy'}</span>
          </button>

          <button
            onClick={() => localFileInputRef.current?.click()}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Importar otro archivo .XML desde el disco' : 'Load another .XML file from disk'}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setConfirmClearModal(true)}
            className="p-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Reiniciar a esqueleto vacío' : 'Reset to empty XML skeleton'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowRightPanel(prev => !prev)}
            className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center space-x-1 rounded-sm cursor-pointer ${
              showRightPanel
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={lang === 'es' ? 'Mostrar/Ocultar Inspector y Auditor EaW' : 'Toggle EaW Inspector & Auditor'}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{lang === 'es' ? 'Inspector' : 'Inspector'}</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 border border-rose-800/50 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 rounded-sm transition-colors cursor-pointer"
            title={lang === 'es' ? 'Manual y Guía de Arquitectura XML EaW' : 'EaW XML Architecture Guide & Manual'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSave(content, editableFileName)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center space-x-1.5 rounded-sm cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.3)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.storyEditor?.saveBtn || (lang === 'es' ? 'Guardar XML' : 'Save XML')}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm flex items-center justify-center cursor-pointer"
            title={t.storyEditor?.closeBtn || 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Find & Replace Bar */}
      {showSearchBar && (
        <div className="flex-none bg-slate-900/95 border-b border-rose-900/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs z-30">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIdx(0);
                }}
                placeholder={lang === 'es' ? 'Buscar texto o etiqueta...' : 'Find text or tag...'}
                className="bg-slate-950 border border-slate-700 focus:border-rose-500 text-slate-200 text-xs pl-8 pr-3 py-1 rounded-sm outline-none w-56"
                autoFocus
              />
            </div>

            <button
              onClick={() => setCaseSensitive(prev => !prev)}
              className={`px-2 py-1 text-[10px] font-bold rounded-sm border cursor-pointer ${
                caseSensitive
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={lang === 'es' ? 'Distinguir Mayúsculas/Minúsculas' : 'Match Case'}
            >
              Aa
            </button>
            <button
              onClick={() => setUseRegex(prev => !prev)}
              className={`px-2 py-1 text-[10px] font-bold rounded-sm border cursor-pointer ${
                useRegex
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={lang === 'es' ? 'Expresión Regular (Regex)' : 'Regular Expression'}
            >
              .*
            </button>

            <span className="text-[10px] text-slate-400 px-2">
              {searchMatches.length > 0
                ? `${Math.min(currentMatchIdx + 1, searchMatches.length)} / ${searchMatches.length}`
                : searchQuery
                ? lang === 'es'
                  ? '0 resultados'
                  : '0 matches'
                : ''}
            </span>

            <button
              onClick={() => handleNavigateMatch(-1)}
              disabled={searchMatches.length === 0}
              className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 rounded-sm cursor-pointer"
              title={lang === 'es' ? 'Anterior coincidencia' : 'Previous match'}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNavigateMatch(1)}
              disabled={searchMatches.length === 0}
              className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 rounded-sm cursor-pointer"
              title={lang === 'es' ? 'Siguiente coincidencia' : 'Next match'}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Replace controls */}
            <div className="relative flex items-center">
              <Replace className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={replaceQuery}
                onChange={e => setReplaceQuery(e.target.value)}
                placeholder={lang === 'es' ? 'Reemplazar con...' : 'Replace with...'}
                className="bg-slate-950 border border-slate-700 focus:border-rose-500 text-slate-200 text-xs pl-8 pr-3 py-1 rounded-sm outline-none w-48"
              />
            </div>

            <button
              onClick={handleReplaceCurrent}
              disabled={searchMatches.length === 0}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[10px] uppercase font-bold rounded-sm border border-slate-700 cursor-pointer"
            >
              {lang === 'es' ? 'Reemplazar' : 'Replace'}
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={searchMatches.length === 0}
              className="px-2.5 py-1 bg-rose-900/40 hover:bg-rose-800/60 disabled:opacity-40 text-rose-200 text-[10px] uppercase font-bold rounded-sm border border-rose-700/50 cursor-pointer"
            >
              {lang === 'es' ? 'Reemplazar Todo' : 'Replace All'}
            </button>
          </div>

          {/* Go to Line */}
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              min={1}
              value={goToLineInput}
              onChange={e => setGoToLineInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const num = parseInt(goToLineInput, 10);
                  if (!isNaN(num) && num >= 1) jumpToLine(num);
                }
              }}
              placeholder={lang === 'es' ? 'Ir a línea...' : 'Go to line...'}
              className="bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-200 text-[11px] px-2 py-1 rounded-sm w-24 outline-none"
            />
            <button
              onClick={() => {
                const num = parseInt(goToLineInput, 10);
                if (!isNaN(num) && num >= 1) jumpToLine(num);
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold rounded-sm cursor-pointer"
            >
              Go
            </button>
            <button
              onClick={() => setShowSearchBar(false)}
              className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Column IDE Workspace */}
      <div className="flex-1 flex p-2 min-h-0 relative gap-1">
        {/* LEFT SIDEBAR: Outline / EaW Tags / Templates */}
        <div className="w-72 bg-slate-900/90 border border-slate-800 rounded flex flex-col relative z-20 overflow-hidden shrink-0">
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <button
              onClick={() => setLeftTab('outline')}
              className={`py-2.5 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1 border-b-2 transition-colors cursor-pointer ${
                leftTab === 'outline'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{lang === 'es' ? `Nodos (${entities.length})` : `Outline (${entities.length})`}</span>
            </button>
            <button
              onClick={() => setLeftTab('tags')}
              className={`py-2.5 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1 border-b-2 transition-colors cursor-pointer ${
                leftTab === 'tags'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>{lang === 'es' ? 'Tags EaW' : 'EaW Tags'}</span>
            </button>
            <button
              onClick={() => setLeftTab('templates')}
              className={`py-2.5 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1 border-b-2 transition-colors cursor-pointer ${
                leftTab === 'templates'
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'es' ? 'Plantillas' : 'Snippets'}</span>
            </button>
          </div>

          {/* TAB 1: DOM OUTLINE / NODES */}
          {leftTab === 'outline' && (
            <div className="flex-1 flex flex-col min-h-0 p-2">
              <div className="relative mb-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={outlineSearch}
                  onChange={e => setOutlineSearch(e.target.value)}
                  placeholder={lang === 'es' ? 'Filtrar entidades XML...' : 'Filter XML entities...'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 text-slate-200 text-xs pl-8 pr-2 py-1.5 rounded outline-none font-mono"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-1.5">
                {filteredEntities.length === 0 ? (
                  <div className="text-center py-8 px-3 text-slate-500 font-mono text-[11px]">
                    {validationError
                      ? lang === 'es'
                        ? 'Corrige el error de sintaxis XML para analizar el árbol de nodos.'
                        : 'Fix the XML syntax error to parse the node outline.'
                      : lang === 'es'
                      ? 'No se encontraron nodos hijos en este documento.'
                      : 'No child entity nodes found in this document.'}
                  </div>
                ) : (
                  filteredEntities.map(ent => {
                    const isSelected = activeEntity?.index === ent.index;
                    return (
                      <div
                        key={`${ent.index}_${ent.nameAttr}`}
                        onClick={() => {
                          setSelectedEntityIndex(ent.index);
                          jumpToLine(ent.line);
                        }}
                        className={`p-2 rounded border transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-xs text-slate-100 truncate" title={ent.nameAttr}>
                            {ent.nameAttr}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">L:{ent.line}</span>
                        </div>

                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              {ent.tagName}
                            </span>
                            {ent.affiliation && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/40 truncate max-w-[90px]">
                                {ent.affiliation}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDuplicateEntity(ent);
                              }}
                              className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded border border-slate-700"
                              title={lang === 'es' ? 'Duplicar entidad' : 'Duplicate entity'}
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteEntity(ent);
                              }}
                              className="p-1 bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded border border-slate-700"
                              title={lang === 'es' ? 'Eliminar entidad' : 'Delete entity'}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {ent.variantOf && (
                          <div className="mt-1 text-[9px] font-mono text-amber-400/80 truncate">
                            ↳ Variant: {ent.variantOf}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EAW TAGS REFERENCE & INSERT */}
          {leftTab === 'tags' && (
            <div className="flex-1 flex flex-col min-h-0 p-2">
              <input
                type="text"
                placeholder={lang === 'es' ? 'Buscar entre 3.200+ etiquetas EaW...' : 'Search 3,200+ EaW tags...'}
                value={tagSearch}
                onChange={e => {
                  setTagSearch(e.target.value);
                  setTagPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 text-slate-200 text-xs px-2.5 py-1.5 rounded mb-2 outline-none font-mono"
              />

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 mb-2 shrink-0">
                {[
                  { id: 'all', es: 'Todas', en: 'All' },
                  { id: 'combat', es: 'Combate', en: 'Combat' },
                  { id: 'movement', es: 'Motor', en: 'Move' },
                  { id: 'galaxy', es: 'Galaxia', en: 'Galaxy' },
                  { id: 'models', es: '3D/Huesos', en: '3D/Bones' },
                  { id: 'abilities', es: 'Habilidades', en: 'Abilities' },
                  { id: 'ai', es: 'IA', en: 'AI' },
                  { id: 'ui', es: 'UI/DAT', en: 'UI/DAT' },
                  { id: 'audio', es: 'Audio', en: 'SFX' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setTagCategory(cat.id as any);
                      setTagPage(1);
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded border cursor-pointer transition-colors ${
                      tagCategory === cat.id
                        ? 'bg-rose-600 text-slate-950 font-bold border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'es' ? cat.es : cat.en}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-1.5">
                {paginatedTags.map((tDef, idx) => (
                  <div
                    key={idx}
                    onClick={() => insertTag(tDef.tag, tDef.example)}
                    className="p-2 bg-slate-950 border border-slate-800/80 hover:border-rose-500/50 rounded cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-[11px] text-rose-400 group-hover:text-rose-300 break-all">
                        &lt;{tDef.tag}&gt;
                      </span>
                      <span className="text-[8px] font-mono uppercase px-1 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 shrink-0">
                        {tDef.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {lang === 'es' ? tDef.descEs : tDef.descEn}
                    </div>
                    {tDef.example && (
                      <div className="mt-1 text-[9px] font-mono text-emerald-400/80 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded truncate">
                        Ej: {tDef.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono shrink-0">
                  <button
                    disabled={tagPage === 1}
                    onClick={() => setTagPage(p => Math.max(1, p - 1))}
                    className="px-2 py-1 bg-slate-800 rounded disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span>
                    {tagPage} / {totalPages} ({filteredTags.length})
                  </span>
                  <button
                    disabled={tagPage === totalPages}
                    onClick={() => setTagPage(p => Math.min(totalPages, p + 1))}
                    className="px-2 py-1 bg-slate-800 rounded disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: XML TEMPLATES & SNIPPETS */}
          {leftTab === 'templates' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 px-1 mb-1">
                {lang === 'es'
                  ? 'Inserta bloques estructurales de Empire at War directamente en la posición del cursor:'
                  : 'Insert Empire at War structural XML blocks directly at cursor position:'}
              </div>
              {XML_TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded transition-colors flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-100 font-mono">
                        {lang === 'es' ? tpl.nameEs : tpl.nameEn}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {lang === 'es' ? tpl.descEs : tpl.descEn}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => insertAtCursor('\n' + tpl.code + '\n')}
                      className="flex-1 py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'es' ? 'Insertar en Cursor' : 'Insert at Cursor'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CENTER: CODE EDITOR + STATUS TELEMETRY BAR */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <CodeEditorWithLines
            value={content}
            onChange={updateContentWithHistory}
            errorLine={validationError ? validationError.line : null}
            highlightedLine={highlightedLine}
            scrollToLineKey={scrollToLineKey}
            onCursorChange={(line, col, selectedText) => setCursorPos({ line, col, selectedText })}
            tabSize={indentMode === '2' ? 2 : 4}
          />

          {/* Bottom Telemetry Status Bar */}
          <div className="h-6 bg-slate-900 border border-slate-800 rounded mx-1 px-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center space-x-4">
              <span>
                Ln <strong className="text-slate-200">{cursorPos.line}</strong>, Col{' '}
                <strong className="text-slate-200">{cursorPos.col}</strong>
              </span>
              {cursorPos.selectedText && (
                <span className="text-rose-400">
                  ({cursorPos.selectedText.length} {lang === 'es' ? 'seleccionados' : 'selected'})
                </span>
              )}
              <span className="hidden sm:inline">
                {lang === 'es' ? 'Líneas:' : 'Lines:'}{' '}
                <strong className="text-slate-200">{content.split('\n').length}</strong>
              </span>
              <span className="hidden md:inline">
                {lang === 'es' ? 'Entidades:' : 'Entities:'}{' '}
                <strong className="text-rose-300">{entities.length}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline">{(new Blob([content]).size / 1024).toFixed(1)} KB</span>
              <span>UTF-8</span>
              <span className="text-rose-400 font-bold">XML // EAW ALAMO</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: ENTITY INSPECTOR & EAW DIAGNOSTICS */}
        {showRightPanel && (
          <div className="w-80 bg-slate-900/90 border border-slate-800 rounded flex flex-col relative z-20 overflow-hidden shrink-0">
            <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <button
                onClick={() => setRightTab('inspector')}
                className={`py-2.5 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
                  rightTab === 'inspector'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>{lang === 'es' ? 'Inspector Nodo' : 'Node Inspector'}</span>
              </button>
              <button
                onClick={() => setRightTab('diagnostics')}
                className={`py-2.5 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
                  rightTab === 'diagnostics'
                    ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>
                  {lang === 'es' ? 'Auditoría' : 'Diagnostics'} ({diagnostics.length})
                </span>
              </button>
            </div>

            {/* RIGHT TAB 1: QUICK ENTITY INSPECTOR */}
            {rightTab === 'inspector' && (
              <div className="flex-1 flex flex-col min-h-0 p-2.5 overflow-y-auto custom-scrollbar space-y-3">
                {!activeEntity ? (
                  <div className="text-center py-10 px-4 text-slate-500 font-mono text-xs">
                    {lang === 'es'
                      ? 'Selecciona una entidad del árbol izquierdo o sitúa el cursor sobre un nodo XML para inspeccionar y editar sus etiquetas.'
                      : 'Select an entity from the left outline or place the cursor inside an XML node to inspect and edit its tags.'}
                  </div>
                ) : (
                  <>
                    {/* Entity Header Card */}
                    <div className="p-2.5 bg-slate-950 border border-rose-900/40 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          &lt;{activeEntity.tagName}&gt;
                        </span>
                        <button
                          onClick={() => jumpToLine(activeEntity.line)}
                          className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
                        >
                          {lang === 'es' ? `Ir a L:${activeEntity.line}-${activeEntity.endLine}` : `Jump L:${activeEntity.line}-${activeEntity.endLine}`}
                        </button>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">
                          Name (XML Attribute)
                        </label>
                        <input
                          type="text"
                          value={activeEntity.nameAttr}
                          onChange={e => handleUpdateEntityNameAttr(activeEntity, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 text-slate-100 font-mono text-xs px-2 py-1 rounded outline-none"
                        />
                      </div>

                      {/* DAT Translation Preview if Text_ID exists */}
                      {activeEntity.textId && (
                        <div className="p-2 bg-purple-950/20 border border-purple-800/40 rounded text-[10px] font-mono">
                          <div className="flex items-center justify-between text-purple-300 font-bold">
                            <span>&lt;Text_ID&gt;</span>
                            <span className="truncate max-w-[160px]">{activeEntity.textId}</span>
                          </div>
                          {datLookup.has(activeEntity.textId.toUpperCase()) ? (
                            <div className="mt-1 text-emerald-300 font-sans text-[11px]">
                              “{datLookup.get(activeEntity.textId.toUpperCase())}”
                            </div>
                          ) : (
                            <div className="mt-1 text-slate-500 text-[9px]">
                              {datRecords
                                ? lang === 'es'
                                  ? 'Clave no registrada en el .DAT actual'
                                  : 'Key not found in loaded .DAT'
                                : lang === 'es'
                                ? 'Carga un archivo .DAT para previsualizar el texto'
                                : 'Load a .DAT file to preview localized text'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Add New Child Property to Active Entity */}
                    <div className="p-2 bg-slate-950/70 border border-slate-800 rounded space-y-1.5">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        {lang === 'es' ? '+ Añadir Propiedad Hija' : '+ Add Child Property'}
                      </div>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          list="eaw-inspector-tags"
                          value={newPropTag}
                          onChange={e => setNewPropTag(e.target.value)}
                          placeholder={lang === 'es' ? 'Etiqueta (ej. Tech_Level)' : 'Tag (e.g. Tech_Level)'}
                          className="flex-1 min-w-0 bg-slate-900 border border-slate-700 focus:border-rose-500 text-slate-200 font-mono text-[10px] px-2 py-1 rounded outline-none"
                        />
                        <input
                          type="text"
                          value={newPropValue}
                          onChange={e => setNewPropValue(e.target.value)}
                          placeholder={lang === 'es' ? 'Valor' : 'Value'}
                          className="w-24 bg-slate-900 border border-slate-700 focus:border-rose-500 text-slate-200 font-mono text-[10px] px-2 py-1 rounded outline-none"
                        />
                        <button
                          onClick={() => handleAddPropertyToEntity(activeEntity)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded text-xs cursor-pointer"
                          title={lang === 'es' ? 'Insertar propiedad en este nodo' : 'Insert property into this node'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <datalist id="eaw-inspector-tags">
                        {Object.keys(RICH_TAG_CATALOG).map(tKey => (
                          <option key={tKey} value={tKey} />
                        ))}
                      </datalist>
                    </div>

                    {/* Editable Child Tags Table */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold px-0.5 flex justify-between">
                        <span>{lang === 'es' ? 'Propiedades Directas' : 'Direct Child Tags'}</span>
                        <span>{activeEntity.childTags.length}</span>
                      </div>

                      {activeEntity.childTags.map((ct, idx) => {
                        const isComplex = ct.value.startsWith('[') && ct.value.endsWith('sub-nodes]');
                        const meta = RICH_TAG_CATALOG[ct.tag];
                        return (
                          <div
                            key={`${ct.tag}_${idx}`}
                            className="p-2 bg-slate-950/90 border border-slate-800/80 rounded space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[10px] font-mono font-bold text-rose-300 truncate"
                                title={meta ? (lang === 'es' ? meta.descEs : meta.descEn) : ct.tag}
                              >
                                &lt;{ct.tag}&gt;
                              </span>
                            </div>
                            {isComplex ? (
                              <div className="text-[10px] font-mono text-slate-500 italic">{ct.value}</div>
                            ) : (
                              <input
                                type="text"
                                value={ct.value}
                                onChange={e => handleUpdateEntityChildTag(activeEntity, ct.tag, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500/60 text-slate-200 font-mono text-[11px] px-2 py-1 rounded outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* RIGHT TAB 2: DIAGNOSTICS & AUDITOR */}
            {rightTab === 'diagnostics' && (
              <div className="flex-1 flex flex-col min-h-0 p-2.5 overflow-y-auto custom-scrollbar space-y-2">
                {diagnostics.length === 0 ? (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded text-center space-y-2 mt-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                    <div className="text-xs font-mono font-bold text-emerald-300 uppercase">
                      {lang === 'es' ? 'Auditoría XML Limpia' : 'Clean XML Audit'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {lang === 'es'
                        ? `Se analizaron ${entities.length} entidades bajo <${rootTagName}> sin errores de sintaxis ni identificadores Name duplicados.`
                        : `Analyzed ${entities.length} entities under <${rootTagName}> with zero syntax errors or duplicate Name attributes.`}
                    </p>
                  </div>
                ) : (
                  diagnostics.map(diag => (
                    <div
                      key={diag.id}
                      onClick={() => diag.line && jumpToLine(diag.line)}
                      className={`p-2.5 rounded border transition-colors cursor-pointer ${
                        diag.severity === 'error'
                          ? 'bg-red-950/25 border-red-800/60 hover:border-red-500'
                          : diag.severity === 'warning'
                          ? 'bg-amber-950/25 border-amber-800/60 hover:border-amber-500'
                          : 'bg-cyan-950/25 border-cyan-800/60 hover:border-cyan-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase ${
                            diag.severity === 'error'
                              ? 'text-red-400'
                              : diag.severity === 'warning'
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {diag.title}
                        </span>
                        {diag.line && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 shrink-0">
                            L:{diag.line}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{diag.detail}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input for Direct Disk Load */}
      <input
        type="file"
        ref={localFileInputRef}
        className="hidden"
        accept=".xml"
        onChange={handleLocalFileUpload}
      />

      {/* Reset / Clear Confirmation Modal */}
      {confirmClearModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-red-400 font-mono font-bold text-sm uppercase">
              <AlertTriangle className="w-5 h-5" />
              <span>{lang === 'es' ? '¿Reiniciar documento XML?' : 'Reset XML Document?'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'es'
                ? 'Esta acción reemplazará el código actual por una plantilla vacía <?xml version="1.0"?>. Puedes usar Deshacer (Ctrl+Z) si cambias de opinión.'
                : 'This will replace the current code with a blank <?xml version="1.0"?> root skeleton. You can still Undo (Ctrl+Z) afterwards.'}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono uppercase rounded cursor-pointer"
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  updateContentWithHistory(`<?xml version="1.0" encoding="utf-8"?>\n<Root>\n\n</Root>`);
                  setConfirmClearModal(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-slate-950 font-bold text-xs font-mono uppercase rounded cursor-pointer"
              >
                {lang === 'es' ? 'Reiniciar XML' : 'Reset XML'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EaW XML Architecture & Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-md max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-rose-300">
                  {lang === 'es'
                    ? 'Manual del Editor XML Crudo // Arquitectura Alamo Engine (v2.1)'
                    : lang === 'fr'
                    ? 'Manuel de l\'Éditeur XML Brut // Architecture Alamo Engine (v2.1)'
                    : 'Raw XML Editor Manual // Alamo Engine XML Architecture (v2.1)'}
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded">
                <h4 className="font-mono font-bold text-rose-300 uppercase mb-1">
                  {lang === 'es' ? '1. Árbol de Nodos e Inspector Rápido' : '1. DOM Outline & Quick Node Inspector'}
                </h4>
                <p className="text-slate-400">
                  {lang === 'es'
                    ? 'El panel izquierdo "Nodos" indexa automáticamente todas las unidades, proyectiles, planetas o eventos del archivo XML. Haz clic en cualquier entidad para saltar a su línea exacta o editar sus propiedades en el Inspector derecho sin buscar manualmente entre miles de líneas.'
                    : 'The left "Outline" panel automatically indexes all units, projectiles, planets, or events in the XML file. Click any entity to jump to its exact line or edit its child tags in the right Inspector without scrolling through thousands of lines.'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <h4 className="font-mono font-bold text-cyan-300 uppercase mb-1">
                  {lang === 'es'
                    ? '2. Herencia con <Variant_Of_Existing_Type>'
                    : '2. Unit Inheritance via <Variant_Of_Existing_Type>'}
                </h4>
                <p className="text-slate-400">
                  {lang === 'es'
                    ? 'En Empire at War: Forces of Corruption, no necesitas copiar 150 etiquetas para crear una variante de nave o escuadrón. Usa la plantilla "Variante de Unidad" con <Variant_Of_Existing_Type>Nombre_Unidad_Base</Variant_Of_Existing_Type> y sobrescribe únicamente las etiquetas que cambien (como <Tech_ID>, <Shield_Points> o <HardPoints>).'
                    : 'In Empire at War: Forces of Corruption, you do not need to copy 150 tags to create a ship or squadron variant. Use the "Unit Variant" template with <Variant_Of_Existing_Type>Base_Unit_Name</Variant_Of_Existing_Type> and override only the tags that differ.'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <h4 className="font-mono font-bold text-amber-300 uppercase mb-1">
                  {lang === 'es'
                    ? '3. Auditoría de Identificadores Name Duplicados'
                    : '3. Duplicate Name Attribute Auditing'}
                </h4>
                <p className="text-slate-400">
                  {lang === 'es'
                    ? 'Si dos nodos comparten el mismo atributo Name="..." en el mismo archivo o proyecto, el motor Alamo sobrescribe el primero silenciosamente o produce errores en tiempo de carga. La pestaña "Auditoría" detecta duplicados y claves .DAT faltantes en tiempo real.'
                    : 'If two XML nodes share the same Name="..." attribute, the Alamo engine silently overwrites the first or crashes on load. The "Diagnostics" tab detects duplicate identifiers and missing .DAT localization keys in real time.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-rose-400 font-bold">Ctrl + F</span> —{' '}
                  {lang === 'es' ? 'Abrir barra Buscar y Reemplazar' : 'Open Find & Replace bar'}
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-rose-400 font-bold">Ctrl + S</span> —{' '}
                  {lang === 'es' ? 'Exportar / Guardar archivo XML' : 'Export / Save XML file'}
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-rose-400 font-bold">Ctrl + Z / Y</span> —{' '}
                  {lang === 'es' ? 'Deshacer / Rehacer cambios' : 'Undo / Redo changes'}
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-rose-400 font-bold">Click en Tag EaW</span> —{' '}
                  {lang === 'es' ? 'Envolver selección o insertar etiqueta' : 'Wrap selection or insert tag'}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-mono font-bold text-xs uppercase rounded cursor-pointer"
              >
                {lang === 'es' ? 'Entendido' : 'Got It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
