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
        
        // Когда текст докрутился до конца
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

    // ===============================================
    // СИСТЕМА СРОЧНОГО ПЕРЕХВАТА СТРОКИ
    // ===============================================
    forceShowImmediate: function(msg) {
        // Если строка сейчас работает, жестко ее останавливаем
        this.textEl.classList.remove('scrolling');
        this.container.classList.remove('visible');
        this.isPlaying = false;
        clearTimeout(this.timerId);
        
        // Ставим наше важное сообщение САМЫМ ПЕРВЫМ в очередь
        this.queue.unshift(msg);
        
        // Ждем 500мс (пока строка уедет вниз по CSS-анимации) и запускаем заново
        setTimeout(() => {
            this.processQueue();
        }, 500);
    },

    // Спец-сообщение: Заказ Музыки
    showMusicEvent: async function(videoId, user) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await response.json();
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #1a1a1a;">${data.title}</span>`;
            this.forceShowImmediate(msg);
        } catch (err) {
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал новый трек!`;
            this.forceShowImmediate(msg);
        }
    },

    // Спец-сообщение: ЛЮБАЯ Награда за Баллы Канала
    showRewardEvent: function(user, rewardName, userInput) {
        let msg = `<span style="color: #FF4477; font-weight: 800;">💎 ${user}</span> активировал: <span style="color: #1a1a1a; font-weight: 800;">${rewardName}</span>`;
        
        // Если зритель ввел текст, добавляем его в строку курсивом
        if (userInput && userInput.trim() !== "") {
            const cleanInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // защита от ломающего HTML кода
            msg += ` <span style="color: rgba(0,0,0,0.5); font-style: italic;">"${cleanInput}"</span>`;
        }
        
        this.forceShowImmediate(msg);
    }
};

window.AppTicker.init();