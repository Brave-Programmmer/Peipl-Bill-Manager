const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");
const { spawn } = require("child_process");
let mainWindow;
let splashWindow;

// Handle deleting a bill file from GST submitted folder
ipcMain.handle("delete-bill-from-gst-submitted", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: "File path is invalid or does not exist" };
    }
    fs.unlinkSync(filePath);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting bill from GST submitted folder:", error);
    return { success: false, error: error.message };
  }
});
let splashCreatedAt = 0;

const BILL_FILE_EXTENSIONS = [".json", ".peiplbill"];
const isBillFilePath = (filePath = "") => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase();
  return BILL_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Helper: Read JSON file and send to renderer as string
function sendJsonToRenderer(filePath) {
  if (!filePath) {
    console.error("[File Association] No file path provided");
    return;
  }

  console.log("[File Association] sendJsonToRenderer called with:", filePath);

  // Allow any bill JSON/PEIPL files regardless of naming convention
  if (!isBillFilePath(filePath)) {
    const fileName = path.basename(filePath);
    console.error("[File Association] Invalid file type:", fileName);
    mainWindow?.webContents.send("open-file-error", {
      error:
        "Unsupported file type. Please select a .json or .peiplbill bill file.",
      filePath,
    });
    return;
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("[File Association] Error reading file:", err.message);
      mainWindow?.webContents.send("open-file-error", {
        error: err.message,
        filePath,
      });
    } else {
      try {
        // Validate JSON
        const billData = JSON.parse(data);

        // Validate it's a bill file with required fields
        if (!billData.billNumber || !billData.items) {
          console.error("[File Association] Invalid bill structure - missing billNumber or items");
          mainWindow?.webContents.send("open-file-error", {
            error:
              "Invalid bill file format. Missing required fields (billNumber or items).",
            filePath,
          });
          return;
        }

        console.log("[File Association] Successfully parsed bill, sending to renderer:", {
          filePath,
          billNumber: billData.billNumber,
          itemsCount: billData.items.length,
        });

        // Send as parsed JSON object with data and filePath
        mainWindow?.webContents.send("open-file", { data: billData, filePath });
      } catch (parseError) {
        console.error("[File Association] JSON parse error:", parseError.message);
        mainWindow?.webContents.send("open-file-error", {
          error: `Invalid JSON file: ${parseError.message}`,
          filePath,
        });
      }
    }
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: true,
    fullscreenable: false,
    skipTaskbar: true,
  });

  splashCreatedAt = Date.now();
  splashWindow.center();

  splashWindow.loadFile(path.join(__dirname, "splash.html")).catch((err) => {
    console.error("Failed to load splash screen:", err);
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    frame: false, // Remove default titlebar to use custom titlebar
    titleBarStyle: "hidden", // For macOS compatibility
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/logo.png"),
    title: "PEIPL Bill Assistant",
    show: false,
  });

  // Always open billing app directly
  if (app.isPackaged) {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "out", "index.html"),
        protocol: "file:",
        slashes: true,
      }),
    );
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }

  // Listen for selection from launcher page
  ipcMain.on("launch-app-section", (event, section) => {
    if (section === "billing") {
      if (app.isPackaged) {
        mainWindow.loadURL(
          url.format({
            pathname: path.join(__dirname, "out", "index.html"),
            protocol: "file:",
            slashes: true,
          }),
        );
      } else {
        mainWindow.loadURL("http://localhost:3000");
      }
    } else if (section === "hrdoc") {
      // Example: open a placeholder HR Doc Settings page
      mainWindow.loadFile(path.join(__dirname, "hrdoc.html"));
    }
    // Add more sections here as needed
  });

  // Show window when ready and close splash
  mainWindow.once("ready-to-show", () => {
    const MIN_SPLASH_TIME = 3200; // ms - keep splash visible for a bit over 3s
    const elapsed = Date.now() - splashCreatedAt;
    const remaining = Math.max(MIN_SPLASH_TIME - elapsed, 0);

    const showMain = () => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    };

    if (remaining > 0) {
      setTimeout(showMain, remaining);
    } else {
      showMain();
    }
  });

  // Listen for maximize/unmaximize events
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-unmaximized");
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Create menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Bill",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            mainWindow.webContents.send("open-bill-file");
          },
        },
        {
          label: "Save Bill As...",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow.webContents.send("save-bill-file");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for window controls (custom titlebar)
ipcMain.handle("window-minimize", async () => {
  if (mainWindow) {
    mainWindow.minimize();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("window-maximize", async () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("window-close", async () => {
  if (mainWindow) {
    mainWindow.close();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("window-is-maximized", async () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// IPC handlers for file operations
ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "PEIPL Bill Files", extensions: ["peiplbill", "json"] },
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, "utf8");
      const billData = JSON.parse(fileContent);
      return { success: true, data: billData, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "No file selected" };
});

ipcMain.handle("save-file-dialog", async (event, billData) => {
  try {
    // Remove validation checks - allow saving with any data
    // Only ensure basic structure exists
    if (!billData || typeof billData !== 'object') {
      return { success: false, error: "Invalid data format" };
    }

    const sanitizedBillNumber = (billData.billNumber || "invoice")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: "PEIPL Bill Files", extensions: ["peiplbill"] },
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      defaultPath: `bill_${sanitizedBillNumber}_${
        new Date().toISOString().split("T")[0]
      }.peiplbill`, // Default to .peiplbill extension
    });

    if (!result.canceled && result.filePath) {
      try {
        // Ensure directory exists
        const dir = path.dirname(result.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Validate billData before writing
        if (!billData) {
          return { success: false, error: "No bill data provided" };
        }

        // Write file with proper formatting
        const fileContent = JSON.stringify(billData, null, 2);
        fs.writeFileSync(result.filePath, fileContent, 'utf8');
        
        return { 
          success: true, 
          filePath: result.filePath,
          fileName: path.basename(result.filePath)
        };
      } catch (writeError) {
        console.error("File write error:", writeError);
        return { success: false, error: `Failed to write file: ${writeError.message}` };
      }
    }
    return { success: false, error: "Save dialog was cancelled" };
  } catch (error) {
    console.error("Save dialog error:", error);
    return { success: false, error: `Save operation failed: ${error.message}` };
  }
});

// Handle opening file from command line (manual trigger from renderer)
ipcMain.handle("open-file-from-command", async (event, filePath) => {
  // Read and send file contents to renderer
  if (mainWindow && filePath) {
    sendJsonToRenderer(filePath);
    return { success: true };
  }
  return { success: false, error: "No file path provided" };
});

// Handle file association setup
ipcMain.handle("setup-file-associations", async () => {
  try {
    // Only on Windows
    if (process.platform !== "win32") {
      return {
        success: false,
        error: "File associations are only supported on Windows.",
      };
    }

    const { exec } = require("child_process");

    // Get the current executable path
    // In packaged app, process.execPath is the app executable
    // In development, it might be node.exe, but we can use app.getPath('exe')
    let exePath = process.execPath;
    
    // Try to get the actual app executable path if available
    try {
      // app.getPath('exe') is the actual executable of the current application
      if (app && app.getPath) {
        const appExePath = app.getPath("exe");
        if (appExePath && fs.existsSync(appExePath)) {
          exePath = appExePath;
          console.log("Using app executable path:", exePath);
        }
      }
    } catch (e) {
      console.warn("Could not get app path, using process.execPath:", e.message);
    }

    // Escape quotes in path for command line
    const escapedPath = exePath.replace(/"/g, '\\"');

    // Use Windows commands to set up file associations for bill files
    // Create a custom file type for .peiplbill and .json extensions
    const commands = [
      `ftype PEIPLBillMaker="${exePath}" "%%1"`,
      `assoc .peiplbill=PEIPLBillMaker`,
      `assoc .json=PEIPLBillMaker`,
    ];

    return new Promise((resolve) => {
      let completed = 0;
      let errors = [];
      let successCount = 0;

      commands.forEach((command, index) => {
        exec(command, { shell: true }, (error, stdout, stderr) => {
          completed++;

          if (error) {
            console.error(`Command ${index + 1} failed:`, command);
            console.error(`  Error: ${error.message}`);
            errors.push(`Command ${index + 1}: ${error.message}`);
          } else {
            console.log(`Command ${index + 1} succeeded:`, command);
            successCount++;
          }

          // When all commands are done, return result
          if (completed === commands.length) {
            if (errors.length === commands.length) {
              // All failed
              resolve({
                success: false,
                error: `All file association commands failed. Please run as Administrator. ${errors.join("; ")}`,
              });
            } else if (errors.length > 0) {
              // Some failed
              resolve({
                success: true,
                message: `File associations partially set up (${successCount}/${commands.length} succeeded). Some commands may require Administrator privileges.`,
              });
            } else {
              // All succeeded
              resolve({
                success: true,
                message: "File associations set up successfully!",
              });
            }
          }
        });
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (completed < commands.length) {
          resolve({
            success: false,
            error: "File association setup timed out. Please try again or run as Administrator.",
          });
        }
      }, 15000);
    });
  } catch (error) {
    console.error("Error setting up file associations:", error);
    return { success: false, error: error.message };
  }
});

// Handle opening file association settings
ipcMain.handle("open-file-association-settings", async () => {
  try {
    if (process.platform !== "win32") {
      return {
        success: false,
        error: "File association settings are only available on Windows.",
      };
    }

    const { exec } = require("child_process");

    // Open Windows file association settings for .json files
    exec("rundll32.exe shell32.dll,OpenAs_RunDLL .json", (error) => {
      if (error) {
        console.error("Error opening file association settings:", error.message);
      } else {
        console.log("File association settings opened successfully");
      }
    });

    return { success: true, message: "Opening file association settings..." };
  } catch (error) {
    console.error("Error opening file association settings:", error);
    return { success: false, error: error.message };
  }
});

// Handle getting temp directory
ipcMain.handle("get-temp-dir", async () => {
  try {
    const os = require("os");
    const tempDir = path.join(os.tmpdir(), "peipl-bills");
    
    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    return tempDir;
  } catch (error) {
    console.error("Error getting temp directory:", error);
    return null;
  }
});

// Handle saving PDF file
ipcMain.handle("save-pdf-file", async (event, dirPath, filename, base64Data) => {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Save file
    const fullPath = path.join(dirPath, filename);
    fs.writeFileSync(fullPath, buffer);
    
    return fullPath;
  } catch (error) {
    console.error("Error saving PDF file:", error);
    throw error;
  }
});

// Helper function to get app data directory
function getAppDataPath() {
  const userDataPath = app.getPath("userData");
  const dataPath = path.join(userDataPath, "bill-tracking");
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  return dataPath;
}

// Handle selecting a folder
ipcMain.handle("select-bill-folder", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Folder Containing Bills",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, folderPath: result.filePaths[0] };
    }
    return { success: false, error: "No folder selected" };
  } catch (error) {
    console.error("Error selecting folder:", error);
    return { success: false, error: error.message };
  }
});

