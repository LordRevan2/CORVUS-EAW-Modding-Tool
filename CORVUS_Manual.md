# CORVUS // EAW Modding Tool (v4.0.0-beta // REVAN)
## User Manual & Tactical Workstation Reference

Welcome to **CORVUS v4.0.0-beta // REVAN**, the comprehensive tactical modding workstation for *Star Wars: Empire at War* and *Forces of Corruption* (Alamo Engine).

---

## Included Modules & Versions (v4.0.0-beta // REVAN)

| Module | Version | Target Formats |
| :--- | :---: | :--- |
| **Galaxy, Planets & A* Pathfinding** | `v2.7` | `Planets.xml`, `TradeRoutes.xml` |
| **Galactic Conquest & Faction Economy** | `v3.3` | `Campaigns.xml` |
| **Story Campaign Event Plots + 2D Nodal Graph** | `v2.2` | `Story_*.xml` |
| **Alamo Unit & 1v1 TTK Duel Simulator** | `v1.4` | `SpaceUnits*.xml`, `Ground*.xml`, `Squadrons.xml` |
| **HardPoints & Projectiles XML + Target TTK** | `v1.1` | `HardPoints.xml`, `Projectiles.xml` |
| **Tech Tree & Factions XML Architect** | `v1.0` | `Factions.xml`, `SpaceUnits*.xml`, `Ground*.xml` |
| **Audio & SFXEvents.xml Studio** | `v1.0` | `SFXEvents.xml`, `.wav` |
| **String Localization Compiler (.DAT)** | `v1.3` | `MasterTextFile_*.dat` |
| **Mega-Texture Atlas Editor (.MTD)** | `v1.3` | `MT_CommandBar.mtd`, `.tga`, `.png` |
| **Dialog, Briefings & Holo Simulator** | `v1.1` | `Dialog_*.txt` |
| **Raw XML Code & DOM Editor** | `v2.1` | Generic `.xml` |
| **Raw LUA 5.0 Script IDE** | `v2.2` | `.lua` (Alamo Lua 5.0) |
| **Global Mod Integrity Validator** | `v1.0` | Cross-File `.XML` / `.DAT` / `.MTD` Audit |

---

## What's New in CORVUS v3.3.0

1. **Tech Tree & Factions XML Architect (`v1.0`)**:
   - Visual progression board (`Tech 0` through `Tech 5`) across all space and ground units per faction (`Empire`, `Rebel`, `Underworld`, or custom factions), with 1-click Tech Level promotion/demotion (`<Tech_Level>`) and Starbase/structure dependency badges (`<Required_Star_Base_Level>`, `<Required_Special_Structures>`).
   - Full `Factions.xml` inspector for `<Faction>` nodes, including RGBA strategic color picker (`<Color>`), tactical space/land population caps (`<Space_Tactical_Unit_Cap>`), and starting structures.
2. **Audio & `SFXEvents.xml` Studio (`v1.0`)**:
   - Dedicated acoustic inspector for `<SFXEvent>` nodes (weapons, engines, explosions, UI, and unit voiceovers).
   - Includes dynamic volume (`Min_Volume` / `Max_Volume`), pitch (`Min_Pitch` / `Max_Pitch`), 2D/3D spatialization & attenuation distances (`Min_Distance` / `Max_Distance`), `.WAV` sample pool manager, and a Web Audio API pitch/volume roll synthesizer to test randomized sound variations in real time.
3. **Story Campaign Event Editor (`v2.2`)**:
   - Added an interactive **2D Nodal Event Graph (DAG)** mode with automatic topological layering, zoom/pan viewport, and color-coded Bézier curves for `<Prereq>` prerequisites, `ENABLE_EVENT` unlocks, and `DISABLE_EVENT` locks.
4. **Alamo Unit & Roster Editor (`v1.4`)**:
   - Added a **1v1 Time-To-Kill (TTK) Combat Duel Simulator** inside the `Versus` view that computes sustained weapon DPS, shield regeneration, seconds to destroy Unit A vs Unit B, predicted duel winner, and remaining hull percentage, plus 1-click navigation from any unit `<HardPoints>` entry to the HardPoints Editor.
5. **HardPoints & Projectiles XML Editor (`v1.1`)**:
   - Added a live **Target Class TTK Simulator** (`Corvette`, `Frigate`, `Capital`, `Starbase`) inside the weapon telemetry panel comparing single turret (`1x`) vs 4-turret battery (`4x`) time-to-kill.

---

**CORVUS // EAW Modding Tool** _(Version 4.0.0-beta // REVAN)_
May the Force be with you.
