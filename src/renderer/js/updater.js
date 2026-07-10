// Оборачиваем в IIFE для изоляции области видимости
(() => {
    const { ipcRenderer } = require('electron');

    const REPO_URL = "bagerca/Vijet"; 
    const statusEl = document.getElementById('updater-status');
    const checkBtn = document.getElementById('btn-check-update');
    const downloadBtn = document.getElementById('btn-download-update');
    const controlsWrapper = document.getElementById('updater-controls');
    const versionSelect = document.getElementById('version-select');

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
            // Визуальная анимация
            if (checkBtn) checkBtn.classList.add('spin');
            statusEl.innerText = "Поиск релизов...";
            statusEl.style.color = "#888888";
            controlsWrapper.classList.add('hidden');
            versionSelect.innerHTML = ''; 

            const appVersionEl = document.getElementById('app-version');
            const currentAppVersion = appVersionEl ? appVersionEl.innerText.replace(/v/i, '').trim() : "1.0.0";

            const response = await fetch(`https://api.github.com/repos/${REPO_URL}/releases`, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 429) {
                    throw new Error("Лимит запросов к GitHub");
                }
                throw new Error(`Ошибка API: ${response.status}`);
            }

            const releases = await response.json();
            
            if (!Array.isArray(releases) || releases.length === 0) {
                throw new Error("Релизы не найдены");
            }

            // Заполняем выпадающий список
            releases.forEach(release => {
                const option = document.createElement('option');
                option.value = release.tag_name;
                option.textContent = release.tag_name + (release.name ? ` (${release.name})` : '');
                versionSelect.appendChild(option);
            });

            const latestRelease = releases[0]; 

            if (isNewerVersion(currentAppVersion, latestRelease.tag_name)) {
                statusEl.innerText = `Найдено обновление!`;
                statusEl.style.color = "#00FF7F"; 
                controlsWrapper.classList.remove('hidden');
                downloadBtn.innerText = "Установить";
            } else {
                statusEl.innerText = "Установлена последняя версия";
                statusEl.style.color = "#888888";
                controlsWrapper.classList.remove('hidden'); 
                downloadBtn.innerText = "Переустановить";
            }
        } catch (error) {
            console.error("[Updater] Ошибка:", error.message);
            statusEl.innerText = error.message.includes("Лимит") ? "Лимит запросов GitHub" : "Ошибка поиска обновлений";
            statusEl.style.color = "#FF4477"; 
        } finally {
            if (checkBtn) checkBtn.classList.remove('spin');
        }
    }

    // Обработчики кнопок
    if (checkBtn) checkBtn.addEventListener('click', checkGitHubUpdates);

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const selectedVersion = versionSelect.value;
            
            downloadBtn.disabled = true;
            downloadBtn.innerText = "Установка...";
            downloadBtn.classList.remove('accent');
            downloadBtn.classList.add('outline');
            checkBtn.classList.add('hidden');
            versionSelect.disabled = true;

            statusEl.innerText = `Скачивание ${selectedVersion}...`;
            statusEl.style.color = "#00E5FF";

            ipcRenderer.send('start-hot-update', selectedVersion);
        });
    }

    ipcRenderer.on('hot-update-status', (event, data) => {
        if (data.status === 'success') {
            statusEl.innerText = "Успешно! Перезагрузите программу.";
            statusEl.style.color = "#00FF7F";
            downloadBtn.innerText = "Готово";
        } else if (data.status === 'error') {
            statusEl.innerText = "Ошибка: " + (data.message || "Сбой установки");
            statusEl.style.color = "#FF4477";
            downloadBtn.disabled = false;
            downloadBtn.innerText = "Повторить";
            downloadBtn.classList.add('accent');
            downloadBtn.classList.remove('outline');
            checkBtn.classList.remove('hidden');
            versionSelect.disabled = false;
        }
    });

    // Автоскан при старте
    setTimeout(checkGitHubUpdates, 1500);
})();