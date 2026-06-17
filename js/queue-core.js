/* ================= ОЧЕРЕДЬ МУЗЫКИ (С ПОДДЕРЖКОЙ SAFE MODE И НАЗВАНИЙ) ================= */
window.AppQueueCore = {
    items: [],
    isPlaying: false,
    isAutoPlay: true, 

    init: function() {
        const saved = localStorage.getItem('uso_queue');
        if (saved) { try { this.items = JSON.parse(saved); } catch(e) { this.items = []; } }

        window.AppEvents.listen('QUEUE_ADD', d => this.add(d.url, d.user));
        
        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'next') this.next();
            if (d.cmd === 'clear') this.clear();
            if (d.cmd === 'autoplay_off') this.isAutoPlay = false;
            if (d.cmd === 'autoplay_on') { 
                this.isAutoPlay = true; 
                if (!this.isPlaying && this.items.length > 0) this.next(); 
            }
        });

        window.AppEvents.listen('YT_ENDED', () => this.next());
        
        window.AppEvents.listen('YT_CORE_READY', () => {
            if (this.items.length > 0 && !this.isPlaying && this.isAutoPlay) {
                console.log("🔄 [QUEUE] Восстанавливаем треки из памяти...");
                this.next();
            }
        });
        
        setTimeout(() => this.broadcastState(), 2000);
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

    // Сделали асинхронным, чтобы вытягивать название
    add: async function(url, user) {
        console.log(`📥 [QUEUE] Запрос от ${user}: ${url}`);
        const ytData = this.extractData(url);
        
        if (ytData) {
            
            // Фетчим название видео через YouTube oEmbed API
            if (ytData.type === 'video') {
                try {
                    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.id}&format=json`);
                    const data = await response.json();
                    ytData.title = data.title;
                } catch (e) {
                    ytData.title = `YouTube Video [${ytData.id}]`;
                }
            } else {
                ytData.title = `Плейлист [${ytData.id}]`;
            }

            // Добавляем title в объект
            this.items.push({ type: ytData.type, id: ytData.id, user: user, title: ytData.title });
            this.save();
            window.AppEvents.emit('TICKER_MUSIC', { data: ytData, user: user });
            
            if (!this.isPlaying && this.isAutoPlay) {
                this.next();
            } else if (!this.isAutoPlay && !this.isPlaying) {
                console.log("🛡️ [SAFE MODE] Трек добавлен в очередь, но автовоспроизведение отключено.");
            }
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
        this.items = [];
        this.save();
        this.next(); 
    },

    save: function() {
        localStorage.setItem('uso_queue', JSON.stringify(this.items));
        this.broadcastState();
    },

    broadcastState: function() {
        window.AppEvents.emit('QUEUE_STATE', { count: this.items.length, items: this.items });
        if (window.AppCoreState) window.AppCoreState.broadcastFullState('local');
    }
};
window.AppQueueCore.init();