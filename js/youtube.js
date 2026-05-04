window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    volLabel: document.getElementById('volume-level'),
    isReady: false,

    init: function() {
        this.yt = new YT.Player('yt-player', {
            playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'modestbranding': 1 },
            events: {
                'onReady': () => { 
                    this.isReady = true;
                    this.setVolume(window.AppConfig.defaultVolume);
                },
                'onStateChange': this.handleStateChange.bind(this),
                'onError': () => { window.AppQueue.next(); }
            }
        });
    },

    play: function(videoId, user) {
        if (!this.isReady) return;
        this.nameLabel.innerText = user;
        this.container.classList.remove('hidden');
        this.yt.loadVideoById(videoId);
    },

    hide: function() {
        this.container.classList.add('hidden');
        this.container.classList.remove('is-playing');
        if (this.isReady && this.yt.stopVideo) this.yt.stopVideo();
    },

    setVolume: function(vol) {
        if (this.isReady) {
            let safeVol = Math.max(0, Math.min(100, parseInt(vol) || window.AppConfig.defaultVolume));
            this.yt.setVolume(safeVol);
            this.volLabel.innerText = safeVol; 
        }
    },

    handleStateChange: function(event) {
        if (event.data === 1) {
            this.container.classList.add('is-playing'); 
        } else {
            this.container.classList.remove('is-playing'); 
        }
        if (event.data === 0) {
            window.AppQueue.next();
        }
    }
};

function onYouTubeIframeAPIReady() { window.AppPlayer.init(); }