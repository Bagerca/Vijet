const { ipcRenderer, clipboard, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let localServerUrl = "";
let currentAppVersion = "1.0.0";
const REPO_URL = "bagerca/Vijet"; 

// Путь до конфига в папке overlay
const configPath = path.join(__dirname, '..', 'overlay', 'js', 'config.js');

// ==========================================
// 1. Инициализация (Сборка ссылок и загрузка настроек)
// ==========================================
async function initLauncher() {
    currentAppVersion = await ipcRenderer.invoke('get-app-version');
    document.getElementById('app-version').innerText = `v${currentAppVersion}`;

    const port = await ipcRenderer.invoke('get-server-port');
    localServerUrl = `http://localhost:${port}`;
    
    // --- ГЕНЕРАЦИЯ ССЫЛОК ---
    document.getElementById('url-core-master').value = `${localServerUrl}/core.html?mode=master`;
    document.getElementById('url-core-tts').value = `${localServerUrl}/core.html?mode=tts`;
    document.getElementById('url-core-alerts').value = `${localServerUrl}/core.html?mode=alerts`;
    document.getElementById('url-core-deaths').value = `${localServerUrl}/core.html?mode=deaths`;

    const streamOverWidgets = "blur,emotes,wheel,alerts,goal,shoutout,ticker,socials,tts,pet,deaths,cam,media,uptime";
    const streamUnderWidgets = "chat,music,particles";
    document.getElementById('url-stream-over').value = `${localServerUrl}/index.html?widgets=${streamOverWidgets}`;
    document.getElementById('url-stream-under').value = `${localServerUrl}/index.html?widgets=${streamUnderWidgets}`;

    const chatOverWidgets = "blur,emotes,wheel,alerts,goal,shoutout,ticker,socials,tts,pet,deaths,uptime,cam,media";
    const chatUnderWidgets = "chat,music,particles";
    document.getElementById('url-chat-over').value = `${localServerUrl}/index.html?widgets=${chatOverWidgets}&scene=chatting`;
    document.getElementById('url-chat-under').value = `${localServerUrl}/index.html?widgets=${chatUnderWidgets}&scene=chatting`;

    document.getElementById('url-scene-start').value = `${localServerUrl}/index.html?scene=starting`;
    document.getElementById('url-scene-end').value = `${localServerUrl}/index.html?scene=ending`;

    document.getElementById('moddeck-frame').src = `${localServerUrl}/mod-deck.html`;

    checkGitHubUpdates();
    loadConfigToUI();
}

initLauncher();

// ==========================================
// 2. Управление окном
// ==========================================
document.querySelectorAll('.win-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cmd = e.currentTarget.getAttribute('data-cmd');
        ipcRenderer.send(`window-${cmd}`);
    });
});

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        
        const targetTabId = e.currentTarget.getAttribute('data-tab');
        e.currentTarget.classList.add('active');
        document.getElementById(`tab-${targetTabId}`).classList.add('active');
    });
});

document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const targetInputId = targetBtn.getAttribute('data-target');
        const inputEl = document.getElementById(targetInputId);

        if (inputEl) {
            clipboard.writeText(inputEl.value);
            const originalText = targetBtn.innerText;
            targetBtn.innerText = "Скопировано!";
            targetBtn.classList.add('copied');
            setTimeout(() => {
                targetBtn.innerText = originalText;
                targetBtn.classList.remove('copied');
            }, 1500);
        }
    });
});

// ==========================================
// 3. Чтение и Запись config.js
// ==========================================

function loadConfigToUI() {
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        
        // Вспомогательная функция для безопасного вытаскивания значений регулярками
        const extractString = (regex) => { const m = content.match(regex); return m ? m[1] : ''; };
        const extractNum = (regex) => { const m = content.match(regex); return m ? parseInt(m[1]) : 0; };
        const extractBool = (regex) => { const m = content.match(regex); return m ? m[1] === 'true' : false; };

        // Заполняем инпуты
        document.getElementById('set-channelName').value = extractString(/channelName:\s*"([^"]+)"/);
        document.getElementById('set-botChannel').value = extractString(/botChannel:\s*"([^"]+)"/);
        document.getElementById('set-goalTarget').value = extractNum(/goalTarget:\s*(\d+)/);
        document.getElementById('set-defaultVolume').value = extractNum(/defaultVolume:\s*(\d+)/);
        document.getElementById('set-alertVolume').value = extractNum(/alertVolume:\s*(\d+)/);
        
        // Заполняем тумблеры
        document.getElementById('set-petEnabled').checked = extractBool(/petEnabled:\s*(true|false)/);
        document.getElementById('set-emotesEnabled').checked = extractBool(/emotesEnabled:\s*(true|false)/);
        document.getElementById('set-ttsEnabled').checked = extractBool(/ttsEnabled:\s*(true|false)/);

    } catch (err) {
        console.error("Ошибка чтения config.js", err);
    }
}

