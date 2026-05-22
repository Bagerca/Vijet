window.AppPet = {
    container: document.getElementById('pet-container'),
    
    // Новая система состояний
    baseState: 'idle',      // Фоновое состояние (idle, sleep, jam, listen)
    activeState: null,      // Временная эмоция (love, angry, scared и тд)
    currentPriority: 0,     // Вес текущей эмоции
    
    particleInterval: null,
    emotionTimeout: null,
    sleepTimer: null,

    // Базовые фоновые состояния (не имеют таймаута)
    baseStates: ['idle', 'sleep', 'jam', 'listen'],

    // Веса временных эмоций (чем выше цифра, тем сложнее перебить)
    priorities: {
        'angry': 5, 'scared': 5, 'nom': 5, // Мат, смерть, еда - перебить нельзя
        'love': 4,                         // Подписки, донаты, VIP
        'greet': 3, 'bye': 3,              // Ручные команды модеров
        'alert': 2,                        // Реакция пробуждения / блюр
        'hype': 1                          // Смайлы в чате (самый низкий приоритет)
    },

    init: function() {
        if (!window.AppConfig.petEnabled || !this.container) {
            if(this.container) this.container.style.display = 'none';
            return;
        }

        window.AppEvents.listen('PET_EMOTION', d => this.setEmotion(d.emotion, d.duration));

        this.resetSleepTimer();
    },

    setEmotion: function(state, durationMs = 0) {
        if (!this.container) return;

        // 1. Если это БАЗОВОЕ состояние (вкл/выкл музыка, TTS, сон)
        if (this.baseStates.includes(state)) {
            this.baseState = state;
            
            // Визуально меняем состояние, ТОЛЬКО если сейчас не проигрывается важная временная эмоция
            if (!this.activeState) {
                this.applyVisualState(this.baseState);
            }
            return;
        }

        // 2. Если это ВРЕМЕННАЯ эмоция
        const incomingPriority = this.priorities[state] || 1;

        // Если текущая проигрываемая эмоция ВАЖНЕЕ (или такая же), игнорируем новую
        if (this.activeState && incomingPriority <= this.currentPriority) {
            return; 
        }

        // В противном случае - перебиваем старую эмоцию новой
        clearTimeout(this.emotionTimeout);
        this.activeState = state;
        this.currentPriority = incomingPriority;

        this.applyVisualState(state);

        // Устанавливаем таймер возврата к базе
        if (durationMs > 0) {
            this.emotionTimeout = setTimeout(() => {
                this.activeState = null;
                this.currentPriority = 0;
                // Возвращаемся к фоновому состоянию (например, продолжаем танцевать, если музыка не кончилась)
                this.applyVisualState(this.baseState);
            }, durationMs);
        }
    },

    // Функция, которая только меняет CSS и частицы
    applyVisualState: function(state) {
        clearInterval(this.particleInterval);
        
        this.container.className = '';
        this.container.classList.add(`state-${state}`);

        if (state === 'sleep') {
            this.particleInterval = setInterval(() => this.spawnParticle('Z', 'part-zzz', 60, 50), 800);
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
    },

    resetSleepTimer: function() {
        clearTimeout(this.sleepTimer);
        
        // Если спали - резко просыпаемся
        if (this.baseState === 'sleep') {
            this.setEmotion('alert', 2000); 
            this.baseState = 'idle'; // Сбрасываем базу
        }

        const timeoutSec = window.AppConfig.petSleepTimeout || 120;
        
        this.sleepTimer = setTimeout(() => {
            // Лиса засыпает ТОЛЬКО если она ничего не делает (не слушает музыку, не озвучивает TTS)
            if (this.baseState === 'idle' && !this.activeState) {
                this.setEmotion('sleep'); // Отправит как базовое состояние
            }
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