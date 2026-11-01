const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path'), fs = require('fs');
app.commandLine.appendSwitch('enable-features', 'HardwareMediaKeyHandling,MediaSessionService');
app.setAppUserModelId('com.oathkeeper.player');
const EXTS = ['mp3', 'm4a', 'm4b', 'aac', 'ogg', 'opus', 'wav', 'flac', 'wma'];
const EXT = new RegExp('\\.(' + EXTS.join('|') + ')$', 'i');
const info = p => ({ p, n: path.basename(p), sz: fs.statSync(p).size });
const nat = (a, b) => a.p.localeCompare(b.p, undefined, { numeric: true });
function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, out); else if (EXT.test(e.name)) out.push(info(f));
  }
  return out;
}
let win;
function create() {
  win = new BrowserWindow({
    width: 1220, height: 780, minWidth: 900, minHeight: 600, backgroundColor: '#0f0e14',
    title: 'The Oath Keeper', icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, autoplayPolicy: 'no-user-gesture-required' }
  });
  win.loadFile('index.html');
}
Menu.setApplicationMenu(null);
ipcMain.handle('pick-files', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Audio', extensions: EXTS }] });
  return r.canceled ? null : { title: null, files: r.filePaths.map(info).sort(nat) };
});
ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (r.canceled) return null;
  return { title: path.basename(r.filePaths[0]), files: walk(r.filePaths[0], []).sort(nat) };
});
ipcMain.handle('expand', (e, paths) => {
  const out = []; let title = null;
  for (const p of paths || []) {
    try {
      if (fs.statSync(p).isDirectory()) { if (!title) title = path.basename(p); walk(p, out); }
      else if (EXT.test(p)) out.push(info(p));
    } catch (err) { /* skip unreadable */ }
  }
  return { title, files: out.sort(nat) };
});
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
