/* ================= YOUTUBE ВИДЖЕТ (MUTED VISUAL ONLY) ================= */
window.AppPlayer = {
    yt: null,
    isReady: false,
    
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    avatarEl: document.getElementById('requester-avatar'), 
    volLabel: document.getElementById('volume-level'),
    queueCount: document.getElementById('queue-count'),
    progressBar: document.getElementById('yt-progress-bar'), 
    
    pendingData: null, 

    init: function() {
        window.AppEvents.listen('YT_VISUAL_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_VISUAL_HIDE', () => this.hide());
        window.AppEvents.listen('YT_VISUAL_VOL', d => this.updateVolUI(d.vol));
        window.AppEvents.listen('YT_VISUAL_STATE', d => this.updateState(d.state));
        window.AppEvents.listen('YT_VISUAL_PROGRESS', d => this.syncProgress(d));
        window.AppEvents.listen('QUEUE_STATE', d => this.updateQueueUI(d.count));

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
        
        let safeOrigin = window.location.origin;
        if (!safeOrigin || safeOrigin === 'null' || safeOrigin.startsWith('file')) {
            safeOrigin = 'https://www.youtube.com'; 
        }
        
        this.yt = new YT.Player('yt-player', {
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'disablekb': 1, 
                'modestbranding': 1, 
                'playsinline': 1, 
                'mute': 1, // ВИЗУАЛ ВСЕГДА В МУТЕ!
                'origin': safeOrigin 
            },
            events: {
                'onReady': () => { 
                    this.isReady = true;
                    this.yt.mute(); 
                    console.log("%c[YT VISUAL] 📺 Визуальный плеер загружен!", "color: #00FF7F");
                    
                    if (this.pendingData) {
                        this.play(this.pendingData);
                        this.pendingData = null;
                    }
                }
            }
        });
    },

    play: function(data) {
        if (this.container) this.container.classList.remove('hidden');
        if (this.nameLabel) this.nameLabel.innerText = data.user;
        if (this.progressBar) this.progressBar.style.width = '0%';
        this.updateVolUI(data.vol);
        this.updateAvatar(data.user);

        if (!this.isReady) {
            this.pendingData = data;
            return;
        }
        
        if (data.type === 'playlist') {
            this.yt.loadPlaylist({ list: data.id });
        } else {
            this.yt.loadVideoById(data.id);
        }
        
        // Жёстко мутим
        this.yt.mute(); 
        this.yt.playVideo(); 
    },

    hide: function() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.container.classList.remove('is-playing');
        }
        if (this.isReady && this.yt && typeof this.yt.stopVideo === 'function') {
            this.yt.stopVideo();
        }
    },

    updateVolUI: function(vol) {
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

    syncProgress: function(data) {
        if(this.progressBar) this.progressBar.style.width = `${data.percent}%`;

        // СИНХРОНИЗАЦИЯ: Визуал догоняет Ядро
        if (this.isReady && this.yt && typeof this.yt.getCurrentTime === 'function' && data.currentTime !== undefined) {
            const visualState = this.yt.getPlayerState();
            
            if (visualState === 1 || visualState === 3) { 
                const visualTime = this.yt.getCurrentTime();
                const diff = Math.abs(visualTime - data.currentTime);
                
                // Если картинка отстала/убежала от звука больше чем на 1 секунду — перематываем картинку
                if (diff > 1.0) {
                    console.log(`[YT VISUAL 🔄] Выравниваем картинку под звук! Разница: ${diff.toFixed(2)}с`);
                    this.yt.seekTo(data.currentTime, true);
                }
            }
        }
    },
    
    updateQueueUI: function(count) {
        if (!this.queueCount) return;
        this.queueCount.innerText = count;
        this.queueCount.classList.remove('animate-pop');
        void this.queueCount.offsetWidth;
        this.queueCount.classList.add('animate-pop');
    },

    updateAvatar: async function(user) {
        if (!this.avatarEl || !window.AvatarManager) return;

        try {
            const avatarUrl = await window.AvatarManager.get(user, '#FF4477');
            this.avatarEl.src = avatarUrl;
            this.avatarEl.classList.remove('pop-avatar');
            void this.avatarEl.offsetWidth; 
            this.avatarEl.classList.add('pop-avatar');
        } catch (err) {
            console.error("[YT VISUAL] Ошибка получения аватара:", err);
        }
    }
};