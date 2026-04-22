const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, dialog, shell } = require('electron')
const path = require('path')

let mainWindow = null

function cleanPhone(raw) {
  return raw.replace(/\D/g, '')
}

function isLikelyPhone(text) {
  const digits = cleanPhone(text)
  return digits.length >= 8 && digits.length <= 15
}

function openWhatsApp(phone) {
  const number = cleanPhone(phone)
  // Try WhatsApp desktop protocol first; falls back to OS default if not installed
  shell.openExternal(`whatsapp://send?phone=${number}`).catch(() => {
    shell.openExternal(`https://wa.me/${number}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 280,
    resizable: false,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile('index.html')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    checkClipboardOnOpen()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide()
    }
  })
}

async function checkClipboardOnOpen() {
  const text = clipboard.readText().trim()
  if (!text || !isLikelyPhone(text)) return

  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Usar número', 'Ignorar'],
    defaultId: 0,
    cancelId: 1,
    message: 'Número detectado na área de transferência',
    detail: text,
  })

  if (response === 0 && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('paste-phone', text)
  }
}

function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
    checkClipboardOnOpen()
  }
}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('CommandOrControl+Shift+W', toggleWindow)

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep app running in background on macOS
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('open-whatsapp', (_event, phone) => {
  openWhatsApp(phone)
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
})

ipcMain.on('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
})

ipcMain.on('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize()
})
