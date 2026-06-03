import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-lua';
import { Save, X, Download, Wand2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { LUA_COMMANDS } from '../data/luaCommands';
import { LUA_SNIPPETS } from '../data/luaSnippets';
import luaparse from 'luaparse';
import { formatText } from 'lua-fmt';

interface LuaEditorProps {
  initialContent: string;
  fileName: string;
  onClose: () => void;
  onSave: (content: string, fileName: string) => void;
}

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
    <div className="flex-1 flex flex-col items-stretch relative bg-slate-950 border border-slate-800 rounded mx-1 mb-1 overflow-hidden min-h-0">
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
                    textareaId="lua-editor-textarea"
                    value={value}
                    onValueChange={v => onChange?.(v)}
                    highlight={code => Prism.highlight(code, Prism.languages.lua, 'lua')}
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
                    className={`min-h-full outline-none lua-editor-styles ${readOnly ? 'opacity-80' : ''}`}
                />
            </div>
        </div>
    </div>
  );
};

export default function LuaEditor({ initialContent, fileName, onClose, onSave }: LuaEditorProps) {
  const t = useTranslation();
  const [content, setContent] = useState(initialContent);
  const [commandSearch, setCommandSearch] = useState('');
  const [commandPage, setCommandPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'commands' | 'snippets'>('commands');
  const [validationError, setValidationError] = useState<{ message: string, line: number | null } | null>(null);

  useEffect(() => {
    if (!content.trim()) {
      setValidationError(null);
      return;
    }
    try {
      luaparse.parse(content);
      setValidationError(null);
    } catch (e: any) {
      if (e.line) {
        setValidationError({ message: e.message, line: e.line });
      } else {
        setValidationError({ message: e.message || "Syntax error", line: null });
      }
    }
  }, [content]);

  const filteredCommands = LUA_COMMANDS.filter(cmd => cmd.name.toLowerCase().includes(commandSearch.toLowerCase()));
  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(filteredCommands.length / PAGE_SIZE);
  const paginatedCommands = filteredCommands.slice((commandPage - 1) * PAGE_SIZE, commandPage * PAGE_SIZE);

  const handleSave = () => {
    onSave(content, fileName);
  };

  const handleFormat = () => {
    try {
      const formatted = formatText(content, {
        lineWidth: 120,
        indentCount: 4,
        quotemark: 'double'
      });
      setContent(formatted);
    } catch (e: any) {
        setValidationError({ message: e.message || "Failed to format, syntax error likely", line: e.line || null });
    }
  };

  const insertCommand = (cmdStr: string) => {
    const textarea = document.getElementById('lua-editor-textarea') as HTMLTextAreaElement;
    const insertion = cmdStr;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + insertion + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + insertion.length;
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
      }, 0);
    } else {
      setContent(content + '\n' + insertion);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-950 text-slate-300">
      <div className="flex-none p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-yellow-400 font-bold uppercase tracking-widest text-xs flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${validationError ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`}></span>
              <span>{t.home?.luaTitle || "Raw LUA Editor"}</span>
            </h2>
            <div className="flex items-center space-x-3 mt-0.5">
                <div className="text-[10px] text-slate-500 font-mono max-w-sm truncate" title={fileName}>
                {fileName}
                </div>
                {validationError ? (
                    <div className="text-[10px] text-red-500 font-bold bg-red-500/10 inline-block px-1.5 py-0.5 rounded mr-2">{validationError.message}</div>
                ) : (
                    <div className="text-[10px] text-green-500 font-bold bg-green-500/10 inline-block px-1.5 py-0.5 rounded mr-2">Valid LUA syntax</div>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleFormat}
            disabled={!!validationError}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Format</span>
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-2 rounded-sm"
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
         <div className="w-56 bg-slate-900 border border-slate-800 rounded mx-1 mb-1 p-2 flex flex-col relative z-20 overflow-hidden shrink-0">
             <div className="flex border-b border-slate-800 mb-3">
                 <button
                     className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'commands' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
                     onClick={() => setActiveTab('commands')}
                 >
                     Commands
                 </button>
                 <button
                     className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'snippets' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
                     onClick={() => setActiveTab('snippets')}
                 >
                     Snippets
                 </button>
             </div>
            
            {activeTab === 'commands' ? (
                <>
                    <input
                        type="text"
                        placeholder="Search commands..."
                        value={commandSearch}
                        onChange={e => { setCommandSearch(e.target.value); setCommandPage(1); }}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded mb-3 outline-none focus:border-yellow-500/50"
                    />

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {paginatedCommands.map((cmd, idx) => (
                                <div key={`${cmd.name}-${idx}`} className="relative group/cmd">
                                    <button onClick={() => insertCommand(cmd.name)} className="block w-full text-left text-[11px] bg-slate-800 hover:bg-slate-700 p-1.5 rounded mb-1 text-slate-300 font-mono border border-transparent hover:border-slate-600 transition-colors break-words">
                                        {cmd.name}
                                    </button>
                                    <div className="absolute left-full top-0 ml-2 w-64 bg-slate-800 border border-slate-600 text-slate-200 p-2 rounded text-xs opacity-0 group-hover/cmd:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl shadow-black/50 invisible group-hover/cmd:visible">
                                        {cmd.desc}
                                    </div>
                                </div>
                            ))}
                            {filteredCommands.length === 0 && (
                                <div className="text-[10px] text-slate-500 text-center mt-2">
                                    No commands found.
                                </div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[10px]">
                                <button 
                                    onClick={() => setCommandPage(p => Math.max(1, p - 1))}
                                    disabled={commandPage === 1}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
                                >
                                    Prev
                                </button>
                                <span className="text-slate-500 font-mono">
                                    {commandPage} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCommandPage(p => Math.min(totalPages, p + 1))}
                                    disabled={commandPage === totalPages}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {LUA_SNIPPETS.map((snippet, idx) => (
                        <div key={idx} className="relative group/snippet mb-2">
                            <button 
                                onClick={() => insertCommand(snippet.code)} 
                                className="block w-full text-left text-[11px] bg-slate-800 hover:bg-slate-700 p-2 rounded border border-transparent hover:border-slate-600 transition-colors"
                            >
                                <div className="font-bold text-yellow-400 mb-1">{snippet.name}</div>
                                <div className="text-slate-400 text-[10px] leading-tight">{snippet.description}</div>
                            </button>
                        </div>
                    ))}
                </div>
            )}
         </div>
         <CodeEditorWithLines value={content} onChange={setContent} errorLine={validationError?.line} />
      </div>
    </div>
  );
}
