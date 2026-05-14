window.AppDeaths = {
    container: document.getElementById('deaths-container'),
    countText: document.getElementById('deaths-count'),
    count: 0,
    isVisible: false,

    init: function() {
        // Пытаемся достать сохраненные смерти из локального хранилища
        const savedDeaths = localStorage.getItem('uso_deaths');
        if (savedDeaths !== null) {
            this.count = parseInt(savedDeaths, 10) || 0;
            this.render();
            // Если смертей больше 0, сразу показываем плашку при загрузке
            if (this.count > 0) this.toggle(true);
        }
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

        if (type === 'add') this.count += value;
        else if (type === 'sub') this.count -= value;
        else if (type === 'set') this.count = value;

        if (this.count < 0) this.count = 0;

        // СОХРАНЯЕМ В ЛОКАЛЬНОЕ ХРАНИЛИЩЕ
        localStorage.setItem('uso_deaths', this.count);

        this.render();
        
        // Авто-показ если есть смерти
        if (!this.isVisible && this.count > 0) {
            this.toggle(true);
        }

        // Если смерти добавились (урон получен)
        if (this.count > oldCount) {
            // Эффект жесткой "тряски"
            this.container.classList.remove('damage-shake');
            void this.container.offsetWidth; 
            this.container.classList.add('damage-shake');

            // ПИТОМЕЦ ПУГАЕТСЯ ПРИ СМЕРТИ НА 3 СЕКУНДЫ
            if (window.AppPet) window.AppPet.setEmotion('scared', 3000);

            // ВОСПРОИЗВЕДЕНИЕ ЗВУКА СМЕРТИ
            if (window.AppConfig.deathSound) {
                try {
                    const audio = new Audio(window.AppConfig.deathSound);
                    audio.volume = (window.AppConfig.alertVolume || 50) / 100;
                    audio.play().catch(e => console.warn("[Deaths] Звук заблокирован браузером:", e));
                } catch (e) {
                    console.warn("[Deaths] Ошибка воспроизведения звука:", e);
                }
            }
        }
    },

    render: function() {
        this.countText.innerText = this.count;
        
        // Анимация самой цифры
        this.countText.classList.remove('animate-pop-red');
        void this.countText.offsetWidth; 
        this.countText.classList.add('animate-pop-red');
    }
};

// Запускаем инициализацию при загрузке скрипта
setTimeout(() => window.AppDeaths.init(), 500);