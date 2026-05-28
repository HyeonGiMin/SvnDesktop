import { app, BrowserWindow, shell, Menu } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    show: false,
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  Menu.setApplicationMenu(null)

  win.on('ready-to-show', () => win.show())
  win.on('maximize', () => win.webContents.send('window:maximized'))
  win.on('unmaximize', () => win.webContents.send('window:unmaximized'))

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  registerIpcHandlers(win)

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
