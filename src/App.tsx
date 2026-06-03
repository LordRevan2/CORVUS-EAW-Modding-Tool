import React, { useRef, useState } from 'react';
import packageJson from '../package.json';
import { Upload, Download, Moon, AlertTriangle, Database, XCircle, Route, Globe, BookOpen, FileText, Settings as SettingsIcon, RefreshCw, Folder } from 'lucide-react';
import { Planet, TradeRoute, AppSettings, StoryEvent } from './types';
import { parsePlanetsXml, parseTradeRoutesXml, serializeXml, updatePlanetPositionInDoc, parseStoryXml } from './lib/xml';
import PlanetList from './components/PlanetList';
import GalaxyMap from './components/GalaxyMap';
import PlanetEditor from './components/PlanetEditor';
import BulkEditModal from './components/BulkEditModal';
import TradeRouteList from './components/TradeRouteList';
import TradeRouteEditor from './components/TradeRouteEditor';
import SettingsModal from './components/SettingsModal';
import ManualModal from './components/ManualModal';
import DatEditor from './components/DatEditor';
import MtdEditor from './components/MtdEditor';
import StoryEditor from './components/StoryEditor';
import XmlEditor from './components/XmlEditor';
import LuaEditor from './components/LuaEditor';
import UpdaterUI from './components/UpdaterUI';
import UnitEditor from './components/UnitEditor';
import { parseDatFile, DatRecord } from './lib/dat';
import { parseMtd, MtdIcon } from './lib/mtd';
import { I18nProvider, useTranslation, useLanguage } from './i18n';

