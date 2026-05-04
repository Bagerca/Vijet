window.AppQueue = {
    items: [],
    isPlaying: false,

    add: function(url, user) {
        const videoId = this.extractId(url);
        if (videoId) {
            this.items.push({ id: videoId, user: user });
            this.updateStats(); 
            
            // НОВОЕ: Передаем информацию в бегущую строку для показа уведомления
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
        this.next(); 
    },

    updateStats: function() {
        const countEl = document.getElementById('queue-count');
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