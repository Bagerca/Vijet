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
        
        // Если эмоция заблокирована (например, идет анимация смерти), 
        // не даем чату перебить её обычным idle. Но другие сильные эмоции могут перебить.
        if (this.isEmotionLocked && state === 'idle') return;

        clearInterval(this.particleInterval);
        clearTimeout(this.emotionTimeout);
        
        this.container.className = '';
        this.container.classList.add(`state-${state}`);
        this.currentState = state;

        // Генерация частиц в зависимости от состояния
        if (state === 'sleep') {
            this.isSleeping = true;
            this.particleInterval = setInterval(() => this.spawnParticle('Z', 'part-zzz', 60, 40), 800);
        } else {
            this.isSleeping = false;
        }

        if (state === 'alert') this.spawnParticle('!', 'part-alert', 55, 10);
        if (state === 'love') this.particleInterval = setInterval(() => this.spawnParticle('❤', 'part-heart', 50 + Math.random()*20, 20), 400);

        // Если задано время (например 3000 мс), эмоция блокируется на это время, потом возврат в idle
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
        
        // Если лиса спала, она резко просыпается (удивление) на 2 секунды
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
        
        const randomX = (Math.random() - 0.5) * 15;
        p.style.left = `${leftOffset + randomX}px`;
        p.style.top = `${topOffset}px`;
        
        this.container.appendChild(p);
        setTimeout(() => p.remove(), 2000);
    }
};

setTimeout(() => window.AppPet.init(), 1000);