/* ================= ВИЗУАЛ TTS (ГЛУПЫЙ ВИДЖЕТ) ================= */
window.AppTTS = {
    container: document.getElementById('tts-container'),
    userText: document.getElementById('tts-user'),
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
            bar.style.height = `${70 + Math.random() * 30}%`;
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
        this.container.classList.remove('hidden', 'tts-out');
        this.container.classList.add('tts-in');
    },

    hideVisual: function() {
        if (!this.container) return;
        this.container.classList.remove('tts-in');
        this.container.classList.add('tts-out');
        setTimeout(() => this.container.classList.add('hidden'), 500);
    }
};

setTimeout(() => window.AppTTS.init(), 1000);