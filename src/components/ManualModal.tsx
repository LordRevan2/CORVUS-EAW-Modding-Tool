import React, { useState } from 'react';
import { X, BookOpen, Download, Layers, MapPin, Radio, Settings as SettingsIcon, FileText, Image as ImageIcon, RefreshCw, MessageSquare } from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import packageJson from '../../package.json';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const [activeTab, setActiveTab] = useState<string>('intro');
  const lang = useLanguage();

  if (!isOpen) return null;

  const tabs = [
    { id: 'intro', label: tr(lang, '1. Introduction', '1. Introducción', '1. Introduction'), icon: BookOpen },
    { id: 'import', label: tr(lang, '2. Import Files', '2. Importar Archivos', '2. Importer des Fichiers'), icon: Layers },
    { id: 'planets', label: tr(lang, '3. Planet Editor', '3. Editor de Planetas', '3. Éditeur de Planètes'), icon: MapPin },
    { id: 'routes', label: tr(lang, '4. Route Editor', '4. Editor de Rutas', '4. Éditeur de Routes'), icon: Radio },
    { id: 'translations', label: tr(lang, '5. Translations (.DAT)', '5. Traducciones (.DAT)', '5. Traductions (.DAT)'), icon: FileText },
    { id: 'mtd', label: tr(lang, '6. Mega Textures (.MTD)', '6. Mega Texturas (.MTD)', '6. MegaTextures (.MTD)'), icon: ImageIcon },
    { id: 'dialog', label: tr(lang, '7. Dialog Options', '7. Opciones de Diálogo', '7. Options de Dialogue'), icon: MessageSquare },
    { id: 'settings', label: tr(lang, '8. Map Options', '8. Opciones de Mapa', '8. Options de Carte'), icon: SettingsIcon },
    { id: 'updates', label: tr(lang, '9. Updates', '9. Actualizaciones', '9. Mises à Jour'), icon: RefreshCw },
    { id: 'export', label: tr(lang, '10. Save & Export', '10. Guardar y Exportar', '10. Enregistrer & Exporter'), icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4" id="manual-modal">
      <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-purple-800/50 shadow-[0_0_40px_rgba(168,85,247,0.12)] flex flex-col rounded-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-purple-900/40 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-purple-500/15 border border-purple-500/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-purple-400">
                {tr(lang, "User Manual // CORVUS", "Manual de Usuario // CORVUS", "Manuel d'Utilisation // CORVUS")}
              </h2>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
                Star Wars: Empire at War Tactical Modding Suite
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-purple-400 transition-colors cursor-pointer" id="close-manual-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/60 p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-slate-500 block px-2.5 mb-2">
                {tr(lang, "Contents", "Contenidos", "Sommaire")}
              </span>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`manual-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs font-mono uppercase tracking-wider transition-all rounded-sm cursor-pointer ${
                      isActive
                        ? 'bg-purple-900/30 text-purple-300 border-l-2 border-purple-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-800 bg-slate-900/25 text-center">
              <span className="text-[9px] text-center text-slate-500 block font-mono">CORVUS v{packageJson.version}</span>
            </div>
          </div>

          {/* Right Text Reading Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/10 text-slate-300 space-y-4 custom-scrollbar">
            {activeTab === 'intro' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "1. Introduction to CORVUS", "1. Introducción a CORVUS", "1. Introduction à CORVUS")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "Welcome to CORVUS, the tactical modding workstation for galactic rendering, XML/Lua scripting, and localization engineered specifically for modders and developers of Star Wars: Empire at War.",
                    "Bienvenido a CORVUS, la estación de trabajo táctica de visualización galáctica, scripting XML/Lua y localización diseñada específicamente para modders y desarrolladores de Star Wars: Empire at War.",
                    "Bienvenue dans CORVUS, le poste de travail tactique de cartographie galactique, de scripting XML/Lua et de localisation conçu spécialement pour les moddeurs de Star Wars: Empire at War."
                  )}
                </p>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "This tool streamlines the traditional raw text-based editing workflow of the game's XML, Lua, DAT, and MTD files, providing interactive visual viewports and diagnostic auditors that directly modify the underlying structures in real time.",
                    "Esta herramienta simplifica el tradicional flujo de edición basado en texto crudo de los archivos XML, Lua, DAT y MTD del juego, ofreciendo visores interactivos y auditores de diagnóstico en tiempo real.",
                    "Cet outil simplifie le flux d'édition traditionnel des fichiers XML, Lua, DAT et MTD du jeu en offrant des vues interactives en temps réel et des auditeurs de diagnostic intégrés."
                  )}
                </p>
                <div className="bg-slate-950/50 border border-slate-700/60 p-4 rounded-sm space-y-2">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    {tr(lang, "Core Capabilities:", "Capacidades Principales:", "Capacités Principales :")}
                  </span>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-slate-400">
                    <li>
                      <strong className="text-slate-300">
                        {tr(lang, "Planet Mapping (v2.5): ", "Mapeado de Planetas (v2.5): ", "Cartographie des Planètes (v2.5) : ")}
                      </strong>
                      {tr(
                        lang,
                        "2D representation of stellar coordinates with a unified database ",
                        "Representación bidimensional de coordenadas estelares con base de datos unificada ",
                        "Représentation bidimensionnelle des coordonnées stellaires avec base de données unifiée "
                      )}
                      (<code className="text-cyan-400 font-mono text-[10px]">Planets.xml</code>).
                    </li>
                    <li>
                      <strong className="text-slate-300">
                        {tr(lang, "Hyperlane Routing: ", "Trazado de Hyperlanes: ", "Traçage d'Hypervoies : ")}
                      </strong>
                      {tr(
                        lang,
                        "Dynamic creation of hyperspace vectors for fleet and trade exchanges ",
                        "Creación dinámica de vectores hiperespaciales de intercambio comercial ",
                        "Création dynamique de vecteurs hyperespaces pour les flottes et routes commerciales "
                      )}
                      (<code className="text-cyan-400 font-mono text-[10px]">TradeRoutes.xml</code>).
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "2. Getting Started (Importing XMLs)", "2. Empezando a trabajar (Importar XMLs)", "2. Prise en Main (Importation XML)")}
                </h3>
                <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-sm space-y-3 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 opacity-70">
                      <Layers className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 block mb-0.5 uppercase tracking-wide font-mono">
                        {tr(lang, "Workspace Flow (Recommended)", "Flujo de Trabajo (Recomendado)", "Flux d'Espace de Travail (Recommandé)")}
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tr(
                          lang,
                          "You can load your entire 'Data' folder directly from the home screen workspace panel. CORVUS indexes the directory and feeds related files into the Galaxy, Campaign, Story, Unit, DAT, MTD, XML, and Lua editors under a unified state.",
                          "Puedes cargar tu carpeta entera de 'Data' directamente desde la pantalla de inicio. CORVUS memorizará el directorio y alimentará de forma inteligente los editores de Galaxia, Campañas, Historia, Unidades, DAT, MTD, XML y Lua.",
                          "Vous pouvez charger l'intégralité de votre dossier 'Data' depuis l'écran d'accueil. CORVUS indexe le répertoire et alimente automatiquement les éditeurs Galaxie, Campagnes, Histoire, Unités, DAT, MTD, XML et Lua."
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 mt-6 font-mono">
                  {tr(lang, "Manual XML Loading", "Carga Manual de XMLs", "Chargement Manuel des XML")}
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "If you prefer loading individual files manually, use this loading order:",
                    "Si prefieres trabajar manualmente conectando archivos sueltos, utiliza este orden:",
                    "Si vous préférez charger des fichiers individuels manuellement, suivez cet ordre :"
                  )}
                </p>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 bg-slate-950/40 p-3 border-l-2 border-cyan-500">
                    <div className="w-5 h-5 bg-cyan-950 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cyan-800">1</div>
                    <div>
                      <strong className="text-slate-200 text-xs uppercase block font-mono">Planets.xml ({tr(lang, "Required", "Requerido", "Requis")})</strong>
                      <span className="text-xs text-slate-400">
                        {tr(
                          lang,
                          "Mandatory primary load to map global galactic coordinate layouts for each planet.",
                          "Carga principal obligatoria para dibujar las posiciones cartográficas galácticas de cada planeta.",
                          "Chargement principal obligatoire pour cartographier les coordonnées galactiques de chaque planète."
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 bg-slate-950/40 p-3 border-l-2 border-cyan-700">
                    <div className="w-5 h-5 bg-cyan-950 text-cyan-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cyan-800">2</div>
                    <div>
                      <strong className="text-slate-200 text-xs uppercase block font-mono">TradeRoutes.xml ({tr(lang, "Optional", "Opcional", "Optionnel")})</strong>
                      <span className="text-xs text-slate-400">
                        {tr(
                          lang,
                          "Imports trade hyperlanes and connects system gates via vector connections drawn in real time.",
                          "Importa el trazado comercial y conecta los planetas a través de líneas vectoriales en tiempo real.",
                          "Importe les hypervoies commerciales et relie les systèmes stellaires en temps réel."
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'planets' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "3. Planet Editor (v2.5)", "3. Editor de Planetas (v2.5)", "3. Éditeur de Planètes (v2.5)")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "The PLANETS tab allows you to perform direct and detailed stellar modifications on any loaded world in space.",
                    "La pestaña de PLANETAS te permite realizar interacciones estelares directas y detalladas sobre cualquier planeta cargado en el espacio.",
                    "L'onglet PLANÈTES vous permet d'effectuer des modifications stellaires directes et détaillées sur chaque monde chargé."
                  )}
                </p>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-950/60 font-mono text-xs border border-slate-800 flex items-center justify-between">
                    <span>{tr(lang, "Physical Planetary Positioning:", "Posicionamiento Físico de Planetas:", "Positionnement Physique des Planètes :")}</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 py-0.5 px-2 border border-cyan-800">DRAG & DROP / MANUAL</span>
                  </div>
                  <p className="pl-2.5 text-slate-400 leading-relaxed">
                    {tr(
                      lang,
                      "Adjust the spatial position of each planet by physically dragging them across the galactic map with the mouse, or use the X and Y input fields in the right inspector.",
                      "Ajusta la posición espacial de cada planeta arrastrándolos físicamente sobre el mapa galáctico con el ratón o mediante los campos X e Y del panel derecho.",
                      "Ajustez la position spatiale de chaque planète en la faisant glisser sur la carte galactique à la souris, ou via les champs X et Y du panneau droit."
                    )}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-950/60 font-mono text-xs border border-slate-800 flex items-center justify-between">
                    <span>{tr(lang, "Background Images / Blueprints:", "Plantillas / Imágenes de Fondo:", "Images de Fond / Plans :")}</span>
                    <span className="text-[10px] bg-amber-950 text-amber-400 py-0.5 px-2 border border-amber-800">UI GUIDES</span>
                  </div>
                  <p className="pl-2.5 text-slate-400 leading-relaxed">
                    {tr(
                      lang,
                      "Upload a custom background image map directly into the viewport to visually align planets based on any external galaxy blueprint overlay.",
                      "Carga una imagen de mapa como fondo base en el visor para orientar visualmente los mundos sobre tu plano galáctico de referencia.",
                      "Importez une image de carte en arrière-plan dans le visualiseur pour aligner visuellement vos planètes sur un plan galactique de référence."
                    )}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'routes' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "4. Trade Route Editor (Hyperlanes)", "4. Editor de Rutas (Hyperlanes)", "4. Éditeur de Routes (Hypervoies)")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "Hyperlanes or Trade Routes define travel vectors that fleets navigate along in the game's strategic space conquest mode.",
                    "Las rutas hiperespaciales (Trade Routes / Hyperlanes) definen las trayectorias de viaje que las flotas pueden tomar en el modo estratégico.",
                    "Les hypervoies ou routes commerciales définissent les trajectoires de navigation des flottes sur la carte de conquête galactique."
                  )}
                </p>
              </div>
            )}

            {activeTab === 'translations' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-purple-400 uppercase tracking-wider border-b border-purple-800 pb-2 font-mono">
                  {tr(lang, "5. Game Translations (.DAT v1.2)", "5. Traducciones del Juego (.DAT v1.2)", "5. Traductions du Jeu (.DAT v1.2)")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "Load and edit MasterTextFile.dat and other binary Petroglyph localization files in UTF-16LE format with bulk import and duplicate detection.",
                    "Carga y edita MasterTextFile.dat y otros archivos binarios de localización de Petroglyph en formato UTF-16LE con importación masiva y detección de duplicados.",
                    "Chargez et éditez MasterTextFile.dat et d'autres fichiers binaires de localisation Petroglyph au format UTF-16LE avec importation en masse et détection des doublons."
                  )}
                </p>
              </div>
            )}

            {activeTab === 'mtd' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "6. Mega Textures (.MTD v1.1)", "6. Mega Texturas (.MTD v1.1)", "6. MegaTextures (.MTD v1.1)")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "The Mega Texture Manager (.MTD) maps UI sprites and icons to large parent texture atlases (.TGA / .PNG) with automatic UV calculation.",
                    "El gestor de Mega Texturas (.MTD) mapea sprites e iconos de interfaz sobre atlas de texturas (.TGA / .PNG) con cálculo automático de coordenadas UV.",
                    "Le gestionnaire MegaTexture (.MTD) associe les icônes d'interface aux grands atlas de textures (.TGA / .PNG) avec calcul automatique des coordonnées UV."
                  )}
                </p>
              </div>
            )}

            {activeTab === 'dialog' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "7. Dialog & Story Tools", "7. Herramientas de Diálogo e Historia", "7. Outils de Dialogue et d'Histoire")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "Create and simulate cinematic Holo-Terminal transmissions, campaign Story XML event graphs, and Lua 5.0 state scripts.",
                    "Crea y simula transmisiones cinemáticas del Holo-Terminal, grafos de eventos Story XML de campaña y scripts de estados en Lua 5.0.",
                    "Créez et simulez des transmissions cinématiques Holo-Terminal, des graphes d'événements Story XML et des scripts d'états Lua 5.0."
                  )}
                </p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "8. General Map & Language Options", "8. Opciones Generales e Idioma", "8. Options Générales et Langue")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "Switch the interface language dynamically between English (EN), Spanish (ES), and French (FR) from the top HUD bar or Settings modal, and calibrate Y-axis inversion and grid snapping.",
                    "Cambia el idioma de la interfaz dinámicamente entre Inglés (EN), Español (ES) y Francés (FR) desde la barra superior HUD o la ventana de Ajustes, y calibra la inversión del eje Y y el ajuste a rejilla.",
                    "Changez dynamiquement la langue de l'interface entre l'anglais (EN), l'espagnol (ES) et le français (FR) depuis la barre supérieure HUD ou les Paramètres, et calibrez l'inversion de l'axe Y et la grille."
                  )}
                </p>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "9. Application Updates", "9. Actualizaciones", "9. Mises à Jour de l'Application")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "If you are running the native Desktop version (Electron), you can check for software updates and install them automatically from the top header.",
                    "Si utilizas la versión de escritorio nativa (Electron), puedes comprobar e instalar actualizaciones desde la barra superior.",
                    "Si vous utilisez la version Bureau native (Electron), vous pouvez vérifier et installer les mises à jour directement depuis la barre supérieure."
                  )}
                </p>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-800 pb-2 font-mono">
                  {tr(lang, "10. Saving & Exporting Changes", "10. Guardar y Exportar Cambios", "10. Enregistrer et Exporter les Modifications")}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    "Export your modified XML, .DAT, .MTD, .TXT, or .LUA files directly from each tool's top command bar and place them inside your mod's Data/ folder.",
                    "Exporta tus archivos XML, .DAT, .MTD, .TXT o .LUA modificados directamente desde la barra de comandos superior de cada herramienta y colócalos en la carpeta Data/ de tu mod.",
                    "Exportez vos fichiers XML, .DAT, .MTD, .TXT ou .LUA modifiés depuis la barre de commande supérieure de chaque outil et placez-les dans le dossier Data/ de votre mod."
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
            {tr(
              lang,
              "CORVUS Galactic Engine. May the Force be with you.",
              "CORVUS Galactic Engine. Que la Fuerza te acompañe.",
              "CORVUS Galactic Engine. Que la Force soit avec vous."
            )}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-purple-700/80 text-purple-100 hover:bg-purple-600 border border-purple-500 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-colors cursor-pointer"
            id="manual-modal-confirm-btn"
          >
            {tr(lang, "Understood", "Entendido", "Compris")}
          </button>
        </div>
      </div>
    </div>
  );
}
