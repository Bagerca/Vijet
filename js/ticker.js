/* ================= БЕГУЩАЯ СТРОКА 2.0 (Constant Velocity Engine + 3D) ================= */
window.AppTicker = {
    container: document.getElementById('ticker-container'),
    maskEl: document.getElementById('ticker-mask'),
    textEl: document.getElementById('ticker-text'),
    badgeTextEl: document.getElementById('ticker-badge-text'),
    badgeDotEl: document.querySelector('#ticker-badge .t-dot'),
    
    queue: [], 
    isPlaying: false, 
    timerId: null,
    textTimerId: null, // Добавлен таймер для текста
    speed: window.AppConfig.tickerSpeed || 120, // пикселей в секунду

    init: function() {
        if (!window.AppConfig.tickerMessages || window.AppConfig.tickerMessages.length === 0) {
            this.container.style.display = 'none'; 
            return;
        }
        
        window.AppEvents.listen('TICKER_MUSIC', d => this.showMusicEvent(d.data, d.user));
        window.AppEvents.listen('TICKER_REWARD', d => this.showRewardEvent(d.user, d.reward, d.message));
        window.AppEvents.listen('TICKER_CUSTOM', d => this.forceShowImmediate(d.msg, d.badge, d.color));
        
        // Слушаем ТОЛЬКО окончание движения transform у текста (защита от двойных срабатываний)
        this.textEl.addEventListener('transitionend', (e) => {
            if (e.propertyName !== 'transform') return; 
            this.finishCurrentItem();
        });
        
        this.scheduleNext();
    },

    scheduleNext: function() {
        clearTimeout(this.timerId);
        const interval = window.AppConfig.tickerInterval || 60000;
        this.timerId = setTimeout(() => {
            const msgs = window.AppConfig.tickerMessages;
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            this.queue.push({ html: randomMsg, badge: "ИНФО", color: "#00FF7F" });
            this.processQueue();
        }, interval);
    },

    processQueue: function() {
        if (this.isPlaying || this.queue.length === 0) return;
        this.isPlaying = true; 
        
        clearTimeout(this.timerId);
        clearTimeout(this.textTimerId);
        
        const item = this.queue.shift();
        
        // 1. Устанавливаем новые данные
        this.badgeTextEl.innerText = item.badge;
        this.badgeDotEl.style.backgroundColor = item.color;
        this.badgeDotEl.style.boxShadow = `0 0 10px ${item.color}`;
        this.textEl.innerHTML = item.html;
        
        // 2. Отключаем анимации текста перед замерами
        this.textEl.style.transition = 'none';
        
        // 3. ФИКС БАГА ШИРИНЫ: Снимаем display: none ДО вычисления размеров
        this.container.classList.remove('hidden');
        this.container.classList.remove('is-leaving');
        void this.container.offsetWidth; // ЖЕСТКИЙ ПЕРЕСЧЕТ DOM БРАУЗЕРОМ
        
        // 4. Теперь безопасно вычисляем физику
        const maskWidth = this.maskEl.offsetWidth;
        const textWidth = this.textEl.scrollWidth;
        
        // Прячем текст за правый край маски
        this.textEl.style.transform = `translate3d(${maskWidth}px, 0, 0)`;
        void this.textEl.offsetWidth; // Применяем позицию без анимации
        
        const distance = maskWidth + textWidth; 
        const duration = distance / this.speed;

        // 5. Запускаем 3D-анимацию появления контейнера
        this.container.classList.add('visible'); 
        
        // 6. Запускаем движение текста с задержкой (ждем пока вылетит плашка)
        this.textTimerId = setTimeout(() => {
            this.textEl.style.transition = `transform ${duration}s linear`;
            this.textEl.style.transform = `translate3d(-${textWidth + 50}px, 0, 0)`;
        }, 800); 
    },

    finishCurrentItem: function() {
        this.container.classList.remove('visible');
        this.container.classList.add('is-leaving');
        this.textEl.style.transition = 'none'; // Останавливаем текст
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.classList.remove('is-leaving');
            this.isPlaying = false;
            
            // Если в очереди что-то есть (например, заказали музыку) — пускаем сразу
            if (this.queue.length > 0) this.processQueue();
            else this.scheduleNext();
        }, 600); // Время ухода плашки (из CSS)
    },

    forceShowImmediate: function(msg, badgeName = "СИСТЕМА", color = "#FF4477") {
        clearTimeout(this.timerId);
        clearTimeout(this.textTimerId);
        
        const newItem = { html: msg, badge: badgeName, color: color };
        
        if (this.isPlaying) {
            // Если строка сейчас на экране — красиво убираем её и подменяем сообщение
            this.container.classList.remove('visible');
            this.container.classList.add('is-leaving');
            this.textEl.style.transition = 'none'; 
            
            setTimeout(() => {
                this.container.classList.add('hidden');
                this.container.classList.remove('is-leaving');
                this.isPlaying = false;
                this.queue.unshift(newItem); // Ставим первым в очередь
                this.processQueue();
            }, 600);
        } else {
            this.queue.unshift(newItem);
            this.processQueue();
        }
    },

    showMusicEvent: async function(ytData, user) {
        let msg = '';
        if (ytData.type === 'playlist') {
            msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал целый плейлист!`;
            this.forceShowImmediate(msg, "МУЗЫКА", "#FF4477");
        } else {
            try {
                const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.id}&format=json`);
                const data = await response.json();
                msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #fff;">${data.title}</span>`;
            } catch (err) {
                msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал новую музыку!`;
            }
            this.forceShowImmediate(msg, "МУЗЫКА", "#FF4477");
        }
    },

    showRewardEvent: function(user, rewardName, userInput) {
        let msg = `<span style="color: #00FF7F; font-weight: 800;">💎 ${user}</span> активировал: <span style="color: #fff; font-weight: 800;">${rewardName}</span>`;
        if (userInput && userInput.trim() !== "") {
            const cleanInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
            msg += ` <span style="color: rgba(255,255,255,0.6); font-style: italic;">"${cleanInput}"</span>`;
        }
        this.forceShowImmediate(msg, "НАГРАДА", "#00FF7F");
    }
};

window.AppTicker.init();