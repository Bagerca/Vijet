const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const AdmZip = require('adm-zip');
const fs = require('fs');
const fsp = require('fs').promises;

// ==========================================
// 1. ФУНКЦИЯ УСТАНОВКИ ОБНОВЛЕНИЯ (БЕЗ ФРИЗОВ)
// ==========================================
async function performHotUpdate(versionTag) {
    console.log(`[HOT-PATCH] Начинаю установку версии: ${versionTag}`);
    io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: `Установка версии ${versionTag}...`, badge: "СИСТЕМА", color: "#00E5FF" }});

    const rootDir = app.getAppPath();
    const tempZip = path.join(app.getPath('temp'), `uso_update_${versionTag}.zip`);
    const tempDir = path.join(app.getPath('temp'), `uso_extracted_${versionTag}`);

    try {
        // 1. Скачиваем АРХИВ КОНКРЕТНОГО РЕЛИЗА
        const downloadUrl = `https://github.com/bagerca/Vijet/archive/refs/tags/${versionTag}.zip`;
        const response = await axios({ method: 'GET', url: downloadUrl, responseType: 'arraybuffer' });
        await fsp.writeFile(tempZip, response.data);

        // 2. Распаковываем
        const zip = new AdmZip(tempZip);
        zip.extractAllTo(tempDir, true); // AdmZip синхронный, но для небольших файлов ок

        // Имя папки внутри архива GitHub (Vijet-1.0.2)
        const cleanTag = versionTag.replace(/^v/, ''); 
        const sourceDir = path.join(tempDir, `Vijet-${cleanTag}`);
        
        // 3. АСИНХРОННОЕ копирование с заменой (не вешает UI лаунчера)
        await fsp.cp(sourceDir, rootDir, {
            recursive: true,
            force: true,
            filter: (src) => {
                const normalizedSrc = src.replace(/\\/g, '/');
                if (normalizedSrc.includes('node_modules') || normalizedSrc.includes('.git')) return false;
                if (normalizedSrc.endsWith('src/main/index.js')) return false; 
                return true;
            }
        });

        // 4. Убираем мусор
        await fsp.rm(tempDir, { recursive: true, force: true });
        await fsp.unlink(tempZip);

        console.log("[HOT-PATCH] Обновление успешно!");
        io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: `Успешно обновлено до ${versionTag}!`, badge: "УСПЕХ", color: "#00FF7F" }});
        
        // Даем команду OBS обновиться
        setTimeout(() => { io.emit('uso_event', { event: 'FORCE_RELOAD_VISUAL', payload: {} }); }, 2000);

        return { status: 'success' };
    } catch (err) {
        console.error("[HOT-PATCH] Ошибка обновления:", err);
        io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: "Ошибка установки патча!", badge: "ОШИБКА", color: "#FF0050" }});
        return { status: 'error', message: err.message };
    }
}

// ==========================================
// 2. ЛОКАЛЬНЫЙ СЕРВЕР И WEBSOCKETS
// ==========================================
const expressApp = express();
const server = http.createServer(expressApp);

const io = new Server(server, { cors: { origin: '*' } });
const PORT = 3500;

expressApp.use(express.static(path.join(__dirname, '..', 'overlay')));

io.on('connection', (socket) => {
    console.log(`[SOCKET 🟢] Устройство подключено: ${socket.id}`);
    
    socket.on('uso_event', async (data) => {
        if (data.event === 'TRIGGER_HOT_UPDATE') {
            // Вызов обновы через чат-команду !обнова
            try {
                const res = await axios.get('https://api.github.com/repos/bagerca/Vijet/releases/latest');
                await performHotUpdate(res.data.tag_name);
            } catch(e) { console.error("Не удалось найти релиз для !обнова", e); }
        } else {
            // Обычная пересылка сообщений между модулями
            socket.broadcast.emit('uso_event', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET 🔴] Устройство отключено: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`[USO SERVER] Сервер запущен: http://localhost:${PORT}`);
});

// ==========================================
// 3. ОКНО ЛАУНЧЕРА
// ==========================================
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100, height: 700, minWidth: 900, minHeight: 600,
        title: "USO Launcher", frame: false, transparent: true, backgroundColor: '#00000000', 
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = { ...details.responseHeaders };
        const headersToRemove = ['content-security-policy', 'Content-Security-Policy', 'x-frame-options', 'X-Frame-Options'];
        headersToRemove.forEach(header => { if (responseHeaders[header]) delete responseHeaders[header]; });
        callback({ cancel: false, responseHeaders });
    });
    createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('get-server-port', () => PORT);
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('window-min', () => mainWindow.minimize());
ipcMain.on('window-max', () => { if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
ipcMain.on('window-close', () => mainWindow.close());

// ==========================================
// 4. IPC МОСТ (СВЯЗЬ С ЛАУНЧЕРОМ)
// ==========================================

// Перезагрузка визуала OBS
ipcMain.on('force-reload-obs', () => { 
    io.emit('uso_event', { event: 'FORCE_RELOAD_VISUAL', payload: {} }); 
});

// Слушаем команду от кнопки "Установить" из лаунчера
ipcMain.on('start-hot-update', async (event, versionTag) => {
    const result = await performHotUpdate(versionTag);
    // Отправляем ответ обратно в UI лаунчера
    event.sender.send('hot-update-status', result);
});