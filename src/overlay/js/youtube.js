/* ФАЙЛ: js/youtube.js */
/* ================= YOUTUBE ВИДЖЕТ (GPU OPTIMIZED) ================= */
window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    avatarEl: document.getElementById('requester-avatar'), 
    volLabel: document.getElementById('volume-level'),
    queueCount: document.getElementById('queue-count'),
    progressBar: document.getElementById('yt-progress-bar'), 
    isReady: false,

    init: function() {
        window.AppEvents.listen('YT_VISUAL_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_VISUAL_HIDE', () => this.hide());
        window.AppEvents.listen('YT_VISUAL_VOL', d => this.updateVol(d.vol));
        window.AppEvents.listen('YT_VISUAL_STATE', d => this.updateState(d.state));
        window.AppEvents.listen('YT_VISUAL_PROGRESS', d => this.updateProgress(d));
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
                tag.onerror = () => console.warn("📺 [YT VISUAL] YouTube API заблокирован.");
                document.head.appendChild(tag);
            }
        }
    },

    createPlayer: function() {
        if (!document.getElementById('yt-player')) return;
        this.yt = new YT.Player('yt-player', {
            playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'modestbranding': 1, 'playsinline': 1, 'mute': 1, 'origin': window.location.origin },
            events: { 'onReady': () => { this.isReady = true; this.yt.mute(); } }
        });
    },

    play: function(data) {
        if (!this.isReady) return;
        if (this.nameLabel) this.nameLabel.innerText = data.user;
        if (this.avatarEl) {
            window.AvatarManager.get(data.user, '#FF4477').then(url => {
                this.avatarEl.src = url;
                window.AppUtils.restartAnimation(this.avatarEl, 'pop-avatar');
            });
        }
        this.updateVol(data.vol);
        if (this.container) this.container.classList.remove('hidden');
        
        // ОПТИМИЗАЦИЯ: Сброс шкалы через transform
        if (this.progressBar) this.progressBar.style.transform = 'scaleX(0)';
        
        this.yt.loadVideoById(data.id);
        this.yt.mute(); 
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
        window.AppUtils.restartAnimation(this.volLabel, 'animate-pop');
    },

    updateState: function(state) {
        if (!this.container) return;
        if (state === 'playing') this.container.classList.add('is-playing');
        else this.container.classList.remove('is-playing');
    },

    updateProgress: function(data) {
        let percent = data.percent !== undefined ? data.percent : data;
        
        // ОПТИМИЗАЦИЯ: Используем scaleX вместо width для аппаратного ускорения
        if(this.progressBar) {
            this.progressBar.style.transform = `scaleX(${percent / 100})`;
        }

        // ФИКС РАССИНХРОНА: Увеличен допуск до 2.5 секунд
        if (this.isReady && this.yt && typeof this.yt.getCurrentTime === 'function' && data.currentTime !== undefined) {
            const visualState = this.yt.getPlayerState();
            if (visualState === 1 || visualState === 3) { 
                const visualTime = this.yt.getCurrentTime();
                const diff = Math.abs(visualTime - data.currentTime);
                if (diff > 2.5) { this.yt.seekTo(data.currentTime, true); }
            }
        }
    },
    
    updateQueue: function(count) {
        if (!this.queueCount) return;
        this.queueCount.innerText = count;
        window.AppUtils.restartAnimation(this.queueCount, 'animate-pop');
    }
};
window.AppPlayer.init();