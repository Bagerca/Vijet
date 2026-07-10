/* ФАЙЛ: src/main/index.js */

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const AdmZip = require('adm-zip');
const fs = require('fs');

// ==========================================
// 1. ЛОКАЛЬНЫЙ СЕРВЕР И WEBSOCKETS
// ==========================================
const expressApp = express();
const server = http.createServer(expressApp);

const io = new Server(server, { cors: { origin: '*' } });
const PORT = 3500;

expressApp.use(express.static(path.join(__dirname, '..', 'overlay')));

// Логика передачи сообщений и АВТООБНОВЛЕНИЯ
io.on('connection', (socket) => {
    console.log(`[SOCKET 🟢] Устройство подключено: ${socket.id}`);
    
    socket.on('uso_event', async (data) => {
        // === МАГИЯ ТИХОГО ОБНОВЛЕНИЯ (SILENT HOT-PATCH) ===
        if (data.event === 'TRIGGER_HOT_UPDATE') {
            try {
                console.log("[HOT-PATCH] Начинаю тихое обновление с GitHub...");
                // Пишем в бегущую строку на стриме, что идет обнова
                io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: "Установка обновления с GitHub...", badge: "СИСТЕМА", color: "#00E5FF" }});

                const rootDir = app.getAppPath(); // Корневая папка проекта
                const tempZip = path.join(app.getPath('temp'), 'uso_update.zip');
                const tempDir = path.join(app.getPath('temp'), 'uso_extracted');

                // 1. Скачиваем архив репозитория
                const response = await axios({
                    method: 'GET',
                    url: 'https://github.com/bagerca/Vijet/archive/refs/heads/main.zip',
                    responseType: 'arraybuffer'
                });
                fs.writeFileSync(tempZip, response.data);

                // 2. Распаковываем
                const zip = new AdmZip(tempZip);
                zip.extractAllTo(tempDir, true);

                // 3. Копируем с заменой файлов
                const sourceDir = path.join(tempDir, 'Vijet-main');
                
                fs.cpSync(sourceDir, rootDir, {
                    recursive: true,
                    force: true,
                    filter: (src, dest) => {
                        // Нормализуем слеши для кроссплатформенности (Windows/Mac)
                        const normalizedSrc = src.replace(/\\/g, '/');
                        
                        // Запрещаем перезаписывать node_modules и папку .git
                        if (normalizedSrc.includes('node_modules') || normalizedSrc.includes('.git')) return false;
                        
                        // ИСПРАВЛЕНО: Блокируем ТОЛЬКО бэкенд-файл, чтобы фронтендовские index.js могли обновляться
                        if (normalizedSrc.endsWith('src/main/index.js')) return false; 
                        
                        return true;
                    }
                });

                // 4. Убираем мусор
                fs.rmSync(tempDir, { recursive: true, force: true });
                fs.unlinkSync(tempZip);

                console.log("[HOT-PATCH] Обновление успешно! Перезагружаю OBS...");
                io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: "Система успешно обновлена!", badge: "УСПЕХ", color: "#00FF7F" }});

                // 5. Даем команду OBS перезагрузить страницы с новыми файлами!
                setTimeout(() => {
                    io.emit('uso_event', { event: 'FORCE_RELOAD_VISUAL', payload: {} });
                }, 2000);

            } catch (err) {
                console.error("[HOT-PATCH] Ошибка обновления:", err);
                io.emit('uso_event', { event: 'TICKER_CUSTOM', payload: { msg: "Ошибка установки патча!", badge: "ОШИБКА", color: "#FF0050" }});
            }
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
// 2. ОКНО ЛАУНЧЕРА
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
// 3. IPC МОСТ (СВЯЗЬ С FRONTEND-НАСТРОЙКАМИ)
// ==========================================

// Перезагрузка визуала OBS по кнопке "Сохранить" из настроек лаунчера
ipcMain.on('force-reload-obs', () => { 
    io.emit('uso_event', { event: 'FORCE_RELOAD_VISUAL', payload: {} }); 
});