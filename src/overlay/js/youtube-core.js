/* ФАЙЛ: js/youtube-core.js */
/* ================= YOUTUBE CORE ПЛЕЕР ================= */
window.AppPlayerCore = {
    yt: null,
    isReady: false,
    currentVol: window.AppConfig.defaultVolume,
    isDucking: false, 
    progressInterval: null,
    currentItem: null,
    currentVisualId: null,

    init: function() {
        window.AppEvents.listen('YT_CORE_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_CORE_HIDE', () => this.hide());
        window.AppEvents.listen('PLAYER_VOL', d => this.setVolume(d.vol));
        
        window.AppEvents.listen('AUDIO_DUCK_START', () => {
            this.isDucking = true;
            if (this.isReady && this.yt) this.yt.setVolume(Math.max(1, this.currentVol * 0.15));
        });
        window.AppEvents.listen('AUDIO_DUCK_STOP', () => {
            this.isDucking = false;
            if (this.isReady && this.yt) this.yt.setVolume(this.currentVol);
        });

        window.AppEvents.listen('QUEUE_CMD', d => {
            if (d.cmd === 'skip_all') {
                window.AppEvents.emit('YT_ENDED'); 
            } else if (d.cmd === 'skip_track') {
                if (this.currentItem && this.currentItem.type === 'playlist') {
                    let pl = this.yt.getPlaylist();
                    let idx = this.yt.getPlaylistIndex();
                    if (pl && idx < pl.length - 1) this.yt.nextVideo();
                    else window.AppEvents.emit('YT_ENDED');
                } else {
                    window.AppEvents.emit('YT_ENDED');
                }
            }
        });

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
            if (!document.getElementById('yt-api-script-core')) {
                const tag = document.createElement('script');
                tag.id = 'yt-api-script-core';
                tag.src = "https://www.youtube.com/iframe_api";
                tag.onerror = () => console.warn("🎵 [YT CORE] YouTube недоступен (заблокирован). Аудио-плеер отключен.");
                document.head.appendChild(tag);
            }
        }
    },

    createPlayer: function() {
        if (!document.getElementById('yt-player-core')) return;
        
        this.yt = new YT.Player('yt-player-core', {
            playerVars: { 'autoplay': 1, 'controls': 0, 'origin': window.location.origin },
            events: {
                'onReady': () => {
                    this.isReady = true;
                    this.setVolume(this.currentVol);
                    window.AppEvents.emit('YT_CORE_READY');
                },
                'onStateChange': this.handleStateChange.bind(this),
                'onError': (e) => {
                    let reason = "Ограничения правообладателя или видео удалено";
                    window.AppEvents.emit('TICKER_REWARD', { user: "Система", reward: "Трек недоступен", message: reason });
                    
                    if (this.currentItem && this.currentItem.type === 'playlist') {
                        let pl = this.yt.getPlaylist();
                        let idx = this.yt.getPlaylistIndex();
                        if (pl && idx === pl.length - 1) window.AppEvents.emit('YT_ENDED');
                    } else {
                        window.AppEvents.emit('YT_ENDED');
                    }
                }
            }
        });
    },

    play: function(data) {
        if (!this.isReady) return;
        this.currentItem = data;
        this.currentVisualId = null; 
        
        if (data.type === 'playlist') this.yt.loadPlaylist({ list: data.id });
        else this.yt.loadVideoById(data.id);
        
        setTimeout(() => {
            this.yt.unMute();
            this.yt.playVideo();
        }, 300);
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
            
            if (!this.isDucking) this.yt.setVolume(this.currentVol);
            window.AppEvents.emit('YT_VISUAL_VOL', { vol: this.currentVol });
        }
    },

    handleStateChange: function(event) {
        if (event.data === 1) { // PLAYING
            let actualVidId = this.yt.getVideoData().video_id;
            
            if (actualVidId !== this.currentVisualId && this.currentItem) {
                this.currentVisualId = actualVidId;
                window.AppEvents.emit('YT_VISUAL_PLAY', { 
                    id: actualVidId, user: this.currentItem.user, vol: this.currentVol 
                });
            }
            
            this.startProgress();
            window.AppEvents.emit('PET_BASE_STATE', { state: 'jam', active: true });
            window.AppEvents.emit('YT_VISUAL_STATE', { state: 'playing' });
            
        } else if (event.data === 2) { // PAUSED
            this.stopProgress();
            window.AppEvents.emit('PET_BASE_STATE', { state: 'jam', active: false });
            window.AppEvents.emit('YT_VISUAL_STATE', { state: 'paused' });
            
        } else if (event.data === 0) { // ENDED
            window.AppEvents.emit('PET_BASE_STATE', { state: 'jam', active: false });
            if (this.currentItem && this.currentItem.type === 'playlist') {
                let pl = this.yt.getPlaylist();
                let idx = this.yt.getPlaylistIndex();
                if (!pl || idx === pl.length - 1) window.AppEvents.emit('YT_ENDED');
            } else {
                window.AppEvents.emit('YT_ENDED');
            }
        }
    },

    startProgress: function() {
        if (this.progressInterval) clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
            if (this.yt && this.yt.getCurrentTime && this.yt.getDuration) {
                const cur = this.yt.getCurrentTime();
                const tot = this.yt.getDuration();
                if (tot > 0) window.AppEvents.emit('YT_VISUAL_PROGRESS', { percent: (cur / tot) * 100, currentTime: cur });
            }
        }, 500);
    },

    stopProgress: function() {
        if (this.progressInterval) clearInterval(this.progressInterval);
    }
};
window.AppPlayerCore.init();