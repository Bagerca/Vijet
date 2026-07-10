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
// УТИЛИТА: ПОЛУЧЕНИЕ ПРАВИЛЬНОГО ПУТИ К OVERLAY
// ==========================================
// В production папка overlay лежит в app.asar.unpacked, чтобы мы могли ее перезаписывать!
function getOverlayPath() {
    const isPackaged = app.isPackaged;
    const basePath = isPackaged 
        ? path.join(process.resourcesPath, 'app.asar.unpacked') 
        : path.join(__dirname, '..', '..');
    
    return path.join(basePath, 'overlay');
}

// ==========================================
// 1. ФУНКЦИЯ УСТАНОВКИ ОБНОВЛЕНИЯ (HOT-PATCH)
// ==========================================
async function performHotUpdate(versionTag) {
    console.log(`[HOT-PATCH] Начинаю установку версии: ${versionTag}`);
    io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: `Скачивание ${versionTag}...`, badge: "СИСТЕМА", color: "#00E5FF" }});

    const overlayDir = getOverlayPath();
    const tempZip = path.join(app.getPath('temp'), `uso_update_${versionTag}.zip`);
    const tempDir = path.join(app.getPath('temp'), `uso_extracted_${versionTag}`);

    try {
        // 1. Скачиваем АРХИВ с учетом таймаута и User-Agent (Github банит без него)
        const downloadUrl = `https://github.com/bagerca/Vijet/archive/refs/tags/${versionTag}.zip`;
        console.log(`[HOT-PATCH] Скачиваю с: ${downloadUrl}`);
        
        const response = await axios({ 
            method: 'GET', 
            url: downloadUrl, 
            responseType: 'arraybuffer',
            timeout: 15000, // 15 секунд таймаут, чтобы не висело вечно при сбоях сети
            headers: { 'User-Agent': 'USO-Launcher-Updater' }
        });
        
        await fsp.writeFile(tempZip, response.data);
        console.log(`[HOT-PATCH] Архив скачан во временную папку`);

        // 2. Распаковываем
        const zip = new AdmZip(tempZip);
        zip.extractAllTo(tempDir, true);

        // Имя папки внутри архива GitHub (Vijet-1.0.2)
        const cleanTag = versionTag.replace(/^v/, ''); 
        const sourceOverlayDir = path.join(tempDir, `Vijet-${cleanTag}`, 'overlay');
        
        // 3. Проверяем, существует ли папка overlay в скачанном архиве
        if (!fs.existsSync(sourceOverlayDir)) {
            throw new Error("Структура архива нарушена (отсутствует папка overlay).");
        }

        io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: `Установка файлов...`, badge: "СИСТЕМА", color: "#FEE101" }});

        // 4. Копируем только папку overlay с заменой (не трогаем исходники лаунчера)
        await fsp.cp(sourceOverlayDir, overlayDir, {
            recursive: true,
            force: true
        });

        // 5. Убираем мусор
        await fsp.rm(tempDir, { recursive: true, force: true });
        await fsp.unlink(tempZip);

        console.log("[HOT-PATCH] Обновление успешно применено!");
        io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: `Успешно обновлено до ${versionTag}!`, badge: "УСПЕХ", color: "#00FF7F" }});
        
        // Даем команду OBS обновиться
        setTimeout(() => { io.emit('uso_event', { event: 'FORCE_RELOAD_VISUAL', payload: {} }); }, 2000);

        return { status: 'success' };
    } catch (err) {
        console.error("[HOT-PATCH] Ошибка обновления:", err);
        
        // Очистка мусора в случае ошибки
        try { if (fs.existsSync(tempDir)) await fsp.rm(tempDir, { recursive: true, force: true }); } catch(e){}
        try { if (fs.existsSync(tempZip)) await fsp.unlink(tempZip); } catch(e){}

        // Формируем понятную ошибку для сети
        let errorMsg = err.message;
        if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
            errorMsg = "Сбой сети при скачивании (VPN/Провайдер).";
        } else if (err.response && err.response.status === 404) {
            errorMsg = "Файл релиза не найден на GitHub.";
        } else if (err.code === 'EPERM' || err.code === 'EBUSY') {
            errorMsg = "Файлы заблокированы OBS. Закройте OBS на время обновы.";
        }

        io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: `Ошибка: ${errorMsg}`, badge: "ОШИБКА", color: "#FF0050" }});
        return { status: 'error', message: errorMsg };
    }
}

// ==========================================
// 2. ЛОКАЛЬНЫЙ СЕРВЕР И WEBSOCKETS
// ==========================================
const expressApp = express();
const server = http.createServer(expressApp);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = 3500;

// Указываем Express отдавать статику из "безопасной" папки overlay
expressApp.use(express.static(getOverlayPath()));

io.on('connection', (socket) => {
    console.log(`[SOCKET 🟢] Устройство подключено: ${socket.id}`);
    
    socket.on('uso_event', async (data) => {
        if (data.event === 'TRIGGER_HOT_UPDATE') {
            try {
                const res = await axios.get('https://api.github.com/repos/bagerca/Vijet/releases/latest', {
                    headers: { 'User-Agent': 'USO-Launcher' }
                });
                await performHotUpdate(res.data.tag_name);
            } catch(e) { console.error("[HOT-PATCH] Не удалось найти релиз для !обнова", e.message); }
        } else {
            socket.broadcast.emit('uso_event', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET 🔴] Устройство отключено: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`[USO SERVER] Сервер запущен: http://localhost:${PORT}`);
    console.log(`[USO SERVER] Путь к Overlay: ${getOverlayPath()}`);
});

// ==========================================
// 3. ОКНО ЛАУНЧЕРА
// ==========================================
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100, height: 700, minWidth: 900, minHeight: 600,
        title: "USO Launcher", frame: false, transparent: true, backgroundColor: '#00000000', 
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        }
    });
    // Лаунчер (renderer) мы не трогаем, он запакован в app.asar
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'index.html'));
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

ipcMain.on('force-reload-obs', () => { 
    io.emit('uso_event', { event: 'FORCE_RELOAD_VISUAL', payload: {} }); 
});

ipcMain.on('start-hot-update', async (event, versionTag) => {
    const result = await performHotUpdate(versionTag);
    event.sender.send('hot-update-status', result);
});