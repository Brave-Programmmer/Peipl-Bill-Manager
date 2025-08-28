const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const url = require("url");
let mainWindow;
// Function to check if a port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.once("close", () => {
        resolve(true);
      });
      server.close();
    });
    server.on("error", () => {
      resolve(false);
    });
  });
}



// Function to load bill data from file
async function loadBillFromFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const billData = JSON.parse(fileContent);
    return { success: true, data: billData, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
    title: "PEIPL Bill Maker",
    show: false,
  });

  if (app.isPackaged) {
    // Load built Next.js files from /out
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "out", "index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  } else {
    // During dev, connect to Next.js dev server
    mainWindow.loadURL("http://localhost:3000");
  }

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
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
    defaultPath: `bill_${billData.billNumber || "invoice"}_${
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

// Handle opening file from command line
ipcMain.handle("open-file-from-command", async (event, filePath) => {
  return await loadBillFromFile(filePath);
});

// Handle command line arguments for file opening
app.on("open-file", (event, filePath) => {
  event.preventDefault();

  if (mainWindow) {
    mainWindow.webContents.send("open-file-from-command", filePath);
  }
});

// Handle second instance (Windows)
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    // Check if there's a file to open
    const filePath = commandLine.find((arg) => arg.endsWith(".json"));
    if (filePath) {
      mainWindow.webContents.send("open-file-from-command", filePath);
    }
  }
});

// App event handlers
app.whenReady().then(() => {
  // Register handler for all file:// requests
  // protocol.handle("file", (request) => {
  //   let url = request.url.substr(7); // strip file://
  //   const filePath = path.normalize(`${__dirname}/../out/${url}`);

  //   return fs.promises.readFile(filePath);
  // });

  createWindow();
  createMenu();

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
