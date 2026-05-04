window.AppQueue = {
    items: [],
    isPlaying: false,

    add: function(url, user) {
        const videoId = this.extractId(url);
        if (videoId) {
            this.items.push({ id: videoId, user: user });
            this.updateStats(); 
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
        document.getElementById('queue-count').innerText = this.items.length;
    },

    extractId: function(url) {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }
};