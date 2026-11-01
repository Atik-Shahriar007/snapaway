const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('snapAwayNativeCamera', {
  status: () => ipcRenderer.invoke('native-camera:status'),
  start: (options) => ipcRenderer.invoke('native-camera:start', options),
  stop: () => ipcRenderer.invoke('native-camera:stop')
});
