const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http'); // Встроенный модуль Node.js
const { Server } = require('socket.io'); // Подключаем WebSockets

// ==========================================
// 1. ЛОКАЛЬНЫЙ СЕРВЕР И WEBSOCKETS
// ==========================================
const expressApp = express();
const server = http.createServer(expressApp);

// Создаем хаб (брокер) для мгновенной связи
const io = new Server(server, { 
    cors: { origin: '*' } // Разрешаем подключение откуда угодно (для Ngrok/VPN)
});

const PORT = 3500;

expressApp.use(express.static(path.join(__dirname, '..', 'overlay')));

// Логика передачи сообщений между OBS и Mod Deck
io.on('connection', (socket) => {
    console.log(`[SOCKET 🟢] Устройство подключено: ${socket.id}`);
    
    // Когда сервер получает событие от одного окна, он пересылает его ВСЕМ остальным
    socket.on('uso_event', (data) => {
        socket.broadcast.emit('uso_event', data);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET 🔴] Устройство отключено: ${socket.id}`);
    });
});

server.listen(PORT, () => {
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
        frame: false,
        transparent: true,
        backgroundColor: '#00000000', 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
    // ФИКС БЛОКИРОВКИ TWITCH IFRAME (CSP)
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = { ...details.responseHeaders };
        const headersToRemove = ['content-security-policy', 'Content-Security-Policy', 'x-frame-options', 'X-Frame-Options'];
        headersToRemove.forEach(header => { if (responseHeaders[header]) delete responseHeaders[header]; });
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
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('window-min', () => mainWindow.minimize());
ipcMain.on('window-max', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());