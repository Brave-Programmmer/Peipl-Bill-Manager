const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");
let mainWindow;

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
  if (!filePath) return;

  // Allow any bill JSON/PEIPL files regardless of naming convention
  if (!isBillFilePath(filePath)) {
    const fileName = path.basename(filePath);
    mainWindow?.webContents.send("open-file-error", {
      error:
        "Unsupported file type. Please select a .json or .peiplbill bill file.",
      filePath,
    });
    return;
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
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
          mainWindow?.webContents.send("open-file-error", {
            error:
              "Invalid bill file format. Missing required fields (billNumber or items).",
            filePath,
          });
          return;
        }

        mainWindow?.webContents.send("open-file", { data, filePath });
      } catch (parseError) {
        mainWindow?.webContents.send("open-file-error", {
          error: `Invalid JSON file: ${parseError.message}`,
          filePath,
        });
      }
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/logo.png"),
    title: "PEIPL Launcher",
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
  const { ipcMain } = require("electron");
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

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
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
    }.json`,
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, JSON.stringify(billData, null, 2));
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "No file path selected" };
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
    const { exec } = require("child_process");
    const path = require("path");

    return new Promise((resolve) => {
      // Get the current executable path
      const exePath = process.execPath;

      // Use Windows commands to set up file associations for bill_*.json files only
      // Note: Windows doesn't support pattern-based associations directly,
      // so we create a custom file type for .peiplbill extension
      const commands = [
        `ftype PEIPLBillMaker="${exePath}" "%1"`,
        `assoc .peiplbill=PEIPLBillMaker`,
        `assoc .json=PEIPLBillMaker`,
      ];

      let completed = 0;
      let hasError = false;

      commands.forEach((command) => {
        exec(command, (error, stdout, stderr) => {
          completed++;

          if (error) {
            console.error(`Command failed: ${command}`, error);
            hasError = true;
          }

          if (completed === commands.length) {
            if (hasError) {
              resolve({
                success: false,
                error:
                  "Failed to set up file associations. Please try manual setup.",
              });
            } else {
              resolve({
                success: true,
                message: "File associations set up successfully!",
              });
            }
          }
        });
      });
    });
  } catch (error) {
    console.error("Error setting up file associations:", error);
    return { success: false, error: error.message };
  }
});

// Handle opening file association settings
ipcMain.handle("open-file-association-settings", async () => {
  try {
    const { exec } = require("child_process");

    // Open Windows file association settings
    exec("rundll32.exe shell32.dll,OpenAs_RunDLL .json", (error) => {
      if (error) {
        console.error("Error opening file association settings:", error);
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error opening file association settings:", error);
    return { success: false, error: error.message };
  }
});

// macOS: open-file event
let pendingFilePath = null;
app.on("open-file", (event, filePath) => {
  event.preventDefault();
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
      sendJsonToRenderer(fileArg);
    }
  }
});

// App event handlers

app.whenReady().then(() => {
  createWindow();
  createMenu();

  // Windows/Linux: check argv for file path (bill_*.json or .peiplbill)
  const fileArg = process.argv.find((arg) => isBillFilePath(arg));
  if (fileArg) {
    // Wait a bit for the window to be ready
    setTimeout(() => {
      sendJsonToRenderer(fileArg);
    }, 1000);
  }

  // macOS: handle pending file after window ready
  if (pendingFilePath) {
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