function AppContent({ settings, setSettings }: { settings: AppSettings, setSettings: (s: AppSettings) => void }) {
  const t = useTranslation();
  const [xmlDoc, setXmlDoc] = useState<XMLDocument | null>(null);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [tradeRoutesXmlDoc, setTradeRoutesXmlDoc] = useState<XMLDocument | null>(null);
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TradeRoute | null>(null);
  const [activeTab, setActiveTab] = useState<'planets' | 'routes'>('planets');
  const [error, setError] = useState<string | null>(null);

  const [showCore, setShowCore] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

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

  const [workspaceFiles, setWorkspaceFiles] = useState<File[]>([]);
  const [selectedDatPath, setSelectedDatPath] = useState<string>('');
  const [selectedMtdPath, setSelectedMtdPath] = useState<string>('');
  const [selectedStoryPath, setSelectedStoryPath] = useState<string>('');
  const [selectedXmlPath, setSelectedXmlPath] = useState<string>('');
  const [selectedUnitPath, setSelectedUnitPath] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const trFileInputRef = useRef<HTMLInputElement>(null);
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

    const editGalaxyFromWorkspace = async () => {
    let planetsFile = workspaceFiles.find(f => f.name.toLowerCase() === 'planets.xml' || f.name.toLowerCase() === 'planet.xml');
    let routesFile = workspaceFiles.find(f => f.name.toLowerCase() === 'traderoutes.xml');
    
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
        if (!planetsFile && !routesFile) {
           setError(lang === 'es' ? 'No se encontraron archivos XML de galaxia (Planets.xml o TradeRoutes.xml) en el workspace.' : 'No galaxy XML files (Planets.xml or TradeRoutes.xml) found in workspace.');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName !== 'planets.xml' && fileName !== 'planet.xml') {
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
    if (fileName !== 'traderoutes.xml') {
      setError('File must be named TradeRoutes.xml');
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

  const handleCloseProject = () => {
    setXmlDoc(null);
    setPlanets([]);
    setSelectedPlanet(null);
    setTradeRoutesXmlDoc(null);
    setTradeRoutes([]);
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
      const emptyXml = `<?xml version="1.0" encoding="utf-8"?>\n<Root>\n\n</Root>`;
      setRawXmlContent(emptyXml);
      setRawXmlFileName('Generic.xml');
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
      const emptyLua = `-- New Lua script\n\nrequire("PGStateMachine")\nrequire("PGStoryMode")\n`;
      setRawLuaContent(emptyLua);
      setRawLuaFileName('Script.lua');
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

  const handleCreateNewStory = () => {
    setError(null);
    try {
      const emptyXml = `<?xml version="1.0" encoding="utf-8"?>\n<Story>\n</Story>`;
      const parsed = parseStoryXml(emptyXml);
      setStoryDoc(parsed.doc);
      setStoryEvents(parsed.storyEvents);
      setStoryFileName('Story.xml');
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
              <div className="relative overflow-hidden px-2 py-0.5 border border-amber-500/40 bg-amber-500/10 rounded flex items-center group cursor-default">
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] z-10">
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

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center border border-slate-700/50 hover:border-cyan-500/50 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-400 transition-all duration-200 group rounded"
            title={t.settings}
            id="settings_toggle_btn"
          >
            <SettingsIcon className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {rawLuaContent !== null ? (
          <LuaEditor
            initialContent={rawLuaContent}
            fileName={rawLuaFileName}
            onClose={() => { setRawLuaContent(null); }}
            onSave={(content, name) => handleSaveRawLua(content, name)}
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
             <div className="h-12 border-b border-cyan-900/50 bg-slate-900/80 flex flex-col md:flex-row items-center justify-between px-4 shrink-0 shadow-md">
                <div className="flex items-center space-x-3 mb-2 md:mb-0">
                  <div className="w-6 h-6 bg-cyan-500/20 border border-cyan-500/50 rounded flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                       <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">{t.home.xmlMapTitle}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs w-full md:w-auto overflow-x-auto justify-end">
                   <button 
                      onClick={() => setIsBulkEditOpen(true)}
                      className="px-3 py-1.5 border border-purple-500/50 hover:bg-purple-500/20 text-purple-400 text-[10px] tracking-widest uppercase transition-all flex items-center space-x-1.5"
                   >
                     <Database className="w-3.5 h-3.5" />
                     <span className="hidden sm:inline">{t.planetList.bulkEdit}</span>
                   </button>
                   
                   <button 
                      onClick={() => trFileInputRef.current?.click()}
                      className="px-3 py-1.5 border border-amber-500/50 hover:bg-amber-500/20 text-amber-500 text-[10px] tracking-widest uppercase transition-all flex items-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.importRoutes}</span>
                   </button>

                   <button 
                      onClick={handleExportAll}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5"
                   >
                     <Download className="w-3.5 h-3.5" />
                     <span className="whitespace-nowrap">{t.exportChanges}</span>
                   </button>
                   
                   <button 
                      onClick={handleCloseProject}
                      className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center"
                      title={t.closeProject}
                   >
                     <XCircle className="w-4 h-4" />
                   </button>
                </div>
             </div>

             <div className="flex-1 flex overflow-hidden">
               <div className="h-full flex flex-col shrink-0">
                  <div className="flex shrink-0">
                    <button
                       onClick={() => setActiveTab('planets')}
                       className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${
                          activeTab === 'planets' ? 'bg-cyan-900 border-b-2 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-b-2 border-slate-800 text-slate-500'
                       }`}
                    >
                       <Globe className="w-3 h-3" /> {t.planetsTab}
                    </button>
                     <button
                       onClick={() => setActiveTab('routes')}
                       className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${
                          activeTab === 'routes' ? 'bg-amber-900 border-b-2 border-amber-400 text-amber-200' : 'bg-slate-900 border-b-2 border-slate-800 text-slate-500'
                       }`}
                    >
                       <Route className="w-3 h-3" /> {t.routesTab}
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
                  ) : (
                    <TradeRouteList
                      tradeRoutes={tradeRoutes}
                      selectedRoute={selectedRoute}
                      onSelectRoute={(r) => { setSelectedRoute(r); setSelectedPlanet(null); }}
                      onAddRoute={handleAddTradeRoute}
                      onDeleteRoute={handleDeleteTradeRoute}
                    />
                  )}
               </div>

               <GalaxyMap
                 planets={displayPlanets}
                 tradeRoutes={tradeRoutes}
                 settings={settings}
                 selectedPlanet={selectedPlanet}
                 onSelectPlanet={(p) => { setSelectedPlanet(p); setSelectedRoute(null); setActiveTab('planets'); }}
                 onUpdatePlanet={handleUpdatePlanet}
               />

               {selectedPlanet || (!selectedRoute && activeTab === 'planets') ? (
                 <PlanetEditor 
                   planet={selectedPlanet} 
                   onUpdate={handleUpdatePlanet}
                   onDelete={() => selectedPlanet && handleDeletePlanet(selectedPlanet.id)}
                 />
               ) : null}

               {selectedRoute || (!selectedPlanet && activeTab === 'routes') ? (
                 <TradeRouteEditor 
                   route={selectedRoute} 
                   onUpdate={handleUpdateTradeRoute}
                   onDelete={() => selectedRoute && handleDeleteTradeRoute(selectedRoute.id)}
                 />
               ) : null}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-y-auto">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#22d3ee 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="max-w-4xl w-full flex flex-col items-center justify-center relative z-10 py-8">
              <div className="mb-8 max-w-xl text-center">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/40 rounded-sm flex items-center justify-center mx-auto mb-4 rotate-45">
                  <div className="w-5 h-5 border-2 border-cyan-400"></div>
                </div>
                <h2 className="text-xl font-bold text-cyan-200 mb-2 uppercase tracking-widest italic">{t.home.title}</h2>
                <p className="text-xs text-slate-400 tracking-wider font-mono">
                  {t.home.subtitle}
                </p>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-slate-900/90 border-2 border-red-500/30 text-red-400 font-mono text-xs text-left rounded-md max-w-2xl w-full flex flex-col space-y-2 shadow-[0_0_20px_rgba(239,68,68,0.1)] select-text overflow-hidden shrink-0">
                  <div className="flex items-center space-x-2 border-b border-red-500/20 pb-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 select-none animate-pulse" />
                    <span className="font-bold uppercase tracking-wider text-[10px] text-red-400 select-none">{t.home.errorLog}</span>
                  </div>
                  <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed select-text font-mono max-h-96 pr-1 custom-scrollbar">{error}</pre>
                </div>
              )}

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
                      {workspaceFiles.length} files loaded
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                      {lang === 'es' 
                         ? "Carga una carpeta completa 'Data' o un directorio de Mod. Corvus identificará los archivos soportados automáticamente para cargarlos bajo demanda." 
                         : "Load a full 'Data' folder or Mod directory. Corvus will automatically identify supported files and load them on demand."}
                    </p>
                  )}
                </div>
                {!workspaceFiles.length && (
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="w-full md:w-auto shrink-0 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-3 px-6 text-xs transition-colors rounded-sm"
                  >
                    <Folder className="w-4 h-4 text-emerald-950" />
                    <span>{t.home.loadModFolder}</span>
                  </button>
                )}
                {workspaceFiles.length > 0 && (
                   <button 
                     onClick={() => setWorkspaceFiles([])}
                     className="w-full md:w-auto shrink-0 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-widest py-2 px-4 text-[11px] transition-colors rounded-sm border border-slate-700"
                   >
                     <XCircle className="w-4 h-4" />
                     <span>Clear Workspace</span>
                   </button>
                )}
              </div>

              {/* Grid Layout (3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
                {/* XML Planet Database */}
                <div className="bg-slate-900/40 p-6 border border-cyan-800/30 rounded flex flex-col justify-between text-left hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(6,182,212,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <Globe className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-cyan-300 tracking-widest uppercase font-mono">{t.home.xmlMapTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.home.xmlMapDesc.replace('Planets.xml', '<code class="text-cyan-400 font-mono">Planets.xml</code>') }}></p>
                  </div>
                  
                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase() === 'planets.xml' || f.name.toLowerCase() === 'planet.xml') ? (
                       <button 
                         onClick={editGalaxyFromWorkspace}
                         className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[11px] transition-colors"
                       >
                         <Globe className="w-4 h-4" />
                         <span>{t.home.editGalaxy}</span>
                       </button>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-[11px] transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.importPlanets}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleCreateNew}
                      className="w-full flex items-center justify-center space-x-2 border border-cyan-800/50 hover:bg-cyan-900/30 text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-widest py-2 text-[10px] transition-colors"
                    >
                      <span>{t.initEmptyDb}</span>
                    </button>
                  </div>
                </div>

                {/* Story Editor */}
                <div className="hidden bg-slate-900/40 p-6 border border-emerald-900/30 rounded flex flex-col justify-between text-left hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(16,185,129,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <BookOpen className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-emerald-300 tracking-widest uppercase font-mono">{t.home.storyTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.home.storyDesc }}></p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('story')) ? (
                      <select 
                         onChange={(e) => {
                            if (e.target.value) {
                                loadStoryFromWorkspace(e.target.value);
                                e.target.value = '';
                            }
                         }}
                         className="w-full bg-slate-950 border border-emerald-800/50 text-slate-300 font-mono text-[10px] uppercase tracking-widest py-2.5 px-2 transition-colors focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                         <option value="">{t.home.selectFile}</option>
                         {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml') && f.name.toLowerCase().includes('story')).map((f, i) => (
                           <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                         ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => storyFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.home.loadStory}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleCreateNewStory}
                      className="w-full flex items-center justify-center space-x-2 border border-emerald-800/50 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest py-2 text-[10px] transition-colors"
                    >
                      <span>{t.home.createStory}</span>
                    </button>
                  </div>
                </div>

                {/* DAT Translation Tool */}
                <div className="bg-slate-900/40 p-6 border border-purple-900/30 rounded flex flex-col justify-between text-left hover:border-purple-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(168,85,247,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <FileText className="w-5 h-5 text-purple-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-purple-300 tracking-widest uppercase font-mono">{t.home.datTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.home.datDesc.replace('.DAT', '<code class="text-purple-400 font-mono">.DAT</code>') }}></p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase().endsWith('.dat')) ? (
                      <select 
                         onChange={(e) => {
                            if (e.target.value) {
                                loadDatFromWorkspace(e.target.value);
                                e.target.value = '';
                            }
                         }}
                         className="w-full bg-slate-950 border border-purple-800/50 text-slate-300 font-mono text-[10px] uppercase tracking-widest py-2.5 px-2 transition-colors focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="">{t.home.selectFile}</option>
                        {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.dat')).map((f, i) => (
                           <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                        ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => datFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.home.loadDat}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleCreateNewDat}
                      className="w-full flex items-center justify-center space-x-2 border border-purple-800/50 hover:bg-purple-900/30 text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest py-2 text-[10px] transition-colors"
                    >
                      <span>{t.home.createEmptyDat}</span>
                    </button>
                  </div>
                </div>

                {/* MTD Texture Tool */}
                <div className="bg-slate-900/40 p-6 border border-amber-900/30 rounded flex flex-col justify-between text-left hover:border-amber-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(245,158,11,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <SettingsIcon className="w-5 h-5 text-amber-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-amber-300 tracking-widest uppercase font-mono">{t.home.mtdTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.home.mtdDesc.replace('.MTD', '<code class="text-amber-400 font-mono">.MTD</code>') }}></p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase().endsWith('.mtd')) ? (
                      <select 
                         onChange={(e) => {
                            if (e.target.value) {
                                loadMtdFromWorkspace(e.target.value);
                                e.target.value = '';
                            }
                         }}
                         className="w-full bg-slate-950 border border-amber-800/50 text-slate-300 font-mono text-[10px] uppercase tracking-widest py-2.5 px-2 transition-colors focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                         <option value="">{t.home.selectFile}</option>
                         {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.mtd')).map((f, i) => (
                           <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                         ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => mtdFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.home.loadMtd}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Unit Balance Editor */}
                <div className="hidden bg-slate-900/40 p-6 border border-emerald-900/30 rounded flex flex-col justify-between text-left hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(16,185,129,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <Database className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-emerald-300 tracking-widest uppercase font-mono">Unit Balance Editor</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      Visualize and edit stats for <code className="text-emerald-400 font-mono">SpaceUnits</code>, <code className="text-emerald-400 font-mono">GroundInfantry</code>, and <code className="text-emerald-400 font-mono">Squadrons</code>.
                    </p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase() === 'spaceunits.xml' || f.name.toLowerCase() === 'groundinfantry.xml' || f.name.toLowerCase() === 'units.xml') ? (
                      <select 
                         onChange={(e) => {
                            if (e.target.value) {
                                loadUnitFromWorkspace(e.target.value);
                                e.target.value = '';
                            }
                         }}
                         className="w-full bg-slate-950 border border-emerald-800/50 text-slate-300 font-mono text-[10px] uppercase tracking-widest py-2.5 px-2 transition-colors focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                         <option value="">{t.home.selectFile}</option>
                         {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml')).map((f, i) => (
                           <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                         ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => unitFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Load Units XML</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Raw XML Tool */}
                <div className="bg-slate-900/40 p-6 border border-rose-900/30 rounded flex flex-col justify-between text-left hover:border-rose-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(244,63,94,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <FileText className="w-5 h-5 text-rose-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-rose-300 tracking-widest uppercase font-mono">{t.home?.xmlTitle || "Raw XML Editor"}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      {t.home?.xmlDesc || "A quick, direct text editor for any Empire at War related XML file with automatic syntax formatting and node closing logic."}
                    </p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase().endsWith('.xml') && !f.name.toLowerCase().match(/^(planets|planet|story|traderoutes)\.xml$/)) ? (
                      <select 
                         onChange={(e) => {
                            if (e.target.value) {
                                loadXmlFromWorkspace(e.target.value);
                                e.target.value = '';
                            }
                         }}
                         className="w-full bg-slate-950 border border-rose-800/50 text-slate-300 font-mono text-[10px] uppercase tracking-widest py-2.5 px-2 transition-colors focus:outline-none focus:border-rose-500 cursor-pointer"
                      >
                         <option value="">{t.home.selectFile}</option>
                         {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml') && !f.name.toLowerCase().match(/^(planets|planet|story|traderoutes)\.xml$/)).map((f, i) => (
                           <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                         ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => xmlFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.home?.loadXml || "Load Generic XML"}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleCreateNewXml}
                      className="w-full flex items-center justify-center space-x-2 border border-rose-800/50 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest py-2 text-[10px] transition-colors"
                    >
                      <span>{t.home?.createEmptyXml || "Create Empty XML"}</span>
                    </button>
                  </div>
                </div>
                {/* Raw LUA Tool */}
                <div className="bg-slate-900/40 p-6 border border-yellow-900/30 rounded flex flex-col justify-between text-left hover:border-yellow-500/40 hover:bg-slate-900/60 transition-all group shadow-[0_0_20px_rgba(234,179,8,0.02)]">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <FileText className="w-5 h-5 text-yellow-400 group-hover:animate-pulse" />
                      <h3 className="text-sm font-bold text-yellow-300 tracking-widest uppercase font-mono">{t.home?.luaTitle || "Raw LUA Editor"}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      {t.home?.luaDesc || "A direct text editor for Lua scripts with syntax highlighting."}
                    </p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {workspaceFiles.some(f => f.name.toLowerCase().endsWith('.lua')) ? (
                      <select 
                         onChange={(e) => {
                            if (e.target.value) {
                                loadLuaFromWorkspace(e.target.value);
                                e.target.value = '';
                            }
                         }}
                         className="w-full bg-slate-950 border border-yellow-800/50 text-slate-300 font-mono text-[10px] uppercase tracking-widest py-2.5 px-2 transition-colors focus:outline-none focus:border-yellow-500 cursor-pointer"
                      >
                         <option value="">{t.home.selectFile}</option>
                         {workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.lua')).map((f, i) => (
                           <option key={i} value={f.webkitRelativePath || f.name}>{f.name}</option>
                         ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => luaFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold uppercase tracking-widest py-2.5 text-xs transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.home?.loadLua || "Load LUA Script"}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleCreateNewLua}
                      className="w-full flex items-center justify-center space-x-2 border border-yellow-800/50 hover:bg-yellow-900/30 text-yellow-400 hover:text-yellow-300 font-bold uppercase tracking-widest py-2 text-[10px] transition-colors"
                    >
                      <span>{t.home?.createEmptyLua || "Create Empty LUA"}</span>
                    </button>
                  </div>
                </div>
              </div>

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

      <UpdaterUI />

      <input type="file" ref={fileInputRef} className="hidden" accept=".xml" onChange={handleFileUpload} />
      <input type="file" ref={trFileInputRef} className="hidden" accept=".xml" onChange={handleTradeRoutesUpload} />
      <input type="file" ref={datFileInputRef} className="hidden" accept=".dat" onChange={handleDatFileUpload} />
      <input type="file" ref={mtdFileInputRef} className="hidden" accept=".mtd,.tga,.png,.jpg" multiple onChange={handleMtdUpload} />
      <input type="file" ref={storyFileInputRef} className="hidden" accept=".xml" onChange={handleStoryUpload} />
      <input type="file" ref={xmlFileInputRef} className="hidden" accept=".xml" onChange={handleXmlUpload} />
      <input type="file" ref={unitFileInputRef} className="hidden" accept=".xml" onChange={handleUnitUpload} />
      <input type="file" ref={luaFileInputRef} className="hidden" accept=".lua" onChange={handleLuaUpload} />
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
