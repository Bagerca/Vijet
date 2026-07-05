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

    extractData: function(url) {
        if (!url) return null;
        let str = url.trim();
        
        // Поиск плейлиста
        const listMatch = str.match(/[?&]list=([^#&?]+)/);
        if (listMatch) return { type: 'playlist', id: listMatch[1] };
        
        // Поиск стандартного видео
        let cleanUrl = str.replace(/.*?http/, 'http');
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = cleanUrl.match(regExp);
        if (match && match[2].length === 11) return { type: 'video', id: match[2] };
        
        // Если скинули просто 11-значный ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return { type: 'video', id: str };
        
        return null;
    },

    add: function(url, user) {
        console.log(`📥 [QUEUE] Запрос от ${user}: ${url}`);
        const ytData = this.extractData(url);
        
        if (ytData) {
            console.log(`✅ [QUEUE] Распознан формат: ${ytData.type}, ID: ${ytData.id}`);
            this.items.push({ type: ytData.type, id: ytData.id, user: user });
            this.save();
            window.AppEvents.emit('TICKER_MUSIC', { data: ytData, user: user });
            
            if (!this.isPlaying) this.next();
        } else {
            console.error(`❌ [QUEUE] Ошибка: Не удалось распознать ссылку "${url}"`);
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextItem = this.items.shift();
            this.save();
            console.log(`▶️ [QUEUE] Отправляем трек/плейлист в плеер:`, nextItem);
            window.AppEvents.emit('YT_CORE_PLAY', nextItem);
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
    }
};
window.AppQueueCore.init();