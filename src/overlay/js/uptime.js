/* ФАЙЛ: js/uptime.js */
/* ================= ВИДЖЕТ ТАЙМЕРА СТРИМА (STUDIO PILL) ================= */
window.AppUptime = {
    container: document.getElementById('uptime-container'),
    
    startTime: null,
    timerInterval: null,
    isTestMode: false,
    isLive: false,

    init: function() {
        if (!this.container) return;

        // Внедряем новый стильный HTML
        this.container.innerHTML = `
            <div class="up-live-pill" id="up-pill-bg">
                <div class="up-dot" id="up-dot"></div>
                <span class="up-live-text" id="up-text">В ЭФИРЕ</span>
            </div>
            <div class="up-divider"></div>
            <div id="uptime-value" class="up-time">00:00:00</div>
        `;

        this.valueEl = document.getElementById('uptime-value');
        this.dotEl = document.getElementById('up-dot');
        this.pillBg = document.getElementById('up-pill-bg');
        this.textEl = document.getElementById('up-text');

        // Слушаем команды
        window.AppEvents.listen('UPTIME_CMD', d => {
            if (d.cmd === 'test') this.enableTestMode();
            else if (d.cmd === 'on' || d.cmd === 'show') this.toggle(true);
            else if (d.cmd === 'off' || d.cmd === 'hide') this.toggle(false);
        });

        this.fetchStreamStatus();
        setInterval(() => this.fetchStreamStatus(), 30000);

        this.timerInterval = setInterval(() => this.tick(), 1000);
    },

    toggle: function(state) {
        if (state) this.container.classList.remove('hidden');
        else this.container.classList.add('hidden');
    },

    setUIState: function(isLive) {
        if (isLive) {
            this.dotEl.style.background = '#FF0050';
            this.dotEl.style.boxShadow = '0 0 8px #FF0050';
            this.textEl.innerText = 'В ЭФИРЕ';
            this.textEl.style.color = '#FF0050';
            this.pillBg.style.background = 'rgba(255, 0, 80, 0.1)';
            this.pillBg.style.borderColor = 'rgba(255, 0, 80, 0.15)';
        } else {
            this.dotEl.style.background = '#888888';
            this.dotEl.style.boxShadow = 'none';
            this.textEl.innerText = 'ОФФЛАЙН';
            this.textEl.style.color = '#888888';
            this.pillBg.style.background = 'rgba(0, 0, 0, 0.05)';
            this.pillBg.style.borderColor = 'rgba(0, 0, 0, 0.05)';
        }
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
                    this.setUIState(true);
                    this.container.classList.remove('hidden');
                } else {
                    this.isLive = false;
                    this.startTime = null;
                    this.valueEl.innerText = "00:00:00";
                    this.setUIState(false);
                }
            }
        } catch (err) {
            console.warn("[Uptime] Не удалось получить статус стрима.");
        }
    },

    enableTestMode: function() {
        this.isTestMode = true;
        this.isLive = true;
        // Фейковый старт: 1 час 23 минуты 45 секунд назад
        this.startTime = Date.now() - (1 * 3600 + 23 * 60 + 45) * 1000;
        this.setUIState(true);
        this.container.classList.remove('hidden');
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