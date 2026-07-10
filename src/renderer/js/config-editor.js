const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'overlay', 'js', 'config.js');

// === ЧТЕНИЕ ИЗ ФАЙЛА ===
function loadConfigToUI() {
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        
        // Вспомогательные функции для вытаскивания значений (Regex)
        const getStr = (key) => { const m = content.match(new RegExp(`${key}:\\s*(["'\`])(.*?)\\1`)); return m ? m[2] : ''; };
        const getNum = (key) => { const m = content.match(new RegExp(`${key}:\\s*(\\d+)`)); return m ? parseInt(m[1]) : 0; };
        const getBool = (key) => { const m = content.match(new RegExp(`${key}:\\s*(true|false)`)); return m ? m[1] === 'true' : false; };
        
        // Особая магия для парсинга массивов (пользуемся тем, что Node.js может делать new Function)
        const getArr = (key) => {
            const m = content.match(new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`));
            if (!m) return [];
            try { return new Function(`return [${m[1]}]`)(); } catch(e) { return []; }
        };

        // Заполняем интерфейс
        document.getElementById('cfg-channelName').value = getStr('channelName');
        document.getElementById('cfg-botChannel').value = getStr('botChannel');
        document.getElementById('cfg-rewardName').value = getStr('rewardName');
        document.getElementById('cfg-ttsRewardName').value = getStr('ttsRewardName');
        document.getElementById('cfg-feedRewardName').value = getStr('feedRewardName');
        document.getElementById('cfg-wheelRewardName').value = getStr('wheelRewardName');
        document.getElementById('cfg-goalTitle').value = getStr('goalTitle');

        document.getElementById('cfg-goalTarget').value = getNum('goalTarget');
        document.getElementById('cfg-defaultVolume').value = getNum('defaultVolume');
        document.getElementById('cfg-alertVolume').value = getNum('alertVolume');
        document.getElementById('cfg-ttsVolume').value = getNum('ttsVolume');
        document.getElementById('cfg-maxChatMessages').value = getNum('maxChatMessages');
        document.getElementById('cfg-petSleepTimeout').value = getNum('petSleepTimeout');
        document.getElementById('cfg-tickerInterval').value = getNum('tickerInterval');

        document.getElementById('cfg-petEnabled').checked = getBool('petEnabled');
        document.getElementById('cfg-emotesEnabled').checked = getBool('emotesEnabled');
        document.getElementById('cfg-ttsEnabled').checked = getBool('ttsEnabled');

        const emotesMode = getStr('emotesMode');
        if (emotesMode) document.getElementById('cfg-emotesMode').value = emotesMode;

        // Массивы превращаем в текст, разбитый по строкам
        document.getElementById('cfg-allowedUsers').value = getArr('allowedUsers').join('\n');
        document.getElementById('cfg-forbiddenWords').value = getArr('forbiddenWords').join('\n');
        document.getElementById('cfg-tickerMessages').value = getArr('tickerMessages').join('\n');

    } catch (err) {
        console.error("Ошибка чтения config.js", err);
    }
}

// === ЗАПИСЬ В ФАЙЛ ===
document.getElementById('btn-save-settings').addEventListener('click', () => {
    try {
        let content = fs.readFileSync(configPath, 'utf8');

        // Вспомогательные функции для замены значений
        const setStr = (key, val) => { content = content.replace(new RegExp(`(${key}:\\s*["'\`]).*?(["'\`])`), `$1${val}$2`); };
        const setNum = (key, val) => { content = content.replace(new RegExp(`(${key}:\\s*)\\d+`), `$1${val}`); };
        const setBool = (key, val) => { content = content.replace(new RegExp(`(${key}:\\s*)(true|false)`), `$1${val}`); };
        
        // Для массивов форматируем JSON с отступами, чтобы код оставался красивым
        const setArr = (key, strVal) => {
            const arr = strVal.split('\n').map(s => s.trim()).filter(s => s !== '');
            const formatted = '\n        ' + arr.map(v => JSON.stringify(v)).join(',\n        ') + '\n    ';
            content = content.replace(new RegExp(`(${key}:\\s*\\[)[\\s\\S]*?(\\])`), `$1${formatted}$2`);
        };

        // Сбор данных из UI
        setStr('channelName', document.getElementById('cfg-channelName').value.trim());
        setStr('botChannel', document.getElementById('cfg-botChannel').value.trim());
        setStr('rewardName', document.getElementById('cfg-rewardName').value.trim());
        setStr('ttsRewardName', document.getElementById('cfg-ttsRewardName').value.trim());
        setStr('feedRewardName', document.getElementById('cfg-feedRewardName').value.trim());
        setStr('wheelRewardName', document.getElementById('cfg-wheelRewardName').value.trim());
        setStr('goalTitle', document.getElementById('cfg-goalTitle').value.trim());
        setStr('emotesMode', document.getElementById('cfg-emotesMode').value);

        setNum('goalTarget', parseInt(document.getElementById('cfg-goalTarget').value) || 0);
        setNum('defaultVolume', parseInt(document.getElementById('cfg-defaultVolume').value) || 30);
        setNum('alertVolume', parseInt(document.getElementById('cfg-alertVolume').value) || 40);
        setNum('ttsVolume', parseInt(document.getElementById('cfg-ttsVolume').value) || 100);
        setNum('maxChatMessages', parseInt(document.getElementById('cfg-maxChatMessages').value) || 12);
        setNum('petSleepTimeout', parseInt(document.getElementById('cfg-petSleepTimeout').value) || 120);
        setNum('tickerInterval', parseInt(document.getElementById('cfg-tickerInterval').value) || 60000);

        setBool('petEnabled', document.getElementById('cfg-petEnabled').checked);
        setBool('emotesEnabled', document.getElementById('cfg-emotesEnabled').checked);
        setBool('ttsEnabled', document.getElementById('cfg-ttsEnabled').checked);

        setArr('allowedUsers', document.getElementById('cfg-allowedUsers').value);
        setArr('forbiddenWords', document.getElementById('cfg-forbiddenWords').value);
        setArr('tickerMessages', document.getElementById('cfg-tickerMessages').value);

        // Сохранение и релоад
        fs.writeFileSync(configPath, content, 'utf8');
        
        // ipcRenderer определен в app.js, так как скрипты в одном контексте, но для надежности можно вызвать:
        require('electron').ipcRenderer.send('force-reload-obs');

        const toast = document.getElementById('settings-toast');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);

    } catch (err) {
        console.error("Ошибка записи config.js", err);
        alert("Ошибка при сохранении конфигурации. Проверьте права на файл.");
    }
});

// Запускаем парсинг при старте
loadConfigToUI();