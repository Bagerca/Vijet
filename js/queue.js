window.AppQueue = {
    items: [],
    isPlaying: false,

    add: function(url, user) {
        const videoId = this.extractId(url);
        if (videoId) {
            this.items.push({ id: videoId, user: user });
            if (!this.isPlaying) this.next();
        }
    },

    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextVideo = this.items.shift();
            window.AppPlayer.play(nextVideo.id, nextVideo.user);
        } else {
            this.isPlaying = false;
            window.AppPlayer.hide();
        }
    },

    clear: function() {
        this.items = [];
        this.next(); 
    },

    extractId: function(url) {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }
};