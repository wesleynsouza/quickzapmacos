const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('quickzap', {
  openWhatsApp: (phone) => ipcRenderer.send('open-whatsapp', phone),
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  onPastePhone: (callback) => ipcRenderer.on('paste-phone', (_event, value) => callback(value)),
})