// Handle scanning folder structure (get subfolders recursively)
ipcMain.handle("scan-folder-structure", async (event, folderPath) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      return { success: false, error: "Folder path is invalid" };
    }

    // Helper function to recursively scan folders and build tree structure
    const scanFolderRecursive = (dirPath, relativePath = "") => {
      const folder = {
        name: relativePath || path.basename(dirPath),
        path: dirPath,
        subfolders: [],
      };

      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const entryPath = path.join(dirPath, entry.name);
            const subRelativePath = relativePath 
              ? `${relativePath}/${entry.name}` 
              : entry.name;
            
            const subfolder = scanFolderRecursive(entryPath, subRelativePath);
            folder.subfolders.push(subfolder);
          }
        }
      } catch (err) {
        console.error(`Error scanning directory ${dirPath}:`, err);
      }

      return folder;
    };

    const rootFolder = scanFolderRecursive(folderPath);
    
    // Flatten the tree structure for backward compatibility
    // Also return the tree structure for nested display
    const flattenFolders = (folder, flatList = []) => {
      flatList.push({
        name: folder.name,
        path: folder.path,
        fullPath: folder.name, // For selection tracking
      });
      
      if (folder.subfolders && folder.subfolders.length > 0) {
        folder.subfolders.forEach((subfolder) => {
          flattenFolders(subfolder, flatList);
        });
      }
      
      return flatList;
    };

    const flatSubfolders = flattenFolders(rootFolder);

    return { 
      success: true, 
      subfolders: flatSubfolders,
      treeStructure: rootFolder.subfolders, // Return tree for nested display
    };
  } catch (error) {
    console.error("Error scanning folder:", error);
    return { success: false, error: error.message };
  }
});

