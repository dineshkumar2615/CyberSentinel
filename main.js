const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const os = require('os');
const { exec } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
        title: "CyberSentinel: Tactical Operations Center"
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../out/index.html')}`;

    win.loadURL(startUrl);
}

// IPC Handlers for Native Security Powers
ipcMain.handle('get-system-info', async () => {
    return {
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        hostname: os.hostname(),
        networkInterfaces: os.networkInterfaces()
    };
});

ipcMain.handle('scan-processes', async () => {
    return new Promise((resolve) => {
        // Platform specific command
        const cmd = process.platform === 'win32'
            ? 'tasklist /fo csv /nh'
            : 'ps -eo comm,pid,pcpu,pmem --sort=-pcpu | head -n 20';

        exec(cmd, (error, stdout) => {
            if (error) {
                resolve({ success: false, error: error.message });
                return;
            }

            // Basic parsing for demo purposes
            const lines = stdout.trim().split('\n');
            resolve({ success: true, count: lines.length, raw: lines.slice(0, 10) });
        });
    });
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
