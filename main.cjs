const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');

const APP_URL = (process.env.UGC21_APP_URL || 'https://ugc21admin.vercel.app/').trim();
const APP_HOST = new URL(APP_URL).host;
let mainWindow;
let updateCheckStarted = false;

function showUpdateMessage(title, message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  dialog.showMessageBox(mainWindow, { type: 'info', title, message, buttons: ['حسناً'] });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 650,
    show: false,
    title: 'UGC21',
    autoHideMenuBar: true,
    backgroundColor: '#0b1020',
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    try {
      const target = new URL(targetUrl);
      if (target.host !== APP_HOST && target.protocol !== 'file:') {
        event.preventDefault();
        if (target.protocol === 'https:' || target.protocol === 'http:') shell.openExternal(targetUrl);
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.loadURL(APP_URL).catch((error) => {
    dialog.showErrorBox('تعذر فتح UGC21', `لم نتمكن من تحميل الموقع:\n${APP_URL}\n\n${error.message}`);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function configureUpdater() {
  if (!app.isPackaged || updateCheckStarted) return;
  updateCheckStarted = true;
  autoUpdater.autoDownload = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on('update-available', async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'تحديث UGC21 متاح',
      message: `يتوفر إصدار جديد (${info.version}). هل تريد تنزيله الآن؟`,
      buttons: ['تنزيل التحديث', 'لاحقاً'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) autoUpdater.downloadUpdate();
  });
  autoUpdater.on('update-not-available', () => {});
  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle(`UGC21 — تنزيل التحديث ${Math.round(progress.percent)}%`);
    }
  });
  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'التحديث جاهز',
      message: 'تم تنزيل تحديث UGC21. أعد تشغيل التطبيق لتثبيته.',
      buttons: ['إعادة التشغيل والتحديث', 'لاحقاً'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) autoUpdater.quitAndInstall();
    else if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setTitle('UGC21');
  });
  autoUpdater.on('error', (error) => {
    console.error('UGC21 updater error:', error);
  });
  setTimeout(() => autoUpdater.checkForUpdates().catch((error) => console.error(error)), 5000);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  configureUpdater();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
