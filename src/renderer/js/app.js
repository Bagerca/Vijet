const { ipcRenderer, clipboard } = require('electron');

async function initApp() {
    const appVersion = await ipcRenderer.invoke('get-app-version');
    document.getElementById('app-version').innerText = `v${appVersion}`;

    const port = await ipcRenderer.invoke('get-server-port');
    const localServerUrl = `http://localhost:${port}`;
    
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
}

// Управление окном
document.querySelectorAll('.win-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        ipcRenderer.send(`window-${e.currentTarget.getAttribute('data-cmd')}`);
    });
});

// Навигация (Табы)
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        
        const targetTabId = e.currentTarget.getAttribute('data-tab');
        e.currentTarget.classList.add('active');
        document.getElementById(`tab-${targetTabId}`).classList.add('active');
    });
});

// Копирование в буфер
document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const inputEl = document.getElementById(targetBtn.getAttribute('data-target'));
        if (inputEl) {
            clipboard.writeText(inputEl.value);
            const originalText = targetBtn.innerText;
            targetBtn.innerText = "Скопировано!";
            targetBtn.classList.add('copied');
            setTimeout(() => { targetBtn.innerText = originalText; targetBtn.classList.remove('copied'); }, 1500);
        }
    });
});

initApp();