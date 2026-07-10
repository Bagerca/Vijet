const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const express = require('express');

// ==========================================
// 1. ЛОКАЛЬНЫЙ СЕРВЕР (Для OBS)
// ==========================================
const expressApp = express();
const PORT = 3500;

expressApp.use(express.static(path.join(__dirname, '..', 'overlay')));

expressApp.listen(PORT, () => {
    console.log(`[USO SERVER] Сервер запущен: http://localhost:${PORT}`);
});

// ==========================================
// 2. ОКНО ЛАУНЧЕРА (Стильное, без рамки)
// ==========================================
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 900,
        minHeight: 600,
        title: "USO Launcher",
        frame: false,             // УБИРАЕМ СТАНДАРТНУЮ РАМКУ WINDOWS
        transparent: true,        // Прозрачный фон для закругленных углов
        backgroundColor: '#00000000', 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
    // ==========================================
    // ФИКС БЛОКИРОВКИ TWITCH IFRAME (CSP)
    // Twitch запрещает встраивание, если в предках есть file://
    // Мы перехватываем заголовки и вырезаем политику безопасности
    // ==========================================
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = { ...details.responseHeaders };
        
        const headersToRemove = [
            'content-security-policy', 
            'Content-Security-Policy', 
            'x-frame-options', 
            'X-Frame-Options'
        ];
        
        headersToRemove.forEach(header => {
            if (responseHeaders[header]) {
                delete responseHeaders[header];
            }
        });

        callback({ cancel: false, responseHeaders });
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// 3. IPC: СВЯЗЬ ФРОНТА С БЭКЕНДОМ
// ==========================================
ipcMain.handle('get-server-port', () => PORT);

// Обработчики кастомных кнопок окна
ipcMain.on('window-min', () => mainWindow.minimize());
ipcMain.on('window-max', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());