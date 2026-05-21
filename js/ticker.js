window.AppTicker = {
    container: document.getElementById('ticker-container'),
    textEl: document.getElementById('ticker-text'),
    queue: [], 
    isPlaying: false, 
    timerId: null,

    init: function() {
        if (!window.AppConfig.tickerMessages || window.AppConfig.tickerMessages.length === 0) {
            this.container.style.display = 'none'; 
            return;
        }
        
        // Подписка на события (обновлено для поддержки плейлистов)
        window.AppEvents.listen('TICKER_MUSIC', d => this.showMusicEvent(d.data, d.user));
        window.AppEvents.listen('TICKER_REWARD', d => this.showRewardEvent(d.user, d.reward, d.message));
        
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
        const interval = window.AppConfig.tickerInterval || 60000;
        this.timerId = setTimeout(() => {
            const msgs = window.AppConfig.tickerMessages;
            this.queue.push(msgs[Math.floor(Math.random() * msgs.length)]);
            this.processQueue();
        }, interval);
    },

    processQueue: function() {
        if (this.isPlaying || this.queue.length === 0) return;
        this.isPlaying = true; 
        clearTimeout(this.timerId);
        
        this.textEl.innerHTML = this.queue.shift();
        this.container.classList.add('visible');
        void this.textEl.offsetWidth;
        this.textEl.classList.add('scrolling');
    },

    forceShowImmediate: function(msg) {
        this.textEl.classList.remove('scrolling');
        this.container.classList.remove('visible');
        this.isPlaying = false;
        clearTimeout(this.timerId);
        
        this.queue.unshift(msg);
        setTimeout(() => this.processQueue(), 500);
    },

    showMusicEvent: async function(ytData, user) {
        try {
            if (ytData.type === 'playlist') {
                const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал целый плейлист!`;
                this.forceShowImmediate(msg);
            } else {
                const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.id}&format=json`);
                const data = await response.json();
                const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #1a1a1a;">${data.title}</span>`;
                this.forceShowImmediate(msg);
            }
        } catch (err) {
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал новую музыку!`;
            this.forceShowImmediate(msg);
        }
    },

    showRewardEvent: function(user, rewardName, userInput) {
        let msg = `<span style="color: #FF4477; font-weight: 800;">💎 ${user}</span> активировал: <span style="color: #1a1a1a; font-weight: 800;">${rewardName}</span>`;
        if (userInput && userInput.trim() !== "") {
            const cleanInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
            msg += ` <span style="color: rgba(0,0,0,0.5); font-style: italic;">"${cleanInput}"</span>`;
        }
        this.forceShowImmediate(msg);
    }
};

window.AppTicker.init();