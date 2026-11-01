const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('oath', {
  pickFiles: () => ipcRenderer.invoke('pick-files'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  expand: paths => ipcRenderer.invoke('expand', paths),
  pathOf: f => { try { return webUtils.getPathForFile(f); } catch (e) { return ''; } }
});
