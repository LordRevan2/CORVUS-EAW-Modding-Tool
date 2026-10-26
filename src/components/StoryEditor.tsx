import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Download,
  Plus,
  Trash2,
  Search,
  XCircle,
  Code,
  Sliders,
  AlertCircle,
  Sparkles,
  Check,
  HelpCircle,
  X,
  Copy,
  GitBranch,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Award,
  Repeat,
  Power,
  Layers,
  ExternalLink,
  Globe,
  Info
} from 'lucide-react';
import { StoryEvent, AppSettings, Planet } from '../types';
import {
  updateStoryEventInDoc,
  serializeXml,
  parseStoryXml,
  updateStoryEventFromXml,
  parseStoryElement,
  createSampleStoryXml
} from '../lib/xml';
import { DatRecord } from '../lib/dat';
import { useTranslation, useLanguage, tr } from '../i18n';
import { CodeEditorWithLines } from './XmlEditor';

interface ParamHint {
  labelEn: string;
  labelEs: string;
  placeholder?: string;
  datalist?: 'planets' | 'events' | 'flags' | 'branches' | 'factions' | 'operators' | 'conquerFilters' | 'datKeys';
}

interface StoryTypeDefinition {
  en: string;
  es: string;
  category: string;
  params?: ParamHint[];
}

const EVENT_TYPES: Record<string, StoryTypeDefinition> = {
  STORY_ELAPSED: {
    category: 'Timing & Flow',
    en: 'Triggers after a specified amount of time (in seconds) has elapsed since prerequisites were met.',
    es: 'Se activa tras transcurrir una cantidad específica de tiempo (en segundos) desde que se cumplieron los prerrequisitos.',
    params: [
      { labelEn: 'Delay Time (Seconds)', labelEs: 'Tiempo de Espera (Segundos)', placeholder: '5' }
    ]
  },
  STORY_TRIGGER: {
    category: 'Timing & Flow',
    en: 'Fires immediately as soon as its Prereq events are fulfilled without waiting for an external action.',
    es: 'Se dispara inmediatamente en cuanto se cumplen sus eventos Prereq sin esperar otra condición externa.',
    params: []
  },
  STORY_FLAG: {
    category: 'Flags & Variables',
    en: 'Monitors a script variable/flag and triggers when it matches the comparison condition.',
    es: 'Monitoriza una variable/flag y se dispara cuando cumple el valor y operador de comparación.',
    params: [
      { labelEn: 'Flag Name', labelEs: 'Nombre de la Flag', placeholder: 'Campaign_Initialized_Flag', datalist: 'flags' },
      { labelEn: 'Target Value (Number)', labelEs: 'Valor Objetivo (Número)', placeholder: '1' },
      { labelEn: 'Comparison Operator', labelEs: 'Operador de Comparación', placeholder: 'GREATER_THAN_EQUAL_TO', datalist: 'operators' }
    ]
  },
  STORY_AI_NOTIFICATION: {
    category: 'Timing & Flow',
    en: 'Triggered directly by a Lua script via Story_Event("NOTIFICATION_NAME") or AI notification.',
    es: 'Activado directamente desde un script Lua mediante Story_Event("NOMBRE") o notificación de IA.',
    params: [
      { labelEn: 'Notification / Lua Trigger String', labelEs: 'Identificador de Notificación Lua', placeholder: 'LUA_MISSION_PHASE_2' },
      { labelEn: 'Optional Planet Filter', labelEs: 'Filtro de Planeta (Opcional)', placeholder: 'Coruscant', datalist: 'planets' }
    ]
  },
  STORY_CONQUER: {
    category: 'Galactic Control',
    en: 'Triggers when a planet or list of planets is conquered by a faction.',
    es: 'Se activa cuando un planeta (o lista de planetas) es conquistado.',
    params: [
      { labelEn: 'Target Planet(s)', labelEs: 'Planeta(s) Objetivo', placeholder: 'Kuat', datalist: 'planets' },
      { labelEn: 'Conquer Filter Mode', labelEs: 'Modo de Filtro de Conquista', placeholder: 'CONQUER_PLANET', datalist: 'conquerFilters' },
      { labelEn: 'Faction Filter (Optional)', labelEs: 'Filtro de Facción (Opcional)', placeholder: 'Empire', datalist: 'factions' }
    ]
  },
  STORY_ENTER: {
    category: 'Galactic Control',
    en: 'Triggers when a fleet or hero unit enters orbit over a specified planet.',
    es: 'Se activa cuando una flota o unidad héroe entra en la órbita del planeta indicado.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Nombre del Planeta', placeholder: 'Coruscant', datalist: 'planets' },
      { labelEn: 'Required Fleet / Unit Type (0 for Any)', labelEs: 'Unidad / Héroe Requerido (0 para Cualquiera)', placeholder: '0' },
      { labelEn: 'Target Faction Filter', labelEs: 'Filtro de Facción', placeholder: 'Empire', datalist: 'factions' },
      { labelEn: 'Minimum Fleet Count', labelEs: 'Cantidad Mínima', placeholder: '1' }
    ]
  },
  STORY_LAND_ON: {
    category: 'Galactic Control',
    en: 'Triggers when ground forces land on the surface of a specified planet.',
    es: 'Se activa cuando tropas terrestres aterrizan en la superficie del planeta especificado.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Nombre del Planeta', placeholder: 'Tatooine', datalist: 'planets' },
      { labelEn: 'Specific Unit Type (Optional)', labelEs: 'Tipo de Unidad Específica (Opcional)', placeholder: 'Darth_Vader' }
    ]
  },
  STORY_MOVE: {
    category: 'Galactic Control',
    en: 'Triggers when a fleet moves between two galactic planets.',
    es: 'Se activa cuando una flota se desplaza hacia un sistema planetario.',
    params: [
      { labelEn: 'Origin Planet (or Any)', labelEs: 'Planeta de Origen', placeholder: 'Corellia', datalist: 'planets' },
      { labelEn: 'Destination Planet', labelEs: 'Planeta de Destino', placeholder: 'Kuat', datalist: 'planets' }
    ]
  },
  STORY_CONSTRUCT: {
    category: 'Production & Tech',
    en: 'Triggers when the player constructs a specific unit, starbase, or ground structure.',
    es: 'Se activa cuando se construye una unidad, estación espacial o estructura específica.',
    params: [
      { labelEn: 'Unit / Structure XML Name', labelEs: 'Nombre XML de Unidad o Estructura', placeholder: 'Star_Destroyer' },
      { labelEn: 'Quantity Required', labelEs: 'Cantidad Requerida', placeholder: '1' },
      { labelEn: 'Filter Type (CONSTRUCT_TYPE / PLANET)', labelEs: 'Filtro o Planeta', placeholder: 'Kuat', datalist: 'planets' }
    ]
  },
  STORY_CONSTRUCT_LEVEL: {
    category: 'Production & Tech',
    en: 'Triggers when a starbase or planetary base reaches a specific upgrade level.',
    es: 'Se activa cuando una base estelar o planetaria alcanza un nivel específico.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Planeta', placeholder: 'Coruscant', datalist: 'planets' },
      { labelEn: 'Base Level (1-5)', labelEs: 'Nivel de Base (1-5)', placeholder: '3' },
      { labelEn: 'Base Type (SPACE / GROUND)', labelEs: 'Tipo de Base (SPACE / GROUND)', placeholder: 'SPACE' }
    ]
  },
  STORY_TECH_LEVEL: {
    category: 'Production & Tech',
    en: 'Triggers when the faction reaches a specified technology tier.',
    es: 'Se activa cuando la facción alcanza un nivel tecnológico específico.',
    params: [
      { labelEn: 'Target Tech Level (0-5)', labelEs: 'Nivel Tecnológico (0-5)', placeholder: '2' }
    ]
  },
  STORY_ACCUMULATE: {
    category: 'Production & Tech',
    en: 'Triggers when the player accumulates a specified amount of galactic credits.',
    es: 'Se activa cuando el jugador acumula una cantidad determinada de créditos galácticos.',
    params: [
      { labelEn: 'Credits Amount', labelEs: 'Cantidad de Créditos', placeholder: '10000' },
      { labelEn: 'Comparison Operator', labelEs: 'Operador de Comparación', placeholder: 'GREATER_THAN_EQUAL_TO', datalist: 'operators' }
    ]
  },
  STORY_DESTROY: {
    category: 'Combat & Tactical',
    en: 'Triggers when a specific unit, hero, or structure type is destroyed.',
    es: 'Se activa cuando una unidad, héroe o estructura específica es destruida.',
    params: [
      { labelEn: 'Target Object / Unit XML Name', labelEs: 'Nombre XML del Objetivo', placeholder: 'Rebel_Star_Base_1' },
      { labelEn: 'Destruction Filter (DESTROY_ALL / COUNT)', labelEs: 'Filtro de Destrucción / Cantidad', placeholder: '1' },
      { labelEn: 'Planet Filter (Optional)', labelEs: 'Planeta (Opcional)', placeholder: 'Yavin', datalist: 'planets' }
    ]
  },
  STORY_DESTROY_BASE: {
    category: 'Combat & Tactical',
    en: 'Triggers when an orbital starbase or ground base on a planet is destroyed.',
    es: 'Se activa cuando la base espacial o terrestre de un planeta es destruida.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Planeta', placeholder: 'Hoth', datalist: 'planets' },
      { labelEn: 'Base Type (SPACE_BASE / GROUND_BASE)', labelEs: 'Tipo de Base (SPACE_BASE / GROUND_BASE)', placeholder: 'SPACE_BASE' }
    ]
  },
  STORY_TACTICAL_DESTROY: {
    category: 'Combat & Tactical',
    en: 'Triggers during a tactical battle when a specific unit or hero is destroyed.',
    es: 'Se activa durante una batalla táctica cuando una unidad o héroe específico es destruido.',
    params: [
      { labelEn: 'Unit / Structure XML Name', labelEs: 'Nombre XML de Unidad / Estructura', placeholder: 'Empire_Power_Generator' },
      { labelEn: 'Optional Filter', labelEs: 'Filtro Adicional', placeholder: '1' }
    ]
  },
  STORY_WIN_BATTLES: {
    category: 'Combat & Tactical',
    en: 'Triggers after winning a certain number of space or land battles.',
    es: 'Se activa tras ganar un número determinado de batallas espaciales o terrestres.',
    params: [
      { labelEn: 'Number of Battles Won', labelEs: 'Número de Batallas Ganadas', placeholder: '3' },
      { labelEn: 'Battle Type (SPACE / LAND / ANY)', labelEs: 'Tipo de Batalla (SPACE / LAND / ANY)', placeholder: 'ANY' }
    ]
  },
  STORY_LOSE_BATTLES: {
    category: 'Combat & Tactical',
    en: 'Triggers after losing a specified number of battles.',
    es: 'Se activa tras perder un número determinado de batallas.',
    params: [
      { labelEn: 'Number of Battles Lost', labelEs: 'Número de Batallas Perdidas', placeholder: '1' }
    ]
  },
  STORY_MISSION_LOST: {
    category: 'Combat & Tactical',
    en: 'Triggers if the current tactical story mission is lost.',
    es: 'Se activa si se pierde la misión táctica de historia actual.',
    params: [
      { labelEn: 'Mission / Planet Identifier', labelEs: 'Identificador de Misión / Planeta', placeholder: 'Coruscant', datalist: 'planets' }
    ]
  },
  STORY_SPEECH_DONE: {
    category: 'Audio & UI',
    en: 'Triggers when a specified speech audio event finishes playing.',
    es: 'Se activa cuando finaliza la reproducción de una línea de voz específica.',
    params: [
      { labelEn: 'Speech Audio Event Name', labelEs: 'Nombre del Evento de Voz (Speech)', placeholder: 'SID_INTRO_SPEECH_01' }
    ]
  },
  STORY_MOVIE_DONE: {
    category: 'Audio & UI',
    en: 'Triggers when a bik movie or radar cinematic finishes playing.',
    es: 'Se activa cuando termina de reproducirse un vídeo (.bik) o cinemática.',
    params: [
      { labelEn: 'Movie Entry Name', labelEs: 'Nombre del Vídeo / Película', placeholder: 'Emperor_Loop' }
    ]
  },
  STORY_SELECT_PLANET: {
    category: 'Audio & UI',
    en: 'Triggers when the player clicks/selects a specific planet on the galactic map.',
    es: 'Se activa cuando el jugador selecciona un planeta específico en el mapa galáctico.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Nombre del Planeta', placeholder: 'Kuat', datalist: 'planets' }
    ]
  },
  STORY_CLICK_GUI: {
    category: 'Audio & UI',
    en: 'Triggers when the player clicks a specific UI button (used heavily in tutorials and guided missions).',
    es: 'Se activa cuando el jugador pulsa un botón específico de la interfaz GUI.',
    params: [
      { labelEn: 'GUI Element Identifier', labelEs: 'Identificador del Botón GUI', placeholder: 'b_holocron_log' }
    ]
  },
  STORY_GENERIC: {
    category: 'Audio & UI',
    en: 'Triggers on generic engine events such as campaign start, game load, orzooming.',
    es: 'Se activa ante eventos genéricos del motor (inicio, carga, zoom, etc.).',
    params: [
      { labelEn: 'Generic Action Keyword', labelEs: 'Palabra Clave Genérica', placeholder: 'STORY_START' }
    ]
  },
  STORY_SMUGGLE: {
    category: 'Galactic Control',
    en: 'Triggers when a smuggler successfully establishes a siphon on a target planet.',
    es: 'Se activa cuando un contrabandista establece contrabando en el planeta indicado.',
    params: [
      { labelEn: 'Target Planet Name', labelEs: 'Planeta Objetivo', placeholder: 'Bespin', datalist: 'planets' }
    ]
  },
  STORY_CORRUPT: {
    category: 'Galactic Control',
    en: 'Triggers when the Underworld corrupts a planet in Forces of Corruption.',
    es: 'Se activa cuando el Consorcio Zann corrompe un planeta en Forces of Corruption.',
    params: [
      { labelEn: 'Target Planet Name', labelEs: 'Planeta Corrompido', placeholder: 'Corellia', datalist: 'planets' }
    ]
  },
  STORY_BUY_BLACK_MARKET: {
    category: 'Production & Tech',
    en: 'Triggers when a black market technology or item is purchased.',
    es: 'Se activa cuando se compra tecnología en el mercado negro.',
    params: [
      { labelEn: 'Upgrade / Unit Name', labelEs: 'Nombre de Mejora o Unidad', placeholder: 'Shield_Disruptor' }
    ]
  }
};

