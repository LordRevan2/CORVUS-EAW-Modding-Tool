import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import { Save, X, Download, Code, Sparkles, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n';

interface XmlEditorProps {
  initialContent: string;
  fileName: string;
  onClose: () => void;
  onSave: (content: string, fileName: string) => void;
}

import { EAW_TAGS } from '../data/eawTags';

const OLD_TAG_DEFS: Record<string, string> = {
    'SpaceUnit': 'Defines a unit that operates in space.',
    'LandUnit': 'Defines a unit that operates on land.',
    'DeathStar': 'Defines a Death Star station.',
    'Behavior': 'Defines the behavior of a unit.',
    'Ability': 'Defines a special ability for a unit.',
    'Weapon': 'Defines a weapon component.',
    'Projectile': 'Defines a projectile fired by a weapon.',
    'Unit': 'Generic unit definition.',
    'TacticalContent': 'Content related to tactical battles.',
    'GalacticContent': 'Content related to galactic map.',
    'Faction': 'Defines a game faction.',
    'UnitType': 'Type categorization for units.',
    'HardPoints': 'Targetable systems on a larger unit.',
    'Targeting_Max_Attack_Distance': 'Max distance for weapons',
    'Affiliation': 'Faction that owns this unit.',
    'Armor_Type': 'Defines vulnerability to different damage types.',
};

export const EAW_TAG_DEFINITIONS = EAW_TAGS.map(tag => ({
    name: tag,
    desc: OLD_TAG_DEFS[tag] || 'EAW XML Tag'
}));

import xmlFormat from 'xml-formatter';

const formatXml = (xmlStr: string) => {
  try {
    return xmlFormat(xmlStr, {
      indentation: '    ',
      collapseContent: true,
      lineSeparator: '\n'
    });
  } catch (error) {
    console.error('Failed to format XML:', error);
    return xmlStr; // Returning original on error
  }
};

const CodeEditorWithLines = ({
  value,
  onChange,
  readOnly,
  errorLine = null,
}: {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  errorLine?: number | null;
}) => {
  return (
    <div className="flex-1 flex flex-col items-stretch relative bg-slate-950 border border-slate-800 rounded ml-2 mb-1 overflow-hidden min-h-0">
        <div className="flex-1 flex overflow-auto custom-scrollbar h-full relative">
            {/* Line numbers gutter */}
            <div className="bg-slate-900 border-r border-slate-800 text-slate-500 text-right text-[12px] font-mono p-4 pr-3 pt-[16px] select-none sticky left-0 z-20 min-w-[3.5rem]" style={{ lineHeight: '18px' }}>
                {value.split('\n').map((_, i) => (
                    <div key={i} className={`h-[18px] ${errorLine === i + 1 ? 'text-red-400 font-bold bg-red-900/30 -mx-3 px-3' : ''}`}>
                        {i + 1}
                    </div>
                ))}
            </div>
            {/* Editor */}
            <div className="flex-1 h-full relative z-10" style={{ minWidth: 'max-content' }}>
                {errorLine !== null && (
                    <div 
                        className="absolute left-0 right-0 pointer-events-none bg-red-500/10 border-b border-red-500/50 z-0 underline decoration-red-500 decoration-wavy"
                        style={{ top: 16 + ((errorLine - 1) * 18), height: 18 }}
                    />
                )}
                <Editor
                    textareaId="xml-editor-textarea"
                    value={value}
                    onValueChange={v => onChange?.(v)}
                    highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
                    padding={16}
                    insertSpaces={false}
                    tabSize={4}
                    readOnly={readOnly}
                    style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        lineHeight: '18px',
                        minHeight: '100%',
                        whiteSpace: 'pre',
                        position: 'relative',
                        zIndex: 1,
                        background: 'transparent'
                    }}
                    className={`min-h-full outline-none editor-custom-styles ${readOnly ? 'opacity-80' : ''}`}
                />
            </div>
        </div>
    </div>
  );
};

