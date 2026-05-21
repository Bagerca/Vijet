/* ================= ОЧЕРЕДЬ МУЗЫКИ (Только для core.html) ================= */
window.AppQueueCore = {
    items: [],
    isPlaying: false,

    init: function() {
        const saved = localStorage.getItem('uso_queue');
        if (saved) {
            try { this.items = JSON.parse(saved); } catch(e) { this.items = []; }
        }

        window.AppEvents.listen('QUEUE_ADD', d => this.add(d.url, d.user));
        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'next') this.next();
            if (d.cmd === 'clear') this.clear();
        });

        window.AppEvents.listen('YT_ENDED', () => {
            console.log("[QUEUE] Плеер закончил играть трек. Переключаю...");
            this.next();
        });
        
        setTimeout(() => this.broadcastState(), 2000);
    },

    add: function(url, user) {
        console.log(`[QUEUE] Пришел заказ от ${user}. Ссылка: ${url}`);
        const videoId = this.extractId(url);
        
        if (videoId) {
            console.log(`[QUEUE] Ссылка успешно распознана! ID видео: ${videoId}`);
            this.items.push({ id: videoId, user: user });
            this.save();
            
            window.AppEvents.emit('TICKER_MUSIC', { videoId, user });
            
            if (!this.isPlaying) this.next();
            else console.log(`[QUEUE] Трек добавлен в очередь. Позиция: ${this.items.length}`);
        } else {
            console.error(`[QUEUE ❌] ОШИБКА: Не удалось достать ID из ссылки! Ссылка инвалидна или формат не поддерживается.`);
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextVideo = this.items.shift();
            this.save();
            console.log(`[QUEUE] Запускаю следующий трек:`, nextVideo);
            window.AppEvents.emit('YT_CORE_PLAY', nextVideo);
        } else {
            console.log("[QUEUE] Очередь пуста. Выключаю плеер.");
            this.isPlaying = false;
            this.save();
            window.AppEvents.emit('YT_CORE_HIDE');
        }
    },

    clear: function() {
        console.log("[QUEUE] Очередь принудительно очищена.");
        this.items = [];
        this.save();
        this.next();
    },

    save: function() {
        localStorage.setItem('uso_queue', JSON.stringify(this.items));
        this.broadcastState();
    },

    broadcastState: function() {
        window.AppEvents.emit('QUEUE_STATE', { count: this.items.length });
    },

    extractId: function(url) {
        // Улучшенная регулярка, которая ловит и обычные ссылки, и Shorts, и мобильные youtu.be, и параметры с таймингами
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }
};

setTimeout(() => window.AppQueueCore.init(), 1000);