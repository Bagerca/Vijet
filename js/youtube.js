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
                    this.yt.unMute(); 
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
        
        // Запускаем через mute -> unmute, чтобы обойти блокировку автоплея браузером
        this.yt.loadVideoById(videoId);
        this.yt.mute(); 
        this.yt.playVideo(); 
        
        setTimeout(() => {
            this.yt.unMute();
            this.yt.setVolume(parseInt(this.volLabel.innerText) || window.AppConfig.defaultVolume);
        }, 500);
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
            this.yt.unMute(); 
            this.yt.setVolume(safeVol);
            
            this.volLabel.innerText = safeVol;
            
            // Перезапуск анимации цифры (эффект подпрыгивания)
            this.volLabel.classList.remove('animate-pop');
            void this.volLabel.offsetWidth; // Принудительная перерисовка
            this.volLabel.classList.add('animate-pop');
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

// Запасной запуск для OBS, если API загрузилось раньше скрипта
if (window.YT && window.YT.Player && !window.AppPlayer.isReady) {
    window.AppPlayer.init();
}