/* ФАЙЛ: js/mod-deck/queue.js */

window.DeckQueue = {
    init() {
        // Мы больше не читаем LocalStorage. 
        // Мы ПРОСТО СЛУШАЕМ ЯДРО через Event Bus.
        window.AppEvents.listen('QUEUE_FULL_SYNC', data => {
            this.render(data.nowPlaying, data.items);
        });

        // Запрашиваем состояние при старте
        setTimeout(() => {
            window.AppEvents.emit('STATE_SYNC_REQUEST');
        }, 1500);
    },

    render(nowPlaying, queueItems) {
        const queueList = document.getElementById('deck-queue-list');
        if (!queueList) return;
        
        // Если нет ни очереди, ни текущего трека
        if ((!queueItems || queueItems.length === 0) && !nowPlaying) {
            queueList.innerHTML = '<div class="queue-empty">Очередь пуста</div>';
            return;
        }
        
        let html = '';
        
        // 1. РЕНДЕР ТЕКУЩЕГО ТРЕКА (СЕЙЧАС ИГРАЕТ)
        if (nowPlaying) {
            const title = nowPlaying.title || nowPlaying.id;
            // Анимация эквалайзера всегда активна, так как панель не следит за микро-паузами (буферизацией)
            const barsHtml = `<div class="q-anim-bars"><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div></div>`;
            
            html += `
                <div class="queue-item playing-now">
                    ${barsHtml}
                    <div class="q-info">
                        <div class="q-title" title="${title}">${title}</div>
                        <div class="q-user">Сейчас играет (от ${nowPlaying.user})</div>
                    </div>
                </div>
            `;
        }
        
        // 2. РЕНДЕР ОСТАЛЬНОЙ ОЧЕРЕДИ
        if (queueItems && queueItems.length > 0) {
            const limit = Math.min(queueItems.length, 4); // Показываем до 4 следующих треков
            
            for(let i = 0; i < limit; i++) {
                const item = queueItems[i];
                const title = item.title || item.id;
                
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
            if(queueItems.length > 4) html += `<div class="queue-more">+ еще ${queueItems.length - 4} треков</div>`;
        }
        
        queueList.innerHTML = html;
    }
};