const { contextBridge, ipcRenderer } = require("electron");

// Expose protected  methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  openFile: () => ipcRenderer.invoke("open-file-dialog"),
  saveFile: (billData) => ipcRenderer.invoke("save-file-dialog", billData),
  openFileFromCommand: (filePath) =>
    ipcRenderer.invoke("open-file-from-command", filePath),

  // Menu events
  onOpenBillFile: (callback) => {
    ipcRenderer.on("open-bill-file", callback);
  },
  onSaveBillFile: (callback) => {
    ipcRenderer.on("save-bill-file", callback);
  },

  // Listen for file association open events
  onOpenFile: (callback) => ipcRenderer.on('open-file', (event, payload) => callback(payload)),
  onOpenFileError: (callback) => ipcRenderer.on('open-file-error', (event, payload) => callback(payload)),

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // File association setup
  setupFileAssociations: () => ipcRenderer.invoke("setup-file-associations"),
  openFileAssociationSettings: () => ipcRenderer.invoke("open-file-association-settings"),
});
