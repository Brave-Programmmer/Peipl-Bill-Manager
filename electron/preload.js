const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
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
  onOpenFileFromCommand: (callback) => {
    ipcRenderer.on("open-file-from-command", callback);
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
