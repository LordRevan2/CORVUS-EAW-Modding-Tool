import React, { useState, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import { Search, Save, X, Plus, Trash2, ListTree, BookOpen, Code, Settings2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { StoryEvent, AppSettings } from '../types';
import { serializeXml, updateStoryEventInDoc, updateStoryEventFromXml, parseStoryXml } from '../lib/xml';

interface StoryEditorProps {
  initialDoc: XMLDocument;
  initialEvents: StoryEvent[];
  fileName: string;
  onClose: () => void;
  onError: (msg: string) => void;
  settings: AppSettings;
  onUpdateDoc?: (doc: XMLDocument, events: StoryEvent[]) => void;
}

const EVENT_TYPES = [
  { value: "STORY_ACCUMULATE", label: "STORY_ACCUMULATE (# of credits)" },
  { value: "STORY_AI_NOTIFICATION", label: "STORY_AI_NOTIFICATION (event name string) (planet list)" },
  { value: "STORY_BASE_DESTROYED", label: "STORY_BASE_DESTROYED (system name) (space, ground, either) (filter)" },
  { value: "STORY_BEGIN_ERA", label: "STORY_BEGIN_ERA (Era)" },
  { value: "STORY_CHECK_DESTROYED", label: "STORY_CHECK_DESTROYED (faction) (filter)" },
  { value: "STORY_CLICK_GUI", label: "STORY_CLICK_GUI (GUI element name)" },
  { value: "STORY_CONQUER", label: "STORY_CONQUER (System name) (no param 2) (who does the conquering)(filter)" },
  { value: "STORY_CONQUER_COUNT", label: "STORY_CONQUER_COUNT (# of systems)" },
  { value: "STORY_CONSTRUCT", label: "STORY_CONSTRUCT (Object name) (number to construct) (side doing construction) (filter)" },
  { value: "STORY_CONSTRUCT_LEVEL", label: "STORY_CONSTRUCT_LEVEL (System name) (1-5) (Filter)" },
  { value: "STORY_DEFEAT_HERO", label: "STORY_DEFEAT_HERO (Hero name)" },
  { value: "STORY_DEPLOY", label: "STORY_DEPLOY (Hero name) (System name)" },
  { value: "STORY_DESTROY", label: "STORY_DESTROY (Object name)(System name)(number to destroy)(destroyer)(filter)" },
  { value: "STORY_ELAPSED", label: "STORY_ELAPSED (Seconds)" },
  { value: "STORY_ENTER", label: "STORY_ENTER (System name) (Filter)" },
  { value: "STORY_FLAG", label: "STORY_FLAG (flag name) (flag value)(compare method)" },
  { value: "STORY_FLEET_BOUNCED", label: "STORY_FLEET_BOUNCED (planet name)" },
  { value: "STORY_GENERIC", label: "STORY_GENERIC (generic trigger type)" },
  { value: "STORY_LAND_ON", label: "STORY_LAND_ON (System name) (Filter)" },
  { value: "STORY_LAND_TACTICAL", label: "STORY_LAND_TACTICAL (land tactical plot file name) (system name)" },
  { value: "STORY_LOAD_TACTICAL_MAP", label: "STORY_LOAD_TACTICAL_MAP (planet name) (required hero)(ground/space)" },
  { value: "STORY_LOSE_BATTLES", label: "STORY_LOSE_BATTLES (# of battles) (ground/space/either)" },
  { value: "STORY_MISSION_FAILED", label: "STORY_MISSION_FAILED (xml plot file)" },
  { value: "STORY_MOVE", label: "STORY_MOVE (Hero name) (System name)" },
  { value: "STORY_MOVIE_DONE", label: "STORY_MOVIE_DONE" },
  { value: "STORY_SELECT_PLANET", label: "STORY_SELECT_PLANET (system name)" },
  { value: "STORY_SPACE_TACTICAL", label: "STORY_SPACE_TACTICAL (space tactical plot file name) (system name)" },
  { value: "STORY_SPEECH_DONE", label: "STORY_SPEECH_DONE (speech name)" },
  { value: "STORY_TACTICAL_DESTROY", label: "STORY_TACTICAL_DESTROY (object name) (?) (# destroyed)" },
  { value: "STORY_TECH_LEVEL", label: "STORY_TECH_LEVEL (tech level)" },
  { value: "STORY_TRIGGER", label: "STORY_TRIGGER (no parameters)" },
  { value: "STORY_UNIT_PROXIMITY", label: "STORY_UNIT_PROXIMITY (unit object name) (target object) (max distance)" },
  { value: "STORY_VICTORY", label: "STORY_VICTORY (faction)" },
  { value: "STORY_WIN_BATTLES", label: "STORY_WIN_BATTLES (# of wins) (Filter) – Not yet implemented" },
  { value: "STORY_ZOOM_INTO_PLANET", label: "STORY_ZOOM_INTO_PLANET (system name)" },
  { value: "STORY_ZOOM_OUT_PLANET", label: "STORY_ZOOM_OUT_PLANET (system name)" }
];

const CodeEditorWithLines = ({
  value,
  onChange,
  readOnly,
  error
}: {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  error?: string | null;
}) => {
  return (
    <div className="flex-1 flex flex-col items-stretch relative bg-slate-950 border border-slate-800 rounded mx-1 mb-1 overflow-hidden">
        <div className="flex-1 flex overflow-auto custom-scrollbar">
            {/* Line numbers gutter */}
            <div className="sticky left-0 bg-slate-900 border-r border-slate-800 text-slate-500 text-right text-xs font-mono p-4 pr-3 pt-[16px] select-none z-10 min-w-[3rem]">
                {value.split('\n').map((_, i) => (
                    <div key={i} className="leading-[1.5]">{i + 1}</div>
                ))}
            </div>
            {/* Editor */}
            <div className="flex-1 min-w-max">
                <Editor
                    value={value}
                    onValueChange={v => onChange?.(v)}
                    highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
                    padding={16}
                    readOnly={readOnly}
                    style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        lineHeight: '1.5',
                        minHeight: '100%',
                    }}
                    className={`w-full min-h-[400px] outline-none editor-custom-styles ${readOnly ? 'opacity-80' : ''}`}
                />
            </div>
        </div>
        {error && (
            <div className="absolute bottom-4 right-4 bg-red-900/80 border border-red-500/50 text-red-200 px-3 py-2 rounded text-xs pointer-events-none z-20">
                {error}
            </div>
        )}
    </div>
  );
};

