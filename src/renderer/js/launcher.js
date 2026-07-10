const { ipcRenderer, clipboard, shell } = require('electron');

let localServerUrl = "";
let currentAppVersion = "1.0.0";
const REPO_URL = "bagerca/Vijet"; 

// 1. Инициализация (Получаем порт и формируем кастомные ссылки)
async function initLauncher() {
    currentAppVersion = await ipcRenderer.invoke('get-app-version');
    document.getElementById('app-version').innerText = `v${currentAppVersion}`;

    const port = await ipcRenderer.invoke('get-server-port');
    localServerUrl = `http://localhost:${port}`;
    
    // === ГЕНЕРАЦИЯ ТОЧНЫХ ССЫЛОК ИЗ ТВОЕЙ АРХИТЕКТУРЫ ===
    
    // 1. Ядра (Core)
    document.getElementById('url-core-master').value = `${localServerUrl}/core.html?mode=master`;
    document.getElementById('url-core-tts').value = `${localServerUrl}/core.html?mode=tts`;
    document.getElementById('url-core-alerts').value = `${localServerUrl}/core.html?mode=alerts`;
    document.getElementById('url-core-deaths').value = `${localServerUrl}/core.html?mode=deaths`;

    // 2. Стриминг (Игровой экран)
    const streamOverWidgets = "blur,emotes,wheel,alerts,goal,shoutout,ticker,socials,tts,pet,deaths,cam,media,uptime";
    const streamUnderWidgets = "chat,music,particles";
    document.getElementById('url-stream-over').value = `${localServerUrl}/index.html?widgets=${streamOverWidgets}`;
    document.getElementById('url-stream-under').value = `${localServerUrl}/index.html?widgets=${streamUnderWidgets}`;

    // 3. Общение (Just Chatting)
    const chatOverWidgets = "blur,emotes,wheel,alerts,goal,shoutout,ticker,socials,tts,pet,deaths,uptime,cam,media";
    const chatUnderWidgets = "chat,music,particles";
    document.getElementById('url-chat-over').value = `${localServerUrl}/index.html?widgets=${chatOverWidgets}&scene=chatting`;
    document.getElementById('url-chat-under').value = `${localServerUrl}/index.html?widgets=${chatUnderWidgets}&scene=chatting`;

    // 4. Сцены старта и конца
    document.getElementById('url-scene-start').value = `${localServerUrl}/index.html?scene=starting`;
    document.getElementById('url-scene-end').value = `${localServerUrl}/index.html?scene=ending`;

    // Встраивание Mod Deck
    const modDeckFrame = document.getElementById('moddeck-frame');
    modDeckFrame.src = `${localServerUrl}/mod-deck.html`;

    checkGitHubUpdates();
}

initLauncher();

// ==========================================
// 2. Управление окном (Mac OS кнопки)
// ==========================================
document.querySelectorAll('.win-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cmd = e.currentTarget.getAttribute('data-cmd');
        ipcRenderer.send(`window-${cmd}`);
    });
});

// ==========================================
// 3. Навигация (Переключение вкладок)
// ==========================================
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        
        const targetTabId = e.currentTarget.getAttribute('data-tab');
        e.currentTarget.classList.add('active');
        document.getElementById(`tab-${targetTabId}`).classList.add('active');
    });
});

// ==========================================
// 4. Копирование ссылок в буфер обмена
// ==========================================
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
// 5. Модуль обновлений (GitHub Updater)
// ==========================================
const statusEl = document.getElementById('updater-status');
const checkBtn = document.getElementById('btn-check-update');
const downloadBtn = document.getElementById('btn-download-update');

let latestDownloadUrl = `https://github.com/${REPO_URL}/releases/latest`;

function isNewerVersion(current, remote) {
    const currParts = current.replace(/[^0-9.]/g, '').split('.').map(Number);
    const remParts = remote.replace(/[^0-9.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(currParts.length, remParts.length); i++) {
        const c = currParts[i] || 0;
        const r = remParts[i] || 0;
        if (r > c) return true;
        if (r < c) return false;
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
        const latestVer = data.tag_name;

        if (isNewerVersion(currentAppVersion, latestVer)) {
            statusEl.innerText = `Доступно обновление: ${latestVer}`;
            statusEl.style.color = "#00FF7F";
            latestDownloadUrl = data.html_url; 
            downloadBtn.classList.remove('hidden');
        } else {
            statusEl.innerText = "Установлена последняя версия";
            statusEl.style.color = "#888888";
            checkBtn.classList.remove('hidden');
        }
    } catch (error) {
        console.warn("[Updater]", error);
        statusEl.innerText = "Обновлений не найдено";
        statusEl.style.color = "#888888";
        checkBtn.classList.remove('hidden');
    }
}

checkBtn.addEventListener('click', () => checkGitHubUpdates());

downloadBtn.addEventListener('click', () => {
    shell.openExternal(latestDownloadUrl);
});