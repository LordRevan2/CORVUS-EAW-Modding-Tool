import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Download,
  Layers,
  MapPin,
  Settings as SettingsIcon,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Shield,
  Database,
  Code,
  Terminal,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
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
    {
      id: 'intro',
      label: tr(lang, '1. Introduction', '1. Introducción', '1. Introduction'),
      badge: 'CORE',
      icon: BookOpen,
    },
    {
      id: 'import',
      label: tr(lang, '2. Workspace & Import', '2. Workspace e Importación', '2. Workspace & Import'),
      badge: 'DATA',
      icon: Layers,
    },
    {
      id: 'planets',
      label: tr(lang, '3. Galaxy & Planets', '3. Galaxia y Planetas', '3. Galaxie & Planètes'),
      badge: 'v2.5',
      icon: Globe,
    },
    {
      id: 'campaigns',
      label: tr(lang, '4. Galactic Conquest', '4. Conquista Galáctica', '4. Conquête Galactique'),
      badge: 'v3.1',
      icon: Shield,
    },
    {
      id: 'story',
      label: tr(lang, '5. Story Campaigns', '5. Eventos de Historia', '5. Campagnes Histoire'),
      badge: 'v2.1',
      icon: Sparkles,
    },
    {
      id: 'units',
      label: tr(lang, '6. Unit Balance', '6. Balance de Unidades', '6. Équilibrage Unités'),
      badge: 'v1.1',
      icon: Database,
    },
    {
      id: 'translations',
      label: tr(lang, '7. Translations (.DAT)', '7. Traducciones (.DAT)', '7. Traductions (.DAT)'),
      badge: 'v1.3',
      icon: FileText,
    },
    {
      id: 'mtd',
      label: tr(lang, '8. Mega Textures (.MTD)', '8. Mega Texturas (.MTD)', '8. MegaTextures (.MTD)'),
      badge: 'v1.3',
      icon: ImageIcon,
    },
    {
      id: 'dialog',
      label: tr(lang, '9. Dialog & Briefings', '9. Diálogos y Guiones', '9. Dialogues & Briefings'),
      badge: 'v1.1',
      icon: MessageSquare,
    },
    {
      id: 'rawxml',
      label: tr(lang, '10. Raw XML Editor', '10. Editor Código XML', '10. Éditeur Code XML'),
      badge: 'v2.1',
      icon: Code,
    },
    {
      id: 'rawlua',
      label: tr(lang, '11. Raw LUA 5.0 IDE', '11. Editor Script LUA', '11. Éditeur Script LUA'),
      badge: 'v2.2',
      icon: Terminal,
    },
    {
      id: 'export',
      label: tr(lang, '12. Settings, Updates & Export', '12. Ajustes, Updates y Exportar', '12. Options, MAJ & Export'),
      badge: 'SYS',
      icon: Download,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4" id="manual-modal">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 border border-purple-800/50 shadow-[0_0_40px_rgba(168,85,247,0.12)] flex flex-col rounded-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-purple-900/40 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-purple-500/15 border border-purple-500/40 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-purple-400">
                {tr(lang, 'User Manual // CORVUS Documentation', 'Manual de Usuario // Documentación CORVUS', "Manuel d'Utilisation // Documentation CORVUS")}
              </h2>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
                {tr(
                  lang,
                  'Complete Tool Reference & Workflow Guide — Star Wars: Empire at War Modding Suite',
                  'Referencia Completa de Herramientas y Flujo de Trabajo — Suite de Modding Star Wars: Empire at War',
                  'Référence Complète des Outils et Guide de Travail — Suite de Modding Star Wars: Empire at War'
                )}
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
          <div className="w-72 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between shrink-0">
            <div className="p-3 overflow-y-auto custom-scrollbar space-y-1 flex-1">
              <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-slate-500 block px-2.5 mb-2">
                {tr(lang, 'Manual Index & Tools', 'Índice y Herramientas', 'Sommaire & Outils')}
              </span>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`manual-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-left text-[11px] font-mono uppercase tracking-wider transition-all rounded-sm cursor-pointer ${
                      isActive
                        ? 'bg-purple-900/35 text-purple-200 border-l-2 border-purple-400 font-bold shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-1">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded-sm border shrink-0 ${
                        isActive
                          ? 'bg-purple-950/90 text-purple-300 border-purple-500/50'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between px-4">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">CORVUS SUITE</span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-950 border border-amber-400/80">
                v{packageJson.version}
              </span>
            </div>
          </div>

          {/* Right Text Reading Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/10 text-slate-300 space-y-5 custom-scrollbar">
            {/* 1. INTRODUCTION */}
            {activeTab === 'intro' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-cyan-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    {tr(lang, '1. Introduction to CORVUS', '1. Introducción a CORVUS', '1. Introduction à CORVUS')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 rounded-sm">
                    ALAMO ENGINE WORKSTATION
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'Welcome to CORVUS, the comprehensive tactical modding workstation built specifically for Star Wars: Empire at War and Forces of Corruption. Instead of editing thousands of raw lines across disconnected text and binary files, CORVUS unifies your entire mod into interactive visual viewports, specialized inspectors, and real-time syntax auditors.',
                    'Bienvenido a CORVUS, la estación de trabajo táctica integral diseñada específicamente para el modding de Star Wars: Empire at War y Forces of Corruption. En lugar de editar miles de líneas de código a ciegas entre ficheros de texto y binarios desconectados, CORVUS unifica todo tu mod en visores interactivos, inspectores especializados y auditores en tiempo real.',
                    "Bienvenue dans CORVUS, le poste de travail tactique complet conçu spécialement pour le modding de Star Wars: Empire at War et Forces of Corruption. Au lieu d'éditer des milliers de lignes brutes dans des fichiers séparés, CORVUS unifie tout votre mod via des éditeurs visuels interactifs et des auditeurs en temps réel."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-950/60 border border-cyan-900/50 p-3.5 rounded-sm space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                      {tr(lang, 'Galaxy & Strategy (4 Tools)', 'Galaxia y Estrategia (4 Herramientas)', 'Galaxie & Stratégie (4 Outils)')}
                    </span>
                    <ul className="text-[11px] space-y-1 text-slate-400 font-mono">
                      <li>• {tr(lang, 'Galaxy & Planets (v2.5)', 'Galaxia y Planetas (v2.5)', 'Galaxie & Planètes (v2.5)')}</li>
                      <li>• {tr(lang, 'Galactic Conquest (v3.1)', 'Conquista Galáctica (v3.1)', 'Conquête Galactique (v3.1)')}</li>
                      <li>• {tr(lang, 'Story Event Plots (v2.1)', 'Eventos de Historia (v2.1)', 'Événements Histoire (v2.1)')}</li>
                      <li>• {tr(lang, 'Unit Stat Balance (v1.1)', 'Balance de Unidades (v1.1)', 'Équilibrage Unités (v1.1)')}</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/60 border border-purple-900/50 p-3.5 rounded-sm space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
                      {tr(lang, 'Localization & UI (3 Tools)', 'Localización e Interfaz (3 Herramientas)', 'Localisation & UI (3 Outils)')}
                    </span>
                    <ul className="text-[11px] space-y-1 text-slate-400 font-mono">
                      <li>• {tr(lang, 'MasterTextFile .DAT (v1.3)', 'Traducciones .DAT (v1.3)', 'Traductions .DAT (v1.3)')}</li>
                      <li>• {tr(lang, 'Mega-Texture .MTD (v1.2)', 'Mega-Texturas .MTD (v1.2)', 'MegaTextures .MTD (v1.2)')}</li>
                      <li>• {tr(lang, 'Dialog & Briefings .TXT (v1.1)', 'Diálogos y Guiones .TXT (v1.1)', 'Dialogues .TXT (v1.1)')}</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/60 border border-amber-900/50 p-3.5 rounded-sm space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                      {tr(lang, 'Code & Scripting (2 Tools)', 'Código y Scripting (2 Herramientas)', 'Code & Scripting (2 Outils)')}
                    </span>
                    <ul className="text-[11px] space-y-1 text-slate-400 font-mono">
                      <li>• {tr(lang, 'Raw XML DOM Editor (v2.1)', 'Editor Código XML (v2.1)', 'Éditeur Code XML (v2.1)')}</li>
                      <li>• {tr(lang, 'Raw LUA 5.0 IDE (v2.1)', 'IDE Scripts LUA 5.0 (v2.1)', 'IDE Scripts LUA 5.0 (v2.1)')}</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-sm space-y-2">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    {tr(lang, 'Cross-Tool Intelligence (Shared Memory)', 'Inteligencia Cruzada entre Herramientas', 'Intelligence Croisée entre Outils')}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tr(
                      lang,
                      'All tools in CORVUS communicate with each other: when you load a MasterTextFile.dat file, every other tool (Planets, Galactic Conquest, Story Plots, Dialog Editor, and Raw XML) automatically displays the translated names next to internal TEXT_* IDs. Similarly, loading Planets.xml populates planet selectors and interactive maps across the Galactic Conquest and Story Campaign editors.',
                      'Todas las herramientas de CORVUS se comunican entre sí: al cargar un archivo MasterTextFile.dat, el resto de herramientas (Planetas, Conquista Galáctica, Eventos de Historia, Diálogos y XML) muestran automáticamente los textos traducidos junto a los identificadores TEXT_*. Del mismo modo, al cargar Planets.xml se habilitan los mapas y selectores de planetas en el Editor de Campañas e Historia.',
                      "Tous les outils CORVUS communiquent entre eux : lorsque vous chargez un fichier MasterTextFile.dat, tous les autres éditeurs (Planètes, Conquête Galactique, Histoire, Dialogues et XML) affichent automatiquement les traductions à côté des identifiants TEXT_*. De même, charger Planets.xml alimente la carte et les listes de planètes dans les éditeurs de Campagne et d'Histoire."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* 2. WORKSPACE & IMPORT */}
            {activeTab === 'import' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-emerald-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    {tr(lang, '2. Workspace Mode & File Import', '2. Modo Workspace e Importación de Archivos', '2. Mode Workspace & Importation de Fichiers')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 rounded-sm">
                    WORKFLOW
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-emerald-900/50 p-4 rounded-sm space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wide font-mono">
                        {tr(lang, 'Mode A: Full Data/ Workspace Folder (Recommended)', 'Modo A: Carpeta Completa Data/ como Workspace (Recomendado)', 'Mode A : Dossier Complet Data/ en Workspace (Recommandé)')}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {tr(
                          lang,
                          'Click "Load Data Folder" on the Home Screen and select your mod\'s Data/ directory. CORVUS scans all subdirectories (XML/, Text/, Scripts/, Art/Textures/) and switches tool cards to "LOADED" status with direct file dropdowns.',
                          'Haz clic en "Cargar Carpeta Data" en la pantalla de inicio y selecciona el directorio Data/ de tu mod. CORVUS escanea todas las subcarpetas (XML/, Text/, Scripts/, Art/Textures/) y cambia las tarjetas de herramientas a estado "CARGADO" con desplegables directos para elegir qué fichero abrir.',
                          'Cliquez sur « Charger Dossier Data » sur l\'écran d\'accueil et sélectionnez le répertoire Data/ de votre mod. CORVUS analyse tous les sous-dossiers (XML/, Text/, Scripts/, Art/Textures/) et active les menus déroulants directs sur chaque outil.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    {tr(lang, 'Mode B: Standalone File Loading or Creation from Scratch', 'Modo B: Carga de Archivos Sueltos o Creación desde Cero', 'Mode B : Chargement Individuel ou Création à partir de Zéro')}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tr(
                      lang,
                      'You can also use any tool without loading a Workspace folder by importing individual files or generating clean templates. If linking files manually, follow this recommended order:',
                      'También puedes usar cualquier herramienta sin cargar una carpeta Workspace importando archivos sueltos o creando plantillas limpias desde cero. Si vinculas archivos manualmente, te recomendamos este orden:',
                      'Vous pouvez également utiliser chaque outil individuellement en important des fichiers isolés ou en créant un fichier vierge. Pour profiter des liens entre fichiers, suivez cet ordre :'
                    )}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-3 bg-slate-950/50 p-3 border-l-2 border-purple-500">
                      <span className="w-5 h-5 bg-purple-950 text-purple-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-purple-800">1</span>
                      <div className="text-xs">
                        <strong className="text-purple-300 font-mono block uppercase">MasterTextFile_*.dat ({tr(lang, 'Optional but Recommended', 'Opcional pero Recomendado', 'Optionnel mais Recommandé')})</strong>
                        <span className="text-slate-400">
                          {tr(
                            lang,
                            'Load your .DAT translation dictionary first so all other tools resolve TEXT_* IDs into human-readable names.',
                            'Carga primero tu diccionario .DAT para que todas las demás herramientas traduzcan los identificadores TEXT_* a nombres legibles.',
                            'Chargez d\'abord votre dictionnaire .DAT afin que tous les autres outils traduisent les identifiants TEXT_* en noms lisibles.'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-slate-950/50 p-3 border-l-2 border-cyan-500">
                      <span className="w-5 h-5 bg-cyan-950 text-cyan-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-cyan-800">2</span>
                      <div className="text-xs">
                        <strong className="text-cyan-300 font-mono block uppercase">Planets.xml & TradeRoutes.xml</strong>
                        <span className="text-slate-400">
                          {tr(
                            lang,
                            'Loads the galactic coordinate database and hyperspace network used by both the Galaxy Editor and the Galactic Conquest Editor.',
                            'Carga la base de datos de coordenadas galácticas y rutas hiperespaciales utilizada tanto por el Editor de Galaxia como por Conquista Galáctica.',
                            'Charge la base de coordonnées galactiques et les routes hyperespaces utilisées par l\'Éditeur de Galaxie et de Conquête Galactique.'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-slate-950/50 p-3 border-l-2 border-emerald-500">
                      <span className="w-5 h-5 bg-emerald-950 text-emerald-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-emerald-800">3</span>
                      <div className="text-xs">
                        <strong className="text-emerald-300 font-mono block uppercase">Campaigns.xml / Story_*.xml / Units / .MTD / .LUA</strong>
                        <span className="text-slate-400">
                          {tr(
                            lang,
                            'Open any specific gameplay, campaign, UI atlas, or script file with full contextual awareness of your planets and strings.',
                            'Abre cualquier archivo de campaña, historia, unidades, atlas .MTD o script .LUA contando ya con el contexto completo de planetas y textos.',
                            'Ouvrez ensuite vos fichiers de campagne, histoire, unités, atlas .MTD ou scripts .LUA avec tout le contexte galactique actif.'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. GALAXY & PLANET SYSTEMS EDITOR */}
            {activeTab === 'planets' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-cyan-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    {tr(lang, '3. Galaxy, Planet & Trade Route Editor', '3. Editor de Galaxia, Planetas y Rutas Comerciales', '3. Éditeur de Galaxie, Planètes & Routes Commerciales')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 rounded-sm">
                    v2.5 // Planets.xml & TradeRoutes.xml
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'The Galaxy & Planet Systems Editor is an interactive 2D cartography workstation that simultaneously manages Planets.xml and TradeRoutes.xml. It lets you visually design your galaxy layout, edit every planetary XML tag, and wire hyperspace trade routes.',
                    'El Editor de Galaxia y Sistemas Planetarios es una estación cartográfica 2D interactiva que gestiona simultáneamente Planets.xml y TradeRoutes.xml. Permite diseñar visualmente la posición de cada mundo, editar todas sus etiquetas XML y trazar las rutas hiperespaciales (Hyperlanes).',
                    "L'Éditeur de Galaxie et de Systèmes Planétaires est un poste cartographique 2D interactif gérant simultanément Planets.xml et TradeRoutes.xml. Il permet de positionner visuellement les mondes, d'éditer leurs balises XML et de tracer les routes commerciales."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-cyan-400 uppercase block text-[11px]">
                      {tr(lang, 'Interactive 2D Map & Drag-and-Drop', 'Mapa 2D Interactivo y Drag & Drop', 'Carte 2D Interactive & Glisser-Déposer')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Pan and zoom smoothly across the galaxy. Click any planet to inspect it, or drag it with the mouse to update its <Galactic_Position> X/Y coordinates in real time. Supports optional Grid Snapping and Y-Axis Inversion.',
                        'Desplázate y haz zoom libremente por la galaxia. Haz clic en cualquier planeta para inspeccionarlo o arrástralo con el ratón para actualizar su <Galactic_Position> X/Y en tiempo real. Soporta ajuste a cuadrícula (Grid Snap) e inversión del eje Y.',
                        'Naviguez et zoomez librement dans la galaxie. Cliquez sur une planète pour l\'inspecter ou faites-la glisser à la souris pour modifier sa balise <Galactic_Position> X/Y en temps réel.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-cyan-400 uppercase block text-[11px]">
                      {tr(lang, 'Planet Inspector, Cloning & Creation', 'Inspector de Planetas, Clonado y Creación', 'Inspecteur, Clonage & Création de Planètes')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Create new planets using any existing world as a structural template, or edit properties in the right panel: <Text_ID>, 3D <Model_Name>, credit value, space/land tactical maps, indigenous affiliations, abilities, and encyclopedia entries.',
                        'Crea nuevos planetas usando cualquier planeta existente como plantilla base, o edita sus propiedades en el panel derecho: <Text_ID>, modelo 3D <Model_Name>, ingresos de créditos, mapas tácticos espaciales/terrestres, habilidades y enciclopedia.',
                        'Créez de nouvelles planètes à partir d\'un modèle existant ou modifiez toutes leurs propriétés dans l\'inspecteur : <Text_ID>, modèle 3D, revenus, cartes tactiques spatiales/terrestres et capacités.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-cyan-400 uppercase block text-[11px]">
                      {tr(lang, 'Trade Routes (Hyperlanes) Builder', 'Constructor de Rutas Comerciales (Hyperlanes)', 'Constructeur de Routes Commerciales')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Switch the left sidebar to the "Routes" tab to load or create TradeRoutes.xml. Connect Point_A and Point_B visually, adjust credit gains and movement speeds, and detect invalid or orphaned planet references.',
                        'Cambia el panel izquierdo a la pestaña "Rutas" para cargar o crear TradeRoutes.xml. Conecta Point_A y Point_B visualmente, ajusta ganancias y velocidad, y detecta referencias a planetas inexistentes o rutas duplicadas.',
                        'Basculez le panneau gauche sur « Routes » pour charger ou créer TradeRoutes.xml. Reliez Point_A et Point_B visuellement et détectez automatiquement les routes invalides ou dupliquées.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-cyan-400 uppercase block text-[11px]">
                      {tr(lang, 'Bulk Edit, Background Blueprints & Code View', 'Edición Masiva, Mapas de Fondo y Vista Código', 'Édition de Masse, Images de Fond & Code XML')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Use "Bulk Edit" to modify XML tags across dozens of planets at once, overlay a custom galaxy blueprint image (.PNG/.JPG/.TGA/.DDS) to align stars accurately, or toggle between the 2D Map and live XML Code view.',
                        'Usa "Edición Masiva" para modificar etiquetas XML en decenas de planetas a la vez, superpón una imagen de referencia de fondo (.PNG/.JPG/.TGA/.DDS) para alinear sistemas, o alterna entre el Mapa 2D y la vista de Código XML.',
                        'Utilisez « Édition de Masse » pour modifier des balises sur plusieurs planètes simultanément, superposez une image de référence en fond, ou basculez entre la Carte 2D et le Code XML.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. GALACTIC CONQUEST EDITOR */}
            {activeTab === 'campaigns' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-emerald-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    {tr(lang, '4. Galactic Conquest Editor', '4. Editor de Conquista Galáctica (Campaigns.xml)', '4. Éditeur de Conquête Galactique (Campaigns.xml)')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 rounded-sm">
                    v3.1 // Campaigns.xml
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'The Galactic Conquest Editor (v3.1) lets you create, clone, and balance complete Galactic Conquest scenarios (<Campaign> nodes in Campaigns.xml) directly on top of the interactive galaxy map.',
                    'El Editor de Conquista Galáctica (v3.1) permite crear, clonar y balancear escenarios completos de Conquista Galáctica (nodos <Campaign> en Campaigns.xml) directamente sobre el mapa galáctico interactivo.',
                    "L'Éditeur de Conquête Galactique (v3.1) permet de créer, cloner et équilibrer des scénarios complets de Conquête Galactique (<Campaign> dans Campaigns.xml) directement sur la carte galactique interactive."
                  )}
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm">
                    <span className="font-mono font-bold text-emerald-400 uppercase block mb-1">
                      {tr(lang, '1. Interactive Map Planet & Route Selection', '1. Selección Interactiva de Planetas y Rutas en el Mapa', '1. Sélection Interactive des Planètes et Routes sur la Carte')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'When Planets.xml is loaded, clicking any planet on the map toggles its inclusion in the campaign\'s <Locations> list. Active planets are highlighted by faction ownership, and you can auto-sync <Trade_Routes> so only hyperlanes connecting active planets are included.',
                        'Con Planets.xml cargado, hacer clic sobre cualquier planeta en el mapa lo activa o desactiva dentro de la lista <Locations> de la campaña. Los planetas activos se iluminan según la facción que los controla, y puedes sincronizar automáticamente <Trade_Routes> para incluir solo las rutas que conectan mundos activos.',
                        'Lorsque Planets.xml est chargé, cliquer sur une planète de la carte l\'ajoute ou la retire de la liste <Locations>. Les planètes actives sont colorées selon leur faction et vous pouvez synchroniser automatiquement <Trade_Routes>.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm">
                    <span className="font-mono font-bold text-emerald-400 uppercase block mb-1">
                      {tr(lang, '2. Faction Economics, AI Control & Tech Levels', '2. Economía por Facción, IA y Niveles Tecnológicos', '2. Économie des Factions, IA & Niveaux Technologiques')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Configure per-faction parameters for Empire, Rebel, Underworld, or custom factions: <Starting_Credits>, <Starting_Tech_Level>, <Max_Tech_Level>, <Home_Location>, <AI_Player_Control> personality (e.g., DefaultGalacticAI, BasicRebel), and active playable factions.',
                        'Configura los parámetros por facción (Imperio, Rebeldes, Consorcio o facciones personalizadas): <Starting_Credits>, <Starting_Tech_Level>, <Max_Tech_Level>, planeta capital <Home_Location> y personalidad de IA <AI_Player_Control>.',
                        'Configurez les paramètres de chaque faction (Empire, Rebelles, Pègre ou factions personnalisées) : <Starting_Credits>, <Starting_Tech_Level>, <Max_Tech_Level>, capitale <Home_Location> et IA <AI_Player_Control>.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm">
                    <span className="font-mono font-bold text-emerald-400 uppercase block mb-1">
                      {tr(lang, '3. Visual Starting_Forces Garrison Builder', '3. Constructor Visual de Flotas y Guarniciones (Starting_Forces)', '3. Constructeur Visuel des Forces Initiales (Starting_Forces)')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Manage all <Starting_Forces> entries filtered by planet or faction. Quickly add space fleets, starbases, land structures, and ground platoons, adjust quantities, or switch to the raw Starting_Forces text editor for batch pasting.',
                        'Gestiona todas las entradas <Starting_Forces> filtrando por planeta o facción. Añade flotas espaciales, estaciones, estructuras terrestres y pelotones ajustando la cantidad de escuadrones, o alterna al editor de texto directo para pegado rápido.',
                        'Gérez toutes les entrées <Starting_Forces> filtrées par planète ou par faction. Ajoutez des flottes, bases spatiales et garnisons terrestres en ajustant les quantités, ou éditez le bloc en mode texte.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm">
                    <span className="font-mono font-bold text-emerald-400 uppercase block mb-1">
                      {tr(lang, '4. Story Plots & Victory Conditions', '4. Tramas de Historia y Condiciones de Victoria', '4. Trames Narratives & Conditions de Victoire')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Link faction-specific Story plot files (<Rebel_Story_Name>, <Empire_Story_Name>, <Underworld_Story_Name>), set camera offsets, sort order in the GC menu, and configure victory conditions.',
                        'Vincula archivos de eventos narrativos por facción (<Rebel_Story_Name>, <Empire_Story_Name>, <Underworld_Story_Name>), ajusta el orden de aparición en el menú y define las condiciones de victoria.',
                        'Associez les fichiers de trame narrative par faction (<Rebel_Story_Name>, <Empire_Story_Name>, <Underworld_Story_Name>), réglez l\'ordre d\'affichage et les conditions de victoire.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. STORY CAMPAIGN EVENT EDITOR */}
            {activeTab === 'story' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-emerald-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    {tr(lang, '5. Story Campaign Event Editor', '5. Editor de Eventos de Historia y Campañas', '5. Éditeur d\'Événements de Campagne Histoire')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 rounded-sm">
                    v2.1 // Story_*.xml
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'Empire at War uses event-driven XML state machines (Story_*.xml) to trigger missions, spawn heroes, lock/unlock tech, play holocron movies, and launch tactical battles. The Story Editor turns these complex XML chains into an intuitive visual node & inspector workflow.',
                    'Empire at War utiliza máquinas de estados basadas en eventos XML (Story_*.xml) para activar misiones, generar héroes, desbloquear tecnología, reproducir vídeos del holocrón y lanzar batallas tácticas. El Editor de Historia convierte estas cadenas XML en un flujo visual e intuitivo.',
                    "Empire at War utilise des machines d'états XML événementielles (Story_*.xml) pour déclencher des missions, faire apparaître des héros, débloquer des technologies et lancer des batailles tactiques. L'Éditeur d'Histoire transforme ces chaînes XML en un flux visuel intuitif."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-emerald-400 uppercase block">
                      {tr(lang, 'Event Graph & Prerequisite Chains', 'Grafo de Eventos y Cadenas de Prerrequisitos', 'Graphe d\'Événements & Prérequis')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Browse all <Event> nodes in chronological order or inspect their <Prereq> dependencies and <Branch> groups to trace how one mission trigger unlocks subsequent events.',
                        'Explora todos los nodos <Event> en orden cronológico o inspecciona sus dependencias <Prereq> y ramificaciones <Branch> para visualizar cómo un evento desbloquea los siguientes.',
                        'Parcourez tous les nœuds <Event> par ordre chronologique ou inspectez leurs dépendances <Prereq> et leurs branches <Branch>.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-emerald-400 uppercase block">
                      {tr(lang, 'Alamo Event & Reward Catalog', 'Catálogo de Triggers y Recompensas del Motor', 'Catalogue de Déclencheurs & Récompenses')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Select from documented <Event_Type> triggers (STORY_TRIGGER, STORY_ELAPSED, STORY_ENTER, STORY_CONQUER, STORY_CONSTRUCT, STORY_TACTICAL_DESTROY) and <Reward_Type> actions (SPAWN_HERO, CREDITS, MULTIMEDIA, DIALOG, ENABLE_BUILDABLE, LINK_TACTICAL) with contextual parameter hints.',
                        'Selecciona entre los <Event_Type> oficiales (STORY_TRIGGER, STORY_ELAPSED, STORY_ENTER, STORY_CONQUER, STORY_CONSTRUCT, STORY_TACTICAL_DESTROY) y acciones <Reward_Type> (SPAWN_HERO, CREDITS, MULTIMEDIA, DIALOG, ENABLE_BUILDABLE, LINK_TACTICAL) con ayuda contextual para cada parámetro.',
                        'Choisissez parmi les <Event_Type> officiels (STORY_TRIGGER, STORY_ELAPSED, STORY_ENTER, STORY_CONQUER, etc.) et les <Reward_Type> (SPAWN_HERO, CREDITS, MULTIMEDIA, DIALOG, LINK_TACTICAL) avec aide contextuelle.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5 md:col-span-2">
                    <span className="font-mono font-bold text-emerald-400 uppercase block">
                      {tr(lang, 'Integrated Planet, Text (.DAT) & Dialog Linking', 'Integración con Planetas, Textos (.DAT) y Diálogos (.TXT)', 'Intégration avec Planètes, Textes (.DAT) & Dialogues (.TXT)')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Event parameters that expect a planet name, a localization <Story_Tag> / TEXT_* key, or a <Story_Dialog> file automatically provide suggestions and previews from your loaded Workspace files.',
                        'Los parámetros de evento que requieren el nombre de un planeta, una etiqueta de texto <Story_Tag> / TEXT_* o un fichero <Story_Dialog> ofrecen sugerencias automáticas y previsualización a partir de los archivos cargados en tu sesión.',
                        'Les paramètres d\'événement nécessitant un nom de planète, une clé <Story_Tag> / TEXT_* ou un fichier <Story_Dialog> proposent automatiquement des suggestions issues de votre Workspace.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. UNIT BALANCE EDITOR */}
            {activeTab === 'units' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-emerald-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    {tr(lang, '6. Unit Balance Editor', '6. Editor de Balance de Unidades', '6. Éditeur d\'Équilibrage des Unités')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 rounded-sm">
                    v1.1 // SpaceUnits & GroundUnits
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'The Unit Balance Editor (v1.1) is designed to rapidly inspect, compare, and balance combat and economic statistics across SpaceUnitsCapital.xml, SpaceUnitsFrigates.xml, Squadrons.xml, GroundInfantry.xml, GroundVehicles.xml, Heroes, and Starbases.',
                    'El Editor de Balance de Unidades (v1.1) está diseñado para inspeccionar, comparar y ajustar rápidamente estadísticas económicas y de combate en archivos como SpaceUnitsCapital.xml, SpaceUnitsFrigates.xml, Squadrons.xml, GroundInfantry.xml, GroundVehicles.xml, Héroes y Estaciones.',
                    "L'Éditeur d'Équilibrage des Unités (v1.1) permet d'inspecter, comparer et équilibrer rapidement les statistiques économiques et de combat dans SpaceUnitsCapital.xml, SpaceUnitsFrigates.xml, Squadrons.xml, GroundInfantry.xml, GroundVehicles.xml, Héros et Bases."
                  )}
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm">
                    <span className="font-mono font-bold text-emerald-400 uppercase block mb-1">
                      {tr(lang, 'Comparative Stat Matrix & Search', 'Matriz Comparativa de Estadísticas y Búsqueda', 'Matrice Comparative des Statistiques & Recherche')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Filter units by name, XML tag type (<SpaceUnit>, <Squadron>, <GroundInfantry>, <GroundVehicle>, <HeroUnit>), or faction (<Affiliation>). Compare health, shields, speed, cost, build time, and tech level side by side.',
                        'Filtra unidades por nombre, tipo de nodo XML (<SpaceUnit>, <Squadron>, <GroundInfantry>, <GroundVehicle>, <HeroUnit>) o facción (<Affiliation>). Compara vida, escudos, velocidad, coste, tiempo de construcción y nivel tecnológico de un vistazo.',
                        'Filtrez les unités par nom, type de nœud XML (<SpaceUnit>, <Squadron>, <GroundInfantry>, <GroundVehicle>, <HeroUnit>) ou faction (<Affiliation>). Comparez santé, boucliers, vitesse, coût et niveau technologique.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm">
                    <span className="font-mono font-bold text-emerald-400 uppercase block mb-1">
                      {tr(lang, 'Direct Property Tuning & Non-Destructive XML Export', 'Ajuste Directo de Atributos y Exportación XML No Destructiva', 'Ajustement Direct des Attributs & Export XML Non Destructif')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Modify <Tactical_Health>, <Shield_Points>, <Shield_Refresh_Rate>, <Build_Cost_Credits>, <Build_Time_Seconds>, <Tech_Level>, <Max_Speed>, <Space_FOW_Reveal_Range>, <Damage>, and <HardPoints> while keeping all custom XML properties intact.',
                        'Modifica <Tactical_Health>, <Shield_Points>, <Shield_Refresh_Rate>, <Build_Cost_Credits>, <Build_Time_Seconds>, <Tech_Level>, <Max_Speed>, <Space_FOW_Reveal_Range>, <Damage> y <HardPoints> manteniendo intacta toda la estructura XML original.',
                        'Modifiez <Tactical_Health>, <Shield_Points>, <Shield_Refresh_Rate>, <Build_Cost_Credits>, <Build_Time_Seconds>, <Tech_Level>, <Max_Speed>, <Damage> et <HardPoints> tout en préservant l\'intégralité de la structure XML d\'origine.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. TRANSLATIONS (.DAT) */}
            {activeTab === 'translations' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-purple-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-purple-400 uppercase tracking-wider font-mono">
                    {tr(lang, '7. String Localization Editor (.DAT)', '7. Editor de Traducciones y Textos (.DAT)', '7. Éditeur de Traductions et Textes (.DAT)')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-700/50 rounded-sm">
                    v1.3 // MasterTextFile_*.dat
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'Star Wars: Empire at War stores all in-game text (unit names, planet names, tooltips, encyclopedia descriptions, and mission subtitles) inside binary .DAT files located in Data/Text/. Version 1.3 adds a Bilingual .DAT Comparator, a 3-in-1 Entity Key Pack Generator, Batch Find & Replace, CSV/TSV/JSON export/import, Undo/Redo history, and an in-game EAW HUD Tooltip Simulator.',
                    'Star Wars: Empire at War almacena todos los textos del juego (nombres de unidades, planetas, descripciones de enciclopedia y subtítulos) en archivos binarios .DAT dentro de Data/Text/. La versión 1.3 incorpora Comparador Bilingüe .DAT, Generador de Packs de Claves 3-en-1, Buscar y Reemplazar en lote, Importación/Exportación CSV/TSV/JSON, Historial Deshacer/Rehacer y Simulador de Tooltip HUD en tiempo real.',
                    "Star Wars: Empire at War stocke tous les textes du jeu dans des fichiers binaires .DAT situés dans Data/Text/. La version 1.3 ajoute un comparateur bilingue .DAT, un générateur de packs de clés 3-en-1, le rechercher/remplacer en lot, l'import/export CSV/TSV/JSON et un simulateur HUD."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-purple-400 uppercase block">
                      {tr(lang, '1. Binary CRC32 Index & UTF-16LE Compiler', '1. Compilador Binario CRC32 y UTF-16LE', '1. Compilateur Binaire CRC32 & UTF-16LE')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Decodes and compiles Indexed CRC32 and Sequential .DAT formats natively, displaying the live 32-bit Petroglyph CRC32 checksum for every key and sorting the binary lookup table automatically on export.',
                        'Decodifica y compila de forma nativa los formatos Indexed CRC32 y Sequential .DAT, mostrando el hash CRC32 de 32 bits exacto de cada clave y ordenando la tabla binaria automáticamente al exportar.',
                        'Décode et compile nativement les formats .DAT Indexed CRC32 et Sequential avec calcul du hash CRC32 en temps réel.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-purple-400 uppercase block">
                      {tr(lang, '2. Bilingual .DAT Comparator & Missing Key Sync', '2. Comparador Bilingüe .DAT y Sincronización', '2. Comparateur Bilingue .DAT & Synchronisation')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Load a reference file (e.g. MasterTextFile_ENGLISH.dat) to detect missing keys in your localized .DAT, import missing entries in 1 click, and view the reference text right above your translation box.',
                        'Carga un archivo de referencia (ej. MasterTextFile_ENGLISH.dat) para detectar qué claves faltan en tu traducción, importarlas con 1 clic y visualizar el texto original justo encima del cuadro de edición.',
                        'Chargez un fichier de référence (ex. MasterTextFile_ENGLISH.dat) pour détecter et importer les clés manquantes en un clic.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-purple-400 uppercase block">
                      {tr(lang, '3. 3-in-1 Entity Key Pack & Batch Replace', '3. Generador de Pack de Entidad y Reemplazo Masivo', '3. Générateur de Pack d\'Entité & Remplacement')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Generate Name, Tooltip, and Encyclopedia keys for any new Unit, Planet, Hero, or Building in a single step, or run batch Find & Replace across thousands of keys and strings.',
                        'Genera de una vez las 3 claves estándar (Nombre, Tooltip y Enciclopedia) para cualquier nueva Unidad, Planeta, Héroe o Edificio, o ejecuta Buscar y Reemplazar en lote sobre miles de textos.',
                        'Générez les 3 clés standard (Nom, Tooltip et Encyclopédie) en une seule étape ou effectuez un remplacement par lot.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-purple-400 uppercase block">
                      {tr(lang, '4. CSV/TSV/JSON Export & EAW HUD Simulator', '4. Exportación CSV/TSV/JSON y Simulador HUD', '4. Export CSV/TSV/JSON & Simulateur HUD')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Smart-merge or export full localization tables in .CSV, .TSV, or .JSON, auto-deduplicate collisions, copy <Text_ID> XML snippets in one click, and preview strings inside the EAW HUD Tooltip Simulator.',
                        'Importa con fusión inteligente o exporta tablas completas en .CSV, .TSV o .JSON, limpia duplicados en un clic, copia etiquetas <Text_ID> para XML y previsualiza el resultado en el Simulador HUD de EAW.',
                        'Importez ou exportez en .CSV, .TSV ou .JSON, nettoyez les doublons et prévisualisez le rendu dans le simulateur HUD.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. MEGA TEXTURES (.MTD) */}
            {activeTab === 'mtd' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-amber-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider font-mono">
                    {tr(lang, '8. Mega-Texture Atlas Editor (.MTD)', '8. Editor de Atlas Mega-Texturas (.MTD)', '8. Éditeur d\'Atlas MegaTextures (.MTD)')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-700/50 rounded-sm">
                    v1.3 // 81-Byte & Alamo Binary + TGA/PNG
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'Unit build icons, radar blips, and HUD buttons in Empire at War are packed into large texture sheets (e.g., MT_CommandBar.tga) accompanied by a binary MT_CommandBar.mtd index file. Version 1.3 introduces a hardware-accelerated Split Atlas Canvas, batch icon packing, in-place image replacement, individual icon extraction, and real-time collision/bounds diagnostics.',
                    'Los iconos de construcción de unidades, radares y botones del HUD en Empire at War se agrupan en grandes hojas de textura (ej. MT_CommandBar.tga) acompañadas de un archivo índice binario MT_CommandBar.mtd. La versión 1.3 incorpora un Lienzo Interactivo del Atlas acelerado por hardware en vista dividida, importación masiva por lotes, reemplazo de imagen in-situ, extracción individual en .PNG/.TGA y diagnóstico de colisiones en tiempo real.',
                    "Les icônes d'unités et boutons d'interface dans Empire at War sont regroupés dans de grands atlas de textures (ex: MT_CommandBar.tga) accompagnés d'un fichier d'index binaire .mtd. La version 1.3 ajoute un canevas d'atlas interactif accéléré en vue scindée, l'importation en lot, l'extraction d'icône individuelle et un diagnostic de collision en temps réel."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-amber-400 uppercase block">
                      {tr(lang, '1. Interactive Split Atlas Canvas & Gallery', '1. Lienzo Interactivo del Atlas y Galería Visual', '1. Canevas Interactif & Galerie Visuelle')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Switch between Split View (Table + Interactive Atlas Canvas), Detailed Table, and Visual Gallery Grid. Zoom (15%–400%), pan, click any bounding box on the texture to select it, or unlock coordinates to drag and resize bounding boxes directly on the canvas.',
                        'Alterna entre Vista Dividida (Tabla + Lienzo Interactivo del Atlas), Tabla Detallada y Galería Visual. Haz zoom (15%–400%), desplázate, haz clic sobre cualquier recuadro de la textura para seleccionarlo o desbloquea las coordenadas para arrastrar y redimensionar las cajas directamente sobre el lienzo.',
                        "Basculez entre la Vue Scindée (Tableau + Canevas Interactif), le Tableau Détaillé et la Galerie Visuelle. Zoomez, cliquez sur n'importe quel cadre sur la texture ou déplacez/redimensionnez les cadres directement à la souris."
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-amber-400 uppercase block">
                      {tr(lang, '2. Single & Batch Icon Auto-Packer (2px Pad)', '2. Empaquetador Individual y por Lotes (Margen 2px)', '2. Empaqueteur Individuel & en Lot (Marge 2px)')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Import one or multiple .TGA/.PNG/.JPG icons at once. CORVUS automatically formats names as I_BUTTON_*.TGA, detects alpha transparency, finds free non-overlapping slots with a 2px safety border, and expands the atlas to the next power of two if full.',
                        'Importa uno o múltiples iconos .TGA/.PNG/.JPG simultáneamente. CORVUS formatea los nombres como I_BUTTON_*.TGA, detecta transparencia alfa, busca huecos libres con margen de seguridad de 2px y amplía el atlas a la siguiente potencia de 2 si es necesario.',
                        'Importez une ou plusieurs icônes .TGA/.PNG/.JPG simultanément. CORVUS formate les noms en I_BUTTON_*.TGA, détecte la transparence alpha et place chaque icône avec une marge de sécurité de 2px.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-amber-400 uppercase block">
                      {tr(lang, '3. Replace Graphic & Extract Single Icon (.PNG/.TGA)', '3. Reemplazar Imagen y Extraer Icono Suelto (.PNG/.TGA)', '3. Remplacer Image & Extraire Icône (.PNG/.TGA)')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Update an existing icon graphic in-place on the atlas with "Replace Image", duplicate entries, create manual coordinate entries, or extract any selected icon cropped from the sheet as a standalone .PNG or 32-bit .TGA.',
                        'Actualiza el gráfico de un icono existente sobre el atlas con "Cambiar Imagen", duplica registros, crea entradas manuales de coordenadas o extrae cualquier icono recortado como archivo .PNG o .TGA de 32 bits independiente.',
                        "Remplacez le graphique d'une icône existante sur l'atlas, créez des entrées manuelles ou extrayez n'importe quelle icône découpée en fichier .PNG ou .TGA 32 bits."
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-amber-400 uppercase block">
                      {tr(lang, '4. Collision & Out-of-Bounds Auditor + Auto-Fix', '4. Auditor de Solapamientos y Fuera de Rango + Auto-Fix', '4. Auditeur de Collisions & Hors Limites + Auto-Fix')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Automatically highlights overlapping icons in orange and out-of-bounds icons in red. Click "Auto-Fix Slot" to relocate a colliding icon into a clean 2px-padded slot, and export in 81-Byte Standard or Alamo Binary format.',
                        'Resalta automáticamente los iconos solapados en naranja y los que exceden el tamaño de la textura en rojo. Pulsa "Auto-Reparar" para reubicar un icono en conflicto en un hueco libre con margen de 2px, y exporta en formato 81-Byte Estándar o Alamo Binario.',
                        "Met en évidence les collisions en orange et les dépassements en rouge. Cliquez sur « Auto-Réparer » pour relocaliser proprement une icône en conflit et exportez au format 81-Byte Standard ou Binaire Alamo."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. DIALOG & NARRATIVE STORY EDITOR */}
            {activeTab === 'dialog' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-cyan-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider font-mono">
                    {tr(lang, '9. Dialog, Briefings & Transmission Editor', '9. Editor de Diálogos, Textos y Transmisiones (.TXT)', '9. Éditeur de Dialogues, Briefings & Transmissions (.TXT)')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 rounded-sm">
                    v1.1 // Dialog_*.txt
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'Campaign briefings, holocron advisor logs, and tactical in-mission transmissions are controlled by structured .TXT scripts (e.g., Dialog_Rebel_Campaign.txt). This tool lets you build and preview these sequences visually.',
                    'Las sesiones informativas de campaña, registros del holocrón y transmisiones tácticas en misión se controlan mediante guiones .TXT estructurados (ej. Dialog_Rebel_Campaign.txt). Esta herramienta permite construir y simular estas secuencias visualmente.',
                    "Les briefings de campagne, journaux d'holocron et transmissions tactiques en mission sont contrôlés par des scripts .TXT structurés (ex: Dialog_Rebel_Campaign.txt). Cet outil permet de construire et simuler ces séquences visuellement."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-cyan-400 uppercase block">
                      {tr(lang, 'Chapter & Line Sequencer', 'Secuenciador de Capítulos y Líneas', 'Séquenceur de Chapitres & Répliques')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Create and organize CHAPTER blocks, assign character holographic MOVIE loops, SFX audio events, TEXT_* localization keys, and WAIT delays without worrying about syntax formatting.',
                        'Crea y organiza bloques CHAPTER, asigna bucles de vídeo holográfico MOVIE, eventos de audio SFX, claves de texto TEXT_* y tiempos de espera WAIT sin preocuparte por errores de formato.',
                        'Créez et organisez des blocs CHAPTER, assignez les boucles vidéo MOVIE, les événements audio SFX, les clés TEXT_* et les délais WAIT sans erreur de syntaxe.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-cyan-400 uppercase block">
                      {tr(lang, 'Live Holo-Projector Simulation', 'Simulador de Proyector Holográfico en Vivo', 'Simulateur d\'Holo-Projecteur en Direct')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Play back any chapter in the integrated Holo-Terminal simulator to preview subtitle pacing, speaker movie transitions, and live localized strings pulled directly from your loaded MasterTextFile.dat.',
                        'Reproduce cualquier capítulo en el simulador de Holo-Terminal integrado para comprobar el ritmo de los subtítulos, las transiciones de personaje y los textos traducidos en tiempo real desde tu MasterTextFile.dat.',
                        'Jouez n\'importe quel chapitre dans le simulateur Holo-Terminal intégré pour vérifier le rythme des sous-titres, les transitions vidéo et les textes traduits depuis votre MasterTextFile.dat.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 10. RAW XML CODE EDITOR */}
            {activeTab === 'rawxml' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-rose-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-rose-400 uppercase tracking-wider font-mono">
                    {tr(lang, '10. Raw XML Code & DOM Editor', '10. Editor de Código XML y Árbol DOM', '10. Éditeur de Code XML & Arbre DOM')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-700/50 rounded-sm">
                    v2.1 // Generic .XML
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'For specialized or custom XML files (GameConstants.xml, Factions.xml, HardPoints.xml, Projectiles.xml, SFXEvents.xml, Weather.xml, etc.), the Raw XML Editor provides a dedicated modding code environment.',
                    'Para archivos XML especializados o personalizados (GameConstants.xml, Factions.xml, HardPoints.xml, Projectiles.xml, SFXEvents.xml, Weather.xml, etc.), el Editor de Código XML ofrece un entorno de edición rápida con validación de estructura.',
                    'Pour les fichiers XML spécialisés ou personnalisés (GameConstants.xml, Factions.xml, HardPoints.xml, Projectiles.xml, SFXEvents.xml, etc.), l\'Éditeur de Code XML offre un environnement dédié avec validation.'
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-rose-400 uppercase block">
                      {tr(lang, 'Syntax Validation & Auto-Formatting', 'Validación de Sintaxis y Auto-Formateo', 'Validation Syntaxique & Auto-Formatage')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Detects unclosed or mismatched XML tags immediately, formats indentation cleanly, and provides line-numbered editing with search and replace.',
                        'Detecta etiquetas XML sin cerrar o mal anidadas al instante, formatea la indentación automáticamente y ofrece edición numerada con búsqueda y reemplazo.',
                        'Détecte immédiatement les balises XML non fermées, indente automatiquement le code et propose une édition numérotée avec recherche et remplacement.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-rose-400 uppercase block">
                      {tr(lang, 'Node Tree Outline & .DAT Lookups', 'Esquema de Nodos y Consulta .DAT', 'Structure des Nœuds & Aperçu .DAT')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Jump directly to any top-level XML entity in large files, duplicate existing entries, and inspect resolved TEXT_* translations when MasterTextFile.dat is loaded.',
                        'Salta directamente a cualquier entidad principal en archivos XML de gran tamaño, duplica bloques existentes y consulta las traducciones TEXT_* si tienes cargado el archivo .DAT.',
                        'Accédez directement à n\'importe quelle entité XML dans les grands fichiers, dupliquez des entrées et consultez les traductions TEXT_*.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 11. RAW LUA 5.0 SCRIPT IDE */}
            {activeTab === 'rawlua' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-yellow-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-yellow-400 uppercase tracking-wider font-mono">
                    {tr(lang, '11. Raw LUA 5.0 Script IDE', '11. Entorno de Desarrollo LUA 5.0 (Raw LUA IDE)', '11. Environnement de Développement LUA 5.0')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-yellow-950/60 text-yellow-300 border border-yellow-700/50 rounded-sm">
                    v2.2 // Alamo Lua 5.0
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {tr(
                    lang,
                    'Empire at War runs on an embedded Lua 5.0 virtual machine with custom Petroglyph C++ bindings for AI, Story scripts, Object abilities, and Tactical events. The CORVUS Lua 5.0 IDE is tailored specifically to this dialect.',
                    'Empire at War utiliza una máquina virtual Lua 5.0 integrada con funciones específicas de Petroglyph para IA, scripts de historia, habilidades de unidades y eventos tácticos. El IDE Lua 5.0 de CORVUS está diseñado específicamente para este dialecto.',
                    "Empire at War repose sur une machine virtuelle Lua 5.0 embarquée avec des fonctions propres à Petroglyph pour l'IA, les scripts d'histoire et les événements tactiques. L'IDE Lua 5.0 de CORVUS est conçu spécialement pour ce dialecte."
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-yellow-400 uppercase block">
                      {tr(lang, 'Live AST Symbol Outline', 'Esquema AST en Vivo (Funciones, Estados y Eventos)', 'Structure AST en Direct (Fonctions, États & Événements)')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Automatically extracts all declared functions, Define_State() state machines, On_* event handlers, and global variables into the left sidebar so you can jump to any line with a single click.',
                        'Extrae automáticamente todas las funciones declaradas, máquinas de estado Define_State(), manejadores de eventos On_* y variables globales en el panel lateral para saltar a cualquier línea con un clic.',
                        'Extrait automatiquement toutes les fonctions, états Define_State(), gestionnaires On_* et variables globales dans le panneau latéral pour naviguer en un clic.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-yellow-400 uppercase block">
                      {tr(lang, 'Petroglyph API Library & Snippet Insertion', 'Librería API de Petroglyph e Inserción de Snippets', 'Bibliothèque API Petroglyph & Insertion de Snippets')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Browse categorized Alamo Engine commands (Find_First_Object, Spawn_Unit, Reinforce_List, Story_Event, BlockOnCommand, Sleep, TestValid, Get_Story_Plot) with full parameter documentation and one-click code insertion.',
                        'Explora comandos categorizados del motor Alamo (Find_First_Object, Spawn_Unit, Reinforce_List, Story_Event, BlockOnCommand, Sleep, TestValid, Get_Story_Plot) con documentación de parámetros e inserción directa en el cursor.',
                        'Parcourez les commandes catégorisées du moteur Alamo (Find_First_Object, Spawn_Unit, Reinforce_List, Story_Event, BlockOnCommand, Sleep, TestValid) avec documentation et insertion en un clic.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-yellow-400 uppercase block">
                      {tr(lang, 'State Machine / Thread Generator & Templates', 'Generador de Estados / Hilos y Plantillas Base', 'Générateur d\'États / Threads & Modèles de Scripts')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Generate complete Define_State + function On_State(message) OnEnter/OnUpdate/OnExit blocks or Create_Thread coroutines automatically, or start a new file from Story, Object, Tactical, or Galactic AI templates.',
                        'Genera bloques completos Define_State + function On_State(message) con OnEnter/OnUpdate/OnExit o corrutinas Create_Thread automáticamente, o inicia un archivo nuevo a partir de plantillas de Historia, Objeto, Táctica o IA.',
                        'Générez automatiquement des blocs complets Define_State + function On_State(message) (OnEnter/OnUpdate/OnExit) ou des threads Create_Thread, ou démarrez depuis un modèle Histoire, Objet ou IA.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <span className="font-mono font-bold text-yellow-400 uppercase block">
                      {tr(lang, 'Lua 5.0 Semantic & Compatibility Auditor', 'Auditor Semántico y de Compatibilidad Lua 5.0', 'Auditeur Sémantique & Compatibilité Lua 5.0')}
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Checks for unbalanced function/if/for/while..end blocks and warns you if you accidentally use Lua 5.1+ syntax (#table length operator, % modulo operator, or modern varargs) that causes script crashes in Empire at War.',
                        'Verifica bloques function/if/for/while..end sin cerrar y alerta si utilizas por error sintaxis exclusiva de Lua 5.1+ (operador de longitud #tabla, operador módulo % o varargs modernos) que provoca cuelgues en Empire at War.',
                        'Vérifie les blocs function/if/for/while..end non fermés et vous alerte en cas d\'utilisation d\'opérateurs Lua 5.1+ (#table, %, etc.) incompatibles avec Empire at War.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 12. SETTINGS, UPDATES & EXPORT */}
            {activeTab === 'export' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-purple-800/60 pb-2.5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-purple-400 uppercase tracking-wider font-mono">
                    {tr(lang, '12. Settings, Auto-Updates & Exporting Files', '12. Ajustes, Actualizaciones y Exportación de Archivos', '12. Paramètres, Mises à Jour & Exportation des Fichiers')}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-700/50 rounded-sm">
                    SYSTEM & I/O
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <SettingsIcon className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono font-bold text-cyan-400 uppercase">
                        {tr(lang, 'Language (EN / ES / FR) & Viewport Calibration', 'Idioma (EN / ES / FR) y Calibración del Visor', 'Langue (EN / ES / FR) & Calibration de la Carte')}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Switch between English, Spanish, and French at any time from the top header bar. Inside the Galaxy Map Settings modal, you can also toggle Y-axis coordinate inversion, grid snapping intervals, and custom reference background maps.',
                        'Cambia el idioma de toda la suite entre Inglés (EN), Español (ES) y Francés (FR) en cualquier momento desde la barra superior. En el menú de Ajustes del Mapa puedes activar la inversión del eje Y, el ajuste a rejilla y las imágenes de fondo de referencia.',
                        'Changez la langue de toute la suite entre Anglais (EN), Espagnol (ES) et Français (FR) à tout moment depuis la barre supérieure. Dans les Options de Carte, réglez l\'inversion de l\'axe Y et la grille.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono font-bold text-emerald-400 uppercase">
                        {tr(lang, 'Desktop Auto-Updates (GitHub Releases)', 'Actualizaciones Automáticas en Escritorio (GitHub Releases)', 'Mises à Jour Automatiques Bureau (GitHub Releases)')}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'When running the native CORVUS Desktop executable (Electron), click the Update button in the top bar to query GitHub Releases. If a newer version is available, CORVUS downloads the installer with a live progress bar and restarts to apply the update.',
                        'En la versión de escritorio nativa (Electron), pulsa el botón de Actualizar en la barra superior para consultar GitHub Releases. Si existe una versión superior, CORVUS descarga el instalador mostrando el progreso y reinicia la aplicación automáticamente.',
                        'Sur la version Bureau native (Electron), cliquez sur le bouton de Mise à Jour dans la barre supérieure pour vérifier GitHub Releases, télécharger la nouvelle version et redémarrer automatiquement.'
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-sm space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-purple-400" />
                      <span className="font-mono font-bold text-purple-400 uppercase">
                        {tr(lang, 'Saving & Exporting to Your Mod Folder', 'Guardado y Exportación hacia la Carpeta de tu Mod', 'Enregistrement & Exportation vers votre Mod')}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      {tr(
                        lang,
                        'Every editor includes a dedicated Export / Download button in its top command bar. CORVUS compiles your changes using the exact encoding required by Star Wars: Empire at War (UTF-8 XML/Lua/TXT, UTF-16LE binary .DAT with sorted keys, and binary MTDF .MTD). Place the exported files into their corresponding Data/ subfolder:',
                        'Cada herramienta incluye un botón de Exportar / Descargar en su barra superior. CORVUS compila tus cambios respetando exactamente la codificación que exige Star Wars: Empire at War (XML/Lua/TXT en UTF-8, binarios .DAT en UTF-16LE con claves ordenadas y binarios .MTD en formato MTDF). Coloca cada archivo exportado en su subcarpeta correspondiente dentro de Data/:',
                        'Chaque outil intègre un bouton Exporter / Télécharger dans sa barre supérieure. CORVUS compile vos modifications dans l\'encodage exact requis par Star Wars: Empire at War (UTF-8 pour XML/Lua/TXT, binaire UTF-16LE trié pour .DAT et binaire MTDF pour .MTD). Placez les fichiers dans le sous-dossier Data/ correspondant :'
                      )}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                      <div className="bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-sm text-slate-300">
                        <span className="text-cyan-400 font-bold">Data/XML/</span> → Planets.xml, TradeRoutes.xml, Campaigns.xml, Story_*.xml, Units
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-sm text-slate-300">
                        <span className="text-purple-400 font-bold">Data/Text/</span> → MasterTextFile_*.dat, Dialog_*.txt
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-sm text-slate-300">
                        <span className="text-amber-400 font-bold">Data/Art/Textures/</span> → *.mtd (+ *.tga / *.dds)
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-sm text-slate-300">
                        <span className="text-yellow-400 font-bold">Data/Scripts/</span> → Story/, AI/, Object/, FreeStore/ (*.lua)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
            {tr(
              lang,
              'CORVUS Galactic Engine. May the Force be with you.',
              'CORVUS Galactic Engine. Que la Fuerza te acompañe.',
              'CORVUS Galactic Engine. Que la Force soit avec vous.'
            )}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-purple-700/80 text-purple-100 hover:bg-purple-600 border border-purple-500 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-colors cursor-pointer"
            id="manual-modal-confirm-btn"
          >
            {tr(lang, 'Understood', 'Entendido', 'Compris')}
          </button>
        </div>
      </div>
    </div>
  );
}
