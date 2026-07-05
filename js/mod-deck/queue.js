window.DeckQueue = {
    init() {
        this.sync();
        window.addEventListener('storage', (e) => {
            if (e.key === 'uso_queue') this.sync();
        });
    },

    sync() {
        const queueList = document.getElementById('deck-queue-list');
        if (!queueList) return;
        
        try {
            const q = JSON.parse(localStorage.getItem('uso_queue') || '[]');
            if (q.length === 0) {
                queueList.innerHTML = '<div class="queue-empty">Очередь пуста</div>';
                return;
            }
            
            let html = '';
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