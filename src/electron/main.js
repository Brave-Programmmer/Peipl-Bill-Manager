import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();

let mainWindow;
let splash;

function createSplashScreen() {
  splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    icon: path.join(__dirname, '../../src/assets/logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashUrl = isDev
    ? `file://${path.join(__dirname, 'splash.html')}`
    : `file://${path.join(__dirname, '../dist/splash.html')}`;
  
  splash.loadURL(splashUrl);
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Handle file open from second instance command line (last argument)
      const filePath = commandLine.find(arg => arg.endsWith('.json') || arg.endsWith('.peibill') || arg.endsWith('.peiinvoice') || arg.endsWith('.peiplbill'));
      if (filePath) {
        openFile(filePath);
      }
    }
  });

  app.whenReady().then(() => {
    createSplashScreen();
    setTimeout(() => {
      createWindow();
    }, 2000); // Show splash for 2 seconds

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Check for file passed in command line (for first instance)
    const filePath = process.argv.find(arg => arg.endsWith('.json') || arg.endsWith('.peibill') || arg.endsWith('.peiinvoice') || arg.endsWith('.peiplbill'));
    if (filePath) {
      openFile(filePath);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Don't show the window until it's ready
    icon: path.join(__dirname, '../../src/assets/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
    frame: false,
    transparent: false,
    backgroundColor: '#ffffff',
  });

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    if (splash) {
      splash.close();
    }
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Handle file open from OS
const openFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (mainWindow) {
        // Wait for page to finish loading before sending data
        if (mainWindow.webContents.isLoading()) {
          mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.send('open-file', {
              path: filePath,
              content: data
            });
          });
        } else {
          mainWindow.webContents.send('open-file', {
            path: filePath,
            content: data
          });
        }
      }
    } catch (err) {
      console.error('Error opening file:', err);
    }
  }
};

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openFile(filePath);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Helper to extract Financial Year (FY) from path or filename
const extractFyFromPath = (filePath) => {
  const normalizedPath = filePath.toUpperCase().replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  
  // 1. Check for specific month-year folders (priority to the most specific/deepest part of the path)
  // We iterate backwards through path parts to find the most specific one
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];
    
    // Special case: APRIL YYYY in this workflow refers to the previous FY's final bills
    const aprilMatch = part.match(/APRIL\s+(20)?(\d{2})/);
    if (aprilMatch) {
      const yearShort = parseInt(aprilMatch[2]);
      const prevYearShort = (yearShort - 1).toString().padStart(2, '0');
      const currYearShort = yearShort.toString().padStart(2, '0');
      const fy = `${prevYearShort}${currYearShort}`;
      console.log(`FY Extraction: Found APRIL special case in "${part}" -> ${fy}`);
      return fy;
    }

    // Check for other months (standard mapping)
    // Jan-Mar YYYY -> (YYYY-1)-YY
    const earlyMonthsMatch = part.match(/(JANUARY|FEBRUARY|MARCH|JAN|FEB|MAR)\s+(20)?(\d{2})/);
    if (earlyMonthsMatch) {
      const yearShort = parseInt(earlyMonthsMatch[3]);
      const prevYearShort = (yearShort - 1).toString().padStart(2, '0');
      const currYearShort = yearShort.toString().padStart(2, '0');
      return `${prevYearShort}${currYearShort}`;
    }

    // May-Dec YYYY -> YY-(YY+1)
    const lateMonthsMatch = part.match(/(MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(20)?(\d{2})/);
    if (lateMonthsMatch) {
      const yearShort = parseInt(lateMonthsMatch[3]);
      const nextYearShort = (yearShort + 1).toString().padStart(2, '0');
      const currYearShort = yearShort.toString().padStart(2, '0');
      return `${currYearShort}${nextYearShort}`;
    }

    // 2. Standard FY format: 2025-26 or 25-26
    const fyMatch = part.match(/(\d{2})?(\d{2})-(\d{2})/);
    if (fyMatch) {
      const fy = `${fyMatch[2]}${fyMatch[3]}`;
      return fy;
    }
  }

  return 'Unknown';
};

const scanDirectoryRecursive = (dirPath, fileList = []) => {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanDirectoryRecursive(filePath, fileList);
    } else if (file.endsWith('.json') || file.endsWith('.peibill') || file.endsWith('.peiinvoice')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        // Basic validation to ensure it's an invoice
        if (data.billNumber && data.customerName) {
          // 1. Extract FY from path
          let fy = extractFyFromPath(filePath);

          // 2. Extract FY from bill number (e.g. PEIPLCH2526/22 -> 2526)
          const billNoFyMatch = data.billNumber.match(/(\d{4})/);
          if (billNoFyMatch) {
            fy = billNoFyMatch[1];
          }

          fileList.push({
            path: filePath,
            folder: path.dirname(filePath),
            fileName: file,
            content: data,
            mtime: stat.mtime,
            fy
          });
        }
      } catch (err) {
        // Skip invalid JSON files
      }
    }
  });
  return fileList;
};

ipcMain.handle('scan-invoices', async (event, paths) => {
  const allInvoices = [];
  const validPaths = Array.isArray(paths) ? paths : [];
  
  validPaths.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      try {
        scanDirectoryRecursive(dirPath, allInvoices);
      } catch (err) {
        console.error(`Error scanning path ${dirPath}:`, err);
      }
    }
  });
  
  return allInvoices;
});

