window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    volLabel: document.getElementById('volume-level'),
    progressBar: document.getElementById('yt-progress-bar'), 
    isReady: false,
    progressInterval: null, 

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
        
        this.progressBar.style.width = '0%';
        
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
        this.stopProgress(); 
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
            
            this.volLabel.classList.remove('animate-pop');
            void this.volLabel.offsetWidth; 
            this.volLabel.classList.add('animate-pop');
        }
    },

    handleStateChange: function(event) {
        if (event.data === 1) { // PLAYING
            this.container.classList.add('is-playing');
            this.startProgress(); 
            // Лиса начинает вайбовать (качать головой)
            if (window.AppPet) window.AppPet.setEmotion('jam');

        } else { // PAUSED / BUFFERING
            this.container.classList.remove('is-playing');
            this.stopProgress(); 
            // Лиса перестает вайбовать если музыка на паузе
            if (window.AppPet && window.AppPet.currentState === 'jam') {
                window.AppPet.setEmotion('idle');
            }
        }
        
        if (event.data === 0) { // ENDED
            this.progressBar.style.width = '0%';
            window.AppQueue.next();
        }
    },

    startProgress: function() {
        if (this.progressInterval) clearInterval(this.progressInterval);
        
        this.progressInterval = setInterval(() => {
            if (this.yt && this.yt.getCurrentTime && this.yt.getDuration) {
                const currentTime = this.yt.getCurrentTime();
                const totalTime = this.yt.getDuration();
                
                if (totalTime > 0) {
                    const percent = (currentTime / totalTime) * 100;
                    this.progressBar.style.width = `${percent}%`;
                }
            }
        }, 500); 
    },

    stopProgress: function() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
};

function onYouTubeIframeAPIReady() { window.AppPlayer.init(); }

if (window.YT && window.YT.Player && !window.AppPlayer.isReady) {
    window.AppPlayer.init();
}