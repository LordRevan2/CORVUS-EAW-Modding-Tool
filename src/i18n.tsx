import React, { createContext, useContext } from 'react';
import { Language } from './types';

export const translations = {
  en: {
    appTitle: "CORVUS // EAW Modding Tool",
    currentEditor: "Active Mode",
    active: "Active Workspace",
    importPlanets: "Import Planets.xml",
    importRoutes: "Import TradeRoutes.xml",
    settings: "Settings",
    exportChanges: "Export XML Files",
    closeProject: "Close Workspace",
    planetsTab: "Planets",
    routesTab: "Trade Routes",
    noPlanetsTitle: "No Galactic Systems Loaded",
    noPlanetsSubtitle: "Import a Planets.xml file to map and architect your custom galaxy screen.",
    initEmptyDb: "Initialize Empty Database",
    userManual: "User Manual // Documentation",
    planetList: {
      newPlanet: "New Planet",
      search: "Search planet...",
      total: "Total Planets",
      hideCore: "Hide Galaxy Core Art",
      showCore: "Show Galaxy Core Art",
      noSignal: "No planet matching query",
      bulkEdit: "Bulk Edit"
    },
    routeList: {
      newRoute: "New Trade Route",
      search: "Search trade route...",
      total: "Total Routes",
      noSignal: "No trade route matching query",
      deleteRoute: "Delete Route"
    },
    planetEditor: {
      noPlanetActive: "Select a planet to configure its attributes",
      baseName: "XML Identifier (Name)",
      baseNameHelp: "The primary 'Name' attribute used as reference in the game's XML data.",
      posX: "Coordinate X",
      posXHelp: "Horizontal absolute position in the galactic map grid.",
      posY: "Coordinate Y",
      posYHelp: "Vertical absolute position in the galactic map grid.",
      posZ: "Coordinate Z (Height)",
      posZHelp: "Relative visual height layering on the galactic plane map.",
      baseIncome: "Base Income (Credits)",
      baseIncomeHelp: "The base amount of credits this system generates per galactic cycle.",
      modelScale: "Galaxy Visual Scale",
      modelScaleHelp: "Defines the 3D visual scale of the planet model on the galaxy map. Usually ranges from 0.8 to 1.5.",
      landStructs: "Land Slots",
      landStructsHelp: "Maximum ground base structures building slots (e.g., factories, barracks, shields).",
      spaceStructs: "Space Slots",
      spaceStructsHelp: "Maximum space structures building platform slots (starbases, shipyards).",
      starbase: "Max Starbase Level",
      starbaseHelp: "The maximum level of Space Station or orbital Starbase constructible here (1 to 5).",
      battleTerrain: "Tactical Battle Map",
      battleTerrainHelp: "The specific map name defining terrain and conditions for spatial and ground skirmishes.",
      addXmlNode: "Add Custom XML Node",
      customNodeHelp: "Add a custom XML child element inside this planet's data block."
    },
    routeEditor: {
      noRouteActive: "Select a trade route / hyperlane to modify",
      routeName: "XML Route Identifier",
      pointA: "Star System A (Origin)",
      pointAHelp: "Origin target system gateway.",
      pointB: "Star System B (Destination)",
      pointBHelp: "Destination target system gateway.",
      speedFactor: "Hyperspace Speed Factor",
      creditGain: "Trade Value Bonus"
    },
    settingsModal: {
      title: "Settings",
      general: "General",
      galaxyMap: "Planet Editor (XML)",
      showGrid: "Display Navigation Grid",
      snapToGrid: "Snap to Grid Alignment",
      invertY: "Invert Y Coordinates (EaW Engine Format)",
      gridSize: "Grid Alignment Increment",
      language: "Interface Language",
      done: "Save Configuration",
      english: "English (Standard)",
      spanish: "Español (Castellano)",
      storyEditor: "Story Editor (XML)",
      editableXml: "Enable Direct XML Editing"
    },
    bulkEdit: {
      title: "Batch Node Processor",
      warning: "Warning: Value Substitution",
      warningDesc: "This operation will rewrite the specified configuration properties for all selected systems.",
      selectAll: "Select All Systems",
      deselectAll: "Deselect All",
      apply: "Apply Changes in Bulk",
      cancel: "Abort Operation",
      targetProperty: "Target XML Property",
      newValue: "New Value Input"
    },
    errors: {
      importXml: "Error processing the XML file",
      readXml: "Error reading the file",
      readDat: "Error reading DAT file",
      importDat: "Error processing DAT file. Ensure it is a valid Petroglyph DAT file.",
      initDb: "Error occurred initializing empty database",
      invalidPlanetSet: "File must be named Planets.xml or Planet.xml"
    },
    home: {
      title: "CORVUS WORKSTATION",
      subtitle: "Integrated XML star map and DAT string translation editor for Star Wars: Empire at War.",
      errorLog: "Diagnostic Error Console",
      xmlMapTitle: "Planets and Routes (XML)",
      xmlMapDesc: "Load and modify Planets.xml files. Position planets via coordinates, plot trade routes, and preview the 3D galaxy immediately.",
      loadModFolder: "Load Mod Data Folder",
      workspaceLoaded: "Workspace Active:",
      editGalaxy: "Edit Galaxy",
      selectFile: "Select a file...",
      datTitle: "Game Translations (.DAT)",
      datDesc: "Load translation .DAT files (such as MasterTextFile). Rapidly translate unit, faction, and planet loc keys, query duplicates, and add new ones.",
      loadDat: "Load MasterTextFile.dat",
      createEmptyDat: "Create Empty DAT",
      mtdTitle: "MegaTexture Atlas (.MTD)",
      mtdDesc: "Edit MegaTexture Database files (Mt_commandbar.mtd) that map UI icon coordinates over a sprite sheet texture (.TGA).",
      loadMtd: "Load .MTD File",
      xmlTitle: "Raw XML Editor",
      xmlDesc: "A quick, direct text editor for any Empire at War related XML file with automatic syntax formatting and node closing logic.",
      loadXml: "Load Generic XML",
      createEmptyXml: "Create Empty XML",
      luaTitle: "Raw LUA Editor",
      luaDesc: "A direct text editor for Lua scripts with syntax highlighting.",
      loadLua: "Load LUA Script",
      createEmptyLua: "Create Empty LUA",
      storyTitle: "Story Mode Editor",
      storyDesc: "Create and edit Campaign Story XML files.",
      loadStory: "Load Story XML",
      createStory: "New Story XML"
    },
    mtdEditor: {
      title: "MegaTexture Database Editor (.MTD)",
      textureMissing: "No texture loaded",
      loadTexture: "Load Texture (.TGA / .PNG)",
      saveBtn: "Save",
      closeBtn: "Close",
      iconsCount: "Icons",
      searchPlaceholder: "Search icon...",
      quickInsertTitle: "Import Image Icon",
      invalidDimensions: "Invalid dimensions",
      loadTexturePreview: "Load texture to preview graphic",
      expertUv: "Expert: UV Coords",
      loadTextureAtlas: "Load a texture atlas to view the calculated UV float mapping (0.0 - 1.0).",
      noIconSelected: "No Icon Selected",
      nameNewIcon: "Name New Icon",
      cancelBtn: "Cancel",
      addIconBtn: "Add Icon",
      list: {
        noResults: "No icons",
        deleteTitle: "Delete Icon"
      },
      editor: {
        idName: "Icon Name",
        width: "Width",
        height: "Height",
        iconProperties: "Icon Properties",
        boundsInfo: "Pixel Coordinates",
        u0: "Left (U0)",
        v0: "Top (V0)",
        u1: "Right (U1)",
        v1: "Bottom (V1)",
        pixelSpaceMode: "Pixels mapping"
      }
    },
    storyEditor: {
      title: "Story Editor",
      saveBtn: "Save",
      closeBtn: "Close",
      eventsCount: "Events",
      searchPlaceholder: "Search event...",
      properties: "Event Properties",
      addEventBtn: "Add Event",
      name: "Event Name",
      eventType: "Event Type",
      rewardType: "Reward Type",
      prereq: "Prerequisite",
      storyDialog: "Story Dialog",
      storyChapter: "Story Chapter",
      storyTag: "Story Tag",
      branch: "Branch",
      addParam: "Add Param",
      eventParams: "Event Parameters",
      rewardParams: "Reward Parameters",
      noEventSelected: "No Event Selected",
      cancelBtn: "Cancel",
      createBtn: "Create Event"
    },
    datEditor: {
      editorTitle: ".DAT Translation Editor",
      bulkImportBtn: "Bulk Import",
      saveDatBtn: "Save .DAT",
      closeBtn: "Close",
      stats: {
        total: "Total Translated",
        unique: "Unique Keys",
        empty: "Empty",
        duplicates: "Duplicates"
      },
      searchPlaceholder: "Search by key or text...",
      filters: {
        all: "All",
        empty: "Empty",
        duplicates: "Duplicates"
      },
      quickInsertTitle: "Add a new translation key",
      bulkImport: {
        title: "Bulk Import Translations",
        desc1: "Paste your keys and translations from Excel or Sheets. Separate with a Tab, equals sign (=) or semicolon (;).",
        desc2: "TEXT_PLANET_CORUSCANT_NAME = Coruscant",
        placeholder: "TEXT_UNIT_X_WING_NAME\tX-Wing\nTEXT_SPECIES_HUMAN\tHuman",
        cancel: "Cancel",
        confirm: "Confirm Import",
        success: "Success! Imported {count} records.",
        ignored: " Ignored {count} lines with invalid format.",
        errorNoText: "Please, enter text to import.",
        errorNoKeys: "Could not extract valid keys. Make sure to separate key and value with Tab, '=' or ';'."
      },
      list: {
        noResults: "No translations found",
        changeSearch: "Try changing the search term",
        untranslated: "[Untranslated]",
        copyKey: "Copy key",
        deleteTitle: "Delete translation"
      },
      pagination: {
        rowsPerPage: "Rows per page",
        of: "of"
      },
      editor: {
        idName: "Identifier Name",
        datKey: ".DAT Key",
        keyHint: "* Keys are used in XML for planets and units like",
        localizedText: "Localized Translation",
        formatUTF16: "UTF-16LE Format",
        placeholder: "Write the translation here...",
        charSize: "Character size:",
        byteSize: "Byte size:",
        b: "B",
        textLines: "Lines of text:",
        tipBox: "Tip: You can use normal line breaks (\\n) to separate paragraphs. The game renders them correctly for space descriptions of units and planets.",
        noSelection: "No translation selected",
        noSelectionDesc: "Select a key from the list on the left to edit its translation."
      },
      modal: {
        deleteTitle: "Delete Record",
        deleteDesc: "Are you sure you want to permanently delete this translation record?",
        cancel: "Cancel",
        delete: "Delete"
      },
      toastCopied: "Key copied to clipboard",
      toastNewKey: "English text / Localized text"
    },
    updater: {
      checkUpdate: "Check for updates",
      updateAvailable: "Update Available",
      updater: "Updater",
      downloading: "Downloading",
      downloadBtn: "Download v",
      restartBtn: "Restart & Install"
    }
  },
  es: {
    appTitle: "CORVUS // Herramienta de Modding EaW",
    currentEditor: "Modo Activo",
    active: "Espacio Activo",
    importPlanets: "Importar Planets.xml",
    importRoutes: "Importar TradeRoutes.xml",
    settings: "Ajustes",
    exportChanges: "Exportar Archivos XML",
    closeProject: "Cerrar Proyecto",
    planetsTab: "Planetas",
    routesTab: "Rutas Comerciales",
    noPlanetsTitle: "Sin Sistemas Galácticos Cargados",
    noPlanetsSubtitle: "Importe un archivo Planets.xml para cargar y diseñar su propio mapa galáctico virtual.",
    initEmptyDb: "Inicializar Base de Datos Vacía",
    userManual: "Manual de Usuario // Documentación",
    planetList: {
      newPlanet: "Nuevo Planeta",
      search: "Buscar planeta...",
      total: "Planetas Totales",
      hideCore: "Ocultar Arte del Centro",
      showCore: "Mostrar Arte del Centro",
      noSignal: "Ningún sistema estelar coincide",
      bulkEdit: "Edición en Masa"
    },
    routeList: {
      newRoute: "Nueva Ruta Comercial",
      search: "Buscar ruta...",
      total: "Rutas Totales",
      noSignal: "Ninguna ruta coincide",
      deleteRoute: "Eliminar Ruta"
    },
    planetEditor: {
      noPlanetActive: "Seleccione un sistema estelar para modificar sus propiedades",
      baseName: "Identificador XML (Name)",
      baseNameHelp: "El atributo 'Name' principal que referencia a este planeta en los datos XML del juego.",
      posX: "Coordenada X",
      posXHelp: "Posición espacial horizontal en la cuadrícula galáctica general.",
      posY: "Coordenada Y",
      posYHelp: "Posición espacial vertical en la cuadrícula galáctica general.",
      posZ: "Coordenada Z (Altura)",
      posZHelp: "Altura visual relativa en el mapa de juego táctico de la galaxia.",
      baseIncome: "Ingresos Base (Créditos)",
      baseIncomeHelp: "Suma fija de créditos ingresados por ciclo en la campaña estratégica de conquista.",
      modelScale: "Escala Visual en Mapa",
      modelScaleHelp: "Escala física del planeta en la pantalla de la galaxia. Normalmente oscila entre 0.8 y 1.5.",
      landStructs: "Ranuras Terrestres",
      landStructsHelp: "Espacio de construcción terrestre máximo para infantería, fábricas y defensas.",
      spaceStructs: "Ranuras Espaciales",
      spaceStructsHelp: "Espacio de desarrollo orbital máximo para estaciones y astilleros de transporte.",
      starbase: "Nivel de Base Estelar",
      starbaseHelp: "El rango máximo de estación espacial o astillero orbital de combate que se permite construir (1 a 5).",
      battleTerrain: "Mapa de Batalla Táctico",
      battleTerrainHelp: "Define los escenarios de combate físico que heredarán los encuentros tácticos espaciales y terrestres.",
      addXmlNode: "Añadir Nodo XML Personalizado",
      customNodeHelp: "Inserta un elemento XML nuevo o personalizado en los metadatos estructurados de este planeta."
    },
    routeEditor: {
      noRouteActive: "Seleccione una hiperruta de conexión para editar",
      routeName: "Identificación de Ruta XML",
      pointA: "Sistema Estelar A (Origen)",
      pointAHelp: "Puerta de salto e inicio del vector hiperespacial.",
      pointB: "Sistema Estelar B (Destino)",
      pointBHelp: "Puerta de salto y llegada del vector hiperespacial.",
      speedFactor: "Factor de Velocidad Híper",
      creditGain: "Bono de Valor Comercial"
    },
    settingsModal: {
      title: "Ajustes",
      general: "General",
      galaxyMap: "Planetas y Rutas (XML)",
      showGrid: "Mostrar Cuadrícula de Navegación",
      snapToGrid: "Ajustar Posición a la Rejilla",
      invertY: "Invertir Eje Y (Requerido para el motor de EaW)",
      gridSize: "Intervalo de Ajuste",
      language: "Idioma de la Interfaz",
      done: "Aplicar Configuración",
      english: "English (Standard)",
      spanish: "Español (Castellano)",
      storyEditor: "Editor de Historia (XML)",
      editableXml: "Activar Edición Directa de XML"
    },
    bulkEdit: {
      title: "Procesador de Atributos en Masa",
      warning: "Advertencia: Sustitución Selectiva",
      warningDesc: "Esta operación reescribirá irreversiblemente los valores de todos los planetas actualmente seleccionados.",
      selectAll: "Seleccionar Todos",
      deselectAll: "Anular Selección",
      apply: "Aplicar Sobrescritura en Bloque",
      cancel: "Descartar Cambios",
      targetProperty: "Propiedad XML Target",
      newValue: "Nuevo Valor del Parámetro"
    },
    errors: {
      importXml: "Error al procesar el archivo XML",
      readXml: "Error al leer el archivo",
      readDat: "Error al leer el archivo DAT",
      importDat: "Error al procesar el archivo DAT. Asegúrese de que es un archivo DAT de Petroglyph válido.",
      initDb: "Ocurrió un error inicializando la base de datos vacía",
      invalidPlanetSet: "El archivo debe llamarse Planets.xml o Planet.xml"
    },
    home: {
      title: "ESTACIÓN DE TRABAJO CORVUS",
      subtitle: "Editor integrado de mapas astronómicos (XML) y textos de traducción (.DAT) para Star Wars: Empire at War.",
      errorLog: "Consola de Diagnóstico de Errores",
      xmlMapTitle: "Planetas y Rutas (XML)",
      xmlMapDesc: "Carga y modifica archivos Planets.xml. Posiciona planetas mediante coordenadas, define rutas comerciales y previsualiza la galaxia tridimensional de inmediato.",
      loadModFolder: "Cargar Carpeta Data",
      workspaceLoaded: "Espacio de trabajo activo:",
      editGalaxy: "Editar Galaxia",
      selectFile: "Seleccionar archivo...",
      datTitle: "Traducciones Juego (.DAT)",
      datDesc: "Carga archivos de localización .DAT (como MasterTextFile). Traduce nombres de unidades, facciones y planetas, consulta claves duplicadas o añade nuevas de forma ágil.",
      loadDat: "Cargar MasterTextFile.dat",
      createEmptyDat: "Crear DAT vacío",
      mtdTitle: "Atlas MegaTextura (.MTD)",
      mtdDesc: "Edita archivos MegaTexture Database (Mt_commandbar.mtd) que mapean las coordenadas de los íconos de la interfaz sobre un atlas de texturas (.TGA).",
      loadMtd: "Cargar Archivo .MTD",
      xmlTitle: "Editor XML Crudo",
      xmlDesc: "Editor de texto crudo y directo para cualquier archivo XML de Empire at War. Cuenta con formateo de sintaxis avanzado y cierre de nodos.",
      loadXml: "Cargar XML Genérico",
      createEmptyXml: "Crear XML Vacío",
      luaTitle: "Editor LUA Crudo",
      luaDesc: "Editor de texto directo para scripts Lua con resaltado de sintaxis.",
      loadLua: "Cargar Script LUA",
      createEmptyLua: "Crear LUA Vacío",
      storyTitle: "Editor de Historias (Story)",
      storyDesc: "Crea y edita eventos de Historia (Campaign Story XML).",
      loadStory: "Cargar Story XML",
      createStory: "Nuevo XML de Historia"
    },
    mtdEditor: {
      title: "Editor de Base de Datos MegaTextura (.MTD)",
      textureMissing: "Sin textura plana",
      loadTexture: "Cargar Textura (.TGA / .PNG)",
      saveBtn: "Guardar",
      closeBtn: "Cerrar",
      iconsCount: "Íconos",
      searchPlaceholder: "Buscar ícono...",
      quickInsertTitle: "Importar Ícono/Imagen",
      invalidDimensions: "Dimensiones inválidas",
      loadTexturePreview: "Carga la textura para visualizar la imagen",
      expertUv: "Experto: Coords UV",
      loadTextureAtlas: "Carga un atlas de texturas para ver el mapeo flotante UV (0.0 - 1.0) calculado.",
      noIconSelected: "Ningún Ícono Seleccionado",
      nameNewIcon: "Nombrar Nuevo Ícono",
      cancelBtn: "Cancelar",
      addIconBtn: "Añadir Ícono",
      list: {
        noResults: "Sin resultados",
        deleteTitle: "Eliminar Ícono"
      },
      editor: {
        idName: "Nombre del Ícono",
        width: "Ancho (W)",
        height: "Alto (H)",
        iconProperties: "Propiedades del Ícono",
        boundsInfo: "Coordenadas del Píxel",
        u0: "Izquierda (X)",
        v0: "Arriba (Y)",
        u1: "Ancho (W)",
        v1: "Alto (H)",
        pixelSpaceMode: "Píxeles"
      }
    },
    storyEditor: {
      title: "Editor de Historias",
      saveBtn: "Guardar",
      closeBtn: "Cerrar",
      eventsCount: "Eventos",
      searchPlaceholder: "Buscar evento...",
      properties: "Propiedades del Evento",
      addEventBtn: "Añadir Evento",
      name: "Nombre del Evento",
      eventType: "Tipo de Evento",
      rewardType: "Tipo de Recompensa",
      prereq: "Prerrequisito (Prereq)",
      storyDialog: "Diálogo de Historia",
      storyChapter: "Capítulo (Chapter)",
      storyTag: "Etiqueta (Story Tag)",
      branch: "Rama (Branch)",
      addParam: "Añadir Parámetro",
      eventParams: "Parámetros de Evento",
      rewardParams: "Parámetros de Recompensa",
      noEventSelected: "Ningún Evento Seleccionado",
      cancelBtn: "Cancelar",
      createBtn: "Crear Evento"
    },
    datEditor: {
      editorTitle: "Editor de Traducciones .DAT",
      bulkImportBtn: "Importación Masiva",
      saveDatBtn: "Guardar .DAT",
      closeBtn: "Cerrar",
      stats: {
        total: "Total Traducido",
        unique: "Claves Únicas",
        empty: "Sin Traducir",
        duplicates: "Duplicados"
      },
      searchPlaceholder: "Buscar por clave o texto...",
      filters: {
        all: "Todos",
        empty: "Vacíos",
        duplicates: "Duplicados"
      },
      quickInsertTitle: "Añadir una nueva clave de traducción",
      bulkImport: {
        title: "Importar Traducciones Masivamente",
        desc1: "Pega tus claves y traducciones de Excel o Sheets. Sepáralas con un tabulador (Tab), signo de igual (=) o un punto y coma (;).",
        desc2: "TEXT_PLANET_CORUSCANT_NAME = Coruscant",
        placeholder: "TEXT_UNIT_X_WING_NAME\tCaza Ala-X\nTEXT_SPECIES_HUMAN\tHumano",
        cancel: "Cancelar",
        confirm: "Confirmar Importación",
        success: "¡Éxito! Se han importado {count} registros.",
        ignored: " Se ignoraron {count} líneas con formato inválido.",
        errorNoText: "Por favor, introduce texto para importar.",
        errorNoKeys: "No se pudieron extraer claves válidas del texto provisto. Asegúrate de separar la clave y traducción con un Tabulador (TAB), signo de igual (=) o punto y coma (;)."
      },
      list: {
        noResults: "No se encontraron traducciones",
        changeSearch: "Intenta cambiar el término de búsqueda",
        untranslated: "[Sin traducir]",
        copyKey: "Copiar clave",
        deleteTitle: "Eliminar traducción"
      },
      pagination: {
        rowsPerPage: "Filas por pág.",
        of: "de"
      },
      editor: {
        idName: "Nombre de Identificador",
        datKey: "Clave .DAT",
        keyHint: "* Las claves se usan en el código XML de los planetas y unidades como",
        localizedText: "Traducción Localizada",
        formatUTF16: "Formato UTF-16LE",
        placeholder: "Escribe la traducción aquí...",
        charSize: "Tamaño en caracteres:",
        byteSize: "Tamaño en bytes:",
        b: "B",
        textLines: "Líneas de texto:",
        tipBox: "Sugerencia: Puedes usar saltos de línea normales (\\n) para separar párrafos. En el juego se renderizan de forma correcta para las descripciones espaciales de unidades y planetas.",
        noSelection: "Ninguna traducción seleccionada",
        noSelectionDesc: "Selecciona una clave de la lista de la izquierda para editar su traducción."
      },
      modal: {
        deleteTitle: "Eliminar Registro",
        deleteDesc: "¿Estás seguro de que deseas eliminar este registro de traducción permanentemente?",
        cancel: "Cancelar",
        delete: "Eliminar"
      },
      toastCopied: "Clave copiada al portapapeles",
      toastNewKey: "Texto en español / Localized text"
    },
    updater: {
      checkUpdate: "Buscar actualizaciones",
      updateAvailable: "Actualización disponible",
      updater: "Actualizador",
      downloading: "Descargando",
      downloadBtn: "Descargar v",
      restartBtn: "Reiniciar e Instalar"
    }
  }
};

type Translations = typeof translations.en;

interface I18nContextType {
  t: Translations;
  lang: Language;
}

const I18nContext = createContext<I18nContextType>({ t: translations.en, lang: 'en' });

export const I18nProvider: React.FC<{ lang: Language; children: React.ReactNode }> = ({ lang, children }) => {
  return (
    <I18nContext.Provider value={{ t: translations[lang], lang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext).t;
export const useLanguage = () => useContext(I18nContext).lang;
