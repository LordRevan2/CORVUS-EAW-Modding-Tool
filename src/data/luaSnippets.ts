export interface LuaSnippet {
  name: string;
  description: string;
  code: string;
}

export const LUA_SNIPPETS: LuaSnippet[] = [
  {
    name: "Event Listener",
    description: "Register a function to be called on a specific event.",
    code: `require("PGStateMachine")

function State_Init()
    -- Register an event listener
    ServiceRate = 1
end

function Event_Target_Destroyed()
    -- Code to run when the event occurs
    _ScriptMessage("Target was destroyed!")
end`
  },
  {
    name: "Spawn Unit",
    description: "Spawn a specific unit at a given location or planet.",
    code: `local spawn_pos = Find_First_Object("Planet_Corellia")
local unit_type = Find_Object_Type("Stormtrooper")

if spawn_pos and unit_type then
    Spawn_Unit(unit_type, spawn_pos, PlayerObject)
end`
  },
  {
    name: "Play Audio",
    description: "Play an audio or speech event.",
    code: `local audio_event = "Event_Imperial_Victory"
Play_Audio(audio_event)`
  },
  {
    name: "Find Object",
    description: "Find an object by name.",
    code: `local target = Find_First_Object("Target_Name")
if TestValid(target) then
    -- Object exists and is alive
end`
  },
  {
    name: "Screen Message",
    description: "Show a text message on the screen.",
    code: `local text = "Mission complete!"
_CustomScriptMessage("TEXT_COLOR_GREEN", text)`
  },
  {
    name: "Wait/Sleep",
    description: "Wait for a specific amount of time. Requires coroutine or state machine.",
    code: `Sleep(5.0) -- Sleep for 5 seconds`
  },
  {
    name: "Add Objective",
    description: "Add a mission objective to the UI.",
    code: `Add_Objective("TEXT_OBJECTIVE_01")`
  },
  {
    name: "Story Event",
    description: "Trigger a story event progression.",
    code: `Story_Event("STORY_EVENT_NODE_01")`
  }
];
