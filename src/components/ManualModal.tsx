import React, { useState } from 'react';
import { X, BookOpen, Download, HelpCircle, ArrowRight, Layers, MapPin, EyeOff, Radio, Settings as SettingsIcon, FileText, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../i18n';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const [activeTab, setActiveTab] = useState<string>('intro');
  const lang = useLanguage();
  const isEn = lang === 'en';

  if (!isOpen) return null;

  const tabs = isEn ? [
    {id: 'intro', label: '1. Introduction', icon: BookOpen},
    {id: 'import', label: '2. Import Files', icon: Layers},
    {id: 'planets', label: '3. Planet Editor', icon: MapPin},
    {id: 'routes', label: '4. Route Editor', icon: Radio},
    {id: 'translations', label: '5. Translations (.DAT)', icon: FileText},
    {id: 'mtd', label: '6. Sprite Atlas (.MTD)', icon: ImageIcon},
    {id: 'settings', label: '7. Map Options', icon: SettingsIcon},
    {id: 'export', label: '8. Save & Export', icon: Download},
  ] : [
    {id: 'intro', label: '1. Introducción', icon: BookOpen},
    {id: 'import', label: '2. Importar Archivos', icon: Layers},
    {id: 'planets', label: '3. Editor de Planetas', icon: MapPin},
    {id: 'routes', label: '4. Editor de Rutas', icon: Radio},
    {id: 'translations', label: '5. Traducciones (.DAT)', icon: FileText},
    {id: 'mtd', label: '6. Atlas Texturas (.MTD)', icon: ImageIcon},
    {id: 'settings', label: '7. Opciones de Mapa', icon: SettingsIcon},
    {id: 'export', label: '8. Guardar y Exportar', icon: Download},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4" id="manual-modal">
      <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700 shadow-2xl flex flex-col rounded-sm">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-purple-400">
                {isEn ? "User Manual // CORVUS" : "Manual de Usuario // CORVUS"}
              </h2>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Star Wars: Empire at War Galactic Map Architect</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-purple-400 transition-colors" id="close-manual-btn">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/50 p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block px-2.5 mb-2">
                {isEn ? "Contents" : "Contenidos"}
              </span>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`manual-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs uppercase tracking-wider transition-all rounded-sm ${
                      isActive 
                        ? 'bg-purple-900/30 text-purple-300 border-l-2 border-purple-400 font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-800 bg-slate-900/25 text-center">
              <span className="text-[8px] text-center text-slate-500 block font-mono">CORVUS v1.0.0</span>
            </div>
          </div>

          {/* Right Text Reading Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/10 text-slate-300 space-y-4">
            {activeTab === 'intro' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "1. Introduction to CORVUS" : "1. Introducción a CORVUS"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn ? (
                    <>
                      Welcome to <strong>CORVUS</strong>, the advanced virtual environment for galactic rendering, editing, and interconnection designed specifically for modders and developers of <strong>Star Wars: Empire at War</strong>.
                    </>
                  ) : (
                    <>
                      Bienvenido a <strong>CORVUS</strong>, el entorno virtual avanzado de visualización, edición e interconexión galáctica diseñado específicamente para modders y editores de <strong>Star Wars: Empire at War</strong>.
                    </>
                  )}
                </p>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn ? (
                    <>
                      This tool simplifies the traditional raw text-based editing workflow of the game's XML files, providing an interactive visual 2D viewport that directly modifies the underlying XML data structures in real-time.
                    </>
                  ) : (
                    <>
                      Esta herramienta simplifica el tradicional flujo de edición basado en texto crudo de los archivos XML del juego, ofreciendo una representación gráfica interactiva en 2D que interactúa directamente en tiempo real con las estructuras de datos XML subyacentes.
                    </>
                  )}
                </p>
                <div className="bg-slate-950/50 border border-slate-700/60 p-4 rounded-sm space-y-2">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    {isEn ? "Core Capabilities:" : "Capacidades Principales:"}
                  </span>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-slate-400">
                    <li>
                      <strong className="text-slate-300">
                        {isEn ? "Planet Mapping: " : "Mapeado de Planetas: "}
                      </strong>
                      {isEn ? "Two-dimensional representation of stellar coordinates with a unified database " : "Representación bidimensional de coordenadas estelares con base de datos unificada "}
                      (<code className="text-cyan-400 font-mono text-[10px]">Planets.xml</code>).
                    </li>
                    <li>
                      <strong className="text-slate-300">
                        {isEn ? "Hyperlane Routing: " : "Trazado de Hyperlanes: "}
                      </strong>
                      {isEn ? "Dynamic creation of hyperspace vectors for fleet and trade exchanges " : "Creación dinámica de vectores hiperespaciales de intercambio comercial "}
                      (<code className="text-cyan-400 font-mono text-[10px]">TradeRoutes.xml</code>).
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "2. Getting Started (Importing XMLs)" : "2. Empezando a trabajar (Importar XMLs)"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn 
                    ? "CORVUS reads official XML files from the XML directory of your Empire at War modification. To ensure logical dependencies resolve correctly, we strongly advise using this strict loading order:"
                    : "CORVUS lee los archivos XML oficiales del directorio de datos de tu modificación de Empire at War. Para garantizar que las dependencias lógicas se resuelvan correctamente, te recomendamos seguir este estricto orden de carga:"
                  }
                </p>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 bg-slate-950/40 p-3 border-l-2 border-cyan-500">
                    <div className="w-5 h-5 bg-cyan-950 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cyan-800">1</div>
                    <div>
                      <strong className="text-slate-200 text-xs uppercase block">Planets.xml ({isEn ? "Required" : "Requerido"})</strong>
                      <span className="text-xs text-slate-400">
                        {isEn 
                          ? "Mandatory primary load to map global galactic coordinate layouts for each planet and boot up the visual editor."
                          : "Carga principal obligatoria para dibujar las posiciones cartográficas galácticas globales de cada planeta e inicializar el editor físico."
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 bg-slate-950/40 p-3 border-l-2 border-cyan-700">
                    <div className="w-5 h-5 bg-cyan-950 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cyan-800">2</div>
                    <div>
                      <strong className="text-slate-200 text-xs uppercase block">TradeRoutes.xml ({isEn ? "Optional" : "Opcional"})</strong>
                      <span className="text-xs text-slate-400">
                        {isEn
                          ? "Imports trade hyperlanes and connects system gates via vector connections drawn in real-time."
                          : "Importa el trazado comercial y conecta los planetas a través de líneas vectoriales dibujadas en tiempo real."
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-950/25 border border-yellow-800/30 text-yellow-400 text-xs rounded-sm">
                  💡 <strong>{isEn ? "Expert Developer Note:" : "Nota del Experto:"}</strong> {isEn 
                    ? <>You can also click <strong className="text-cyan-400">"Initialize Empty Database"</strong> in the bottom-left corner if you wish to start a mod or galactic map completely from scratch without loading prior files.</>
                    : <>También puedes hacer clic en <strong className="text-cyan-400">"Initialize Empty Database"</strong> en la esquina inferior izquierda si deseas comenzar un mod o mapa galáctico completamente desde cero sin cargar archivos previos.</>
                  }
                </div>
              </div>
            )}

            {activeTab === 'planets' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "3. Planet Editor" : "3. Editor de Planetas"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn
                    ? "The PLANETS tab allows you to perform direct and detailed stellar modifications on any loaded world in space."
                    : "La pestaña de PLANETAS te permite realizar interacciones estelares directas y detalladas sobre cualquier planeta cargado en el espacio."
                  }
                </p>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-950/60 font-mono text-xs border border-slate-800 flex items-center justify-between">
                    <span>{isEn ? "Physical Planetary Positioning:" : "Posicionamiento Físico de Planetas:"}</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 py-0.5 px-2 border border-cyan-800">DRAG & DROP / MANUAL</span>
                  </div>
                  <p className="pl-2.5 text-slate-400 leading-relaxed">
                    {isEn
                      ? <>You can adjust the spatial position of each planet by physically dragging them across the galactic map with the mouse. For high-precision layout coordinates, use the <strong className="text-slate-200">X</strong> and <strong className="text-slate-200">Y</strong> input fields located in the editor sidebar to the right of the map.</>
                      : <>Puedes ajustar la posición espacial de cada planeta arrastrándolos físicamente sobre el mapa galáctico con el ratón. Para coordenadas milimétricas de diseño, puedes utilizar los inputs <strong className="text-slate-200">X</strong> e <strong className="text-slate-200">Y</strong> del panel de edición a la derecha del mapa.</>
                    }
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-950/60 font-mono text-xs border border-slate-800 flex items-center justify-between">
                    <span>{isEn ? "Stellar Infrastructure Settings:" : "Configuración de Infraestructura Estelar:"}</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 py-0.5 px-2 border border-cyan-800">XML NODE EDITS</span>
                  </div>
                  <p className="pl-2.5 text-slate-400 leading-relaxed font-sans">
                    {isEn ? "Modify critical variables required directly by the game engine, including:" : "Modifica variables críticas requeridas directamente por el motor del juego como:"}
                    <br />
                    - {isEn ? "Associated Special Units and Heroes." : "Unidades Especiales asociadas."}
                    <br />
                    - {isEn ? "Faction-specific stellar outpost levels " : "Modelos visuales estelares de facciones "} (<strong className="text-slate-300">Rebel_Star_Base_Level, Empire_Star_Base_Level, Pirate_Base_Level, Hutt_Base_Level</strong>).
                    <br />
                    - {isEn ? "Galactic outer atmosphere rendering " : "Modelo de atmósfera exterior de galaxia "} (<strong className="text-slate-300">Galaxy_Core_Art_Model</strong>, {isEn ? "which you can quickly hide using the header toggle button" : "el cual puedes ocultar con el botón"} <code className="bg-slate-950 px-1 px-1.5 py-0.5 text-purple-400 font-mono text-[10px]">SHW/HD</code> {isEn ? "if you wish to visually clear up the galactic core." : "de la cabecera si deseas despejar visualmente el núcleo galáctico."})
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'routes' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "4. Trade Route Editor (Hyperlanes)" : "4. Editor de Rutas (Hyperlanes)"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn
                    ? "Hyperlanes or Trade Routes define travel vectors that fleets and transport craft navigate along in the game's strategic space conquest mode."
                    : "Las rutas hiperespaciales (Trade Routes / Hyperlanes) definen las trayectorias de viaje que la flota espacial puede tomar en la interfaz estratégica militar del juego."
                  }
                </p>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-sm text-xs space-y-2">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 block font-bold">
                    {isEn ? "How to Create a Hyperspace Route:" : "Cómo crear una Ruta Hiperespacial:"}
                  </span>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                    <li>{isEn ? <>Navigate to the <strong className="text-slate-200">ROUTES</strong> tab in the left-hand navigation sidebar.</> : <>Selecciona la pestaña <strong className="text-slate-200">RUTAS</strong> en el panel de navegación izquierdo.</>}</li>
                    <li>{isEn ? <>Click the top header button labeled <strong className="text-cyan-400">"NEW ROUTE"</strong> or the <strong className="text-cyan-400">"+"</strong> sign.</> : <>Haz clic en el botón superior <strong className="text-cyan-400">"AÑADIR RUTA"</strong> o <strong className="text-cyan-400">"+"</strong>.</>}</li>
                    <li>{isEn ? <>Enter a unique XML identifier for the lane (e.g., <code className="text-orange-400 text-[10px] font-mono">Byss_To_Coruscant</code>).</> : <>Define el identificador único del XML para la ruta (p.ej.: <code className="text-orange-400 text-[10px] font-mono">Byss_To_Coruscant</code>).</>}</li>
                    <li>{isEn ? <>Select the connection star systems: <strong className="text-slate-300">Origin Planet (A)</strong> and <strong className="text-slate-300">Destination Planet (B)</strong>.</> : <>Selecciona las estaciones extremas de conexión: <strong className="text-slate-300">Planeta Inicial (A)</strong> y <strong className="text-slate-300">Planeta Final (B)</strong>.</>}</li>
                    <li>{isEn ? <>CORVUS will instantly compute the navigation line and plot the hyperlane on your galactic view.</> : <>CORVUS calculará la trayectoria inmediatamente y trazará la hyperline estelar en el plano de la galaxia.</>}</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'translations' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-purple-400 uppercase tracking-wider border-b border-purple-800 pb-2">
                  {isEn ? "5. Game Translations (.DAT)" : "5. Traducciones del Juego (.DAT)"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn
                    ? "In the initial home screen, you have access to the CORVUS WORKSTATION for translations. By selecting the Game Translations (.DAT) option, you can load and edit MasterTextFile.dat and other translation files."
                    : "En la pantalla de inicio inicial, tienes acceso a la ESTACIÓN DE TRABAJO CORVUS para traducciones. Al seleccionar la opción de Traducciones Juego (.DAT), puedes cargar y editar MasterTextFile.dat y otros archivos de traducción."
                  }
                </p>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-sm text-xs space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-purple-400 block font-bold mb-1">
                      {isEn ? "Import / Create" : "Importar / Crear"}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {isEn ? "Load an existing .DAT file or create a brand new one from scratch." : "Carga un archivo .DAT existente o crea uno nuevo desde cero."}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-purple-400 block font-bold mb-1">
                      {isEn ? "Bulk Import" : "Importación Masiva"}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {isEn ? "Paste lists of keys and translations from Excel or Google Sheets (separated by Tab, =, or ;) for quick, massive text additions." : "Pega listas de claves y traducciones desde Excel o Google Sheets (separadas por Tab, =, o ;) para adiciones de texto masivas y rápidas."}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-purple-400 block font-bold mb-1">
                      {isEn ? "Editing & Byte Specs" : "Edición y Specs de Bytes"}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {isEn ? "Select a key to edit its localized text. A byte size metric is included to ensure limits for large text descriptions are correctly formatted. Use normal \\n line breaks for proper in-game paragraph rendering." : "Selecciona una clave para editar su texto localizado. Se incluye una métrica de tamaño de bytes para controlar límites en descripciones largas. Usa saltos de línea \\n para renderizar párrafos correctamente en el juego."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mtd' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "6. Icon Atlas Mapping (.MTD)" : "6. Mapeo de Texturas (.MTD)"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn
                    ? "The MegaTexture Database Editor (.MTD) enables you to map 2D bounds to UI elements over master texture atlases. Perfect for setting up custom ability icons or tactical elements."
                    : "El Editor de Base de Datos MegaTextura (.MTD) te permite mapear las fronteras UV 2D de elementos de Interfaz sobre el atlas maestro. Ideal para ubicar iconos de héroe."
                  }
                </p>

                <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-sm space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 opacity-70">
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block mb-0.5">
                        {isEn ? "Loading Context" : "Conteo Visual de Referencia"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {isEn
                          ? "Load your .MTD file, then click 'Load Texture' to visually overlay the boundaries onto your .TGA / .PNG icon grid image."
                          : "Carga tu archivo .MTD y oprime 'Cargar Textura' para superponer los cuadros UV sobre el gráfico tga y poder orientarte correctamente."
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 opacity-70">
                      <SettingsIcon className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 block mb-0.5">
                        {isEn ? "Precision & UV Coords" : "Precisión y Coordenadas UV"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {isEn
                          ? "The MTD natively uses precise X,Y,Width,Height pixel boundaries. However, an 'Expert UV' panel shows the equivalent Float points (0.0 to 1.0) automatically."
                          : "El MTD nativamente usa fronteras de píxeles exactas (X,Y,Ancho,Alto). Ahora existe un panel Experto UV que calcula las fracciones 0.0 - 1.0 automáticamente para referencia del motor gráfico."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "7. General Map Options" : "7. Opciones Generales del Mapa"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn
                    ? "Open the Settings modal by clicking the gear icon in the top right corner to configure your mapping preference settings:"
                    : "Entra a la ventana de Ajustes haciendo clic en el icono del engranaje en la esquina superior derecha para calibrar las preferencias de modelado estelar:"
                  }
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 p-3 border border-slate-800 rounded-sm">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase mb-1">
                      {isEn ? "Y-Axis Inversion" : "Inversión del Eje Y"}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isEn
                        ? "By default, the Empire at War engine renders the vertical Y coordinates inverted compared to standard screen vectors. Turn this optional calibration ON to accurately sync coordinate files with the engine outputs."
                        : "Por defecto, el motor gráfico de Empire at War utiliza el sistema de coordenadas de inversión vertical. Activa esta opción para sincronizar el plano de coordenadas local con el del juego en el XML."
                      }
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-3 border border-slate-800 rounded-sm">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase mb-1">
                      {isEn ? "Grid Alignment Snapping" : "Ajuste a Rejilla (Grid Snapping)"}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isEn
                        ? "Constrains planetary movement steps to precise grid intervals (e.g., in offsets of 5 or 10 coordinate steps) to support clean, proportional spacing across your custom campaign configurations."
                        : "Bloquea el movimiento de los planetas a intervalos regulares (p.ej.: cada 5 o 10 puntos de coordenadas) para mantener un espaciado geométrico impecable y alineado en tu mapa de la campaña."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2">
                  {isEn ? "8. Saving & Exporting Changes" : "8. Guardar y Exportar Cambios"}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isEn
                    ? "All modifications you apply to coordinates, planet files, or hyperspace routes live inside temporary browser states. To package them into your game compilation:"
                    : "Tus modificaciones tácticas en planetas, coordenadas y nuevas hyperlines comerciales residen temporalmente dentro de la memoria del navegador. Para desplegarlas físicamente en tu MOD:"
                  }
                </p>

                <div className="bg-slate-950/65 p-4 border border-cyan-900 border-l-4 text-xs space-y-2 font-mono">
                  <span className="text-[10px] text-cyan-400 font-bold block">
                    {isEn ? "COMPILATION & DISPATCH STEPS:" : "PASOS DE COMPILACIÓN E INSTALACIÓN:"}
                  </span>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-xs">
                    <li>
                      {isEn 
                        ? <>Click the <strong className="text-cyan-300">"EXPORT XML FILES"</strong> button on the master top deck.</>
                        : <>Haz clic en el botón <strong className="text-cyan-300">"EXPORTAR CAMBIOS"</strong> en el panel de control superior.</>
                      }
                    </li>
                    <li>
                      {isEn
                        ? <>The corrected documents will download automatically with <code className="text-cyan-400 text-[10px]">_Modified.xml</code> attached to their names.</>
                        : <>Se descargarán automáticamente los archivos editados con el sufijo <code className="text-cyan-400 text-[10px]">_Modified.xml</code>.</>
                      }
                    </li>
                    <li>
                      {isEn
                        ? <>Place these updated configuration files directly inside your modification's <code className="text-cyan-400 text-[10px]">Data/XML/</code> workspace.</>
                        : <>Sustituye estos archivos dentro de la carpeta <code className="text-cyan-400 text-[10px]">Data/XML/</code> de tu Mod o directorio de juego de Empire at War.</>
                      }
                    </li>
                    <li>
                      {isEn
                        ? <>Rename the assets back to their base labels (deleting the <code className="text-purple-400 text-[10px]">_Modified</code> tag) so the core engine correctly scans the properties.</>
                        : <>Renombra los archivos retirando el sufijo <code className="text-purple-400 text-[10px]">_Modified</code> para que el motor del juego reconozca los nombres oficiales de los archivos.</>
                      }
                    </li>
                  </ol>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-900/30 text-rose-300 text-xs rounded-sm">
                  ⚠️ <strong>{isEn ? "Critical Reminder:" : "¡Importante!"}</strong> {isEn
                    ? "Always secure a functional source copy (backup) of your base game data files before rewriting any of them."
                    : "Recuerda tener siempre una copa de seguridad (backup) de tus archivos originales XML intactos antes de reemplazarlos."
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
            {isEn ? "CORVUS Galactic Engine. May the Force be with you." : "CORVUS Galactic Engine. Que la Fuerza te acompañe."}
          </span>
          <button 
            onClick={onClose} 
            className="px-6 py-1.5 bg-purple-700/80 text-purple-100 hover:bg-purple-600 border border-purple-500 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
            id="manual-modal-confirm-btn"
          >
            {isEn ? "Understood" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}
