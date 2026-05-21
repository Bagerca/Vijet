/* ================= YOUTUBE ВИДЖЕТ ================= */
window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    volLabel: document.getElementById('volume-level'),
    queueCount: document.getElementById('queue-count'),
    progressBar: document.getElementById('yt-progress-bar'), 
    isReady: false,

    init: function() {
        window.AppEvents.listen('YT_VISUAL_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_VISUAL_HIDE', () => this.hide());
        window.AppEvents.listen('YT_VISUAL_VOL', d => this.updateVol(d.vol));
        window.AppEvents.listen('YT_VISUAL_STATE', d => this.updateState(d.state));
        window.AppEvents.listen('YT_VISUAL_PROGRESS', d => this.updateProgress(d.percent));
        window.AppEvents.listen('QUEUE_STATE', d => this.updateQueue(d.count));

        this.loadYouTubeAPI();
    },

    loadYouTubeAPI: function() {
        if (window.YT && window.YT.Player) {
            this.createPlayer();
        } else {
            const oldOnReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (oldOnReady) oldOnReady();
                this.createPlayer();
            };
            if (!document.getElementById('yt-api-script')) {
                const tag = document.createElement('script');
                tag.id = 'yt-api-script';
                tag.src = "https://www.youtube.com/iframe_api";
                document.head.appendChild(tag);
            }
        }
    },

    createPlayer: function() {
        if (!document.getElementById('yt-player')) return;
        
        this.yt = new YT.Player('yt-player', {
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'disablekb': 1, 
                'modestbranding': 1, 
                'playsinline': 1, 
                'mute': 1, // Виджет всегда в муте
                'origin': window.location.origin 
            },
            events: {
                'onReady': () => { 
                    this.isReady = true;
                    this.yt.mute(); 
                    console.log("📺 [YT VISUAL] Визуальный плеер успешно загружен!");
                }
            }
        });
    },

    play: function(data) {
        if (!this.isReady) return;
        if (this.nameLabel) this.nameLabel.innerText = data.user;
        this.updateVol(data.vol);
        if (this.container) this.container.classList.remove('hidden');
        if (this.progressBar) this.progressBar.style.width = '0%';
        
        this.yt.loadVideoById(data.id);
        this.yt.mute(); // Страховка
        this.yt.playVideo(); 
    },

    hide: function() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.container.classList.remove('is-playing');
        }
        if (this.isReady) this.yt.stopVideo();
    },

    updateVol: function(vol) {
        if(!this.volLabel) return;
        this.volLabel.innerText = vol;
        this.volLabel.classList.remove('animate-pop');
        void this.volLabel.offsetWidth; 
        this.volLabel.classList.add('animate-pop');
    },

    updateState: function(state) {
        if (!this.container) return;
        if (state === 'playing') this.container.classList.add('is-playing');
        else this.container.classList.remove('is-playing');
    },

    updateProgress: function(percent) {
        if(this.progressBar) this.progressBar.style.width = `${percent}%`;
    },
    
    updateQueue: function(count) {
        if (!this.queueCount) return;
        this.queueCount.innerText = count;
        this.queueCount.classList.remove('animate-pop');
        void this.queueCount.offsetWidth;
        this.queueCount.classList.add('animate-pop');
    }
};
window.AppPlayer.init();