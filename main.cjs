const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuración opcional para AutoUpdater
autoUpdater.autoDownload = false; // Descarga manual a través de un botón
autoUpdater.autoInstallOnAppQuit = true;

let win;

// Prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  function createWindow() {
    const iconPath = path.join(__dirname, app.isPackaged ? 'dist' : 'public', 'icon.ico');

    win = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 768,
      title: "CORVUS // EAW Modding Tool",
      icon: iconPath,
      backgroundColor: '#0f172a',
      autoHideMenuBar: true,
      show: false, // No mostrar hasta que esté listo (prevenir parpadeo blanco)
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    if (app.isPackaged) {
      win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      win.loadURL('http://localhost:3000').catch(() => {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    win.once('ready-to-show', () => {
      win.show();
    });
  }

  app.whenReady().then(() => {
    createWindow();

    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('AutoUpdater omitido o sin conexión:', err.message);
      });
    }
  });
}

// --- Eventos de electron-updater ---
autoUpdater.on('checking-for-update', () => {
  if (win) win.webContents.send('updater-message', { status: 'checking', text: 'Buscando actualizaciones...' });
});
autoUpdater.on('update-available', (info) => {
  if (win) win.webContents.send('updater-message', { status: 'available', text: 'Actualización disponible.', version: info.version });
});
autoUpdater.on('update-not-available', (info) => {
  if (win) win.webContents.send('updater-message', { status: 'not-available', text: 'Tu versión es la más reciente.' });
});
autoUpdater.on('error', (err) => {
  if (win) win.webContents.send('updater-message', { status: 'error', text: 'Error al actualizar. ' + err.message });
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Descargando: ' + Math.round(progressObj.percent) + '%';
  if (win) win.webContents.send('updater-message', { status: 'downloading', text: log_message, percent: progressObj.percent });
});
autoUpdater.on('update-downloaded', (info) => {
  if (win) win.webContents.send('updater-message', { status: 'downloaded', text: 'Actualización descargada. Reinicia para instalar.' });
});

// --- IPC IPCMain -> Renderer ---
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates().catch((err) => {
    if (win) win.webContents.send('updater-message', { status: 'error', text: 'Error al buscar actualizaciones: ' + err.message });
  });
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate().catch((err) => {
    if (win) win.webContents.send('updater-message', { status: 'error', text: 'Error al descargar actualización: ' + err.message });
  });
});

ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
