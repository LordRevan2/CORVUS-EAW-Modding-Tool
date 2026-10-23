import React, { useRef, useState } from 'react';
import packageJson from '../package.json';
import { Upload, Download, Moon, AlertTriangle, Database, XCircle, Route, Globe, BookOpen, FileText, Settings as SettingsIcon, RefreshCw, Folder, Code, Shield } from 'lucide-react';
import { Planet, TradeRoute, AppSettings, StoryEvent, Campaign } from './types';
import { parsePlanetsXml, parseTradeRoutesXml, serializeXml, updatePlanetPositionInDoc, parseStoryXml, parseCampaignsXml, updateCampaignInDoc, createSampleCampaignsXml, parseCampaignElement, createSampleStoryXml } from './lib/xml';
import PlanetList from './components/PlanetList';
import GalaxyMap from './components/GalaxyMap';
import PlanetEditor from './components/PlanetEditor';
import BulkEditModal from './components/BulkEditModal';
import TradeRouteList from './components/TradeRouteList';
import TradeRouteEditor from './components/TradeRouteEditor';
import CampaignList from './components/CampaignList';
import CampaignEditor from './components/CampaignEditor';
import SettingsModal from './components/SettingsModal';
import ManualModal from './components/ManualModal';
import InstallerHudModal from './components/InstallerHudModal';
import DatEditor from './components/DatEditor';
import MtdEditor from './components/MtdEditor';
import StoryEditor from './components/StoryEditor';
import XmlEditor, { CodeEditorWithLines } from './components/XmlEditor';
import LuaEditor from './components/LuaEditor';
import UpdaterUI from './components/UpdaterUI';
import UnitEditor from './components/UnitEditor';
import DialogEditor from './components/DialogEditor';
import ErrorModal, { AppErrorType } from './components/ErrorModal';
import { parseDatFile, DatRecord } from './lib/dat';
import { parseMtd, MtdIcon } from './lib/mtd';
import { fileToImageUrl, findGalaxyBackgroundImage } from './lib/imageUtils';
import { I18nProvider, useTranslation, useLanguage, tr } from './i18n';

