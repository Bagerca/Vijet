/* ФАЙЛ: js/deaths.js */
window.AppDeaths = {
    container: document.getElementById('deaths-container'),
    countText: document.getElementById('deaths-count'),
    comboEl: null,
    
    count: 0,
    isVisible: false,
    
    // Переменные комбо-системы
    comboCount: 0,
    comboTimer: null,

    init: function() {
        const savedDeaths = localStorage.getItem('uso_deaths');
        if (savedDeaths !== null) {
            this.count = parseInt(savedDeaths, 10) || 0;
            this.render();
            if (this.count > 0) this.toggle(true);
        }

        // Создаем DOM-элемент для Комбо
        this.comboEl = document.createElement('div');
        this.comboEl.id = 'deaths-combo';
        this.comboEl.className = 'hidden';
        this.container.appendChild(this.comboEl);

        // Подписка на события
        window.AppEvents.listen('DEATHS_CMD', d => {
            if (d.cmd === "on" || d.cmd === "show") this.toggle(true);
            else if (d.cmd === "off" || d.cmd === "hide") this.toggle(false);
            else if (d.cmd === "-" || d.cmd === "sub") this.update(1, 'sub');
            else if (d.cmd === "reset" || d.cmd === "clear") this.update(0, 'set');
            else if (d.cmd.startsWith("set ")) { 
                const num = parseInt(d.cmd.replace("set ", "")); 
                if (!isNaN(num)) this.update(num, 'set'); 
            } 
            else this.update(1, 'add');
        });
    },

    toggle: function(forceState) {
        this.isVisible = forceState !== undefined ? forceState : !this.isVisible;
        if (this.isVisible) {
            this.container.classList.remove('hidden');
        } else {
            this.container.classList.add('hidden');
        }
    },

    update: function(value, type = 'add') {
        const oldCount = this.count;

        if (type === 'add') {
            this.count += value;
            this.handleCombo(); // Вызов комбо
        }
        else if (type === 'sub') this.count -= value;
        else if (type === 'set') this.count = value;

        if (this.count < 0) this.count = 0;

        localStorage.setItem('uso_deaths', this.count);
        this.render();
        
        if (!this.isVisible && this.count > 0) {
            this.toggle(true);
        }

        if (this.count > oldCount) {
            // Безопасный перезапуск анимации тряски
            window.AppUtils.restartAnimation(this.container, 'damage-shake');

            // Чем выше комбо, тем сильнее пугается лиса!
            const fearDuration = 3000 + (this.comboCount * 1000);
            if (window.AppPet) window.AppPet.setEmotion('scared', Math.min(fearDuration, 8000));

            if (window.AppConfig.deathSound) {
                window.AppEvents.emit('PLAY_SOUND', { path: window.AppConfig.deathSound });
            }
        }
    },

    handleCombo: function() {
        this.comboCount++;
        
        if (this.comboCount > 1) {
            this.comboEl.innerText = `x${this.comboCount} COMBO!`;
            this.comboEl.classList.remove('hidden');
            // Безопасный перезапуск поп-апа комбо
            window.AppUtils.restartAnimation(this.comboEl, 'combo-pop');
        }

        clearTimeout(this.comboTimer);
        // Сброс комбо через 8 секунд
        this.comboTimer = setTimeout(() => {
            this.comboCount = 0;
            this.comboEl.classList.add('hidden');
        }, 8000);
    },

    render: function() {
        this.countText.innerText = this.count;
        // Безопасный перезапуск анимации увеличения красных цифр
        window.AppUtils.restartAnimation(this.countText, 'animate-pop-red');
    }
};

setTimeout(() => window.AppDeaths.init(), 500);