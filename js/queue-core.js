/* ФАЙЛ: js/queue-core.js */
/* ================= ОЧЕРЕДЬ МУЗЫКИ (MASTER) ================= */
window.AppQueueCore = {
    items: [],
    isPlaying: false,
    nowPlaying: null, // Текущий играющий трек

    init: function() {
        const saved = localStorage.getItem('uso_queue');
        if (saved) { try { this.items = JSON.parse(saved); } catch(e) { this.items = []; } }

        // Слушаем команды
        window.AppEvents.listen('QUEUE_ADD', d => this.add(d.url, d.user));
        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'next') this.next();
            if (d.cmd === 'clear') this.clear();
        });

        // Слушаем статусы плеера
        window.AppEvents.listen('YT_ENDED', () => this.next());
        
        window.AppEvents.listen('YT_CORE_READY', () => {
            if (this.items.length > 0 && !this.isPlaying) {
                console.log("🔄 [QUEUE] Восстанавливаем треки из памяти...");
                this.next();
            }
        });

        // НОВОЕ: Отвечаем Mod Deck'у полной информацией об очереди по запросу
        window.AppEvents.listen('STATE_SYNC_REQUEST', () => {
            this.broadcastFullState();
        });
        
        setTimeout(() => this.broadcastFullState(), 2000);
    },

    extractData: function(url) {
        if (!url) return null;
        let str = url.trim();
        const listMatch = str.match(/[?&]list=([^#&?]+)/);
        if (listMatch) return { type: 'playlist', id: listMatch[1] };
        let cleanUrl = str.replace(/.*?http/, 'http');
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = cleanUrl.match(regExp);
        if (match && match[2].length === 11) return { type: 'video', id: match[2] };
        if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return { type: 'video', id: str };
        return null;
    },

    add: async function(url, user) {
        console.log(`📥 [QUEUE] Запрос от ${user}: ${url}`);
        const ytData = this.extractData(url);
        
        if (ytData) {
            console.log(`✅ [QUEUE] Распознан формат: ${ytData.type}, ID: ${ytData.id}`);
            
            // Пытаемся получить название заранее, чтобы панель модера не тупила
            let title = ytData.id;
            if (ytData.type === 'video') {
                try {
                    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.id}&format=json`);
                    const data = await res.json();
                    title = data.title;
                } catch(e) {}
            } else {
                title = "Плейлист";
            }

            const item = { type: ytData.type, id: ytData.id, user: user, title: title };
            this.items.push(item);
            
            this.save();
            window.AppEvents.emit('TICKER_MUSIC', { data: ytData, user: user });
            
            if (!this.isPlaying) this.next();
            else this.broadcastFullState(); // Обновляем Mod Deck
        } else {
            console.error(`❌ [QUEUE] Ошибка: Не удалось распознать ссылку "${url}"`);
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            this.nowPlaying = this.items.shift();
            this.save();
            
            console.log(`▶️ [QUEUE] Отправляем трек/плейлист в плеер:`, this.nowPlaying);
            window.AppEvents.emit('YT_CORE_PLAY', this.nowPlaying);
            this.broadcastFullState(); // Обновляем Mod Deck
        } else {
            console.log("📭 [QUEUE] Очередь пуста.");
            this.isPlaying = false;
            this.nowPlaying = null;
            this.save();
            
            window.AppEvents.emit('YT_CORE_HIDE');
            this.broadcastFullState(); // Обновляем Mod Deck
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
        window.AppEvents.emit('QUEUE_STATE', { count: this.items.length }); // Для виджета на стриме
    },

    // НОВОЕ: Транслируем полную правду в шину
    broadcastFullState: function() {
        window.AppEvents.emit('QUEUE_FULL_SYNC', {
            nowPlaying: this.nowPlaying,
            items: this.items
        });
    }
};
window.AppQueueCore.init();