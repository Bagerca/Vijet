window.AppGoal = {
    container: document.getElementById('goal-container'),
    fillBar: document.getElementById('goal-bar-fill'),
    countText: document.getElementById('goal-count'),
    titleText: document.getElementById('goal-title'),
    currentFollowers: -1, 

    init: function() {
        if (!window.AppConfig.goalTarget || window.AppConfig.goalTarget <= 0) {
            this.container.style.display = 'none';
            return;
        }

        this.titleText.innerText = window.AppConfig.goalTitle || "Цель:";
        
        // Устанавливаем базовые цвета через CSS-переменные для удобства анимаций
        if (window.AppConfig.goalColor) {
            const color = window.AppConfig.goalColor;
            this.container.style.setProperty('--goal-color', color);
            this.container.style.setProperty('--goal-color-light', `${color}88`);
            this.fillBar.style.background = `linear-gradient(90deg, var(--goal-color-light) 0%, var(--goal-color) 100%)`;
        }

        this.fetchData();
        setInterval(() => this.fetchData(), window.AppConfig.goalUpdateInterval || 30000);
    },

    fetchData: async function() {
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${window.AppConfig.channelName}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const followers = data[0].followers || 0;
                this.render(followers);
            }
        } catch (err) {
            console.warn("[Goal] Ошибка обновления счетчика фолловеров.", err);
        }
    },

    render: function(followers) {
        const target = window.AppConfig.goalTarget;
        
        // Если значение изменилось (кто-то подписался)
        if (this.currentFollowers !== followers && this.currentFollowers !== -1) {
            
            // Анимация прыжка цифр
            this.countText.classList.remove('animate-pop');
            void this.countText.offsetWidth; 
            this.countText.classList.add('animate-pop');

            // Эффект яркой вспышки всей полосы
            this.fillBar.classList.remove('flash-glow');
            void this.fillBar.offsetWidth;
            this.fillBar.classList.add('flash-glow');
        }

        this.currentFollowers = followers;

        // Красивое форматирование чисел (например: 1 000)
        const formatFoll = followers.toLocaleString('ru-RU');
        const formatTarget = target.toLocaleString('ru-RU');
        this.countText.innerText = `${formatFoll} / ${formatTarget}`;

        let percent = (followers / target) * 100;
        
        if (percent >= 100) {
            percent = 100;
            // Если цель достигнута, включаем режим праздника (золотое свечение)
            this.container.classList.add('goal-completed');
        } else {
            this.container.classList.remove('goal-completed');
        }
        
        this.fillBar.style.width = `${percent}%`;
    }
};

setTimeout(() => window.AppGoal.init(), 1500);