const scanGemPdfsRecursive = (dirPath, gemList = []) => {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanGemPdfsRecursive(filePath, gemList);
    } else if (file.toLowerCase().endsWith('.pdf')) {
      const fileName = file.toUpperCase();
      
      // IGNORE files with "SUPPORT" in their name
      if (fileName.includes('SUPPORT')) return;

      // Extract numeric part (e.g. "06.pdf" -> "06")
      const match = fileName.match(/(\d+)/);
      if (match) {
        const billNumber = match[1];
        
        // Extract FY from path using the new robust helper
        const fy = extractFyFromPath(filePath);

        gemList.push({
          path: filePath,
          fileName: file,
          billNumber,
          fy,
          mtime: stat.mtime
        });
      }
    }
  });
  return gemList;
};

ipcMain.handle('scan-gem-pdfs', async (event, paths) => {
  const allGemPdfs = [];
  const validPaths = Array.isArray(paths) ? paths : [];
  
  validPaths.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      try {
        scanGemPdfsRecursive(dirPath, allGemPdfs);
      } catch (err) {
        console.error(`Error scanning GeM path ${dirPath}:`, err);
      }
    }
  });
  
  return allGemPdfs;
});

ipcMain.handle('window-minimize', (event) => {
  console.log('Main process: window-minimize');
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', (event) => {
  console.log('Main process: window-maximize');
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.handle('window-close', (event) => {
  console.log('Main process: window-close');
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Invoice', extensions: ['json'] }, { name: 'PEI Bill Files', extensions: ['peibill', 'peiinvoice', 'peiplbill'] }],
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  const content = fs.readFileSync(result.filePaths[0], 'utf8');
  return {
    path: result.filePaths[0],
    content: JSON.parse(content)
  };
});

ipcMain.handle('save-file', async (event, { content, filePath }) => {
  let targetPath = filePath;
  
  if (!targetPath) {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'JSON Invoice', extensions: ['json'] }, { name: 'PEI Bill File', extensions: ['peibill', 'peiinvoice'] }],
      defaultPath: `Invoice_${content.billNumber || 'New'}.json`
    });
    
    if (result.canceled || !result.filePath) {
      return null;
    }
    targetPath = result.filePath;
  }
  
  fs.writeFileSync(targetPath, JSON.stringify(content, null, 2));
  return targetPath;
});

// Global variable to hold print data temporarily
let printDataBuffer = null;

ipcMain.handle('print-to-pdf', async (event, data) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  printDataBuffer = data;
  
  const printWin = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const url = isDev
    ? `http://localhost:5173/#/print-export`
    : `file://${path.join(__dirname, '../../dist/index.html')}#/print-export`;

  printWin.loadURL(url);

  return new Promise((resolve, reject) => {
    printWin.webContents.once('did-finish-load', async () => {
      try {
        // Deterministic readiness check: Fonts and Images
        await printWin.webContents.executeJavaScript(`
          new Promise(async (resolve) => {
            await document.fonts.ready;
            const images = Array.from(document.images);
            await Promise.all(images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(r => {
                img.onload = r;
                img.onerror = r;
              });
            }));
            // Extra tick for React layout stabilization
            setTimeout(resolve, 500);
          });
        `);

        const result = await dialog.showSaveDialog(parentWin, {
          title: 'Save Invoice as PDF',
          defaultPath: `Invoice_${data.invoice.billNumber.replace(/[\\/]/g, '_')}.pdf`,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (result.canceled || !result.filePath) {
          printWin.close();
          printDataBuffer = null;
          resolve(null);
          return;
        }

        const pdfData = await printWin.webContents.printToPDF({
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          pageSize: 'A4',
          printBackground: true,
          displayHeaderFooter: false
        });

        fs.writeFileSync(result.filePath, pdfData);
        printWin.close();
        printDataBuffer = null;
        resolve(result.filePath);
      } catch (err) {
        printWin.close();
        printDataBuffer = null;
        reject(err);
      }
    });
  });
});

ipcMain.handle('print-window', async (event, data) => {
  printDataBuffer = data;
  
  const printWin = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const url = isDev
    ? `http://localhost:5173/#/print-export`
    : `file://${path.join(__dirname, '../../dist/index.html')}#/print-export`;

  printWin.loadURL(url);

  return new Promise((resolve, reject) => {
    printWin.webContents.once('did-finish-load', async () => {
      try {
        await printWin.webContents.executeJavaScript(`
          new Promise(async (resolve) => {
            await document.fonts.ready;
            const images = Array.from(document.images);
            await Promise.all(images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(r => {
                img.onload = r;
                img.onerror = r;
              });
            }));
            setTimeout(resolve, 500);
          });
        `);

        printWin.webContents.print({
          silent: false,
          printBackground: true,
          deviceName: ''
        }, () => {
          printWin.close();
          printDataBuffer = null;
          resolve(true);
        });
      } catch (err) {
        printWin.close();
        printDataBuffer = null;
        reject(err);
      }
    });
  });
});

ipcMain.on('get-print-data', (event) => {
  event.returnValue = printDataBuffer;
});