function AppContent({ settings, setSettings }: { settings: AppSettings, setSettings: (s: AppSettings) => void }) {
  const t = useTranslation();
  const [xmlDoc, setXmlDoc] = useState<XMLDocument | null>(null);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [tradeRoutesXmlDoc, setTradeRoutesXmlDoc] = useState<XMLDocument | null>(null);
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>([]);
  const [galaxyBgUrl, setGalaxyBgUrl] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TradeRoute | null>(null);
  const [campaignsXmlDoc, setCampaignsXmlDoc] = useState<XMLDocument | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignFileName, setCampaignFileName] = useState<string>('Campaigns.xml');
  const [mapClickTogglesCampaignPlanet, setMapClickTogglesCampaignPlanet] = useState<boolean>(false);
  const [isCampaignPreview, setIsCampaignPreview] = useState<boolean>(true);
  const [hideExcludedInPreview, setHideExcludedInPreview] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'planets' | 'routes' | 'campaigns'>('planets');
  const [error, setError] = useState<AppErrorType>(null);

  const [planetToolMode, setPlanetToolMode] = useState<'visual' | 'code'>('visual');
  const [planetXmlCode, setPlanetXmlCode] = useState<string>('');
  const [tradeRoutesXmlCode, setTradeRoutesXmlCode] = useState<string>('');
  const [campaignsXmlCode, setCampaignsXmlCode] = useState<string>('');

  const [showCore, setShowCore] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isInstallerHudOpen, setIsInstallerHudOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('installer') === '1';
    }
    return false;
  });

  const [datRecords, setDatRecords] = useState<DatRecord[] | null>(null);
  const [datFormat, setDatFormat] = useState<'indexed' | 'sequential_mult2' | 'sequential_mult1'>('indexed');
  const [datFileName, setDatFileName] = useState<string>('MasterTextFile.dat');

  const [mtdIcons, setMtdIcons] = useState<MtdIcon[] | null>(null);
  const [mtdFileName, setMtdFileName] = useState<string>('Mt_commandbar.mtd');
  const [mtdInitialTexture, setMtdInitialTexture] = useState<File | null>(null);

  const [storyDoc, setStoryDoc] = useState<XMLDocument | null>(null);
  const [storyEvents, setStoryEvents] = useState<StoryEvent[] | null>(null);
  const [storyFileName, setStoryFileName] = useState<string>('Story.xml');

  const [rawXmlContent, setRawXmlContent] = useState<string | null>(null);
  const [rawXmlFileName, setRawXmlFileName] = useState<string>('Generic.xml');

  const [rawLuaContent, setRawLuaContent] = useState<string | null>(null);
  const [rawLuaFileName, setRawLuaFileName] = useState<string>('Script.lua');

  const [unitDoc, setUnitDoc] = useState<XMLDocument | null>(null);
  const [unitFileName, setUnitFileName] = useState<string>('Units.xml');

  const [activeDialogContent, setActiveDialogContent] = useState<string | null>(null);
  const [activeDialogFileName, setActiveDialogFileName] = useState<string>('Story_Campaign_Dialogs.txt');
  const dialogFileInputRef = useRef<HTMLInputElement>(null);

  const [workspaceFiles, setWorkspaceFiles] = useState<File[]>([]);
  const [selectedDatPath, setSelectedDatPath] = useState<string>('');
  const [selectedMtdPath, setSelectedMtdPath] = useState<string>('');
  const [selectedStoryPath, setSelectedStoryPath] = useState<string>('');
  const [selectedXmlPath, setSelectedXmlPath] = useState<string>('');
  const [selectedUnitPath, setSelectedUnitPath] = useState<string>('');
  const [toolsSearchQuery, setToolsSearchQuery] = useState<string>('');
  const [selectedToolCategory, setSelectedToolCategory] = useState<'all' | 'galaxy' | 'localization' | 'raw_code'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const trFileInputRef = useRef<HTMLInputElement>(null);
  const campaignFileInputRef = useRef<HTMLInputElement>(null);
  const datFileInputRef = useRef<HTMLInputElement>(null);
  const mtdFileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);
  const luaFileInputRef = useRef<HTMLInputElement>(null);
  const unitFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const lang = useLanguage();

  const displayPlanets = planets.filter(p => showCore || p.name.toLowerCase() !== 'galaxy_core_art_model');

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setWorkspaceFiles(files);
    setSelectedDatPath('');
    setSelectedMtdPath('');
    setSelectedStoryPath('');
    setError(null);
    
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const readFileAsText = (file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
        });
    };

    const readFileAsArrayBuffer = (file: File) => {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as ArrayBuffer);
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    };

  const ensureGalaxyLoadedForCampaigns = async () => {
    if (xmlDoc && planets.length > 0) return { loadedPlanets: planets, loadedRoutes: tradeRoutes };

    let planetsFile = workspaceFiles.find(f => f.name.toLowerCase() === 'planets.xml' || f.name.toLowerCase() === 'planet.xml')
      || workspaceFiles.find(f => f.name.toLowerCase().includes('planet') && f.name.toLowerCase().endsWith('.xml'));
    let routesFile = workspaceFiles.find(f => f.name.toLowerCase() === 'traderoutes.xml')
      || workspaceFiles.find(f => f.name.toLowerCase().includes('route') && f.name.toLowerCase().endsWith('.xml'));

    let loadedPlanets: Planet[] = planets;
    let loadedRoutes: TradeRoute[] = tradeRoutes;

    if (planetsFile) {
      const content = await readFileAsText(planetsFile);
      const parsed = parsePlanetsXml(content);
      setXmlDoc(parsed.doc);
      setPlanets(parsed.planets);
      loadedPlanets = parsed.planets;
    } else if (!xmlDoc) {
      // Seed canonical EAW Star Wars galaxy systems so the interactive map works immediately
      const defaultPlanetsXml = `<?xml version="1.0" encoding="utf-8"?>
<Planets>
  <Planet Name="Galaxy_Core_Art_Model"><Galactic_Position>0.0, 0.0, 0.0</Galactic_Position></Planet>
  <Planet Name="Coruscant"><Galactic_Position>-35.0, 62.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>6</Zoomed_Terrain_Index></Planet>
  <Planet Name="Kuat"><Galactic_Position>58.0, 44.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>0</Zoomed_Terrain_Index></Planet>
  <Planet Name="Corellia"><Galactic_Position>45.0, -32.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>0</Zoomed_Terrain_Index></Planet>
  <Planet Name="Alderaan"><Galactic_Position>15.0, 52.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>0</Zoomed_Terrain_Index></Planet>
  <Planet Name="Byss"><Galactic_Position>-22.0, -18.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>6</Zoomed_Terrain_Index></Planet>
  <Planet Name="Carida"><Galactic_Position>28.0, 118.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>5</Zoomed_Terrain_Index></Planet>
  <Planet Name="Mandalore"><Galactic_Position>130.0, 195.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>5</Zoomed_Terrain_Index></Planet>
  <Planet Name="Kashyyyk"><Galactic_Position>195.0, 95.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>12</Zoomed_Terrain_Index></Planet>
  <Planet Name="Yavin"><Galactic_Position>165.0, 275.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>12</Zoomed_Terrain_Index></Planet>
  <Planet Name="MonCalimari"><Galactic_Position>395.0, 230.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>9</Zoomed_Terrain_Index></Planet>
  <Planet Name="Tatooine"><Galactic_Position>270.0, -210.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>1</Zoomed_Terrain_Index></Planet>
  <Planet Name="Geonosis"><Galactic_Position>295.0, -245.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>10</Zoomed_Terrain_Index></Planet>
  <Planet Name="Kamino"><Galactic_Position>380.0, -185.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>9</Zoomed_Terrain_Index></Planet>
  <Planet Name="Naboo"><Galactic_Position>135.0, -195.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>0</Zoomed_Terrain_Index></Planet>
  <Planet Name="Hoth"><Galactic_Position>-125.0, -285.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>4</Zoomed_Terrain_Index></Planet>
  <Planet Name="Bespin"><Galactic_Position>-145.0, -230.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>11</Zoomed_Terrain_Index></Planet>
  <Planet Name="Mustafar"><Galactic_Position>-85.0, -345.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>3</Zoomed_Terrain_Index></Planet>
  <Planet Name="Sullust"><Galactic_Position>-20.0, -240.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>3</Zoomed_Terrain_Index></Planet>
  <Planet Name="Eriadu"><Galactic_Position>35.0, -275.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>6</Zoomed_Terrain_Index></Planet>
  <Planet Name="Endor"><Galactic_Position>-295.0, -190.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>5</Zoomed_Terrain_Index></Planet>
  <Planet Name="Dantooine"><Galactic_Position>-65.0, 310.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>0</Zoomed_Terrain_Index></Planet>
  <Planet Name="Ord_Mantell"><Galactic_Position>-45.0, 175.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>7</Zoomed_Terrain_Index></Planet>
  <Planet Name="Ilum"><Galactic_Position>-260.0, 240.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>4</Zoomed_Terrain_Index></Planet>
  <Planet Name="Bothawui"><Galactic_Position>215.0, -95.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>0</Zoomed_Terrain_Index></Planet>
  <Planet Name="Ryloth"><Galactic_Position>245.0, -330.0, 0.0</Galactic_Position><Zoomed_Terrain_Index>10</Zoomed_Terrain_Index></Planet>
</Planets>`;
      const parsed = parsePlanetsXml(defaultPlanetsXml);
      setXmlDoc(parsed.doc);
      setPlanets(parsed.planets);
      loadedPlanets = parsed.planets;
    }

    if (routesFile) {
      const content = await readFileAsText(routesFile);
      const parsed = parseTradeRoutesXml(content);
      setTradeRoutesXmlDoc(parsed.doc);
      setTradeRoutes(parsed.tradeRoutes);
      loadedRoutes = parsed.tradeRoutes;
    } else if (!tradeRoutesXmlDoc) {
      const defaultRoutesXml = `<?xml version="1.0" encoding="utf-8"?>
<TradeRoutes>
  <TradeRoute Name="Coruscant_Alderaan"><Point_A>Coruscant</Point_A><Point_B>Alderaan</Point_B></TradeRoute>
  <TradeRoute Name="Alderaan_Kuat"><Point_A>Alderaan</Point_A><Point_B>Kuat</Point_B></TradeRoute>
  <TradeRoute Name="Kuat_Corellia"><Point_A>Kuat</Point_A><Point_B>Corellia</Point_B></TradeRoute>
  <TradeRoute Name="Coruscant_Byss"><Point_A>Coruscant</Point_A><Point_B>Byss</Point_B></TradeRoute>
  <TradeRoute Name="Alderaan_Carida"><Point_A>Alderaan</Point_A><Point_B>Carida</Point_B></TradeRoute>
  <TradeRoute Name="Carida_Mandalore"><Point_A>Carida</Point_A><Point_B>Mandalore</Point_B></TradeRoute>
  <TradeRoute Name="Mandalore_Yavin"><Point_A>Mandalore</Point_A><Point_B>Yavin</Point_B></TradeRoute>
  <TradeRoute Name="Kuat_Kashyyyk"><Point_A>Kuat</Point_A><Point_B>Kashyyyk</Point_B></TradeRoute>
  <TradeRoute Name="Kashyyyk_MonCalimari"><Point_A>Kashyyyk</Point_A><Point_B>MonCalimari</Point_B></TradeRoute>
  <TradeRoute Name="Corellia_Bothawui"><Point_A>Corellia</Point_A><Point_B>Bothawui</Point_B></TradeRoute>
  <TradeRoute Name="Bothawui_Tatooine"><Point_A>Bothawui</Point_A><Point_B>Tatooine</Point_B></TradeRoute>
  <TradeRoute Name="Tatooine_Geonosis"><Point_A>Tatooine</Point_A><Point_B>Geonosis</Point_B></TradeRoute>
  <TradeRoute Name="Geonosis_Kamino"><Point_A>Geonosis</Point_A><Point_B>Kamino</Point_B></TradeRoute>
  <TradeRoute Name="Corellia_Naboo"><Point_A>Corellia</Point_A><Point_B>Naboo</Point_B></TradeRoute>
  <TradeRoute Name="Naboo_Eriadu"><Point_A>Naboo</Point_A><Point_B>Eriadu</Point_B></TradeRoute>
  <TradeRoute Name="Eriadu_Sullust"><Point_A>Eriadu</Point_A><Point_B>Sullust</Point_B></TradeRoute>
  <TradeRoute Name="Sullust_Bespin"><Point_A>Sullust</Point_A><Point_B>Bespin</Point_B></TradeRoute>
  <TradeRoute Name="Bespin_Hoth"><Point_A>Bespin</Point_A><Point_B>Hoth</Point_B></TradeRoute>
  <TradeRoute Name="Hoth_Mustafar"><Point_A>Hoth</Point_A><Point_B>Mustafar</Point_B></TradeRoute>
  <TradeRoute Name="Bespin_Endor"><Point_A>Bespin</Point_A><Point_B>Endor</Point_B></TradeRoute>
  <TradeRoute Name="Coruscant_Ord_Mantell"><Point_A>Coruscant</Point_A><Point_B>Ord_Mantell</Point_B></TradeRoute>
  <TradeRoute Name="Ord_Mantell_Dantooine"><Point_A>Ord_Mantell</Point_A><Point_B>Dantooine</Point_B></TradeRoute>
</TradeRoutes>`;
      const parsed = parseTradeRoutesXml(defaultRoutesXml);
      setTradeRoutesXmlDoc(parsed.doc);
      setTradeRoutes(parsed.tradeRoutes);
      loadedRoutes = parsed.tradeRoutes;
    }

    return { loadedPlanets, loadedRoutes };
  };

  const editGalaxyFromWorkspace = async () => {
    let planetsFile = workspaceFiles.find(f => f.name.toLowerCase() === 'planets.xml' || f.name.toLowerCase() === 'planet.xml')
      || workspaceFiles.find(f => f.name.toLowerCase().includes('planet') && f.name.toLowerCase().endsWith('.xml'));
    let routesFile = workspaceFiles.find(f => f.name.toLowerCase() === 'traderoutes.xml')
      || workspaceFiles.find(f => f.name.toLowerCase().includes('route') && f.name.toLowerCase().endsWith('.xml'));
    let campaignsFile = workspaceFiles.find(f => f.name.toLowerCase() === 'campaigns.xml')
      || workspaceFiles.find(f => f.name.toLowerCase().includes('campaign') && f.name.toLowerCase().endsWith('.xml'));
    
    try {
      if (planetsFile) {
        const content = await readFileAsText(planetsFile);
        const parsed = parsePlanetsXml(content);
        setXmlDoc(parsed.doc);
        setPlanets(parsed.planets);
        setSelectedPlanet(null);
      }
      if (routesFile) {
        const content = await readFileAsText(routesFile);
        const parsed = parseTradeRoutesXml(content);
        setTradeRoutesXmlDoc(parsed.doc);
        setTradeRoutes(parsed.tradeRoutes);
      }
      if (campaignsFile) {
        const content = await readFileAsText(campaignsFile);
        const parsed = parseCampaignsXml(content);
        setCampaignsXmlDoc(parsed.doc);
        setCampaigns(parsed.campaigns);
        setSelectedCampaign(parsed.campaigns[0] || null);
        setCampaignFileName(campaignsFile.name);
      }

      // Auto-detect and load galaxy background texture from workspace (TGA / PNG / JPG)
      const bgFile = findGalaxyBackgroundImage(workspaceFiles);
      if (bgFile) {
        try {
          const bgUrl = await fileToImageUrl(bgFile);
          setGalaxyBgUrl(bgUrl);
        } catch (bgErr) {
          console.warn('Could not auto-load galaxy background texture:', bgErr);
        }
      }

      if (!planetsFile && !routesFile && !campaignsFile) {
        setError(lang === 'es' ? 'No se encontraron archivos XML de galaxia (Planets.xml, TradeRoutes.xml o Campaigns.xml) en el workspace.' : 'No galaxy XML files (Planets.xml, TradeRoutes.xml or Campaigns.xml) found in workspace.');
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing Galaxy XMLs');
    }
  };

  const loadDatFromWorkspace = async (path: string) => {
    const datFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!datFile) return;
    try {
        const buffer = await readFileAsArrayBuffer(datFile);
        const parsed = parseDatFile(buffer);
        setDatRecords(parsed.records);
        setDatFormat(parsed.format);
        setDatFileName(datFile.name);
    } catch (err: any) {
        setError(err.message || 'Error parsing .DAT file');
    }
  };

  const loadMtdFromWorkspace = async (path: string) => {
    const mtdFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!mtdFile) return;
    try {
        const buffer = await readFileAsArrayBuffer(mtdFile);
        const parsed = parseMtd(buffer);
        setMtdIcons(parsed);
        setMtdFileName(mtdFile.name);
        
        const baseName = mtdFile.name.replace(/\.[^/.]+$/, "").toLowerCase();
        let mtdTexture = workspaceFiles.find(f => {
            const fname = f.name.toLowerCase();
            return fname === `${baseName}.tga` || fname === `${baseName}.png` || fname === `${baseName}.jpg`;
        });
        setMtdInitialTexture(mtdTexture || null);
    } catch (err: any) {
        setError(err.message || 'Error parsing .MTD file');
    }
  };

  const loadStoryFromWorkspace = async (path: string) => {
    const storyFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!storyFile) return;
    try {
        const content = await readFileAsText(storyFile);
        const parsed = parseStoryXml(content);
        setStoryDoc(parsed.doc);
        setStoryEvents(parsed.storyEvents);
        setStoryFileName(storyFile.name);
    } catch (err: any) {
        setError(err.message || 'Error parsing Story XML');
    }
  };

  const togglePlanetToolMode = () => {
    if (planetToolMode === 'visual') {
      if (xmlDoc) setPlanetXmlCode(serializeXml(xmlDoc));
      if (tradeRoutesXmlDoc) setTradeRoutesXmlCode(serializeXml(tradeRoutesXmlDoc));
      if (campaignsXmlDoc) setCampaignsXmlCode(serializeXml(campaignsXmlDoc));
      setPlanetToolMode('code');
    } else {
      try {
        if (xmlDoc) {
           const parsedPlanets = parsePlanetsXml(planetXmlCode);
           setXmlDoc(parsedPlanets.doc);
           setPlanets(parsedPlanets.planets);
        }
        if (tradeRoutesXmlDoc) {
           const parsedRoutes = parseTradeRoutesXml(tradeRoutesXmlCode);
           setTradeRoutesXmlDoc(parsedRoutes.doc);
           setTradeRoutes(parsedRoutes.tradeRoutes);
        }
        if (campaignsXmlDoc && campaignsXmlCode.trim()) {
           const parsedCampaigns = parseCampaignsXml(campaignsXmlCode);
           setCampaignsXmlDoc(parsedCampaigns.doc);
           setCampaigns(parsedCampaigns.campaigns);
           setSelectedCampaign(parsedCampaigns.campaigns[0] || null);
        }
        setPlanetToolMode('visual');
      } catch (err: any) {
        setError({
          code: 'ERR_XML_PARSE',
          message: 'Error parsing XML. Please fix the formatting errors before switching back to Visual Mode.',
          details: err.message || String(err)
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.includes('planet') || !fileName.endsWith('.xml')) {
      setError(t.errors.invalidPlanetSet);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parsePlanetsXml(content);
        setXmlDoc(parsed.doc);
        setPlanets(parsed.planets);
        setSelectedPlanet(null);
      } catch (err: any) {
        setError(err.message || t.errors.importXml);
      }
    };
    reader.onerror = () => setError(t.errors.readXml);
    reader.readAsText(file);
    
    // Clear input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTradeRoutesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.includes('route') || !fileName.endsWith('.xml')) {
      setError('File must be an XML containing TradeRoutes');
      if (trFileInputRef.current) trFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseTradeRoutesXml(content);
        setTradeRoutesXmlDoc(parsed.doc);
        setTradeRoutes(parsed.tradeRoutes);
      } catch (err: any) {
        setError(err.message || 'Error processing TradeRoutes XML');
      }
    };
    reader.onerror = () => setError('Error reading the file');
    reader.readAsText(file);
    
    if (trFileInputRef.current) trFileInputRef.current.value = '';
  };

  const loadCampaignsFromWorkspace = async (path: string) => {
    const campFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!campFile) return;
    try {
      await ensureGalaxyLoadedForCampaigns();
      const content = await readFileAsText(campFile);
      const parsed = parseCampaignsXml(content);
      setCampaignsXmlDoc(parsed.doc);
      setCampaigns(parsed.campaigns);
      setSelectedCampaign(parsed.campaigns[0] || null);
      setCampaignFileName(campFile.name);
      setActiveTab('campaigns');
    } catch (err: any) {
      setError(err.message || 'Error parsing Campaigns XML');
    }
  };

  const handleCampaignsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('File must be an XML file containing Campaigns');
      if (campaignFileInputRef.current) campaignFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await ensureGalaxyLoadedForCampaigns();
        const content = event.target?.result as string;
        const parsed = parseCampaignsXml(content);
        setCampaignsXmlDoc(parsed.doc);
        setCampaigns(parsed.campaigns);
        setSelectedCampaign(parsed.campaigns[0] || null);
        setCampaignFileName(file.name);
        setActiveTab('campaigns');
      } catch (err: any) {
        setError(err.message || 'Error processing Campaigns XML');
      }
    };
    reader.onerror = () => setError('Error reading the file');
    reader.readAsText(file);

    if (campaignFileInputRef.current) campaignFileInputRef.current.value = '';
  };

  const handleCreateSampleCampaigns = async () => {
    setError(null);
    try {
      const { loadedPlanets, loadedRoutes } = await ensureGalaxyLoadedForCampaigns();
      const sampleXml = createSampleCampaignsXml(loadedPlanets, loadedRoutes);
      const parsed = parseCampaignsXml(sampleXml);
      setCampaignsXmlDoc(parsed.doc);
      setCampaigns(parsed.campaigns);
      setSelectedCampaign(parsed.campaigns[0] || null);
      setCampaignFileName('Campaigns.xml');
      setActiveTab('campaigns');
    } catch (err: any) {
      setError(err.message || 'Error creating sample Campaigns.xml');
    }
  };

  const handleAddCampaign = async () => {
    let doc = campaignsXmlDoc;
    if (!doc) {
      const { loadedPlanets, loadedRoutes } = await ensureGalaxyLoadedForCampaigns();
      const sampleXml = createSampleCampaignsXml(loadedPlanets, loadedRoutes);
      const parsed = parseCampaignsXml(sampleXml);
      setCampaignsXmlDoc(parsed.doc);
      setCampaigns(parsed.campaigns);
      setSelectedCampaign(parsed.campaigns[0] || null);
      setActiveTab('campaigns');
      return;
    }

    const newCampEl = doc.createElement('Campaign');
    newCampEl.setAttribute('Name', `Custom_GC_Campaign_${campaigns.length + 1}`);
    const root = doc.querySelector('Campaigns') || doc.documentElement;
    root.appendChild(newCampEl);

    const parsedCamp = parseCampaignElement(newCampEl);
    // Default locations from current planets
    parsedCamp.locations = [
      'Galaxy_Core_Art_Model',
      ...planets.filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model').slice(0, 12).map(p => p.name)
    ];
    updateCampaignInDoc(parsedCamp);

    setCampaigns(prev => [...prev, parsedCamp]);
    setSelectedCampaign(parsedCamp);
    setActiveTab('campaigns');
  };

  const handleDuplicateCampaign = (source: Campaign) => {
    if (!campaignsXmlDoc) return;
    const clonedEl = source.el.cloneNode(true) as Element;
    const newName = `${source.name}_Copy`;
    clonedEl.setAttribute('Name', newName);
    const root = campaignsXmlDoc.querySelector('Campaigns') || campaignsXmlDoc.documentElement;
    root.appendChild(clonedEl);

    const duplicated = parseCampaignElement(clonedEl);
    setCampaigns(prev => [...prev, duplicated]);
    setSelectedCampaign(duplicated);
  };

  const handleUpdateCampaign = (updated: Campaign) => {
    updateCampaignInDoc(updated);
    setCampaigns(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    if (selectedCampaign?.id === updated.id) {
      setSelectedCampaign(updated);
    }
  };

  const handleDeleteCampaign = (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (target && target.el && target.el.parentNode) {
      target.el.parentNode.removeChild(target.el);
    }
    const remaining = campaigns.filter(c => c.id !== id);
    setCampaigns(remaining);
    if (selectedCampaign?.id === id) {
      setSelectedCampaign(remaining[0] || null);
    }
  };

  const handleToggleCampaignPlanetFromMap = (planetName: string) => {
    if (!selectedCampaign) return;
    const exists = selectedCampaign.locations.some(
      l => l.toLowerCase() === planetName.toLowerCase()
    );
    const nextLocations = exists
      ? selectedCampaign.locations.filter(l => l.toLowerCase() !== planetName.toLowerCase())
      : [...selectedCampaign.locations, planetName];
    handleUpdateCampaign({ ...selectedCampaign, locations: nextLocations });
  };

  const handleCloseProject = () => {
    setXmlDoc(null);
    setPlanets([]);
    setSelectedPlanet(null);
    setTradeRoutesXmlDoc(null);
    setTradeRoutes([]);
    setCampaignsXmlDoc(null);
    setCampaigns([]);
    setSelectedCampaign(null);
    setGalaxyBgUrl(null);
    setError(null);
  };


  const handleExportAll = () => {
    if (xmlDoc) {
      const xmlString = serializeXml(xmlDoc);
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Planets_Modified.xml';
      a.click();
      URL.revokeObjectURL(url);
    }
    
    if (tradeRoutesXmlDoc) {
      const trXmlString = serializeXml(tradeRoutesXmlDoc);
      const blob = new Blob([trXmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TradeRoutes_Modified.xml';
      a.click();
      URL.revokeObjectURL(url);
    }

    if (campaignsXmlDoc) {
      const campXmlString = serializeXml(campaignsXmlDoc);
      const blob = new Blob([campXmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = campaignFileName.replace(/\.xml$/i, '_Modified.xml');
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCreateNew = () => {
    setError(null);
    try {
      const emptyXml = `<?xml version="1.0" encoding="utf-8"?>\n<Planets>\n</Planets>`;
      const parsed = parsePlanetsXml(emptyXml);
      setXmlDoc(parsed.doc);
      setPlanets(parsed.planets);
      setSelectedPlanet(null);
    } catch (err: any) {
      setError(err.message || t.errors.initDb);
    }
  };

  const handleDatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.dat')) {
      setError('File must be a .DAT file');
      if (datFileInputRef.current) datFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseDatFile(buffer);
        setDatRecords(parsed.records);
        setDatFormat(parsed.format);
        setDatFileName(file.name);
      } catch (err: any) {
        setError(err.message || t.errors.importDat);
      }
    };
    reader.onerror = () => setError(t.errors.readDat);
    reader.readAsArrayBuffer(file);

    if (datFileInputRef.current) datFileInputRef.current.value = '';
  };

  const handleCreateNewDat = () => {
    setError(null);
    setDatFileName('MasterTextFile.dat');
    setDatFormat('indexed');
    setDatRecords([
      {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        key: 'TEXT_PLANET_CORUSCANT_NAME',
        value: 'Coruscant'
      },
      {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        key: 'TEXT_UNIT_X_WING_NAME',
        value: 'Caza Ala-X'
      }
    ]);
  };

  const handleMtdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    for (const f of files) {
      const name = f.name.toLowerCase();
      if (!name.endsWith('.mtd') && !name.endsWith('.tga') && !name.endsWith('.png') && !name.endsWith('.jpg')) {
        setError('Files must be .MTD, .TGA, .PNG or .JPG');
        if (mtdFileInputRef.current) mtdFileInputRef.current.value = '';
        return;
      }
    }

    setError(null);
    
    let mtdFile = files.find(f => f.name.toLowerCase().endsWith('.mtd'));
    let textureFile = files.find(f => f.name.toLowerCase().endsWith('.tga') || f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg'));

    if (!mtdFile && files.length > 0 && !textureFile) {
      mtdFile = files[0];
    }
    
    if (mtdFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const parsed = parseMtd(buffer);
          setMtdIcons(parsed);
          setMtdFileName(mtdFile.name);
          setMtdInitialTexture(textureFile || null);
        } catch (err: any) {
          setError(err.message || 'Error processing MTD file.');
        }
      };
      reader.onerror = () => setError('Error reading MTD file');
      reader.readAsArrayBuffer(mtdFile);
    }

    if (mtdFileInputRef.current) mtdFileInputRef.current.value = '';
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('File must be a .XML file');
      if (storyFileInputRef.current) storyFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseStoryXml(content);
        setStoryDoc(parsed.doc);
        setStoryEvents(parsed.storyEvents);
        setStoryFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error processing Story XML.');
      }
    };
    reader.onerror = () => setError('Error reading Story XML');
    reader.readAsText(file);
    
    if (storyFileInputRef.current) storyFileInputRef.current.value = '';
  };

  const loadXmlFromWorkspace = async (path: string) => {
    const xmlFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!xmlFile) return;
    try {
        const content = await readFileAsText(xmlFile);
        setRawXmlContent(content);
        setRawXmlFileName(xmlFile.name);
    } catch (err: any) {
        setError(err.message || 'Error parsing XML');
    }
  };

  const loadUnitFromWorkspace = async (path: string) => {
    const xmlFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!xmlFile) return;
    try {
        const content = await readFileAsText(xmlFile);
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) throw new Error("Invalid XML structure");
        setUnitDoc(doc);
        setUnitFileName(xmlFile.name);
    } catch (err: any) {
        setError(err.message || 'Error parsing XML');
    }
  };

  const handleUnitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('File must be a .XML file');
      if (unitFileInputRef.current) unitFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) throw new Error("Invalid XML structure");
        setUnitDoc(doc);
        setUnitFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error processing XML.');
      }
    };
    reader.onerror = () => setError('Error reading XML');
    reader.readAsText(file);
    
    if (unitFileInputRef.current) unitFileInputRef.current.value = '';
  };

  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('File must be a .XML file');
      if (xmlFileInputRef.current) xmlFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setRawXmlContent(content);
        setRawXmlFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error processing XML.');
      }
    };
    reader.onerror = () => setError('Error reading XML');
    reader.readAsText(file);
    
    if (xmlFileInputRef.current) xmlFileInputRef.current.value = '';
  };

  const handleCreateNewXml = () => {
    setError(null);
    try {
      const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<SpaceUnitsCapital>

\t<SpaceUnit Name="Custom_Star_Destroyer">
\t\t<Text_ID>TEXT_UNIT_STAR_DESTROYER</Text_ID>
\t\t<Encyclopedia_Unit_Class>TEXT_ENCYCLOPEDIA_CLASS_CAPITAL</Encyclopedia_Unit_Class>
\t\t<Encyclopedia_Text>TEXT_TOOLTIP_STAR_DESTROYER</Encyclopedia_Text>
\t\t<Icon_Name>i_button_imperator.tga</Icon_Name>
\t\t<Space_Model_Name>EV_StarDestroyer.ALO</Space_Model_Name>
\t\t<Scale_Factor>1.0</Scale_Factor>
\t\t<Affiliation>Empire</Affiliation>
\t\t<Tech_Level>4</Tech_Level>
\t\t<Required_Star_Base_Level>4</Required_Star_Base_Level>
\t\t<Build_Cost_Credits>5900</Build_Cost_Credits>
\t\t<Build_Time_Seconds>60</Build_Time_Seconds>
\t\t<Population_Value>4</Population_Value>
\t\t<Space_Capacity>4</Space_Capacity>
\t\t<CategoryMask>Capital | AntiFrigate</CategoryMask>
\t\t<Space_Layer>Capital</Space_Layer>
\t\t<Tactical_Health>7500</Tactical_Health>
\t\t<Shield_Points>3000</Shield_Points>
\t\t<Shield_Refresh_Rate>50</Shield_Refresh_Rate>
\t\t<Armor_Type>Armor_Star_Destroyer</Armor_Type>
\t\t<Shield_Armor_Type>Shield_Capital</Shield_Armor_Type>
\t\t<Max_Speed>1.8</Max_Speed>
\t\t<Max_Rate_Of_Turn>0.4</Max_Rate_Of_Turn>
\t\t<Hyperspace>Yes</Hyperspace>
\t\t<Hyperspace_Speed>1.5</Hyperspace_Speed>
\t\t<Space_FOW_Reveal_Range>2200.0</Space_FOW_Reveal_Range>
\t\t<AI_Combat_Power>4500</AI_Combat_Power>
\t\t<HardPoints>
\t\t\tHP_Star_Destroyer_Shield_Gen,
\t\t\tHP_Star_Destroyer_Engines,
\t\t\tHP_Star_Destroyer_Weapon_01
\t\t</HardPoints>
\t</SpaceUnit>

</SpaceUnitsCapital>`;
      setRawXmlContent(sampleXml);
      setRawXmlFileName('SpaceUnitsCustom.xml');
    } catch (err: any) {
      setError(err.message || 'Error creating XML');
    }
  };

  const handleSaveRawXml = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadLuaFromWorkspace = async (path: string) => {
    const luaFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!luaFile) return;
    try {
        const content = await readFileAsText(luaFile);
        setRawLuaContent(content);
        setRawLuaFileName(luaFile.name);
    } catch (err: any) {
        setError(err.message || 'Error parsing LUA');
    }
  };

  const handleLuaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.lua')) {
      setError('File must be a .LUA file');
      if (luaFileInputRef.current) luaFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setRawLuaContent(content);
        setRawLuaFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error processing LUA.');
      }
    };
    reader.onerror = () => setError('Error reading LUA');
    reader.readAsText(file);
    
    if (luaFileInputRef.current) luaFileInputRef.current.value = '';
  };

  const handleCreateNewLua = () => {
    setError(null);
    try {
      const sampleLua = `-- ============================================================================
-- SCRIPT LUA DE EMPIRE AT WAR / FORCES OF CORRUPTION
-- ============================================================================
require("PGStateMachine")
require("PGStoryMode")
require("PGSpawnUnits")

function Definitions()
  ServiceRate = 1
  Define_State("State_Init", State_Init)
  Define_State("State_Main_Loop", State_Main_Loop)
end

function State_Init(message)
  if message == OnEnter then
    empire = Find_Player("Empire")
    rebel = Find_Player("Rebel")
    coruscant = FindPlanet("Coruscant")

    Story_Event("SCRIPT_INITIALIZED")
    Set_Next_State("State_Main_Loop")
  end
end

function State_Main_Loop(message)
  if message == OnUpdate then
    -- Lógica periódica del estado principal
  end
end
`;
      setRawLuaContent(sampleLua);
      setRawLuaFileName('Story_Custom_Script.lua');
    } catch (err: any) {
      setError(err.message || 'Error creating LUA');
    }
  };

  const handleSaveRawLua = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadDialogFromWorkspace = async (path: string) => {
    const txtFile = workspaceFiles.find(f => f.webkitRelativePath === path || f.name === path);
    if (!txtFile) return;
    try {
        const content = await readFileAsText(txtFile);
        setActiveDialogContent(content);
        setActiveDialogFileName(txtFile.name);
    } catch (err: any) {
        setError(err.message || 'Error parsing Dialog file');
    }
  };

  const handleDialogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('File must be a .TXT file');
      if (dialogFileInputRef.current) dialogFileInputRef.current.value = '';
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setActiveDialogContent(content);
        setActiveDialogFileName(file.name);
      } catch (err: any) {
        setError(err.message || 'Error processing dialog script file.');
      }
    };
    reader.onerror = () => setError('Error reading dialogue script');
    reader.readAsText(file);
    
    if (dialogFileInputRef.current) dialogFileInputRef.current.value = '';
  };

  const handleCreateNewDialog = () => {
    setError(null);
    try {
      const defaultDialog = `[CHAPTER 0]\n# Main Text\nWAIT 500\nSFX Button_Press\n\nTEXTCOLOR 000 193 091 255\nTEXT TEXT_STORY_CIS_CORE_ASSAULT_MISSION_00_HEAD\n# Cut Supply Lines\n\nNEWLINE 1\n\nTEXT TEXT_STORY_CIS_CORE_ASSAULT_MISSION_00_DESC\n# Coruscant is heavily guarded\\nIn order to ensure a successful invasion we need to cut the supply lines.\n\nNEWLINE 1\n\nTEXTCOLOR 109 247 255 255\nTEXT TEXT_STORY_CIS_CORE_ASSAULT_MISSION_00_TASK\n# Task: Conquer Kuat, Corellia, Carida and Rendili to unlock Coruscant.\n`;
      setActiveDialogContent(defaultDialog);
      setActiveDialogFileName('Story_Campaign_Dialogs.txt');
    } catch (err: any) {
      setError(err.message || 'Error creating dialogue empty file');
    }
  };

  const handleSaveDialog = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateNewStory = async () => {
    setError(null);
    try {
      await ensureGalaxyLoadedForCampaigns();
      const sampleXml = createSampleStoryXml();
      const parsed = parseStoryXml(sampleXml);
      setStoryDoc(parsed.doc);
      setStoryEvents(parsed.storyEvents);
      setStoryFileName('Story_Campaign_Custom.xml');
    } catch (err: any) {
      setError(err.message || 'Error creating Story XML');
    }
  };

  const handleAddPlanet = () => {
    if (!xmlDoc) return;
    
    const newPlanetNode = xmlDoc.createElement("Planet");
    newPlanetNode.setAttribute("Name", `New_Planet_${planets.length + 1}`);
    
    const posNode = xmlDoc.createElement("Galactic_Position");
    posNode.textContent = "0.0, 0.0, 0.0";
    newPlanetNode.appendChild(posNode);
    
    let root = xmlDoc.querySelector("Planets") || xmlDoc.documentElement;
    root.appendChild(newPlanetNode);
    
    const newPlanet: Planet = {
      id: `p_new_${Date.now()}`,
      el: newPlanetNode,
      name: newPlanetNode.getAttribute("Name") || "Unknown",
      x: 0,
      y: 0,
      z: 0
    };
    
    setPlanets([...planets, newPlanet]);
    setSelectedPlanet(newPlanet);
  };

  const handleUpdatePlanet = (updatedPlanet: Planet, nodeUpdates?: { tagName: string, value: string }[]) => {
    // 1. Update React state
    setPlanets(prev => prev.map(p => p.id === updatedPlanet.id ? updatedPlanet : p));
    if (selectedPlanet?.id === updatedPlanet.id) {
      setSelectedPlanet(updatedPlanet);
    }

    // 2. Update XML DOM Node
    updatePlanetPositionInDoc(updatedPlanet);

    // 3. Update any dynamic nodes
    if (nodeUpdates && nodeUpdates.length > 0) {
      nodeUpdates.forEach(update => {
        const childNode = Array.from(updatedPlanet.el.children).find(c => c.tagName === update.tagName);
        if (childNode) {
          childNode.textContent = update.value;
        }
      });
    }
  };

  const handleDeletePlanet = (id: string) => {
    const planetToDelete = planets.find(p => p.id === id);
    if (planetToDelete && planetToDelete.el && planetToDelete.el.parentNode) {
      planetToDelete.el.parentNode.removeChild(planetToDelete.el);
    }
    setPlanets(prev => prev.filter(p => p.id !== id));
    if (selectedPlanet?.id === id) {
      setSelectedPlanet(null);
    }
  };

  const handleAddTradeRoute = () => {
    if (!tradeRoutesXmlDoc) return;
    
    const newRouteNode = tradeRoutesXmlDoc.createElement("TradeRoute");
    newRouteNode.setAttribute("Name", `New_Trade_Route_${tradeRoutes.length + 1}`);
    
    const posA = tradeRoutesXmlDoc.createElement("Point_A");
    posA.textContent = "Planet1";
    newRouteNode.appendChild(posA);

    const posB = tradeRoutesXmlDoc.createElement("Point_B");
    posB.textContent = "Planet2";
    newRouteNode.appendChild(posB);
    
    let root = tradeRoutesXmlDoc.querySelector("TradeRoutes") || tradeRoutesXmlDoc.documentElement;
    root.appendChild(newRouteNode);
    
    const newRoute: TradeRoute = {
      id: `tr_new_${Date.now()}`,
      el: newRouteNode,
      name: newRouteNode.getAttribute("Name") || "Unknown",
      pointA: "Planet1",
      pointB: "Planet2"
    };
    
    setTradeRoutes([...tradeRoutes, newRoute]);
    setSelectedRoute(newRoute);
    setSelectedPlanet(null);
    setActiveTab('routes');
  };

  const handleUpdateTradeRoute = (updatedRoute: TradeRoute, nodeUpdates?: { tagName: string, value: string }[]) => {
    setTradeRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    if (selectedRoute?.id === updatedRoute.id) {
      setSelectedRoute(updatedRoute);
    }

    if (nodeUpdates && nodeUpdates.length > 0) {
      nodeUpdates.forEach(update => {
        let childNode = Array.from(updatedRoute.el.children).find(c => c.tagName === update.tagName);
        if (childNode) {
          childNode.textContent = update.value;
        } else {
          childNode = tradeRoutesXmlDoc!.createElement(update.tagName);
          childNode.textContent = update.value;
          updatedRoute.el.appendChild(childNode);
        }
      });
    }
  };

  const handleDeleteTradeRoute = (id: string) => {
    const routeToDelete = tradeRoutes.find(r => r.id === id);
    if (routeToDelete && routeToDelete.el && routeToDelete.el.parentNode) {
      routeToDelete.el.parentNode.removeChild(routeToDelete.el);
    }
    setTradeRoutes(prev => prev.filter(r => r.id !== id));
    if (selectedRoute?.id === id) {
      setSelectedRoute(null);
    }
  };

  const handleBulkUpdate = (tagName: string, value: string, excludedIds: Set<string>) => {
    if (!xmlDoc) return;

    const updatedPlanets = planets.map(p => {
      if (excludedIds.has(p.id)) return p;

      // Update XML node
      let childNode = Array.from(p.el.children).find(c => (c as any).tagName === tagName) as any;
      if (!childNode) {
        childNode = xmlDoc.createElement(tagName);
        p.el.appendChild(childNode);
      }
      childNode.textContent = value;

      // Create a fresh clone so React detects the update and re-renders components dependent on it
      return { ...p };
    });

    setPlanets(updatedPlanets);
    if (selectedPlanet) {
      const refreshed = updatedPlanets.find(p => p.id === selectedPlanet.id);
      setSelectedPlanet(refreshed || null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-cyan-50 overflow-hidden font-sans select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-cyan-800/50 bg-slate-900/80 flex items-center justify-between px-6 shrink-0 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-cyan-500 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <div className="w-5 h-5 border-2 border-slate-950 rotate-45"></div>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-widest uppercase italic">CORVUS <span className="font-extralight opacity-60">// EAW Modding Tool</span></h1>
            
            <div className="flex items-center gap-1 my-auto">
              <div className="relative overflow-hidden px-2 py-0.5 border border-amber-400/80 bg-gradient-to-b from-slate-200/25 via-slate-300/15 to-slate-400/20 shadow-[0_0_10px_rgba(251,191,36,0.25)] rounded flex items-center group cursor-default">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.6)] z-10">
                  v{packageJson.version}
                </span>
                <div className="absolute inset-0 w-8 h-full bg-white/30 skew-x-[-15deg] blur-[2px] animate-shine z-0 pointer-events-none"></div>
              </div>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.require) {
                    try {
                      const { ipcRenderer } = window.require('electron');
                      ipcRenderer.send('check-for-updates');
                    } catch (e) {
                      console.warn('Update check not available');
                    }
                  }
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                title={t.updater?.checkUpdate || "Check for updates"}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Language Switcher Pill (EN | ES | FR) */}
          <div className="hidden sm:flex items-center bg-slate-950/90 border border-slate-800 rounded-sm p-0.5">
            {(['en', 'es', 'fr'] as const).map((code) => (
              <button
                key={code}
                onClick={() => setSettings({ ...settings, language: code })}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer ${
                  settings.language === code
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
                title={code === 'en' ? 'English' : code === 'es' ? 'Español' : 'Français'}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsInstallerHudOpen(true)}
            className="h-8 px-2.5 flex items-center gap-1.5 border border-amber-500/40 bg-amber-950/20 hover:border-amber-400/70 hover:bg-amber-500/15 text-amber-300 hover:text-amber-200 transition-all duration-200 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
            title={tr(lang, 'Tactical Installer HUD', 'Instalador Táctico HUD', 'Installateur Tactique HUD')}
            id="installer_hud_toggle_btn"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{tr(lang, 'Setup HUD', 'Instalador', 'Installateur')}</span>
          </button>

          <button
            onClick={() => setIsManualOpen(true)}
            className="h-8 px-2.5 flex items-center gap-1.5 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-400 transition-all duration-200 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
            title={t.userManual}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{tr(lang, 'Manual', 'Manual', 'Manuel')}</span>
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center border border-slate-700/50 hover:border-cyan-500/50 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-400 transition-all duration-200 group rounded-sm cursor-pointer"
            title={t.settings}
            id="settings_toggle_btn"
          >
            <SettingsIcon className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {activeDialogContent !== null ? (
          <DialogEditor
            initialContent={activeDialogContent}
            fileName={activeDialogFileName}
            datRecords={datRecords}
            workspaceFiles={workspaceFiles}
            datFileName={datFileName}
            onLoadDatFile={async (file: File) => {
              try {
                const buffer = await readFileAsArrayBuffer(file);
                const parsed = parseDatFile(buffer);
                setDatRecords(parsed.records);
                setDatFormat(parsed.format);
                setDatFileName(file.name);
              } catch (err: any) {
                setError(err.message || 'Error parsing .DAT file');
              }
            }}
            onClose={() => setActiveDialogContent(null)}
            onSave={(content, name) => {
              setActiveDialogContent(content);
              handleSaveDialog(content, name);
            }}
            onAddDatRecord={(key, value) => {
              const newRec: DatRecord = {
                id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
                key: key.trim(),
                value: value
              };
              if (datRecords) {
                setDatRecords([...datRecords, newRec]);
              } else {
                setDatRecords([newRec]);
              }
            }}
          />
        ) : rawLuaContent !== null ? (
          <LuaEditor
            initialContent={rawLuaContent}
            fileName={rawLuaFileName}
            onClose={() => { setRawLuaContent(null); }}
            onSave={(content, name) => handleSaveRawLua(content, name)}
            workspaceFiles={workspaceFiles}
            onSelectWorkspaceLua={loadLuaFromWorkspace}
            planets={planets}
          />
        ) : unitDoc !== null ? (
          <UnitEditor
            initialDoc={unitDoc}
            fileName={unitFileName}
            onClose={() => setUnitDoc(null)}
            onError={setError}
          />
        ) : rawXmlContent !== null ? (
          <XmlEditor
            initialContent={rawXmlContent}
            fileName={rawXmlFileName}
            onClose={() => { setRawXmlContent(null); }}
            onSave={(content, name) => handleSaveRawXml(content, name)}
            workspaceFiles={workspaceFiles}
            onSelectWorkspaceXml={loadXmlFromWorkspace}
            datRecords={datRecords}
          />
        ) : storyDoc && storyEvents ? (
          <StoryEditor
            initialDoc={storyDoc}
            initialEvents={storyEvents}
            fileName={storyFileName}
            onClose={() => { setStoryDoc(null); setStoryEvents(null); }}
            onError={setError}
            settings={settings}
            onUpdateDoc={(doc, events) => { setStoryDoc(doc); setStoryEvents(events); }}
            planets={planets}
            datRecords={datRecords}
          />
        ) : mtdIcons ? (
          <MtdEditor
            initialIcons={mtdIcons}
            fileName={mtdFileName}
            initialTextureFile={mtdInitialTexture}
            onClose={() => setMtdIcons(null)}
            onError={setError}
          />
        ) : datRecords ? (
          <DatEditor 
            initialRecords={datRecords}
            fileName={datFileName}
            format={datFormat}
            onClose={() => setDatRecords(null)}
          />
        ) : xmlDoc ? (
          <div className="flex-1 flex flex-col min-w-0">
             <div className="h-14 border-b border-cyan-900/60 bg-slate-900/90 flex flex-col md:flex-row items-center justify-between px-4 shrink-0 shadow-md backdrop-blur-md">
                <div className="flex items-center space-x-3 mb-2 md:mb-0">
                  <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                    <Globe className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                       <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold font-mono flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                         <span>{t.home.xmlMapTitle}</span>
                       </span>
                       <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/50">
                         v2.5
                       </span>
                       {activeTab === 'campaigns' && (
                         <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/50">
                           GC v3.1
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 text-xs w-full md:w-auto overflow-x-auto justify-end">
                   <button 
                      onClick={() => setIsBulkEditOpen(true)}
                      className="px-3 py-1.5 border border-purple-500/50 hover:bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm cursor-pointer"
                   >
                     <Database className="w-3.5 h-3.5" />
                     <span className="hidden sm:inline">{t.planetList.bulkEdit}</span>
                   </button>
                   
                   <button 
                      onClick={() => trFileInputRef.current?.click()}
                      className="px-3 py-1.5 border border-amber-500/50 hover:bg-amber-500/20 text-amber-500 text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.importRoutes}</span>
                   </button>

                   <button 
                      onClick={() => campaignFileInputRef.current?.click()}
                      className="px-3 py-1.5 border border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tr(lang, 'Import Campaigns.xml', 'Importar Campaigns.xml', 'Importer Campaigns.xml')}</span>
                   </button>

                   <button 
                      onClick={togglePlanetToolMode}
                      className={`px-3 py-1.5 border transition-all flex items-center space-x-1.5 text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm cursor-pointer ${planetToolMode === 'code' ? 'border-rose-500/50 bg-rose-500/20 text-rose-400' : 'border-slate-600/60 hover:bg-slate-800 text-slate-300'}`}
                   >
                     {planetToolMode === 'code' ? <Globe className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
                     <span className="hidden sm:inline">{planetToolMode === 'code' ? tr(lang, 'Visual View', 'Vista Visual', 'Vue Visuelle') : tr(lang, 'Code View', 'Vista Código', 'Vue Code')}</span>
                   </button>

                   <button 
                      onClick={handleExportAll}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                   >
                     <Download className="w-3.5 h-3.5" />
                     <span className="whitespace-nowrap">{t.exportChanges}</span>
                   </button>
                   
                   <button 
                      onClick={handleCloseProject}
                      className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
                      title={t.closeProject}
                   >
                     <XCircle className="w-4 h-4" />
                   </button>
                </div>
             </div>

             {planetToolMode === 'code' ? (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
                  <div className="bg-slate-900 border-b border-slate-800 flex items-center p-2">
                     <div className="mx-auto flex space-x-2">
                         <button onClick={() => setActiveTab('planets')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest cursor-pointer ${activeTab === 'planets' ? 'bg-cyan-900/50 border border-cyan-500/50 text-cyan-400' : 'text-slate-500 border border-transparent hover:text-cyan-300'}`}>Planets.xml</button>
                         {tradeRoutesXmlDoc && <button onClick={() => setActiveTab('routes')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest cursor-pointer ${activeTab === 'routes' ? 'bg-amber-900/50 border border-amber-500/50 text-amber-400' : 'text-slate-500 border border-transparent hover:text-amber-300'}`}>TradeRoutes.xml</button>}
                         {campaignsXmlDoc && <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest cursor-pointer ${activeTab === 'campaigns' ? 'bg-emerald-900/50 border border-emerald-500/50 text-emerald-400' : 'text-slate-500 border border-transparent hover:text-emerald-300'}`}>{campaignFileName}</button>}
                     </div>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                     {activeTab === 'planets' ? (
                        <CodeEditorWithLines value={planetXmlCode} onChange={setPlanetXmlCode} className="" />
                     ) : activeTab === 'routes' ? (
                        <CodeEditorWithLines value={tradeRoutesXmlCode} onChange={setTradeRoutesXmlCode} className="" />
                     ) : (
                        <CodeEditorWithLines value={campaignsXmlCode} onChange={setCampaignsXmlCode} className="" />
                     )}
                  </div>
                </div>
             ) : (
             <div className="flex-1 flex overflow-hidden">
               <div className="h-full flex flex-col shrink-0">
                  <div className="flex shrink-0">
                    <button
                       onClick={() => setActiveTab('planets')}
                       className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[9px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'planets' ? 'bg-cyan-900 border-b-2 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-b-2 border-slate-800 text-slate-500 hover:text-slate-300'
                       }`}
                    >
                       <Globe className="w-3 h-3 shrink-0" /> <span>{t.planetsTab}</span>
                    </button>
                    <button
                       onClick={() => setActiveTab('routes')}
                       className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[9px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'routes' ? 'bg-amber-900 border-b-2 border-amber-400 text-amber-200' : 'bg-slate-900 border-b-2 border-slate-800 text-slate-500 hover:text-slate-300'
                       }`}
                    >
                       <Route className="w-3 h-3 shrink-0" /> <span>{tr(lang, 'Routes', 'Rutas', 'Routes')}</span>
                    </button>
                    <button
                       onClick={() => setActiveTab('campaigns')}
                       className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-[9px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          activeTab === 'campaigns' ? 'bg-emerald-900 border-b-2 border-emerald-400 text-emerald-200' : 'bg-slate-900 border-b-2 border-slate-800 text-slate-500 hover:text-slate-300'
                       }`}
                    >
                       <Shield className="w-3 h-3 shrink-0" /> <span>{tr(lang, 'Campaigns', 'Campañas', 'Campagnes')}</span>
                    </button>
                  </div>

                  {activeTab === 'planets' ? (
                    <PlanetList 
                      planets={displayPlanets} 
                      selectedPlanet={selectedPlanet} 
                      onSelectPlanet={(p) => { setSelectedPlanet(p); setSelectedRoute(null); }} 
                      onAddPlanet={handleAddPlanet}
                      totalPlanetsCount={planets.length}
                      showCore={showCore}
                      onToggleShowCore={() => setShowCore(!showCore)}
                    />
                  ) : activeTab === 'routes' ? (
                    <TradeRouteList
                      tradeRoutes={tradeRoutes}
                      selectedRoute={selectedRoute}
                      onSelectRoute={(r) => { setSelectedRoute(r); setSelectedPlanet(null); }}
                      onAddRoute={handleAddTradeRoute}
                      onDeleteRoute={handleDeleteTradeRoute}
                    />
                  ) : (
                    <CampaignList
                      campaigns={campaigns}
                      selectedCampaign={selectedCampaign}
                      onSelectCampaign={(c) => setSelectedCampaign(c)}
                      onAddCampaign={handleAddCampaign}
                      onDuplicateCampaign={handleDuplicateCampaign}
                      onDeleteCampaign={handleDeleteCampaign}
                      onImportCampaignsXml={() => campaignFileInputRef.current?.click()}
                      onCreateSampleCampaigns={handleCreateSampleCampaigns}
                      workspaceCampaignFiles={workspaceFiles.filter(
                        f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('campaign')
                      )}
                      activeCampaignFileName={campaignFileName}
                      onSelectWorkspaceCampaignFile={loadCampaignsFromWorkspace}
                    />
                  )}
               </div>

               <GalaxyMap
                 planets={displayPlanets}
                 tradeRoutes={tradeRoutes}
                 settings={settings}
                 selectedPlanet={selectedPlanet}
                 onSelectPlanet={(p) => {
                   setSelectedPlanet(p);
                   setSelectedRoute(null);
                 }}
                 onUpdatePlanet={handleUpdatePlanet}
                 initialBgUrl={galaxyBgUrl}
                 workspaceFiles={workspaceFiles}
                 onAddPlanet={handleAddPlanet}
                 activeCampaign={activeTab === 'campaigns' ? selectedCampaign : null}
                 isCampaignPreview={isCampaignPreview}
                 onToggleCampaignPreview={setIsCampaignPreview}
                 hideExcludedInPreview={hideExcludedInPreview}
                 onToggleHideExcluded={setHideExcludedInPreview}
                 mapClickTogglesCampaignPlanet={activeTab === 'campaigns' && mapClickTogglesCampaignPlanet}
                 onToggleCampaignPlanet={handleToggleCampaignPlanetFromMap}
                 onToggleMapClickMode={setMapClickTogglesCampaignPlanet}
               />

               {activeTab === 'campaigns' ? (
                 <CampaignEditor
                   campaign={selectedCampaign}
                   planets={planets}
                   tradeRoutes={tradeRoutes}
                   selectedPlanet={selectedPlanet}
                   onSelectPlanet={setSelectedPlanet}
                   onUpdateCampaign={handleUpdateCampaign}
                   onDeleteCampaign={() => selectedCampaign && handleDeleteCampaign(selectedCampaign.id)}
                   mapClickTogglesPlanet={mapClickTogglesCampaignPlanet}
                   onToggleMapClickMode={setMapClickTogglesCampaignPlanet}
                   isPreviewMode={isCampaignPreview}
                   onTogglePreviewMode={setIsCampaignPreview}
                   hideExcludedInPreview={hideExcludedInPreview}
                   onToggleHideExcluded={setHideExcludedInPreview}
                   datRecords={datRecords}
                 />
               ) : selectedPlanet || (!selectedRoute && activeTab === 'planets') ? (
                 <PlanetEditor 
                   planet={selectedPlanet} 
                   onUpdate={handleUpdatePlanet}
                   onDelete={() => selectedPlanet && handleDeletePlanet(selectedPlanet.id)}
                 />
               ) : selectedRoute || (!selectedPlanet && activeTab === 'routes') ? (
                 <TradeRouteEditor 
                   route={selectedRoute} 
                   onUpdate={handleUpdateTradeRoute}
                   onDelete={() => selectedRoute && handleDeleteTradeRoute(selectedRoute.id)}
                 />
               ) : null}
             </div>
             )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center text-center px-4 relative overflow-y-auto pt-12 pb-12">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#22d3ee 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="max-w-7xl w-full flex flex-col items-center relative z-10 mt-8">
              <div className="mb-8 max-w-xl text-center">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/40 rounded-sm flex items-center justify-center mx-auto mb-4 rotate-45">
                  <div className="w-5 h-5 border-2 border-cyan-400"></div>
                </div>
                <h2 className="text-xl font-bold text-cyan-200 mb-2 uppercase tracking-widest italic">{t.home.title}</h2>
                <p className="text-xs text-slate-400 tracking-wider font-mono">
                  {t.home.subtitle}
                </p>
              </div>

              {/* Mod Workspace Banner */}
              <div className="w-full bg-slate-900/40 p-5 border border-emerald-800/50 rounded flex flex-col md:flex-row items-center justify-between text-left mb-6 hover:border-emerald-500/50 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.02)]">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-sm font-bold text-emerald-400 tracking-widest uppercase font-mono flex items-center space-x-2">
                    <Folder className="w-5 h-5" />
                    <span>Workspace</span>
                  </h3>
                  {workspaceFiles.length > 0 ? (
                    <p className="text-xs text-slate-300 mt-2 font-mono flex items-center bg-slate-950 px-3 py-1.5 rounded-sm border border-emerald-900/40 inline-flex">
                      <span className="text-emerald-500 mr-2">{t.home.workspaceLoaded}</span>
                      {workspaceFiles.length} {tr(lang, 'files loaded', 'archivos cargados', 'fichiers chargés')}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                      {tr(
                        lang,
                        "Load a full 'Data' folder or Mod directory. Corvus will automatically identify supported files and load them on demand.",
                        "Carga una carpeta completa 'Data' o un directorio de Mod. Corvus identificará los archivos soportados automáticamente para cargarlos bajo demanda.",
                        "Chargez un dossier 'Data' complet ou le répertoire d'un Mod. Corvus identifiera automatiquement les fichiers pris en charge pour les charger à la demande."
                      )}
                    </p>
                  )}
                </div>
                {!workspaceFiles.length && (
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="w-full md:w-auto shrink-0 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-3 px-6 text-xs transition-colors rounded-sm cursor-pointer"
                  >
                    <Folder className="w-4 h-4 text-emerald-950" />
                    <span>{t.home.loadModFolder}</span>
                  </button>
                )}
                {workspaceFiles.length > 0 && (
                   <button 
                     onClick={() => setWorkspaceFiles([])}
                     className="w-full md:w-auto shrink-0 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-widest py-2 px-4 text-[11px] transition-colors rounded-sm border border-slate-700 cursor-pointer"
                   >
                     <XCircle className="w-4 h-4" />
                     <span>{tr(lang, 'Clear Workspace', 'Limpiar Workspace', 'Vider le Workspace')}</span>
                   </button>
                )}
              </div>              {/* Workspace Status Hologram */}
              {workspaceFiles.length > 0 && (
                <div className="w-full max-w-7xl bg-slate-950/80 p-4 border border-slate-900 rounded-sm mb-6 font-mono text-left relative overflow-hidden backdrop-blur-sm shadow-[0_0_15px_rgba(34,211,238,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        {tr(lang, 'Workspace Status // Active Mod Directory', 'Estado del Espacio de Trabajo // Directorio Activo', 'État du Workspace // Répertoire du Mod Actif')}
                      </div>
                      <div className="text-xs text-slate-200 mt-1">
                        <span className="text-emerald-400 font-bold">{t.home.workspaceLoaded}</span>{' '}
                        <span className="font-bold text-slate-100">
                          {workspaceFiles.length} {tr(lang, 'files detected', 'archivos detectados', 'fichiers détectés')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-wider font-bold">
                    <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-2 py-1 rounded">
                      XML: {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml')).length}
                    </span>
                    <span className="bg-purple-950/60 text-purple-400 border border-purple-800/40 px-2 py-1 rounded">
                      DAT: {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.dat')).length}
                    </span>
                    <span className="bg-amber-950/60 text-amber-400 border border-amber-800/40 px-2 py-1 rounded">
                      MTD: {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.mtd')).length}
                    </span>
                    <span className="bg-yellow-950/60 text-yellow-400 border border-yellow-800/40 px-2 py-1 rounded">
                      LUA: {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.lua')).length}
                    </span>
                    <button 
                      onClick={() => setWorkspaceFiles([])}
                      className="bg-red-950/80 hover:bg-red-900 border border-red-800/50 text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {tr(lang, 'Clear', 'Limpiar', 'Vider')}
                    </button>
                  </div>
                </div>
              )}

              {/* Filter and Search Bar */}
              <div className="w-full max-w-7xl mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-2">
                {/* Category selectors */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 border border-slate-900 rounded-sm">
                  {[
                    { id: 'all', label: tr(lang, 'All Modules', 'Todos los Módulos', 'Tous les Modules') },
                    { id: 'galaxy', label: tr(lang, 'Campaign & Galaxy', 'Campaña y Galaxia', 'Campagne et Galaxie') },
                    { id: 'localization', label: tr(lang, 'Texts & UI Assets', 'Textos e Interfaz', 'Textes et Interface') },
                    { id: 'raw_code', label: tr(lang, 'Raw File Editors', 'Editores en Crudo', 'Éditeurs de Code Brut') },
                  ].map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedToolCategory(category.id as any)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-mono font-bold transition-all rounded-sm cursor-pointer ${
                        selectedToolCategory === category.id
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Instant search input */}
                <div className="relative md:w-80 shrink-0 font-mono">
                  <input
                    type="text"
                    value={toolsSearchQuery}
                    onChange={(e) => setToolsSearchQuery(e.target.value)}
                    placeholder={tr(lang, 'SEARCH TOOLS...', 'BUSCAR HERRAMIENTAS...', 'RECHERCHER DES OUTILS...')}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 text-slate-100 font-bold placeholder-slate-600 text-[10px] tracking-widest py-2.5 pl-3 pr-8 rounded-sm focus:outline-none transition-colors uppercase"
                  />
                  {toolsSearchQuery ? (
                    <button
                      onClick={() => setToolsSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  ) : (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none select-none text-[8px] text-slate-600 font-bold tracking-widest">
                      SYS
                    </div>
                  )}
                </div>
              </div>

              {/* Map tools array */}
              {(() => {
                const allToolsList = [
                  {
                    id: 'xmlPlanets',
                    category: 'galaxy',
                    version: '2.5',
                    title: t.home.xmlMapTitle,
                    desc: t.home.xmlMapDesc ? t.home.xmlMapDesc.replace('Planets.xml', '<code class="text-cyan-400 font-mono font-bold">Planets.xml</code>') : '',
                    icon: <Globe className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-cyan-900/30 hover:border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.01)] hover:shadow-[0_0_25px_rgba(6,182,212,0.06)]',
                    accentBadge: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
                    badgeLabel: tr(lang, 'PLANET SYSTEMS', 'SISTEMAS Y GALAXIA', 'SYSTÈMES PLANÉTAIRES'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase() === 'planets.xml' || f.name.toLowerCase() === 'planet.xml'),
                    renderAction: () => {
                      const hasFile = workspaceFiles.some(f => f.name.toLowerCase() === 'planets.xml' || f.name.toLowerCase() === 'planet.xml');
                      return (
                        <div className="space-y-2 mt-auto">
                          {hasFile ? (
                            <button 
                              onClick={editGalaxyFromWorkspace}
                              className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm shadow-sm font-sans"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>{t.home?.editGalaxy || 'Edit Galaxy'}</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm shadow-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t.importPlanets}</span>
                            </button>
                          )}
                          <button 
                            onClick={handleCreateNew}
                            className="w-full flex items-center justify-center space-x-2 border border-cyan-850/60 hover:bg-cyan-950/20 text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest py-2 text-[9px] transition-colors cursor-pointer font-mono rounded-sm"
                          >
                            <span>{t.initEmptyDb}</span>
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    id: 'campaignsGc',
                    category: 'galaxy',
                    version: '3.1',
                    title: tr(lang, 'Galactic Conquest Editor (Campaigns.xml)', 'Editor de Campañas (Campaigns.xml)', 'Éditeur de Conquête Galactique (Campaigns.xml)'),
                    desc: tr(
                      lang,
                      'Architect Galactic Conquests in <code class="text-emerald-400 font-mono font-bold">Campaigns.xml</code> directly on the interactive galaxy map: toggle active planets, <code class="text-emerald-400 font-mono">Starting_Forces</code>, credits, tech levels, and victory conditions.',
                      'Diseña Conquistas Galácticas en <code class="text-emerald-400 font-mono font-bold">Campaigns.xml</code> sobre el mapa interactivo: selecciona planetas activos, <code class="text-emerald-400 font-mono">Starting_Forces</code>, créditos, niveles tecnológicos y condiciones de victoria.',
                      'Concevez des Conquêtes Galactiques dans <code class="text-emerald-400 font-mono font-bold">Campaigns.xml</code> sur la carte galactique interactive : activez les planètes, <code class="text-emerald-400 font-mono">Starting_Forces</code>, crédits, niveaux technologiques et conditions de victoire.'
                    ),
                    icon: <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-emerald-900/40 hover:border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.02)] hover:shadow-[0_0_25px_rgba(16,185,129,0.08)]',
                    accentBadge: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50',
                    badgeLabel: tr(lang, 'GALACTIC CONQUEST', 'CONQUISTA GALÁCTICA', 'CONQUÊTE GALACTIQUE'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('campaign')),
                    renderAction: () => {
                      const campaignFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('campaign'));
                      return (
                        <div className="space-y-1.5 mt-auto">
                          {campaignFiles.length > 0 ? (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  loadCampaignsFromWorkspace(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full bg-slate-950 border border-emerald-800/50 text-emerald-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">{t.home.selectFile}</option>
                              {campaignFiles.map((f, i) => (
                                <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => campaignFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{tr(lang, 'Import Campaigns.xml', 'Importar Campaigns.xml', 'Importer Campaigns.xml')}</span>
                            </button>
                          )}
                          <button
                            onClick={handleCreateSampleCampaigns}
                            className="w-full flex items-center justify-center space-x-2 border border-emerald-800/60 hover:bg-emerald-950/30 text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest py-1.5 text-[9px] transition-colors cursor-pointer font-mono rounded-sm"
                          >
                            <span>{tr(lang, 'Create New GC Campaign', 'Crear Nueva Conquista GC', 'Créer une Conquête GC')}</span>
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    id: 'story',
                    category: 'galaxy',
                    version: '2.1',
                    title: t.home.storyTitle,
                    desc: t.home.storyDesc,
                    icon: <BookOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-emerald-950/30 hover:border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.01)] hover:shadow-[0_0_25px_rgba(16,185,129,0.06)]',
                    accentBadge: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
                    badgeLabel: tr(lang, 'STORY CAMPAIGN', 'HISTORIA Y CAMPAÑA', 'CAMPAGNE HISTOIRE'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('story')),
                    renderAction: () => {
                      const storyFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('story'));
                      return (
                        <div className="space-y-1.5 mt-auto">
                          {storyFiles.length > 0 ? (
                            <div className="space-y-1.5">
                              <select 
                                 onChange={(e) => {
                                    if (e.target.value) {
                                        loadStoryFromWorkspace(e.target.value);
                                        e.target.value = '';
                                    }
                                 }}
                                 className="w-full bg-slate-950 border border-emerald-800/50 text-emerald-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-emerald-500"
                              >
                                 <option value="">{t.home.selectFile}</option>
                                 {storyFiles.map((f, i) => (
                                   <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                                 ))}
                              </select>
                            </div>
                          ) : (
                            <button 
                              onClick={() => storyFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t.home.loadStory}</span>
                            </button>
                          )}
                          <button 
                            onClick={handleCreateNewStory}
                            className="w-full flex items-center justify-center space-x-2 border border-emerald-800/50 hover:bg-emerald-900/20 text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest py-1.5 text-[9px] transition-colors cursor-pointer rounded-sm font-sans"
                          >
                            <span>{t.home.createStory}</span>
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    id: 'unitBalance',
                    category: 'galaxy',
                    version: '1.1',
                    title: tr(lang, 'Unit Balance Editor', 'Editor de Balance de Unidades', 'Éditeur d\'Équilibrage d\'Unités'),
                    desc: tr(
                      lang,
                      'Visualize and edit stats for <code class="text-emerald-400 font-mono">SpaceUnits</code>, <code class="text-emerald-400 font-mono">GroundInfantry</code>, and <code class="text-emerald-400 font-mono">Squadrons</code>.',
                      'Visualiza y edita estadísticas para <code class="text-emerald-400 font-mono">SpaceUnits</code>, <code class="text-emerald-400 font-mono">GroundInfantry</code> y <code class="text-emerald-400 font-mono">Squadrons</code> de manera ágil.',
                      'Visualisez et modifiez les statistiques pour <code class="text-emerald-400 font-mono">SpaceUnits</code>, <code class="text-emerald-400 font-mono">GroundInfantry</code> et <code class="text-emerald-400 font-mono">Squadrons</code> rapidement.'
                    ),
                    icon: <Database className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-emerald-950/30 hover:border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.01)] hover:shadow-[0_0_25px_rgba(16,185,129,0.06)]',
                    accentBadge: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
                    badgeLabel: tr(lang, 'UNIT STAT BALANCE', 'UNIDADES Y BALANCE', 'ÉQUILIBRAGE UNITÉS'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase() === 'spaceunits.xml' || f.name.toLowerCase() === 'groundinfantry.xml' || f.name.toLowerCase() === 'units.xml'),
                    renderAction: () => {
                      const unitFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml'));
                      const hasUnitFile = workspaceFiles.some(f => f.name.toLowerCase() === 'spaceunits.xml' || f.name.toLowerCase() === 'groundinfantry.xml' || f.name.toLowerCase() === 'units.xml');
                      return (
                        <div className="space-y-2 mt-auto">
                          {hasUnitFile ? (
                            <select 
                               onChange={(e) => {
                                  if (e.target.value) {
                                      loadUnitFromWorkspace(e.target.value);
                                      e.target.value = '';
                                  }
                               }}
                               className="w-full bg-slate-950 border border-emerald-800/50 text-emerald-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-emerald-500"
                            >
                               <option value="">{t.home.selectFile}</option>
                               {unitFiles.map((f, i) => (
                                 <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                               ))}
                            </select>
                          ) : (
                            <button 
                              onClick={() => unitFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{tr(lang, 'Load Units XML', 'Cargar XML de Unidades', 'Charger XML d\'Unités')}</span>
                            </button>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    id: 'dat',
                    category: 'localization',
                    version: '1.2',
                    title: t.home.datTitle,
                    desc: t.home.datDesc ? t.home.datDesc.replace('.DAT', '<code class="text-purple-400 font-mono font-bold">.DAT</code>') : '',
                    icon: <FileText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-purple-900/30 hover:border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.01)] hover:shadow-[0_0_25px_rgba(168,85,247,0.06)]',
                    accentBadge: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
                    badgeLabel: tr(lang, 'STRING LOCALIZATION', 'TEXTOS Y TRADUCCIÓN', 'LOCALISATION TEXTES'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.dat')),
                    renderAction: () => {
                      const datFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.dat'));
                      return (
                        <div className="space-y-1.5 mt-auto">
                          {datFiles.length > 0 ? (
                            <select 
                               onChange={(e) => {
                                  if (e.target.value) {
                                      loadDatFromWorkspace(e.target.value);
                                      e.target.value = '';
                                  }
                               }}
                               className="w-full bg-slate-950 border border-purple-800/50 text-purple-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-purple-500"
                            >
                              <option value="">{t.home.selectFile}</option>
                              {datFiles.map((f, i) => (
                                 <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button 
                              onClick={() => datFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t.home.loadDat}</span>
                            </button>
                          )}
                          <button 
                            onClick={handleCreateNewDat}
                            className="w-full flex items-center justify-center space-x-2 border border-purple-800/50 hover:bg-purple-900/20 text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest py-1.5 text-[9px] transition-colors cursor-pointer rounded-sm font-sans"
                          >
                            <span>{t.home.createEmptyDat}</span>
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    id: 'mtd',
                    category: 'localization',
                    version: '1.1',
                    title: t.home.mtdTitle,
                    desc: t.home.mtdDesc ? t.home.mtdDesc.replace('.MTD', '<code class="text-amber-400 font-mono">.MTD</code>') : '',
                    icon: <SettingsIcon className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-amber-900/30 hover:border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.01)] hover:shadow-[0_0_25px_rgba(245,158,11,0.06)]',
                    accentBadge: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
                    badgeLabel: tr(lang, 'MEGA-TEXTURE ATLAS', 'INTERFAZ Y TEXTURAS', 'ATLAS MÉGA-TEXTURES'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.mtd')),
                    renderAction: () => {
                      const mtdFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.mtd'));
                      return (
                        <div className="space-y-2 mt-auto">
                          {mtdFiles.length > 0 ? (
                            <select 
                               onChange={(e) => {
                                  if (e.target.value) {
                                      loadMtdFromWorkspace(e.target.value);
                                      e.target.value = '';
                                  }
                               }}
                               className="w-full bg-slate-950 border border-amber-800/50 text-slate-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-amber-500"
                            >
                               <option value="">{t.home.selectFile}</option>
                               {mtdFiles.map((f, i) => (
                                 <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                               ))}
                            </select>
                          ) : (
                            <button 
                              onClick={() => mtdFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t.home.loadMtd}</span>
                            </button>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    id: 'dialogEditor',
                    category: 'localization',
                    version: '1.1',
                    title: tr(lang, 'Dialog & Narrative Story Editor', 'Editor de Diálogos, Textos y Transmisiones', 'Éditeur de Dialogues et Transmissions'),
                    desc: tr(
                      lang,
                      'Visual creator and chronological builder for .TXT tactical dialogs, story text sequences, mission briefings and chapter scripts, synchronized with translations from loaded MasterTextFile.DAT of the mod.',
                      'Edita diálogos de misiones, transmisiones de campañas y guiones de capítulos .TXT con simulación de hologramas tácticos e integración con textos traducidos en tiempo real (procedentes del MasterTextFile.DAT).',
                      'Éditez les dialogues de mission, les transmissions de campagne et les scripts de chapitres .TXT avec simulation d\'hologramme tactique et intégration en temps réel avec MasterTextFile.DAT.'
                    ),
                    icon: <BookOpen className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-cyan-900/40 hover:border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.01)] hover:shadow-[0_0_25px_rgba(6,182,212,0.06)]',
                    accentBadge: 'text-cyan-400 bg-cyan-950/60 border-cyan-850/50',
                    badgeLabel: tr(lang, '.TXT STORY BRIEFS', 'GUIONES .TXT DE HISTORIA', 'SCRIPTS .TXT HISTOIRE'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.txt') && !f.name.toLowerCase().includes('readme') && !f.name.toLowerCase().includes('changelog')),
                    renderAction: () => {
                      const txtFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.txt') && !f.name.toLowerCase().includes('readme') && !f.name.toLowerCase().includes('changelog'));
                      return (
                        <div className="space-y-1.5 mt-auto">
                          {txtFiles.length > 0 ? (
                            <select 
                               onChange={(e) => {
                                  if (e.target.value) {
                                      loadDialogFromWorkspace(e.target.value);
                                      e.target.value = '';
                                  }
                               }}
                               className="w-full bg-slate-955 border border-cyan-850 text-cyan-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-cyan-500 hover:border-cyan-500/60 transition-colors"
                            >
                               <option value="">{t.home.selectFile}</option>
                               {txtFiles.map((f, i) => (
                                 <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                               ))}
                            </select>
                          ) : (
                            <button 
                              onClick={() => dialogFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{tr(lang, 'Load Dialog TXT', 'Cargar Fichero TXT', 'Charger Fichier TXT')}</span>
                            </button>
                          )}
                          <button 
                            onClick={handleCreateNewDialog}
                            className="w-full flex items-center justify-center space-x-2 border border-cyan-850/60 hover:bg-cyan-950/20 text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest py-1.5 text-[9px] transition-colors cursor-pointer rounded-sm font-sans"
                          >
                            <span>{tr(lang, 'Create New Dialog TXT', 'Crear Nuevo Diálogo', 'Créer un Nouveau Dialogue')}</span>
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    id: 'rawXml',
                    category: 'raw_code',
                    version: '2.1',
                    title: t.home?.xmlTitle || "Raw XML Editor",
                    desc: t.home?.xmlDesc || "A quick, direct text editor for any Empire at War related XML file with automatic syntax formatting and node closing logic.",
                    icon: <FileText className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-rose-900/30 hover:border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.01)] hover:shadow-[0_0_25px_rgba(244,63,94,0.06)]',
                    accentBadge: 'text-rose-400 bg-rose-950/60 border-rose-800/40',
                    badgeLabel: tr(lang, 'XML CODE EDITOR', 'EDITOR CÓDIGO XML', 'ÉDITEUR CODE XML'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.xml') && !f.name.toLowerCase().match(/^(planets|planet|story|traderoutes)\.xml$/)),
                    renderAction: () => {
                      const xmlFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml') && !f.name.toLowerCase().match(/^(planets|planet|story|traderoutes)\.xml$/));
                      return (
                        <div className="space-y-1.5 mt-auto">
                          {xmlFiles.length > 0 ? (
                            <select 
                               onChange={(e) => {
                                  if (e.target.value) {
                                      loadXmlFromWorkspace(e.target.value);
                                      e.target.value = '';
                                  }
                               }}
                               className="w-full bg-slate-950 border border-rose-800/50 text-slate-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-rose-500"
                            >
                               <option value="">{t.home.selectFile}</option>
                               {xmlFiles.map((f, i) => (
                                 <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                               ))}
                            </select>
                          ) : (
                            <button 
                              onClick={() => xmlFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t.home?.loadXml || "Load Generic XML"}</span>
                            </button>
                          )}
                          <button 
                            onClick={handleCreateNewXml}
                            className="w-full flex items-center justify-center space-x-2 border border-rose-800/50 hover:bg-rose-900/20 text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest py-1.5 text-[9px] transition-colors cursor-pointer rounded-sm font-sans"
                          >
                            <span>{t.home?.createEmptyXml || "Create Empty XML"}</span>
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    id: 'rawLua',
                    category: 'raw_code',
                    version: '2.1',
                    title: t.home?.luaTitle || "Raw LUA Editor",
                    desc: t.home?.luaDesc || "Alamo Engine Lua 5.0 IDE featuring a live AST symbol outline, categorized Petroglyph API commands, script templates, state/thread generator, and semantic diagnostics.",
                    icon: <FileText className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />,
                    accentColor: 'border-yellow-900/30 hover:border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.01)] hover:shadow-[0_0_25px_rgba(234,179,8,0.06)]',
                    accentBadge: 'text-yellow-400 bg-yellow-950/60 border-yellow-800/40',
                    badgeLabel: tr(lang, 'LUA CODE EDITOR', 'EDITOR CÓDIGO LUA', 'ÉDITEUR CODE LUA'),
                    detected: workspaceFiles.some(f => f.name.toLowerCase().endsWith('.lua')),
                    renderAction: () => {
                      const luaFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.lua'));
                      return (
                        <div className="space-y-1.5 mt-auto">
                          {luaFiles.length > 0 ? (
                            <select 
                               onChange={(e) => {
                                  if (e.target.value) {
                                      loadLuaFromWorkspace(e.target.value);
                                      e.target.value = '';
                                  }
                               }}
                               className="w-full bg-slate-950 border border-yellow-800/50 text-slate-300 font-mono text-[9px] uppercase tracking-widest py-2 px-1 rounded-sm cursor-pointer focus:outline-none focus:border-yellow-500"
                            >
                               <option value="">{t.home.selectFile}</option>
                               {luaFiles.map((f, i) => (
                                 <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                               ))}
                            </select>
                          ) : (
                            <button 
                              onClick={() => luaFileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[10px] transition-colors cursor-pointer rounded-sm font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t.home?.loadLua || "Load LUA Script"}</span>
                            </button>
                          )}
                          <button 
                            onClick={handleCreateNewLua}
                            className="w-full flex items-center justify-center space-x-2 border border-yellow-800/50 hover:bg-yellow-900/20 text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-widest py-1.5 text-[9px] transition-colors cursor-pointer rounded-sm font-sans"
                          >
                            <span>{t.home?.createEmptyLua || "Create Empty LUA"}</span>
                          </button>
                        </div>
                      );
                    }
                  }
                ];

                const filteredTools = allToolsList.filter(tool => {
                  const matchesCategory = selectedToolCategory === 'all' || tool.category === selectedToolCategory;
                  const query = toolsSearchQuery.trim().toLowerCase();
                  const matchesSearch = query === '' || 
                    tool.title.toLowerCase().includes(query) || 
                    tool.desc.toLowerCase().includes(query) || 
                    tool.badgeLabel.toLowerCase().includes(query);
                  return matchesCategory && matchesSearch;
                });

                if (filteredTools.length === 0) {
                  return (
                    <div className="w-full max-w-7xl bg-slate-950/40 border border-slate-900 rounded p-12 text-center mb-8 font-mono shadow-[inset_0_0_15px_rgba(245,158,11,0.01)] min-h-[250px] flex flex-col justify-center items-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500/60 mb-3 animate-pulse" />
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        {tr(lang, 'No workstation tools match your filters.', 'No se encontraron herramientas con los filtros actuales.', 'Aucun outil ne correspond aux filtres actuels.')}
                      </div>
                      <button
                        onClick={() => { setToolsSearchQuery(''); setSelectedToolCategory('all'); }}
                        className="mt-4 text-[9px] uppercase tracking-widest text-cyan-400 hover:text-cyan-300 border border-cyan-800/40 bg-cyan-950/20 px-3 py-1.5 rounded-sm font-bold transition-colors cursor-pointer"
                      >
                        {tr(lang, 'Clear Search', 'Limpiar Búsqueda', 'Effacer la Recherche')}
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mb-8 pb-4 px-2">
                    {filteredTools.map((tool) => (
                      <div 
                        key={tool.id} 
                        className={`bg-slate-900/40 backdrop-blur-sm p-5 border ${tool.accentColor} rounded-sm flex flex-col justify-between text-left transition-all duration-300 h-full relative group`}
                      >
                        <div>
                          {/* Card top banner with category pill and detection flag */}
                          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2.5">
                            <span className={`text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-sm border ${tool.accentBadge}`}>
                              {tool.badgeLabel}
                            </span>
                            
                            <div className="flex items-center space-x-1.5">
                              {tool.detected ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                  <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                                    {tr(lang, 'LOADED', 'CARGADO', 'CHARGÉ')}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
                                  <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                                    {tr(lang, 'READY', 'LISTO', 'PRÊT')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2.5 mb-2.5">
                            {tool.icon}
                            <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase font-mono flex items-center space-x-2">
                              <span>{tool.title}</span>
                              {tool.version && (
                                <span className="text-[9px] text-slate-400 bg-slate-900/50 px-1 py-0.5 rounded border border-slate-800">v{tool.version}</span>
                              )}
                            </h3>
                          </div>
                          
                          <p 
                            className="text-[11px] text-slate-400 mb-5 leading-relaxed font-sans" 
                            dangerouslySetInnerHTML={{ __html: tool.desc }}
                          ></p>
                        </div>

                        {tool.renderAction()}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* User Manual/Docs bottom row */}
              <div className="pt-6 border-t border-slate-900 w-full flex justify-center">
                <button 
                  onClick={() => setIsManualOpen(true)}
                  className="flex items-center space-x-2 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/40 text-slate-400 hover:text-cyan-400 font-mono text-[10px] uppercase tracking-widest py-2 px-5 transition-all cursor-pointer rounded"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t.userManual}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BulkEditModal 
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        planets={planets}
        onApply={handleBulkUpdate}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <ManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      <InstallerHudModal
        isOpen={isInstallerHudOpen}
        onClose={() => setIsInstallerHudOpen(false)}
      />

      <UpdaterUI />

      <ErrorModal 
        error={error} 
        onClose={() => setError(null)} 
      />

      <input type="file" ref={fileInputRef} className="hidden" accept=".xml" onChange={handleFileUpload} />
      <input type="file" ref={trFileInputRef} className="hidden" accept=".xml" onChange={handleTradeRoutesUpload} />
      <input type="file" ref={campaignFileInputRef} className="hidden" accept=".xml" onChange={handleCampaignsUpload} />
      <input type="file" ref={datFileInputRef} className="hidden" accept=".dat" onChange={handleDatFileUpload} />
      <input type="file" ref={mtdFileInputRef} className="hidden" accept=".mtd,.tga,.png,.jpg" multiple onChange={handleMtdUpload} />
      <input type="file" ref={storyFileInputRef} className="hidden" accept=".xml" onChange={handleStoryUpload} />
      <input type="file" ref={xmlFileInputRef} className="hidden" accept=".xml" onChange={handleXmlUpload} />
      <input type="file" ref={unitFileInputRef} className="hidden" accept=".xml" onChange={handleUnitUpload} />
      <input type="file" ref={luaFileInputRef} className="hidden" accept=".lua" onChange={handleLuaUpload} />
      <input type="file" ref={dialogFileInputRef} className="hidden" accept=".txt" onChange={handleDialogUpload} />
      <input type="file" ref={folderInputRef} className="hidden" 
             {...{ webkitdirectory: "true", directory: "true" } as any} 
             multiple onChange={handleFolderUpload} />
    </div>
  );
}

const SETTINGS_STORAGE_KEY = 'eaw_tool_settings';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          invertY: parsed.invertY ?? false,
          showGrid: parsed.showGrid ?? false,
          snapToGrid: parsed.snapToGrid ?? false,
          gridSize: parsed.gridSize ?? 1.0,
          language: parsed.language ?? 'en',
          storyXmlEditable: parsed.storyXmlEditable ?? false,
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      invertY: false,
      showGrid: false,
      snapToGrid: false,
      gridSize: 1.0,
      language: 'en',
      storyXmlEditable: false,
    };
  });

  React.useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <I18nProvider lang={settings.language}>
      <AppContent settings={settings} setSettings={setSettings} />
    </I18nProvider>
  );
}
