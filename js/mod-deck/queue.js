/* ФАЙЛ: js/mod-deck/queue.js */

window.DeckQueue = {
    nowPlaying: null,

    init() {
        this.sync();
        
        // Слушаем изменения в будущей очереди
        window.addEventListener('storage', (e) => {
            if (e.key === 'uso_queue') this.sync();
        });

        // Слушаем синхронизацию от Ядра, чтобы знать, что играет ПРЯМО СЕЙЧАС
        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => {
            if (state.youtube && state.youtube.currentId) {
                this.nowPlaying = {
                    id: state.youtube.currentId,
                    user: state.youtube.currentUser || "Системы",
                    isPaused: !state.youtube.isPlaying
                };
            } else {
                this.nowPlaying = null;
            }
            this.sync();
        });
    },

    sync() {
        const queueList = document.getElementById('deck-queue-list');
        if (!queueList) return;
        
        try {
            const q = JSON.parse(localStorage.getItem('uso_queue') || '[]');
            
            // Если нет ни очереди, ни текущего трека — пишем, что пусто
            if (q.length === 0 && !this.nowPlaying) {
                queueList.innerHTML = '<div class="queue-empty">Очередь пуста</div>';
                return;
            }
            
            let html = '';
            
            // 1. РЕНДЕР ТЕКУЩЕГО ТРЕКА (СЕЙЧАС ИГРАЕТ)
            if (this.nowPlaying) {
                let title = this.nowPlaying.id;
                let cacheKey = 'yt_title_' + this.nowPlaying.id;
                let cachedTitle = sessionStorage.getItem(cacheKey);
                
                if (cachedTitle) {
                    title = cachedTitle;
                } else if (window.AppUtils) {
                    window.AppUtils.safeFetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${this.nowPlaying.id}&format=json`)
                        .then(data => {
                            if(data?.title) {
                                sessionStorage.setItem(cacheKey, data.title);
                                this.sync(); 
                            }
                        }).catch(() => {});
                }

                const barsHtml = this.nowPlaying.isPaused 
                    ? `<div class="q-anim-bars paused"><div class="q-bar" style="height:30%"></div><div class="q-bar" style="height:30%"></div><div class="q-bar" style="height:30%"></div></div>`
                    : `<div class="q-anim-bars"><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div></div>`;
                
                html += `
                    <div class="queue-item playing-now">
                        ${barsHtml}
                        <div class="q-info">
                            <div class="q-title" title="${title}">${title}</div>
                            <div class="q-user">Сейчас играет (от ${this.nowPlaying.user})</div>
                        </div>
                    </div>
                `;
            }
            
            // 2. РЕНДЕР ОСТАЛЬНОЙ ОЧЕРЕДИ
            const limit = Math.min(q.length, 3); 
            
            for(let i = 0; i < limit; i++) {
                const item = q[i];
                let title = item.id;
                let cacheKey = 'yt_title_' + item.id;
                let cachedTitle = sessionStorage.getItem(cacheKey);
                
                if (cachedTitle) {
                    title = cachedTitle;
                } else if (item.type === 'video' && window.AppUtils) {
                    window.AppUtils.safeFetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${item.id}&format=json`)
                        .then(data => {
                            if(data?.title) {
                                sessionStorage.setItem(cacheKey, data.title);
                                this.sync(); 
                            }
                        }).catch(() => {});
                } else if (item.type === 'playlist') {
                    title = "Плейлист (Сложно определить)";
                }
                
                html += `
                    <div class="queue-item">
                        <span class="q-idx">${i+1}</span>
                        <div class="q-info">
                            <div class="q-title" title="${title}">${title}</div>
                            <div class="q-user">от ${item.user}</div>
                        </div>
                    </div>
                `;
            }
            if(q.length > 3) html += `<div class="queue-more">+ еще ${q.length - 3} треков</div>`;
            queueList.innerHTML = html;
        } catch(e) {
            console.warn("[USO] Ошибка парсинга очереди:", e);
        }
    }
};