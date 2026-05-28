window.AppPet = {
    container: document.getElementById('pet-container'),
    
    // Новая система: СТЕК БАЗОВЫХ СОСТОЯНИЙ. Питомец всегда возвращается к верхнему стейту в массиве.
    baseStack: ['idle'], 
    
    activeState: null,      // Временная эмоция (love, angry, scared и тд)
    currentPriority: 0,     // Вес текущей временной эмоции
    
    particleInterval: null,
    emotionTimeout: null,
    sleepTimer: null,

    // Веса временных эмоций (чем выше цифра, тем сложнее перебить)
    priorities: {
        'angry': 10, 'scared': 9, 'nom': 8, // Мат, смерть, еда - перебить нельзя
        'love': 5,                          // Подписки, донаты, VIP
        'greet': 4, 'bye': 4,               // Ручные команды модеров
        'alert': 3,                         // Реакция пробуждения / блюр
        'hype': 1                           // Смайлы в чате
    },

    init: function() {
        if (!window.AppConfig.petEnabled || !this.container) {
            if(this.container) this.container.style.display = 'none';
            return;
        }

        // Подписка на временные эмоции
        window.AppEvents.listen('PET_EMOTION', d => this.setEmotion(d.emotion, d.duration));
        
        // Подписка на базовые состояния (запись в стек)
        window.AppEvents.listen('PET_BASE_STATE', d => {
            if (d.active) {
                // Если состояние активировано, кладем его наверх стека
                if (!this.baseStack.includes(d.state)) this.baseStack.push(d.state);
            } else {
                // Если отключено - удаляем из стека
                this.baseStack = this.baseStack.filter(s => s !== d.state);
            }
            
            // Если сейчас нет временной эмоции, сразу рисуем верхнее состояние стека
            if (!this.activeState) {
                this.applyVisualState(this.baseStack[this.baseStack.length - 1]);
            }
        });

        this.resetSleepTimer();
        // Запуск слушателя на любые клики (для ручного пробуждения)
        window.addEventListener('click', () => this.wakeUp());
    },

    setEmotion: function(state, durationMs = 0) {
        if (!this.container) return;
        this.resetSleepTimer();

        // Если это ВРЕМЕННАЯ эмоция
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

        // Устанавливаем таймер возврата к стеку
        if (durationMs > 0) {
            this.emotionTimeout = setTimeout(() => {
                this.activeState = null;
                this.currentPriority = 0;
                // Возвращаемся к фоновому состоянию (читаем вершину стека)
                this.applyVisualState(this.baseStack[this.baseStack.length - 1]);
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

    wakeUp: function() {
        if (this.baseStack.includes('sleep')) {
            window.AppEvents.emit('PET_BASE_STATE', { state: 'sleep', active: false });
            this.setEmotion('alert', 2000); 
        }
        this.resetSleepTimer();
    },

    resetSleepTimer: function() {
        clearTimeout(this.sleepTimer);
        
        if (this.baseStack.includes('sleep')) {
            window.AppEvents.emit('PET_BASE_STATE', { state: 'sleep', active: false });
        }

        const timeoutSec = window.AppConfig.petSleepTimeout || 120;
        
        this.sleepTimer = setTimeout(() => {
            // Лиса засыпает ТОЛЬКО если на вершине стека 'idle' и нет временных эмоций
            if (this.baseStack[this.baseStack.length - 1] === 'idle' && !this.activeState) {
                window.AppEvents.emit('PET_BASE_STATE', { state: 'sleep', active: true });
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