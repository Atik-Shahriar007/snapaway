const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('node:path');
const { createNativeCameraAdapter } = require('./native-camera/adapter.cjs');

let mainWindow;
let adapter;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'SnapAway',
    backgroundColor: '#05060a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'extension', 'studio.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });
  adapter = createNativeCameraAdapter(process.platform);
  ipcMain.handle('native-camera:status', () => adapter.status());
  ipcMain.handle('native-camera:start', (_event, options) => adapter.start(options));
  ipcMain.handle('native-camera:stop', () => adapter.stop());
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
