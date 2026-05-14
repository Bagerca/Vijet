window.AppQueue = {
    items: [],
    isPlaying: false,

    init: function() {
        // Восстанавливаем очередь из хранилища
        const savedQueue = localStorage.getItem('uso_queue');
        if (savedQueue) {
            try {
                this.items = JSON.parse(savedQueue);
                this.updateStats();
                
                // Если после перезагрузки в очереди остались треки, запускаем первый
                if (this.items.length > 0) {
                    setTimeout(() => { this.next(); }, 2000); // Задержка, чтобы плеер успел прогрузиться
                }
            } catch (e) {
                console.error("[Queue] Ошибка чтения очереди из localStorage", e);
                this.items = [];
            }
        }
    },

    saveQueue: function() {
        // Сохраняем текущий массив очереди в хранилище
        localStorage.setItem('uso_queue', JSON.stringify(this.items));
    },

    add: function(url, user) {
        const videoId = this.extractId(url);
        if (videoId) {
            this.items.push({ id: videoId, user: user });
            this.updateStats(); 
            this.saveQueue(); // Сохраняем изменение
            
            // Передаем информацию в бегущую строку для показа уведомления
            if (window.AppTicker) {
                window.AppTicker.showMusicEvent(videoId, user);
            }

            if (!this.isPlaying) this.next();
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextVideo = this.items.shift();
            
            this.updateStats(); 
            this.saveQueue(); // Сохраняем изменение (удалили трек из очереди)
            
            window.AppPlayer.play(nextVideo.id, nextVideo.user);
        } else {
            this.isPlaying = false;
            this.updateStats();
            window.AppPlayer.hide();
        }
    },

    clear: function() {
        this.items = [];
        this.updateStats();
        this.saveQueue(); // Сохраняем очистку
        this.next(); 
    },

    updateStats: function() {
        const countEl = document.getElementById('queue-count');
        if (!countEl) return;
        countEl.innerText = this.items.length;
        
        countEl.classList.remove('animate-pop');
        void countEl.offsetWidth; 
        countEl.classList.add('animate-pop');
    },

    extractId: function(url) {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }
};

// Инициализация очереди
setTimeout(() => window.AppQueue.init(), 500);