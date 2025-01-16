// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFile: () => ipcRenderer.invoke('open-file'),  // Ouvre le dialogue de sélection de fichier et retourne le contenu
  saveFile: () => ipcRenderer.invoke('save-file'),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  exportPDF: () => ipcRenderer.invoke('export-pdf'),
  savePDF: (doc) => ipcRenderer.invoke('save-pdf', doc),
  config: {
    defaultMap: ipcRenderer.invoke('load-config', "default.config-map")
  }
});
