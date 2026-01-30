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
  onOpenFile: (callback) =>
    ipcRenderer.on("open-file", (event, payload) => callback(payload)),
  onOpenFileError: (callback) =>
    ipcRenderer.on("open-file-error", (event, payload) => callback(payload)),

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // File association setup
  setupFileAssociations: () => ipcRenderer.invoke("setup-file-associations"),
  openFileAssociationSettings: () =>
    ipcRenderer.invoke("open-file-association-settings"),

  // Debug - check if methods exist
  checkAPI: () => ({
    setupFileAssociations: typeof ipcRenderer.invoke === "function",
    openFileAssociationSettings: typeof ipcRenderer.invoke === "function",
  }),

  // Window controls for custom titlebar
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  onMaximize: (callback) => {
    ipcRenderer.on("window-maximized", callback);
  },
  onUnmaximize: (callback) => {
    ipcRenderer.on("window-unmaximized", callback);
  },

 
  // Bill folder tracking
  selectBillFolder: () => ipcRenderer.invoke("select-bill-folder"),
  scanFolderStructure: (folderPath) =>
    ipcRenderer.invoke("scan-folder-structure", folderPath),
  saveFolderConfig: (config) =>
    ipcRenderer.invoke("save-folder-config", config),
  loadFolderConfig: () => ipcRenderer.invoke("load-folder-config"),
  saveBillTracking: (trackingData) =>
    ipcRenderer.invoke("save-bill-tracking", trackingData),
  loadBillTracking: () => ipcRenderer.invoke("load-bill-tracking"),
  scanBillsInFolders: (subfolderPaths) =>
    ipcRenderer.invoke("scan-bills-in-folders", subfolderPaths),
  scanGstSubmittedFolder: (gstSubmittedFolderPath, billFilePaths) =>
    ipcRenderer.invoke("scan-gst-submitted-folder", gstSubmittedFolderPath, billFilePaths),
  copyBillToGstSubmitted: (sourceFilePath, gstSubmittedFolderPath, submissionMonth) =>
    ipcRenderer.invoke("copy-bill-to-gst-submitted", sourceFilePath, gstSubmittedFolderPath, submissionMonth),

  // Delete bill from GST submitted folder
  deleteBillFromGstSubmitted: (filePath) =>
    ipcRenderer.invoke("delete-bill-from-gst-submitted", filePath),
});
