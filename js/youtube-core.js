/* ================= YOUTUBE CORE ПЛЕЕР ================= */
window.AppPlayerCore = {
    yt: null,
    isReady: false,
    currentVol: window.AppConfig.defaultVolume,
    progressInterval: null,

    init: function() {
        this.yt = new YT.Player('yt-player-core', {
            host: 'https://www.youtube-nocookie.com', // ФИКС: Обходим блокировщики рекламы и трекеров
            playerVars: { 
                'autoplay': 1, 
                'controls': 0,
                'origin': window.location.origin // ФИКС: Обязательно для API
            },
            events: {
                'onReady': () => {
                    this.isReady = true;
                    this.setVolume(this.currentVol);
                    // Сообщаем очереди, что плеер готов к работе!
                    window.AppEvents.emit('YT_CORE_READY');
                },
                'onStateChange': this.handleStateChange.bind(this),
                'onError': (e) => {
                    console.warn("[YT CORE] Ошибка видео. Скипаем.", e);
                    window.AppEvents.emit('YT_ENDED');
                }
            }
        });

        window.AppEvents.listen('YT_CORE_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_CORE_HIDE', () => this.hide());
        window.AppEvents.listen('PLAYER_VOL', d => this.setVolume(d.vol));
    },

    play: function(data) {
        if (!this.isReady) {
            console.warn("[YT CORE] Плеер еще не готов! Запрос проигнорирован.");
            return;
        }
        this.yt.loadVideoById(data.id);
        this.yt.unMute();
        
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
                if (tot > 0) {
                    window.AppEvents.emit('YT_VISUAL_PROGRESS', { percent: (cur / tot) * 100 });
                }
            }
        }, 500);
    },

    stopProgress: function() {
        if (this.progressInterval) clearInterval(this.progressInterval);
    }
};

function onYouTubeIframeAPIReady() { window.AppPlayerCore.init(); }
if (window.YT && window.YT.Player && !window.AppPlayerCore.isReady) { window.AppPlayerCore.init(); }