import React, { useEffect, useState } from 'react';
import { DownloadCloud, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { useTranslation, useLanguage } from '../i18n';

export default function UpdaterUI() {
  const t = useTranslation();
  const ln = useLanguage();
  const [status, setStatus] = useState<string>('idle'); // idle, checking, available, not-available, downloading, downloaded, error
  const [message, setMessage] = useState<string>('');
  const [percent, setPercent] = useState<number>(0);
  const [newVersion, setNewVersion] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  useEffect(() => {
    // Solo en entorno de Electron
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        if (!ipcRenderer) return;

        const handleUpdaterMessage = (event: any, data: any) => {
          setStatus(data.status);
          if (data.status === 'error' && data.text) {
             setErrorText(data.text);
          } else {
             setErrorText('');
          }
          if (data.percent !== undefined) setPercent(data.percent);
          if (data.version !== undefined) setNewVersion(data.version);
          
          if (data.status === 'not-available' || data.status === 'error') {
            setTimeout(() => setStatus('idle'), 4000);
          }
        };

        ipcRenderer.on('updater-message', handleUpdaterMessage);

        return () => {
          ipcRenderer.removeListener('updater-message', handleUpdaterMessage);
        };
      } catch (e) {
        console.warn("Electron IPC not available");
      }
    }
  }, []);

  const checkForUpdates = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('check-for-updates');
      setStatus('checking');
    }
  };

  const downloadUpdate = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('download-update');
      setStatus('downloading');
    }
  };

  const quitAndInstall = () => {
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('quit-and-install');
    }
  };

  if (status === 'idle') {
    // Optionally return null or a manual check button
    return null;
  }
  
  const getDisplayMessage = () => {
     if (status === 'checking') return ln === 'es' ? 'Buscando actualizaciones...' : 'Checking for updates...';
     if (status === 'available') return ln === 'es' ? 'Actualización disponible.' : 'Update available.';
     if (status === 'not-available') return ln === 'es' ? 'Tu versión es la más reciente.' : 'Your version is up to date.';
     if (status === 'downloading') return `${t.updater?.downloading} ${Math.round(percent)}%`;
     if (status === 'downloaded') return ln === 'es' ? 'Actualización descargada. Reinicia para instalar.' : 'Update downloaded. Restart to install.';
     if (status === 'error') return (ln === 'es' ? 'Error al actualizar.' : 'Error updating.') + ' ' + errorText;
     return '';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-cyan-800 shadow-xl rounded-md p-4 z-50 animate-in fade-in slide-in-from-bottom-4 w-72">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {status === 'checking' && <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />}
          {status === 'available' && <DownloadCloud className="w-5 h-5 text-amber-400" />}
          {status === 'not-available' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {status === 'downloading' && <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />}
          {status === 'downloaded' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
          <h3 className="text-sm font-bold font-mono tracking-widest uppercase text-slate-200">
            {status === 'available' ? t.updater?.updateAvailable : t.updater?.updater}
          </h3>
          <button 
             className="ml-auto text-slate-500 hover:text-slate-300"
             onClick={() => setStatus('idle')}
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 font-mono leading-tight">{getDisplayMessage()}</p>

        {status === 'available' && (
          <button 
            onClick={downloadUpdate}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono uppercase text-xs tracking-wider py-2 rounded transition-colors"
          >
            {t.updater?.downloadBtn}{newVersion}
          </button>
        )}

        {status === 'downloading' && (
          <div className="w-full bg-slate-800 rounded-full h-2 mt-1 overflow-hidden">
            <div className="bg-cyan-500 h-2 transition-all duration-300" style={{ width: `${Math.round(percent)}%` }}></div>
          </div>
        )}

        {status === 'downloaded' && (
          <button 
            onClick={quitAndInstall}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono uppercase text-xs tracking-wider py-2 rounded transition-colors"
          >
            {t.updater?.restartBtn}
          </button>
        )}
      </div>
    </div>
  );
}