const REWARD_TYPES: Record<string, StoryTypeDefinition> = {
  NONE: {
    category: 'Flow & Scripting',
    en: 'No direct reward; used when the event only serves as a prerequisite milestone or holocron entry.',
    es: 'Sin recompensa directa; usado cuando el evento sirve como hito Prereq o entrada del Holocrón.',
    params: []
  },
  SET_FLAG: {
    category: 'Flow & Scripting',
    en: 'Creates or sets a script flag variable to a specific numeric value.',
    es: 'Crea o asigna un valor numérico a una variable/flag del script.',
    params: [
      { labelEn: 'Flag Name', labelEs: 'Nombre de la Flag', placeholder: 'Campaign_Initialized_Flag', datalist: 'flags' },
      { labelEn: 'Numeric Value', labelEs: 'Valor Numérico', placeholder: '1' }
    ]
  },
  INCREMENT_FLAG: {
    category: 'Flow & Scripting',
    en: 'Adds (or subtracts) an integer delta to an existing script flag.',
    es: 'Incrementa (o reduce) el valor de una flag existente.',
    params: [
      { labelEn: 'Flag Name', labelEs: 'Nombre de la Flag', placeholder: 'Planets_Captured_Count', datalist: 'flags' },
      { labelEn: 'Increment Amount (+/-)', labelEs: ' Incremento (+/-)', placeholder: '1' }
    ]
  },
  ENABLE_EVENT: {
    category: 'Flow & Scripting',
    en: 'Re-enables or activates a target story event so it can evaluate and fire.',
    es: 'Habilita o reactiva un evento de historia específico para que pueda ejecutarse.',
    params: [
      { labelEn: 'Target Event Name', labelEs: 'Nombre del Evento Objetivo', placeholder: 'Capture_Kuat_Shipyards', datalist: 'events' }
    ]
  },
  DISABLE_EVENT: {
    category: 'Flow & Scripting',
    en: 'Disables a target story event so it will no longer fire.',
    es: 'Desactiva un evento de historia para evitar que se dispare.',
    params: [
      { labelEn: 'Target Event Name', labelEs: 'Nombre del Evento Objetivo', placeholder: 'Capture_Kuat_Shipyards', datalist: 'events' }
    ]
  },
  DISABLE_BRANCH: {
    category: 'Flow & Scripting',
    en: 'Disables all story events belonging to the specified <Branch> name.',
    es: 'Desactiva todos los eventos que pertenezcan a la rama (<Branch>) indicada.',
    params: [
      { labelEn: 'Target Branch Name', labelEs: 'Nombre de la Rama (Branch)', placeholder: 'Branch_Core_Assault', datalist: 'branches' }
    ]
  },
  RESET_BRANCH: {
    category: 'Flow & Scripting',
    en: 'Resets all story events inside the specified <Branch> so the entire sequence can run again.',
    es: 'Reinicia todos los eventos de la rama (<Branch>) indicada para que puedan volver a ejecutarse.',
    params: [
      { labelEn: 'Target Branch Name', labelEs: 'Nombre de la Rama (Branch)', placeholder: 'Branch_Core_Assault', datalist: 'branches' }
    ]
  },
  STORY_GOAL_COMPLETED: {
    category: 'Holocron & Objectives',
    en: 'Marks an active Holocron objective (identified by its <Story_Tag>) as completed.',
    es: 'Marca como completado un objetivo del Holocrón (identificado por su <Story_Tag>).',
    params: [
      { labelEn: 'Target Story_Tag Name', labelEs: 'Etiqueta Story_Tag Objetivo', placeholder: 'Goal_Capture_Kuat' }
    ]
  },
  REMOVE_STORY_GOAL: {
    category: 'Holocron & Objectives',
    en: 'Removes an objective entry from the player Holocron log without showing completion.',
    es: 'Elimina un objetivo del registro del Holocrón.',
    params: [
      { labelEn: 'Target Story_Tag Name', labelEs: 'Etiqueta Story_Tag a Eliminar', placeholder: 'Goal_Capture_Kuat' }
    ]
  },
  SPAWN_HERO: {
    category: 'Units & Reinforcements',
    en: 'Spawns a named hero unit or team at the specified planet.',
    es: 'Genera una unidad o equipo de héroe en el planeta especificado.',
    params: [
      { labelEn: 'Hero / Team XML Name', labelEs: 'Nombre XML del Héroe / Equipo', placeholder: 'Grand_Moff_Tarkin_Team' },
      { labelEn: 'Spawn Planet Name', labelEs: 'Planeta de Aparición', placeholder: 'Coruscant', datalist: 'planets' }
    ]
  },
  UNIQUE_UNIT: {
    category: 'Units & Reinforcements',
    en: 'Spawns a specific unit or squadron at the target planet for the player or AI.',
    es: 'Otorga e instancia una unidad específica en el planeta indicado.',
    params: [
      { labelEn: 'Unit XML Name', labelEs: 'Nombre XML de la Unidad', placeholder: 'Star_Destroyer' },
      { labelEn: 'Spawn Planet Name', labelEs: 'Planeta de Aparición', placeholder: 'Kuat', datalist: 'planets' },
      { labelEn: 'Owner Faction (Optional)', labelEs: 'Facción Propietaria (Opcional)', placeholder: 'Empire', datalist: 'factions' }
    ]
  },
  BUILDABLE_UNIT: {
    category: 'Units & Reinforcements',
    en: 'Unlocks a locked unit or structure type so it can now be produced at factories/shipyards.',
    es: 'Desbloquea una unidad o estructura para que pueda ser construida en astilleros o fábricas.',
    params: [
      { labelEn: 'Unit / Structure XML Name', labelEs: 'Nombre XML de la Unidad / Estructura', placeholder: 'Star_Destroyer' }
    ]
  },
  LOCK_UNIT: {
    category: 'Units & Reinforcements',
    en: 'Locks a buildable unit or structure so the player can no longer produce it.',
    es: 'Bloquea la producción de una unidad o estructura en la campaña.',
    params: [
      { labelEn: 'Unit / Structure XML Name', labelEs: 'Nombre XML de la Unidad / Estructura', placeholder: 'Death_Star' }
    ]
  },
  DESTROY_OBJECT: {
    category: 'Units & Reinforcements',
    en: 'Removes/destroys an existing unit or hero instance from the galaxy.',
    es: 'Elimina o destruye una instancia de unidad o héroe de la galaxia.',
    params: [
      { labelEn: 'Unit / Hero XML Name', labelEs: 'Nombre XML del Objeto', placeholder: 'Obi_Wan_Team' }
    ]
  },
  CREDITS: {
    category: 'Economy & Tech',
    en: 'Grants (or deducts if negative) galactic credits to the faction.',
    es: 'Otorga (o resta si es negativo) créditos galácticos.',
    params: [
      { labelEn: 'Credit Amount (+/-)', labelEs: 'Cantidad de Créditos (+/-)', placeholder: '5000' },
      { labelEn: 'Target Faction (Optional)', labelEs: 'Facción Objetivo (Opcional)', placeholder: 'Empire', datalist: 'factions' }
    ]
  },
  TECH_LEVEL: {
    category: 'Economy & Tech',
    en: 'Sets the faction technology tier directly to the specified level.',
    es: 'Establece directamente el nivel tecnológico de la facción.',
    params: [
      { labelEn: 'New Tech Level (0-5)', labelEs: 'Nuevo Nivel Tecnológico (0-5)', placeholder: '3' }
    ]
  },
  NEW_POWER_FOR_ALL: {
    category: 'Galactic Map & Planets',
    en: 'Transfers ownership of a planet to the specified faction.',
    es: 'Cambia el control/propietario de un planeta a la facción indicada.',
    params: [
      { labelEn: 'Target Planet Name', labelEs: 'Planeta Objetivo', placeholder: 'Alderaan', datalist: 'planets' },
      { labelEn: 'New Owner Faction', labelEs: 'Nueva Facción Propietaria', placeholder: 'Empire', datalist: 'factions' }
    ]
  },
  SWITCH_CONTROL: {
    category: 'Galactic Map & Planets',
    en: 'Switches allegiance of units/planet between factions.',
    es: 'Cambia la lealtad de unidades o planeta entre facciones.',
    params: [
      { labelEn: 'Source / Planet', labelEs: 'Origen / Planeta', placeholder: 'Kamino', datalist: 'planets' },
      { labelEn: 'New Faction', labelEs: 'Nueva Facción', placeholder: 'Rebel', datalist: 'factions' }
    ]
  },
  REVEAL_PLANET: {
    category: 'Galactic Map & Planets',
    en: 'Reveals fog of war over a specific planet on the galactic map.',
    es: 'Revela la niebla de guerra sobre un planeta específico en el mapa galáctico.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Nombre del Planeta', placeholder: 'Coruscant', datalist: 'planets' },
      { labelEn: 'Reveal Flag (1 = Reveal, 0 = Hide)', labelEs: 'Visibilidad (1 = Mostrar, 0 = Ocultar)', placeholder: '1' }
    ]
  },
  REVEAL_ALL_PLANETS: {
    category: 'Galactic Map & Planets',
    en: 'Reveals galactic fog of war across all planets.',
    es: 'Revela la niebla de guerra en todos los planetas del mapa galáctico.',
    params: [
      { labelEn: 'Enable (1 / 0)', labelEs: 'Activar (1 / 0)', placeholder: '1' }
    ]
  },
  FLASH_PLANET_GUI: {
    category: 'Galactic Map & Planets',
    en: 'Flashes a planet icon on the galactic map to draw player attention.',
    es: 'Hace parpadear el icono de un planeta en el mapa galáctico para guiar al jugador.',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Nombre del Planeta', placeholder: 'Kuat', datalist: 'planets' },
      { labelEn: 'Flash Mode (GUI_FLASH / HIDE_TUTORIAL_CURSOR)', labelEs: 'Modo de Parpadeo', placeholder: 'GUI_FLASH' },
      { labelEn: 'Duration / Count', labelEs: 'Duración / Repeticiones', placeholder: '3' },
      { labelEn: 'Flash Tag ID (for stopping later)', labelEs: 'ID de Etiqueta (para detener después)', placeholder: 'Flash_Kuat_01' }
    ]
  },
  POSITION_CAMERA: {
    category: 'Galactic Map & Planets',
    en: 'Centers the galactic or tactical camera on a specific planet or coordinate.',
    es: 'Centra la cámara galáctica o táctica sobre un planeta específico.',
    params: [
      { labelEn: 'Target Planet / Object Name', labelEs: 'Planeta u Objeto Objetivo', placeholder: 'Coruscant', datalist: 'planets' },
      { labelEn: 'Offset X,Y,Z (Optional)', labelEs: 'Desplazamiento X,Y,Z (Opcional)', placeholder: '0,0,0' }
    ]
  },
  MULTIMEDIA: {
    category: 'Narrative, Audio & HUD',
    en: 'Displays screen text, plays a speech audio clip, and optionally shows a command bar movie loop.',
    es: 'Muestra texto en pantalla, reproduce audio de voz y muestra un holograma/vídeo en interfaz.',
    params: [
      { labelEn: 'Text String ID (.DAT Key)', labelEs: 'ID de Texto (.DAT Key)', placeholder: 'TEXT_STORY_CORE_ASSAULT_BRIEFING', datalist: 'datKeys' },
      { labelEn: 'Display Duration (Seconds, -1 = Hold)', labelEs: 'Duración en Pantalla (Seg, -1 = Fijo)', placeholder: '10' },
      { labelEn: 'Optional Variable Parameter', labelEs: 'Parámetro Variable (Opcional)', placeholder: '' },
      { labelEn: 'Remove Previous Text (1 / 0)', labelEs: 'Eliminar Texto Previo (1 / 0)', placeholder: '1' },
      { labelEn: 'Teletype Effect (1 / 0)', labelEs: 'Efecto Teletipo (1 / 0)', placeholder: '0' },
      { labelEn: 'Speech Event Name', labelEs: 'Nombre de Audio Speech', placeholder: 'SID_BRIEFING_01' },
      { labelEn: 'Text Color (R,G,B)', labelEs: 'Color de Texto (R,G,B)', placeholder: '109, 247, 255' },
      { labelEn: 'Movie / Hologram Loop Name', labelEs: 'Nombre de Vídeo / Holograma', placeholder: 'Tarkin_Loop' }
    ]
  },
  SCREEN_TEXT: {
    category: 'Narrative, Audio & HUD',
    en: 'Prints a localized text string from MasterTextFile.dat directly onto the screen.',
    es: 'Muestra una cadena de texto localizada del MasterTextFile.dat en pantalla.',
    params: [
      { labelEn: 'Text String ID (.DAT Key)', labelEs: 'ID de Texto (.DAT Key)', placeholder: 'TEXT_STORY_TRANSMISSION_01', datalist: 'datKeys' },
      { labelEn: 'Duration (Seconds, -1 = Permanent)', labelEs: 'Duración (Segundos, -1 = Permanente)', placeholder: '8' },
      { labelEn: 'Variable Value (Optional)', labelEs: 'Variable (Opcional)', placeholder: '' },
      { labelEn: 'Remove Flag (REMOVE / empty)', labelEs: 'Eliminar Texto (REMOVE / vacío)', placeholder: '' }
    ]
  },
  SPEECH: {
    category: 'Narrative, Audio & HUD',
    en: 'Plays a localized voiceover event defined in SFXEvents.xml.',
    es: 'Reproduce una línea de diálogo por voz definida en SFXEvents.xml.',
    params: [
      { labelEn: 'Speech Audio Event Name', labelEs: 'Nombre del Evento de Voz', placeholder: 'SID_VADER_SPEECH_01' }
    ]
  },
  DIALOG: {
    category: 'Narrative, Audio & HUD',
    en: 'Opens a specific chapter in a Story Dialog .TXT script file.',
    es: 'Abre un capítulo específico de un archivo de diálogo .TXT.',
    params: [
      { labelEn: 'Dialog Script Filename (no .txt)', labelEs: 'Archivo de Diálogo (sin .txt)', placeholder: 'Story_Campaign_Dialogs' },
      { labelEn: 'Chapter Number', labelEs: 'Número de Capítulo', placeholder: '0' }
    ]
  },
  START_MOVIE: {
    category: 'Narrative, Audio & HUD',
    en: 'Plays a full-screen or radar BIK movie defined in Movies.xml.',
    es: 'Reproduce una película .bik definida en Movies.xml.',
    params: [
      { labelEn: 'Movie Entry Name', labelEs: 'Nombre de Película (Movies.xml)', placeholder: 'Intro_Cinematic_Movie' }
    ]
  },
  LINK_TACTICAL: {
    category: 'Combat & Tactical',
    en: 'Links a planet battle to a custom tactical map (.ted) and optional tactical story script (.xml).',
    es: 'Vincula un planeta a un mapa táctico (.ted) y un script de misión táctica (.xml).',
    params: [
      { labelEn: 'Planet Name', labelEs: 'Planeta', placeholder: 'Kuat', datalist: 'planets' },
      { labelEn: 'Battle Domain (SPACE / LAND)', labelEs: 'Dominio (SPACE / LAND)', placeholder: 'SPACE' },
      { labelEn: 'Defender Faction', labelEs: 'Facción Defensora', placeholder: 'Rebel', datalist: 'factions' },
      { labelEn: 'Tactical Map Name (.ted)', labelEs: 'Mapa Táctico (.ted)', placeholder: '_Space_Planet_Kuat_01.ted' },
      { labelEn: 'Attacker Faction', labelEs: 'Facción Atacante', placeholder: 'Empire', datalist: 'factions' },
      { labelEn: 'Attacker Entry Marker', labelEs: 'Marcador de Entrada', placeholder: '0' },
      { labelEn: 'Sub-Story XML Filename', labelEs: 'Script XML de Misión Táctica', placeholder: 'Story_Tactical_Kuat.xml' }
    ]
  },
  VICTORY: {
    category: 'Combat & Tactical',
    en: 'Immediately declares campaign or tactical victory for the specified faction.',
    es: 'Declara inmediatamente la victoria para la facción especificada.',
    params: [
      { labelEn: 'Winning Faction', labelEs: 'Facción Ganadora', placeholder: 'Empire', datalist: 'factions' }
    ]
  },
  ENABLE_VICTORY: {
    category: 'Combat & Tactical',
    en: 'Enables or disables automatic standard victory conditions (1 = Enable, 0 = Disable during story missions).',
    es: 'Activa o desactiva las condiciones de victoria estándar (1 = Activar, 0 = Desactivar).',
    params: [
      { labelEn: 'Enable Standard Victory (1 / 0)', labelEs: 'Permitir Victoria Estándar (1 / 0)', placeholder: '0' }
    ]
  },
  TRIGGER_AI: {
    category: 'Combat & Tactical',
    en: 'Sends a trigger string to the AI or associated Lua script.',
    es: 'Envía una señal de disparo a la IA o al script Lua asociado.',
    params: [
      { labelEn: 'AI / Lua Trigger Name', labelEs: 'Nombre del Disparo IA / Lua', placeholder: 'AI_START_INVASION' }
    ]
  },
  PAUSE_GALAXY: {
    category: 'Flow & Scripting',
    en: 'Pauses galactic time progression while briefings or cutscenes play.',
    es: 'Pausa el tiempo galáctico mientras se reproducen briefings o escenas.',
    params: [
      { labelEn: 'Pause State (1 = Pause, 0 = Resume)', labelEs: 'Estado (1 = Pausar, 0 = Reanudar)', placeholder: '1' }
    ]
  }
};

interface StoryPatternTemplate {
  id: string;
  labelEn: string;
  labelEs: string;
  descEn: string;
  descEs: string;
  buildEvents: (existingCount: number, defaultPlanet: string) => Array<Omit<StoryEvent, 'id' | 'el'>>;
}