// Handle saving folder configuration (selected subfolders)
ipcMain.handle("save-folder-config", async (event, config) => {
  try {
    const dataPath = getAppDataPath();
    const configPath = path.join(dataPath, "folder-config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving folder config:", error);
    return { success: false, error: error.message };
  }
});

// Handle loading folder configuration
ipcMain.handle("load-folder-config", async () => {
  try {
    const dataPath = getAppDataPath();
    const configPath = path.join(dataPath, "folder-config.json");
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return { success: true, config };
    }
    return { success: true, config: null };
  } catch (error) {
    console.error("Error loading folder config:", error);
    return { success: false, error: error.message };
  }
});

// Handle saving bill tracking data (monthly pending/sent)
ipcMain.handle("save-bill-tracking", async (event, trackingData) => {
  try {
    const dataPath = getAppDataPath();
    const trackingPath = path.join(dataPath, "bill-tracking.json");
    fs.writeFileSync(trackingPath, JSON.stringify(trackingData, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving bill tracking:", error);
    return { success: false, error: error.message };
  }
});

// Handle loading bill tracking data
ipcMain.handle("load-bill-tracking", async () => {
  try {
    const dataPath = getAppDataPath();
    const trackingPath = path.join(dataPath, "bill-tracking.json");
    
    if (fs.existsSync(trackingPath)) {
      const tracking = JSON.parse(fs.readFileSync(trackingPath, "utf8"));
      return { success: true, tracking };
    }
    return { success: true, tracking: {} };
  } catch (error) {
    console.error("Error loading bill tracking:", error);
    return { success: false, error: error.message };
  }
});

// Handle scanning bills in selected subfolders (returns folder structure)
// Recursively scans all nested subfolders
ipcMain.handle("scan-bills-in-folders", async (event, subfolderPaths) => {
  try {
    const folders = [];
    const billExtensions = [
      ".json",
      ".pdf",
      ".docx",
      ".doc",
      ".jpg",
      ".jpeg",
      ".peiplbill",
      ".peipl",
    ];

    // Helper function to recursively scan a directory and collect files
    const scanDirectoryRecursive = (dirPath, folderName, files = []) => {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectoryRecursive(entryPath, folderName, files);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (billExtensions.includes(ext)) {
              const stats = fs.statSync(entryPath);
              
              files.push({
                name: entry.name,
                path: entryPath,
                size: stats.size,
                modifiedDate: stats.mtime.toISOString(),
                extension: ext,
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning directory ${dirPath}:`, err);
      }
    };

    for (const subfolderPath of subfolderPaths) {
      if (!fs.existsSync(subfolderPath)) continue;

      try {
        const files = [];
        // Recursively scan all files in this folder and all nested subfolders
        scanDirectoryRecursive(subfolderPath, path.basename(subfolderPath), files);

        // Always add the folder, even if it has no files (so user can see all selected folders)
        folders.push({
          name: path.basename(subfolderPath),
          path: subfolderPath,
          files: files,
        });
      } catch (err) {
        console.error(`Error scanning folder ${subfolderPath}:`, err);
      }
    }

    return { success: true, folders };
  } catch (error) {
    console.error("Error scanning bills:", error);
    return { success: false, error: error.message };
  }
});

// Handle scanning GST submitted folder and matching file names
// Structure: rootFolder -> year folders (e.g., "2025-26") -> submission folders (e.g., "MAY 2025 BILLS SUBMITTED IN JUNE 2025") -> files
ipcMain.handle("scan-gst-submitted-folder", async (event, gstSubmittedFolderPath, billFilePaths) => {
  try {
    if (!gstSubmittedFolderPath || !fs.existsSync(gstSubmittedFolderPath)) {
      return { success: false, error: "GST submitted folder path is invalid" };
    }

    if (!Array.isArray(billFilePaths) || billFilePaths.length === 0) {
      return { success: true, matches: [] };
    }

    const billExtensions = [
      ".json",
      ".pdf",
      ".docx",
      ".doc",
      ".jpg",
      ".jpeg",
      ".peiplbill",
      ".peipl",
    ];

    const matches = [];
    const billFileNames = new Set(billFilePaths.map((filePath) => path.basename(filePath)));

    // Helper function to extract submission month from folder name
    // Example: "MAY 2025 BILLS SUBMITTED IN JUNE 2025" -> "2025-06"
    const extractSubmissionMonth = (folderName) => {
      // Look for pattern "SUBMITTED IN MONTH YEAR" or "IN MONTH YEAR"
      const regex = /(?:SUBMITTED\s+IN|IN)\s+(\w+)\s+(\d{4})/i;
      const match = folderName.match(regex);
      if (match) {
        const monthName = match[1].toUpperCase();
        const year = match[2];
        const monthMap = {
          JANUARY: "01", FEBRUARY: "02", MARCH: "03", APRIL: "04", MAY: "05", JUNE: "06",
          JULY: "07", AUGUST: "08", SEPTEMBER: "09", OCTOBER: "10", NOVEMBER: "11", DECEMBER: "12",
          JAN: "01", FEB: "02", MAR: "03", APR: "04", JUN: "06",
          JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
        };
        const month = monthMap[monthName];
        if (month) {
          return `${year}-${month}`;
        }
      }
      return null;
    };

    // Helper function to extract submission month from folder path hierarchy
    // Checks parent folders at multiple levels
    const extractSubmissionMonthFromPath = (filePath, rootPath) => {
      let currentPath = path.dirname(filePath);
      const rootDir = path.resolve(rootPath);
      
      // Check up to 3 levels of parent folders
      for (let i = 0; i < 3; i++) {
        if (!currentPath || currentPath === rootDir || currentPath === path.dirname(rootDir)) {
          break;
        }
        
        const folderName = path.basename(currentPath);
        const submissionMonth = extractSubmissionMonth(folderName);
        
        if (submissionMonth) {
          return { submissionMonth, parentFolder: folderName };
        }
        
        currentPath = path.dirname(currentPath);
      }
      
      return { submissionMonth: null, parentFolder: path.basename(path.dirname(filePath)) };
    };

    // Helper function to recursively scan for files in all nested subfolders
    const scanDirectory = (dirPath, depth = 0) => {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Recursively scan all nested subdirectories
            scanDirectory(entryPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (billExtensions.includes(ext)) {
              const fileName = entry.name;
              
              // Check if this file name matches any tracked bill
              if (billFileNames.has(fileName)) {
                // Try to extract submission month from parent folder hierarchy
                const { submissionMonth, parentFolder } = extractSubmissionMonthFromPath(entryPath, gstSubmittedFolderPath);
                
                matches.push({
                  fileName: fileName,
                  filePath: entryPath,
                  submissionMonth: submissionMonth,
                  parentFolder: parentFolder,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning directory ${dirPath}:`, err);
      }
    };

    // Start scanning from the root GST submitted folder
    scanDirectory(gstSubmittedFolderPath);

    return { success: true, matches };
  } catch (error) {
    console.error("Error scanning GST submitted folder:", error);
    return { success: false, error: error.message };
  }
});

// Handle copying bill file to GST submitted folder with proper month-wise structure
// Structure: rootFolder -> year folders (e.g., "2025-26") -> submission folders (e.g., "MAY 2025 BILLS SUBMITTED IN JUNE 2025") -> files
ipcMain.handle("copy-bill-to-gst-submitted", async (event, sourceFilePath, gstSubmittedFolderPath, submissionMonth) => {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
      return { success: false, error: "Source file path is invalid" };
    }

    if (!gstSubmittedFolderPath || !fs.existsSync(gstSubmittedFolderPath)) {
      return { success: false, error: "GST submitted folder path is invalid" };
    }

    if (!submissionMonth || !/^\d{4}-\d{2}$/.test(submissionMonth)) {
      return { success: false, error: "Invalid submission month format (expected YYYY-MM)" };
    }

    // Parse submission month
    const [submissionYear, submissionMonthNum] = submissionMonth.split("-");
    const submissionYearInt = parseInt(submissionYear);
    const submissionMonthInt = parseInt(submissionMonthNum);

    // Determine financial year (e.g., "2025-26" for April 2025 to March 2026)
    // Financial year starts from April (month 4)
    let financialYearStart = submissionYearInt;
    if (submissionMonthInt >= 4) {
      // April to December: same year start
      financialYearStart = submissionYearInt;
    } else {
      // January to March: previous year start
      financialYearStart = submissionYearInt - 1;
    }
    const financialYearEnd = financialYearStart + 1;
    const yearFolderName = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;

    // Get the month name for the submission month
    const monthNames = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const submissionMonthName = monthNames[submissionMonthInt - 1];

    // Try to determine bill month from file modified date or use submission month as fallback
    const fileStats = fs.statSync(sourceFilePath);
    const fileDate = fileStats.mtime;
    const billMonth = fileDate.getMonth() + 1; // 1-12
    const billYear = fileDate.getFullYear();
    const billMonthName = monthNames[billMonth - 1];

    // Create submission folder name: "MAY 2025 BILLS SUBMITTED IN JUNE 2025"
    const submissionFolderName = `${billMonthName} ${billYear} BILLS SUBMITTED IN ${submissionMonthName} ${submissionYearInt}`;

    // Create folder structure
    const yearFolderPath = path.join(gstSubmittedFolderPath, yearFolderName);
    const submissionFolderPath = path.join(yearFolderPath, submissionFolderName);

    // Ensure directories exist
    if (!fs.existsSync(yearFolderPath)) {
      fs.mkdirSync(yearFolderPath, { recursive: true });
    }
    if (!fs.existsSync(submissionFolderPath)) {
      fs.mkdirSync(submissionFolderPath, { recursive: true });
    }

    // Get file name
    const fileName = path.basename(sourceFilePath);
    const destinationPath = path.join(submissionFolderPath, fileName);

    // Check if file already exists
    if (fs.existsSync(destinationPath)) {
      // Add a timestamp suffix to avoid overwriting
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const newFileName = `${nameWithoutExt}_${timestamp}${ext}`;
      const newDestinationPath = path.join(submissionFolderPath, newFileName);
      fs.copyFileSync(sourceFilePath, newDestinationPath);
      return { 
        success: true, 
        destinationPath: newDestinationPath,
        message: "File copied (renamed to avoid overwrite)"
      };
    } else {
      // Copy file
      fs.copyFileSync(sourceFilePath, destinationPath);
      return { 
        success: true, 
        destinationPath: destinationPath,
        message: "File copied successfully"
      };
    }
  } catch (error) {
    console.error("Error copying bill to GST submitted folder:", error);
    return { success: false, error: error.message };
  }
  
});

// macOS: open-file event
let pendingFilePath = null;
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  console.log("[File Association] macOS open-file event:", filePath);
  pendingFilePath = filePath;
  if (mainWindow) {
    sendJsonToRenderer(filePath);
  }
});

// Handle second instance (Windows/Linux)
app.on("second-instance", (event, argv, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    // Check if there's a file to open (bill_*.json or .peiplbill)
    const fileArg = argv.find((arg) => isBillFilePath(arg));
    if (fileArg) {
      console.log("[File Association] Second instance detected, opening file:", fileArg);
      sendJsonToRenderer(fileArg);
    }
  }
});

// App event handlers

app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
  createMenu();

  // Windows/Linux: check argv for file path (bill_*.json or .peiplbill)
  const fileArg = process.argv.find((arg) => isBillFilePath(arg));
  if (fileArg) {
    // Wait for the window to be fully ready before sending file
    // Increased timeout to ensure React listeners are registered
    setTimeout(() => {
      console.log("[File Association] Initial instance detected, loading:", fileArg);
      sendJsonToRenderer(fileArg);
    }, 2500);
  }

  // macOS: handle pending file after window ready
  if (pendingFilePath) {
    console.log("[File Association] Processing pending macOS file:", pendingFilePath);
    sendJsonToRenderer(pendingFilePath);
    pendingFilePath = null;
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle security warnings
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
  });
});
