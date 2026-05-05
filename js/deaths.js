window.AppDeaths = {
    container: document.getElementById('deaths-container'),
    countText: document.getElementById('deaths-count'),
    count: 0,
    isVisible: false,

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

        this.render();
        
        // Авто-показ если есть смерти
        if (!this.isVisible && this.count > 0) {
            this.toggle(true);
        }

        // Если смерти добавились - запускаем эффект жесткой "тряски"
        if (this.count > oldCount) {
            this.container.classList.remove('damage-shake');
            void this.container.offsetWidth; 
            this.container.classList.add('damage-shake');
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