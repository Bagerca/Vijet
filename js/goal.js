/* ================= GOAL 2.0 (С МИНИМАЛИСТИЧНЫМ ДИЗАЙНОМ) ================= */

window.AppGoal = {
    container: document.getElementById('goal-container'),
    currentFollowers: 0,
    displayFollowers: 0, 
    animationFrameId: null,

    init: function() {
        if (!window.AppConfig.goalTarget || window.AppConfig.goalTarget <= 0) {
            this.container.style.display = 'none';
            return;
        }

        // Рендерим новую, чистую HTML структуру
        this.container.innerHTML = `
            <div class="goal-badge">${window.AppConfig.goalTitle || 'Фолловеры'}</div>
            <div class="goal-content">
                <span class="goal-current" id="goal-current">0</span>
                <span style="color: rgba(0,0,0,0.3)">/</span>
                <span style="color: rgba(0,0,0,0.5)">${window.AppConfig.goalTarget}</span>
            </div>
            <div id="goal-bar-fill"></div>
        `;

        this.fetchData();
        setInterval(() => this.fetchData(), window.AppConfig.goalUpdateInterval || 30000);

        // Обработчик тестовой кнопки
        window.AppEvents.listen('GOAL_TEST_ADD', () => {
            this.currentFollowers += 1;
            this.animateValue(this.currentFollowers);
        });
    },

    fetchData: async function() {
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${window.AppConfig.channelName}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const followers = data[0].followers || 0;
                if (followers > this.currentFollowers || this.currentFollowers === 0) {
                    this.currentFollowers = followers;
                    this.animateValue(followers);
                }
            }
        } catch (err) {}
    },

    animateValue: function(targetValue) {
        const elCurrent = document.getElementById('goal-current');
        const elBar = document.getElementById('goal-bar-fill');
        const maxTarget = window.AppConfig.goalTarget;

        // Двигаем нижнюю неоновую полоску
        let percent = Math.min((targetValue / maxTarget) * 100, 100);
        elBar.style.width = `${percent}%`;

        if (targetValue >= maxTarget) this.container.classList.add('goal-completed');
        else this.container.classList.remove('goal-completed');

        // Накручиваем цифры
        const startValue = this.displayFollowers;
        const duration = 1500; 
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.displayFollowers = Math.floor(startValue + (targetValue - startValue) * easeOut);
            
            elCurrent.innerText = this.displayFollowers;

            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(updateCounter);
            } else {
                elCurrent.innerText = targetValue;
                this.displayFollowers = targetValue;
                
                // Легкий отскок цифры при завершении
                elCurrent.style.transform = 'scale(1.2)';
                elCurrent.style.display = 'inline-block';
                elCurrent.style.transition = 'transform 0.15s ease';
                setTimeout(() => { elCurrent.style.transform = 'scale(1)'; }, 150);
            }
        };

        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = requestAnimationFrame(updateCounter);
    }
};

setTimeout(() => window.AppGoal.init(), 1000);