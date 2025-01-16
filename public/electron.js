// main.js
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from "url";
// import { autoUpdater } from "electron-updater";
import path from 'path';
// import isDev from 'electron-is-dev';
import XLSX from 'xlsx';
// import * as puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
const isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false;


function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 800,
    frame: process.platform === 'win32' ? false : true, // Enlève le cadre pour une fenêtre sans bordure
    resizable: true, // Pour désactiver le redimensionnement
    webPreferences: {
      preload: path.join(__dirname, "..", "build", 'preload.cjs'),  // Ensure path is correct
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
      webSecurity: false, // Permet le chargement des fichiers locaux
    },
  });

  win.loadURL(
    // `file://${path.join(__dirname, "..", "build", "index.html")}`
    isDev
      ? 'http://localhost:3000' // Dev mode: charger React depuis le serveur de développement
      : `file://${path.join(__dirname, "..", "build", "index.html")}` // Prod mode: charger le build de React
  );
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('minimize', () => win.minimize());
ipcMain.on('maximize', () => {
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});
ipcMain.on('close', () => win.close());

ipcMain.handle('open-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
  });
  if (!filePaths.length) return null;
  const filePath = filePaths[0];
  const fileName = path.basename(filePath); // Récupère uniquement le nom du fichier

  const workbook = XLSX.readFile(filePaths[0]);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return {fileName, fileData: XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) };
});

ipcMain.handle('save-file', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Enregistrer le PDF',
    defaultPath: 'Carte_Departements.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  return result;
});

// ipcMain.handle('export-pdf', async () => {
//   // Utilisez Puppeteer pour générer le PDF sans la div "excel"
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Chargez la même URL que celle de l'application Electron
//   await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

//   // Cachez l'élément div.excel
//   await page.evaluate(() => {
//     const excelElement = document.querySelector('.excel');
//     if (excelElement) {
//       excelElement.style.display = 'none';
//     }
//   });

//   // Génère le PDF
//   const pdfBuffer = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//   });

//   await browser.close();
//   return pdfBuffer;
// });

ipcMain.handle('save-pdf', async (event, doc) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Enregistrer le PDF',
    defaultPath: 'Carte_France.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (!canceled && filePath) {
    const pdfStream = fs.createWriteStream(filePath);

    doc.pipe(pdfStream);
    doc.end();

    return filePath;
  } else {
    return null; // Sauvegarde annulée
  }
});

ipcMain.handle('load-config', async (event, file) => {
  try {
    const filePath = path.join(path.resolve('public'), "config", `${file}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const configurationFile = JSON.parse(data);

    return configurationFile;
  } catch {
    return null
  }
});