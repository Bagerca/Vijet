const { shell } = require('electron');

const REPO_URL = "bagerca/Vijet"; 
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

        // ИСПРАВЛЕНИЕ: Вырезаем букву v/V независимо от регистра
        const currentAppVersion = document.getElementById('app-version').innerText.replace(/v/i, '').trim();
        
        console.log(`[Updater] Проверяем обновления для ${REPO_URL}. Текущая версия: ${currentAppVersion}`);

        const response = await fetch(`https://api.github.com/repos/${REPO_URL}/releases/latest`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!response.ok) {
            throw new Error(`GitHub API вернул статус: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (isNewerVersion(currentAppVersion, data.tag_name)) {
            console.log(`[Updater] Найдена новая версия: ${data.tag_name}`);
            statusEl.innerText = `Доступно обновление: ${data.tag_name}`;
            statusEl.style.color = "#00FF7F"; 
            latestDownloadUrl = data.html_url; 
            downloadBtn.classList.remove('hidden');
        } else {
            console.log(`[Updater] Установлена актуальная версия.`);
            statusEl.innerText = "Установлена последняя версия";
            statusEl.style.color = "#888888";
            checkBtn.classList.remove('hidden');
        }
    } catch (error) {
        console.error("[Updater ❌] Ошибка при проверке обновлений:", error.message);
        
        if (error.message.includes('404')) {
            statusEl.innerText = "Релизы не найдены (404)";
        } else if (error.message.includes('403')) {
            statusEl.innerText = "Лимит запросов API (403)";
        } else {
            statusEl.innerText = "Ошибка проверки сети";
        }
        
        statusEl.style.color = "#FF4477"; 
        checkBtn.classList.remove('hidden');
    }
}

checkBtn.addEventListener('click', checkGitHubUpdates);
downloadBtn.addEventListener('click', () => shell.openExternal(latestDownloadUrl));

// Автоматический чек при старте с задержкой 2 сек
setTimeout(checkGitHubUpdates, 2000);