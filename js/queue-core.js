/* ================= ОЧЕРЕДЬ МУЗЫКИ ================= */
window.AppQueueCore = {
    items: [],
    isPlaying: false,

    init: function() {
        const saved = localStorage.getItem('uso_queue');
        if (saved) { try { this.items = JSON.parse(saved); } catch(e) { this.items = []; } }

        window.AppEvents.listen('QUEUE_ADD', d => this.add(d.url, d.user));
        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'next') this.next();
            if (d.cmd === 'clear') this.clear();
        });

        window.AppEvents.listen('YT_ENDED', () => this.next());
        
        window.AppEvents.listen('YT_CORE_READY', () => {
            if (this.items.length > 0 && !this.isPlaying) {
                console.log("🔄 [QUEUE] Восстанавливаем треки из памяти...");
                this.next();
            }
        });
        
        setTimeout(() => this.broadcastState(), 2000);
    },

    add: function(url, user) {
        console.log(`📥 [QUEUE] Запрос от ${user}: ${url}`);
        const videoId = this.extractId(url);
        
        if (videoId) {
            console.log(`✅ [QUEUE] Распознан ID: ${videoId}`);
            this.items.push({ id: videoId, user: user });
            this.save();
            window.AppEvents.emit('TICKER_MUSIC', { videoId, user });
            
            if (!this.isPlaying) this.next();
        } else {
            console.error(`❌ [QUEUE] Ошибка: Не удалось получить ID из ссылки "${url}"`);
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextVideo = this.items.shift();
            this.save();
            console.log(`▶️ [QUEUE] Отправляем трек в плеер:`, nextVideo);
            window.AppEvents.emit('YT_CORE_PLAY', nextVideo);
        } else {
            console.log("📭 [QUEUE] Очередь пуста.");
            this.isPlaying = false;
            this.save();
            window.AppEvents.emit('YT_CORE_HIDE');
        }
    },

    clear: function() {
        console.log("🧹 [QUEUE] Очередь очищена!");
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
        if (!url) return null;
        let cleanUrl = url.replace(/.*?http/, 'http').trim();
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = cleanUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
};
window.AppQueueCore.init();