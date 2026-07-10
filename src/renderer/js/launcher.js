const { ipcRenderer } = require('electron');

let localServerUrl = "";

// 1. Инициализация (Получаем порт от сервера)
ipcRenderer.invoke('get-server-port').then((port) => {
    localServerUrl = `http://localhost:${port}`;
    
    // ВАЖНО: Загружаем Mod Deck в iframe (Берем его из папки overlay, которую раздает сервер)
    const modDeckFrame = document.getElementById('moddeck-frame');
    modDeckFrame.src = `${localServerUrl}/mod-deck.html`;
});

// 2. Управление окном (Mac OS кнопки)
document.querySelectorAll('.win-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cmd = e.currentTarget.getAttribute('data-cmd');
        ipcRenderer.send(`window-${cmd}`);
    });
});

// 3. Навигация (Переключение вкладок)
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Убираем активность со всех кнопок и вкладок
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        
        // Включаем нужную
        const targetTabId = e.currentTarget.getAttribute('data-tab');
        e.currentTarget.classList.add('active');
        document.getElementById(`tab-${targetTabId}`).classList.add('active');
    });
});

// 4. Копирование ссылок в буфер обмена
document.querySelectorAll('.link-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget; // СОХРАНЯЕМ КНОПКУ СЮДА!
        const type = targetBtn.getAttribute('data-link-type');
        let linkToCopy = "";

        if (type === 'core') linkToCopy = `${localServerUrl}/core.html`;
        if (type === 'visual') linkToCopy = `${localServerUrl}/index.html`;
        if (type === 'chatting') linkToCopy = `${localServerUrl}/index.html?scene=chatting`;

        // Копируем
        navigator.clipboard.writeText(linkToCopy);

        // Визуальный фидбек
        const originalText = targetBtn.innerText;
        targetBtn.innerText = "СКОПИРОВАНО!";
        targetBtn.classList.add('copied');
        
        // Теперь setTimeout не потеряет кнопку!
        setTimeout(() => {
            targetBtn.innerText = originalText;
            targetBtn.classList.remove('copied');
        }, 1500);
    });
});