export default function XmlEditor({ initialContent, fileName, onClose, onSave }: XmlEditorProps) {
  const t = useTranslation();
  const [content, setContent] = useState(initialContent);
  const [tagSearch, setTagSearch] = useState('');
  const [tagPage, setTagPage] = useState(1);
  const [validationError, setValidationError] = useState<{ message: string, line: number | null } | null>(null);

  const filteredTags = EAW_TAG_DEFINITIONS.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(filteredTags.length / PAGE_SIZE);
  const paginatedTags = filteredTags.slice((tagPage - 1) * PAGE_SIZE, tagPage * PAGE_SIZE);

  useEffect(() => {
    if (!content.trim()) {
        setValidationError(null);
        return;
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "application/xml");
    const errorNode = xmlDoc.querySelector("parsererror");
    if (errorNode) {
      const text = errorNode.textContent || "Invalid XML structure";
      const lineMatch = text.match(/line\s+(\d+)/i);
      if (lineMatch) {
         setValidationError({ message: `Invalid XML structure at line ${lineMatch[1]}`, line: parseInt(lineMatch[1], 10) });
      } else {
         setValidationError({ message: "Invalid XML structure", line: null });
      }
    } else {
      setValidationError(null);
    }
  }, [content]);

  const handleSave = () => {
    onSave(content, fileName);
  };

  const handleFormat = () => {
    const formatted = formatXml(content);
    setContent(formatted);
  };

  const insertTag = (tag: string) => {
    const textarea = document.getElementById('xml-editor-textarea') as HTMLTextAreaElement;
    const insertion = `<${tag}>\n\t\n</${tag}>`;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + insertion + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + `<${tag}>\n\t`.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }, 0);
    } else {
      const newContent = content + (content.endsWith('\n') ? '' : '\n') + insertion;
      setContent(newContent);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-950 text-slate-300">
      <div className="flex-none p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-rose-400 font-bold uppercase tracking-widest text-xs flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${validationError ? 'bg-red-500' : 'bg-rose-500'} animate-pulse`}></span>
              <span>{t.home.xmlTitle || "Raw XML Editor"}</span>
            </h2>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-sm truncate" title={fileName}>
              {fileName}
            </div>
            {validationError ? (
                <div className="text-[10px] text-red-500 font-bold mt-1 bg-red-500/10 inline-block px-1.5 py-0.5 rounded">{validationError.message}</div>
            ) : (
                <div className="text-[10px] text-green-500 font-bold mt-1 bg-green-500/10 inline-block px-1.5 py-0.5 rounded">Valid XML format</div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setContent('')}
            className="px-2 py-1.5 border border-slate-700/60 hover:bg-slate-800 hover:text-red-400 text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-1.5 rounded-sm"
            title="Clear content"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFormat}
            className="px-2 py-1.5 border border-slate-700/60 hover:bg-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-1.5 rounded-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Format</span>
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-2 rounded-sm ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.storyEditor?.saveBtn || "Save / Export"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center"
            title={t.storyEditor?.closeBtn || "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex p-2 min-h-0 relative">
         <div className="w-56 bg-slate-900 border border-slate-800 rounded p-2 overflow-y-auto flex flex-col">
            <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest flex items-center justify-between">
                <span>EaW Tags</span>
                <span className="text-[9px] text-slate-600 font-normal normal-case">{EAW_TAG_DEFINITIONS.length} total</span>
            </h3>
            
            <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={e => { setTagSearch(e.target.value); setTagPage(1); }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded mb-3 outline-none focus:border-rose-500/50"
            />

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {paginatedTags.map(tag => (
                        <div key={tag.name} className="relative group">
                            <button onClick={() => insertTag(tag.name)} className="block w-full text-left text-[11px] bg-slate-800 hover:bg-slate-700 p-1.5 rounded mb-1 text-slate-300 font-mono border border-transparent hover:border-slate-600 transition-colors">
                                {tag.name}
                            </button>
                            <div className="absolute left-full top-0 ml-2 w-48 bg-slate-800 border border-slate-600 text-slate-200 p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl shadow-black/50">
                                {tag.desc}
                            </div>
                        </div>
                    ))}
                    {filteredTags.length === 0 && (
                        <div className="text-[10px] text-slate-500 text-center mt-2">
                            No tags found.
                        </div>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px]">
                        <button 
                            onClick={() => setTagPage(p => Math.max(1, p - 1))}
                            disabled={tagPage === 1}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
                        >
                            Prev
                        </button>
                        <span className="text-slate-500 font-mono">
                            {tagPage} / {totalPages}
                        </span>
                        <button 
                            onClick={() => setTagPage(p => Math.min(totalPages, p + 1))}
                            disabled={tagPage === totalPages}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
         </div>
         <CodeEditorWithLines value={content} onChange={setContent} errorLine={validationError?.line} />
      </div>
    </div>
  );
}
