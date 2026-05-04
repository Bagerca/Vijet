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

        // Слушаем момент, когда текст уедет за край
        this.textEl.addEventListener('animationend', () => {
            this.textEl.classList.remove('scrolling');
            this.container.classList.remove('visible'); // Прячем капсулу
            this.isPlaying = false;
            
            // Если в очереди есть еще приоритетные сообщения (например, 2 заказа подряд)
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), 1000);
            } else {
                this.scheduleNext(); // Запускаем стандартный таймер (2 мин)
            }
        });

        // Запускаем первый таймер
        this.scheduleNext();
    },

    scheduleNext: function() {
        clearTimeout(this.timerId);
        
        // 120000 мс = 2 минуты
        const interval = window.AppConfig.tickerInterval || 120000;
        
        this.timerId = setTimeout(() => {
            // Выбираем случайное сообщение
            const msgs = window.AppConfig.tickerMessages;
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            
            this.queue.push(randomMsg);
            this.processQueue();
        }, interval);
    },

    processQueue: function() {
        // Защита от двойного запуска
        if (this.isPlaying || this.queue.length === 0) return;
        
        this.isPlaying = true;
        clearTimeout(this.timerId); // Глушим фоновый таймер

        // Берем первое сообщение из очереди
        const text = this.queue.shift();
        this.textEl.innerHTML = text;
        
        // Показываем капсулу
        this.container.classList.add('visible');
        
        // Хак для перезапуска анимации
        void this.textEl.offsetWidth;
        
        // Запускаем анимацию (15 секунд на проезд одного сообщения - комфортная скорость)
        this.textEl.classList.add('scrolling');
    },

    // Метод перехвата заказа музыки
    showMusicEvent: async function(videoId, user) {
        try {
            // Крутая фишка: получаем название видео легально, без ключей API (OEmbed)
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await response.json();
            const title = data.title;
            
            // Формируем красивое сообщение с выделением цветом
            const msg = `<span style="color: #9146FF; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #fff;">${title}</span>`;
            
            // Ставим его В НАЧАЛО очереди (приоритет)
            this.queue.unshift(msg);
            
            // Если сейчас ничего не едет - запускаем немедленно. 
            // Если едет - сообщение покажется сразу после текущего.
            this.processQueue();
            
        } catch (err) {
            // Если YT API OEmbed заглючил, показываем базовый текст
            const msg = `<span style="color: #9146FF; font-weight: 800;">🎵 ${user}</span> заказал новый трек!`;
            this.queue.unshift(msg);
            this.processQueue();
        }
    }
};

window.AppTicker.init();