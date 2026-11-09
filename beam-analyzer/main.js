/**
 * Structural Beam Analysis: SFD & BMD Diagnostics
 * Electron Main Process - Native Desktop Application
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow = null;

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1024,
    minHeight: 700,
    title: 'Structural Beam Analysis — SFD & BMD Diagnostics Platform',
    backgroundColor: '#0a0f1d',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Setup Custom Menu
  setupMenu();

  // Load the web application
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show gracefully when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Print / Save Report (PDF)',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload Diagnostics',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow && mainWindow.webContents.reloadIgnoringCache()
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen (F11)',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        {
          label: 'Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Engineering Presets',
      submenu: [
        {
          label: 'Double Overhang (3 Point Loads + UDL)',
          click: () => mainWindow && mainWindow.webContents.executeJavaScript('if (window.loadPreset) window.loadPreset("double-overhang");')
        },
        {
          label: 'Single Overhang Cantilever Tip',
          click: () => mainWindow && mainWindow.webContents.executeJavaScript('if (window.loadPreset) window.loadPreset("single-overhang");')
        },
        {
          label: 'Simply Supported Center Load',
          click: () => mainWindow && mainWindow.webContents.executeJavaScript('if (window.loadPreset) window.loadPreset("simply-supported");')
        },
        {
          label: 'Pure Cantilever Beam',
          click: () => mainWindow && mainWindow.webContents.executeJavaScript('if (window.loadPreset) window.loadPreset("cantilever");')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Codebase Documentation',
          click: () => {
            const docPath = path.join(__dirname, 'code_documentation.html');
            shell.openPath(docPath);
          }
        },
        {
          label: 'About Beam Diagnostics CAD',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Beam Diagnostics CAD',
              message: 'Structural Beam Analysis: SFD & BMD Diagnostics Platform',
              detail: 'Version 2.5.0\nProfessional Civil & Mechanical Engineering Software\nFeatures: 2,000-Point High Precision Solver, Exact Step Jumps, Real-time Canvas Rendering, Section Modulus & Safety Factor Diagnostics.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
