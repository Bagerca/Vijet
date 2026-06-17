/* ================= js/goal.js ================= */

window.AppGoal = {
    container: document.getElementById('goal-container'),
    currentFollowers: -1,
    displayFollowers: 0, 
    animationFrameId: null,
    isInitialized: false,

    init: function() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (!window.AppConfig.goalTarget || window.AppConfig.goalTarget <= 0) {
            this.container.style.display = 'none';
            return;
        }

        const color = window.AppConfig.goalColor || '#FF4477';
        this.container.style.setProperty('--goal-color', color);

        this.container.innerHTML = `
            <div class="goal-light-glass">
                <div class="goal-track">
                    <div class="goal-fill" id="goal-bar-fill"></div>
                </div>
                
                <div class="goal-content">
                    <div class="goal-label">
                        <div class="goal-icon" id="goal-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </div>
                        <span>${window.AppConfig.goalTitle || 'ФОЛЛОВЕРЫ:'}</span>
                    </div>
                    
                    <div class="goal-stats">
                        <span class="goal-current" id="goal-current">0</span>
                        <span class="goal-divider">/</span>
                        <span class="goal-max">${window.AppConfig.goalTarget}</span>
                    </div>
                </div>
            </div>
        `;

        this.fetchData();
        setInterval(() => this.fetchData(), window.AppConfig.goalUpdateInterval || 30000);

        window.AppEvents.listen('GOAL_TEST_ADD', () => {
            let val = this.currentFollowers === -1 ? 0 : this.currentFollowers;
            this.animateValue(val + 1);
        });
    },

    fetchData: async function() {
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${window.AppConfig.channelName}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const followers = data[0].followers || 0;
                if (followers !== this.currentFollowers) {
                    this.animateValue(followers);
                }
            }
        } catch (err) { }
    },

    animateValue: function(targetValue) {
        const elCurrent = document.getElementById('goal-current');
        const elBar = document.getElementById('goal-bar-fill');
        const elIcon = document.getElementById('goal-icon');
        const maxTarget = window.AppConfig.goalTarget;

        const isFirstLoad = this.currentFollowers === -1;
        this.currentFollowers = targetValue;

        let percent = Math.min((targetValue / maxTarget) * 100, 100);
        elBar.style.width = `${percent}%`;

        if (targetValue >= maxTarget) this.container.classList.add('goal-completed');
        else this.container.classList.remove('goal-completed');

        if (!isFirstLoad && this.displayFollowers < targetValue) {
            elIcon.classList.remove('icon-beat');
            void elIcon.offsetWidth;
            elIcon.classList.add('icon-beat');
        }

        const startValue = this.displayFollowers;
        const duration = 1200; 
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            this.displayFollowers = Math.floor(startValue + (targetValue - startValue) * easeOut);
            
            elCurrent.innerText = this.displayFollowers;

            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(updateCounter);
            } else {
                elCurrent.innerText = targetValue;
                this.displayFollowers = targetValue;
                
                if (!isFirstLoad) {
                    elCurrent.classList.add('pop-text');
                    setTimeout(() => elCurrent.classList.remove('pop-text'), 300);
                }
            }
        };

        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = requestAnimationFrame(updateCounter);
    }
};