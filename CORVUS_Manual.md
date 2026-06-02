# CORVUS // EAW Modding Tool
## User Manual

Welcome to **CORVUS**, your ultimate tool for designing and modifying galactic maps for the *Star Wars: Empire at War* video game.

---

## 1. Introduction
CORVUS allows you to create, edit, and visualize the game's galactic map interactively and visually. With this tool, you can:
- Manage Planets (`Planets.xml`).
- Manage Trade Routes / Hyperlanes (`TradeRoutes.xml`).

All of this is done in an intuitive environment with real-time synchronization.

---

## 2. Getting Started (Importing Files)

To start editing, you need to load the original XML files from your modification directory or the base game. You will find the import buttons on the top bar. The recommended import order is:

1. **Import Planets.xml (Required)**: This file is required first to determine the positions, names, and characteristics of all planets.
2. **Import TradeRoutes.xml**: This is where hyperspace connections between planets are defined. You will see them drawn between the imported planets.

---

## 3. Planet Editor

The left panel (**PLANETS** tab) displays all the worlds loaded on the map.
- **Search Planet**: Use the search bar to filter the list quickly.
- **Hide the Core**: You can use the `SHW/HD` button to hide or show the "Galaxy_Core_Art_Model" and clean up your view.
- When selecting a planet from the list (or by clicking on it in the map), you will see its details in the right-hand panel **(Active Mode)**.

### Editable Planet Properties
- **Rebel/Empire/Pirate/Hutt**: Assign troops and visual bases for each faction according to your map layout.
- **Position (X, Y)**: Control the planet's galactic coordinates by dragging the planet directly in the map viewport or introducing values manually in the editor with fine-tuned zooming.

---

## 4. Route Editor (Hyperlanes)

Navigate to the **ROUTES** tab (left panel).
- You can add new routes by clicking on "NEW TRADE ROUTE" or modify/delete existing ones.
- The route will visualize a connection between its **Planet A** and its **Planet B**.

---

## 5. Game Translations (.DAT)

In the initial home screen, you have access to the **CORVUS WORKSTATION** for translations. By selecting the **Game Translations (.DAT)** option, you can load and edit `MasterTextFile.dat` and other translation files.

- **Import / Create**: Load an existing `.DAT` file or create a brand new one from scratch.
- **Bulk Import**: Paste lists of keys and translations from Excel or Google Sheets (separated by Tab, `=`, or `;`) for quick, massive text additions.
- **Search and Filters**: Easily locate translation keys, find empty values, or check for duplicates across the entire file.
- **Editing**: Select a key to edit its localized text. A byte size and character count metric is included to ensure limits for large text descriptions are correctly formatted for the game engine. Let your text breathe by using paragraphs naturally with `\n` line breaks for proper in-game rendering.
- **Exporting**: Once finished, download the compiled `.DAT` file via the `Save .DAT` button. Place it in `Data/Text/` or your mod's translation dictionary.

---

## 6. Icon Atlas Mapping (.MTD)

In the home screen tools panel, you also have access to the **MegaTexture Database Editor (.MTD)**. This serves to align User Interface icons dynamically using a shared sprite sheet atlas (such as `Mt_commandbar.tga` for ability icons).

- **Load MTD & Texture**: Import your `Mt_commandbar.mtd` file. You should also load its corresponding texture atlas image (in `.PNG` or `.TGA`) to visualize the mapping over real graphics.
- **Adjust Boundaries**: Select a specific UI icon from the sidebar. You will see its coverage highlighted on the texture atlas. Modify the `X, Y` (Top Left) and `Width, Height` dimensions.
- **Expert UV Display**: EaW maps hardware UV constraints via floats (0.0 to 1.0). The editor calculates and displays these for you automatically inside the "Expert UV Coords" panel.
- **Export**: After aligning the icon textures securely into their UV slots, hit **Save .MTD** to download the new binaries for your mod folder.

---

## 7. General Map Options

- **Invert Y Axis (Configuration)**: As a general rule, Star Wars: Empire at War and its engine invert the vertical axis compared to some modern 2D viewports. Go to `Settings` (the gear icon) to activate this option so you can map the planets correctly in the style of its galaxy map.
- **Zoom / Viewport Panning**: You can use the mouse wheel or the Magnifying Glass (+ / -) buttons and selection mode to correctly pan over your galactic scenario. You can drag the map background to move smoothly.

---

## 8. Saving and Exporting Changes

Your modifications only remain in the browser memory temporarily until you export them to physically apply them to the mod's `/XML` folder.

To save everything:
1. Click the top button **EXPORT XML FILES**.
2. **CORVUS** will automatically generate the new versions of the files: `Planets_Modified.xml` and `TradeRoutes_Modified.xml`. Only those files you imported and interacted with will be downloaded.
3. Copy these files into your Mod's folder (e.g., `Data/XML/`), renaming them to remove the "_Modified" suffix to overwrite the originals.

> *(We always recommend making backups of your initial files).*

---

**CORVUS // EAW Modding Tool** _(Version 1.0.0)_
Designed to take your RTS Modding projects to the next level interactively, quickly, and accurately.
May the Force be with you.