const SingleEventXML = ({ event, onUpdate, editable }: { event: StoryEvent, onUpdate: (newEvt: StoryEvent) => void, editable: boolean }) => {
  const getFormattedXml = () => {
    try {
        const raw = new XMLSerializer().serializeToString(event.el);
        let formatted = '';
        let pad = 0;
        raw.replace(/>\s*</g, '>\n<').split('\n').forEach((node) => {
            if (node.match(/^<\/\w/)) pad -= 1;
            formatted += '  '.repeat(Math.max(0, pad)) + node + '\n';
            if (node.match(/^<\w[^>]*[^\/]>.*$/) && !node.match(/<\/.+>$/)) pad += 1;
        });
        return formatted.trim();
    } catch(e) {
        return "Error loading XML";
    }
  };

  const [value, setValue] = useState(getFormattedXml());
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setValue(getFormattedXml());
    setError(null);
  }, [event.id, editable]);

  const handleChange = (newVal: string) => {
    setValue(newVal);
    try {
        const updatedEvt = updateStoryEventFromXml(newVal, event);
        setError(null);
        onUpdate(updatedEvt);
    } catch (err: any) {
        setError(err.message || "Invalid XML");
    }
  };

  return <CodeEditorWithLines value={value} onChange={editable ? handleChange : undefined} readOnly={!editable} error={error} />;
};

const FullFileXML = ({ doc, events, editable, onUpdateFullDoc }: { doc: XMLDocument, events: StoryEvent[], editable: boolean, onUpdateFullDoc?: (doc: XMLDocument, events: StoryEvent[]) => void }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setValue(serializeXml(doc));
    setError(null);
  }, [doc, editable]);

  const handleChange = (newVal: string) => {
    setValue(newVal);
    try {
      if (!onUpdateFullDoc) return;
      const parsed = parseStoryXml(newVal);
      setError(null);
      onUpdateFullDoc(parsed.doc, parsed.storyEvents);
    } catch (err: any) {
      setError(err.message || "Invalid XML");
    }
  };

  return <CodeEditorWithLines value={value} onChange={editable ? handleChange : undefined} readOnly={!editable} error={error} />;
};

