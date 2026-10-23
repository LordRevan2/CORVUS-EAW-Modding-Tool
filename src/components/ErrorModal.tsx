import React from 'react';
import { AlertOctagon, X, Terminal } from 'lucide-react';

export type AppErrorObj = {
  code: string;
  message: string;
  details?: string;
};

export type AppErrorType = AppErrorObj | string | null;

interface ErrorModalProps {
  error: AppErrorType;
  onClose: () => void;
}

export default function ErrorModal({ error, onClose }: ErrorModalProps) {
  if (!error) return null;

  const errObj: AppErrorObj = typeof error === 'string' 
    ? { code: 'ERR_GENERIC', message: error, details: '' }
    : error;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-red-950/40 border-b border-red-900/50 flex items-center justify-between p-3 shrink-0">
           <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              <h2 className="text-red-400 font-bold text-xs uppercase tracking-widest">Exception Detected</h2>
           </div>
           <button 
             onClick={onClose}
             className="text-slate-400 hover:text-white transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col space-y-4">
           
           <div className="flex flex-col space-y-1 pb-4 border-b border-slate-800">
             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Error Code</span>
             <div className="font-mono text-red-400 text-lg bg-red-950/20 px-3 py-1.5 rounded w-fit border border-red-900/30 font-bold">
               {errObj.code}
             </div>
           </div>

           <div className="flex flex-col space-y-1">
             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Message</span>
             <p className="text-slate-200 text-sm leading-relaxed">
               {errObj.message}
             </p>
           </div>
           
           {errObj.details && (
             <div className="flex flex-col space-y-1 mt-2">
               <span className="flex items-center space-x-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                 <Terminal className="w-3 h-3" />
                 <span>Technical Details</span>
               </span>
               <pre className="mt-1 bg-slate-950 p-3 rounded text-xs font-mono text-slate-400 overflow-x-auto border border-slate-800 custom-scrollbar max-h-40">
                 {errObj.details}
               </pre>
             </div>
           )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex justify-end">
           <button 
             onClick={onClose}
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center space-x-2 rounded-sm"
           >
             <span>Acknowledge</span>
           </button>
        </div>

      </div>
    </div>
  );
}
