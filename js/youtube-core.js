/* ================= YOUTUBE CORE ПЛЕЕР ================= */
window.AppPlayerCore = {
    yt: null,
    isReady: false,
    currentVol: window.AppConfig.defaultVolume,
    progressInterval: null,

    init: function() {
        window.AppEvents.listen('YT_CORE_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_CORE_HIDE', () => this.hide());
        window.AppEvents.listen('PLAYER_VOL', d => this.setVolume(d.vol));
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
        if (!document.getElementById('yt-player-core')) return;
        
        this.yt = new YT.Player('yt-player-core', {
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'origin': window.location.origin 
            },
            events: {
                'onReady': () => {
                    this.isReady = true;
                    this.setVolume(this.currentVol);
                    window.AppEvents.emit('YT_CORE_READY');
                },
                'onStateChange': this.handleStateChange.bind(this),
                'onError': (e) => {
                    // РАСШИФРОВКА ОШИБОК YOUTUBE
                    let reason = "Неизвестная ошибка";
                    if (e.data === 101 || e.data === 150) reason = "Запрещено правообладателем";
                    else if (e.data === 100) reason = "Видео удалено или скрыто";
                    else if (e.data === 2) reason = "Неверная ссылка";
                    
                    console.error(`❌ [YT CORE] Ошибка: ${reason} (Код ${e.data})`);
                    
                    // Выводим причину скипа в бегущую строку!
                    window.AppEvents.emit('TICKER_REWARD', { 
                        user: "Система", 
                        reward: "Трек пропущен", 
                        message: reason 
                    });
                    
                    // Пропускаем сломанный трек
                    window.AppEvents.emit('YT_ENDED');
                }
            }
        });
    },

    play: function(data) {
        if (!this.isReady) return;
        
        this.yt.loadVideoById(data.id);
        
        setTimeout(() => {
            this.yt.unMute();
            this.yt.playVideo();
        }, 300);

        window.AppEvents.emit('YT_VISUAL_PLAY', { id: data.id, user: data.user, vol: this.currentVol });
    },

    hide: function() {
        if (this.isReady) this.yt.stopVideo();
        this.stopProgress();
        window.AppEvents.emit('YT_VISUAL_HIDE');
    },

    setVolume: function(vol) {
        if (this.isReady) {
            this.currentVol = Math.max(0, Math.min(100, parseInt(vol) || window.AppConfig.defaultVolume));
            this.yt.unMute();
            this.yt.setVolume(this.currentVol);
            window.AppEvents.emit('YT_VISUAL_VOL', { vol: this.currentVol });
        }
    },

    handleStateChange: function(event) {
        if (event.data === 1) { // PLAYING
            this.startProgress();
            window.AppEvents.emit('PET_EMOTION', { emotion: 'jam' });
            window.AppEvents.emit('YT_VISUAL_STATE', { state: 'playing' });
        } else if (event.data === 2) { // PAUSED
            this.stopProgress();
            window.AppEvents.emit('PET_EMOTION', { emotion: 'idle' });
            window.AppEvents.emit('YT_VISUAL_STATE', { state: 'paused' });
        }
        if (event.data === 0) { // ENDED
            window.AppEvents.emit('YT_ENDED');
        }
    },

    startProgress: function() {
        if (this.progressInterval) clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
            if (this.yt && this.yt.getCurrentTime && this.yt.getDuration) {
                const cur = this.yt.getCurrentTime();
                const tot = this.yt.getDuration();
                if (tot > 0) window.AppEvents.emit('YT_VISUAL_PROGRESS', { percent: (cur / tot) * 100 });
            }
        }, 500);
    },

    stopProgress: function() {
        if (this.progressInterval) clearInterval(this.progressInterval);
    }
};
window.AppPlayerCore.init();