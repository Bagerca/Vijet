/* ================= СЧЕТЧИК СМЕРТЕЙ (DUMB WIDGET) ================= */
window.AppDeaths = {
    container: document.getElementById('deaths-container'),
    countText: document.getElementById('deaths-count'),
    currentCount: 0,

    init: function() {
        // Мы больше не читаем localStorage здесь!
        // Ждем команды от Ядра: "Эй, отрисуй вот столько смертей"
        window.AppEvents.listen('DEATHS_UPDATE_UI', d => {
            this.render(d.count);
            this.toggle(d.isVisible);
        });
    },

    toggle: function(isVisible) {
        if (isVisible) {
            this.container.classList.remove('hidden');
        } else {
            this.container.classList.add('hidden');
        }
    },

    render: function(newCount) {
        if (newCount > this.currentCount) {
            // Если смертей стало больше - трясем счетчик и пугаем лису
            this.container.classList.remove('damage-shake');
            void this.container.offsetWidth; 
            this.container.classList.add('damage-shake');

            if (window.AppPet) window.AppPet.setEmotion('scared', 3000);
            if (window.AppConfig.deathSound) {
                window.AppEvents.emit('PLAY_SOUND', { path: window.AppConfig.deathSound });
            }
        }

        this.currentCount = newCount;
        this.countText.innerText = this.currentCount;
        
        // Анимация изменения цифры
        this.countText.classList.remove('animate-pop-red');
        void this.countText.offsetWidth; 
        this.countText.classList.add('animate-pop-red');
    }
};