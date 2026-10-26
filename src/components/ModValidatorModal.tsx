import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  Wrench,
  Download,
  RefreshCw,
  FileText,
  Globe,
  Database,
  Layers
} from 'lucide-react';
import { Planet, TradeRoute, Campaign, StoryEvent } from '../types';
import { DatRecord, parseDatFile } from '../lib/dat';
import { MtdIcon, parseMtd } from '../lib/mtd';
import { useLanguage, tr } from '../i18n';

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'localization' | 'galaxy' | 'units' | 'icons';
  sourceFile: string;
  objectName: string;
  tagOrField: string;
  referenceValue: string;
  message: string;
  missingDatKey?: string;
}

interface ModValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  planets: Planet[];
  tradeRoutes: TradeRoute[];
  campaigns: Campaign[];
  storyEvents: StoryEvent[] | null;
  unitDoc: XMLDocument | null;
  hardPointDoc: XMLDocument | null;
  datRecords: DatRecord[] | null;
  mtdIcons: MtdIcon[] | null;
  workspaceFiles: File[];
  onAddDatRecord: (key: string, value: string) => void;
  onBatchAddDatRecords: (items: { key: string; value: string }[]) => void;
}

export default function ModValidatorModal({
  isOpen,
  onClose,
  planets,
  tradeRoutes,
  campaigns,
  storyEvents,
  unitDoc,
  hardPointDoc,
  datRecords,
  mtdIcons,
  workspaceFiles,
  onAddDatRecord,
  onBatchAddDatRecords
}: ModValidatorModalProps) {
  const lang = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'localization' | 'galaxy' | 'units' | 'icons'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedFilesCount, setScannedFilesCount] = useState(0);
  const [fixedKeys, setFixedKeys] = useState<Set<string>>(new Set());

  const runFullAudit = async () => {
    setIsScanning(true);
    const found: ValidationIssue[] = [];
    let filesCount = 0;

    try {
      // 1. Build known .DAT keys set (from memory or workspace .dat files)
      const datKeySet = new Set<string>();
      if (datRecords && datRecords.length > 0) {
        filesCount++;
        datRecords.forEach(r => datKeySet.add(r.key.trim().toUpperCase()));
      } else {
        const wsDat = workspaceFiles.find(f => f.name.toLowerCase().endsWith('.dat'));
        if (wsDat) {
          filesCount++;
          const buf = await wsDat.arrayBuffer();
          const parsed = parseDatFile(buf);
          parsed.records.forEach(r => datKeySet.add(r.key.trim().toUpperCase()));
        }
      }

      // 2. Build known .MTD icon names set
      const mtdSet = new Set<string>();
      if (mtdIcons && mtdIcons.length > 0) {
        filesCount++;
        mtdIcons.forEach(ic => {
          const clean = ic.name.toLowerCase().replace(/\.(tga|dds|png)$/i, '');
          mtdSet.add(clean);
          mtdSet.add(ic.name.toLowerCase());
        });
      } else {
        const wsMtd = workspaceFiles.find(f => f.name.toLowerCase().endsWith('.mtd'));
        if (wsMtd) {
          filesCount++;
          const buf = await wsMtd.arrayBuffer();
          const parsed = parseMtd(buf);
          parsed.forEach(ic => {
            const clean = ic.name.toLowerCase().replace(/\.(tga|dds|png)$/i, '');
            mtdSet.add(clean);
            mtdSet.add(ic.name.toLowerCase());
          });
        }
      }

      const hasDatLoaded = datKeySet.size > 0;
      const hasMtdLoaded = mtdSet.size > 0;

      // Helper to check a Text_ID reference
      const checkTextId = (sourceFile: string, objName: string, tag: string, val: string) => {
        if (!val || !hasDatLoaded) return;
        const clean = val.trim().toUpperCase();
        if (!clean || clean === 'NONE') return;
        if (!datKeySet.has(clean)) {
          found.push({
            id: `dat_${sourceFile}_${objName}_${tag}_${clean}`,
            severity: 'warning',
            category: 'localization',
            sourceFile,
            objectName: objName,
            tagOrField: tag,
            referenceValue: val.trim(),
            missingDatKey: val.trim(),
            message: tr(
              lang,
              `Text key "${val.trim()}" is not defined in the active .DAT string table.`,
              `La clave de texto "${val.trim()}" no existe en la tabla .DAT activa.`,
              `La clé de texte "${val.trim()}" est absente de la table .DAT.`
            )
          });
        }
      };

      // Helper to check an Icon_Name reference
      const checkIconName = (sourceFile: string, objName: string, val: string) => {
        if (!val || !hasMtdLoaded) return;
        const clean = val.trim().toLowerCase().replace(/\.(tga|dds|png)$/i, '');
        if (!clean || clean === 'none') return;
        if (!mtdSet.has(clean) && !mtdSet.has(val.trim().toLowerCase())) {
          found.push({
            id: `mtd_${sourceFile}_${objName}_${clean}`,
            severity: 'warning',
            category: 'icons',
            sourceFile,
            objectName: objName,
            tagOrField: 'Icon_Name',
            referenceValue: val.trim(),
            message: tr(
              lang,
              `Icon "${val.trim()}" was not found in the loaded .MTD atlas.`,
              `El icono "${val.trim()}" no se encuentra registrado en el atlas .MTD cargado.`,
              `L'icône "${val.trim()}" est introuvable dans l'atlas .MTD.`
            )
          });
        }
      };

      // 3. Audit Galaxy Planets & Trade Routes
      const planetNamesSet = new Set<string>();
      if (planets.length > 0) {
        filesCount++;
        const coordMap = new Map<string, string>();
        planets.forEach(p => {
          planetNamesSet.add(p.name.toLowerCase());
          if (p.name.toLowerCase() !== 'galaxy_core_art_model') {
            const coordKey = `${Math.round(p.x)},${Math.round(p.y)}`;
            if (coordMap.has(coordKey)) {
              found.push({
                id: `gal_overlap_${p.name}`,
                severity: 'warning',
                category: 'galaxy',
                sourceFile: 'Planets.xml',
                objectName: p.name,
                tagOrField: 'Galactic_Position',
                referenceValue: `(${p.x}, ${p.y})`,
                message: tr(
                  lang,
                  `Overlaps Galactic_Position with planet "${coordMap.get(coordKey)}".`,
                  `Coordenadas (${p.x}, ${p.y}) superpuestas con el planeta "${coordMap.get(coordKey)}".`,
                  `Position galactique superposée avec "${coordMap.get(coordKey)}".`
                )
              });
            } else {
              coordMap.set(coordKey, p.name);
            }
          }
          const textIdNode = p.el.getElementsByTagName('Text_ID')[0];
          if (textIdNode?.textContent) {
            checkTextId('Planets.xml', p.name, 'Text_ID', textIdNode.textContent);
          }
        });
      }

      if (tradeRoutes.length > 0) {
        filesCount++;
        const connectedPlanets = new Set<string>();
        tradeRoutes.forEach(r => {
          connectedPlanets.add(r.pointA.toLowerCase());
          connectedPlanets.add(r.pointB.toLowerCase());
          if (planetNamesSet.size > 0) {
            if (!planetNamesSet.has(r.pointA.toLowerCase())) {
              found.push({
                id: `tr_a_${r.name}`,
                severity: 'error',
                category: 'galaxy',
                sourceFile: 'TradeRoutes.xml',
                objectName: r.name,
                tagOrField: 'Point_A',
                referenceValue: r.pointA,
                message: tr(
                  lang,
                  `Endpoint Point_A "${r.pointA}" does not exist in Planets.xml.`,
                  `El extremo Point_A "${r.pointA}" no existe en Planets.xml.`,
                  `Point_A "${r.pointA}" n'existe pas dans Planets.xml.`
                )
              });
            }
            if (!planetNamesSet.has(r.pointB.toLowerCase())) {
              found.push({
                id: `tr_b_${r.name}`,
                severity: 'error',
                category: 'galaxy',
                sourceFile: 'TradeRoutes.xml',
                objectName: r.name,
                tagOrField: 'Point_B',
                referenceValue: r.pointB,
                message: tr(
                  lang,
                  `Endpoint Point_B "${r.pointB}" does not exist in Planets.xml.`,
                  `El extremo Point_B "${r.pointB}" no existe en Planets.xml.`,
                  `Point_B "${r.pointB}" n'existe pas dans Planets.xml.`
                )
              });
            }
          }
        });

        // Check isolated planets
        planets.forEach(p => {
          if (
            p.name.toLowerCase() !== 'galaxy_core_art_model' &&
            !connectedPlanets.has(p.name.toLowerCase())
          ) {
            found.push({
              id: `gal_isolated_${p.name}`,
              severity: 'warning',
              category: 'galaxy',
              sourceFile: 'Planets.xml',
              objectName: p.name,
              tagOrField: 'TradeRoutes',
              referenceValue: '0 routes',
              message: tr(
                lang,
                `Planet "${p.name}" has no hyperspace trade routes connected to it.`,
                `El planeta "${p.name}" está aislado sin ninguna ruta comercial hiperespacial.`,
                `La planète "${p.name}" n'est reliée à aucune route commerciale.`
              )
            });
          }
        });
      }

      // 4. Audit Campaigns
      if (campaigns.length > 0) {
        filesCount++;
        campaigns.forEach(c => {
          checkTextId('Campaigns.xml', c.name, 'Text_ID', c.textId);
          checkTextId('Campaigns.xml', c.name, 'Description_Text', c.descriptionText);

          const locSet = new Set(c.locations.map(l => l.toLowerCase()));
          c.locations.forEach(loc => {
            if (
              planetNamesSet.size > 0 &&
              loc.toLowerCase() !== 'galaxy_core_art_model' &&
              !planetNamesSet.has(loc.toLowerCase())
            ) {
              found.push({
                id: `camp_loc_${c.name}_${loc}`,
                severity: 'error',
                category: 'galaxy',
                sourceFile: 'Campaigns.xml',
                objectName: c.name,
                tagOrField: 'Locations',
                referenceValue: loc,
                message: tr(
                  lang,
                  `Campaign references planet "${loc}" which does not exist in Planets.xml.`,
                  `La campaña incluye el planeta "${loc}", pero no existe en Planets.xml.`,
                  `La campagne référence la planète inexistante "${loc}".`
                )
              });
            }
          });

          c.factions.forEach(fac => {
            if (fac.homeLocation && !locSet.has(fac.homeLocation.toLowerCase())) {
              found.push({
                id: `camp_hq_${c.name}_${fac.faction}`,
                severity: 'error',
                category: 'galaxy',
                sourceFile: 'Campaigns.xml',
                objectName: `${c.name} (${fac.faction})`,
                tagOrField: 'Home_Location',
                referenceValue: fac.homeLocation,
                message: tr(
                  lang,
                  `Faction HQ "${fac.homeLocation}" is not included in the campaign's active <Locations>.`,
                  `La capital "${fac.homeLocation}" de ${fac.faction} no está incluida en <Locations> de la campaña.`,
                  `La capitale "${fac.homeLocation}" n'est pas dans <Locations>.`
                )
              });
            }
          });
        });
      }

      // 5. Audit Units & HardPoints XML Docs (plus any XML in workspaceFiles)
      const xmlDocsToScan: { name: string; doc: XMLDocument }[] = [];
      if (unitDoc) xmlDocsToScan.push({ name: 'Units.xml', doc: unitDoc });
      if (hardPointDoc) xmlDocsToScan.push({ name: 'HardPoints.xml', doc: hardPointDoc });

      const wsXmlFiles = workspaceFiles.filter(f => f.name.toLowerCase().endsWith('.xml')).slice(0, 25);
      for (const wf of wsXmlFiles) {
        try {
          const txt = await wf.text();
          const parser = new DOMParser();
          const parsed = parser.parseFromString(txt, 'application/xml');
          if (!parsed.querySelector('parsererror')) {
            xmlDocsToScan.push({ name: wf.name, doc: parsed });
          }
        } catch {
          // ignore unreadable file
        }
      }

      const knownHardPoints = new Set<string>();
      xmlDocsToScan.forEach(({ doc }) => {
        Array.from(doc.getElementsByTagName('HardPoint')).forEach(hp => {
          const hpName = hp.getAttribute('Name');
          if (hpName) knownHardPoints.add(hpName.toLowerCase());
        });
      });

      const seenEntityNames = new Map<string, string>();
      xmlDocsToScan.forEach(({ name: srcName, doc }) => {
        filesCount++;
        const allEls = Array.from(doc.documentElement?.children || []);
        allEls.forEach(el => {
          const objName = el.getAttribute('Name');
          if (!objName) return;

          const nameKey = `${el.tagName}:${objName.toLowerCase()}`;
          if (seenEntityNames.has(nameKey) && seenEntityNames.get(nameKey) === srcName) {
            found.push({
              id: `dup_${srcName}_${objName}_${Math.random().toString(36).slice(2, 6)}`,
              severity: 'error',
              category: 'units',
              sourceFile: srcName,
              objectName: objName,
              tagOrField: 'Name',
              referenceValue: objName,
              message: tr(
                lang,
                `Duplicate XML object definition "${objName}" inside ${srcName}.`,
                `Definición duplicada del objeto "${objName}" dentro de ${srcName}.`,
                `Définition dupliquée de "${objName}" dans ${srcName}.`
              )
            });
          }
          seenEntityNames.set(nameKey, srcName);

          const textId = el.getElementsByTagName('Text_ID')[0]?.textContent;
          if (textId) checkTextId(srcName, objName, 'Text_ID', textId);

          const tooltipId = el.getElementsByTagName('Tooltip_Text')[0]?.textContent;
          if (tooltipId) checkTextId(srcName, objName, 'Tooltip_Text', tooltipId);

          const iconName = el.getElementsByTagName('Icon_Name')[0]?.textContent;
          if (iconName) checkIconName(srcName, objName, iconName);

          // Check unit health / cost sanity
          if (/SpaceUnit|GroundVehicle|GroundInfantry|HeroUnit|StarBase/i.test(el.tagName)) {
            const healthNode = el.getElementsByTagName('Tactical_Health')[0];
            if (healthNode && (parseFloat(healthNode.textContent || '0') || 0) <= 0) {
              found.push({
                id: `unit_hp0_${srcName}_${objName}`,
                severity: 'error',
                category: 'units',
                sourceFile: srcName,
                objectName: objName,
                tagOrField: 'Tactical_Health',
                referenceValue: healthNode.textContent || '0',
                message: tr(
                  lang,
                  `Unit "${objName}" has Tactical_Health <= 0 and will instantly die on spawn.`,
                  `La unidad "${objName}" tiene Tactical_Health <= 0 y se destruirá al aparecer.`,
                  `L'unité "${objName}" a Tactical_Health <= 0.`
                )
              });
            }

            if (knownHardPoints.size > 0) {
              const hpText = el.getElementsByTagName('HardPoints')[0]?.textContent;
              if (hpText) {
                const hpList = hpText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                hpList.forEach(hpRef => {
                  if (!knownHardPoints.has(hpRef.toLowerCase())) {
                    found.push({
                      id: `unit_missing_hp_${srcName}_${objName}_${hpRef}`,
                      severity: 'warning',
                      category: 'units',
                      sourceFile: srcName,
                      objectName: objName,
                      tagOrField: 'HardPoints',
                      referenceValue: hpRef,
                      message: tr(
                        lang,
                        `Referenced HardPoint "${hpRef}" was not found in loaded HardPoints XML.`,
                        `El HardPoint referenciado "${hpRef}" no se encontró en los archivos HardPoints XML cargados.`,
                        `Le HardPoint "${hpRef}" est introuvable.`
                      )
                    });
                  }
                });
              }
            }
          }
        });
      });

      // 6. If user opened Auditor with no files loaded yet, generate a realistic Demo Diagnostic Set
      if (filesCount === 0 && found.length === 0) {
        found.push(
          {
            id: 'demo_dat_1',
            severity: 'warning',
            category: 'localization',
            sourceFile: 'SpaceUnitsCapital.xml',
            objectName: 'Imperial_Star_Destroyer_II',
            tagOrField: 'Text_ID',
            referenceValue: 'TEXT_UNIT_ISD_MK2',
            missingDatKey: 'TEXT_UNIT_ISD_MK2',
            message: tr(
              lang,
              '[Demo Scan] Text key "TEXT_UNIT_ISD_MK2" is missing in MasterTextFile.dat.',
              '[Escaneo Demo] La clave "TEXT_UNIT_ISD_MK2" no está registrada en MasterTextFile.dat.',
              '[Scan Démo] La clé "TEXT_UNIT_ISD_MK2" est absente de MasterTextFile.dat.'
            )
          },
          {
            id: 'demo_dat_2',
            severity: 'warning',
            category: 'localization',
            sourceFile: 'Campaigns_GC.xml',
            objectName: 'Sandbox_Outer_Rim_GC',
            tagOrField: 'Text_ID',
            referenceValue: 'TEXT_CAMPAIGN_OUTER_RIM_CONQUEST',
            missingDatKey: 'TEXT_CAMPAIGN_OUTER_RIM_CONQUEST',
            message: tr(
              lang,
              '[Demo Scan] Campaign title key "TEXT_CAMPAIGN_OUTER_RIM_CONQUEST" is missing in .DAT.',
              '[Escaneo Demo] Falta la traducción "TEXT_CAMPAIGN_OUTER_RIM_CONQUEST" en el archivo .DAT.',
              '[Scan Démo] Clé "TEXT_CAMPAIGN_OUTER_RIM_CONQUEST" manquante dans .DAT.'
            )
          },
          {
            id: 'demo_gal_1',
            severity: 'error',
            category: 'galaxy',
            sourceFile: 'TradeRoutes.xml',
            objectName: 'Route_Kuat_Fondor_Express',
            tagOrField: 'Point_B',
            referenceValue: 'Fondor_Shipyards',
            message: tr(
              lang,
              '[Demo Scan] Trade route endpoint "Fondor_Shipyards" does not match any Planet Name in Planets.xml.',
              '[Escaneo Demo] El destino "Fondor_Shipyards" de la ruta comercial no existe en Planets.xml.',
              '[Scan Démo] La planète "Fondor_Shipyards" n\'existe pas dans Planets.xml.'
            )
          },
          {
            id: 'demo_mtd_1',
            severity: 'warning',
            category: 'icons',
            sourceFile: 'SpaceUnitsCapital.xml',
            objectName: 'Vengeance_Frigate',
            tagOrField: 'Icon_Name',
            referenceValue: 'i_button_vengeance_mk2.tga',
            message: tr(
              lang,
              '[Demo Scan] Icon "i_button_vengeance_mk2.tga" is not packed in Mt_commandbar.mtd.',
              '[Escaneo Demo] El icono "i_button_vengeance_mk2.tga" no está indexado en Mt_commandbar.mtd.',
              '[Scan Démo] L\'icône "i_button_vengeance_mk2.tga" est absente de Mt_commandbar.mtd.'
            )
          }
        );
      }

      setIssues(found);
      setScannedFilesCount(filesCount);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runFullAudit();
    }
  }, [isOpen]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (!q) return true;
      return (
        item.objectName.toLowerCase().includes(q) ||
        item.referenceValue.toLowerCase().includes(q) ||
        item.sourceFile.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [issues, categoryFilter, severityFilter, searchQuery]);

  if (!isOpen) return null;

  const missingDatIssues = issues.filter(
    i => i.missingDatKey && !fixedKeys.has(i.missingDatKey.toUpperCase())
  );

  const handleFixSingleDatKey = (key: string, objName: string) => {
    const defaultText = objName.replace(/_/g, ' ');
    onAddDatRecord(key, defaultText);
    setFixedKeys(prev => new Set(prev).add(key.toUpperCase()));
  };

  const handleFixAllDatKeys = () => {
    const batch = missingDatIssues.map(item => ({
      key: item.missingDatKey!,
      value: item.objectName.replace(/_/g, ' ')
    }));
    if (batch.length > 0) {
      onBatchAddDatRecords(batch);
      const next = new Set(fixedKeys);
      batch.forEach(b => next.add(b.key.toUpperCase()));
      setFixedKeys(next);
    }
  };

  const handleExportReport = () => {
    const lines = [
      '================================================================================',
      '   CORVUS v3.2.0 // MOD INTEGRITY CROSS-VALIDATOR REPORT (v1.0)',
      `   Generated: ${new Date().toISOString()}`,
      `   Total Findings: ${issues.length}`,
      '================================================================================',
      '',
      ...issues.map(
        (iss, idx) =>
          `[${idx + 1}] [${iss.severity.toUpperCase()}] [${iss.category.toUpperCase()}] ${iss.sourceFile} -> ${iss.objectName} (${iss.tagOrField}: ${iss.referenceValue})\n    ${iss.message}`
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CORVUS_Mod_Integrity_Report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[86vh] bg-slate-900 border border-cyan-700/50 rounded-sm flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-cyan-500/15 border border-cyan-500/40 rounded-sm flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                  {tr(
                    lang,
                    'Global Mod Integrity Cross-Validator',
                    'Auditor Global de Integridad del Mod',
                    'Auditeur Global d\'Intégrité du Mod'
                  )}
                </h2>
                <span className="px-1.5 py-0.5 rounded-sm bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                {tr(
                  lang,
                  'Cross-checks XML references against .DAT localization strings, .MTD icon atlases, and Galactic Conquest topology.',
                  'Audita referencias cruzadas entre XML, textos .DAT, iconos .MTD y topología de planetas y campañas.',
                  'Vérifie la cohérence entre les fichiers XML, les textes .DAT, les icônes .MTD et la galaxie.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runFullAudit}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] uppercase font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{tr(lang, 'Re-Scan Mod', 'Re-Escanear Mod', 'Relancer l\'Audit')}</span>
            </button>
            <button
              onClick={handleExportReport}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[10px] uppercase font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Export Report', 'Exportar Informe', 'Exporter Rapport')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metrics & Auto-Fix Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-sm">
              <span className="text-[9px] text-slate-500 uppercase block">
                {tr(lang, 'Sources Audited', 'Fuentes Analizadas', 'Sources Analysées')}
              </span>
              <span className="text-sm font-bold text-slate-200 tabular-nums">
                {scannedFilesCount > 0 ? `${scannedFilesCount} active` : 'Demo Preset'}
              </span>
            </div>

            <div className="bg-slate-900 border border-rose-900/50 px-3 py-2 rounded-sm">
              <span className="text-[9px] text-rose-400 uppercase block">
                {tr(lang, 'Critical Errors', 'Errores Críticos', 'Erreurs Critiques')}
              </span>
              <span className="text-sm font-bold text-rose-300 tabular-nums">{errorCount}</span>
            </div>

            <div className="bg-slate-900 border border-amber-900/50 px-3 py-2 rounded-sm">
              <span className="text-[9px] text-amber-400 uppercase block">
                {tr(lang, 'Warnings & Missing Refs', 'Advertencias / Claves', 'Avertissements')}
              </span>
              <span className="text-sm font-bold text-amber-300 tabular-nums">{warningCount}</span>
            </div>
          </div>

          {missingDatIssues.length > 0 && (
            <button
              onClick={handleFixAllDatKeys}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>
                {tr(
                  lang,
                  `Auto-Create ${missingDatIssues.length} Missing Keys in .DAT`,
                  `Auto-Crear ${missingDatIssues.length} Claves Faltantes en .DAT`,
                  `Créer les ${missingDatIssues.length} Clés .DAT Manquantes`
                )}
              </span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            {[
              { id: 'all', label: tr(lang, 'All Categories', 'Todas las Categorías', 'Toutes Catégories') },
              { id: 'localization', label: tr(lang, '.DAT Strings', 'Textos .DAT', 'Textes .DAT') },
              { id: 'galaxy', label: tr(lang, 'Galaxy & GC', 'Galaxia y Campañas', 'Galaxie & GC') },
              { id: 'units', label: tr(lang, 'Units & HardPoints', 'Unidades y HardPoints', 'Unités & HardPoints') },
              { id: 'icons', label: tr(lang, '.MTD Icons', 'Iconos .MTD', 'Icônes .MTD') }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-2.5 py-1 rounded-sm uppercase cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs px-2.5 py-1 rounded-sm outline-none"
            >
              <option value="all">{tr(lang, 'All Severities', 'Toda Severidad', 'Toutes Sévérités')}</option>
              <option value="error">{tr(lang, 'Errors Only', 'Solo Errores Críticos', 'Erreurs Uniquement')}</option>
              <option value="warning">{tr(lang, 'Warnings Only', 'Solo Advertencias', 'Avertissements Uniquement')}</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder={tr(lang, 'Search issue, file, key...', 'Buscar objeto, archivo, clave...', 'Rechercher...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs pl-8 pr-3 py-1 rounded-sm outline-none w-56"
              />
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredIssues.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 font-mono">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
              <h4 className="text-sm font-bold text-emerald-300 uppercase">
                {tr(
                  lang,
                  'Zero Integrity Issues Found in Selected Filter',
                  'Cero Problemas de Integridad en el Filtro Actual',
                  'Aucun Problème d\'Intégrité Détecté'
                )}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {tr(
                  lang,
                  'All scanned XML references, planetary connections, and localization keys are synchronized.',
                  'Todas las referencias XML, conexiones planetarias y claves de localización escaneadas están sincronizadas.',
                  'Toutes les références XML, planètes et clés de localisation sont synchronisées.'
                )}
              </p>
            </div>
          ) : (
            filteredIssues.map((iss) => {
              const isFixed = iss.missingDatKey && fixedKeys.has(iss.missingDatKey.toUpperCase());
              return (
                <div
                  key={iss.id}
                  className={`p-3.5 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono ${
                    isFixed
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : iss.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 text-[10px]">
                      <span
                        className={`font-bold uppercase ${
                          isFixed
                            ? 'text-emerald-400'
                            : iss.severity === 'error'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {isFixed ? 'FIXED' : iss.severity.toUpperCase()}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-400">{iss.sourceFile}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-200 font-bold">{iss.objectName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-purple-300">
                        {iss.tagOrField}: {iss.referenceValue}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans">{iss.message}</p>
                  </div>

                  {iss.missingDatKey && (
                    <div className="shrink-0">
                      {isFixed ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{tr(lang, 'Added to .DAT', 'Añadido al .DAT', 'Ajouté au .DAT')}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFixSingleDatKey(iss.missingDatKey!, iss.objectName)}
                          className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-[10px] uppercase font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{tr(lang, 'Create in .DAT', 'Crear en .DAT', 'Créer dans .DAT')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
