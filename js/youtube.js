window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    volLabel: document.getElementById('volume-level'),
    isReady: false,

    init: function() {
        this.yt = new YT.Player('yt-player', {
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'disablekb': 1, 
                'modestbranding': 1,
                'playsinline': 1 
            },
            events: {
                'onReady': () => { 
                    this.isReady = true;
                    this.yt.unMute(); // Гарантированно включаем звук
                    this.setVolume(window.AppConfig.defaultVolume);
                },
                'onStateChange': this.handleStateChange.bind(this),
                'onError': (e) => { 
                    console.log("YouTube Error:", e);
                    window.AppQueue.next(); 
                }
            }
        });
    },

    play: function(videoId, user) {
        if (!this.isReady) return;
        this.nameLabel.innerText = user;
        this.container.classList.remove('hidden');
        
        // Попытка запустить принудительно
        this.yt.loadVideoById(videoId);
        this.yt.playVideo(); 
    },

    hide: function() {
        this.container.classList.add('hidden');
        this.container.classList.remove('is-playing');
        if (this.isReady) {
            this.yt.stopVideo();
        }
    },

    setVolume: function(vol) {
        if (this.isReady) {
            let safeVol = Math.max(0, Math.min(100, parseInt(vol) || window.AppConfig.defaultVolume));
            this.yt.unMute(); // Обязательно unMute, иначе громкость не сработает
            this.yt.setVolume(safeVol);
            this.volLabel.innerText = safeVol;
        }
    },

    handleStateChange: function(event) {
        if (event.data === 1) { // PLAYING
            this.container.classList.add('is-playing');
        } else {
            this.container.classList.remove('is-playing');
        }
        if (event.data === 0) { // ENDED
            window.AppQueue.next();
        }
    }
};

function onYouTubeIframeAPIReady() { window.AppPlayer.init(); }