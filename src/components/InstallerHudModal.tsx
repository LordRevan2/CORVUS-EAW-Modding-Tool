import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  FolderOpen,
  Terminal,
  Download,
  Cpu,
  HardDrive,
  ChevronRight,
  ChevronLeft,
  Play,
  Sparkles,
  FileCode,
  Image as ImageIcon,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useLanguage, tr } from '../i18n';
import packageJson from '../../package.json';

interface InstallerHudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InstallerStep = 'welcome' | 'license' | 'directory' | 'installing' | 'assets';

export default function InstallerHudModal({ isOpen, onClose }: InstallerHudModalProps) {
  const lang = useLanguage();
  const [step, setStep] = useState<InstallerStep>('welcome');
  const [licenseAccepted, setLicenseAccepted] = useState<boolean>(true);
  const [installDir, setInstallDir] = useState<string>(
    'C:\\Users\\Modder\\AppData\\Local\\Programs\\corvus-eaw-modding-tool'
  );
  const [options, setOptions] = useState({
    desktopShortcut: true,
    startMenuShortcut: true,
    fileAssociations: true,
    autoUpdater: true,
    runAfterFinish: true,
  });

  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installComplete, setInstallComplete] = useState<boolean>(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);

  useEffect(() => {
    if (step !== 'installing') return;

    setInstallProgress(0);
    setInstallComplete(false);
    setInstallLogs([
      `[00:00.01] INIT // CORVUS Tactical Setup Wizard v${packageJson.version} (WIN64-NSIS)`,
      `[00:00.04] TARGET // ${installDir}`,
    ]);

    const logSteps = [
      { pct: 14, msg: '[00:00.35] VERIFY // Comprobando integridad del paquete Electron 42.3.3...' },
      { pct: 28, msg: '[00:00.70] EXTRACT // Desempaquetando recursos core (app.asar — 94.2 MB)...' },
      { pct: 45, msg: '[00:01.10] MODULE // Registrando Galaxy & Planet Systems Editor (v2.5) + GC (v3.1)...' },
      { pct: 62, msg: '[00:01.45] MODULE // Configurando compiladores binarios .DAT (UTF-16LE) y .MTD (MTDF)...' },
      { pct: 78, msg: '[00:01.85] MODULE // Inicializando AST Parser de Lua 5.0 y catálogo de Petroglyph...' },
      { pct: 91, msg: '[00:02.20] SYSTEM // Creando accesos directos e icono multi-resolución (icon.ico)...' },
      { pct: 100, msg: `[00:02.55] READY  // Instalación de CORVUS v${packageJson.version} completada con éxito.` },
    ];

    let idx = 0;
    const timer = setInterval(() => {
      if (idx < logSteps.length) {
        const current = logSteps[idx];
        setInstallProgress(current.pct);
        setInstallLogs((prev) => [...prev, current.msg]);
        if (current.pct === 100) {
          setInstallComplete(true);
        }
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 420);

    return () => clearInterval(timer);
  }, [step, installDir]);

  if (!isOpen) return null;

  const stepsList: { id: InstallerStep; num: string; label: string }[] = [
    {
      id: 'welcome',
      num: '01',
      label: tr(lang, 'System Welcome', 'Bienvenida y Sistema', 'Bienvenue & Système'),
    },
    {
      id: 'license',
      num: '02',
      label: tr(lang, 'License Protocol', 'Protocolo de Licencia', 'Protocole de Licence'),
    },
    {
      id: 'directory',
      num: '03',
      label: tr(lang, 'Path & Modules', 'Directorio y Módulos', 'Dossier & Modules'),
    },
    {
      id: 'installing',
      num: '04',
      label: tr(lang, 'Deployment', 'Despliegue / Instalar', 'Déploiement'),
    },
    {
      id: 'assets',
      num: 'NSIS',
      label: tr(lang, 'NSIS Skin & Bitmaps', 'Skin NSIS y Bitmaps', 'Skin NSIS & Bitmaps'),
    },
  ];

  const handleDownloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nshPreview = `; ============================================================================
; CORVUS // EAW MODDING TOOL - CUSTOM DARK TACTICAL HUD NSIS SCRIPT (v${packageJson.version})
; ============================================================================
!ifdef MUI_BGCOLOR
  !undef MUI_BGCOLOR
!endif
!define MUI_BGCOLOR "020617"
!ifdef MUI_TEXTCOLOR
  !undef MUI_TEXTCOLOR
!endif
!define MUI_TEXTCOLOR "E2E8F0"
!ifdef MUI_LICENSEPAGE_BGCOLOR
  !undef MUI_LICENSEPAGE_BGCOLOR
!endif
!define MUI_LICENSEPAGE_BGCOLOR "0F172A"

!macro customHeader
  !ifdef MUI_BGCOLOR
    !undef MUI_BGCOLOR
  !endif
  !define MUI_BGCOLOR "020617"
  !ifdef MUI_TEXTCOLOR
    !undef MUI_TEXTCOLOR
  !endif
  !define MUI_TEXTCOLOR "E2E8F0"
  !ifdef MUI_LICENSEPAGE_BGCOLOR
    !undef MUI_LICENSEPAGE_BGCOLOR
  !endif
  !define MUI_LICENSEPAGE_BGCOLOR "0F172A"
  InstProgressFlags smooth colored
  XPStyle on
  BrandingText "CORVUS // GALACTIC ENGINE v${packageJson.version} — TACTICAL SETUP"
!macroend

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customInstall
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Version" "${packageJson.version}"
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Engine" "Alamo-EAW-FoC"
  WriteRegStr SHCTX "Software\\CORVUS\\ModdingTool" "Theme" "Tactical-HUD-Dark"
!macroend`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none"
      id="installer-hud-modal"
    >
      {/* Outer Tactical Installer Window Frame */}
      <div className="w-full max-w-4xl h-[600px] bg-slate-950 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.18)] rounded-sm flex flex-col overflow-hidden relative">
        {/* Decorative HUD Corner Brackets */}
        <div className="w-3 h-3 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0 pointer-events-none z-20" />
        <div className="w-3 h-3 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0 pointer-events-none z-20" />
        <div className="w-3 h-3 border-b-2 border-l-2 border-amber-400 absolute bottom-0 left-0 pointer-events-none z-20" />
        <div className="w-3 h-3 border-b-2 border-r-2 border-amber-400 absolute bottom-0 right-0 pointer-events-none z-20" />

        {/* Top Installer Window Titlebar */}
        <div className="h-12 bg-slate-900/95 border-b border-cyan-800/60 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {/* Official UI Icon */}
            <div className="w-7 h-7 bg-cyan-500 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <div className="w-4 h-4 border-2 border-slate-950 rotate-45" />
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold tracking-widest uppercase italic text-slate-100">
                CORVUS <span className="font-extralight text-cyan-300/80 not-italic font-mono text-[10px]">// TACTICAL SETUP WIZARD</span>
              </span>
              {/* Silver Badge with Gold Border */}
              <div className="relative overflow-hidden px-2 py-0.5 border border-amber-400/80 bg-gradient-to-b from-slate-200/25 via-slate-300/15 to-slate-400/20 shadow-[0_0_10px_rgba(251,191,36,0.25)] rounded flex items-center">
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-200">
                  v{packageJson.version}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                NSIS // WIN64 HUD
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
              title={tr(lang, 'Close Installer Preview', 'Cerrar Vista del Instalador', "Fermer l'Installateur")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body: Left Tactical Sidebar (164px ratio) + Right Wizard Viewport */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Tactical Sidebar */}
          <div className="w-60 bg-gradient-to-b from-slate-950 via-[#071527] to-slate-950 border-r border-cyan-500/40 flex flex-col justify-between p-4 relative shrink-0 overflow-hidden">
            {/* Subtle Tactical Grid Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #083344 1px, transparent 1px), linear-gradient(to bottom, #083344 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Top Emblem & Branding */}
            <div className="relative z-10 flex flex-col items-center text-center pt-1">
              <div className="w-full flex items-center justify-between px-2 py-1 mb-3 bg-slate-950/90 border border-slate-800 rounded-sm">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">ALAMO HUD</span>
                </span>
                <span className="text-[8px] font-mono text-cyan-400 font-bold">x64</span>
              </div>

              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-cyan-500/20 blur-xl pointer-events-none" />
                <div className="w-16 h-16 bg-cyan-500 rounded-md flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.55)] relative z-10">
                  <div className="w-9 h-9 border-[3.5px] border-slate-950 rotate-45" />
                </div>
              </div>

              <h3 className="text-base font-black tracking-widest uppercase italic text-slate-100 mt-1">
                CORVUS
              </h3>
              <span className="text-[8.5px] font-mono font-bold text-cyan-400 tracking-widest uppercase">
                // EAW MODDING TOOL
              </span>

              {/* Silver Badge with Gold Border */}
              <div className="mt-2 px-3 py-0.5 rounded-sm bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                <span className="text-[9px] font-mono font-black tracking-widest text-slate-950">
                  v{packageJson.version}
                </span>
              </div>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent my-3" />
            </div>

            {/* Step Navigation List */}
            <div className="relative z-10 space-y-1 flex-1">
              {stepsList.map((item) => {
                const isActive = step === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setStep(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-sm font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/70 text-cyan-300 border-l-2 border-cyan-400 font-bold shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded-sm border ${
                        isActive
                          ? 'bg-cyan-900/60 text-cyan-200 border-cyan-500/50'
                          : 'bg-slate-900/80 text-slate-500 border-slate-800'
                      }`}
                    >
                      {item.num}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom System Stamp */}
            <div className="relative z-10 pt-2">
              <div className="w-full py-1.5 px-2 bg-cyan-950/60 border border-cyan-500/50 rounded-sm text-center">
                <span className="text-[8px] font-mono font-bold text-amber-200 uppercase tracking-widest block">
                  SETUP WIZARD // WIN64
                </span>
              </div>
            </div>
          </div>

          {/* Right Wizard Content Pane */}
          <div className="flex-1 flex flex-col justify-between bg-slate-900/40 overflow-hidden">
            {/* Step Header Banner (Mimicking installerHeader.bmp 150x57) */}
            <div className="h-14 bg-gradient-to-r from-slate-950 via-[#091e36] to-slate-950 border-b border-cyan-500/40 px-6 flex items-center justify-between shrink-0 relative">
              <div className="absolute bottom-0 left-0 w-2/3 h-[1px] bg-amber-400/70" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                  {step === 'welcome' &&
                    tr(
                      lang,
                      'STEP 01 // SYSTEM INITIALIZATION & SUITE OVERVIEW',
                      'PASO 01 // INICIALIZACIÓN Y RESUMEN DE LA SUITE',
                      'ÉTAPE 01 // INITIALISATION & APERÇU DE LA SUITE'
                    )}
                  {step === 'license' &&
                    tr(
                      lang,
                      'STEP 02 // MODDER LICENSE & PROTOCOL VERIFICATION',
                      'PASO 02 // PROTOCOLO DE LICENCIA Y TÉRMINOS DE USO',
                      'ÉTAPE 02 // PROTOCOLE DE LICENCE & CONDITIONS'
                    )}
                  {step === 'directory' &&
                    tr(
                      lang,
                      'STEP 03 // TARGET DIRECTORY & TACTICAL MODULES',
                      'PASO 03 // DIRECTORIO DE DESTINO Y MÓDULOS TÁCTICOS',
                      'ÉTAPE 03 // RÉPERTOIRE CIBLE & MODULES TACTIQUES'
                    )}
                  {step === 'installing' &&
                    tr(
                      lang,
                      'STEP 04 // DEPLOYING CORVUS WORKSTATION FILES',
                      'PASO 04 // DESPLEGANDO ARCHIVOS DE LA ESTACIÓN CORVUS',
                      'ÉTAPE 04 // DÉPLOIEMENT DES FICHIERS CORVUS'
                    )}
                  {step === 'assets' &&
                    tr(
                      lang,
                      'NSIS BUILD // NATIVE WINDOWS INSTALLER SKIN & ASSETS',
                      'NSIS BUILD // SKIN E IMÁGENES DEL INSTALADOR NATIVO (.EXE)',
                      'NSIS BUILD // SKIN & RESSOURCES INSTALLATEUR NATIF (.EXE)'
                    )}
                </h4>
                <p className="text-[10px] font-mono text-slate-400">
                  {tr(
                    lang,
                    'Star Wars: Empire at War & Forces of Corruption Modding Environment',
                    'Entorno Táctico de Modding para Star Wars: Empire at War y Forces of Corruption',
                    'Environnement Tactique de Modding pour Star Wars: Empire at War & Forces of Corruption'
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  CORVUS v{packageJson.version}
                </span>
              </div>
            </div>

            {/* Step Body Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              {/* STEP 1: WELCOME */}
              {step === 'welcome' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-950/70 border border-cyan-900/50 p-4 rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                        {tr(
                          lang,
                          'Welcome to the CORVUS Tactical Installer',
                          'Bienvenido al Instalador Táctico de CORVUS',
                          "Bienvenue dans l'Installateur Tactique CORVUS"
                        )}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded-sm">
                        {tr(lang, 'READY TO INSTALL', 'LISTO PARA INSTALAR', 'PRÊT À INSTALLER')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tr(
                        lang,
                        'This assistant will install CORVUS // EAW Modding Tool on your workstation with the custom Dark Tactical HUD theme, multi-resolution icons, and GitHub Releases auto-update integration.',
                        'Este asistente instalará CORVUS // EAW Modding Tool en tu equipo con la interfaz HUD Táctica oscura, iconos multi-resolución y soporte de actualización automática desde GitHub Releases.',
                        "Cet assistant installera CORVUS // EAW Modding Tool sur votre poste avec l'interface HUD Tactique sombre, les icônes multi-résolutions et la mise à jour automatique via GitHub Releases."
                      )}
                    </p>
                  </div>

                  {/* Included Tool Versions Grid */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-2">
                      {tr(
                        lang,
                        'Included Workstation Modules in this Release:',
                        'Módulos Incluidos en esta Versión del Instalador:',
                        'Modules Inclus dans cette Version :'
                      )}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                      {[
                        { name: 'Galaxy & Planets', ver: 'v2.5', color: 'text-cyan-400 border-cyan-900/50' },
                        { name: 'Galactic Conquest', ver: 'v3.1', color: 'text-emerald-400 border-emerald-900/50' },
                        { name: 'Story Plots XML', ver: 'v2.1', color: 'text-emerald-400 border-emerald-900/50' },
                        { name: 'Unit Stat Balance', ver: 'v1.1', color: 'text-emerald-400 border-emerald-900/50' },
                        { name: 'Strings .DAT Editor', ver: 'v1.2', color: 'text-purple-400 border-purple-900/50' },
                        { name: 'Mega-Textures .MTD', ver: 'v1.2', color: 'text-amber-400 border-amber-900/50' },
                        { name: 'Dialog & Holo .TXT', ver: 'v1.1', color: 'text-cyan-400 border-cyan-900/50' },
                        { name: 'Raw XML Code DOM', ver: 'v2.1', color: 'text-rose-400 border-rose-900/50' },
                        { name: 'Raw LUA 5.0 IDE', ver: 'v2.1', color: 'text-yellow-400 border-yellow-900/50' },
                      ].map((m, idx) => (
                        <div
                          key={idx}
                          className={`bg-slate-950/80 border ${m.color} px-2.5 py-2 rounded-sm flex items-center justify-between`}
                        >
                          <span className="text-slate-200 truncate">{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-bold">
                            {m.ver}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Telemetry */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-sm flex items-center space-x-2.5">
                      <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">ARCHITECTURE</span>
                        <span className="text-[11px] font-mono text-slate-200 font-bold">Windows x64 (NSIS)</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-sm flex items-center space-x-2.5">
                      <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">PACKAGE SIZE</span>
                        <span className="text-[11px] font-mono text-slate-200 font-bold">148.4 MB (Unpacked)</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-sm flex items-center space-x-2.5">
                      <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">AUTO-UPDATER</span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">GitHub Releases</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LICENSE */}
              {step === 'license' && (
                <div className="space-y-3 animate-fade-in h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {tr(
                        lang,
                        'Review the modding license agreement before continuing:',
                        'Revisa el acuerdo de licencia de modding antes de continuar:',
                        'Veuillez lire le contrat de licence avant de continuer :'
                      )}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400">build/LICENSE.txt</span>
                  </div>

                  <pre className="flex-1 bg-slate-950 border border-slate-800 p-3.5 rounded-sm font-mono text-[10px] text-slate-300 overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">
{`================================================================================
   CORVUS // STAR WARS: EMPIRE AT WAR TACTICAL MODDING SUITE (v${packageJson.version})
   PROTOCOLO DE LICENCIA Y USO PARA MODDERS // LICENSE & USAGE AGREEMENT
================================================================================

1. PROPÓSITO DE LA SUITE
   CORVUS es una estación de trabajo e ingeniería de modding desarrollada para
   la comunidad de Star Wars: Empire at War y Forces of Corruption (Alamo Engine).

2. HERRAMIENTAS INCLUIDAS EN ESTA DISTRIBUCIÓN (v${packageJson.version})
   • Editor de Galaxia, Planetas y Rutas Comerciales (v2.5)
   • Editor de Conquista Galáctica - Campaigns.xml (v3.1)
   • Editor de Eventos de Historia - Story_*.xml (v2.1)
   • Editor de Balance de Unidades - Space/Ground (v1.1)
   • Compilador Binario de Traducciones .DAT UTF-16LE (v1.2)
   • Gestor de Atlas Mega-Texturas .MTD + UV (v1.2)
   • Editor de Diálogos y Simulador de Holo-Terminal .TXT (v1.1)
   • Editor de Código XML DOM (v2.1)
   • Entorno de Desarrollo LUA 5.0 con Auditor Semántico (v2.1)

3. LIBERTAD DE CREACIÓN
   Todos los archivos XML, LUA, DAT, MTD y TXT generados o modificados con
   CORVUS pertenecen íntegramente al autor del mod.`}
                  </pre>

                  <label className="flex items-center space-x-2.5 bg-slate-950/80 border border-cyan-900/50 p-3 rounded-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={licenseAccepted}
                      onChange={(e) => setLicenseAccepted(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-200">
                      {tr(
                        lang,
                        'I accept the terms of the CORVUS Tactical Modding Suite License Agreement.',
                        'Acepto los términos del Protocolo de Licencia de CORVUS Tactical Modding Suite.',
                        "J'accepte les termes du Contrat de Licence CORVUS Tactical Modding Suite."
                      )}
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 3: DIRECTORY & MODULES */}
              {step === 'directory' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-sm space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                      {tr(
                        lang,
                        'Destination Installation Folder:',
                        'Carpeta de Destino de la Instalación:',
                        "Dossier de Destination de l'Installation :"
                      )}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={installDir}
                        onChange={(e) => setInstallDir(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 px-3 py-2 text-xs font-mono text-slate-200 rounded-sm focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          setInstallDir('C:\\Games\\CORVUS-EAW-Modding-Tool')
                        }
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 font-mono text-[10px] uppercase tracking-wider rounded-sm flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{tr(lang, 'Browse...', 'Examinar...', 'Parcourir...')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-sm space-y-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                      {tr(
                        lang,
                        'Shortcuts & System Integration:',
                        'Accesos Directos e Integración del Sistema:',
                        'Raccourcis & Intégration Système :'
                      )}
                    </span>

                    {[
                      {
                        key: 'desktopShortcut' as const,
                        label: tr(
                          lang,
                          'Create Desktop Shortcut (CORVUS - EAW Modding Tool)',
                          'Crear acceso directo en el Escritorio (CORVUS - EAW Modding Tool)',
                          'Créer un raccourci sur le Bureau (CORVUS - EAW Modding Tool)'
                        ),
                      },
                      {
                        key: 'startMenuShortcut' as const,
                        label: tr(
                          lang,
                          'Create Start Menu Entry (CORVUS Modding)',
                          'Crear carpeta en el Menú Inicio (CORVUS Modding)',
                          'Créer un dossier dans le Menu Démarrer (CORVUS Modding)'
                        ),
                      },
                      {
                        key: 'fileAssociations' as const,
                        label: tr(
                          lang,
                          'Register Alamo Engine Modding File Icons (.dat, .mtd, .xml, .lua)',
                          'Registrar asociación de formatos de modding (.dat, .mtd, .xml, .lua)',
                          'Enregistrer les extensions de fichiers modding (.dat, .mtd, .xml, .lua)'
                        ),
                      },
                      {
                        key: 'autoUpdater' as const,
                        label: tr(
                          lang,
                          'Enable automatic GitHub Releases update checker (electron-updater)',
                          'Activar comprobador automático de actualizaciones vía GitHub Releases',
                          'Activer la vérification automatique des mises à jour GitHub Releases'
                        ),
                      },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-cyan-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={options[opt.key]}
                          onChange={(e) =>
                            setOptions({ ...options, [opt.key]: e.target.checked })
                          }
                          className="accent-cyan-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="font-mono text-[11px]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: INSTALLING PROGRESS & TELEMETRY */}
              {step === 'installing' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm space-y-2.5">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-cyan-400 font-bold uppercase">
                        {installComplete
                          ? tr(
                              lang,
                              'INSTALLATION COMPLETED SUCCESSFULLY',
                              'INSTALACIÓN COMPLETADA CON ÉXITO',
                              'INSTALLATION TERMINÉE AVEC SUCCÈS'
                            )
                          : tr(
                              lang,
                              'DEPLOYING TACTICAL MODDING SUITE...',
                              'DESPLEGANDO SUITE TÁCTICA DE MODDING...',
                              'DÉPLOIEMENT DE LA SUITE TACTIQUE...'
                            )}
                      </span>
                      <span className="text-amber-400 font-bold">{installProgress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-900 border border-slate-700 rounded-sm overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-amber-400 transition-all duration-300 rounded-xs"
                        style={{ width: `${installProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Console Output */}
                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-sm h-48 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5">
                    {installLogs.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.includes('READY')
                            ? 'text-emerald-400 font-bold'
                            : line.includes('MODULE')
                            ? 'text-cyan-300'
                            : 'text-slate-400'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </div>

                  {installComplete && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-sm flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono text-emerald-200">
                          {tr(
                            lang,
                            `CORVUS v${packageJson.version} is ready to launch.`,
                            `CORVUS v${packageJson.version} está listo para ejecutarse.`,
                            `CORVUS v${packageJson.version} est prêt à être lancé.`
                          )}
                        </span>
                      </div>
                      <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-widest rounded-sm cursor-pointer"
                      >
                        {tr(lang, 'Launch CORVUS', 'Iniciar CORVUS', 'Lancer CORVUS')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: NSIS NATIVE INSTALLER SKIN & ASSETS */}
              {step === 'assets' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-950/70 border border-cyan-900/50 p-3.5 rounded-sm text-xs text-slate-300 leading-relaxed">
                    {tr(
                      lang,
                      'When you run "npm run electron:build:win", electron-builder compiles the Windows .exe installer using these generated 24-bit HUD bitmaps (public/installerSidebar.bmp & public/installerHeader.bmp) and the dark NSIS script (build/installer.nsh).',
                      'Al ejecutar "npm run electron:build:win", electron-builder compila el instalador .exe de Windows utilizando estos bitmaps HUD de 24 bits (public/installerSidebar.bmp y public/installerHeader.bmp) y el script de tema oscuro (build/installer.nsh).',
                      'Lorsque vous exécutez « npm run electron:build:win », electron-builder compile l\'installateur Windows .exe avec ces bitmaps HUD 24 bits et le script sombre build/installer.nsh.'
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sidebar & Header BMP Previews */}
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-sm flex flex-col items-center space-y-3">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold self-start">
                        1. installerSidebar.bmp (164×314) & installerHeader.bmp (150×57)
                      </span>
                      <div className="flex items-start space-x-4">
                        <div className="text-center space-y-1">
                          <img
                            src="/installerSidebar.png"
                            alt="NSIS Sidebar HUD"
                            className="w-[123px] h-[235px] border border-cyan-500/40 rounded-xs object-cover shadow-lg"
                          />
                          <a
                            href="/installerSidebar.bmp"
                            download="installerSidebar.bmp"
                            className="inline-flex items-center space-x-1 text-[9px] font-mono text-cyan-400 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            <span>installerSidebar.bmp</span>
                          </a>
                        </div>
                        <div className="flex flex-col space-y-3 items-center">
                          <div className="text-center space-y-1">
                            <img
                              src="/installerHeader.png"
                              alt="NSIS Header HUD"
                              className="w-[150px] h-[57px] border border-cyan-500/40 rounded-xs object-cover shadow-lg"
                            />
                            <a
                              href="/installerHeader.bmp"
                              download="installerHeader.bmp"
                              className="inline-flex items-center space-x-1 text-[9px] font-mono text-cyan-400 hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>installerHeader.bmp</span>
                            </a>
                          </div>

                          <div className="text-center space-y-1 pt-2 border-t border-slate-800 w-full">
                            <img
                              src="/icon.png"
                              alt="App Icon"
                              className="w-14 h-14 mx-auto rounded-sm border border-slate-800"
                            />
                            <a
                              href="/icon.ico"
                              download="icon.ico"
                              className="inline-flex items-center space-x-1 text-[9px] font-mono text-amber-400 hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>icon.ico (Multi-Res)</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* build/installer.nsh preview */}
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-sm flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                          2. build/installer.nsh (Dark HUD Macro)
                        </span>
                        <button
                          onClick={() => handleDownloadTextFile('installer.nsh', nshPreview)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 rounded-sm text-[9px] font-mono cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>installer.nsh</span>
                        </button>
                      </div>
                      <pre className="flex-1 bg-slate-900/80 border border-slate-800 p-2.5 rounded-sm font-mono text-[9.5px] text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed">
                        {nshPreview}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Wizard Controls Bar */}
            <div className="h-14 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setStep(step === 'assets' ? 'welcome' : 'assets')
                  }
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 font-mono text-[10px] uppercase tracking-wider rounded-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {step === 'assets'
                      ? tr(lang, 'Back to Wizard', 'Volver al Asistente', "Retour à l'Assistant")
                      : tr(lang, 'NSIS Bitmaps & .NSH', 'Ver Bitmaps NSIS y .NSH', 'Bitmaps NSIS & .NSH')}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-2.5">
                {step !== 'welcome' && step !== 'assets' && (
                  <button
                    onClick={() => {
                      if (step === 'license') setStep('welcome');
                      else if (step === 'directory') setStep('license');
                      else if (step === 'installing') setStep('directory');
                    }}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] uppercase tracking-wider rounded-sm flex items-center space-x-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'Back', 'Atrás', 'Précédent')}</span>
                  </button>
                )}

                {step === 'welcome' && (
                  <button
                    onClick={() => setStep('license')}
                    className="px-5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-widest rounded-sm flex items-center space-x-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                  >
                    <span>{tr(lang, 'Next', 'Siguiente', 'Suivant')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {step === 'license' && (
                  <button
                    disabled={!licenseAccepted}
                    onClick={() => setStep('directory')}
                    className={`px-5 py-1.5 font-mono font-bold text-[10px] uppercase tracking-widest rounded-sm flex items-center space-x-1.5 ${
                      licenseAccepted
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <span>{tr(lang, 'Accept & Continue', 'Aceptar y Continuar', 'Accepter & Continuer')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {step === 'directory' && (
                  <button
                    onClick={() => setStep('installing')}
                    className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-widest rounded-sm flex items-center space-x-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{tr(lang, 'Install Now', 'Instalar Ahora', 'Installer Maintenant')}</span>
                  </button>
                )}

                {(step === 'installing' || step === 'assets') && (
                  <button
                    onClick={onClose}
                    className="px-5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-[10px] uppercase tracking-widest rounded-sm cursor-pointer"
                  >
                    {tr(lang, 'Finish', 'Finalizar', 'Terminer')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
