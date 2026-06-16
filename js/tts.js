/* ================= ВИЗУАЛ TTS (ОБНОВЛЕННЫЙ ПЛЕЕР) ================= */
window.AppTTS = {
    container: document.getElementById('tts-container'),
    userText: document.getElementById('tts-user'),
    avatarImg: document.getElementById('tts-avatar'),
    eqInterval: null, 

    init: function() {
        if (!window.AppConfig.ttsEnabled) {
            if(this.container) this.container.style.display = 'none';
            return;
        }

        window.AppEvents.listen('TTS_VISUAL_SHOW', d => this.showVisual(d.user));
        window.AppEvents.listen('TTS_VISUAL_HIDE', () => this.hideVisual());
        window.AppEvents.listen('TTS_EQ_START', () => this.startEqualizer());
        window.AppEvents.listen('TTS_EQ_SPIKE', () => this.spikeEqualizer());
        window.AppEvents.listen('TTS_EQ_STOP', () => this.stopEqualizer());
    },

    startEqualizer: function() {
        if (this.eqInterval) clearInterval(this.eqInterval);
        const bars = document.querySelectorAll('.tts-bar');
        if (!bars.length) return;
        this.eqInterval = setInterval(() => {
            bars.forEach(bar => {
                bar.style.height = `${20 + Math.random() * 40}%`;
                bar.classList.remove('active-spike');
            });
        }, 120); 
    },

    spikeEqualizer: function() {
        const bars = document.querySelectorAll('.tts-bar');
        bars.forEach(bar => {
            bar.style.height = `${60 + Math.random() * 40}%`;
            bar.classList.add('active-spike');
        });
    },

    stopEqualizer: function() {
        if (this.eqInterval) clearInterval(this.eqInterval);
        document.querySelectorAll('.tts-bar').forEach(bar => {
            bar.style.height = '15%';
            bar.classList.remove('active-spike');
        });
    },

    showVisual: function(user) {
        if (!this.container) return;
        this.userText.innerText = user;
        
        // 1. Умная загрузка аватарки (Синхронизировано с логикой YouTube плеера)
        if (this.avatarImg) {
            const safeName = encodeURIComponent(user);
            const fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=1a1a1a&color=fff&size=64&bold=true`;
            let foundAvatar = null;

            // Шаг А: Ищем в локальном кэше
            try {
                const cachedAvatars = JSON.parse(localStorage.getItem('uso_avatars') || '{}');
                const searchName = user.toLowerCase();
                for (let key in cachedAvatars) {
                    if (key.toLowerCase() === searchName) {
                        foundAvatar = cachedAvatars[key];
                        break;
                    }
                }
            } catch(e) {}

            if (foundAvatar) {
                // Если нашли в кэше — ставим сразу
                this.avatarImg.src = foundAvatar;
            } else {
                // Шаг Б: Если не нашли — ставим заглушку, и фоном качаем с Twitch API
                this.avatarImg.src = fallbackUrl;
                fetch(`https://api.ivr.fi/v2/twitch/user?login=${user.toLowerCase()}`)
                    .then(res => res.json())
                    .then(apiData => {
                        if (apiData && apiData.length > 0 && apiData[0].logo) {
                            this.avatarImg.src = apiData[0].logo;
                            // Сохраняем в общий кэш
                            try {
                                let cache = JSON.parse(localStorage.getItem('uso_avatars') || '{}');
                                cache[user] = apiData[0].logo;
                                localStorage.setItem('uso_avatars', JSON.stringify(cache));
                            } catch(e) {}
                        }
                    }).catch(e => console.warn("[TTS VISUAL] Ошибка скачивания аватарки", e));
            }
        }

        this.container.setAttribute('data-user', user.toLowerCase());
        const userStyle = (window.AppConfig.customChatStyles && window.AppConfig.customChatStyles[user.toLowerCase()]) || null;
        if (userStyle) {
            this.container.setAttribute('data-style', userStyle);
        }
        
        this.container.classList.remove('hidden', 'tts-out');
        void this.container.offsetWidth; 
        this.container.classList.add('tts-in');
    },

    hideVisual: function() {
        if (!this.container) return;
        
        this.container.classList.remove('tts-in');
        void this.container.offsetWidth; 
        this.container.classList.add('tts-out');
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.removeAttribute('data-user');
            this.container.removeAttribute('data-style'); 
        }, 500);
    }
};

setTimeout(() => window.AppTTS.init(), 1000);