document.getElementById('btn-save-settings').addEventListener('click', () => {
    try {
        let content = fs.readFileSync(configPath, 'utf8');

        const chName = document.getElementById('set-channelName').value.trim();
        const botName = document.getElementById('set-botChannel').value.trim();
        const goalNum = parseInt(document.getElementById('set-goalTarget').value) || 0;
        const defVol = parseInt(document.getElementById('set-defaultVolume').value) || 30;
        const alVol = parseInt(document.getElementById('set-alertVolume').value) || 40;
        
        const petState = document.getElementById('set-petEnabled').checked;
        const emotesState = document.getElementById('set-emotesEnabled').checked;
        const ttsState = document.getElementById('set-ttsEnabled').checked;

        // Аккуратная замена строк через Regex (сохраняет все твои комменты в файле)
        content = content.replace(/(channelName:\s*")[^"]+(")/, `$1${chName}$2`);
        content = content.replace(/(botChannel:\s*")[^"]*(")/, `$1${botName}$2`);
        content = content.replace(/(goalTarget:\s*)\d+/, `$1${goalNum}`);
        content = content.replace(/(defaultVolume:\s*)\d+/, `$1${defVol}`);
        content = content.replace(/(alertVolume:\s*)\d+/, `$1${alVol}`);
        content = content.replace(/(petEnabled:\s*)(true|false)/, `$1${petState}`);
        content = content.replace(/(emotesEnabled:\s*)(true|false)/, `$1${emotesState}`);
        content = content.replace(/(ttsEnabled:\s*)(true|false)/, `$1${ttsState}`);

        // Записываем обратно в файл
        fs.writeFileSync(configPath, content, 'utf8');

        // Отправляем сигнал Ядру, чтобы оно обновило все окна OBS!
        ipcRenderer.send('force-reload-obs');

        // Показываем плашку успеха
        const toast = document.getElementById('settings-toast');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);

    } catch (err) {
        console.error("Ошибка записи config.js", err);
        alert("Ошибка при сохранении конфигурации. Файл может быть занят.");
    }
});


// ==========================================
// 4. Модуль обновлений (GitHub)
// ==========================================
const statusEl = document.getElementById('updater-status');
const checkBtn = document.getElementById('btn-check-update');
const downloadBtn = document.getElementById('btn-download-update');
let latestDownloadUrl = `https://github.com/${REPO_URL}/releases/latest`;

function isNewerVersion(current, remote) {
    const currParts = current.replace(/[^0-9.]/g, '').split('.').map(Number);
    const remParts = remote.replace(/[^0-9.]/g, '').split('.').map(Number);
    for (let i = 0; i < Math.max(currParts.length, remParts.length); i++) {
        const c = currParts[i] || 0; const r = remParts[i] || 0;
        if (r > c) return true; if (r < c) return false;
    }
    return false;
}

async function checkGitHubUpdates() {
    try {
        statusEl.innerText = "Поиск обновлений...";
        statusEl.style.color = "#888888";
        checkBtn.classList.add('hidden');
        downloadBtn.classList.add('hidden');

        const response = await fetch(`https://api.github.com/repos/${REPO_URL}/releases/latest`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!response.ok) throw new Error("Релиз не найден");

        const data = await response.json();
        if (isNewerVersion(currentAppVersion, data.tag_name)) {
            statusEl.innerText = `Доступно обновление: ${data.tag_name}`;
            statusEl.style.color = "#00FF7F";
            latestDownloadUrl = data.html_url; 
            downloadBtn.classList.remove('hidden');
        } else {
            statusEl.innerText = "Установлена последняя версия";
            statusEl.style.color = "#888888";
            checkBtn.classList.remove('hidden');
        }
    } catch (error) {
        statusEl.innerText = "Обновлений не найдено";
        statusEl.style.color = "#888888";
        checkBtn.classList.remove('hidden');
    }
}
checkBtn.addEventListener('click', checkGitHubUpdates);
downloadBtn.addEventListener('click', () => shell.openExternal(latestDownloadUrl));