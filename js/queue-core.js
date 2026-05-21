/* ================= ОЧЕРЕДЬ МУЗЫКИ (Только для core.html) ================= */
window.AppQueueCore = {
    items: [],
    isPlaying: false,

    init: function() {
        const saved = localStorage.getItem('uso_queue');
        if (saved) {
            try { this.items = JSON.parse(saved); } catch(e) { this.items = []; }
        }

        // Слушаем команды из чата
        window.AppEvents.listen('QUEUE_ADD', d => this.add(d.url, d.user));
        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'next') this.next();
            if (d.cmd === 'clear') this.clear();
        });

        // Когда плеер закончил трек
        window.AppEvents.listen('YT_ENDED', () => this.next());
        
        // Отправляем счетчик виджетам (с задержкой для прогрузки)
        setTimeout(() => this.broadcastState(), 2000);
    },

    add: function(url, user) {
        const videoId = this.extractId(url);
        if (videoId) {
            this.items.push({ id: videoId, user: user });
            this.save();
            
            // Отправляем бегущей строке уведомление
            window.AppEvents.listen('TICKER_MUSIC', { videoId, user });
            
            if (!this.isPlaying) this.next();
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextVideo = this.items.shift();
            this.save();
            
            // Отправляем команду скрытому плееру играть
            window.AppEvents.emit('YT_CORE_PLAY', nextVideo);
        } else {
            this.isPlaying = false;
            this.save();
            // Выключаем всё
            window.AppEvents.emit('YT_CORE_HIDE');
        }
    },

    clear: function() {
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
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }
};

setTimeout(() => window.AppQueueCore.init(), 1000);