export default function StoryEditor({ initialDoc, initialEvents, fileName, onClose, onError, settings, onUpdateDoc }: StoryEditorProps) {
  const t = useTranslation();
  const [events, setEvents] = useState<StoryEvent[]>(initialEvents);
  const [filteredEvents, setFilteredEvents] = useState<StoryEvent[]>(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(initialEvents.length > 0 ? initialEvents[0].id : null);
  const [viewMode, setViewMode] = useState<'params' | 'xml'>('params');
  const [xmlScope, setXmlScope] = useState<'event' | 'file'>('event');
  const [searchQuery, setSearchQuery] = useState('');
  const fileDownloadAnchorRef = useRef<HTMLAnchorElement>(null);
  
  const [pendingUpload, setPendingUpload] = useState<boolean>(false);
  const [pendingEventName, setPendingEventName] = useState("");

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setFilteredEvents(events);
    } else {
      const lower = q.toLowerCase();
      setFilteredEvents(events.filter(ev => ev.name.toLowerCase().includes(lower)));
    }
  };

  const handleSelectEvent = (id: string) => {
    setSelectedId(id);
  };

  const handleDeleteEvent = (id: string) => {
    const evt = events.find(e => e.id === id);
    if (evt && evt.el.parentNode) {
      evt.el.parentNode.removeChild(evt.el);
    }
    const newEvents = events.filter(e => e.id !== id);
    setEvents(newEvents);
    setFilteredEvents(newEvents.filter(ev => ev.name.toLowerCase().includes(searchQuery.toLowerCase())));
    if (selectedId === id) setSelectedId(null);
  };
  
  const triggerAddEvent = () => {
    setPendingEventName("New_Story_Event");
    setPendingUpload(true);
  };
  
  const confirmEventCreation = () => {
    if (!pendingEventName.trim()) return;
    
    const newEventNode = initialDoc.createElement("Event");
    newEventNode.setAttribute("Name", pendingEventName);
    
    let root = initialDoc.querySelector("Story") || initialDoc.documentElement;
    root.appendChild(newEventNode);
    
    const newEvt: StoryEvent = {
        id: `ev_new_${Date.now()}`,
        el: newEventNode,
        name: pendingEventName,
        eventType: "",
        eventParams: [],
        rewardType: "",
        rewardParams: [],
        prereqs: [],
        storyDialog: "",
        storyChapter: "",
        storyTag: "",
        branch: ""
    };
    
    const updated = [...events, newEvt];
    setEvents(updated);
    if(newEvt.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        setFilteredEvents([...filteredEvents, newEvt]);
    }
    setSelectedId(newEvt.id);
    setPendingUpload(false);
  };

  const handleSave = () => {
    try {
      const xmlString = serializeXml(initialDoc);
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      if (fileDownloadAnchorRef.current) {
        fileDownloadAnchorRef.current.href = url;
        fileDownloadAnchorRef.current.download = fileName || "Story.xml";
        fileDownloadAnchorRef.current.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      onError(err.message);
    }
  };
  
  const handleUpdateEvent = (updated: StoryEvent) => {
    updateStoryEventInDoc(updated);
    const newEvents = events.map(e => e.id === updated.id ? updated : e);
    setEvents(newEvents);
    if(searchQuery) {
        setFilteredEvents(newEvents.filter(ev => ev.name.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
        setFilteredEvents(newEvents);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedId);

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-300 font-sans z-50">
      {/* Header */}
      <div className="h-12 border-b border-indigo-900/50 bg-slate-900/80 flex flex-col md:flex-row items-center justify-between px-4 shrink-0 shadow-md">
        <div className="flex items-center space-x-3 mb-2 md:mb-0">
          <div className="w-6 h-6 bg-indigo-500/20 border border-indigo-500/50 rounded flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
               <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">{t.storyEditor.title}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-xs w-full md:w-auto overflow-x-auto justify-end">
          <span className="text-indigo-400/80 font-mono italic mr-2 truncate max-w-[200px]">{fileName}</span>
          
          <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-mono whitespace-nowrap">
            {events.length} {t.storyEditor.eventsCount}
          </span>
          <a ref={fileDownloadAnchorRef} className="hidden" />

          <button
            onClick={triggerAddEvent}
            className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-indigo-50 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{t.storyEditor.addEventBtn}</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{t.storyEditor.saveBtn}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 px-2 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center space-x-1 whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">{t.storyEditor.closeBtn}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r border-indigo-900/30 bg-slate-900/30 flex flex-col shrink-0">
          <div className="p-3 border-b border-indigo-900/30 bg-slate-900/50 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
              <input 
                type="text" 
                placeholder={t.storyEditor.searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono transition-colors"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredEvents.map(evt => (
              <div 
                key={evt.id}
                onClick={() => handleSelectEvent(evt.id)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
                  selectedId === evt.id 
                    ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300' 
                    : 'bg-slate-950 border-transparent text-slate-400 hover:bg-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <ListTree className={`w-3.5 h-3.5 shrink-0 px-0.5 ${selectedId === evt.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                  <span className="text-xs font-mono truncate select-none leading-none mt-0.5">{evt.name}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-slate-600 font-mono text-[10px] uppercase tracking-widest px-4">
                No events found.
              </div>
            )}
          </div>
        </div>

        {/* Editor Pane */}
        {selectedEvent ? (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Tabs */}
            <div className="flex px-4 pt-4 border-b border-indigo-900/40 gap-2 bg-slate-900/20 shrink-0">
              <button 
                onClick={() => setViewMode('params')}
                className={`px-4 py-2 text-xs font-mono tracking-widest uppercase flex items-center gap-2 border-b-2 transition-colors ${viewMode === 'params' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <Settings2 className="w-4 h-4" /> Parameters
              </button>
              <button 
                onClick={() => setViewMode('xml')}
                className={`px-4 py-2 text-xs font-mono tracking-widest uppercase flex items-center gap-2 border-b-2 transition-colors ${viewMode === 'xml' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <Code className="w-4 h-4" /> XML Source
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950 flex flex-col space-y-6">
              {viewMode === 'params' ? (
                <>
                  <div className="p-5 border border-indigo-900/30 bg-slate-900/40 rounded-sm">
                      <h3 className="text-indigo-300 text-sm font-bold tracking-widest uppercase font-mono mb-4 border-b border-indigo-900/30 pb-2">{t.storyEditor.properties}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Base Info */}
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.name}</label>
                          <input type="text" value={selectedEvent.name} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, name: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-200 outline-none focus:border-indigo-500/50" />
                      </div>
                      
                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.eventType}</label>
                          <select value={selectedEvent.eventType?.toUpperCase() || ""} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, eventType: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-200 outline-none focus:border-indigo-500/50 appearance-none">
                              <option value=""></option>
                              {EVENT_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                              {selectedEvent.eventType && !EVENT_TYPES.some(t => t.value === selectedEvent.eventType.toUpperCase()) && (
                                  <option value={selectedEvent.eventType}>{selectedEvent.eventType}</option>
                              )}
                          </select>
                      </div>

                      <div className="flex flex-col space-y-2">
                          <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">
                              {t.storyEditor.prereq} <span className="text-[9px] text-slate-600 normal-case">(AND logic per line, OR logic across lines)</span>
                          </label>
                          {selectedEvent.prereqs.map((prq, idx) => (
                              <div key={idx} className="flex gap-2">
                                  <input type="text" value={prq} 
                                      placeholder="e.g. Event_A, Event_B"
                                      onChange={(e) => {
                                          const newPrereqs = [...selectedEvent.prereqs];
                                          newPrereqs[idx] = e.target.value;
                                          handleUpdateEvent({ ...selectedEvent, prereqs: newPrereqs });
                                      }}
                                      className="flex-1 bg-slate-950 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-200 outline-none focus:border-indigo-500/50" />
                                  <button onClick={() => {
                                          const newPrereqs = selectedEvent.prereqs.filter((_, i) => i !== idx);
                                          handleUpdateEvent({ ...selectedEvent, prereqs: newPrereqs });
                                      }} 
                                      className="px-2 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded">
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                          ))}
                          <button onClick={() => handleUpdateEvent({ ...selectedEvent, prereqs: [...selectedEvent.prereqs, ""] })}
                              className="self-start text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                              <Plus className="w-3 h-3" /> Add Prerequisite Line (OR)
                          </button>
                      </div>

                      <div>
                          <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.rewardType}</label>
                          <input type="text" value={selectedEvent.rewardType} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, rewardType: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-200 outline-none focus:border-indigo-500/50" />
                      </div>
                  </div>

                  {/* Story Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-indigo-900/20">
                      <div>
                          <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.storyDialog}</label>
                          <input type="text" value={selectedEvent.storyDialog} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, storyDialog: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2 py-1 text-[11px] font-mono text-indigo-100 outline-none focus:border-indigo-500/50" />
                      </div>
                      <div>
                          <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.storyChapter}</label>
                          <input type="text" value={selectedEvent.storyChapter} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, storyChapter: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2 py-1 text-[11px] font-mono text-indigo-100 outline-none focus:border-indigo-500/50" />
                      </div>
                      <div>
                          <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.storyTag}</label>
                          <input type="text" value={selectedEvent.storyTag} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, storyTag: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2 py-1 text-[11px] font-mono text-indigo-100 outline-none focus:border-indigo-500/50" />
                      </div>
                      <div>
                          <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono mb-1">{t.storyEditor.branch}</label>
                          <input type="text" value={selectedEvent.branch} 
                              onChange={(e) => handleUpdateEvent({ ...selectedEvent, branch: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700/50 rounded px-2 py-1 text-[11px] font-mono text-indigo-100 outline-none focus:border-indigo-500/50" />
                      </div>
                  </div>
              </div>

              {/* Event Params */}
              <div className="p-5 border border-amber-900/30 bg-slate-900/40 rounded-sm">
                  <div className="flex justify-between border-b border-amber-900/30 pb-2 mb-4">
                      <h3 className="text-amber-300 text-sm font-bold tracking-widest uppercase font-mono">{t.storyEditor.eventParams}</h3>
                      <button onClick={() => {
                          if (selectedEvent.eventParams.length < 10) {
                              const p = [...selectedEvent.eventParams, ""];
                              handleUpdateEvent({ ...selectedEvent, eventParams: p });
                          }
                      }} className="text-[9px] uppercase text-amber-500 hover:text-amber-300 font-mono tracking-widest px-2 py-0.5 border border-amber-800/50 rounded-sm flex items-center space-x-1">
                          <Plus className="w-2.5 h-2.5" />
                          <span>{t.storyEditor.addParam}</span>
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {selectedEvent.eventParams.map((p, i) => (
                          <div key={i} className="flex flex-col">
                              <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1 text-right">Event_Param{i+1}</label>
                              <div className="flex">
                                <input type="text" value={p} 
                                    onChange={(e) => {
                                        const next = [...selectedEvent.eventParams];
                                        next[i] = e.target.value;
                                        handleUpdateEvent({ ...selectedEvent, eventParams: next });
                                    }}
                                    className="flex-1 bg-slate-950 border border-slate-700/50 rounded-l px-2.5 py-1 text-xs font-mono text-amber-100 outline-none focus:border-amber-500/50" />
                                <button onClick={() => {
                                    const next = [...selectedEvent.eventParams];
                                    next.splice(i, 1);
                                    handleUpdateEvent({ ...selectedEvent, eventParams: next });
                                }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-l-0 border-slate-700/50 rounded-r px-2"><X className="w-3.5 h-3.5" /></button>
                              </div>
                          </div>
                      ))}
                      {selectedEvent.eventParams.length === 0 && <span className="text-[10px] text-slate-600 font-mono italic">No Parameters</span>}
                  </div>
              </div>

               {/* Reward Params */}
               <div className="p-5 border border-emerald-900/30 bg-slate-900/40 rounded-sm">
                  <div className="flex justify-between border-b border-emerald-900/30 pb-2 mb-4">
                      <h3 className="text-emerald-300 text-sm font-bold tracking-widest uppercase font-mono">{t.storyEditor.rewardParams}</h3>
                      <button onClick={() => {
                          if (selectedEvent.rewardParams.length < 10) {
                              const p = [...selectedEvent.rewardParams, ""];
                              handleUpdateEvent({ ...selectedEvent, rewardParams: p });
                          }
                      }} className="text-[9px] uppercase text-emerald-500 hover:text-emerald-300 font-mono tracking-widest px-2 py-0.5 border border-emerald-800/50 rounded-sm flex items-center space-x-1">
                          <Plus className="w-2.5 h-2.5" />
                          <span>{t.storyEditor.addParam}</span>
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {selectedEvent.rewardParams.map((p, i) => (
                          <div key={i} className="flex flex-col">
                              <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1 text-right">Reward_Param{i+1}</label>
                              <div className="flex">
                                <input type="text" value={p} 
                                    onChange={(e) => {
                                        const next = [...selectedEvent.rewardParams];
                                        next[i] = e.target.value;
                                        handleUpdateEvent({ ...selectedEvent, rewardParams: next });
                                    }}
                                    className="flex-1 bg-slate-950 border border-slate-700/50 rounded-l px-2.5 py-1 text-xs font-mono text-emerald-100 outline-none focus:border-emerald-500/50" />
                                <button onClick={() => {
                                    const next = [...selectedEvent.rewardParams];
                                    next.splice(i, 1);
                                    handleUpdateEvent({ ...selectedEvent, rewardParams: next });
                                }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-l-0 border-slate-700/50 rounded-r px-2"><X className="w-3.5 h-3.5" /></button>
                              </div>
                          </div>
                      ))}
                      {selectedEvent.rewardParams.length === 0 && <span className="text-[10px] text-slate-600 font-mono italic">No Parameters</span>}
                  </div>
              </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-stretch pt-2">
                  <div className="flex gap-2 px-2 pb-2 mb-2 border-b border-slate-800/50">
                    <button
                      onClick={() => setXmlScope('event')}
                      className={`px-3 py-1 text-[10px] font-mono tracking-widest uppercase border rounded transition-colors ${xmlScope === 'event' ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300' : 'border-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-900/50'}`}
                    >
                      Event Scope
                    </button>
                    <button
                      onClick={() => setXmlScope('file')}
                      className={`px-3 py-1 text-[10px] font-mono tracking-widest uppercase border rounded transition-colors ${xmlScope === 'file' ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300' : 'border-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-900/50'}`}
                    >
                      Full File Scope
                    </button>
                  </div>
                  
                  {xmlScope === 'event' ? (
                    <SingleEventXML 
                      event={selectedEvent} 
                      editable={settings.storyXmlEditable}
                      onUpdate={(newEvt) => {
                        updateStoryEventInDoc(newEvt);
                        const newEvents = events.map(e => Object.is(e, selectedEvent) ? newEvt : e);
                        const newFiltered = filteredEvents.map(e => Object.is(e, selectedEvent) ? newEvt : e);
                        setEvents(newEvents);
                        setFilteredEvents(newFiltered);
                      }} 
                    />
                  ) : (
                    <FullFileXML
                      doc={initialDoc}
                      events={events}
                      editable={settings.storyXmlEditable}
                      onUpdateFullDoc={(doc, newEvents) => {
                        setEvents(newEvents);
                        setFilteredEvents(newEvents);
                        if (onUpdateDoc) onUpdateDoc(doc, newEvents);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">{t.storyEditor.noEventSelected}</span>
            <div className="w-12 h-12 border-2 border-dashed border-slate-800 rounded mb-3"></div>
          </div>
        )}
      </div>

      {pendingUpload && (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-cyan-800/50 shadow-2xl p-6 rounded-sm w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-slate-100 text-lg font-bold font-mono tracking-widest uppercase">{t.storyEditor.name}</h3>
              <button 
                onClick={() => setPendingUpload(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <input 
                type="text" 
                value={pendingEventName}
                onChange={e => setPendingEventName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500"
                placeholder="New_Story_Event"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setPendingUpload(false)}
                className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded font-mono text-[11px] uppercase tracking-wider font-semibold transition-colors"
              >
                {t.storyEditor.cancelBtn}
              </button>
              <button
                onClick={confirmEventCreation}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded font-mono text-[11px] uppercase tracking-wider font-bold transition-transform active:scale-95"
              >
                {t.storyEditor.createBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
