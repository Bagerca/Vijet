/* ================= ОЧЕРЕДЬ МУЗЫКИ (SINGLE SOURCE OF TRUTH) ================= */
window.AppQueueCore = {
    isPlaying: false,
    isAutoPlay: true, 

    init: function() {
        // Мы больше не читаем localStorage! Все данные лежат в AppCoreState.queue

        window.AppEvents.listen('QUEUE_ADD', d => this.add(d.url, d.user));
        
        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'next') this.next();
            if (d.cmd === 'clear') this.clear();
            if (d.cmd === 'autoplay_off') this.isAutoPlay = false;
            if (d.cmd === 'autoplay_on') { 
                this.isAutoPlay = true; 
                if (!this.isPlaying && window.AppCoreState.queue.length > 0) this.next(); 
            }
        });

        window.AppEvents.listen('YT_ENDED', () => this.next());
        
        window.AppEvents.listen('YT_CORE_READY', () => {
            if (window.AppCoreState.queue.length > 0 && !this.isPlaying && this.isAutoPlay) {
                console.log("🔄 [QUEUE] Визуал готов, восстанавливаем очередь...");
                this.next();
            }
        });
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
            if (ytData.type === 'video') {
                try {
                    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.id}&format=json`);
                    const data = await response.json();
                    ytData.title = data.title;
                } catch (e) { ytData.title = `YouTube Video [${ytData.id}]`; }
            } else {
                ytData.title = `Плейлист [${ytData.id}]`;
            }

            // Добавляем трек в глобальное состояние и оповещаем все виджеты
            const newQueue = [...window.AppCoreState.queue, { type: ytData.type, id: ytData.id, user: user, title: ytData.title }];
            window.AppCoreState.update({ queue: newQueue });
            
            window.AppEvents.emit('TICKER_MUSIC', { data: ytData, user: user });
            
            if (!this.isPlaying && this.isAutoPlay) {
                this.next();
            }
        }
    },

    next: function() {
        if (window.AppCoreState.queue.length > 0) {
            this.isPlaying = true;
            
            const nextQueue = [...window.AppCoreState.queue];
            const nextItem = nextQueue.shift();
            
            window.AppCoreState.update({ queue: nextQueue });
            
            console.log(`▶️ [QUEUE] Запуск трека:`, nextItem);
            window.AppEvents.emit('YT_CORE_PLAY', nextItem);
        } else {
            console.log("📭 [QUEUE] Очередь пуста.");
            this.isPlaying = false;
            window.AppEvents.emit('YT_CORE_HIDE');
        }
    },

    clear: function() {
        window.AppCoreState.update({ queue: [] });
        this.next(); 
    }
};