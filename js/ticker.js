window.AppTicker = {
    // ... [часть кода оставлена для экономии места, скопируй полностью] ...
    container: document.getElementById('ticker-container'),
    textEl: document.getElementById('ticker-text'),
    queue: [], isPlaying: false, timerId: null,

    init: function() {
        if (!window.AppConfig.tickerMessages || window.AppConfig.tickerMessages.length === 0) {
            this.container.style.display = 'none'; return;
        }
        this.textEl.addEventListener('animationend', () => {
            this.textEl.classList.remove('scrolling');
            this.container.classList.remove('visible');
            this.isPlaying = false;
            if (this.queue.length > 0) setTimeout(() => this.processQueue(), 1000);
            else this.scheduleNext();
        });
        this.scheduleNext();
    },
    scheduleNext: function() {
        clearTimeout(this.timerId);
        const interval = window.AppConfig.tickerInterval || 120000;
        this.timerId = setTimeout(() => {
            const msgs = window.AppConfig.tickerMessages;
            this.queue.push(msgs[Math.floor(Math.random() * msgs.length)]);
            this.processQueue();
        }, interval);
    },
    processQueue: function() {
        if (this.isPlaying || this.queue.length === 0) return;
        this.isPlaying = true; clearTimeout(this.timerId);
        this.textEl.innerHTML = this.queue.shift();
        this.container.classList.add('visible');
        void this.textEl.offsetWidth;
        this.textEl.classList.add('scrolling');
    },
    showMusicEvent: async function(videoId, user) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await response.json();
            // СВЕТЛАЯ ТЕМА: Имя розовое, название песни темное
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #1a1a1a;">${data.title}</span>`;
            this.queue.unshift(msg);
            this.processQueue();
        } catch (err) {
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал новый трек!`;
            this.queue.unshift(msg);
            this.processQueue();
        }
    }
};
window.AppTicker.init();