const { app, BrowserWindow, Tray, Menu, shell, ipcMain, globalShortcut, clipboard, dialog, nativeImage } = require('electron')
const path = require('path')

const isMac = process.platform === 'darwin'

let mainWindow = null
let tray = null
let isQuitting = false
let blockBlur = false
let lastOfferedClipboard = ''
let checkingClipboard = false

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

function cleanPhone(raw) {
  return raw.replace(/\D/g, '')
}

function isLikelyPhone(text) {
  const digits = cleanPhone(text)
  return digits.length >= 8 && digits.length <= 15
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 320,
    resizable: false,
    frame: false,
    transparent: false,
    ...(isMac ? { vibrancy: 'under-window', visualEffectState: 'active' } : {}),
    backgroundColor: '#1a1a1a',
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
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('blur', () => {
    if (!isMac) return
    if (blockBlur) return
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMinimized()) {
      mainWindow.hide()
    }
  })
}

function createTray() {
  if (tray) return
  const iconPath = path.join(__dirname, 'assets', isMac ? 'icon.png' : 'icon.ico')
  const image = nativeImage.createFromPath(iconPath)
  tray = new Tray(isMac ? image.resize({ width: 16, height: 16 }) : image)
  tray.setToolTip('QuickZap')

  const menu = Menu.buildFromTemplate([
    { label: 'Abrir QuickZap', click: () => showWindow() },
    { type: 'separator' },
    { label: 'Sair', click: () => { isQuitting = true; app.quit() } },
  ])
  tray.setContextMenu(menu)

  tray.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
      return
    }
    if (mainWindow.isVisible()) mainWindow.hide()
    else showWindow()
  })
}

async function checkClipboardOnOpen() {
  if (checkingClipboard) return
  checkingClipboard = true
  blockBlur = true
  let text = ''
  try {
    text = clipboard.readText().trim()
  } catch (_) {
    blockBlur = false
    checkingClipboard = false
    return
  }

  if (!text || !isLikelyPhone(text) || text === lastOfferedClipboard) {
    blockBlur = false
    checkingClipboard = false
    return
  }

  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Usar número', 'Ignorar'],
    defaultId: 0,
    cancelId: 1,
    message: 'Número detectado na área de transferência',
    detail: text,
  })

  lastOfferedClipboard = text
  blockBlur = false
  checkingClipboard = false
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.focus()

  if (response === 0 && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('paste-phone', text)
  }
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }
  const wasHidden = !mainWindow.isVisible()
  mainWindow.show()
  mainWindow.focus()
  if (wasHidden) checkClipboardOnOpen()
}

function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}

app.whenReady().then(() => {
  createWindow()
  if (!isMac) createTray()

  globalShortcut.register('CommandOrControl+Shift+W', toggleWindow)

  app.on('second-instance', () => {
    showWindow()
  })

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) createWindow()
    else showWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (isMac) return
})

ipcMain.on('open-whatsapp', (_event, phone) => {
  const number = cleanPhone(phone)
  shell.openExternal(`whatsapp://send?phone=${number}`).catch(() => {
    shell.openExternal(`https://wa.me/${number}`)
  })
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
})


ipcMain.handle('read-clipboard', () => clipboard.readText())

ipcMain.on('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide()
})

ipcMain.on('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize()
})
