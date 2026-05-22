/* ================= YOUTUBE ВИДЖЕТ ================= */
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
        
        // НОВОЕ: Теперь мы передаем весь объект даты целиком, чтобы получить точное время
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
                'mute': 1, // Виджет ВСЕГДА в муте (звук идет из Ядра)
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
        
        // 1. Обновляем Имя
        if (this.nameLabel) this.nameLabel.innerText = data.user;
        
        // 2. УМНАЯ АВАТАРКА (С поиском и автоматическим скачиванием)
        if (this.avatarEl) {
            const setAvatar = (url) => {
                this.avatarEl.src = url;
                this.avatarEl.classList.remove('pop-avatar');
                void this.avatarEl.offsetWidth; 
                this.avatarEl.classList.add('pop-avatar');
            };

            let safeName = encodeURIComponent(data.user);
            let fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=FF4477&color=fff&size=64&bold=true`;
            let foundAvatar = null;
            
            // Шаг А: Ищем в кэше БЕЗ УЧЕТА РЕГИСТРА
            try {
                const cachedAvatars = JSON.parse(localStorage.getItem('uso_avatars') || '{}');
                const searchName = data.user.toLowerCase();
                for (let key in cachedAvatars) {
                    if (key.toLowerCase() === searchName) {
                        foundAvatar = cachedAvatars[key];
                        break;
                    }
                }
            } catch(e) {}

            if (foundAvatar) {
                // Если нашли в кэше — ставим сразу
                setAvatar(foundAvatar);
            } else {
                // Шаг Б: Если не нашли — ставим заглушку, но МГНОВЕННО скачиваем реальную с Twitch API
                setAvatar(fallbackUrl);
                fetch(`https://api.ivr.fi/v2/twitch/user?login=${data.user.toLowerCase()}`)
                    .then(res => res.json())
                    .then(apiData => {
                        if (apiData && apiData.length > 0 && apiData[0].logo) {
                            setAvatar(apiData[0].logo);
                            // И сразу сохраняем её в кэш на будущее!
                            try {
                                let cache = JSON.parse(localStorage.getItem('uso_avatars') || '{}');
                                cache[data.user] = apiData[0].logo;
                                localStorage.setItem('uso_avatars', JSON.stringify(cache));
                            } catch(e) {}
                        }
                    }).catch(e => console.warn("[YT VISUAL] Ошибка скачивания аватарки", e));
            }
        }

        this.updateVol(data.vol);
        if (this.container) this.container.classList.remove('hidden');
        if (this.progressBar) this.progressBar.style.width = '0%';
        
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
        this.volLabel.classList.remove('animate-pop');
        void this.volLabel.offsetWidth; 
        this.volLabel.classList.add('animate-pop');
    },

    updateState: function(state) {
        if (!this.container) return;
        if (state === 'playing') this.container.classList.add('is-playing');
        else this.container.classList.remove('is-playing');
    },

    updateProgress: function(data) {
        // Поддержка и старого, и нового формата данных
        let percent = data.percent !== undefined ? data.percent : data;
        if(this.progressBar) this.progressBar.style.width = `${percent}%`;

        // =========================================================
        // УЛЬТРА-СИНХРОНИЗАЦИЯ: Если картинка отстала от звука
        // =========================================================
        if (this.isReady && this.yt && typeof this.yt.getCurrentTime === 'function' && data.currentTime !== undefined) {
            const visualState = this.yt.getPlayerState();
            
            // Если видео сейчас идет (1) или грузится (3)
            if (visualState === 1 || visualState === 3) { 
                const visualTime = this.yt.getCurrentTime();
                const diff = Math.abs(visualTime - data.currentTime);
                
                // Если разница больше 1.0 секунды — жестко перематываем картинку на время звука!
                if (diff > 1.0) {
                    console.log(`[YT VISUAL 🔄] Выравниваем рассинхрон с Ядром! Разница: ${diff.toFixed(2)}с`);
                    this.yt.seekTo(data.currentTime, true);
                }
            }
        }
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