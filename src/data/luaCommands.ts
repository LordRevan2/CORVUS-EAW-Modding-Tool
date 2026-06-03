export const LUA_COMMANDS: {name: string, desc: string}[] = [
  {
    "name": "Script",
    "desc": "The current script as LuaScriptWrapper"
  },
  {
    "name": "ServiceRate",
    "desc": "The amount of time (in seconds) the script is suspended after a coroutine yield (i.e. call to PumpEvents). This is adjusted to an integer number of frames and is always at least 1 frame or 0.033 seconds. Can be adjusted at any point in the script(?)."
  },
  {
    "name": "LuaThreadTable",
    "desc": "Table whose keys are objects of type thread and whose entries are booleans. The first entry contains the main thread."
  },
  {
    "name": "LuaWrapperMetaTable",
    "desc": "The meta table for all GameObjectWrappers and PlayerWrappers and maybe all other objects. Has entries for __call, __gc, __eq, __tostring and __index."
  },
  {
    "name": "PlayerObject",
    "desc": "The AI player the script is attached to"
  },
  {
    "name": "Target",
    "desc": "The target considered (game object at least in galactic mode)"
  },
  {
    "name": "AITarget",
    "desc": "AITargetLocationWrapper (use .Get_Game_Object() to get corresponding game object if there is one, e.g. the planet in galactic mode)"
  },
  {
    "name": "Object",
    "desc": "The GameObjectWrapper the script is attached to."
  },
  {
    "name": "GetEvent",
    "desc": "Used to run event handlers like Default_Space_Conflict_Begin. Returns a function when 'C' wants it to be called."
  },
  {
    "name": "GetEvent.Params",
    "desc": "Returns the parameters for the function call"
  },
  {
    "name": "GetEvent.Reset",
    "desc": "Clear out any thread events"
  },
  {
    "name": "lc",
    "desc": "LuaConsolePrint (no luck finding out where it prints to if anywhere at all)"
  },
  {
    "name": "DumpCallStack",
    "desc": "No description"
  },
  {
    "name": "GetThreadID",
    "desc": "Seems to be equivalent to Thread.Get_Current_ID()"
  },
  {
    "name": "_OuputDebug",
    "desc": "Prints to _LogFile.txt. Notice the spelling mistake."
  },
  {
    "name": "_MessagePopup",
    "desc": "Trigger a message popup window"
  },
  {
    "name": "_CustomScriptMessage",
    "desc": "Print to X. (X can only be a file name, no path)"
  },
  {
    "name": "_DebugBreak",
    "desc": "No description"
  },
  {
    "name": "_ScriptMessage",
    "desc": "Prints to the AILog if it is enabled"
  },
  {
    "name": "_ScriptExit",
    "desc": "No description"
  },
  {
    "name": "StringCompare",
    "desc": "X = string, Y = string"
  },
  {
    "name": "BlockForever",
    "desc": "No description"
  },
  {
    "name": "Is_Multiplayer_Mode",
    "desc": "No description"
  },
  {
    "name": "Get_Game_Mode",
    "desc": "Returns \"Land\", \"Space\" or \"Galactic\""
  },
  {
    "name": "Is_Campaign_Game",
    "desc": "True for GC games"
  },
  {
    "name": "Lock_Controls",
    "desc": "(Un)Lock all player controls"
  },
  {
    "name": "Suspend_AI",
    "desc": "X = 0,1"
  },
  {
    "name": "Cancel_Fast_Forward",
    "desc": "Stops fast forward"
  },
  {
    "name": "Resume_Hyperspace_In",
    "desc": "In tactical missions when reward parameter 9 of LINK_TACTICAL is set to 2, this will trigger the arrival of the attacking fleet."
  },
  {
    "name": "Game_Message",
    "desc": "Displays the text entry as a droid advisor hint"
  },
  {
    "name": "Add_Objective",
    "desc": "For Y = true the objective is added under the heading \"Battle Information\", for Y = false it is added under the heading \"Mission Objectives\""
  },
  {
    "name": "Remove_Planet_Highlight",
    "desc": "X = string"
  },
  {
    "name": "Add_Planet_Highlight",
    "desc": "X = planet object, Y = string"
  },
  {
    "name": "Remove_Radar_Blip",
    "desc": "Removes the radar blip identified by X (see Add_Radar_Blip)"
  },
  {
    "name": "Add_Radar_Blip",
    "desc": "Add a radar blip at X with identifier Y"
  },
  {
    "name": "Hide_Sub_Object",
    "desc": "X = game object, Y = 0,1, Z = string"
  },
  {
    "name": "Hide_Object",
    "desc": "X = game object, Y = 0,1"
  },
  {
    "name": "Assemble_Fleet",
    "desc": "Assembles the passed objects into a fleet and returns the fleet object"
  },
  {
    "name": "Is_Point_In_Asteroid_Field",
    "desc": "No description"
  },
  {
    "name": "Is_Point_In_Ion_Storm",
    "desc": "No description"
  },
  {
    "name": "Is_Point_In_Nebula",
    "desc": "No description"
  },
  {
    "name": "Are_On_Opposite_Sides_Of_Shield",
    "desc": "X = position, Y = position"
  },
  {
    "name": "Are_On_Opposite_Sides_Of_Shield",
    "desc": "X = position, Y = position, Z = player, U = bool"
  },
  {
    "name": "Activate_Retry_Dialog",
    "desc": "No description"
  },
  {
    "name": "WaitForStarbase",
    "desc": "X = planet object, Y = number"
  },
  {
    "name": "WaitForGroundbase",
    "desc": "X = planet object, Y = number"
  },
  {
    "name": "GetNextGroundbaseType",
    "desc": "X = planet object"
  },
  {
    "name": "GetNextStarbaseType",
    "desc": "X = planet object"
  },
  {
    "name": "GetCurrentTime",
    "desc": "Returns game time in seconds"
  },
  {
    "name": "GetCurrentTime.Frame",
    "desc": "No description"
  },
  {
    "name": "GetCurrentTime.Galactic_Time",
    "desc": "No description"
  },
  {
    "name": "Find_Player",
    "desc": "Returns a PlayerWrapper object"
  },
  {
    "name": "Find_Object_Type",
    "desc": "Returns a GameObjectTypeWrapper object"
  },
  {
    "name": "Find_All_Objects_Of_Type",
    "desc": "Literally finds all objects of this type. That may include projectiles or other unexpected objects."
  },
  {
    "name": "Find_All_Objects_Of_Type",
    "desc": "X = property flag, Y = player"
  },
  {
    "name": "Find_All_Objects_Of_Type",
    "desc": "Categories can be piped together"
  },
  {
    "name": "Find_First_Object",
    "desc": "Returns the first object of the given type. Possibly finds objects in reverse spawn order."
  },
  {
    "name": "FindDeadlyEnemy",
    "desc": "Returns (the most powerful?) unit attacking X if there is one. Has turned out somewhat unreliable in some cases."
  },
  {
    "name": "Find_Hint",
    "desc": "Find an object with a given hint (as set in the map editor)."
  },
  {
    "name": "Find_All_Objects_With_Hint",
    "desc": "X = string(hint)"
  },
  {
    "name": "Find_Nearest",
    "desc": "Returns the nearest object to X that is of type Y. May return nil."
  },
  {
    "name": "Find_Nearest",
    "desc": "Returns the nearest unit to X belonging to Y if Z == true. Otherwise it will return the closest unit belonging to an enemy of Y."
  },
  {
    "name": "Find_Nearest",
    "desc": "X = game object, ai target or taskfore, Y = string(property flag or category mask), Z = player, U = bool"
  },
  {
    "name": "Find_Nearest_Space_Field",
    "desc": "X = game object or taskforce, Y = \"Asteroid\"/\"Nebula\"/\"Ion_Storm\"?"
  },
  {
    "name": "Find_Best_Local_Threat_Center",
    "desc": "Returns position and combined threat of units (from the unit list) in range of the position."
  },
  {
    "name": "Get_Most_Defended_Position",
    "desc": "Tactical only"
  },
  {
    "name": "Project_By_Unit_Range",
    "desc": "Tactical only. Returns a position outside the range of X"
  },
  {
    "name": "Find_Path",
    "desc": "GC only. Only for AI players. Returns a list of planet objects."
  },
  {
    "name": "FindPlanet",
    "desc": "GC only"
  },
  {
    "name": "FindPlanet.Get_All_Planets",
    "desc": "GC only"
  },
  {
    "name": "Spawn_Special_Weapon",
    "desc": "Space only"
  },
  {
    "name": "Spawn_From_Reinforcement_Pool",
    "desc": "player, position, type (in what order?)"
  },
  {
    "name": "Create_Generic_Object",
    "desc": "This spawns X at Y without regard for collision. Be sure to use a position for Y, using a game object can often crash the script."
  },
  {
    "name": "Spawn_Unit",
    "desc": "Spawns a unit respecting collision. If something blocks the spawn, the unit will be spawned as close to the spawn location as possible. Returns a list whose first entry is the spawned object."
  },
  {
    "name": "Reinforce_Unit",
    "desc": "If Y is false, the unit type is added to the reinforcements pool. Returns a CommandBlock."
  },
  {
    "name": ".Result",
    "desc": "Get result of action (e.g. spawned units from Reinforce_Unit)"
  },
  {
    "name": ".IsFinished",
    "desc": "Check if action (e.g. unit movement) has finished"
  },
  {
    "name": ".Is_Valid",
    "desc": "Usually used on game objects to test if they are still in the game"
  },
  {
    "name": "Start_Cinematic_Space_Retreat",
    "desc": "X = number(playerID), Y = number"
  },
  {
    "name": "End_Cinematic_Mode",
    "desc": "No description"
  },
  {
    "name": "Start_Cinematic_Mode",
    "desc": "No description"
  },
  {
    "name": "Set_Cinematic_Environment",
    "desc": "X = bool"
  },
  {
    "name": "Promote_To_Space_Cinematic_Layer",
    "desc": "X = game object"
  },
  {
    "name": "Create_Cinematic_Transport",
    "desc": "X = string(object type), Y = number(playerID), Z = position, U = number(angle), V = number(phase), W = number, R = number, S = number, T = hint(?)"
  },
  {
    "name": "Cinematic_Zoom",
    "desc": "X = number, Y = number"
  },
  {
    "name": "Transition_To_Tactical_Camera",
    "desc": "X = number(time)"
  },
  {
    "name": "Transition_Cinematic_Camera_Key",
    "desc": "Transition the camera position to a new position. Setting W to 1 switches Y,Z,U from cartesian coordinates to spherical coordinates (Y being the radius and U being the angle in the x-y-plane)."
  },
  {
    "name": "Set_Cinematic_Camera_Key",
    "desc": "Set a camera position"
  },
  {
    "name": "Transition_Cinematic_Target_Key",
    "desc": "Transition the camera target (what the camera is pointing at) to a new position in Y seconds."
  },
  {
    "name": "Set_Cinematic_Target_Key",
    "desc": "Set a target position for the camera to point at. If W is given, the camera will follow its movements. Without W the parameters R and S(?) won't work. If R is 1, the function uses W's coordinate system."
  },
  {
    "name": "End_Cinematic_Camera",
    "desc": "No description"
  },
  {
    "name": "Start_Cinematic_Camera",
    "desc": "X = bool(default is true)"
  },
  {
    "name": "Point_Camera_At",
    "desc": "X = game object or position(?)"
  },
  {
    "name": "Rotate_Camera_To",
    "desc": "No description"
  },
  {
    "name": "Rotate_Camera_By",
    "desc": "X = number, Y = number"
  },
  {
    "name": "Zoom_Camera",
    "desc": "X = number, Y = number"
  },
  {
    "name": "Camera_To_Follow",
    "desc": "No description"
  },
  {
    "name": "Scroll_Camera_To",
    "desc": "X = game object or position(?)"
  },
  {
    "name": "Fade_Screen_Out",
    "desc": "Fade screen into blackness"
  },
  {
    "name": "Fade_Screen_In",
    "desc": "Fade screen back from blackness"
  },
  {
    "name": "Fade_Off",
    "desc": "Turn off blackness from fade"
  },
  {
    "name": "Fade_On",
    "desc": "Make screen black immediately"
  },
  {
    "name": "Letter_Box_Out",
    "desc": "Move black bars at the top and bottom out of the screen"
  },
  {
    "name": "Letter_Box_In",
    "desc": "Move black bars at the top and bottom into the screen"
  },
  {
    "name": "Letter_Box_Off",
    "desc": "Get rid of black bars immediately"
  },
  {
    "name": "Letter_Box_On",
    "desc": "Show black bars immediately"
  },
  {
    "name": "Do_End_Cinematic_Cleanup",
    "desc": "Removes all units not marked by In_End_Cinematic?"
  },
  {
    "name": "Weather_Audio_Pause",
    "desc": "X = bool"
  },
  {
    "name": "Master_Volume_Restore",
    "desc": "No description"
  },
  {
    "name": "Allow_Localized_SFX",
    "desc": "X = bool"
  },
  {
    "name": "SFXManager.Allow_Ambient_VO",
    "desc": "X = bool"
  },
  {
    "name": "SFXManager.Allow_Enemy_Sighted_VO",
    "desc": "X = bool"
  },
  {
    "name": "SFXManager.Allow_HUD_VO",
    "desc": "X = bool"
  },
  {
    "name": "SFXManager.Allow_Unit_Reponse_VO",
    "desc": "Notice the spelling mistake!"
  },
  {
    "name": "SFXManager.Allow_Localized_SFXEvents",
    "desc": "X = bool"
  },
  {
    "name": "Remove_All_Text",
    "desc": "No description"
  },
  {
    "name": "Stop_All_Speech",
    "desc": "No description"
  },
  {
    "name": "Resume_Mode_Based_Music",
    "desc": "No description"
  },
  {
    "name": "Stop_All_Music",
    "desc": "No description"
  },
  {
    "name": "Play_Music",
    "desc": "X = string"
  },
  {
    "name": "Stop_Bink_Movie",
    "desc": "No description"
  },
  {
    "name": "Play_Bink_Movie",
    "desc": "X = string"
  },
  {
    "name": "Set_New_Environment",
    "desc": "No description"
  },
  {
    "name": "Force_Weather",
    "desc": "Turn on weather effects"
  },
  {
    "name": "Enable_Distance_Fog",
    "desc": "No description"
  },
  {
    "name": "Enable_Fog",
    "desc": "X = bool"
  },
  {
    "name": "Play_Lightning_Effect",
    "desc": "X = string(effect), Y = position, Z = position"
  },
  {
    "name": "GameRandom",
    "desc": "Returns random integer between X and Y"
  },
  {
    "name": "GameRandom.Get_Float",
    "desc": "Returns random float between 0 and 1"
  },
  {
    "name": "GameRandom.Get_Float",
    "desc": "Returns random float between X and Y"
  },
  {
    "name": "GameRandom.Free_Random",
    "desc": "No description"
  },
  {
    "name": "Create_Thread",
    "desc": "Starts the function X (more precisely, the function at _G[X]) in a new thread on the next frame with parameter Y and returns the thread ID (an integer). If Y is a table, its contents will be copied into a new list which is given to the function, the keys of the original table will be lost."
  },
  {
    "name": "Thread",
    "desc": "Seems to be the same as Create_Thread"
  },
  {
    "name": "Thread.Create",
    "desc": "Seems to be the same as Create_Thread"
  },
  {
    "name": "Thread.Kill",
    "desc": "Stops the thread with ID X"
  },
  {
    "name": "Create_Thread.Kill",
    "desc": "X = thread ID (integer)"
  },
  {
    "name": "Thread.Kill_All",
    "desc": "No description"
  },
  {
    "name": "Create_Thread.Kill_All",
    "desc": "No description"
  },
  {
    "name": "Thread.Is_Thread_Active",
    "desc": "X = thread ID (integer)"
  },
  {
    "name": "Create_Thread.Is_Thread_Active",
    "desc": "X = thread ID (integer)"
  },
  {
    "name": "Thread.Get_Name",
    "desc": "Returns the name of the main function (\"main\" or the function name passed to Create_Thread)"
  },
  {
    "name": "Create_Thread.Get_Name",
    "desc": "X = thread ID (integer)"
  },
  {
    "name": "Thread.Get_Current_ID",
    "desc": "Returns the ID of the current thread"
  },
  {
    "name": "Create_Thread.Get_Current_ID",
    "desc": "No description"
  },
  {
    "name": "GlobalValue.Get",
    "desc": "Get the value set for X"
  },
  {
    "name": "GlobalValue.Set",
    "desc": "Set a value Y for identifier X. This value is accessible for all lua scripts and can be any variable type except userdata or thread. Can theoretically still be used to access userdata from other scripts, however the game throws an error in that case."
  },
  {
    "name": "ThreadValue",
    "desc": "Get the value set for X"
  },
  {
    "name": "ThreadValue.Get",
    "desc": "Get the value set for X"
  },
  {
    "name": "ThreadValue.Set",
    "desc": "Set a value Y for identifier X. This value is specific to a thread as defined by Create_Thread."
  },
  {
    "name": "ThreadValue.Reset",
    "desc": "Sets value for identifier X to nil"
  },
  {
    "name": "DiscreteDistribution.Create",
    "desc": "Returns a LuaDiscreteDistributionClass object"
  },
  {
    "name": ".Insert",
    "desc": "<code>X</code> = anything?, <code>Y</code> = number"
  },
  {
    "name": ".Sample",
    "desc": "No description"
  },
  {
    "name": "WeightedTypeList.Create",
    "desc": "Returns a WeightedTypeListClass object"
  },
  {
    "name": "EvaluateTypeList",
    "desc": "returns a list"
  },
  {
    "name": ".Parse",
    "desc": "X = list of types(or categories?), Y = list of numbers"
  },
  {
    "name": "FogOfWar.Reveal_All",
    "desc": "Reveals the entire map for player X"
  },
  {
    "name": "FogOfWar.Reveal",
    "desc": "Reveals FoW at Y with radius Z for player X (in some vanilla source scripts a 4th parameter is used, but it doesn't seem to do anything). Returns a LuaFOWCellsClass object that can be used to undo the reveal."
  },
  {
    "name": "FogOfWar.Temporary_Reveal",
    "desc": "Reveals FoW at Y with radius Z for player X for about 5 seconds."
  },
  {
    "name": "FogOfWar.Disable_Rendering",
    "desc": "X = true makes units visible that should be hidden by the Fog of War."
  },
  {
    "name": ".Undo_Reveal",
    "desc": "No description"
  },
  {
    "name": "Story_Event",
    "desc": "Trigger a STORY_AI_NOTIFICATION event"
  },
  {
    "name": "Check_Story_Flag",
    "desc": "Checks if corresponding reward type TRIGGER_AI has fired."
  },
  {
    "name": "Get_Story_Plot",
    "desc": "Returns the story file as StoryPlotWrapper object. The parameter is case sensitive."
  },
  {
    "name": ".Get_Event",
    "desc": "Returns the xml event as StoryEventWrapper object."
  },
  {
    "name": ".Suspend",
    "desc": "Suspends the plot"
  },
  {
    "name": ".Activate",
    "desc": "Activates the plot"
  },
  {
    "name": ".Reset",
    "desc": "Resets all events of the plot"
  },
  {
    "name": ".Set_Reward_Type",
    "desc": "X = string(reward type)"
  },
  {
    "name": ".Set_Reward_Parameter",
    "desc": "Sets Reward_Param(X+1) as Y (X is 0 for Reward_Param1)."
  },
  {
    "name": ".Set_Event_Parameter",
    "desc": "Sets Event_Param(X+1) as Y (X is 0 for Event_Param1)."
  },
  {
    "name": ".Set_Dialog",
    "desc": "Sets the dialog file."
  },
  {
    "name": ".Clear_Dialog_Text",
    "desc": "No description"
  },
  {
    "name": ".Add_Dialog_Text",
    "desc": "The text will be formatted with any additional parameters given."
  },
  {
    "name": ".Despawn",
    "desc": "Removes the object from the game"
  },
  {
    "name": ".Get_Planet_Location",
    "desc": "Returns the planet object (GC only)"
  },
  {
    "name": ".Move_To",
    "desc": "Moves the Object to X, returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Move_To",
    "desc": "Moves Unit_List to Y in formation (does Object have to be contained in X?), returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Attack_Move",
    "desc": "Returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Attack_Move",
    "desc": "Returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Attack_Target",
    "desc": "Attack X, returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Attack_Target",
    "desc": "Attack Y with Unit_List (does the object have to be part of Unit_List?), returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Guard_Target",
    "desc": "Returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Guard_Target",
    "desc": "Guard Y with Unit_List (does the object have to be part of Unit_List?), returns a UnitMovementBlockStatus object"
  },
  {
    "name": ".Can_Move",
    "desc": "Returns true if the unit can currently move (is false e.g. during hyperspace in)"
  },
  {
    "name": ".Stop",
    "desc": "Stops the unit"
  },
  {
    "name": ".Suspend_Locomotor",
    "desc": "movability on or off"
  },
  {
    "name": ".Get_Position",
    "desc": "Returns Position of the Object"
  },
  {
    "name": ".Enable_Behavior",
    "desc": "Enables specific behavior"
  },
  {
    "name": ".Activate_Ability",
    "desc": "Activates untargeted ability"
  },
  {
    "name": ".Activate_Ability",
    "desc": "Activates targeted ability"
  },
  {
    "name": ".Reset_Ability_Counter",
    "desc": "Finishes ability cooldown"
  },
  {
    "name": ".Set_Single_Ability_Autofire",
    "desc": "X = AbilityName (string), Y = true / false"
  },
  {
    "name": ".Set_All_Abilities_Autofire",
    "desc": "X = bool"
  },
  {
    "name": ".Is_Ability_Autofire",
    "desc": "No description"
  },
  {
    "name": ".Is_Ability_Active",
    "desc": "Returns true or false"
  },
  {
    "name": ".Is_Ability_Ready",
    "desc": "Returns true or false"
  },
  {
    "name": ".Has_Ability",
    "desc": "Returns true or false"
  },
  {
    "name": ".Force_Ability_Recharge",
    "desc": "X = string, Y = number(optional)"
  },
  {
    "name": ".Cancel_Ability",
    "desc": "X = string(ability)"
  },
  {
    "name": ".Take_Damage",
    "desc": "X = Damage points"
  },
  {
    "name": "-",
    "desc": "Y(optional) = Hardpoint(string)"
  },
  {
    "name": ".Are_Engines_Online",
    "desc": "Returns true or false"
  },
  {
    "name": ".Override_Max_Speed",
    "desc": "X = number"
  },
  {
    "name": ".Cinematic_Hyperspace_In",
    "desc": "Makes unit hyperspace into battle with delay by X frames (spawning many units with different delays at the same time seems spawns all units with the same delay anyway)"
  },
  {
    "name": ".Hyperspace_Away",
    "desc": "Makes unit leave into hyperspace. If X is true, the unit gets deleted from GC"
  },
  {
    "name": ".Cancel_Hyperspace",
    "desc": "No description"
  },
  {
    "name": ".Prevent_AI_Usage",
    "desc": "Allow or prevent AI usage. In tactical battles this crashes the game if the unit has no active AI! When the factions AI changes, the unit is AI usable again."
  },
  {
    "name": ".Hide",
    "desc": "(Un)Hides the object"
  },
  {
    "name": ".Play_Animation",
    "desc": "X = Animation name (string)"
  },
  {
    "name": "-",
    "desc": "Y = bool"
  },
  {
    "name": "-",
    "desc": "Z = integer"
  },
  {
    "name": ".Change_Owner",
    "desc": "Sets objects owner to new faction"
  },
  {
    "name": ".In_End_Cinematic",
    "desc": "Shall object be displayed in Cinematic?"
  },
  {
    "name": ".Teleport",
    "desc": "Teleport object to X"
  },
  {
    "name": ".Teleport_And_Face",
    "desc": "Teleport object to X and make it face the same way as X"
  },
  {
    "name": ".Face_Immediate",
    "desc": "Make unit face toward X immediately"
  },
  {
    "name": ".Turn_To_Face",
    "desc": "Make unit turn to face toward X"
  },
  {
    "name": ".Prevent_Opportunity_Fire",
    "desc": "Prevent automatically firing at targets in range"
  },
  {
    "name": ".Prevent_All_Fire",
    "desc": "Completely prevent a unit from firing"
  },
  {
    "name": ".Make_Invulnerable",
    "desc": "Stops object from taking any damage"
  },
  {
    "name": ".Set_Check_Contested_Space",
    "desc": "Make the unit/fleet not trigger space tactical battles?"
  },
  {
    "name": ".Get_Parent_Object",
    "desc": "For fleets this is a PlanetObject, for units in GC it's the fleet, for ground forces it's the transport?, for fighters it's the squadron"
  },
  {
    "name": ".Lock_Current_Orders",
    "desc": "Only for units belonging to AI players"
  },
  {
    "name": ".Unlock_Current_Orders",
    "desc": "Only for units belonging to AI players"
  },
  {
    "name": ".Is_In_Asteroid_Field",
    "desc": "No description"
  },
  {
    "name": ".Is_In_Ion_Storm",
    "desc": "No description"
  },
  {
    "name": ".Is_In_Nebula",
    "desc": "No description"
  },
  {
    "name": ".Get_Type",
    "desc": "Returns the unit's type (GameObjectTypeWrapper object)"
  },
  {
    "name": ".Is_Corrupted",
    "desc": "Use on planets"
  },
  {
    "name": ".Enable_Dynamic_LOD",
    "desc": "X = bool"
  },
  {
    "name": ".Invade",
    "desc": "Only for fleets with land units in orbit over an enemy planet (is used in FoC campaign but doesn't seem to work in regular GC)"
  },
  {
    "name": ".Set_In_Limbo",
    "desc": "X = bool"
  },
  {
    "name": ".Get_All_Projectile_Types",
    "desc": "Returns a list of the projectile types (GameObjectTypeWrappers) the unit uses"
  },
  {
    "name": ".Is_Selectable",
    "desc": "No description"
  },
  {
    "name": ".Get_Current_Projectile_Type",
    "desc": "Returns the projectile type the unit is currently using"
  },
  {
    "name": ".Should_Switch_Weapons",
    "desc": "Returns true if alternate weaponry of the unit is better against (?) X"
  },
  {
    "name": ".Is_Good_Against",
    "desc": "X = game object or ai target"
  },
  {
    "name": ".Is_In_Garrison",
    "desc": "Is the unit garrisoned"
  },
  {
    "name": ".Get_Garrisoned_Units",
    "desc": "Returns a list of units garrisoned inside the object"
  },
  {
    "name": ".Has_Garrison",
    "desc": "Returns true if the object contains any garrisoned units"
  },
  {
    "name": ".Eject_Garrison",
    "desc": "Eject all garrisoned units"
  },
  {
    "name": ".Leave_Garrison",
    "desc": "Make a garrisoned unit leave its garrison"
  },
  {
    "name": ".Can_Garrison_Fire",
    "desc": "No description"
  },
  {
    "name": ".Can_Garrison",
    "desc": "Can the unit be garrisoned in X?"
  },
  {
    "name": ".Garrison",
    "desc": "Garrison the unit in X"
  },
  {
    "name": ".Get_Attack_Target",
    "desc": "No description"
  },
  {
    "name": ".Can_Land_On_Planet",
    "desc": "Can the unit land on planet X?"
  },
  {
    "name": ".Get_Is_Planet_AI_Usable",
    "desc": "Can only be used on planets"
  },
  {
    "name": ".Play_Cinematic_Engine_Flyby",
    "desc": "No description"
  },
  {
    "name": ".Stop_SFX_Event",
    "desc": "X = string, Y = number(optional)"
  },
  {
    "name": ".Attach_Particle_Effect",
    "desc": "X = type or type name, y = string(optional)"
  },
  {
    "name": ".Has_Attack_Target",
    "desc": "No description"
  },
  {
    "name": ".Show_Emitter",
    "desc": "X = string(emitter), Y = bool"
  },
  {
    "name": ".Highlight_Small",
    "desc": "Put a small arrow highlight on top of the object"
  },
  {
    "name": ".Highlight",
    "desc": "Put an arrow highlight on top of the object"
  },
  {
    "name": ".Explore_Area",
    "desc": "X = ai target location"
  },
  {
    "name": ".Disable_Capture",
    "desc": "X = bool"
  },
  {
    "name": ".Force_Test_Space_Conflict",
    "desc": "Enforce check if a space battle should be initiated, e.g. after spawning a fleet at an enemy planet (only works on fleets and planets)"
  },
  {
    "name": ".Play_SFX_Event",
    "desc": "X = string, Y = number(optional)"
  },
  {
    "name": ".Set_Cannot_Be_Killed",
    "desc": "Keep a unit from dying (it can still be damaged)"
  },
  {
    "name": ".Get_Hint",
    "desc": "No description"
  },
  {
    "name": ".Set_Garrison_Spawn",
    "desc": "Turn spawn of garrison units on/off"
  },
  {
    "name": ".Fire_Tactical_Superweapon",
    "desc": "Fire death star in tactical"
  },
  {
    "name": ".Is_Tactical_Superweapon_Ready",
    "desc": "Test if death star is ready to fire"
  },
  {
    "name": ".Get_Bone_Position",
    "desc": "X = string(bone name)"
  },
  {
    "name": ".Lock_Build_Pad_Contents",
    "desc": "X = bool"
  },
  {
    "name": ".Is_Planet_Destroyed",
    "desc": "No description"
  },
  {
    "name": ".Get_Affiliated_Indigenous_Type",
    "desc": "Use on planets. Returns the indigenous unit type of that planet affiliated with X"
  },
  {
    "name": ".Is_On_Diversion",
    "desc": "No description"
  },
  {
    "name": ".Has_Property",
    "desc": "X = string(property flag)"
  },
  {
    "name": ".Destroy_Contained_Objects",
    "desc": "Only use on fleets"
  },
  {
    "name": ".Contains_Object_Type",
    "desc": "Only use on fleets"
  },
  {
    "name": ".Get_Contained_Object_Count",
    "desc": "Only use on fleets"
  },
  {
    "name": ".Has_Active_Orders",
    "desc": "No description"
  },
  {
    "name": ".Get_AI_Power_Vs_Unit",
    "desc": "(tactical only)"
  },
  {
    "name": ".Divert",
    "desc": "X = object or position, Y = number(optional)"
  },
  {
    "name": ".Get_Next_Starbase_Type",
    "desc": "Use on planets"
  },
  {
    "name": ".Mark_Parent_Mode_Object_For_Death",
    "desc": "Use in tactical. This kills the corresping GC object"
  },
  {
    "name": ".Set_Importance",
    "desc": "X = number"
  },
  {
    "name": ".Service_Wrapper",
    "desc": "No description"
  },
  {
    "name": ".Cancel_Event_Object_In_Range",
    "desc": "X = function"
  },
  {
    "name": ".Event_Object_In_Range",
    "desc": "Calls X(self, trigger_object) continually for each trigger_object affiliated with Z in range"
  },
  {
    "name": ".Get_Final_Blow_Player",
    "desc": "Used on planets, returns a player"
  },
  {
    "name": ".Get_Starbase_Level",
    "desc": "Only used on planets(?)"
  },
  {
    "name": ".Get_Owner",
    "desc": "No description"
  },
  {
    "name": ".Sell",
    "desc": "Possibly only for build pad contents"
  },
  {
    "name": ".Get_Build_Pad_Contents",
    "desc": "Use on build pads or MDUs"
  },
  {
    "name": ".Get_Distance",
    "desc": "Returns a number"
  },
  {
    "name": ".Get_Contained_Heroes",
    "desc": "Only for fleets?"
  },
  {
    "name": ".Contains_Hero",
    "desc": "Only for fleets"
  },
  {
    "name": ".Fire_Special_Weapon",
    "desc": "Use on space station apparently"
  },
  {
    "name": ".Get_Rate_Of_Damage_Taken",
    "desc": "No description"
  },
  {
    "name": ".Get_Time_Till_Dead",
    "desc": "No description"
  },
  {
    "name": ".Set_Targeting_Stickiness_Time_Threshold",
    "desc": "X = number"
  },
  {
    "name": ".Set_Targeting_Priorities",
    "desc": "X = string(targeting priority set)"
  },
  {
    "name": ".Set_Prefer_Ground_Over_Space",
    "desc": "Obeject needs UNIT_AI behavior"
  },
  {
    "name": ".Get_Game_Scoring_Type",
    "desc": "No description"
  },
  {
    "name": ".Is_Category",
    "desc": "Can use pipe to concatenate categories"
  },
  {
    "name": ".Get_Shield",
    "desc": "Normalized wrt total shield points (i.e. returns number between 0 and 1)"
  },
  {
    "name": ".Get_Energy",
    "desc": "Normalized wrt units total energy"
  },
  {
    "name": ".Get_Health",
    "desc": "Normalized wrt units total health"
  },
  {
    "name": ".Get_Hull",
    "desc": "Normalized wrt units total health (apparently the same as Get_Health)"
  },
  {
    "name": ".Is_Transport",
    "desc": "Use in galactic"
  },
  {
    "name": ".Release",
    "desc": "No description"
  },
  {
    "name": ".Build",
    "desc": "Use on buildpads and MDUs"
  },
  {
    "name": ".Get_Name",
    "desc": "Returns the name of the game object type (the xml name)"
  },
  {
    "name": ".Get_Combat_Rating",
    "desc": "Returns the AI_Combat_Power"
  },
  {
    "name": ".Is_Hero",
    "desc": "Returns true/false"
  },
  {
    "name": ".Get_Build_Cost",
    "desc": "Returns build cost"
  },
  {
    "name": ".Get_Tech_Level",
    "desc": "Returns required tech level"
  },
  {
    "name": ".Get_Base_Level",
    "desc": "Returns level of a starbase type"
  },
  {
    "name": ".Is_Affiliated_With",
    "desc": "X = player"
  },
  {
    "name": ".Is_Build_Locked",
    "desc": "X = player"
  },
  {
    "name": ".Is_Obsolete",
    "desc": "X = player"
  },
  {
    "name": ".Get_Tactical_Build_Cost",
    "desc": "No description"
  },
  {
    "name": ".Get_Score_Cost_Credits",
    "desc": "No description"
  },
  {
    "name": ".Get_Max_Range",
    "desc": "No description"
  },
  {
    "name": ".Get_Min_Range",
    "desc": "No description"
  },
  {
    "name": ".Get_Bribe_Cost",
    "desc": "No description"
  },
  {
    "name": ".Is_Affected_By_Missile_Shield",
    "desc": "This is used only for projectile types"
  },
  {
    "name": ".Is_Affected_By_Laser_Defense",
    "desc": "This is used only for projectile types"
  },
  {
    "name": ".Enable_Advisor_Hints",
    "desc": "Enables Advisor Hints"
  },
  {
    "name": "-",
    "desc": "Y = true / false"
  },
  {
    "name": ".Get_ID",
    "desc": "returns ID of PlayerObject"
  },
  {
    "name": ".Get_Enemy",
    "desc": "Returns an enemy player (I suspect it only ever returns Rebel or Empire, in any case there is not much point using it outside the base EaW though it might be related to the Primary Enemy tag)"
  },
  {
    "name": ".Select_Object",
    "desc": "Forces player to select object"
  },
  {
    "name": ".Enable_As_Actor",
    "desc": "Activates the AI for that player"
  },
  {
    "name": ".Retreat",
    "desc": "Enables retreat event"
  },
  {
    "name": ".Get_Name",
    "desc": "returns the displayed faction name"
  },
  {
    "name": ".Get_Faction_Name",
    "desc": "returns xml faction name"
  },
  {
    "name": ".Get_Tech_Level",
    "desc": "No description"
  },
  {
    "name": ".Is_Human",
    "desc": "No description"
  },
  {
    "name": ".Give_Random_Sliceable_Tech",
    "desc": "No description"
  },
  {
    "name": ".Give_Money",
    "desc": "X = amount (integer/float?)"
  },
  {
    "name": ".Make_Ally",
    "desc": "Gets reset with any game mode changes, in particular at the end of every tactical battle!"
  },
  {
    "name": ".Make_Enemy",
    "desc": "Gets reset with any game mode changes, in particular at the end of every tactical battle!"
  },
  {
    "name": ".Get_Space_Station",
    "desc": "Returns the player's space station in space tactical"
  },
  {
    "name": ".Get_Team",
    "desc": "Team ID in skirmish"
  },
  {
    "name": ".Get_Clan_ID",
    "desc": "Clan ID in skirmish"
  },
  {
    "name": ".Remove_Orbital_Bombardment",
    "desc": "X = bool"
  },
  {
    "name": ".Disable_Orbital_Bombardment",
    "desc": "X = bool"
  },
  {
    "name": ".Set_Sabotage_Tutorial",
    "desc": "X = bool"
  },
  {
    "name": ".Set_Black_Market_Tutorial",
    "desc": "X = bool"
  },
  {
    "name": ".Get_Difficulty",
    "desc": "Returns \"Easy\", \"Normal\" or \"Hard\""
  },
  {
    "name": ".Disable_Bombing_Run",
    "desc": "X = false disables bombing run for the given faction in ground tactical, X = true enables it"
  },
  {
    "name": ".Is_Ally",
    "desc": "No description"
  },
  {
    "name": ".Is_Enemy",
    "desc": "No description"
  },
  {
    "name": ".Unlock_Tech",
    "desc": "X = GameObjectTypeWrapper"
  },
  {
    "name": ".Get_GameSpy_Stats_Player_ID",
    "desc": "No description"
  },
  {
    "name": ".Get_Credits",
    "desc": "No description"
  },
  {
    "name": ".Release_Credits_For_Tactical",
    "desc": "For AI player (with galactic AI) only. Releases credits for spending in (land only?) mode."
  },
  {
    "name": ".Set_Tech_Level",
    "desc": "X = Number"
  },
  {
    "name": "Evaluate_In_Galactic_Context",
    "desc": "For tactical battle. Evaluates the perception at GC level."
  },
  {
    "name": "Apply_Markup",
    "desc": "X = player, Y = list, Z = number, U = ?"
  },
  {
    "name": "Purge_Goals",
    "desc": "X = player"
  },
  {
    "name": "GiveDesireBonus",
    "desc": "X = player, Y = string(goal(set?)), Z = ai target, U = number, V = number"
  },
  {
    "name": "EvaluatePerception",
    "desc": "Evaluates a perception and returns the result. Y and Z are needed if and only if the perception uses Variable_Self and Variable_Target, respectively."
  },
  {
    "name": "_FindStageArea",
    "desc": "Deprecated but may still work as intended"
  },
  {
    "name": "_ProduceObject",
    "desc": "Deprecated but may still work as intended"
  },
  {
    "name": "FindTarget",
    "desc": "Find a target for a taskforce. Tries to find the one that the perception returns the highest value on."
  },
  {
    "name": "FindTarget.Reachable_Target",
    "desc": "Find a target for an aiplayer. Tries to find the one that the perception returns the highest value on."
  },
  {
    "name": "FindTarget.Best_Of",
    "desc": "X = taskforce, Y = list of game objects/ai targets, Z = string(perception?)"
  },
  {
    "name": ".Get_Game_Object",
    "desc": "Returns corresponding game object if there is one (e.g. a targeted unit or planet)."
  },
  {
    "name": ".Get_Distance",
    "desc": "X = position"
  },
  {
    "name": "FreeStore.Is_Object_On_Free_Store",
    "desc": "X = game object"
  },
  {
    "name": "FreeStore.Get_Object_Count",
    "desc": "No description"
  },
  {
    "name": "FreeStore.Is_Unit_Safe",
    "desc": "GC only(?)"
  },
  {
    "name": "FreeStore.Is_Unit_In_Transit",
    "desc": "GC only(?)"
  },
  {
    "name": "FreeStore.Move_Object",
    "desc": "GC only(?)"
  },
  {
    "name": ".Get_Goal_Type_Name",
    "desc": "No description"
  },
  {
    "name": ".Test_Target_Contrast",
    "desc": "X = bool"
  },
  {
    "name": ".Get_Self_Threat_Sum",
    "desc": "No description"
  },
  {
    "name": ".Get_Self_Threat_Max",
    "desc": "No description"
  },
  {
    "name": ".Get_Unit_Table",
    "desc": "No description"
  },
  {
    "name": ".Clear_Opportunity_Fire_Event_Subscriptions",
    "desc": "No description"
  },
  {
    "name": ".Remove_Opportunity_Fire_Event_Subscription",
    "desc": "No description"
  },
  {
    "name": ".Add_Opportunity_Fire_Event_Subscription",
    "desc": "No description"
  },
  {
    "name": ".Set_Plan_Result",
    "desc": "Sets plan to successful (true) or failed (false)"
  },
  {
    "name": ".Are_All_Units_On_Free_Store",
    "desc": "Check if all required units are available in the freestore"
  },
  {
    "name": ".Get_Stage",
    "desc": "No description"
  },
  {
    "name": ".Unblock_Goal_Proposal",
    "desc": "No description"
  },
  {
    "name": ".Block_Goal_Proposal",
    "desc": "No description"
  },
  {
    "name": ".Collect_All_Free_Units",
    "desc": "Add all units from the freestore to the taskforce"
  },
  {
    "name": ".Release_Unit",
    "desc": "X = game object"
  },
  {
    "name": ".Withdraw_Units",
    "desc": "Retreat"
  },
  {
    "name": ".Release_Forces",
    "desc": "0 < X < 1.0"
  },
  {
    "name": ".Set_As_Goal_System_Removable",
    "desc": "(Dis)allow hardcoded AI systems to terminate the goal (and plan)"
  },
  {
    "name": ".Get_Force_Count",
    "desc": "No description"
  },
  {
    "name": ".Produce_Force",
    "desc": "Assemble the taskforce a the given stage by building units or collecting them from the freestore"
  },
  {
    "name": ".Form_Units",
    "desc": "Forms a fleet object with the taskforces units"
  },
  {
    "name": ".Add_Force",
    "desc": "Adds a unit to the taskforce"
  },
  {
    "name": ".Get_Type_Of_Unit",
    "desc": "X = number(index)"
  },
  {
    "name": ".Leave_Garrison",
    "desc": "No description"
  },
  {
    "name": ".Can_Garrison",
    "desc": "X = game object"
  },
  {
    "name": ".Garrison",
    "desc": "X = game object"
  },
  {
    "name": ".Set_All_Abilities_Autofire",
    "desc": "No description"
  },
  {
    "name": ".Set_Single_Ability_Autofire",
    "desc": "X = string(ability name), Y = bool"
  },
  {
    "name": ".Get_AI_Power_Vs_Unit",
    "desc": "X = game object"
  },
  {
    "name": ".Set_Targeting_Stickiness_Time_Threshold",
    "desc": "X = number"
  },
  {
    "name": ".Set_Targeting_Priorities",
    "desc": "X = string(targeting priority set)"
  },
  {
    "name": ".Move_To",
    "desc": "Tactical only"
  },
  {
    "name": ".Attack_Move",
    "desc": "Tactical only"
  },
  {
    "name": ".Guard_Target",
    "desc": "Tactical only"
  },
  {
    "name": ".Attack_Target",
    "desc": "Tactical only"
  },
  {
    "name": ".Attack_Target",
    "desc": "Tactical only"
  },
  {
    "name": ".Release_Reinforcements",
    "desc": "Tactical only"
  },
  {
    "name": ".Get_Reserved_Build_Pads",
    "desc": "Tactical only"
  },
  {
    "name": ".Build_All",
    "desc": "Tactical only"
  },
  {
    "name": ".Reinforce",
    "desc": "Tactical only"
  },
  {
    "name": ".Prepare_Ambush",
    "desc": "Tactical only (not used)"
  },
  {
    "name": ".Find_Closest_Enemy",
    "desc": "Tactical only"
  },
  {
    "name": ".Enable_Attack_Positioning",
    "desc": "Tactical only"
  },
  {
    "name": ".Explore_Area",
    "desc": "Tactical only"
  },
  {
    "name": ".Get_Distance",
    "desc": "Tactical only"
  },
  {
    "name": ".Fire_Special_Weapon",
    "desc": "Tactical only"
  },
  {
    "name": ".Build",
    "desc": "Tactical only"
  },
  {
    "name": ".Activate_Ability",
    "desc": "Tactical only"
  },
  {
    "name": ".Fire_Orbital_Bombardment",
    "desc": "Land only"
  },
  {
    "name": ".Bombing_Run",
    "desc": "Land only"
  },
  {
    "name": ".Move_To",
    "desc": "GC only"
  },
  {
    "name": ".Activate_Ability",
    "desc": "GC only"
  },
  {
    "name": ".Raid",
    "desc": "GC only"
  },
  {
    "name": ".Is_Raid_Capable",
    "desc": "GC only"
  },
  {
    "name": ".Refit_To_Definition",
    "desc": "GC only"
  },
  {
    "name": ".Launch_Units",
    "desc": "Launches (land) units into orbit. GC only"
  },
  {
    "name": ".Land_Units",
    "desc": "Lands units on a planet. GC only"
  },
  {
    "name": ".Invade",
    "desc": "Starts a ground invasion (seems to require very specific circumstances to work) GC only"
  },
  {
    "name": ".Force_Test_Space_Conflict",
    "desc": "GC only"
  },
  {
    "name": "Budget.Flush_Category",
    "desc": "X = string(goal category)"
  },
  {
    "name": "Budget.Flush_All_Resources",
    "desc": "No description"
  },
  {
    "name": "Budget.Flush_Unallocated_Resources",
    "desc": "No description"
  },
  {
    "name": "Budget.Take_Resources_From_Goal",
    "desc": "X = number>0, Y = string"
  },
  {
    "name": "Budget.Give_Resources_To_Goal",
    "desc": "X = number>0, Y = string"
  },
  {
    "name": "Budget.Wait_For_Unallocated_Resources",
    "desc": "X = number"
  },
  {
    "name": "Budget.Wait_For_Spendable_Resources",
    "desc": "X = number"
  },
  {
    "name": "Budget.Allocate_Resources",
    "desc": "X = number"
  },
  {
    "name": "Budget.Get_Spendable_Resources",
    "desc": "No description"
  },
  {
    "name": "Budget.Get_Unallocated_Resources",
    "desc": "No description"
  },
  {
    "name": "Script.Debug_Should_Issue_Event_Alert",
    "desc": "No description"
  }
];