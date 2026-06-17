/* ================= js/tts.js ================= */

window.AppTTS = {
    container: document.getElementById('tts-container'),
    userText: document.getElementById('tts-user'),
    avatarImg: document.getElementById('tts-avatar'),
    eqInterval: null, 
    isInitialized: false,

    init: function() {
        if (this.isInitialized) return;
        this.isInitialized = true;

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

    showVisual: async function(user) {
        if (!this.container) return;
        this.userText.innerText = user;
        
        if (this.avatarImg && window.AvatarManager) {
            try {
                const avatarUrl = await window.AvatarManager.get(user, '#1a1a1a');
                this.avatarImg.src = avatarUrl;
            } catch (err) {
                console.error("[TTS VISUAL] Ошибка получения аватара:", err);
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