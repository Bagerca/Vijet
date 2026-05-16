window.AppPet = {
    container: document.getElementById('pet-container'),
    currentState: 'idle',
    isSleeping: false,
    
    particleInterval: null,
    emotionTimeout: null,
    sleepTimer: null,
    
    // Блокировка переключения на idle, пока действует другая эмоция
    isEmotionLocked: false, 

    init: function() {
        if (!window.AppConfig.petEnabled || !this.container) {
            if(this.container) this.container.style.display = 'none';
            return;
        }
        this.resetSleepTimer();
    },

    setEmotion: function(state, durationMs = 0) {
        if (!this.container) return;
        
        // Если эмоция заблокирована, не даем чату перебить её обычным idle
        if (this.isEmotionLocked && state === 'idle') return;

        clearInterval(this.particleInterval);
        clearTimeout(this.emotionTimeout);
        
        this.container.className = '';
        this.container.classList.add(`state-${state}`);
        this.currentState = state;

        // Генерация частиц в зависимости от состояния
        if (state === 'sleep') {
            this.isSleeping = true;
            this.particleInterval = setInterval(() => this.spawnParticle('Z', 'part-zzz', 60, 50), 800);
        } else {
            this.isSleeping = false;
        }

        if (state === 'alert') this.spawnParticle('!', 'part-alert', 55, 10);
        if (state === 'love') this.particleInterval = setInterval(() => this.spawnParticle('❤', 'part-heart', 50 + Math.random()*20, 20), 400);
        if (state === 'greet') this.particleInterval = setInterval(() => this.spawnParticle('👋', 'part-greet', 50 + Math.random()*15, 20), 600);
        if (state === 'bye') this.particleInterval = setInterval(() => this.spawnParticle('💜', 'part-bye', 50 + Math.random()*15, 20), 800);
        if (state === 'jam') this.particleInterval = setInterval(() => this.spawnParticle('🎵', 'part-note', 45 + Math.random()*25, 10), 600);
        if (state === 'listen') this.particleInterval = setInterval(() => this.spawnParticle('?', 'part-question', 60 + Math.random()*10, 10), 1500);
        if (state === 'nom') {
            this.particleInterval = setInterval(() => {
                const icon = Math.random() > 0.5 ? '🍪' : '✨';
                this.spawnParticle(icon, 'part-cookie', 80, 40);
            }, 300);
        }

        // Если задано время, эмоция блокируется на это время, потом возврат в idle
        if (durationMs > 0) {
            this.isEmotionLocked = true;
            this.emotionTimeout = setTimeout(() => {
                this.isEmotionLocked = false;
                this.setEmotion('idle');
            }, durationMs);
        } else {
            this.isEmotionLocked = false;
        }
    },

    resetSleepTimer: function() {
        clearTimeout(this.sleepTimer);
        
        if (this.isSleeping) {
            this.setEmotion('alert', 2000);
        } else if (!this.isEmotionLocked && this.currentState !== 'hype') {
            this.setEmotion('idle');
        }

        const timeoutSec = window.AppConfig.petSleepTimeout || 120;
        this.sleepTimer = setTimeout(() => {
            if (!this.isEmotionLocked) this.setEmotion('sleep');
        }, timeoutSec * 1000);
    },

    spawnParticle: function(text, cssClass, leftOffset, topOffset) {
        if (!this.container) return;
        const p = document.createElement('div');
        p.innerText = text;
        p.className = `pet-particle ${cssClass}`;
        
        const randomX = (Math.random() - 0.5) * 20;
        p.style.left = `${leftOffset + randomX}px`;
        p.style.top = `${topOffset}px`;
        
        this.container.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
};

setTimeout(() => window.AppPet.init(), 1000);