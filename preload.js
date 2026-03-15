const { contextBridge, ipcRenderer } = require('electron');

// We will use this later to expose native system info to the UI
contextBridge.exposeInMainWorld('electronAPI', {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    scanProcesses: () => ipcRenderer.invoke('scan-processes'),
});
