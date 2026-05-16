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
        
        // Когда анимация прокрутки текста заканчивается
        this.textEl.addEventListener('animationend', () => {
            this.textEl.classList.remove('scrolling');
            this.container.classList.remove('visible');
            this.isPlaying = false;
            
            // Если в очереди есть еще срочные сообщения - показываем через секунду
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), 1000);
            } else {
                this.scheduleNext();
            }
        });
        
        this.scheduleNext();
    },

    scheduleNext: function() {
        clearTimeout(this.timerId);
        const interval = window.AppConfig.tickerInterval || 60000;
        
        this.timerId = setTimeout(() => {
            const msgs = window.AppConfig.tickerMessages;
            // Берем случайное сообщение из дефолтных
            this.queue.push(msgs[Math.floor(Math.random() * msgs.length)]);
            this.processQueue();
        }, interval);
    },

    processQueue: function() {
        if (this.isPlaying || this.queue.length === 0) return;
        
        this.isPlaying = true; 
        clearTimeout(this.timerId);
        
        // Достаем первое сообщение из очереди
        this.textEl.innerHTML = this.queue.shift();
        this.container.classList.add('visible');
        
        // Перезапуск анимации CSS
        void this.textEl.offsetWidth;
        this.textEl.classList.add('scrolling');
    },

    // Спец-сообщение: Заказ Музыки
    showMusicEvent: async function(videoId, user) {
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await response.json();
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #1a1a1a;">${data.title}</span>`;
            this.queue.unshift(msg); // Вставляем вне очереди (самым первым)
            this.processQueue();
        } catch (err) {
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал новый трек!`;
            this.queue.unshift(msg);
            this.processQueue();
        }
    },

    // Спец-сообщение: ЛЮБАЯ Награда за Баллы Канала
    showRewardEvent: function(user, rewardName, userInput) {
        let msg = `<span style="color: #FF4477; font-weight: 800;">💎 ${user}</span> активировал награду: <span style="color: #1a1a1a; font-weight: 800;">${rewardName}</span>`;
        
        // Если зритель ввел текст (например, "Задай вопрос" или "Выпей воды"), добавляем его в строку
        if (userInput && userInput.trim() !== "") {
            // Экранируем HTML на всякий случай
            const cleanInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            msg += ` <span style="color: rgba(0,0,0,0.5); font-style: italic;">"${cleanInput}"</span>`;
        }
        
        this.queue.unshift(msg); // Ставим в начало очереди (чтобы вылезло сразу)
        this.processQueue();
    }
};

window.AppTicker.init();