window.AppDeaths = {
    container: document.getElementById('deaths-container'),
    countText: document.getElementById('deaths-count'),
    count: 0,
    isVisible: false,

    init: function() {
        const savedDeaths = localStorage.getItem('uso_deaths');
        if (savedDeaths !== null) {
            this.count = parseInt(savedDeaths, 10) || 0;
            this.render();
            if (this.count > 0) this.toggle(true);
        }

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

        if (type === 'add') this.count += value;
        else if (type === 'sub') this.count -= value;
        else if (type === 'set') this.count = value;

        if (this.count < 0) this.count = 0;

        localStorage.setItem('uso_deaths', this.count);
        this.render();
        
        if (!this.isVisible && this.count > 0) {
            this.toggle(true);
        }

        if (this.count > oldCount) {
            this.container.classList.remove('damage-shake');
            void this.container.offsetWidth; 
            this.container.classList.add('damage-shake');

            if (window.AppPet) window.AppPet.setEmotion('scared', 3000);

            if (window.AppConfig.deathSound) {
                window.AppEvents.emit('PLAY_SOUND', { path: window.AppConfig.deathSound });
            }
        }
    },

    render: function() {
        this.countText.innerText = this.count;
        this.countText.classList.remove('animate-pop-red');
        void this.countText.offsetWidth; 
        this.countText.classList.add('animate-pop-red');
    }
};

setTimeout(() => window.AppDeaths.init(), 500);