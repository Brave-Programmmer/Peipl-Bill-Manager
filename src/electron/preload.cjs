const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electron', {
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanInvoices: (paths) => ipcRenderer.invoke('scan-invoices', paths),
  scanGemPdfs: (paths) => ipcRenderer.invoke('scan-gem-pdfs', paths),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  onFileOpen: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('open-file', subscription);
    return () => ipcRenderer.removeListener('open-file', subscription);
  },
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  getPrintData: () => ipcRenderer.sendSync('get-print-data'),
  printToPDF: (data) => ipcRenderer.invoke('print-to-pdf', data),
  printWindow: (data) => ipcRenderer.invoke('print-window', data),
});
