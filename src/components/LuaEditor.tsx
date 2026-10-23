import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileCode, Search, Copy, Check, Save, X, Terminal, Code2, Sparkles,
  AlertTriangle, CheckCircle2, Undo2, Redo2, Wand2, Upload, RotateCcw,
  FolderOpen, ChevronRight, ChevronDown, Layers, Eye, Wrench, Eraser,
  BookOpen, Plus, Trash2, HelpCircle, Play, Cpu, GitBranch, Zap, ShieldAlert
} from 'lucide-react';
import { LUA_COMMANDS } from '../data/luaCommands';
import { LUA_SNIPPETS, LuaSnippet } from '../data/luaSnippets';
import { Planet } from '../types';
import { useLanguage, tr } from '../i18n';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-lua';
import * as luaparse from 'luaparse';

const CodeEditorWithLines = ({
  value,
  onValueChange,
  highlight,
  errorLine
}: {
  value: string;
  onValueChange: (val: string) => void;
  highlight: (code: string) => string;
  errorLine?: number | null;
}) => {
  const lineCount = value.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#0B101B]">
      <div
        ref={gutterRef}
        className="w-12 py-4 bg-slate-950/60 border-r border-slate-800/80 text-right pr-3 select-none font-mono text-xs text-slate-600 overflow-hidden shrink-0"
        style={{ lineHeight: '20px' }}
      >
        {lines.map(n => (
          <div
            key={n}
            className={`${
              errorLine === n ? 'text-red-400 font-bold bg-red-500/20 -mr-3 pr-3' : ''
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto relative" onScroll={handleScroll}>
        <Editor
          value={value}
          onValueChange={onValueChange}
          highlight={code => {
            const highlighted = highlight(code);
            if (!errorLine) return highlighted;
            const htmlLines = highlighted.split('\n');
            if (htmlLines[errorLine - 1] !== undefined) {
              htmlLines[errorLine - 1] = `<span class="bg-red-500/20 inline-block w-full border-b border-red-500/50">${htmlLines[errorLine - 1]}</span>`;
            }
            return htmlLines.join('\n');
          }}
          padding={16}
          textareaId="code-editor-textarea"
          className="font-mono text-[13px] min-h-full"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 13,
            lineHeight: '20px',
            backgroundColor: 'transparent'
          }}
        />
      </div>
    </div>
  );
};

interface LuaEditorProps {
  initialContent: string;
  fileName: string;
  onClose: () => void;
  onSave: (newContent: string, fileName: string) => void;
  workspaceFiles?: File[];
  onSelectWorkspaceLua?: (path: string) => void;
  planets?: Planet[];
}

interface LuaSymbolItem {
  id: string;
  name: string;
  kind: 'function' | 'state' | 'thread' | 'variable';
  params?: string;
  line: number;
  endLine: number;
  detail?: string;
  isEntryPoint?: boolean;
}

interface LuaDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  line: number;
  fixType?: 'add-require' | 'create-function' | 'create-state';
  fixPayload?: string;
}

interface LuaTemplate {
  id: string;
  name: string;
  category: 'Story Mode' | 'Táctico / Cinemática' | 'GameObject / Unidad' | 'IA / FreeStore';
  description: string;
  code: string;
}

const PG_MODULES = [
  { name: 'PGStateMachine', desc: 'Máquina de estados (Define_State, Set_Next_State, OnEnter, OnUpdate, OnExit)' },
  { name: 'PGStoryMode', desc: 'Integración con Story XML (Story_Mode_Service, llamadas de eventos)' },
  { name: 'PGSpawnUnits', desc: 'Despliegue avanzado de escuadrones y flotas (SpawnList, ReinforceList)' },
  { name: 'PGMoveUnits', desc: 'Movimiento coordinado y formaciones de unidades' },
  { name: 'PGBase', desc: 'Funciones base del motor Alamo (Sleep, BlockOnCommand, TestValid)' },
  { name: 'PGCommands', desc: 'Comandos tácticos, habilidades y envoltorios de órdenes' },
  { name: 'PGDebug', desc: 'Mensajes de depuración y trazas en consola (_ScriptMessage)' }
];

const EAW_LUA_TEMPLATES: LuaTemplate[] = [
  {
    id: 'story-script',
    name: 'Script de Modo Historia (Story Mode)',
    category: 'Story Mode',
    description: 'Estructura completa conectada a un archivo Story XML con máquina de estados, validación de planetas y disparo de Story_Event.',
    code: `-- ============================================================================
-- SCRIPT DE MODO HISTORIA (STORY MODE) - EMPIRE AT WAR
-- ============================================================================
require("PGStateMachine")
require("PGStoryMode")
require("PGSpawnUnits")
require("PGMoveUnits")

function Definitions()
  DebugMessage("%s -- Iniciando Definitions", tostring(Script))
  ServiceRate = 1

  StoryModeEvents = {
    Universal_Story_Start = State_Init,
    Trigger_Mission_Battle = State_Spawn_Fleet
  }

  -- Listas de unidades a desplegar
  imperial_fleet_list = {
    "Star_Destroyer",
    "Acclamator_Assault_Ship",
    "TIE_Fighter_Squadron"
  }
end

function State_Init(message)
  if message == OnEnter then
    empire_player = Find_Player("Empire")
    rebel_player = Find_Player("Rebel")
    target_planet = FindPlanet("Coruscant")

    -- Notificar al XML que el script Lua está listo
    Story_Event("LUA_SCRIPT_INITIALIZED")
  elseif message == OnUpdate then
    -- Bucle de actualización del estado inicial
  end
end

function State_Spawn_Fleet(message)
  if message == OnEnter then
    if TestValid(target_planet) and TestValid(empire_player) then
      spawned_fleet = SpawnList(imperial_fleet_list, target_planet, empire_player, true, false)
      Game_Message("TEXT_STORY_TRANSMISSION_FLEET_ARRIVED")
      Story_Event("FLEET_SPAWNED_COMPLETE")
    end
  end
end
`
  },
  {
    id: 'tactical-cinematic',
    name: 'Misión Táctica con Intro Cinemática',
    category: 'Táctico / Cinemática',
    description: 'Controla una batalla espacial o terrestre con cámara cinemática inicial, refuerzos por hiperespacio y condición de victoria.',
    code: `-- ============================================================================
-- SCRIPT DE MISIÓN TÁCTICA Y CÁMARA CINEMÁTICA
-- ============================================================================
require("PGStateMachine")
require("PGSpawnUnits")
require("PGMoveUnits")

function Definitions()
  ServiceRate = 1
  Define_State("State_Init", State_Init)
  Define_State("State_Tactical_Battle", State_Tactical_Battle)

  reinforcement_list = {
    "Calamari_Cruiser",
    "Nebulon_B_Frigate",
    "X-Wing_Squadron"
  }
end

function State_Init(message)
  if message == OnEnter then
    rebel = Find_Player("Rebel")
    empire = Find_Player("Empire")
    entry_marker = Find_Hint("MARKER_GENERIC_BLUE", "rebel-entry")

    -- Iniciar secuencia cinemática en un hilo dedicado
    Create_Thread("Thread_Intro_Cinematic")
  end
end

function Thread_Intro_Cinematic()
  Fade_Screen_Out(0)
  Suspend_AI(1)
  Lock_Controls(1)
  Letter_Box_In(0)
  Start_Cinematic_Camera()

  if TestValid(entry_marker) then
    Point_Camera_At(entry_marker)
    Set_Cinematic_Camera_Key(entry_marker, 400, 25, 45, 1, 0, 0, 0)
    Set_Cinematic_Target_Key(entry_marker, 0, 0, 0, 0, entry_marker, 0, 0)
  end

  Fade_Screen_In(2.0)
  Sleep(2.0)

  -- Salto hiperespacial de la flota
  if TestValid(entry_marker) then
    rebel_fleet = SpawnList(reinforcement_list, entry_marker, rebel, true, true)
  end

  Transition_Cinematic_Camera_Key(entry_marker, 5.0, 750, 35, 120, 1, 0, 0, 0)
  Sleep(5.0)

  -- Devolver el control al jugador
  Point_Camera_At(entry_marker)
  Transition_To_Tactical_Camera(2.0)
  Letter_Box_Out(1.5)
  Sleep(2.0)
  End_Cinematic_Camera()
  Lock_Controls(0)
  Suspend_AI(0)

  Add_Objective("TEXT_MISSION_DESTROY_IMPERIAL_STATION", false)
  Set_Next_State("State_Tactical_Battle")
end

function State_Tactical_Battle(message)
  if message == OnUpdate then
    local station = Find_First_Object("Empire_Star_Base_3")
    if not TestValid(station) then
      Story_Event("TACTICAL_VICTORY_ACHIEVED")
      ScriptExit()
    end
  end
end
`
  },
  {
    id: 'unit-ability',
    name: 'Comportamiento de Unidad / Habilidad (GameObject)',
    category: 'GameObject / Unidad',
    description: 'Script adjunto mediante <Lua_Script> a una unidad o héroe para activar habilidades automáticas o efectos por proximidad.',
    code: `-- ============================================================================
-- SCRIPT DE UNIDAD / HABILIDAD TÁCTICA (<Lua_Script>)
-- ============================================================================
require("PGStateMachine")

function Definitions()
  ServiceRate = 1.0
  Define_State("State_Init", State_Init)
  Define_State("State_Monitor_Unit", State_Monitor_Unit)

  ability_range = 350
  ability_name = "TURBO"
end

function State_Init(message)
  if message == OnEnter then
    if Get_Game_Mode() == "Galactic" then
      ScriptExit()
    end

    if TestValid(Object) then
      Object.Event_Object_In_Range(Prox_Enemy_Detected, ability_range)
      Set_Next_State("State_Monitor_Unit")
    end
  end
end

function State_Monitor_Unit(message)
  if message == OnUpdate then
    if not TestValid(Object) then
      ScriptExit()
    end

    -- Activar habilidad defensiva si el escudo baja del 35%
    if Object.Get_Shield() < 0.35 and Object.Is_Ability_Ready("DEFEND") then
      Object.Activate_Ability("DEFEND", true)
    end
  end
end

function Prox_Enemy_Detected(prox_obj, trigger_obj)
  if not TestValid(trigger_obj) or not TestValid(Object) then
    return
  end

  if trigger_obj.Get_Owner().Is_Enemy(Object.Get_Owner()) then
    if Object.Is_Ability_Ready(ability_name) then
      Object.Activate_Ability(ability_name, true)
    end
  end
end
`
  },
  {
    id: 'ai-freestore',
    name: 'Plan de IA / Gestión FreeStore',
    category: 'IA / FreeStore',
    description: 'Script de plan estratégico para la IA galáctica o táctica con ensamblaje de TaskForce y movimiento hacia objetivos.',
    code: `-- ============================================================================
-- SCRIPT DE PLAN DE IA Y TASKFORCE
-- ============================================================================
require("pgevents")

function Definitions()
  Category = "Conquer_Opponent_Planet"
  TaskForce = {
    {
      "MainForce",
      "MinimumTotalSize = 3",
      "Capital | Frigate = 100%"
    }
  }
  RequiredCategories = { "Capital", "Frigate" }
  IgnoreTarget = false
end

function MainForce_Thread()
  BlockOnCommand(MainForce.Produce_Force())
  QuickReinforce(PlayerObject, AITarget, MainForce)

  -- Avanzar hacia el sistema objetivo
  BlockOnCommand(MainForce.Move_To(AITarget))

  if MainForce.Get_Force_Count() > 0 then
    MainForce.Set_Plan_Result(true)
  else
    MainForce.Set_Plan_Result(false)
  end

  ScriptExit()
end
`
  }
];

const EXTRA_SNIPPETS: LuaSnippet[] = [
  ...LUA_SNIPPETS,
  {
    name: 'SpawnList (Flota Completa)',
    description: 'Despliega una tabla de unidades en un planeta o marcador con hiperespacio.',
    code: `local unit_list = { "Star_Destroyer", "Victory_Destroyer", "TIE_Fighter_Squadron" }
local spawn_point = FindPlanet("Corellia")
if TestValid(spawn_point) then
  local spawned_fleet = SpawnList(unit_list, spawn_point, PlayerObject, true, true)
end`
  },
  {
    name: 'Bucle de Hilo Seguro (Coroutine)',
    description: 'Hilo secundario con pausa Sleep() obligatoria para no bloquear el motor Alamo.',
    code: `Create_Thread("Monitor_Battle_Thread")

function Monitor_Battle_Thread()
  while true do
    -- Lógica periódica cada 2 segundos
    local hero = Find_First_Object("Darth_Vader")
    if not TestValid(hero) then
      Story_Event("VADER_DEFEATED")
      break
    end
    Sleep(2.0)
  end
end`
  },
  {
    name: 'Sensor de Proximidad (Event_Object_In_Range)',
    description: 'Registra un callback cuando una unidad enemiga entra en el radio de un objeto.',
    code: `if TestValid(Object) then
  Object.Event_Object_In_Range(On_Unit_Near_Marker, 250)
end

function On_Unit_Near_Marker(self_obj, trigger_obj)
  if TestValid(trigger_obj) and trigger_obj.Get_Owner() == Find_Player("Rebel") then
    self_obj.Cancel_Event_Object_In_Range(On_Unit_Near_Marker)
    Story_Event("REBEL_ENTERED_PERIMETER")
  end
end`
  },
  {
    name: 'Validación Segura Lua 5.0 (table.getn)',
    description: 'Itera sobre una lista de objetos usando table.getn (compatible con Lua 5.0 de EaW).',
    code: `local units = Find_All_Objects_Of_Type("Capital")
local count = table.getn(units)
for i = 1, count do
  local unit = units[i]
  if TestValid(unit) then
    unit.Make_Invulnerable(true)
  end
end`
  }
];

type CommandCategory = 'all' | 'states' | 'units' | 'galaxy' | 'story' | 'camera' | 'ai';

function categorizeLuaCommand(name: string, desc: string): CommandCategory {
  const n = name.toLowerCase();
  const d = desc.toLowerCase();
  if (
    n.includes('thread') || n.includes('state') || n.includes('sleep') ||
    n.includes('service') || n.includes('event') || n.includes('block') ||
    n.includes('globalvalue') || n.includes('script')
  ) {
    return 'states';
  }
  if (
    n.includes('camera') || n.includes('cinematic') || n.includes('fade') ||
    n.includes('letter_box') || n.includes('bink') || n.includes('music') ||
    n.includes('sfx') || n.includes('weather') || n.includes('fog')
  ) {
    return 'camera';
  }
  if (
    n.includes('story') || n.includes('objective') || n.includes('dialog') ||
    n.includes('message') || n.includes('blip') || n.includes('highlight')
  ) {
    return 'story';
  }
  if (
    n.includes('planet') || n.includes('starbase') || n.includes('groundbase') ||
    n.includes('fleet') || n.includes('galactic') || n.includes('path') ||
    n.includes('corrupted') || n.includes('invade')
  ) {
    return 'galaxy';
  }
  if (
    n.includes('freestore') || n.includes('perception') || n.includes('target') ||
    n.includes('goal') || n.includes('desire') || n.includes('force') ||
    d.includes('taskforce') || n.includes('stage')
  ) {
    return 'ai';
  }
  return 'units';
}

const CORE_ALAMO_COMMANDS: { name: string; desc: string }[] = [
  { name: 'Define_State', desc: 'Registra un estado en PGStateMachine: Define_State("State_Init", State_Init)' },
  { name: 'Set_Next_State', desc: 'Transiciona la máquina de estados al siguiente estado: Set_Next_State("State_Battle")' },
  { name: 'TestValid', desc: 'Verifica de forma segura si un GameObjectWrapper existe y no ha sido destruido: TestValid(obj)' },
  { name: 'Sleep', desc: 'Pausa el hilo/corrutina actual durante X segundos sin congelar el juego: Sleep(2.0)' },
  { name: 'BlockOnCommand', desc: 'Espera en el hilo actual hasta que finalice un comando asíncrono: BlockOnCommand(cmd)' },
  { name: 'SpawnList', desc: 'Despliega una lista de tipos de unidades (PGSpawnUnits): SpawnList(type_list, entry_marker, player, allow_ai, delete_after)' },
  { name: 'ReinforceList', desc: 'Despliega refuerzos por hiperespacio o transporte: ReinforceList(type_list, entry_marker, player, allow_ai, delete_after, ignore_reinforcement_rules, callback)' },
  { name: 'Story_Mode_Service', desc: 'Procesa los eventos de StoryModeEvents registrados en Definitions()' },
  { name: 'ScriptExit', desc: 'Finaliza la ejecución del script Lua actual de forma limpia' },
  { name: 'DebugMessage', desc: 'Imprime un mensaje formateado en el registro de depuración del motor Alamo' }
];

function formatLuaCode(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let indentLevel = 0;
  const formattedLines: string[] = [];

  for (let rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // Remove inline comments and strings when analyzing indentation tokens
    const codeOnly = trimmed
      .replace(/--.*$/, '')
      .replace(/"([^"\\]|\\.)*"/g, '""')
      .replace(/'([^'\\]|\\.)*'/g, "''")
      .trim();

    const startsWithDedent =
      /^(end|else|elseif|until)\b/.test(codeOnly) ||
      /^[}\])]/.test(codeOnly);

    if (startsWithDedent) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formattedLines.push('  '.repeat(indentLevel) + trimmed);

    // Check if line increases indent for subsequent lines
    const startsWithElseOrElseif = /^(else|elseif)\b/.test(codeOnly);
    const hasFunctionOpen = /\bfunction\b/.test(codeOnly) && !/\bend\b/.test(codeOnly);
    const hasThenOpen = /\bthen\b/.test(codeOnly) && !/\bend\b/.test(codeOnly);
    const hasDoOpen = /\bdo\b/.test(codeOnly) && !/\bend\b/.test(codeOnly);
    const hasRepeatOpen = /^repeat\b/.test(codeOnly) && !/\buntil\b/.test(codeOnly);
    const openBraces = (codeOnly.match(/\{/g) || []).length;
    const closeBraces = (codeOnly.match(/\}/g) || []).length;

    if (startsWithElseOrElseif) {
      if (!/\bend\b/.test(codeOnly)) {
        indentLevel += 1;
      }
    } else if (hasFunctionOpen || hasThenOpen || hasDoOpen || hasRepeatOpen) {
      indentLevel += 1;
    }

    if (openBraces > closeBraces) {
      indentLevel += openBraces - closeBraces;
    }
  }

  return formattedLines.join('\n');
}

function stripLuaComments(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => {
      // Preserve strings while removing -- comments
      let inSingle = false;
      let inDouble = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        const prev = i > 0 ? line[i - 1] : '';
        if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
        else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
        else if (ch === '-' && line[i + 1] === '-' && !inSingle && !inDouble) {
          return line.slice(0, i).trimEnd();
        }
      }
      return line;
    })
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n');
}

export const LuaEditor: React.FC<LuaEditorProps> = ({
  initialContent,
  fileName,
  onClose,
  onSave,
  workspaceFiles = [],
  onSelectWorkspaceLua,
  planets = []
}) => {
  const lang = useLanguage();
  const [content, setContent] = useState(initialContent);
  const [editableFileName, setEditableFileName] = useState(fileName || 'Script.lua');
  const [copied, setCopied] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);

  // Left Sidebar Tabs
  const [leftTab, setLeftTab] = useState<'outline' | 'commands' | 'templates'>('outline');
  const [outlineFilter, setOutlineFilter] = useState('');
  const [commandSearch, setCommandSearch] = useState('');
  const [commandCategory, setCommandCategory] = useState<CommandCategory>('all');
  const [templateSearch, setTemplateSearch] = useState('');

  // Right Sidebar Inspector / Diagnostics
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightTab, setRightTab] = useState<'inspector' | 'diagnostics'>('inspector');

  // Find & Replace Bar
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findRegex, setFindRegex] = useState(false);
  const [goToLineInput, setGoToLineInput] = useState('');

  // Active Line & Help Modal
  const [activeLine, setActiveLine] = useState<number>(1);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Quick Generator state in Right Inspector
  const [newGeneratorName, setNewGeneratorName] = useState('State_Tactical_Phase');
  const [newGeneratorType, setNewGeneratorType] = useState<'state' | 'thread' | 'function'>('state');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(initialContent);
    setEditableFileName(fileName || 'Script.lua');
    setHistory([initialContent]);
    setHistoryIndex(0);
  }, [initialContent, fileName]);

  const updateContent = useCallback((nextContent: string) => {
    setContent(nextContent);
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (sliced[sliced.length - 1] === nextContent) return sliced;
      const updated = [...sliced, nextContent].slice(-50);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
    }
  }, [history, historyIndex]);

  // Workspace .lua files
  const workspaceLuaFiles = useMemo(() => {
    return workspaceFiles
      .filter(f => f.name.toLowerCase().endsWith('.lua'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [workspaceFiles]);

  // Scroll editor to specific line
  const scrollToLine = useCallback((lineNumber: number) => {
    const clamped = Math.max(1, lineNumber);
    setActiveLine(clamped);
    const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const lines = content.split('\n');
    let charOffset = 0;
    for (let i = 0; i < Math.min(clamped - 1, lines.length); i++) {
      charOffset += lines[i].length + 1;
    }
    const lineLength = lines[clamped - 1]?.length || 0;

    textarea.focus();
    textarea.setSelectionRange(charOffset, charOffset + lineLength);
    const targetScrollTop = Math.max(0, (clamped - 5) * 20);
    textarea.scrollTop = targetScrollTop;
  }, [content]);

  // Insert code at cursor
  const insertAtCursor = useCallback((snippet: string) => {
    const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = content.substring(0, start) + snippet + content.substring(end);
      updateContent(next);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
      }, 0);
    } else {
      updateContent(content + '\n' + snippet);
    }
  }, [content, updateContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindBar(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave(content, editableFileName);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeEl = document.activeElement;
        if (activeEl?.id !== 'code-editor-textarea') {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        const activeEl = document.activeElement;
        if (activeEl?.id !== 'code-editor-textarea') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, editableFileName, onSave, handleUndo, handleRedo]);

  // Parse Lua AST, Extract Symbols & Compute Alamo Diagnostics
  const analysis = useMemo(() => {
    const symbols: LuaSymbolItem[] = [];
    const diagnostics: LuaDiagnostic[] = [];
    const requiredModules = new Set<string>();
    const storyEvents = new Set<string>();
    const referencedObjects = new Set<string>();
    const referencedPlanets = new Set<string>();
    const definedFunctions = new Set<string>();
    let syntaxError: { line: number; col: number; message: string } | null = null;

    const lines = content.split('\n');

    // 1. Scan regex patterns for requires, states, threads, Story_Event, FindPlanet, Find_First_Object
    lines.forEach((rawLine, idx) => {
      const lineNum = idx + 1;
      const cleanLine = rawLine.replace(/--.*$/, '');

      // require("...")
      const reqMatch = cleanLine.match(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/);
      if (reqMatch) {
        requiredModules.add(reqMatch[1]);
      }

      // Define_State("State_Name", Handler)
      const stateMatch = cleanLine.match(/\bDefine_State\s*\(\s*["']([^"']+)["']\s*,\s*([A-Za-z0-9_]+)/);
      if (stateMatch) {
        symbols.push({
          id: `state-${lineNum}-${stateMatch[1]}`,
          name: stateMatch[1],
          kind: 'state',
          detail: `Handler: ${stateMatch[2]}`,
          line: lineNum,
          endLine: lineNum
        });
      }

      // Create_Thread("Thread_Func", ...)
      const threadMatch = cleanLine.match(/\bCreate_Thread\s*\(\s*["']([^"']+)["']/);
      if (threadMatch) {
        symbols.push({
          id: `thread-${lineNum}-${threadMatch[1]}`,
          name: threadMatch[1],
          kind: 'thread',
          detail: 'Hilo / Corrutina',
          line: lineNum,
          endLine: lineNum
        });
      }

      // Story_Event("...") or Check_Story_Flag("...")
      const storyMatch = cleanLine.match(/\b(?:Story_Event|Check_Story_Flag)\s*\(\s*["']([^"']+)["']/);
      if (storyMatch) {
        storyEvents.add(storyMatch[1]);
      }

      // FindPlanet("...")
      const planetMatch = cleanLine.match(/\bFindPlanet\s*\(\s*["']([^"']+)["']/);
      if (planetMatch) {
        referencedPlanets.add(planetMatch[1]);
      }

      // Find_First_Object / Find_Object_Type / Find_All_Objects_Of_Type
      const objMatch = cleanLine.match(/\b(?:Find_First_Object|Find_Object_Type|Find_All_Objects_Of_Type)\s*\(\s*["']([^"']+)["']/);
      if (objMatch) {
        referencedObjects.add(objMatch[1]);
      }
    });

    // 2. Try luaparse AST parsing
    try {
      const ast = luaparse.parse(content, { locations: true, comments: false }) as any;
      const body = ast?.body || [];

      for (const node of body) {
        if (node.type === 'FunctionDeclaration') {
          const fnName = node.identifier?.name || node.identifier?.identifier?.name || 'anónima';
          const params = (node.parameters || [])
            .map((p: any) => p.name || (p.type === 'VarargLiteral' ? '...' : ''))
            .join(', ');
          const startLine = node.loc?.start?.line || 1;
          const endLine = node.loc?.end?.line || startLine;
          definedFunctions.add(fnName);
          symbols.push({
            id: `fn-${startLine}-${fnName}`,
            name: fnName,
            kind: 'function',
            params: `(${params})`,
            line: startLine,
            endLine,
            isEntryPoint: ['Definitions', 'main', 'Main', 'MainForce_Thread'].includes(fnName)
          });
        } else if (node.type === 'LocalStatement' || node.type === 'AssignmentStatement') {
          const vars = node.variables || [];
          const startLine = node.loc?.start?.line || 1;
          const endLine = node.loc?.end?.line || startLine;
          for (const v of vars) {
            if (v.type === 'Identifier' && v.name) {
              symbols.push({
                id: `var-${startLine}-${v.name}`,
                name: v.name,
                kind: 'variable',
                detail: node.type === 'LocalStatement' ? 'local' : 'global',
                line: startLine,
                endLine
              });
            }
          }
        }
      }
    } catch (err: any) {
      const errLine = err.line || 1;
      const errCol = err.column || 1;
      const cleanMsg = (err.message || 'Error de sintaxis Lua').replace(/^\[\d+:\d+\]\s*/, '');
      syntaxError = { line: errLine, col: errCol, message: cleanMsg };
      diagnostics.push({
        id: 'syntax-error',
        severity: 'error',
        title: `Error de Sintaxis Lua (Línea ${errLine}, Col ${errCol})`,
        message: cleanMsg,
        line: errLine
      });

      // Fallback regex function extractor so Outline never goes empty during editing
      lines.forEach((rawLine, idx) => {
        const fnMatch = rawLine.match(/^\s*(?:local\s+)?function\s+([A-Za-z0-9_.:]+)\s*\(([^)]*)\)/);
        if (fnMatch) {
          definedFunctions.add(fnMatch[1]);
          symbols.push({
            id: `fn-fallback-${idx + 1}-${fnMatch[1]}`,
            name: fnMatch[1],
            kind: 'function',
            params: `(${fnMatch[2].trim()})`,
            line: idx + 1,
            endLine: idx + 1,
            isEntryPoint: ['Definitions', 'main', 'Main', 'MainForce_Thread'].includes(fnMatch[1])
          });
        }
      });
    }

    // 3. Alamo Engine Semantic Diagnostics
    const cleanCode = content.replace(/--.*$/gm, '');

    // Check PGStateMachine require
    const usesStateMachine = /\b(Define_State|Set_Next_State|OnEnter|OnUpdate|OnExit)\b/.test(cleanCode);
    if (usesStateMachine && !requiredModules.has('PGStateMachine')) {
      diagnostics.push({
        id: 'missing-pgstatemachine',
        severity: 'warning',
        title: 'Falta require("PGStateMachine")',
        message: 'El script utiliza funciones de máquina de estados (Define_State / Set_Next_State / OnEnter) pero no importa "PGStateMachine".',
        line: 1,
        fixType: 'add-require',
        fixPayload: 'PGStateMachine'
      });
    }

    // Check PGStoryMode require
    const usesStoryMode = /\b(Story_Mode_Service|StoryModeEvents)\b/.test(cleanCode);
    if (usesStoryMode && !requiredModules.has('PGStoryMode')) {
      diagnostics.push({
        id: 'missing-pgstorymode',
        severity: 'warning',
        title: 'Falta require("PGStoryMode")',
        message: 'Se detectó StoryModeEvents o Story_Mode_Service sin importar el módulo "PGStoryMode".',
        line: 1,
        fixType: 'add-require',
        fixPayload: 'PGStoryMode'
      });
    }

    // Check PGSpawnUnits require
    const usesSpawnUnits = /\b(SpawnList|ReinforceList)\b/.test(cleanCode);
    if (usesSpawnUnits && !requiredModules.has('PGSpawnUnits')) {
      diagnostics.push({
        id: 'missing-pgspawnunits',
        severity: 'warning',
        title: 'Falta require("PGSpawnUnits")',
        message: 'El script llama a SpawnList() o ReinforceList() pero no incluye require("PGSpawnUnits").',
        line: 1,
        fixType: 'add-require',
        fixPayload: 'PGSpawnUnits'
      });
    }

    // Check Create_Thread target functions
    symbols.filter(s => s.kind === 'thread').forEach(threadSym => {
      if (!definedFunctions.has(threadSym.name)) {
        diagnostics.push({
          id: `missing-thread-fn-${threadSym.line}-${threadSym.name}`,
          severity: 'warning',
          title: `Hilo sin función: "${threadSym.name}"`,
          message: `Create_Thread("${threadSym.name}") invoca una función que no está declarada en este archivo.`,
          line: threadSym.line,
          fixType: 'create-function',
          fixPayload: threadSym.name
        });
      }
    });

    // Check Define_State target functions
    lines.forEach((rawLine, idx) => {
      const cleanLine = rawLine.replace(/--.*$/, '');
      const stateMatch = cleanLine.match(/\bDefine_State\s*\(\s*["']([^"']+)["']\s*,\s*([A-Za-z0-9_]+)/);
      if (stateMatch) {
        const handlerName = stateMatch[2];
        if (!definedFunctions.has(handlerName)) {
          diagnostics.push({
            id: `missing-state-fn-${idx + 1}-${handlerName}`,
            severity: 'warning',
            title: `Estado sin función manejadora: "${handlerName}"`,
            message: `Define_State registra el manejador ${handlerName}, pero function ${handlerName}(message) no existe.`,
            line: idx + 1,
            fixType: 'create-state',
            fixPayload: handlerName
          });
        }
      }
    });

    // Check Lua 5.1 '#' length operator incompatibility in Empire at War (Lua 5.0)
    lines.forEach((rawLine, idx) => {
      const cleanLine = rawLine.replace(/--.*$/, '').replace(/"([^"\\]|\\.)*"/g, '""').replace(/'([^'\\]|\\.)*'/g, "''");
      const hashMatch = cleanLine.match(/(?:^|[^\w])#([A-Za-z_][A-Za-z0-9_]*)/);
      if (hashMatch) {
        diagnostics.push({
          id: `lua50-hash-${idx + 1}`,
          severity: 'error',
          title: `Operador '#' incompatible con Lua 5.0 (Línea ${idx + 1})`,
          message: `Empire at War utiliza Lua 5.0. El operador de longitud '#${hashMatch[1]}' pertenece a Lua 5.1+. Usa table.getn(${hashMatch[1]}) en su lugar.`,
          line: idx + 1
        });
      }
    });

    // Check while true do loops without Sleep / BlockOnCommand / PumpEvents
    const whileTrueRegex = /\bwhile\s+true\s+do\b([\s\S]*?)\bend\b/g;
    let match: RegExpExecArray | null;
    while ((match = whileTrueRegex.exec(cleanCode)) !== null) {
      const loopBody = match[1];
      if (!/\b(Sleep|PumpEvents|BlockOnCommand|Wait)\b/.test(loopBody)) {
        const upToMatch = cleanCode.slice(0, match.index);
        const loopLine = upToMatch.split('\n').length;
        diagnostics.push({
          id: `infinite-loop-${loopLine}`,
          severity: 'error',
          title: `Bucle 'while true' sin Sleep() (Línea ${loopLine})`,
          message: 'Un bucle infinito sin Sleep() o BlockOnCommand() congelará por completo el hilo principal de Empire at War.',
          line: loopLine
        });
      }
    }

    // Check referenced planets against loaded planets list (if loaded)
    if (planets.length > 0) {
      const loadedPlanetNames = new Set(planets.map(p => p.name.toLowerCase()));
      referencedPlanets.forEach(pName => {
        if (!loadedPlanetNames.has(pName.toLowerCase())) {
          const lineIdx = lines.findIndex(l => l.includes(`"${pName}"`) || l.includes(`'${pName}'`));
          diagnostics.push({
            id: `unknown-planet-${pName}`,
            severity: 'info',
            title: `Planeta "${pName}" no hallado en Planets.xml actual`,
            message: `FindPlanet("${pName}") hace referencia a un sistema que no figura en el Planets.xml cargado actualmente.`,
            line: lineIdx >= 0 ? lineIdx + 1 : 1
          });
        }
      });
    }

    // Determine script classification
    let scriptType = 'Script Lua Genérico';
    if (requiredModules.has('PGStoryMode') || /\bStoryModeEvents\b/.test(cleanCode) || storyEvents.size > 0) {
      scriptType = 'Story Mode / Campaña';
    } else if (/\bTaskForce\b/.test(cleanCode) || /\bFreeStore\b/.test(cleanCode) || /\bEvaluatePerception\b/.test(cleanCode)) {
      scriptType = 'Plan IA / FreeStore';
    } else if (/\bObject\b/.test(cleanCode) && /\b(Activate_Ability|Event_Object_In_Range|Get_Shield)\b/.test(cleanCode)) {
      scriptType = 'GameObject / Unidad';
    } else if (requiredModules.has('PGStateMachine')) {
      scriptType = 'Misión Táctica / Estado';
    }

    return {
      symbols,
      diagnostics,
      requiredModules: Array.from(requiredModules),
      storyEvents: Array.from(storyEvents),
      referencedObjects: Array.from(referencedObjects),
      referencedPlanets: Array.from(referencedPlanets),
      syntaxError,
      scriptType,
      lineCount: lines.length
    };
  }, [content, planets]);

  // Filtered Outline Symbols
  const filteredSymbols = useMemo(() => {
    const q = outlineFilter.trim().toLowerCase();
    if (!q) return analysis.symbols;
    return analysis.symbols.filter(
      s => s.name.toLowerCase().includes(q) || (s.detail && s.detail.toLowerCase().includes(q))
    );
  }, [analysis.symbols, outlineFilter]);

  // All Combined & Deduplicated Commands with Category Filtering
  const allCommands = useMemo(() => {
    const seen = new Set<string>();
    const combined: { name: string; desc: string; category: CommandCategory }[] = [];

    for (const cmd of [...CORE_ALAMO_COMMANDS, ...LUA_COMMANDS]) {
      if (!cmd.name || cmd.name === '-' || seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      combined.push({
        name: cmd.name,
        desc: cmd.desc === 'No description' ? 'Función nativa del motor Petroglyph Alamo.' : cmd.desc,
        category: categorizeLuaCommand(cmd.name, cmd.desc)
      });
    }
    return combined;
  }, []);

  const filteredCommands = useMemo(() => {
    const q = commandSearch.trim().toLowerCase();
    return allCommands.filter(cmd => {
      if (commandCategory !== 'all' && cmd.category !== commandCategory) return false;
      if (!q) return true;
      return cmd.name.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q);
    });
  }, [allCommands, commandSearch, commandCategory]);

  // Filtered Templates & Snippets
  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return EAW_LUA_TEMPLATES;
    return EAW_LUA_TEMPLATES.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templateSearch]);

  const filteredSnippets = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return EXTRA_SNIPPETS;
    return EXTRA_SNIPPETS.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [templateSearch]);

  // Find & Replace Matches
  const findMatchesCount = useMemo(() => {
    if (!findQuery) return 0;
    try {
      const flags = findCaseSensitive ? 'g' : 'gi';
      const pattern = findRegex ? findQuery : findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(pattern, flags);
      return (content.match(regex) || []).length;
    } catch {
      return 0;
    }
  }, [content, findQuery, findCaseSensitive, findRegex]);

  const handleFindNext = () => {
    if (!findQuery) return;
    const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    try {
      const flags = findCaseSensitive ? 'g' : 'gi';
      const pattern = findRegex ? findQuery : findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(pattern, flags);
      const startPos = textarea.selectionEnd || 0;
      regex.lastIndex = startPos;

      let match = regex.exec(content);
      if (!match) {
        regex.lastIndex = 0;
        match = regex.exec(content);
      }

      if (match && match.index !== undefined) {
        textarea.focus();
        textarea.setSelectionRange(match.index, match.index + match[0].length);
        const lineNum = content.slice(0, match.index).split('\n').length;
        setActiveLine(lineNum);
        textarea.scrollTop = Math.max(0, (lineNum - 5) * 20);
      }
    } catch {
      // Ignore invalid regex
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    try {
      const flags = findCaseSensitive ? 'g' : 'gi';
      const pattern = findRegex ? findQuery : findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(pattern, flags);
      const next = content.replace(regex, replaceQuery);
      updateContent(next);
    } catch {
      // Ignore invalid regex
    }
  };

  // Toggle Petroglyph require("...") module at top of file
  const handleToggleRequire = (modName: string) => {
    const reqRegex = new RegExp(`^\\s*require\\s*\\(\\s*["']${modName}["']\\s*\\)\\s*\\n?`, 'm');
    if (reqRegex.test(content)) {
      updateContent(content.replace(reqRegex, ''));
    } else {
      updateContent(`require("${modName}")\n` + content);
    }
  };

  // Auto-Fix Diagnostic Handler
  const handleApplyFix = (diag: LuaDiagnostic) => {
    if (diag.fixType === 'add-require' && diag.fixPayload) {
      handleToggleRequire(diag.fixPayload);
    } else if (diag.fixType === 'create-function' && diag.fixPayload) {
      const fnCode = `\nfunction ${diag.fixPayload}()\n  -- Hilo / función generada automáticamente\n  Sleep(1.0)\nend\n`;
      updateContent(content.trimEnd() + '\n' + fnCode);
    } else if (diag.fixType === 'create-state' && diag.fixPayload) {
      const stateCode = `\nfunction ${diag.fixPayload}(message)\n  if message == OnEnter then\n    -- Entrada al estado ${diag.fixPayload}\n  elseif message == OnUpdate then\n    -- Actualización periódica\n  elseif message == OnExit then\n    -- Salida del estado\n  end\nend\n`;
      updateContent(content.trimEnd() + '\n' + stateCode);
    }
  };

  // Quick Generator in Right Inspector
  const handleGenerateConstruct = () => {
    const cleanName = newGeneratorName.trim().replace(/[^A-Za-z0-9_]/g, '_') || 'Custom_Handler';
    if (newGeneratorType === 'state') {
      let next = content;
      if (!/require\s*\(\s*["']PGStateMachine["']\s*\)/.test(next)) {
        next = `require("PGStateMachine")\n` + next;
      }
      // Inject Define_State inside Definitions() if present
      if (/function\s+Definitions\s*\(\s*\)/.test(next)) {
        next = next.replace(
          /(function\s+Definitions\s*\(\s*\))/,
          `$1\n  Define_State("${cleanName}", ${cleanName})`
        );
      } else {
        next =
          `function Definitions()\n  ServiceRate = 1\n  Define_State("${cleanName}", ${cleanName})\nend\n\n` +
          next;
      }
      const handlerBlock = `\nfunction ${cleanName}(message)\n  if message == OnEnter then\n    DebugMessage("Entrando en estado: ${cleanName}")\n  elseif message == OnUpdate then\n    -- Lógica de ciclo en ${cleanName}\n  elseif message == OnExit then\n    -- Limpieza al salir de ${cleanName}\n  end\nend\n`;
      updateContent(next.trimEnd() + '\n' + handlerBlock);
    } else if (newGeneratorType === 'thread') {
      const threadBlock = `\n-- Para iniciar este hilo usa: Create_Thread("${cleanName}")\nfunction ${cleanName}()\n  while true do\n    -- Lógica asíncrona del hilo\n    Sleep(1.0)\n  end\nend\n`;
      updateContent(content.trimEnd() + '\n' + threadBlock);
    } else {
      const fnBlock = `\nfunction ${cleanName}(param)\n  if TestValid(param) then\n    -- Lógica de la función ${cleanName}\n  end\nend\n`;
      updateContent(content.trimEnd() + '\n' + fnBlock);
    }
  };

  // Delete symbol block from Outline
  const handleDeleteSymbol = (sym: LuaSymbolItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const lines = content.split('\n');
    if (sym.line >= 1 && sym.endLine >= sym.line && sym.endLine <= lines.length) {
      lines.splice(sym.line - 1, sym.endLine - sym.line + 1);
      updateContent(lines.join('\n'));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (typeof text === 'string') {
        updateContent(text);
        setEditableFileName(file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFormatLua = () => {
    updateContent(formatLuaCode(content));
  };

  const handleStripComments = () => {
    updateContent(stripLuaComments(content));
  };

  const errorCount = analysis.diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = analysis.diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 select-none overflow-hidden">
      {/* Unified CORVUS Tactical HUD Header (v2.1) */}
      <div className="flex flex-wrap items-center justify-between min-h-[3.5rem] px-4 py-2 bg-slate-900/90 border-b border-yellow-900/50 gap-3 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-yellow-500/15 border border-yellow-500/40 rounded-sm flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${analysis.syntaxError ? 'bg-red-500' : 'bg-emerald-400'} animate-pulse`} />
                <span>{tr(lang, 'RAW LUA 5.0 IDE', 'IDE LUA 5.0 CRUDO', 'IDE LUA 5.0 BRUT')}</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-yellow-950/90 text-yellow-300 border border-yellow-700/50 rounded">
                v2.1
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-slate-950 text-slate-300 border border-slate-800 rounded">
                {analysis.scriptType}
              </span>
              <input
                type="text"
                value={editableFileName}
                onChange={e => setEditableFileName(e.target.value)}
                className="bg-slate-950/90 border border-slate-800 focus:border-yellow-500/70 rounded px-2 py-0.5 text-[11px] font-bold text-slate-200 focus:outline-none w-44 font-mono"
                title={tr(lang, 'Lua script file name', 'Nombre del archivo .lua', 'Nom du fichier .lua')}
              />

              {/* AST / Syntax Status Badge */}
              {analysis.syntaxError ? (
                <button
                  onClick={() => scrollToLine(analysis.syntaxError!.line)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 transition-colors cursor-pointer"
                  title={analysis.syntaxError.message}
                >
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span>{tr(lang, 'Error Line', 'Error Línea', 'Erreur Ligne')} {analysis.syntaxError.line}</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{tr(lang, 'Valid Lua 5.0', 'Lua 5.0 Válido', 'Lua 5.0 Valide')}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 font-mono">
              <span>{analysis.lineCount} {tr(lang, 'lines', 'líneas', 'lignes')}</span>
              <span>•</span>
              <span>{analysis.symbols.filter(s => s.kind === 'function').length} {tr(lang, 'functions', 'funciones', 'fonctions')}</span>
              <span>•</span>
              <span>{analysis.symbols.filter(s => s.kind === 'state').length} {tr(lang, 'states', 'estados', 'états')}</span>
              <span>•</span>
              <span>{tr(lang, 'Active Line:', 'Línea activa:', 'Ligne active :')} {activeLine}</span>
            </div>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Workspace .lua Switcher */}
          {workspaceLuaFiles.length > 0 && onSelectWorkspaceLua && (
            <div className="relative flex items-center bg-slate-950 border border-yellow-900/50 rounded-sm px-2 py-1 mr-1">
              <FolderOpen className="w-3.5 h-3.5 text-yellow-400 mr-1.5 shrink-0" />
              <select
                value=""
                onChange={e => {
                  if (e.target.value) onSelectWorkspaceLua(e.target.value);
                }}
                className="bg-transparent text-[10px] font-mono text-yellow-300 focus:outline-none max-w-[160px] truncate cursor-pointer"
                title={tr(lang, 'Load .lua script from Workspace', 'Cargar script .lua del Workspace', 'Charger un script .lua du Workspace')}
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  {tr(lang, `Mod Scripts (${workspaceLuaFiles.length})...`, `Scripts del Mod (${workspaceLuaFiles.length})...`, `Scripts du Mod (${workspaceLuaFiles.length})...`)}
                </option>
                {workspaceLuaFiles.map(file => (
                  <option
                    key={file.webkitRelativePath || file.name}
                    value={file.webkitRelativePath || file.name}
                    className="bg-slate-900 text-slate-200"
                  >
                    {file.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".lua"
            onChange={handleUploadFile}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-sm border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Import .LUA file from disk', 'Importar archivo .LUA desde disco', 'Importer un fichier .LUA du disque')}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-sm border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Undo (Ctrl+Z)', 'Deshacer (Ctrl+Z)', 'Annuler (Ctrl+Z)')}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-sm border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Redo (Ctrl+Y)', 'Rehacer (Ctrl+Y)', 'Rétablir (Ctrl+Y)')}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowFindBar(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              showFindBar
                ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title={tr(lang, 'Find & Replace (Ctrl+F)', 'Buscar y Reemplazar (Ctrl+F)', 'Rechercher et Remplacer (Ctrl+F)')}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{tr(lang, 'Find', 'Buscar', 'Chercher')}</span>
          </button>

          <button
            onClick={handleFormatLua}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-300 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Auto-indent Lua blocks', 'Auto-indentar bloques Lua', 'Auto-indenter les blocs Lua')}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{tr(lang, 'Format', 'Formatear', 'Formater')}</span>
          </button>

          <button
            onClick={handleStripComments}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Strip Lua comments (--)', 'Eliminar comentarios (--)', 'Supprimer les commentaires (--)')}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{tr(lang, 'Strip --', 'Limpiar --', 'Nettoyer --')}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Copy entire script', 'Copiar todo el script', 'Copier tout le script')}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{copied ? tr(lang, 'Copied', 'Copiado', 'Copié') : tr(lang, 'Copy', 'Copiar', 'Copier')}</span>
          </button>

          <button
            onClick={() => updateContent(initialContent)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-sm border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Reset to initial content', 'Restaurar contenido inicial', 'Restaurer le contenu initial')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowRightPanel(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              showRightPanel
                ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title={tr(lang, 'Toggle Alamo Lua Inspector & Diagnostics', 'Mostrar/Ocultar Inspector y Diagnósticos Alamo Lua', 'Afficher/Masquer l\'Inspecteur et Diagnostics Alamo Lua')}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{tr(lang, 'Inspector', 'Inspector', 'Inspecteur')}</span>
            {(errorCount > 0 || warningCount > 0) && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  errorCount > 0 ? 'bg-red-500/30 text-red-200' : 'bg-amber-500/30 text-amber-200'
                }`}
              >
                {errorCount + warningCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-300 rounded-sm border border-slate-700/80 transition-colors cursor-pointer"
            title={tr(lang, 'Alamo Lua 5.0 Scripting Manual', 'Manual de Scripting Alamo Lua 5.0', 'Manuel de Scripting Alamo Lua 5.0')}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSave(content, editableFileName)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(234,179,8,0.2)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Save .LUA', 'Guardar .LUA', 'Enregistrer .LUA')}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-sm transition-colors cursor-pointer"
            title={tr(lang, 'Close Editor', 'Cerrar Editor', 'Fermer l\'Éditeur')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Find & Replace Bar */}
      {showFindBar && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#131C2E] border-b border-slate-800 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
              <input
                type="text"
                value={findQuery}
                onChange={e => setFindQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFindNext()}
                placeholder="Buscar en script..."
                className="bg-slate-900 border border-slate-700 rounded pl-8 pr-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>
            <input
              type="text"
              value={replaceQuery}
              onChange={e => setReplaceQuery(e.target.value)}
              placeholder="Reemplazar con..."
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-44"
            />
            <button
              onClick={() => setFindCaseSensitive(v => !v)}
              className={`px-2 py-1 rounded border font-mono text-[11px] ${
                findCaseSensitive
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="Distinguir Mayúsculas/Minúsculas"
            >
              Aa
            </button>
            <button
              onClick={() => setFindRegex(v => !v)}
              className={`px-2 py-1 rounded border font-mono text-[11px] ${
                findRegex
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="Expresión Regular (Regex)"
            >
              .*
            </button>
            <button
              onClick={handleFindNext}
              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 rounded font-medium transition-colors"
            >
              Siguiente
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              Reemplazar Todo
            </button>
            <span className="text-slate-400 font-mono ml-1">
              {findQuery ? `${findMatchesCount} coincidencias` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ir a línea:</span>
            <input
              type="number"
              min={1}
              max={analysis.lineCount}
              value={goToLineInput}
              onChange={e => setGoToLineInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && goToLineInput) {
                  scrollToLine(parseInt(goToLineInput, 10));
                }
              }}
              placeholder="Nº"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-16 font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                if (goToLineInput) scrollToLine(parseInt(goToLineInput, 10));
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
            >
              Ir
            </button>
            <button
              onClick={() => setShowFindBar(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Column IDE Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR: AST Outline, Categorized Commands, Templates */}
        <div className="w-80 bg-[#0F1624] border-r border-slate-800/80 flex flex-col shrink-0">
          {/* Left Tab Switcher */}
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
            <button
              onClick={() => setLeftTab('outline')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                leftTab === 'outline'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AST ({analysis.symbols.length})</span>
            </button>
            <button
              onClick={() => setLeftTab('commands')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                leftTab === 'commands'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>API EaW</span>
            </button>
            <button
              onClick={() => setLeftTab('templates')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                leftTab === 'templates'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plantillas</span>
            </button>
          </div>

          {/* TAB 1: AST SYMBOL OUTLINE */}
          {leftTab === 'outline' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-3 border-b border-slate-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={outlineFilter}
                    onChange={e => setOutlineFilter(e.target.value)}
                    placeholder="Filtrar funciones, estados, hilos..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredSymbols.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500">
                    No se encontraron símbolos en el AST actual. Usa la pestaña Plantillas para cargar una estructura base.
                  </div>
                ) : (
                  filteredSymbols.map(sym => {
                    const isSelected = activeLine >= sym.line && activeLine <= sym.endLine;
                    return (
                      <div
                        key={sym.id}
                        onClick={() => scrollToLine(sym.line)}
                        className={`group flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                            : 'bg-slate-900/40 hover:bg-slate-800/70 border-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded ${
                                sym.kind === 'function'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : sym.kind === 'state'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : sym.kind === 'thread'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-700/60 text-slate-300'
                              }`}
                            >
                              {sym.kind === 'function'
                                ? 'fn'
                                : sym.kind === 'state'
                                ? 'state'
                                : sym.kind === 'thread'
                                ? 'thread'
                                : 'var'}
                            </span>
                            <span className="font-mono text-xs font-semibold truncate text-slate-100">
                              {sym.name}
                            </span>
                            {sym.params && (
                              <span className="font-mono text-[11px] text-slate-400 truncate">
                                {sym.params}
                              </span>
                            )}
                            {sym.isEntryPoint && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                                Entry
                              </span>
                            )}
                          </div>
                          {sym.detail && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                              {sym.detail}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-mono text-slate-500">
                            L{sym.line}
                          </span>
                          {sym.kind === 'function' && (
                            <button
                              onClick={e => handleDeleteSymbol(sym, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-opacity"
                              title="Eliminar bloque de función"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EAW LUA API COMMANDS */}
          {leftTab === 'commands' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-3 border-b border-slate-800/80 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={commandSearch}
                    onChange={e => setCommandSearch(e.target.value)}
                    placeholder="Buscar función (ej. SpawnList, Camera)..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'states', label: 'Estados/Hilos' },
                    { id: 'units', label: 'Unidades' },
                    { id: 'galaxy', label: 'Galaxia' },
                    { id: 'story', label: 'Story/UI' },
                    { id: 'camera', label: 'Cámara/SFX' },
                    { id: 'ai', label: 'IA/FreeStore' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCommandCategory(cat.id as CommandCategory)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        commandCategory === cat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredCommands.slice(0, 150).map((cmd, idx) => (
                  <div
                    key={`${cmd.name}-${idx}`}
                    onClick={() => {
                      const snippet = cmd.name.startsWith('.')
                        ? `${cmd.name}()`
                        : `${cmd.name}()`;
                      insertAtCursor(snippet);
                    }}
                    className="p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300 truncate">
                        {cmd.name}
                      </span>
                      <span className="text-[10px] text-slate-500 group-hover:text-indigo-300 shrink-0">
                        + Insertar
                      </span>
                    </div>
                    <p
                      className="text-[11px] text-slate-400 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: cmd.desc }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATES & SNIPPETS */}
          {leftTab === 'templates' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-3 border-b border-slate-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    placeholder="Buscar plantilla o snippet..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold px-1 mb-2">
                    Plantillas Completas de Script EaW
                  </h4>
                  <div className="space-y-2">
                    {filteredTemplates.map(tpl => (
                      <div
                        key={tpl.id}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{tpl.name}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
                          {tpl.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateContent(tpl.code)}
                            className="flex-1 py-1 px-2 bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 rounded text-[11px] font-medium transition-colors"
                          >
                            Reemplazar Script
                          </button>
                          <button
                            onClick={() => insertAtCursor('\n' + tpl.code)}
                            className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                          >
                            Insertar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-1 mb-2">
                    Snippets Rápidos ({filteredSnippets.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredSnippets.map((snip, idx) => (
                      <div
                        key={idx}
                        onClick={() => insertAtCursor('\n' + snip.code + '\n')}
                        className="p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-emerald-400 group-hover:text-emerald-300">
                            {snip.name}
                          </span>
                          <Code2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">{snip.description}</p>
                        <pre className="text-[10px] font-mono text-slate-300 bg-slate-950/90 p-2 rounded border border-slate-800/80 overflow-x-auto">
                          {snip.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: CODE EDITOR WITH LINE NUMBERS */}
        <div
          className="flex-1 flex flex-col min-w-0 bg-[#0B101B] relative"
          onClick={() => {
            const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
            if (textarea) {
              const cursor = textarea.selectionStart || 0;
              const line = content.slice(0, cursor).split('\n').length;
              setActiveLine(line);
            }
          }}
          onKeyUp={() => {
            const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
            if (textarea) {
              const cursor = textarea.selectionStart || 0;
              const line = content.slice(0, cursor).split('\n').length;
              setActiveLine(line);
            }
          }}
        >
          <CodeEditorWithLines
            value={content}
            onValueChange={updateContent}
            highlight={code => Prism.highlight(code, Prism.languages.lua, 'lua')}
            errorLine={analysis.syntaxError?.line ?? null}
          />
        </div>

        {/* RIGHT SIDEBAR: SCRIPT INSPECTOR & ALAMO LUA DIAGNOSTICS */}
        {showRightPanel && (
          <div className="w-80 bg-[#0F1624] border-l border-slate-800/80 flex flex-col shrink-0">
            <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
              <button
                onClick={() => setRightTab('inspector')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  rightTab === 'inspector'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Inspector Lua</span>
              </button>
              <button
                onClick={() => setRightTab('diagnostics')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
                  rightTab === 'diagnostics'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Auditoría ({analysis.diagnostics.length})</span>
              </button>
            </div>

            {rightTab === 'inspector' ? (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
                {/* 1. Petroglyph Modules Manager */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                      Módulos Petroglyph (require)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {analysis.requiredModules.length} activos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Activa o desactiva las librerías base de Empire at War al principio del script:
                  </p>
                  <div className="space-y-1.5">
                    {PG_MODULES.map(mod => {
                      const isIncluded = analysis.requiredModules.includes(mod.name);
                      return (
                        <button
                          key={mod.name}
                          onClick={() => handleToggleRequire(mod.name)}
                          className={`w-full text-left p-2 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                            isIncluded
                              ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200'
                              : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                              <span>{mod.name}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {mod.desc}
                            </p>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-mono rounded shrink-0 ${
                              isIncluded
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isIncluded ? 'ACTIVO' : '+ AÑADIR'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Quick State / Thread / Function Generator */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                      Generador de Estados e Hilos
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {[
                      { id: 'state', label: 'Estado' },
                      { id: 'thread', label: 'Hilo' },
                      { id: 'function', label: 'Función' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setNewGeneratorType(opt.id as any)}
                        className={`py-1 rounded text-[11px] font-medium transition-colors ${
                          newGeneratorType === opt.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Identificador Lua
                    </label>
                    <input
                      type="text"
                      value={newGeneratorName}
                      onChange={e => setNewGeneratorName(e.target.value)}
                      placeholder="Ej. State_Reinforcements"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleGenerateConstruct}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {newGeneratorType === 'state'
                        ? 'Inyectar Define_State + Handler'
                        : newGeneratorType === 'thread'
                        ? 'Generar Corrutina Create_Thread'
                        : 'Generar Función con TestValid'}
                    </span>
                  </button>
                </div>

                {/* 3. Detected Game References (Story Events, Planets, Objects) */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                      Referencias Vinculadas al Juego
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Story Events / Flags ({analysis.storyEvents.length})
                    </div>
                    {analysis.storyEvents.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">
                        Ningún Story_Event(...) detectado.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {analysis.storyEvents.map(ev => (
                          <span
                            key={ev}
                            className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                      Planetas Buscados ({analysis.referencedPlanets.length})
                    </div>
                    {analysis.referencedPlanets.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">
                        Ningún FindPlanet(...) detectado.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {analysis.referencedPlanets.map(pl => {
                          const existsInLoaded =
                            planets.length === 0 ||
                            planets.some(p => p.name.toLowerCase() === pl.toLowerCase());
                          return (
                            <span
                              key={pl}
                              className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                                existsInLoaded
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              }`}
                              title={
                                existsInLoaded
                                  ? 'Planeta verificado'
                                  : 'No encontrado en Planets.xml actual'
                              }
                            >
                              {pl}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                      GameObjects / Unidades ({analysis.referencedObjects.length})
                    </div>
                    {analysis.referencedObjects.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">
                        Ningún Find_First_Object(...) detectado.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {analysis.referencedObjects.map(obj => (
                          <span
                            key={obj}
                            className="px-2 py-0.5 text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: ALAMO LUA DIAGNOSTICS & AUTO-FIXES */
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {analysis.diagnostics.length === 0 ? (
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-xs font-bold text-emerald-300">
                      Auditoría Alamo Lua 5.0 Superada
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      No se detectaron errores sintácticos, bucles bloqueantes ni dependencias Petroglyph faltantes.
                    </p>
                  </div>
                ) : (
                  analysis.diagnostics.map(diag => (
                    <div
                      key={diag.id}
                      onClick={() => scrollToLine(diag.line)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        diag.severity === 'error'
                          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/60'
                          : diag.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
                          : 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            diag.severity === 'error'
                              ? 'text-red-300'
                              : diag.severity === 'warning'
                              ? 'text-amber-300'
                              : 'text-sky-300'
                          }`}
                        >
                          {diag.title}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-900/90 text-slate-300 rounded shrink-0">
                          L{diag.line}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                        {diag.message}
                      </p>
                      {diag.fixType && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleApplyFix(diag);
                          }}
                          className="w-full py-1 px-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 rounded text-[11px] font-semibold transition-colors"
                        >
                          ⚡ Auto-Reparar en el Script
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ALAMO LUA 5.0 ARCHITECTURE HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1624] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-yellow-300">
                  {tr(lang, 'Lua 5.0 Architecture Guide — Petroglyph Alamo Engine (v2.1)', 'Guía de Arquitectura Lua 5.0 — Motor Petroglyph Alamo (v2.1)', 'Guide d\'Architecture Lua 5.0 — Moteur Petroglyph Alamo (v2.1)')}
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <h4 className="font-bold text-indigo-300 mb-1">
                  1. Punto de Entrada: Definitions() y Máquina de Estados
                </h4>
                <p>
                  Todo script de Empire at War comienza ejecutando <code className="text-indigo-200 font-mono">Definitions()</code>. Allí se ajusta <code className="text-indigo-200 font-mono">ServiceRate</code> (frecuencia de actualización en segundos) y se registran los estados mediante <code className="text-indigo-200 font-mono">Define_State("State_Init", State_Init)</code> o la tabla <code className="text-indigo-200 font-mono">StoryModeEvents</code>.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <h4 className="font-bold text-emerald-300 mb-1">
                  2. Validación de Objetos: Usa siempre TestValid(obj)
                </h4>
                <p>
                  En combates tácticos o en el mapa galáctico, cualquier unidad puede morir entre dos frames. Nunca llames métodos como <code className="text-emerald-200 font-mono">unit.Move_To(...)</code> sin comprobar antes <code className="text-emerald-200 font-mono">if TestValid(unit) then</code>.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <h4 className="font-bold text-amber-300 mb-1">
                  3. Reglas de Lua 5.0 y Corrutinas (Sleep / Create_Thread)
                </h4>
                <p>
                  • El motor de Empire at War ejecuta <strong>Lua 5.0</strong>: el operador <code className="text-amber-200 font-mono">#tabla</code> de Lua 5.1 no existe; utiliza siempre <code className="text-amber-200 font-mono">table.getn(tabla)</code>.<br />
                  • Las funciones bloqueantes como <code className="text-amber-200 font-mono">Sleep(segundos)</code> o <code className="text-amber-200 font-mono">BlockOnCommand(...)</code> deben invocarse dentro de un estado o hilo creado con <code className="text-amber-200 font-mono">Create_Thread("Nombre_Funcion")</code>.
                </p>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-800 flex justify-end bg-slate-950/50">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuaEditor;
