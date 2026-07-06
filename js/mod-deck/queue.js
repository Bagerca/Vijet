/* ФАЙЛ: js/mod-deck/queue.js */
window.DeckQueue = {
    init() {
        window.AppEvents.listen('QUEUE_FULL_SYNC', data => {
            this.render(data.nowPlaying, data.items);
        });

        setTimeout(() => {
            window.AppEvents.emit('STATE_SYNC_REQUEST');
        }, 1500);
    },

    render(nowPlaying, queueItems) {
        const queueList = document.getElementById('deck-queue-list');
        if (!queueList) return;
        
        if ((!queueItems || queueItems.length === 0) && !nowPlaying) {
            queueList.innerHTML = '<div class="queue-empty">Очередь пуста</div>';
            return;
        }
        
        let html = '';
        
        // 1. РЕНДЕР ТЕКУЩЕГО ТРЕКА (С ПРЕВЬЮ YOUTUBE)
        if (nowPlaying) {
            const title = nowPlaying.title || nowPlaying.id;
            const isVid = nowPlaying.type === 'video';
            const thumbUrl = isVid ? `https://img.youtube.com/vi/${nowPlaying.id}/mqdefault.jpg` : '';
            
            // Если это видео, рисуем картинку, иначе просто заглушку
            const thumbHtml = isVid 
                ? `<div class="q-pip-thumb" style="background-image: url('${thumbUrl}')"></div>` 
                : `<div class="q-pip-thumb no-thumb">PL</div>`;

            const barsHtml = `<div class="q-anim-bars"><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div></div>`;
            
            html += `
                <div class="queue-item playing-now">
                    <div class="q-pip-wrapper">
                        ${thumbHtml}
                        ${barsHtml}
                    </div>
                    <div class="q-info">
                        <div class="q-title" title="${title}">${title}</div>
                        <div class="q-user">Сейчас играет (от ${nowPlaying.user})</div>
                    </div>
                </div>
            `;
        }
        
        // 2. РЕНДЕР ОСТАЛЬНОЙ ОЧЕРЕДИ (С КНОПКОЙ УДАЛЕНИЯ)
        if (queueItems && queueItems.length > 0) {
            const limit = Math.min(queueItems.length, 6); // Увеличил до 6
            
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
                        <button class="btn-remove-track" data-idx="${i}" title="Удалить трек">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            }
            if(queueItems.length > limit) html += `<div class="queue-more">+ еще ${queueItems.length - limit} треков</div>`;
        }
        
        queueList.innerHTML = html;
    }
};