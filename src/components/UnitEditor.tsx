import React, { useState, useRef, useEffect } from 'react';
import { Save, Search, X, Shield, Heart, Clock, Coins, Crosshair } from 'lucide-react';
import { useTranslation } from '../i18n';

interface UnitEditorProps {
  initialDoc: XMLDocument;
  fileName: string;
  onClose: () => void;
  onError: (err: string) => void;
}

interface UnitData {
  id: string; // Internal id for tracking
  node: Element;
  tagName: string;
  name: string; // XML Node Attribute Name
  textId: string;
  affiliation: string;
  health: string;
  shields: string;
  buildCost: string;
  buildTime: string;
}

const UNIT_TAGS = ['SpaceUnit', 'GroundVehicle', 'GroundInfantry', 'Squadron', 'HeroUnit', 'UniqueUnit', 'StarBase', 'GroundCompany'];

export default function UnitEditor({ initialDoc, fileName, onClose, onError }: UnitEditorProps) {
  const { t } = useTranslation();
  const [units, setUnits] = useState<UnitData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const fileDownloadAnchorRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const parsedUnits: UnitData[] = [];
    
    UNIT_TAGS.forEach(tag => {
      const nodes = initialDoc.getElementsByTagName(tag);
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nameAttr = node.getAttribute('Name') || 'Unknown';
        
        const getTagContent = (tagName: string) => {
          const child = Array.from(node.children).find(c => c.tagName === tagName);
          return child?.textContent || '';
        };

        parsedUnits.push({
          id: `${tag}_${nameAttr}_${i}`,
          node,
          tagName: tag,
          name: nameAttr,
          textId: getTagContent('Text_ID'),
          affiliation: getTagContent('Affiliation'),
          health: getTagContent('Tactical_Health'),
          shields: getTagContent('Energy_Capacity'),
          buildCost: getTagContent('Build_Cost_Credits'),
          buildTime: getTagContent('Build_Time_Seconds')
        });
      }
    });

    setUnits(parsedUnits);
  }, [initialDoc]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.tagName.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateField = (field: string, value: string) => {
    if (!selectedUnit) return;

    // Update in XML Node
    let childNode = Array.from(selectedUnit.node.children).find(c => c.tagName === field);
    if (!childNode) {
      if (value.trim() === '') return; // Don't create empty elements
      childNode = initialDoc.createElement(field);
      selectedUnit.node.appendChild(childNode);
    }
    
    if (value.trim() === '') {
        selectedUnit.node.removeChild(childNode);
    } else {
        childNode.textContent = value;
    }

    // Update UI State
    setUnits(prev => prev.map(u => {
      if (u.id === selectedUnit.id) {
        return {
          ...u,
          textId: field === 'Text_ID' ? value : u.textId,
          affiliation: field === 'Affiliation' ? value : u.affiliation,
          health: field === 'Tactical_Health' ? value : u.health,
          shields: field === 'Energy_Capacity' ? value : u.shields,
          buildCost: field === 'Build_Cost_Credits' ? value : u.buildCost,
          buildTime: field === 'Build_Time_Seconds' ? value : u.buildTime,
        };
      }
      return u;
    }));
  };

  const handleSave = () => {
    try {
      const serializer = new XMLSerializer();
      let rawXml = serializer.serializeToString(initialDoc);
      
      // Basic formatting to make it somewhat readable
      let pad = 0;
      let formatted = '';
      rawXml.replace(/>\s*</g, '>\n<').split('\n').forEach((node) => {
          if (node.match(/^<\/\w/)) pad -= 1;
          formatted += '  '.repeat(Math.max(0, pad)) + node + '\n';
          if (node.match(/^<\w[^>]*[^\/]>.*$/) && !node.match(/<\/.+>$/)) pad += 1;
      });

      const blob = new Blob([formatted.trim()], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      if (fileDownloadAnchorRef.current) {
        fileDownloadAnchorRef.current.href = url;
        fileDownloadAnchorRef.current.download = fileName || "Units.xml";
        fileDownloadAnchorRef.current.click();
      }
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onError(err.message || "Failed to save file.");
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full bg-slate-900 border border-slate-700/50 shadow-2xl rounded-sm overflow-hidden">
        
        {/* Header */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center space-x-2">
                <Crosshair className="w-4 h-4" />
                <span>Unit Balance Editor</span>
              </h2>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                {fileName} ({units.length} units found)
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-2 rounded-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save XML</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-600 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-2 rounded-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          
          {/* Left Panel - Unit List */}
          <div className="w-1/3 min-w-[280px] max-w-sm bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-3 border-b border-slate-800 bg-slate-950 relative">
              <input
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 transition-colors text-slate-200 text-xs px-8 py-2 rounded-sm outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-5 top-5" />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filteredUnits.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUnitId(u.id)}
                  className={`w-full text-left p-3 rounded-sm flex flex-col gap-1 transition-all border ${
                    selectedUnitId === u.id 
                      ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300' 
                      : 'bg-slate-800/40 border-transparent text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs truncate uppercase tracking-wide">{u.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 bg-slate-950 rounded uppercase">{u.tagName}</span>
                    <span className="truncate">{u.affiliation}</span>
                  </span>
                </button>
              ))}
              {filteredUnits.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No units matched your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Unit Properties */}
          <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
            {selectedUnit ? (
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                <h3 className="text-xl font-bold tracking-widest uppercase text-emerald-400 mb-2">{selectedUnit.name}</h3>
                <div className="text-xs text-slate-500 font-mono mb-8 p-3 bg-slate-900 inline-block rounded-sm border border-slate-800">
                  Tag: &lt;{selectedUnit.tagName}&gt;
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
                  
                  {/* General / Identity */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 border-b border-slate-800 pb-2 flex-items-center"><Shield className="w-3.5 h-3.5 inline mr-2 text-slate-500"/>Identity & Faction</h4>
                    
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Text_ID</label>
                      <input 
                        type="text" 
                        value={selectedUnit.textId} 
                        onChange={(e) => handleUpdateField('Text_ID', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Affiliation</label>
                      <input 
                        type="text" 
                        value={selectedUnit.affiliation} 
                        onChange={(e) => handleUpdateField('Affiliation', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors"
                        placeholder="e.g. Empire, Rebel, Underworld"
                      />
                    </div>
                  </div>

                  {/* Economy */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 border-b border-slate-800 pb-2"><Coins className="w-3.5 h-3.5 inline mr-2 text-slate-500"/>Economy</h4>
                    
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Build_Cost_Credits</label>
                      <input 
                        type="number" 
                        value={selectedUnit.buildCost} 
                        onChange={(e) => handleUpdateField('Build_Cost_Credits', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Build_Time_Seconds</label>
                      <input 
                        type="number" 
                        value={selectedUnit.buildTime} 
                        onChange={(e) => handleUpdateField('Build_Time_Seconds', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Combat / Stats */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 border-b border-slate-800 pb-2"><Heart className="w-3.5 h-3.5 inline mr-2 text-slate-500"/>Combat Stats</h4>
                    
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tactical_Health</label>
                      <input 
                        type="number" 
                        value={selectedUnit.health} 
                        onChange={(e) => handleUpdateField('Tactical_Health', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Energy_Capacity (Shields)</label>
                      <input 
                        type="number" 
                        value={selectedUnit.shields} 
                        onChange={(e) => handleUpdateField('Energy_Capacity', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 flex-col space-y-4">
                <Crosshair className="w-16 h-16 text-slate-800 opacity-50" />
                <p className="text-sm font-bold tracking-widest uppercase">Select a unit to edit its balance data</p>
              </div>
            )}
          </div>
        </div>

      </div>
      <a ref={fileDownloadAnchorRef} className="hidden" />
    </div>
  );
}
