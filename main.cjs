const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuración opcional para AutoUpdater
autoUpdater.autoDownload = false; // Descarga manual a través de un botón
autoUpdater.autoInstallOnAppQuit = true;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "CORVUS // EAW Modding Tool",
    autoHideMenuBar: true, // Oculta la barra de menú predeterminada de Windows
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // En producción (cuando creas el .exe), carga el index.html ya compilado
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    // En desarrollo local
    win.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(() => {
  createWindow();

  // Comprobar actualizaciones automáticamente al iniciar
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
});

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
  autoUpdater.checkForUpdates();
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
