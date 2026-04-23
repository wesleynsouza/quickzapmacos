const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('quickzap', {
  platform:      process.platform,
  openWhatsApp:  (phone) => ipcRenderer.send('open-whatsapp', phone),
  closeWindow:   ()      => ipcRenderer.send('close-window'),
  minimizeWindow:()      => ipcRenderer.send('minimize-window'),
  readClipboard: ()      => ipcRenderer.invoke('read-clipboard'),
  onPastePhone:  (cb)    => ipcRenderer.on('paste-phone', (_e, v) => cb(v)),
})