const STORY_TEMPLATES: StoryPatternTemplate[] = [
  {
    id: 'init_briefing',
    labelEn: 'Mission Start + Holocron Briefing',
    labelEs: 'Inicio de Misión + Briefing Holocrón',
    descEn: 'Creates a 2-event chain: initializes a campaign flag after 2s and triggers a Multimedia briefing with a Holocron goal.',
    descEs: 'Crea una cadena de 2 eventos: inicializa una flag tras 2s y lanza un briefing Multimedia con objetivo en el Holocrón.',
    buildEvents: (count, planet) => [
      {
        name: `Init_Phase_${count + 1}`,
        eventType: 'STORY_ELAPSED',
        eventParams: ['2'],
        rewardType: 'SET_FLAG',
        rewardParams: [`Phase_${count + 1}_Ready`, '1'],
        prereqs: [],
        storyDialog: '',
        storyChapter: '',
        storyTag: '',
        branch: `Branch_Phase_${count + 1}`,
        perpetual: false,
        active: true
      },
      {
        name: `Briefing_Phase_${count + 1}`,
        eventType: 'STORY_FLAG',
        eventParams: [`Phase_${count + 1}_Ready`, '1', 'GREATER_THAN_EQUAL_TO'],
        rewardType: 'MULTIMEDIA',
        rewardParams: [`TEXT_STORY_BRIEFING_0${count + 1}`, '10'],
        prereqs: [`Init_Phase_${count + 1}`],
        storyDialog: 'Story_Campaign_Dialogs',
        storyChapter: '0',
        storyTag: `Goal_Conquer_${planet}`,
        branch: `Branch_Phase_${count + 1}`,
        perpetual: false,
        active: true
      }
    ]
  },
  {
    id: 'conquer_hero',
    labelEn: 'Conquer Planet -> Spawn Hero + Complete Goal',
    labelEs: 'Conquistar Planeta -> Generar Héroe + Completar Objetivo',
    descEn: 'Triggers when a target planet is conquered, spawns a hero team on that planet, and completes the Holocron objective.',
    descEs: 'Se activa al conquistar un planeta, despliega un héroe en él y marca el objetivo del Holocrón como completado.',
    buildEvents: (count, planet) => [
      {
        name: `Conquer_${planet}_${count + 1}`,
        eventType: 'STORY_CONQUER',
        eventParams: [planet, 'CONQUER_PLANET'],
        rewardType: 'SPAWN_HERO',
        rewardParams: ['Darth_Vader', planet],
        prereqs: [],
        storyDialog: '',
        storyChapter: '',
        storyTag: '',
        branch: `Branch_${planet}`,
        perpetual: false,
        active: true
      },
      {
        name: `Complete_${planet}_Goal_${count + 1}`,
        eventType: 'STORY_TRIGGER',
        eventParams: [],
        rewardType: 'STORY_GOAL_COMPLETED',
        rewardParams: [`Goal_Conquer_${planet}`],
        prereqs: [`Conquer_${planet}_${count + 1}`],
        storyDialog: '',
        storyChapter: '',
        storyTag: '',
        branch: `Branch_${planet}`,
        perpetual: false,
        active: true
      }
    ]
  },
  {
    id: 'timer_unlock',
    labelEn: 'Timed Tech / Buildable Unit Unlock',
    labelEs: 'Temporizador -> Desbloquear Unidad Construible',
    descEn: 'Waits for a timer and unlocks a capital ship or unit for production.',
    descEs: 'Espera un tiempo determinado y desbloquea la producción de una nave o unidad.',
    buildEvents: (count) => [
      {
        name: `Unlock_Research_Unit_${count + 1}`,
        eventType: 'STORY_ELAPSED',
        eventParams: ['30'],
        rewardType: 'BUILDABLE_UNIT',
        rewardParams: ['Star_Destroyer'],
        prereqs: [],
        storyDialog: '',
        storyChapter: '',
        storyTag: '',
        branch: 'Branch_Tech_Progression',
        perpetual: false,
        active: true
      }
    ]
  },
  {
    id: 'perpetual_loop',
    labelEn: 'Perpetual Reinforcement / Credit Loop',
    labelEs: 'Bucle Perpetuo de Créditos / Refuerzos',
    descEn: 'Creates a repeating (<Perpetual>true</Perpetual>) event that grants credits periodically.',
    descEs: 'Crea un evento repetitivo (<Perpetual>true</Perpetual>) que otorga créditos periódicamente.',
    buildEvents: (count) => [
      {
        name: `Periodic_Tribute_Loop_${count + 1}`,
        eventType: 'STORY_ELAPSED',
        eventParams: ['60'],
        rewardType: 'CREDITS',
        rewardParams: ['2500'],
        prereqs: [],
        storyDialog: '',
        storyChapter: '',
        storyTag: '',
        branch: 'Branch_Economy_Loop',
        perpetual: true,
        active: true
      }
    ]
  }
];

interface StoryDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'cross_file' | 'syntax' | 'logic';
  eventId: string;
  eventName: string;
  messageEn: string;
  messageEs: string;
}

interface StoryEditorProps {
  initialDoc: XMLDocument;
  initialEvents: StoryEvent[];
  fileName: string;
  onClose: () => void;
  onError: (msg: string) => void;
  settings: AppSettings;
  onUpdateDoc: (doc: XMLDocument, events: StoryEvent[]) => void;
  planets?: Planet[];
  datRecords?: DatRecord[] | null;
}

