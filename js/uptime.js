/* ФАЙЛ: js/uptime.js */
/* ================= ВИДЖЕТ ТАЙМЕРА СТРИМА (UPTIME) ================= */
window.AppUptime = {
    container: document.getElementById('uptime-container'),
    valueEl: document.getElementById('uptime-value'),
    dotEl: document.querySelector('#uptime-container .uptime-dot'),
    
    startTime: null,
    timerInterval: null,
    isTestMode: false,
    isLive: false,

    init: function() {
        if (!this.container) return;

        // Слушаем команды
        window.AppEvents.listen('UPTIME_CMD', d => {
            if (d.cmd === 'test') this.enableTestMode();
            else if (d.cmd === 'on' || d.cmd === 'show') this.toggle(true);
            else if (d.cmd === 'off' || d.cmd === 'hide') this.toggle(false);
        });

        this.fetchStreamStatus();
        // Проверяем статус каждые 30 секунд
        setInterval(() => this.fetchStreamStatus(), 30000);

        // Обновляем секундомер каждую секунду
        this.timerInterval = setInterval(() => this.tick(), 1000);
    },

    toggle: function(state) {
        if (state) this.container.classList.remove('hidden');
        else this.container.classList.add('hidden');
    },

    fetchStreamStatus: async function() {
        if (this.isTestMode) return;

        try {
            const data = await window.AppUtils.safeFetch(`https://api.ivr.fi/v2/twitch/user?login=${window.AppConfig.channelName}`);
            if (data && data.length > 0) {
                const user = data[0];
                if (user.stream && user.stream.createdAt) {
                    this.startTime = new Date(user.stream.createdAt).getTime();
                    this.isLive = true;
                    this.container.classList.remove('hidden');
                    if (this.dotEl) this.dotEl.style.background = '#FF0050';
                } else {
                    this.isLive = false;
                    this.startTime = null;
                    this.valueEl.innerText = "OFFLINE";
                    if (this.dotEl) this.dotEl.style.background = '#888888';
                }
            }
        } catch (err) {
            console.warn("[Uptime] Не удалось получить статус стрима.");
        }
    },

    enableTestMode: function() {
        this.isTestMode = true;
        this.isLive = true;
        // Ставим фейковый старт: 1 час 23 минуты 45 секунд назад
        this.startTime = Date.now() - (1 * 3600 + 23 * 60 + 45) * 1000;
        this.container.classList.remove('hidden');
        if (this.dotEl) this.dotEl.style.background = '#FF0050';
        this.tick();
    },

    tick: function() {
        if (!this.isLive || !this.startTime) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        if (elapsed < 0) return;

        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        const pad = (num) => String(num).padStart(2, '0');

        if (hours > 0) {
            this.valueEl.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        } else {
            this.valueEl.innerText = `${pad(minutes)}:${pad(seconds)}`;
        }
    }
};

setTimeout(() => window.AppUptime.init(), 1000);