export default function StoryEditor({
  initialDoc,
  initialEvents,
  fileName,
  onClose,
  onError,
  settings,
  onUpdateDoc,
  planets = [],
  datRecords = null
}: StoryEditorProps) {
  const t = useTranslation();
  const lang = useLanguage();
  const [doc, setDoc] = useState<XMLDocument>(initialDoc);
  const [events, setEvents] = useState<StoryEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<StoryEvent | null>(initialEvents[0] || null);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [showIssuesOnly, setShowIssuesOnly] = useState<boolean>(false);
  const [hideCrossFileInSidebar, setHideCrossFileInSidebar] = useState<boolean>(false);
  const [auditFilter, setAuditFilter] = useState<'all' | 'errors' | 'warnings' | 'cross_file'>('all');

  const [viewMode, setViewMode] = useState<'params' | 'flow' | 'graph' | 'xml'>('params');
  const [graphZoom, setGraphZoom] = useState<number>(1);
  const [xmlScope, setXmlScope] = useState<'event' | 'document'>('event');
  const [rawXmlText, setRawXmlText] = useState<string>('');
  const [isXmlDirty, setIsXmlDirty] = useState<boolean>(false);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [helpTab, setHelpTab] = useState<'guide' | 'events' | 'rewards' | 'templates'>('guide');
  const [helpSearch, setHelpSearch] = useState<string>('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setDoc(initialDoc);
    setEvents(initialEvents);
    if (initialEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(initialEvents[0]);
    }
  }, [initialDoc, initialEvents]);

  useEffect(() => {
    if (viewMode === 'xml') {
      if (xmlScope === 'event' && selectedEvent) {
        const serializer = new XMLSerializer();
        setRawXmlText(formatXml(serializer.serializeToString(selectedEvent.el)));
      } else if (xmlScope === 'document') {
        setRawXmlText(formatXml(serializeXml(doc)));
      }
      setIsXmlDirty(false);
      setXmlError(null);
    }
  }, [viewMode, xmlScope, selectedEvent, doc]);

  function formatXml(xml: string) {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      let padding = '';
      for (let i = 0; i < pad; i++) padding += '  ';
      formatted += padding + node + '\r\n';
      pad += indent;
    });
    return formatted.trim();
  }

  // Extract smart autocomplete lists from current file & workspace
  const allBranches = useMemo(() => {
    const set = new Set<string>();
    events.forEach(ev => {
      if (ev.branch.trim()) set.add(ev.branch.trim());
      if ((ev.rewardType === 'DISABLE_BRANCH' || ev.rewardType === 'RESET_BRANCH') && ev.rewardParams[0]?.trim()) {
        set.add(ev.rewardParams[0].trim());
      }
    });
    return Array.from(set).sort();
  }, [events]);

  const allFlags = useMemo(() => {
    const set = new Set<string>();
    events.forEach(ev => {
      if ((ev.rewardType === 'SET_FLAG' || ev.rewardType === 'INCREMENT_FLAG') && ev.rewardParams[0]?.trim()) {
        set.add(ev.rewardParams[0].trim());
      }
      if (ev.eventType === 'STORY_FLAG' && ev.eventParams[0]?.trim()) {
        set.add(ev.eventParams[0].trim());
      }
    });
    return Array.from(set).sort();
  }, [events]);

  const allStoryTags = useMemo(() => {
    const set = new Set<string>();
    events.forEach(ev => {
      if (ev.storyTag.trim()) set.add(ev.storyTag.trim());
    });
    return Array.from(set).sort();
  }, [events]);

  const datMap = useMemo(() => {
    const map = new Map<string, string>();
    if (datRecords) {
      datRecords.forEach(r => map.set(r.key.toUpperCase(), r.value));
    }
    return map;
  }, [datRecords]);

  // Comprehensive Story Script Diagnostics
  const diagnostics = useMemo<StoryDiagnostic[]>(() => {
    const list: StoryDiagnostic[] = [];
    const eventNamesLower = new Map<string, number>();
    events.forEach(ev => {
      const k = ev.name.trim().toLowerCase();
      eventNamesLower.set(k, (eventNamesLower.get(k) || 0) + 1);
    });

    const definedFlagsLower = new Set<string>();
    events.forEach(ev => {
      if ((ev.rewardType === 'SET_FLAG' || ev.rewardType === 'INCREMENT_FLAG') && ev.rewardParams[0]?.trim()) {
        definedFlagsLower.add(ev.rewardParams[0].trim().toLowerCase());
      }
    });

    const definedStoryTagsLower = new Set<string>();
    events.forEach(ev => {
      if (ev.storyTag.trim()) definedStoryTagsLower.add(ev.storyTag.trim().toLowerCase());
    });

    events.forEach(ev => {
      const nameLower = ev.name.trim().toLowerCase();
      if ((eventNamesLower.get(nameLower) || 0) > 1) {
        list.push({
          id: `dup_${ev.id}`,
          severity: 'error',
          category: 'logic',
          eventId: ev.id,
          eventName: ev.name,
          messageEn: `Duplicate Event Name "${ev.name}". Each <Event> should have a unique Name.`,
          messageEs: `Nombre de evento duplicado "${ev.name}". Cada <Event> debe tener un nombre único.`
        });
      }

      if (!ev.eventType.trim()) {
        list.push({
          id: `no_type_${ev.id}`,
          severity: 'error',
          category: 'syntax',
          eventId: ev.id,
          eventName: ev.name,
          messageEn: `Missing <Event_Type>. The engine will not know when to trigger this event.`,
          messageEs: `Falta <Event_Type>. El motor no sabrá cuándo disparar este evento.`
        });
      }

      ev.prereqs.forEach(pr => {
        // Note: EaW allows OR groups separated by commas or spaces on a single Prereq line, check each token
        const tokens = pr.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
        tokens.forEach(tok => {
          if (!eventNamesLower.has(tok.toLowerCase())) {
            list.push({
              id: `cross_prereq_${ev.id}_${tok}`,
              severity: 'info',
              category: 'cross_file',
              eventId: ev.id,
              eventName: ev.name,
              messageEn: `External or cross-file <Prereq> reference: "${tok}" is not declared in this XML file. (Standard in EaW/FoC: resolves properly when defined in another Story file of the campaign plot).`,
              messageEs: `Referencia externa en <Prereq>: "${tok}" no está en este XML local. (Estándar en EaW/FoC: funcionará si está declarada en otro archivo Story de la trama de campaña).`
            });
          }
          if (tok.toLowerCase() === nameLower) {
            list.push({
              id: `self_prereq_${ev.id}`,
              severity: 'error',
              category: 'logic',
              eventId: ev.id,
              eventName: ev.name,
              messageEn: `Self-referencing <Prereq>: Event depends on itself and will never fire.`,
              messageEs: `Autoreferencia en <Prereq>: El evento depende de sí mismo y nunca se disparará.`
            });
          }
        });
      });

      if ((ev.rewardType === 'ENABLE_EVENT' || ev.rewardType === 'DISABLE_EVENT') && ev.rewardParams[0]?.trim()) {
        const targetEvt = ev.rewardParams[0].trim();
        if (!eventNamesLower.has(targetEvt.toLowerCase())) {
          list.push({
            id: `missing_target_evt_${ev.id}`,
            severity: 'info',
            category: 'cross_file',
            eventId: ev.id,
            eventName: ev.name,
            messageEn: `External target: ${ev.rewardType} references "${targetEvt}", which may reside in another Story file of the campaign.`,
            messageEs: `Destino externo: ${ev.rewardType} apunta a "${targetEvt}", que puede residir en otro archivo Story de la campaña.`
          });
        }
      }

      if (ev.eventType === 'STORY_FLAG' && ev.eventParams[0]?.trim()) {
        const flagName = ev.eventParams[0].trim();
        if (!definedFlagsLower.has(flagName.toLowerCase())) {
          list.push({
            id: `uninit_flag_${ev.id}`,
            severity: 'warning',
            category: 'logic',
            eventId: ev.id,
            eventName: ev.name,
            messageEn: `Monitors flag "${flagName}", which is not set by any SET_FLAG/INCREMENT_FLAG in this file (may be set via Lua).`,
            messageEs: `Monitoriza la flag "${flagName}", que no es inicializada con SET_FLAG en este XML (podría venir de Lua).`
          });
        }
      }

      if (
        (ev.rewardType === 'STORY_GOAL_COMPLETED' || ev.rewardType === 'REMOVE_STORY_GOAL') &&
        ev.rewardParams[0]?.trim()
      ) {
        const tagTarget = ev.rewardParams[0].trim();
        if (!definedStoryTagsLower.has(tagTarget.toLowerCase())) {
          list.push({
            id: `missing_tag_${ev.id}`,
            severity: 'warning',
            category: 'logic',
            eventId: ev.id,
            eventName: ev.name,
            messageEn: `${ev.rewardType} references Story_Tag "${tagTarget}", which is not declared on any event in this file.`,
            messageEs: `${ev.rewardType} referencia el Story_Tag "${tagTarget}", que no está declarado en ningún evento de este archivo.`
          });
        }
      }
    });

    return list;
  }, [events]);

  const errorCount = useMemo(
    () => diagnostics.filter(d => d.severity === 'error').length,
    [diagnostics]
  );
  const warningCount = useMemo(
    () => diagnostics.filter(d => d.severity === 'warning').length,
    [diagnostics]
  );
  const crossFileCount = useMemo(
    () => diagnostics.filter(d => d.category === 'cross_file').length,
    [diagnostics]
  );

  const diagnosticsByEventId = useMemo(() => {
    const map = new Map<string, StoryDiagnostic[]>();
    diagnostics.forEach(d => {
      const arr = map.get(d.eventId) || [];
      arr.push(d);
      map.set(d.eventId, arr);
    });
    return map;
  }, [diagnostics]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(ev => {
      if (branchFilter !== 'ALL') {
        if (branchFilter === '__NONE__' && ev.branch.trim() !== '') return false;
        if (branchFilter !== '__NONE__' && ev.branch.trim() !== branchFilter) return false;
      }
      if (showIssuesOnly) {
        const evIssues = diagnosticsByEventId.get(ev.id) || [];
        if (evIssues.length === 0) return false;
        if (hideCrossFileInSidebar && evIssues.every(i => i.category === 'cross_file')) {
          return false;
        }
      }
      if (!q) return true;
      return (
        ev.name.toLowerCase().includes(q) ||
        ev.eventType.toLowerCase().includes(q) ||
        ev.rewardType.toLowerCase().includes(q) ||
        ev.branch.toLowerCase().includes(q) ||
        ev.storyTag.toLowerCase().includes(q)
      );
    });
  }, [events, search, branchFilter, showIssuesOnly, diagnosticsByEventId]);

  const syncEventsWithDoc = (nextDoc: XMLDocument, nextEvents: StoryEvent[]) => {
    setDoc(nextDoc);
    setEvents(nextEvents);
    onUpdateDoc(nextDoc, nextEvents);
  };

  const handleUpdateEvent = (updated: StoryEvent) => {
    updateStoryEventInDoc(updated);
    const newEvents = events.map(ev => (ev.id === updated.id ? updated : ev));
    setSelectedEvent(updated);
    syncEventsWithDoc(doc, newEvents);
  };

  const handleLoadSampleStory = () => {
    try {
      const sampleXml = createSampleStoryXml();
      const parsed = parseStoryXml(sampleXml);
      syncEventsWithDoc(parsed.doc, parsed.storyEvents);
      setSelectedEvent(parsed.storyEvents[0] || null);
    } catch (err: any) {
      onError(err.message || 'Error generating sample story');
    }
  };

  const handleAddEvent = () => {
    const root = doc.querySelector('Story') || doc.documentElement;
    const newEl = doc.createElement('Event');
    const newName = `Story_Event_${events.length + 1}`;
    newEl.setAttribute('Name', newName);

    const typeEl = doc.createElement('Event_Type');
    typeEl.textContent = 'STORY_ELAPSED';
    newEl.appendChild(typeEl);

    const param1El = doc.createElement('Event_Param1');
    param1El.textContent = '5';
    newEl.appendChild(param1El);

    const rewardEl = doc.createElement('Reward_Type');
    rewardEl.textContent = 'NONE';
    newEl.appendChild(rewardEl);

    root.appendChild(newEl);

    const newEv = parseStoryElement(newEl, `ev_new_${Date.now()}`);
    const newEvents = [...events, newEv];
    syncEventsWithDoc(doc, newEvents);
    setSelectedEvent(newEv);
  };

  const handleInsertTemplate = (template: StoryPatternTemplate) => {
    const root = doc.querySelector('Story') || doc.documentElement;
    const defaultPlanet =
      planets.find(p => p.name.toLowerCase() !== 'galaxy_core_art_model')?.name || 'Kuat';
    const drafts = template.buildEvents(events.length, defaultPlanet);

    const createdEvents: StoryEvent[] = drafts.map((draft, idx) => {
      const el = doc.createElement('Event');
      el.setAttribute('Name', draft.name);
      root.appendChild(el);
      const fullEvt: StoryEvent = {
        ...draft,
        id: `ev_tpl_${Date.now()}_${idx}`,
        el
      };
      updateStoryEventInDoc(fullEvt);
      return fullEvt;
    });

    const nextEvents = [...events, ...createdEvents];
    syncEventsWithDoc(doc, nextEvents);
    if (createdEvents[0]) setSelectedEvent(createdEvents[0]);
    setIsTemplateMenuOpen(false);
  };

  const handleDuplicateEvent = (source: StoryEvent) => {
    const root = doc.querySelector('Story') || doc.documentElement;
    const clonedEl = source.el.cloneNode(true) as Element;
    const copyName = `${source.name}_Copy`;
    clonedEl.setAttribute('Name', copyName);

    if (source.el.nextSibling) {
      root.insertBefore(clonedEl, source.el.nextSibling);
    } else {
      root.appendChild(clonedEl);
    }

    const clonedEvt = parseStoryElement(clonedEl, `ev_dup_${Date.now()}`);
    const idx = events.findIndex(e => e.id === source.id);
    const nextEvents = [...events];
    nextEvents.splice(idx + 1, 0, clonedEvt);
    syncEventsWithDoc(doc, nextEvents);
    setSelectedEvent(clonedEvt);
  };

  const handleMoveEvent = (eventId: string, direction: 'up' | 'down') => {
    const idx = events.findIndex(e => e.id === eventId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= events.length) return;

    const currentEv = events[idx];
    const swapEv = events[targetIdx];
    const parent = currentEv.el.parentNode;
    if (parent) {
      if (direction === 'up') {
        parent.insertBefore(currentEv.el, swapEv.el);
      } else {
        parent.insertBefore(swapEv.el, currentEv.el);
      }
    }

    const nextEvents = [...events];
    nextEvents[idx] = swapEv;
    nextEvents[targetIdx] = currentEv;
    syncEventsWithDoc(doc, nextEvents);
  };

  const handleDeleteEvent = (id: string) => {
    const evToDelete = events.find(e => e.id === id);
    if (evToDelete && evToDelete.el.parentNode) {
      evToDelete.el.parentNode.removeChild(evToDelete.el);
    }
    const newEvents = events.filter(e => e.id !== id);
    syncEventsWithDoc(doc, newEvents);
    if (selectedEvent?.id === id) {
      setSelectedEvent(newEvents[0] || null);
    }
  };

  const handleExport = () => {
    try {
      const xmlString = serializeXml(doc);
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.xml', '_Modified.xml');
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onError(err.message || t.storyEditor.exportError);
    }
  };

  const handleApplyXmlChanges = () => {
    setXmlError(null);
    setSaveSuccess(false);
    try {
      if (xmlScope === 'event' && selectedEvent) {
        const updatedEvent = updateStoryEventFromXml(rawXmlText, selectedEvent);
        const newEvents = events.map(ev => (ev.id === updatedEvent.id ? updatedEvent : ev));
        setSelectedEvent(updatedEvent);
        syncEventsWithDoc(doc, newEvents);
        setIsXmlDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else if (xmlScope === 'document') {
        const parsed = parseStoryXml(rawXmlText);
        syncEventsWithDoc(parsed.doc, parsed.storyEvents);
        if (selectedEvent) {
          const matching =
            parsed.storyEvents.find(e => e.name === selectedEvent.name) ||
            parsed.storyEvents[0] ||
            null;
          setSelectedEvent(matching);
        } else {
          setSelectedEvent(parsed.storyEvents[0] || null);
        }
        setIsXmlDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err: any) {
      setXmlError(err.message || 'Invalid XML format');
    }
  };

  // Compute dependency chain for the currently selected event
  const eventChain = useMemo(() => {
    if (!selectedEvent) {
      return { incomingPrereqs: [], incomingControl: [], outgoingDependents: [], outgoingTargets: [], branchSiblings: [] };
    }
    const selNameLower = selectedEvent.name.trim().toLowerCase();

    // 1. Incoming Prereqs
    const incomingPrereqs = selectedEvent.prereqs.flatMap(pr =>
      pr
        .split(/[,;\s]+/)
        .map(tok => tok.trim())
        .filter(Boolean)
        .map(tok => ({
          name: tok,
          event: events.find(e => e.name.trim().toLowerCase() === tok.toLowerCase()) || null
        }))
    );

    // 2. Incoming Control (events that ENABLE_EVENT or DISABLE_EVENT this event, or DISABLE_BRANCH / RESET_BRANCH its branch)
    const incomingControl = events.filter(ev => {
      if (ev.id === selectedEvent.id) return false;
      const rTarget = ev.rewardParams[0]?.trim().toLowerCase();
      if ((ev.rewardType === 'ENABLE_EVENT' || ev.rewardType === 'DISABLE_EVENT') && rTarget === selNameLower) {
        return true;
      }
      if (
        selectedEvent.branch.trim() &&
        (ev.rewardType === 'DISABLE_BRANCH' || ev.rewardType === 'RESET_BRANCH') &&
        rTarget === selectedEvent.branch.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    // 3. Outgoing Dependents (events that list selectedEvent in their Prereq)
    const outgoingDependents = events.filter(ev =>
      ev.prereqs.some(pr =>
        pr
          .split(/[,;\s]+/)
          .map(s => s.trim().toLowerCase())
          .includes(selNameLower)
      )
    );

    // 4. Outgoing Control Targets (if this event triggers ENABLE_EVENT / DISABLE_EVENT / STORY_GOAL_COMPLETED)
    const outgoingTargets: StoryEvent[] = [];
    const targetParam = selectedEvent.rewardParams[0]?.trim().toLowerCase();
    if (targetParam) {
      if (selectedEvent.rewardType === 'ENABLE_EVENT' || selectedEvent.rewardType === 'DISABLE_EVENT') {
        const match = events.find(e => e.name.trim().toLowerCase() === targetParam);
        if (match) outgoingTargets.push(match);
      } else if (
        selectedEvent.rewardType === 'STORY_GOAL_COMPLETED' ||
        selectedEvent.rewardType === 'REMOVE_STORY_GOAL'
      ) {
        events
          .filter(e => e.storyTag.trim().toLowerCase() === targetParam && e.id !== selectedEvent.id)
          .forEach(m => outgoingTargets.push(m));
      }
    }

    // 5. Branch Siblings
    const branchSiblings = selectedEvent.branch.trim()
      ? events.filter(
          e =>
            e.branch.trim().toLowerCase() === selectedEvent.branch.trim().toLowerCase() &&
            e.id !== selectedEvent.id
        )
      : [];

    return { incomingPrereqs, incomingControl, outgoingDependents, outgoingTargets, branchSiblings };
  }, [selectedEvent, events]);

  const activeEventDef = selectedEvent ? EVENT_TYPES[selectedEvent.eventType] : undefined;
  const activeRewardDef = selectedEvent ? REWARD_TYPES[selectedEvent.rewardType] : undefined;

  const eventParamSlotsCount = useMemo(() => {
    if (!selectedEvent) return 0;
    const schemaLen = activeEventDef?.params?.length || 0;
    return Math.max(selectedEvent.eventParams.length, schemaLen);
  }, [selectedEvent, activeEventDef]);

  const rewardParamSlotsCount = useMemo(() => {
    if (!selectedEvent) return 0;
    const schemaLen = activeRewardDef?.params?.length || 0;
    return Math.max(selectedEvent.rewardParams.length, schemaLen);
  }, [selectedEvent, activeRewardDef]);

  const resolveDatTranslation = (val: string | undefined) => {
    if (!val || !val.trim()) return null;
    return datMap.get(val.trim().toUpperCase()) || null;
  };

  // Compute 2D Topological DAG Layout for Story Event Graph (v2.2)
  const storyGraphLayout = useMemo(() => {
    const nodeWidth = 220;
    const nodeHeight = 76;
    const colGap = 290;
    const rowGap = 102;

    const nameToEvent = new Map<string, StoryEvent>();
    filteredEvents.forEach((ev) => nameToEvent.set(ev.name.trim().toLowerCase(), ev));

    const depthMemo = new Map<string, number>();
    const visiting = new Set<string>();

    const getDepth = (ev: StoryEvent): number => {
      const key = ev.id;
      if (depthMemo.has(key)) return depthMemo.get(key)!;
      if (visiting.has(key)) return 0; // cycle guard
      visiting.add(key);

      let maxParentDepth = -1;
      ev.prereqs.forEach((pr) => {
        const tokens = pr
          .split(/[,;\s]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        tokens.forEach((tok) => {
          const parentEv = nameToEvent.get(tok);
          if (parentEv && parentEv.id !== ev.id) {
            maxParentDepth = Math.max(maxParentDepth, getDepth(parentEv));
          }
        });
      });

      visiting.delete(key);
      const d = maxParentDepth + 1;
      depthMemo.set(key, d);
      return d;
    };

    const columns = new Map<number, StoryEvent[]>();
    filteredEvents.forEach((ev) => {
      const d = Math.min(12, getDepth(ev));
      const list = columns.get(d) || [];
      list.push(ev);
      columns.set(d, list);
    });

    const nodes: {
      ev: StoryEvent;
      x: number;
      y: number;
      col: number;
      row: number;
    }[] = [];
    const posById = new Map<string, { x: number; y: number }>();

    let maxCols = 0;
    let maxRows = 0;
    Array.from(columns.keys())
      .sort((a, b) => a - b)
      .forEach((colIdx) => {
        const colEvents = columns.get(colIdx) || [];
        maxCols = Math.max(maxCols, colIdx + 1);
        maxRows = Math.max(maxRows, colEvents.length);
        colEvents.forEach((ev, rowIdx) => {
          const x = 40 + colIdx * colGap;
          const y = 48 + rowIdx * rowGap;
          nodes.push({ ev, x, y, col: colIdx, row: rowIdx });
          posById.set(ev.id, { x, y });
        });
      });

    const edges: {
      id: string;
      fromId: string;
      toId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      kind: 'prereq' | 'control';
    }[] = [];

    filteredEvents.forEach((ev) => {
      const targetPos = posById.get(ev.id);
      if (!targetPos) return;

      ev.prereqs.forEach((pr) => {
        const tokens = pr
          .split(/[,;\s]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        tokens.forEach((tok) => {
          const parentEv = nameToEvent.get(tok);
          if (parentEv) {
            const srcPos = posById.get(parentEv.id);
            if (srcPos) {
              edges.push({
                id: `edge_${parentEv.id}_${ev.id}`,
                fromId: parentEv.id,
                toId: ev.id,
                x1: srcPos.x + nodeWidth,
                y1: srcPos.y + nodeHeight / 2,
                x2: targetPos.x,
                y2: targetPos.y + nodeHeight / 2,
                kind: 'prereq'
              });
            }
          }
        });
      });

      if (
        (ev.rewardType === 'ENABLE_EVENT' || ev.rewardType === 'DISABLE_EVENT') &&
        ev.rewardParams[0]?.trim()
      ) {
        const ctrlTarget = nameToEvent.get(ev.rewardParams[0].trim().toLowerCase());
        if (ctrlTarget) {
          const dstPos = posById.get(ctrlTarget.id);
          if (dstPos) {
            edges.push({
              id: `ctrl_${ev.id}_${ctrlTarget.id}`,
              fromId: ev.id,
              toId: ctrlTarget.id,
              x1: targetPos.x + nodeWidth,
              y1: targetPos.y + nodeHeight / 2,
              x2: dstPos.x,
              y2: dstPos.y + nodeHeight / 2,
              kind: 'control'
            });
          }
        }
      }
    });

    const width = Math.max(920, maxCols * colGap + 120);
    const height = Math.max(520, maxRows * rowGap + 100);

    return { nodes, edges, width, height, nodeWidth, nodeHeight, maxCols };
  }, [filteredEvents]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-cyan-50 overflow-hidden select-none">
      {/* Smart Autocomplete Datalists */}
      <datalist id="story-datalist-planets">
        {planets
          .filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model')
          .map(p => (
            <option key={p.id} value={p.name} />
          ))}
      </datalist>
      <datalist id="story-datalist-events">
        {events.map(ev => (
          <option key={ev.id} value={ev.name} />
        ))}
      </datalist>
      <datalist id="story-datalist-flags">
        {allFlags.map(f => (
          <option key={f} value={f} />
        ))}
      </datalist>
      <datalist id="story-datalist-branches">
        {allBranches.map(b => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id="story-datalist-tags">
        {allStoryTags.map(tag => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <datalist id="story-datalist-factions">
        <option value="Empire" />
        <option value="Rebel" />
        <option value="Underworld" />
        <option value="Neutral" />
        <option value="Hostile" />
        <option value="Pirates" />
      </datalist>
      <datalist id="story-datalist-operators">
        <option value="EQUAL_TO" />
        <option value="NOT_EQUAL_TO" />
        <option value="GREATER_THAN" />
        <option value="GREATER_THAN_EQUAL_TO" />
        <option value="LESS_THAN" />
        <option value="LESS_THAN_EQUAL_TO" />
      </datalist>
      <datalist id="story-datalist-conquerFilters">
        <option value="CONQUER_PLANET" />
        <option value="CONQUER_ALL" />
      </datalist>
      <datalist id="story-datalist-datKeys">
        {datRecords?.slice(0, 300).map(r => (
          <option key={r.id} value={r.key}>
            {r.value.slice(0, 60)}
          </option>
        ))}
      </datalist>

      {/* Top Command Bar — Unified Tactical HUD */}
      <div className="h-14 border-b border-indigo-900/40 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold">
                {t.storyEditor.title}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-indigo-950/90 border border-indigo-500/40 text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                v2.2
              </span>
              <span className="bg-slate-950 text-indigo-300 border border-slate-800 px-2 py-0.5 rounded-sm text-[9px] font-mono">
                {events.length} {t.storyEditor.eventsCount}
              </span>
              {allBranches.length > 0 && (
                <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-sm text-[9px] font-mono flex items-center space-x-1">
                  <GitBranch className="w-3 h-3" />
                  <span>
                    {allBranches.length} {tr(lang, 'Branches', 'Ramas', 'Branches')}
                  </span>
                </span>
              )}
              {errorCount > 0 ? (
                <button
                  onClick={() => {
                    setAuditFilter('errors');
                    setViewMode('flow');
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 px-2 py-0.5 rounded-sm text-[9px] font-mono flex items-center space-x-1 cursor-pointer transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  title={tr(lang, 'View critical errors', 'Ver errores críticos', 'Voir les erreurs critiques')}
                >
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span>
                    {errorCount} {tr(lang, 'Errors', 'Errores', 'Erreurs')}
                  </span>
                </button>
              ) : warningCount > 0 ? (
                <button
                  onClick={() => {
                    setAuditFilter('warnings');
                    setViewMode('flow');
                  }}
                  className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-sm text-[9px] font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                  title={tr(lang, 'View configuration warnings', 'Ver avisos de configuración', 'Voir les avertissements')}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>
                    {warningCount} {tr(lang, 'Warnings', 'Avisos', 'Avert.')}
                  </span>
                </button>
              ) : crossFileCount > 0 ? (
                <button
                  onClick={() => {
                    setAuditFilter('cross_file');
                    setViewMode('flow');
                  }}
                  className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-sm text-[9px] font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                  title={tr(
                    lang,
                    'Cross-file references that link to other Story files in campaign plot',
                    'Referencias externas que enlazan con otros archivos Story en la campaña',
                    'Références inter-fichiers liées à d\'autres fichiers Story de la campagne'
                  )}
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>
                    {crossFileCount} {tr(lang, 'Cross-File Refs (Valid)', 'Ref. Cruzadas (Válidas)', 'Réf. Externes (Valides)')}
                  </span>
                </button>
              ) : (
                events.length > 0 && (
                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-sm text-[9px] font-mono flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{tr(lang, 'Chain Valid', 'Cadena Verificada', 'Chaîne Valide')}</span>
                  </span>
                )
              )}
            </div>
            <div className="text-[11px] font-mono text-cyan-200/90 truncate max-w-md mt-0.5">
              {fileName}
            </div>
          </div>
        </div>

        {/* Center View Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-sm border border-indigo-900/50 space-x-1">
          <button
            onClick={() => setViewMode('params')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              viewMode === 'params'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>{t.storyEditor.parametersView}</span>
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              viewMode === 'flow'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            <span>{tr(lang, 'Flow & Chain', 'Flujo y Cadena', 'Flux & Chaîne')}</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{tr(lang, '2D Node Graph', 'Grafo Nodal 2D', 'Graphe Nodal 2D')}</span>
          </button>
          <button
            onClick={() => setViewMode('xml')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              viewMode === 'xml'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>{t.storyEditor.xmlView}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2.5">
          {events.length === 0 && (
            <button
              onClick={handleLoadSampleStory}
              className="px-3 py-1.5 border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Load Sample Story', 'Cargar Plantilla Ejemplo', 'Charger Modèle Story')}</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-[11px] font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center space-x-1.5 rounded-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.storyEditor.exportBtn}</span>
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 border border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/60 text-indigo-400 transition-all rounded-sm cursor-pointer"
            title={t.storyEditor.helpTitle}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={t.closeProject}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left List Sidebar */}
        <div className="w-80 border-r border-indigo-900/30 bg-slate-900/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-indigo-900/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400/80 font-bold">
                {t.storyEditor.eventsList}
              </span>
              <div className="flex items-center space-x-1.5 relative">
                {/* Templates Dropdown */}
                <button
                  onClick={() => setIsTemplateMenuOpen(prev => !prev)}
                  className="flex items-center space-x-1 text-[10px] font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title={tr(lang, 'Insert pre-configured story event pattern', 'Insertar patrón de eventos preconfigurado', 'Insérer un modèle d\'événement préconfiguré')}
                >
                  <Layers className="w-3 h-3" />
                  <span>{tr(lang, 'Patterns', 'Patrones', 'Modèles')}</span>
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex items-center space-x-1 text-[10px] font-mono bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t.storyEditor.addNew}</span>
                </button>

                {isTemplateMenuOpen && (
                  <div className="absolute right-0 top-7 w-72 bg-slate-900 border border-cyan-500/50 rounded shadow-2xl z-50 p-2 space-y-1.5">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                        {lang === 'es' ? 'Patrones Rápidos EaW / FoC' : 'EaW / FoC Quick Patterns'}
                      </span>
                      <button
                        onClick={() => setIsTemplateMenuOpen(false)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {STORY_TEMPLATES.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => handleInsertTemplate(tpl)}
                        className="w-full text-left p-2 rounded bg-slate-950/70 hover:bg-indigo-950/60 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        <div className="text-[11px] font-mono font-bold text-cyan-300">
                          {lang === 'es' ? tpl.labelEs : tpl.labelEn}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {lang === 'es' ? tpl.descEs : tpl.descEn}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.storyEditor.searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-cyan-50 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Branch Filter & Issues Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">
                  {lang === 'es' ? 'Todas las Ramas (Branches)' : 'All Branches'} ({events.length})
                </option>
                <option value="__NONE__">
                  {lang === 'es' ? 'Sin Rama Asignada' : 'No Branch Assigned'}
                </option>
                {allBranches.map(b => (
                  <option key={b} value={b}>
                    Branch: {b}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowIssuesOnly(prev => !prev)}
                  className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer flex items-center space-x-1 ${
                    showIssuesOnly
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300'
                  }`}
                  title={lang === 'es' ? 'Filtrar eventos con avisos o referencias externas' : 'Filter events with issues or cross-file references'}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{diagnosticsByEventId.size}</span>
                </button>
                {showIssuesOnly && (
                  <button
                    onClick={() => setHideCrossFileInSidebar(prev => !prev)}
                    className={`px-1.5 py-1 rounded text-[9px] font-mono border transition-colors cursor-pointer flex items-center space-x-1 ${
                      hideCrossFileInSidebar
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-300'
                    }`}
                    title={
                      hideCrossFileInSidebar
                        ? (lang === 'es' ? 'Mostrando solo errores/avisos locales (ocultando ref. externas)' : 'Showing local issues only (hiding cross-file refs)')
                        : (lang === 'es' ? 'Ocultar referencias externas de otras tramas' : 'Hide cross-file references')
                    }
                  >
                    <Globe className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar">
            {events.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-indigo-500/40 mx-auto" />
                <div className="text-xs font-mono text-slate-400">
                  {lang === 'es'
                    ? 'Este archivo Story XML está vacío.'
                    : 'This Story XML file has no events yet.'}
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleLoadSampleStory}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'es' ? 'Generar Campaña Story de Ejemplo' : 'Generate Sample Story Script'}
                  </button>
                  <button
                    onClick={handleAddEvent}
                    className="w-full py-1.5 px-3 border border-indigo-500/40 hover:bg-indigo-500/10 text-indigo-300 rounded text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    {lang === 'es' ? '+ Crear Evento en Blanco' : '+ Create Blank Event'}
                  </button>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-500">
                {lang === 'es' ? 'No hay eventos que coincidan con el filtro.' : 'No events match your current filter.'}
              </div>
            ) : (
              filteredEvents.map((ev, index) => {
                const evIssues = diagnosticsByEventId.get(ev.id) || [];
                const hasError = evIssues.some(i => i.severity === 'error');
                const hasWarning = evIssues.some(i => i.severity === 'warning');
                const hasCrossFileOnly = evIssues.length > 0 && !hasError && !hasWarning;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-3 cursor-pointer transition-colors flex flex-col space-y-1.5 ${
                      selectedEvent?.id === ev.id
                        ? 'bg-indigo-500/20 border-l-2 border-indigo-400'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-[9px] font-mono text-slate-500">#{index + 1}</span>
                        <span className="font-mono text-xs font-bold text-slate-200 truncate">
                          {ev.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        {ev.active === false && (
                          <span
                            className="text-[8px] font-mono bg-rose-950/80 text-rose-400 border border-rose-700/40 px-1 py-0.2 rounded"
                            title={lang === 'es' ? 'Evento Inactivo (<Active>false</Active>)' : 'Inactive Event (<Active>false</Active>)'}
                          >
                            OFF
                          </span>
                        )}
                        {ev.perpetual && (
                          <span
                            className="text-[8px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/40 px-1 py-0.2 rounded"
                            title={lang === 'es' ? 'Evento Perpetuo / Repetitivo' : 'Perpetual / Looping Event'}
                          >
                            LOOP
                          </span>
                        )}
                        {evIssues.length > 0 && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded flex items-center space-x-0.5 ${
                              hasError
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : hasWarning
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/40'
                            }`}
                            title={
                              hasError
                                ? (lang === 'es' ? 'Error crítico' : 'Critical error')
                                : hasWarning
                                ? (lang === 'es' ? 'Aviso' : 'Warning')
                                : (lang === 'es' ? 'Referencias externas (se resolverán en la campaña)' : 'Cross-file references (resolves in campaign)')
                            }
                          >
                            {hasCrossFileOnly ? (
                              <Globe className="w-2.5 h-2.5 text-cyan-400" />
                            ) : (
                              <AlertTriangle className="w-2.5 h-2.5" />
                            )}
                            <span>{evIssues.length}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span className="text-indigo-400/90 truncate">{ev.eventType || 'NO_TRIGGER'}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className="text-emerald-400/90 truncate">{ev.rewardType || 'NONE'}</span>
                    </div>

                    {(ev.branch || ev.storyTag || ev.prereqs.length > 0) && (
                      <div className="flex items-center flex-wrap gap-1 pt-0.5">
                        {ev.branch && (
                          <span className="text-[8px] font-mono bg-slate-950 text-cyan-400/80 border border-cyan-900/40 px-1.5 py-0.2 rounded truncate max-w-[130px]">
                            {ev.branch}
                          </span>
                        )}
                        {ev.storyTag && (
                          <span className="text-[8px] font-mono bg-purple-950/50 text-purple-300 border border-purple-800/40 px-1.5 py-0.2 rounded truncate max-w-[120px]">
                            Tag: {ev.storyTag}
                          </span>
                        )}
                        {ev.prereqs.length > 0 && (
                          <span className="text-[8px] font-mono bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.2 rounded">
                            {ev.prereqs.length} Prereq
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Details / Flow / XML Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/80 overflow-y-auto p-6">
          {viewMode === 'params' ? (
            selectedEvent ? (
              <div className="max-w-4xl space-y-6 pb-12">
                {/* Event Header & Quick Actions */}
                <div className="bg-slate-900/50 border border-indigo-900/40 p-4 rounded-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/30 pb-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        {t.storyEditor.eventName}
                      </label>
                      <input
                        type="text"
                        value={selectedEvent.name}
                        onChange={e =>
                          handleUpdateEvent({ ...selectedEvent, name: e.target.value })
                        }
                        className="bg-slate-950 border border-indigo-500/40 px-3 py-1.5 rounded text-sm font-mono font-bold text-indigo-100 focus:outline-none focus:border-indigo-400 w-full"
                      />
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end">
                      <button
                        onClick={() => handleMoveEvent(selectedEvent.id, 'up')}
                        className="p-2 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-300 rounded transition-colors cursor-pointer"
                        title={lang === 'es' ? 'Subir orden en el XML' : 'Move up in XML order'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveEvent(selectedEvent.id, 'down')}
                        className="p-2 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-300 rounded transition-colors cursor-pointer"
                        title={lang === 'es' ? 'Bajar orden en el XML' : 'Move down in XML order'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateEvent(selectedEvent)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 border border-cyan-500/40 hover:bg-cyan-500/15 text-cyan-300 rounded text-xs font-mono transition-colors cursor-pointer"
                        title={lang === 'es' ? 'Clonar este evento' : 'Duplicate this event'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'es' ? 'Clonar' : 'Clone'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded text-xs font-mono transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.storyEditor.deleteEvent}</span>
                      </button>
                    </div>
                  </div>

                  {/* Execution Flags (<Active> & <Perpetual>) + Quick Branch */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateEvent({
                          ...selectedEvent,
                          active: selectedEvent.active === false ? true : false
                        })
                      }
                      className={`p-2.5 rounded border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedEvent.active !== false
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Power className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="text-[10px] font-mono uppercase font-bold">
                            {lang === 'es' ? 'Estado Inicial (<Active>)' : 'Initial State (<Active>)'}
                          </div>
                          <div className="text-[9px] opacity-80 font-mono">
                            {selectedEvent.active !== false
                              ? lang === 'es'
                                ? 'Activo al iniciar'
                                : 'Active on start (true)'
                              : lang === 'es'
                              ? 'Desactivado (requiere ENABLE_EVENT)'
                              : 'Disabled (false)'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/70">
                        {selectedEvent.active !== false ? 'TRUE' : 'FALSE'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateEvent({
                          ...selectedEvent,
                          perpetual: !selectedEvent.perpetual
                        })
                      }
                      className={`p-2.5 rounded border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedEvent.perpetual
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Repeat className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="text-[10px] font-mono uppercase font-bold">
                            {lang === 'es' ? 'Bucle (<Perpetual>)' : 'Looping (<Perpetual>)'}
                          </div>
                          <div className="text-[9px] opacity-80 font-mono">
                            {selectedEvent.perpetual
                              ? lang === 'es'
                                ? 'Se repite indefinidamente'
                                : 'Repeats continuously'
                              : lang === 'es'
                              ? 'Se ejecuta una sola vez'
                              : 'Fires once only'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/70">
                        {selectedEvent.perpetual ? 'TRUE' : 'FALSE'}
                      </span>
                    </button>

                    <div className="p-2 rounded border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
                      <label className="text-[9px] font-mono uppercase text-cyan-400/80 mb-0.5 flex items-center space-x-1">
                        <GitBranch className="w-3 h-3" />
                        <span>{t.storyEditor.branch} (&lt;Branch&gt;)</span>
                      </label>
                      <input
                        type="text"
                        list="story-datalist-branches"
                        value={selectedEvent.branch}
                        placeholder={lang === 'es' ? 'Ej: Branch_Core_Assault' : 'e.g. Branch_Core_Assault'}
                        onChange={e =>
                          handleUpdateEvent({ ...selectedEvent, branch: e.target.value })
                        }
                        className="bg-transparent border-b border-slate-800 focus:border-cyan-500 text-xs font-mono text-cyan-200 focus:outline-none py-0.5"
                      />
                    </div>
                  </div>

                  {/* Diagnostics banner for current event if any */}
                  {(diagnosticsByEventId.get(selectedEvent.id) || []).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {(diagnosticsByEventId.get(selectedEvent.id) || []).map(issue => (
                        <div
                          key={issue.id}
                          className={`p-2.5 rounded border text-xs font-mono flex items-start space-x-2 ${
                            issue.severity === 'error'
                              ? 'bg-red-950/30 border-red-500/40 text-red-300'
                              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{lang === 'es' ? issue.messageEs : issue.messageEn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Trigger Section (Event_Type & Event_Param1..N) */}
                  <div className="bg-slate-900/50 border border-indigo-900/40 p-4 rounded-sm space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 border-b border-indigo-900/40 pb-2 flex items-center space-x-2">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t.storyEditor.triggerSection}</span>
                    </h3>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        {t.storyEditor.eventType} (&lt;Event_Type&gt;)
                      </label>
                      <select
                        value={EVENT_TYPES[selectedEvent.eventType] ? selectedEvent.eventType : '__CUSTOM__'}
                        onChange={e => {
                          if (e.target.value !== '__CUSTOM__') {
                            handleUpdateEvent({ ...selectedEvent, eventType: e.target.value });
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">{t.storyEditor.selectEventType}</option>
                        {Object.entries(EVENT_TYPES).map(([type, def]) => (
                          <option key={type} value={type}>
                            {type} — [{def.category}]
                          </option>
                        ))}
                        {!EVENT_TYPES[selectedEvent.eventType] && selectedEvent.eventType && (
                          <option value="__CUSTOM__">
                            {selectedEvent.eventType} (Custom)
                          </option>
                        )}
                      </select>

                      {/* Description box for active Event_Type */}
                      {activeEventDef && (
                        <div className="mt-2 p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded flex items-start space-x-2 text-xs text-indigo-200">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            {lang === 'es' ? activeEventDef.es : activeEventDef.en}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Parameters with Contextual Labels & Datalists */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase text-slate-400">
                          {t.storyEditor.eventParams} (Event_Param1..N)
                        </label>
                        <button
                          onClick={() =>
                            handleUpdateEvent({
                              ...selectedEvent,
                              eventParams: [...selectedEvent.eventParams, '']
                            })
                          }
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          {t.storyEditor.addParam}
                        </button>
                      </div>

                      {eventParamSlotsCount === 0 && (
                        <div className="text-[11px] font-mono text-slate-500 italic py-2">
                          {lang === 'es'
                            ? 'Este Event_Type no requiere parámetros adicionales.'
                            : 'This Event_Type does not require additional parameters.'}
                        </div>
                      )}

                      {Array.from({ length: eventParamSlotsCount }).map((_, idx) => {
                        const val = selectedEvent.eventParams[idx] ?? '';
                        const hint = activeEventDef?.params?.[idx];
                        const listId = hint?.datalist ? `story-datalist-${hint.datalist}` : undefined;
                        const datText = resolveDatTranslation(val);

                        return (
                          <div key={idx} className="space-y-1 bg-slate-950/50 p-2 rounded border border-slate-800/80">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-indigo-300">
                                Event_Param{idx + 1}
                                {hint && (
                                  <span className="text-slate-400 font-normal ml-1.5">
                                    — {lang === 'es' ? hint.labelEs : hint.labelEn}
                                  </span>
                                )}
                              </span>
                              {idx >= (activeEventDef?.params?.length || 0) && (
                                <button
                                  onClick={() => {
                                    const next = selectedEvent.eventParams.filter((_, i) => i !== idx);
                                    handleUpdateEvent({ ...selectedEvent, eventParams: next });
                                  }}
                                  className="text-slate-500 hover:text-red-400 cursor-pointer"
                                  title={lang === 'es' ? 'Eliminar parámetro' : 'Remove parameter'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              list={listId}
                              value={val}
                              placeholder={hint?.placeholder || `Event_Param${idx + 1}`}
                              onChange={e => {
                                const next = [...selectedEvent.eventParams];
                                while (next.length <= idx) next.push('');
                                next[idx] = e.target.value;
                                handleUpdateEvent({ ...selectedEvent, eventParams: next });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                            {datText && (
                              <div className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded">
                                .DAT: &ldquo;{datText}&rdquo;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reward Section (Reward_Type & Reward_Param1..N) */}
                  <div className="bg-slate-900/50 border border-indigo-900/40 p-4 rounded-sm space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 border-b border-indigo-900/40 pb-2 flex items-center space-x-2">
                      <Award className="w-3.5 h-3.5" />
                      <span>{t.storyEditor.rewardSection}</span>
                    </h3>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase text-slate-400">
                        {t.storyEditor.rewardType} (&lt;Reward_Type&gt;)
                      </label>
                      <select
                        value={REWARD_TYPES[selectedEvent.rewardType] ? selectedEvent.rewardType : '__CUSTOM__'}
                        onChange={e => {
                          if (e.target.value !== '__CUSTOM__') {
                            handleUpdateEvent({ ...selectedEvent, rewardType: e.target.value });
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">{lang === 'es' ? '-- Seleccionar Reward_Type --' : '-- Select Reward_Type --'}</option>
                        {Object.entries(REWARD_TYPES).map(([type, def]) => (
                          <option key={type} value={type}>
                            {type} — [{def.category}]
                          </option>
                        ))}
                        {!REWARD_TYPES[selectedEvent.rewardType] && selectedEvent.rewardType && (
                          <option value="__CUSTOM__">
                            {selectedEvent.rewardType} (Custom)
                          </option>
                        )}
                      </select>

                      {/* Also allow direct custom Reward_Type editing */}
                      <input
                        type="text"
                        value={selectedEvent.rewardType}
                        onChange={e =>
                          handleUpdateEvent({ ...selectedEvent, rewardType: e.target.value })
                        }
                        placeholder="e.g. SPAWN_HERO, MULTIMEDIA, SET_FLAG, BUILDABLE_UNIT..."
                        className="w-full bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded text-[11px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                      />

                      {activeRewardDef && (
                        <div className="p-2.5 bg-emerald-950/25 border border-emerald-500/30 rounded flex items-start space-x-2 text-xs text-emerald-200">
                          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            {lang === 'es' ? activeRewardDef.es : activeRewardDef.en}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reward Parameters with Contextual Labels & Datalists */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase text-slate-400">
                          {t.storyEditor.rewardParams} (Reward_Param1..N)
                        </label>
                        <button
                          onClick={() =>
                            handleUpdateEvent({
                              ...selectedEvent,
                              rewardParams: [...selectedEvent.rewardParams, '']
                            })
                          }
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          {t.storyEditor.addParam}
                        </button>
                      </div>

                      {rewardParamSlotsCount === 0 && (
                        <div className="text-[11px] font-mono text-slate-500 italic py-2">
                          {lang === 'es'
                            ? 'Este Reward_Type no requiere parámetros adicionales.'
                            : 'This Reward_Type does not require additional parameters.'}
                        </div>
                      )}

                      {Array.from({ length: rewardParamSlotsCount }).map((_, idx) => {
                        const val = selectedEvent.rewardParams[idx] ?? '';
                        const hint = activeRewardDef?.params?.[idx];
                        const listId = hint?.datalist ? `story-datalist-${hint.datalist}` : undefined;
                        const datText = resolveDatTranslation(val);

                        return (
                          <div key={idx} className="space-y-1 bg-slate-950/50 p-2 rounded border border-slate-800/80">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-emerald-300">
                                Reward_Param{idx + 1}
                                {hint && (
                                  <span className="text-slate-400 font-normal ml-1.5">
                                    — {lang === 'es' ? hint.labelEs : hint.labelEn}
                                  </span>
                                )}
                              </span>
                              {idx >= (activeRewardDef?.params?.length || 0) && (
                                <button
                                  onClick={() => {
                                    const next = selectedEvent.rewardParams.filter((_, i) => i !== idx);
                                    handleUpdateEvent({ ...selectedEvent, rewardParams: next });
                                  }}
                                  className="text-slate-500 hover:text-red-400 cursor-pointer"
                                  title={lang === 'es' ? 'Eliminar parámetro' : 'Remove parameter'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              list={listId}
                              value={val}
                              placeholder={hint?.placeholder || `Reward_Param${idx + 1}`}
                              onChange={e => {
                                const next = [...selectedEvent.rewardParams];
                                while (next.length <= idx) next.push('');
                                next[idx] = e.target.value;
                                handleUpdateEvent({ ...selectedEvent, rewardParams: next });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                            {datText && (
                              <div className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded">
                                .DAT: &ldquo;{datText}&rdquo;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Prerequisites & Dialog/Holocron Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Prerequisites (<Prereq>) with Live Validation & Jump Links */}
                  <div className="bg-slate-900/50 border border-indigo-900/40 p-4 rounded-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                        {t.storyEditor.prereqsSection} (&lt;Prereq&gt;)
                      </h3>
                      <button
                        onClick={() =>
                          handleUpdateEvent({
                            ...selectedEvent,
                            prereqs: [...selectedEvent.prereqs, '']
                          })
                        }
                        className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        {t.storyEditor.addPrereq}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedEvent.prereqs.length === 0 ? (
                        <div className="text-xs font-mono text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded">
                          {t.storyEditor.noPrereqs}
                        </div>
                      ) : (
                        selectedEvent.prereqs.map((prereq, idx) => {
                          const cleanPrereq = prereq.trim();
                          const targetEvent = events.find(
                            e => e.name.trim().toLowerCase() === cleanPrereq.toLowerCase()
                          );
                          const isSelfRef = cleanPrereq !== '' && cleanPrereq.toLowerCase() === selectedEvent.name.trim().toLowerCase();
                          const isExternal = cleanPrereq !== '' && !targetEvent && !isSelfRef;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center space-x-2 p-1.5 rounded border transition-colors ${
                                isSelfRef
                                  ? 'bg-red-950/30 border-red-500/60'
                                  : isExternal
                                  ? 'bg-cyan-950/20 border-cyan-800/50'
                                  : 'bg-slate-950/60 border-slate-800'
                              }`}
                            >
                              <input
                                type="text"
                                list="story-datalist-events"
                                value={prereq}
                                onChange={e => {
                                  const newP = [...selectedEvent.prereqs];
                                  newP[idx] = e.target.value;
                                  handleUpdateEvent({ ...selectedEvent, prereqs: newP });
                                }}
                                placeholder={t.storyEditor.prereqPlaceholder}
                                className={`flex-1 bg-transparent border-0 px-2.5 py-1 text-xs font-mono focus:outline-none ${
                                  isSelfRef
                                    ? 'text-red-300'
                                    : isExternal
                                    ? 'text-cyan-200 placeholder-cyan-700/50'
                                    : 'text-slate-200'
                                }`}
                              />
                              {isSelfRef ? (
                                <span className="px-2 py-0.5 bg-red-950/80 text-red-300 border border-red-500/50 rounded text-[9px] font-mono shrink-0">
                                  {lang === 'es' ? 'Autoreferencia' : 'Self-ref'}
                                </span>
                              ) : targetEvent ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvent(targetEvent)}
                                  className="px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-mono flex items-center space-x-1 cursor-pointer shrink-0"
                                  title={lang === 'es' ? 'Ir a este evento en este archivo' : 'Jump to this event in this file'}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{lang === 'es' ? 'Ir' : 'Go'}</span>
                                </button>
                              ) : cleanPrereq !== '' ? (
                                <div
                                  className="px-2 py-0.5 bg-cyan-950/70 text-cyan-300 border border-cyan-700/50 rounded text-[9px] font-mono flex items-center space-x-1 shrink-0"
                                  title={
                                    lang === 'es'
                                      ? 'Referencia externa: se resolverá desde otro archivo XML de historia cargado en la campaña (Story Plot).'
                                      : 'Cross-file reference: resolves from another Story XML file loaded by the campaign plot.'
                                  }
                                >
                                  <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>{lang === 'es' ? 'Trama Externa' : 'Cross-File'}</span>
                                </div>
                              ) : null}
                              <button
                                onClick={() => {
                                  const newP = selectedEvent.prereqs.filter((_, i) => i !== idx);
                                  handleUpdateEvent({ ...selectedEvent, prereqs: newP });
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 pt-1 flex items-start space-x-1.5 border-t border-indigo-900/20">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-normal">
                        {lang === 'es'
                          ? 'En EaW/FoC las campañas cargan varios archivos de historia (<Event_Files>). Los eventos de "Trama Externa" son válidos si existen en otro archivo XML de la campaña.'
                          : 'In EaW/FoC campaigns load multiple Story XMLs (<Event_Files>). "Cross-File" prerequisites are valid if defined in another file in the plot.'}
                      </span>
                    </div>
                  </div>

                  {/* Dialog & Holocron Log Settings */}
                  <div className="bg-slate-900/50 border border-indigo-900/40 p-4 rounded-sm space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 border-b border-indigo-900/40 pb-2">
                      {t.storyEditor.dialogSection}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          {t.storyEditor.storyDialog} (&lt;Story_Dialog&gt;)
                        </label>
                        <input
                          type="text"
                          value={selectedEvent.storyDialog}
                          placeholder="e.g. Story_Campaign_Dialogs"
                          onChange={e =>
                            handleUpdateEvent({ ...selectedEvent, storyDialog: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          {t.storyEditor.storyChapter} (&lt;Story_Chapter&gt;)
                        </label>
                        <input
                          type="number"
                          value={selectedEvent.storyChapter}
                          placeholder="0"
                          onChange={e =>
                            handleUpdateEvent({ ...selectedEvent, storyChapter: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          {t.storyEditor.storyTag} (&lt;Story_Tag&gt; — Holocron Goal ID)
                        </label>
                        <input
                          type="text"
                          list="story-datalist-tags"
                          value={selectedEvent.storyTag}
                          placeholder="e.g. Goal_Capture_Kuat"
                          onChange={e =>
                            handleUpdateEvent({ ...selectedEvent, storyTag: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                        />
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          {lang === 'es'
                            ? 'Identificador del objetivo en el Holocrón (para completarlo luego con STORY_GOAL_COMPLETED).'
                            : 'Holocron objective identifier (targeted later via STORY_GOAL_COMPLETED or REMOVE_STORY_GOAL).'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <BookOpen className="w-8 h-8 text-indigo-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {fileName}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {events.length} {t.storyEditor.eventsCount}
                    </span>
                    {allBranches.length > 0 && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {allBranches.length} {lang === 'es' ? 'Ramas' : 'Branches'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold font-mono tracking-wider text-slate-100 uppercase">
                    {lang === 'es' ? 'Centro de Mando de Historia' : 'Story Mission Control'}
                  </h2>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed font-sans">
                    {lang === 'es'
                      ? 'Selecciona un evento en el panel lateral izquierdo para inspeccionar y editar sus disparadores, parámetros y recompensas, o utiliza los accesos rápidos a continuación.'
                      : 'Select an event on the left sidebar to inspect and configure triggers, parameters, and rewards, or use the quick actions below.'}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleAddEvent}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'es' ? 'Crear Nuevo Evento' : 'Create New Event'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setHelpTab('templates');
                      setIsHelpOpen(true);
                    }}
                    className="px-4 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 rounded text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{lang === 'es' ? 'Insertar Patrón Rápido' : 'Insert Quick Pattern'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setHelpTab('guide');
                      setIsHelpOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>{lang === 'es' ? 'Ver Manual & Ayuda' : 'View Scripting Manual'}</span>
                  </button>
                </div>

                {/* Architecture 4-Pillar Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-4">
                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded space-y-1">
                    <div className="flex items-center space-x-2 text-indigo-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>1. Disparadores (&lt;Event_Type&gt;)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {lang === 'es'
                        ? 'Define cuándo se activa el evento: temporizadores (STORY_ELAPSED), conquista planetaria (STORY_CONQUER) o flags (STORY_FLAG).'
                        : 'Defines when the event triggers: timers (STORY_ELAPSED), planet invasions (STORY_CONQUER), or flags (STORY_FLAG).'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded space-y-1">
                    <div className="flex items-center space-x-2 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                      <GitBranch className="w-3.5 h-3.5 shrink-0" />
                      <span>2. Prerrequisitos (&lt;Prereq&gt;)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {lang === 'es'
                        ? 'Cadenas lógicas y ramas. El evento esperará hasta que todos los eventos previos se hayan cumplido exitosamente.'
                        : 'Logical sequence and branch trees. The event remains dormant until all preceding events fire.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded space-y-1">
                    <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>3. Recompensas (&lt;Reward_Type&gt;)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {lang === 'es'
                        ? 'Acciones ejecutadas al disparar: spawn de héroes o flotas (SPAWN_HERO), transmisiones de holocrón (MULTIMEDIA), desbloqueo de unidades.'
                        : 'Effects applied upon firing: hero/fleet spawn (SPAWN_HERO), holocron cutscenes (MULTIMEDIA), or tech unlocks.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded space-y-1">
                    <div className="flex items-center space-x-2 text-purple-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                      <Repeat className="w-3.5 h-3.5 shrink-0" />
                      <span>4. Bucle & Estado (&lt;Active&gt; / &lt;Perpetual&gt;)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {lang === 'es'
                        ? 'Eventos durmientes (Active=false) activados por ENABLE_EVENT, o bucles continuos (Perpetual=true) para ingresos y raids.'
                        : 'Dormant events (Active=false) awakened by ENABLE_EVENT, or continuous loops (Perpetual=true) for ambient raids.'}
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : viewMode === 'graph' ? (
            /* 2D INTERACTIVE NODAL DAG GRAPH (v2.2) */
            <div className="flex-1 flex flex-col min-h-[540px] space-y-3">
              <div className="bg-slate-900/70 border border-emerald-900/50 p-3 rounded-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">
                    {tr(
                      lang,
                      '2D Story Event Dependency Graph (v2.2)',
                      'Grafo Nodal 2D de Eventos y Prerrequisitos (v2.2)',
                      'Graphe Nodal 2D des Événements (v2.2)'
                    )}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    {storyGraphLayout.nodes.length} {tr(lang, 'Nodes', 'Nodos', 'Nœuds')} ·{' '}
                    {storyGraphLayout.edges.length} {tr(lang, 'Connections', 'Conexiones', 'Connexions')} ·{' '}
                    {storyGraphLayout.maxCols} {tr(lang, 'Topological Tiers', 'Niveles Jerárquicos', 'Niveaux')}
                  </p>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs">
                  <button
                    onClick={() => setGraphZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))))}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-sm text-slate-200 cursor-pointer"
                  >
                    - Zoom
                  </button>
                  <span className="text-[11px] text-emerald-300 tabular-nums px-2">
                    {Math.round(graphZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setGraphZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-sm text-slate-200 cursor-pointer"
                  >
                    + Zoom
                  </button>
                  <button
                    onClick={() => setGraphZoom(1)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-sm text-slate-400 cursor-pointer"
                  >
                    100%
                  </button>
                  {selectedEvent && (
                    <button
                      onClick={() => setViewMode('params')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-[10px] uppercase font-bold cursor-pointer"
                    >
                      {tr(lang, `Edit ${selectedEvent.name}`, `Editar ${selectedEvent.name}`, `Éditer ${selectedEvent.name}`)}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-sm overflow-auto custom-scrollbar relative">
                <svg
                  width={storyGraphLayout.width * graphZoom}
                  height={storyGraphLayout.height * graphZoom}
                  viewBox={`0 0 ${storyGraphLayout.width} ${storyGraphLayout.height}`}
                  className="block"
                >
                  <defs>
                    <pattern id="storyGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#0f172a" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width={storyGraphLayout.width} height={storyGraphLayout.height} fill="url(#storyGrid)" />

                  {/* Column Tier Headers */}
                  {Array.from({ length: storyGraphLayout.maxCols }).map((_, colIdx) => (
                    <g key={`tier_${colIdx}`}>
                      <text
                        x={40 + colIdx * 290 + storyGraphLayout.nodeWidth / 2}
                        y={26}
                        textAnchor="middle"
                        fill="#64748b"
                        fontFamily="monospace"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {colIdx === 0
                          ? tr(lang, 'TIER 0 // ROOT TRIGGERS', 'NIVEL 0 // EVENTOS RAÍZ', 'NIVEAU 0 // RACINES')
                          : `TIER ${colIdx} // STEP +${colIdx}`}
                      </text>
                    </g>
                  ))}

                  {/* Bézier Dependency Edges */}
                  {storyGraphLayout.edges.map((edge) => {
                    const isHighlighted =
                      selectedEvent && (edge.fromId === selectedEvent.id || edge.toId === selectedEvent.id);
                    const dx = Math.max(60, Math.abs(edge.x2 - edge.x1) * 0.5);
                    const pathData = `M ${edge.x1} ${edge.y1} C ${edge.x1 + dx} ${edge.y1}, ${edge.x2 - dx} ${edge.y2}, ${edge.x2} ${edge.y2}`;
                    const strokeColor =
                      edge.kind === 'control'
                        ? isHighlighted
                          ? '#22d3ee'
                          : '#0e7490'
                        : isHighlighted
                        ? '#34d399'
                        : '#334155';

                    return (
                      <path
                        key={edge.id}
                        d={pathData}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 2.6 : 1.5}
                        strokeDasharray={edge.kind === 'control' ? '5,4' : undefined}
                      />
                    );
                  })}

                  {/* Event Nodes */}
                  {storyGraphLayout.nodes.map(({ ev, x, y }) => {
                    const isSel = selectedEvent?.id === ev.id;
                    const stroke = isSel ? '#34d399' : ev.active === false ? '#f43f5e' : '#4f46e5';
                    const bg = isSel ? '#064e3b' : '#0f172a';

                    return (
                      <g
                        key={ev.id}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => setSelectedEvent(ev)}
                        className="cursor-pointer"
                      >
                        <rect
                          width={storyGraphLayout.nodeWidth}
                          height={storyGraphLayout.nodeHeight}
                          rx={4}
                          fill={bg}
                          stroke={stroke}
                          strokeWidth={isSel ? 2.4 : 1.2}
                        />
                        <text
                          x={10}
                          y={20}
                          fill="#f8fafc"
                          fontFamily="monospace"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {ev.name.length > 25 ? `${ev.name.slice(0, 24)}…` : ev.name}
                        </text>
                        <text x={10} y={38} fill="#818cf8" fontFamily="monospace" fontSize="9.5">
                          TRG: {ev.eventType || 'NONE'}
                        </text>
                        <text x={10} y={54} fill="#34d399" fontFamily="monospace" fontSize="9.5">
                          RWD: {ev.rewardType || 'NONE'}
                        </text>
                        {ev.branch && (
                          <text x={10} y={68} fill="#38bdf8" fontFamily="monospace" fontSize="8.5">
                            Branch: {ev.branch}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          ) : viewMode === 'flow' ? (
            /* FLOW & CHAIN VISUALIZER + DIAGNOSTICS AUDITOR */
            <div className="max-w-5xl space-y-6 pb-12">
              {selectedEvent && (
                <div className="bg-slate-900/60 border border-indigo-900/40 rounded-sm p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-indigo-900/30 pb-3">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold flex items-center space-x-2">
                        <GitBranch className="w-4 h-4 text-cyan-400" />
                        <span>
                          {lang === 'es'
                            ? `Inspector de Cadena de Dependencias: ${selectedEvent.name}`
                            : `Event Dependency Chain Inspector: ${selectedEvent.name}`}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {lang === 'es'
                          ? 'Haz clic en cualquier nodo padre, hijo o hermano de rama para saltar directamente a ese evento.'
                          : 'Click any incoming prerequisite, outgoing dependent, or branch sibling node to jump to that event.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('params')}
                      className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                    >
                      {lang === 'es' ? 'Editar Parámetros' : 'Edit Parameters'}
                    </button>
                  </div>

                  {/* 3-Column Visual Flow Diagram */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Column 1: Incoming Prereqs & Controllers */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded p-3 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-1.5">
                        {lang === 'es'
                          ? '1. Disparado Por (<Prereq> / Control)'
                          : '1. Triggered By (<Prereq> / Control)'}
                      </div>

                      {eventChain.incomingPrereqs.length === 0 &&
                      eventChain.incomingControl.length === 0 ? (
                        <div className="text-[11px] font-mono text-emerald-400/80 py-3 text-center bg-emerald-950/20 border border-emerald-900/30 rounded">
                          {lang === 'es'
                            ? 'Evento Raíz (Sin Prereq previos)'
                            : 'Root Event (No prior Prereqs)'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {eventChain.incomingPrereqs.map((item, i) =>
                            item.event ? (
                              <button
                                key={i}
                                onClick={() => setSelectedEvent(item.event)}
                                className="w-full text-left p-2 rounded bg-slate-900 hover:bg-indigo-950/60 border border-indigo-500/30 transition-colors cursor-pointer"
                              >
                                <div className="text-[11px] font-mono font-bold text-indigo-200 truncate">
                                  {item.event.name}
                                </div>
                                <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between mt-0.5">
                                  <span>{item.event.eventType}</span>
                                  <span className="text-emerald-400">{item.event.rewardType}</span>
                                </div>
                              </button>
                            ) : (
                              <div
                                key={i}
                                className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/40 text-cyan-200 text-[11px] font-mono space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-bold truncate text-cyan-200">{item.name}</div>
                                  <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-sans uppercase font-bold">
                                    {lang === 'es' ? 'Trama Externa' : 'Cross-File'}
                                  </span>
                                </div>
                                <div className="text-[9px] text-cyan-400/80 flex items-center space-x-1">
                                  <Globe className="w-2.5 h-2.5 shrink-0" />
                                  <span>
                                    {lang === 'es'
                                      ? 'Resuelve vía trama/plot de campaña'
                                      : 'Resolves via campaign plot'}
                                  </span>
                                </div>
                              </div>
                            )
                          )}

                          {eventChain.incomingControl.map(ctrl => (
                            <button
                              key={ctrl.id}
                              onClick={() => setSelectedEvent(ctrl)}
                              className="w-full text-left p-2 rounded bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/40 transition-colors cursor-pointer"
                            >
                              <div className="text-[10px] font-mono text-cyan-300 font-bold truncate">
                                {ctrl.name}
                              </div>
                              <div className="text-[9px] font-mono text-cyan-400/80">
                                {ctrl.rewardType} &rarr; {ctrl.rewardParams[0]}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Active Selected Event Node */}
                    <div className="bg-indigo-950/40 border-2 border-indigo-500 rounded p-4 shadow-[0_0_25px_rgba(99,102,241,0.15)] space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500 text-slate-950 font-bold">
                          {lang === 'es' ? 'EVENTO ACTUAL' : 'ACTIVE NODE'}
                        </span>
                        {selectedEvent.branch && (
                          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-700/50 px-1.5 py-0.5 rounded">
                            {selectedEvent.branch}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-mono font-bold text-white break-all">
                        {selectedEvent.name}
                      </div>
                      <div className="text-[11px] font-mono space-y-1 pt-1 border-t border-indigo-800/50">
                        <div className="text-indigo-300">
                          <span className="text-slate-400">Trigger:</span> {selectedEvent.eventType || 'NONE'}
                          {selectedEvent.eventParams[0] ? ` (${selectedEvent.eventParams[0]})` : ''}
                        </div>
                        <div className="text-emerald-300">
                          <span className="text-slate-400">Reward:</span> {selectedEvent.rewardType || 'NONE'}
                          {selectedEvent.rewardParams[0] ? ` (${selectedEvent.rewardParams[0]})` : ''}
                        </div>
                        {selectedEvent.storyTag && (
                          <div className="text-purple-300">
                            <span className="text-slate-400">Story_Tag:</span> {selectedEvent.storyTag}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Outgoing Dependents & Targets */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded p-3 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-1.5">
                        {lang === 'es'
                          ? '3. Desbloquea / Dispara Después'
                          : '3. Unlocks / Triggers Next'}
                      </div>

                      {eventChain.outgoingDependents.length === 0 &&
                      eventChain.outgoingTargets.length === 0 ? (
                        <div className="text-[11px] font-mono text-slate-500 py-3 text-center border border-dashed border-slate-800 rounded">
                          {lang === 'es'
                            ? 'Fin de rama (Ningún evento depende de este)'
                            : 'Terminal node (No downstream dependents)'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {eventChain.outgoingDependents.map(dep => (
                            <button
                              key={dep.id}
                              onClick={() => setSelectedEvent(dep)}
                              className="w-full text-left p-2 rounded bg-slate-900 hover:bg-emerald-950/40 border border-emerald-500/30 transition-colors cursor-pointer"
                            >
                              <div className="text-[11px] font-mono font-bold text-emerald-200 truncate">
                                {dep.name}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between mt-0.5">
                                <span>{dep.eventType}</span>
                                <span className="text-emerald-400">{dep.rewardType}</span>
                              </div>
                            </button>
                          ))}

                          {eventChain.outgoingTargets.map(tgt => (
                            <button
                              key={`tgt_${tgt.id}`}
                              onClick={() => setSelectedEvent(tgt)}
                              className="w-full text-left p-2 rounded bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/40 transition-colors cursor-pointer"
                            >
                              <div className="text-[10px] font-mono font-bold text-purple-200 truncate">
                                {tgt.name}
                              </div>
                              <div className="text-[9px] font-mono text-purple-300/80">
                                Target of {selectedEvent.rewardType}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branch Siblings Row */}
                  {selectedEvent.branch && eventChain.branchSiblings.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-2">
                        {lang === 'es'
                          ? `Otros eventos en la rama "${selectedEvent.branch}" (${eventChain.branchSiblings.length}):`
                          : `Other events in branch "${selectedEvent.branch}" (${eventChain.branchSiblings.length}):`}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {eventChain.branchSiblings.map(sib => (
                          <button
                            key={sib.id}
                            onClick={() => setSelectedEvent(sib)}
                            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-cyan-950/50 border border-cyan-800/50 text-[11px] font-mono text-cyan-200 cursor-pointer transition-colors"
                          >
                            {sib.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Story Script Diagnostics & Auditor */}
              <div className="bg-slate-900/60 border border-indigo-900/40 rounded-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/30 pb-3">
                  <div className="flex items-center space-x-2">
                    {errorCount > 0 ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : warningCount > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : crossFileCount > 0 ? (
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-slate-200">
                      {lang === 'es'
                        ? `Auditoría de Integridad del Script (${diagnostics.length} referencias)`
                        : `Story Script Integrity Auditor (${diagnostics.length} findings)`}
                    </h3>
                  </div>

                  {/* Filter Tabs in Auditor */}
                  <div className="flex bg-slate-950 p-1 rounded border border-indigo-900/50 space-x-1 text-[10px] font-mono">
                    <button
                      onClick={() => setAuditFilter('all')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        auditFilter === 'all'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'es' ? 'Todos' : 'All'} ({diagnostics.length})
                    </button>
                    {errorCount > 0 && (
                      <button
                        onClick={() => setAuditFilter('errors')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          auditFilter === 'errors'
                            ? 'bg-red-600 text-white font-bold'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                      >
                        {lang === 'es' ? 'Errores' : 'Errors'} ({errorCount})
                      </button>
                    )}
                    {warningCount > 0 && (
                      <button
                        onClick={() => setAuditFilter('warnings')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          auditFilter === 'warnings'
                            ? 'bg-amber-600 text-white font-bold'
                            : 'text-amber-400 hover:text-amber-300'
                        }`}
                      >
                        {lang === 'es' ? 'Avisos' : 'Warnings'} ({warningCount})
                      </button>
                    )}
                    {crossFileCount > 0 && (
                      <button
                        onClick={() => setAuditFilter('cross_file')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1 ${
                          auditFilter === 'cross_file'
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'text-cyan-400 hover:text-cyan-300'
                        }`}
                      >
                        <Globe className="w-2.5 h-2.5" />
                        <span>
                          {lang === 'es' ? 'Ref. Cruzadas' : 'Cross-File'} ({crossFileCount})
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Educational Engine Guidance Banner */}
                <div className="p-3 rounded bg-indigo-950/20 border border-indigo-500/30 text-slate-300 text-xs font-mono flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-cyan-300 text-[11px] uppercase tracking-wider">
                      {lang === 'es'
                        ? 'Arquitectura Multi-Archivo de Petroglyph EaW / FoC:'
                        : 'Petroglyph EaW / FoC Multi-File Architecture:'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {lang === 'es'
                        ? 'Las campañas en Empire at War cargan múltiples archivos de historia a la vez mediante tramas (<Plot><Event_Files>). Por eso, las referencias marcadas como "Trama Externa / Cross-File" son completamente válidas en el juego si dicho evento está declarado en otro archivo XML de la misma campaña.'
                        : 'Campaigns in Empire at War load multiple Story XMLs at once via plots (<Plot><Event_Files>). Therefore, references labeled "Cross-File" are completely valid in-game as long as the event is declared in another XML belonging to the same campaign.'}
                    </p>
                  </div>
                </div>

                {diagnostics.length === 0 ? (
                  <div className="p-4 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {lang === 'es'
                        ? 'Todos los enlaces <Prereq>, etiquetas <Story_Tag>, flags y nombres de eventos son consistentes.'
                        : 'All <Prereq> links, <Story_Tag> goals, flags, and event names in this script are valid.'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diagnostics
                      .filter(item => {
                        if (auditFilter === 'errors') return item.severity === 'error';
                        if (auditFilter === 'warnings') return item.severity === 'warning';
                        if (auditFilter === 'cross_file') return item.category === 'cross_file';
                        return true;
                      })
                      .map(item => {
                        const targetEv = events.find(e => e.id === item.eventId);
                        const isCrossFile = item.category === 'cross_file';
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded border flex items-center justify-between gap-4 transition-colors ${
                              item.severity === 'error'
                                ? 'bg-red-950/25 border-red-500/40 text-red-200'
                                : item.severity === 'warning'
                                ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                                : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
                            }`}
                          >
                            <div className="space-y-1 font-mono text-xs">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    item.severity === 'error'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      : item.severity === 'warning'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  }`}
                                >
                                  {isCrossFile
                                    ? (lang === 'es' ? 'Trama Externa' : 'Cross-File')
                                    : item.severity.toUpperCase()}
                                </span>
                                <span className="font-bold text-white">{item.eventName}</span>
                              </div>
                              <div className="text-[11px] opacity-90 leading-relaxed font-sans">
                                {lang === 'es' ? item.messageEs : item.messageEn}
                              </div>
                            </div>
                            {targetEv && (
                              <button
                                onClick={() => {
                                  setSelectedEvent(targetEv);
                                  setViewMode('params');
                                }}
                                className="px-3 py-1 bg-slate-950 hover:bg-indigo-950 border border-slate-700 rounded text-[10px] font-mono uppercase tracking-wider text-indigo-300 shrink-0 cursor-pointer"
                              >
                                {lang === 'es' ? 'Inspeccionar' : 'Inspect'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* XML VIEW */
            <div className="flex-1 flex flex-col h-full bg-slate-900/50 border border-indigo-900/40 rounded-sm overflow-hidden">
              <div className="p-3 border-b border-indigo-900/40 flex items-center justify-between bg-slate-900">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    Scope:
                  </span>
                  <button
                    onClick={() => setXmlScope('event')}
                    className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      xmlScope === 'event'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t.storyEditor.singleEventXml}
                  </button>
                  <button
                    onClick={() => setXmlScope('document')}
                    className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      xmlScope === 'document'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t.storyEditor.fullFileXml}
                  </button>
                </div>

                {settings.storyXmlEditable && (
                  <div className="flex items-center space-x-3">
                    {xmlError && (
                      <div className="flex items-center space-x-1 text-red-400 text-xs font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{xmlError}</span>
                      </div>
                    )}
                    {saveSuccess && (
                      <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.storyEditor.xmlSaved}</span>
                      </div>
                    )}
                    <button
                      onClick={handleApplyXmlChanges}
                      disabled={!isXmlDirty}
                      className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                        isXmlDirty
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)] cursor-pointer'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {t.storyEditor.applyXml}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 relative flex flex-col min-h-0">
                {!settings.storyXmlEditable && (
                  <div className="absolute top-2 right-4 z-20 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded text-[10px] font-mono text-slate-500 pointer-events-none">
                    {t.storyEditor.readOnlyMsg}
                  </div>
                )}
                <CodeEditorWithLines
                  value={rawXmlText}
                  onChange={val => {
                    setRawXmlText(val);
                    setIsXmlDirty(true);
                  }}
                  readOnly={!settings.storyXmlEditable}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help & Documentation Hub Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-sm w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="border-b border-indigo-900/60 bg-slate-950/70 p-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-100 flex items-center space-x-2">
                    <span>{t.storyEditor.helpTitle || (lang === 'es' ? 'Manual de Scripting del Modo Historia' : 'Story Mode Scripting Manual')}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Star Wars: Empire at War &bull; Forces of Corruption XML Engine
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex bg-slate-950 p-1 rounded border border-indigo-900/50 space-x-1">
                  <button
                    onClick={() => setHelpTab('guide')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      helpTab === 'guide'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    {lang === 'es' ? '1. Guía del Motor' : '1. Engine Guide'}
                  </button>
                  <button
                    onClick={() => setHelpTab('events')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      helpTab === 'events'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    {lang === 'es' ? '2. Disparadores' : '2. Triggers'}
                  </button>
                  <button
                    onClick={() => setHelpTab('rewards')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      helpTab === 'rewards'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    {lang === 'es' ? '3. Recompensas' : '3. Rewards'}
                  </button>
                  <button
                    onClick={() => setHelpTab('templates')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      helpTab === 'templates'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    {lang === 'es' ? '4. Patrones Rápidos' : '4. Quick Patterns'}
                  </button>
                </div>

                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="text-slate-400 hover:text-indigo-300 transition-colors p-1.5 rounded hover:bg-slate-800 cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar font-sans text-xs text-slate-300 leading-relaxed">
              {/* TAB 1: ENGINE GUIDE */}
              {helpTab === 'guide' && (
                <div className="space-y-6">
                  {/* Intro Banner */}
                  <div className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-sm space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-300 font-mono font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>{lang === 'es' ? 'Arquitectura del Motor de Historia Petroglyph' : 'Petroglyph Story Engine Architecture'}</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {t.storyEditor.helpIntro ||
                        (lang === 'es'
                          ? 'Los archivos Story XML de Petroglyph Empire at War controlan la progresión narrativa de la campaña, transmisiones cinemáticas en holocrón, despliegue de flotas y héroes, desbloqueos tecnológicos y disparadores de scripts Lua.'
                          : 'Petroglyph Empire at War Story XML files control campaign narrative progression, cinematic holocron briefings, fleet spawns, tech tree unlocks, and Lua script communication.')}
                    </p>
                  </div>

                  {/* Visual Flow Diagram */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-sm space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      {lang === 'es' ? 'Ciclo de Ejecución de un Evento (<Event>):' : 'Event Execution Lifecycle (<Event>):'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded">
                        <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1">Paso 1: Disparador</div>
                        <div className="text-xs font-mono font-bold text-slate-200">&lt;Event_Type&gt;</div>
                        <div className="text-[10px] text-slate-400 mt-1">Temporizador, Conquista, Flag o Lua</div>
                      </div>
                      <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded">
                        <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1">Paso 2: Prerrequisitos</div>
                        <div className="text-xs font-mono font-bold text-slate-200">&lt;Prereq&gt;</div>
                        <div className="text-[10px] text-slate-400 mt-1">Todos los eventos previos requeridos</div>
                      </div>
                      <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded">
                        <div className="text-[10px] font-mono font-bold text-emerald-400 mb-1">Paso 3: Recompensa</div>
                        <div className="text-xs font-mono font-bold text-slate-200">&lt;Reward_Type&gt;</div>
                        <div className="text-[10px] text-slate-400 mt-1">Héroes, Holocrón, Unidades, Flags</div>
                      </div>
                      <div className="p-3 bg-slate-900 border border-purple-500/30 rounded">
                        <div className="text-[10px] font-mono font-bold text-purple-400 mb-1">Paso 4: Control</div>
                        <div className="text-xs font-mono font-bold text-slate-200">&lt;Active&gt; / &lt;Branch&gt;</div>
                        <div className="text-[10px] text-slate-400 mt-1">Ramas, Bucles y Despertar</div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pillars Breakdown */}
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
                      <div className="flex items-center space-x-2 text-indigo-300 font-mono text-xs font-bold uppercase">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span>{t.storyEditor.helpStep1 || '1. Disparador del Evento (<Event_Type>)'}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {lang === 'es'
                          ? 'Define la condición que el motor de juego debe comprobar. STORY_ELAPSED para temporizadores en segundos, STORY_CONQUER para cuando un planeta cae bajo control, STORY_FLAG para verificar flags de partida, o STORY_TRIGGER para dispararse inmediatamente sin esperar acciones externas.'
                          : 'Defines the in-game trigger condition. STORY_ELAPSED for countdowns, STORY_CONQUER for invasions, STORY_FLAG for variable states, or STORY_TRIGGER to fire immediately once prereqs complete.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
                      <div className="flex items-center space-x-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                        <GitBranch className="w-4 h-4 text-cyan-400" />
                        <span>{t.storyEditor.helpStep2 || '2. Prerrequisitos (<Prereq>)'}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {lang === 'es'
                          ? 'Permite organizar árboles narrativos secuenciales o ramificados. Un evento no evaluará su disparador hasta que todos los eventos listados en su etiqueta <Prereq> hayan concluido exitosamente. Puedes usar la pestaña "Flujo y Cadena" para inspeccionar las conexiones interactivas.'
                          : 'Links story missions into branching trees. An event will not fire until every prerequisite event specified in <Prereq> completes successfully.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded space-y-1.5">
                      <div className="flex items-center space-x-2 text-emerald-300 font-mono text-xs font-bold uppercase">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span>{t.storyEditor.helpStep3 || '3. Recompensas & Acciones (<Reward_Type>)'}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {lang === 'es'
                          ? 'La acción que el juego ejecuta: SPAWN_HERO (despliega héroes o escuadrones en órbita o superficie), MULTIMEDIA (reproduce diálogos con vídeo holográfico en el Holocrón), BUILDABLE_UNIT (desbloquea naves en astilleros), CREDITS (otorga fondos) o SET_FLAG.'
                          : 'Gameplay action executed upon trigger: SPAWN_HERO for fleet or ground reinforcements, MULTIMEDIA for cinematic holocron dialogue, BUILDABLE_UNIT for tech unlocks, or SET_FLAG.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-purple-800/40 rounded space-y-1.5">
                      <div className="flex items-center space-x-2 text-purple-300 font-mono text-xs font-bold uppercase">
                        <Repeat className="w-4 h-4 text-purple-400" />
                        <span>{t.storyEditor.helpStep4 || '4. Banderas de Ejecución (<Active> & <Perpetual>)'}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {lang === 'es'
                          ? 'Establece <Active> en false para que el evento empiece dormido y deba ser despertado por otro evento usando ENABLE_EVENT. Establece <Perpetual> en true para que el evento se repita en bucle cada vez que se cumpla su condición (útil para ingresos periódicos o raids).'
                          : 'Set <Active> to false for dormant events that wait for ENABLE_EVENT. Set <Perpetual> to true for continuous loops such as periodic revenue or ambient pirate attacks.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-cyan-800/40 rounded space-y-1.5">
                      <div className="flex items-center space-x-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>
                          {lang === 'es'
                            ? '5. Tramas Multi-Archivo & Campañas (<Story_Plots> / <Event_Files>)'
                            : '5. Multi-File Story Plots & Campaigns (<Story_Plots> / <Event_Files>)'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {lang === 'es'
                          ? 'En Petroglyph EaW / FoC, las campañas de Conquista Galáctica cargan listas de múltiples archivos XML de historia a la vez (especificados en <Event_Files> dentro de las tramas de campaña). Todos los archivos cargados comparten el mismo espacio de nombres de eventos y flags en memoria. Por ello, es completamente normal y estándar que un evento tenga en <Prereq> o en ENABLE_EVENT nombres de eventos que residen en otro archivo XML de la campaña.'
                          : 'In Petroglyph EaW / FoC, Galactic Conquest campaigns load multiple Story XML files simultaneously (specified under <Event_Files> within campaign plot files). All loaded event files share a unified global namespace in memory. It is standard and expected for an event to reference prerequisite names or ENABLE_EVENT targets declared in sibling Story XML files.'}
                      </p>
                    </div>
                  </div>

                  {/* XML Code Example Block */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      {lang === 'es' ? 'Ejemplo Canónico de Evento XML en Empire at War:' : 'Canonical Empire at War XML Event Structure:'}
                    </div>
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed custom-scrollbar">
{`<!-- Ejemplo: Conquista de Kuat y despliegue del Destructor Estelar Ejecutor -->
<Event Name="Empire_Conquer_Kuat_Mission">
    <Event_Type>STORY_CONQUER</Event_Type>
    <Event_Param1>Kuat</Event_Param1>
    <Reward_Type>SPAWN_HERO</Reward_Type>
    <Reward_Param1>Executor_Super_Star_Destroyer</Reward_Param1>
    <Reward_Param2>Kuat</Reward_Param2>
    <Prereq>Empire_Briefing_Core_Invasion</Prereq>
    <Story_Dialog>Dialog_Empire_Kuat_Secured</Story_Dialog>
    <Story_Chapter>1</Story_Chapter>
    <Story_Tag>Goal_Kuat_Control</Story_Tag>
    <Branch>Branch_Core_Assault</Branch>
</Event>`}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: TRIGGERS (EVENT_TYPES) CATALOG */}
              {helpTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={lang === 'es' ? 'Buscar tipo de disparador (ej: CONQUER, ELAPSED, FLAG)...' : 'Search trigger types (e.g. CONQUER, ELAPSED, FLAG)...'}
                        value={helpSearch}
                        onChange={e => setHelpSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-cyan-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    {helpSearch && (
                      <button
                        onClick={() => setHelpSearch('')}
                        className="px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-white border border-slate-800 rounded bg-slate-950"
                      >
                        {lang === 'es' ? 'Limpiar' : 'Clear'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(EVENT_TYPES)
                      .filter(([type, def]) => {
                        if (!helpSearch) return true;
                        const q = helpSearch.toLowerCase();
                        return (
                          type.toLowerCase().includes(q) ||
                          def.category.toLowerCase().includes(q) ||
                          def.es.toLowerCase().includes(q) ||
                          def.en.toLowerCase().includes(q)
                        );
                      })
                      .map(([type, def]) => (
                        <div key={type} className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                            <span className="font-mono text-xs font-bold text-indigo-300">{type}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                              {def.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            {lang === 'es' ? def.es : def.en}
                          </p>
                          {def.params && def.params.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">
                                {lang === 'es' ? 'Parámetros esperados:' : 'Expected parameters:'}
                              </span>
                              {def.params.map((p, idx) => (
                                <div key={idx} className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60">
                                  <span className="text-indigo-400 font-bold">Param{idx + 1}:</span>{' '}
                                  {lang === 'es' ? p.labelEs : p.labelEn}
                                  {p.placeholder && (
                                    <span className="text-slate-500 ml-1 italic">(ej: {p.placeholder})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 3: REWARDS (REWARD_TYPES) CATALOG */}
              {helpTab === 'rewards' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={lang === 'es' ? 'Buscar recompensas (ej: SPAWN_HERO, MULTIMEDIA, FLAG)...' : 'Search reward types (e.g. SPAWN_HERO, MULTIMEDIA, FLAG)...'}
                        value={helpSearch}
                        onChange={e => setHelpSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {helpSearch && (
                      <button
                        onClick={() => setHelpSearch('')}
                        className="px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-white border border-slate-800 rounded bg-slate-950"
                      >
                        {lang === 'es' ? 'Limpiar' : 'Clear'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(REWARD_TYPES)
                      .filter(([type, def]) => {
                        if (!helpSearch) return true;
                        const q = helpSearch.toLowerCase();
                        return (
                          type.toLowerCase().includes(q) ||
                          def.category.toLowerCase().includes(q) ||
                          def.es.toLowerCase().includes(q) ||
                          def.en.toLowerCase().includes(q)
                        );
                      })
                      .map(([type, def]) => (
                        <div key={type} className="p-3 bg-slate-950/60 border border-slate-800 rounded space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-300">{type}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                              {def.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            {lang === 'es' ? def.es : def.en}
                          </p>
                          {def.params && def.params.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">
                                {lang === 'es' ? 'Parámetros esperados:' : 'Expected parameters:'}
                              </span>
                              {def.params.map((p, idx) => (
                                <div key={idx} className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/60">
                                  <span className="text-emerald-400 font-bold">Reward_Param{idx + 1}:</span>{' '}
                                  {lang === 'es' ? p.labelEs : p.labelEn}
                                  {p.placeholder && (
                                    <span className="text-slate-500 ml-1 italic">(ej: {p.placeholder})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: QUICK PATTERNS / TEMPLATES */}
              {helpTab === 'templates' && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-200 text-xs">
                    {lang === 'es'
                      ? 'Haz clic en cualquiera de estos patrones prediseñados para insertarlos directamente en tu archivo Story XML actual:'
                      : 'Click any of these pre-built patterns to insert them directly into your current Story XML document:'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {STORY_TEMPLATES.map(tpl => (
                      <div
                        key={tpl.id}
                        className="p-4 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 rounded flex flex-col justify-between space-y-3 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            <h3 className="font-mono text-xs font-bold text-cyan-200">
                              {lang === 'es' ? tpl.labelEs : tpl.labelEn}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            {lang === 'es' ? tpl.descEs : tpl.descEn}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            handleInsertTemplate(tpl);
                            setIsHelpOpen(false);
                          }}
                          className="w-full py-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded text-[11px] font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'es' ? 'Insertar en este Script' : 'Insert into this Script'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-indigo-900/40 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                <span>{events.length} {t.storyEditor.eventsCount}</span>
                <span>&bull;</span>
                <span>{allBranches.length} {lang === 'es' ? 'Ramas' : 'Branches'}</span>
                {diagnostics.length > 0 && (
                  <>
                    <span>&bull;</span>
                    <span className="text-amber-400">{diagnostics.length} {lang === 'es' ? 'Avisos' : 'Issues'}</span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleAddEvent();
                    setIsHelpOpen(false);
                  }}
                  className="px-4 py-2 border border-indigo-500/40 hover:bg-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-wider font-bold rounded-sm transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'es' ? 'Crear Evento' : 'New Event'}</span>
                </button>

                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-widest font-bold rounded-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                >
                  {lang === 'es' ? 'Entendido / Cerrar' : 'Got it / Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
