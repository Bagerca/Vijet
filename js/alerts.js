/* ================= js/alerts.js ================= */

window.AppAlerts = {
    container: document.getElementById('alert-container'),
    queue: [],
    isPlaying: false,
    isInitialized: false, // Флаг инициализации

    init: function() {
        // Защита от двойного запуска
        if (this.isInitialized) return;
        this.isInitialized = true;

        window.AppEvents.listen('ALERT_ADD', d => this.add(d.user, d.type, d.msg, d.val));
        window.AppEvents.listen('ALERT_TEST', d => {
            if (d.type === "sub") this.add("ТестовыйЮзер", "sub");
            else if (d.type === "resub") this.add("ОлдРесабер", "resub", "Обожаю этот стрим!", 12);
            else if (d.type === "gift") this.add("Богач", "gift", "для СлучайныйЗритель");
            else if (d.type === "streak") this.add("ПреданныйЗритель", "streak", "Лучший стример, смотрю каждый день!", 5);
            else if (d.type === "series") this.add("Киноман", "reward_series", "Давай смотреть Во все тяжкие!");
            else if (d.type === "movie") this.add("Зритель", "reward_movie", "Гарри Поттер пожалуйста");
            else if (d.type === "video") this.add("Кекус", "reward_video", "Смешные коты");
            else if (d.type === "game") this.add("Геймер", "reward_game", "Го в Доту?");
            else if (d.type === "music") this.add("Меломан", "reward_music", "Врубай фонк");
            else this.add("НовыйФолловер", "follow");
        });
    },

    add: function(user, type, message = "", value = 0) {
        this.queue.push({ user, type, message, value });
        if (!this.isPlaying) this.playNext();
    },

    playNext: function() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            return;
        }
        this.isPlaying = true;
        const data = this.queue.shift();
        this.render(data);
    },

    render: function(data) {
        if (window.AppPet) window.AppPet.setEmotion('love', window.AppConfig.alertDuration || 5000);

        let icon = ""; let color = ""; let titleText = ""; let subText = data.message;
        let isReward = false; let rewardCategory = "";

        switch (data.type) {
            case 'follow':
                icon = `💖`; color = `#FF69B4`; 
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> отслеживает канал!`;
                break;
            case 'sub':
                icon = `⭐`; color = `#FFD700`; 
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> оформил подписку!`;
                break;
            case 'resub':
                icon = `🔥`; color = `#FF4500`; 
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> с нами уже ${data.value} мес.!`;
                break;
            case 'gift':
                icon = `🎁`; color = `#9146FF`; 
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> подарил подписку!`;
                break;
            case 'streak':
                icon = `📺`; color = `#00E5FF`; 
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> смотрит ${data.value} стримов подряд!`;
                break;

            case 'reward_series':
                isReward = true; rewardCategory = "СЕРИАЛ"; color = `#a29bfe`; 
                icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`;
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span>`;
                break;
            case 'reward_movie':
                isReward = true; rewardCategory = "ФИЛЬМ"; color = `#fdcb6e`; 
                icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`;
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span>`;
                break;
            case 'reward_video':
                isReward = true; rewardCategory = "ВИДЕО"; color = `#74b9ff`; 
                icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span>`;
                break;
            case 'reward_game':
                isReward = true; rewardCategory = "ИГРА"; color = `#55efc4`; 
                icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="6"></rect><path d="M7 12h4M9 10v4M15 11h.01M15 13h.01M17 12h.01"></path></svg>`;
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span>`;
                break;
            case 'reward_music':
                isReward = true; rewardCategory = "МУЗЫКА"; color = `#ff7675`; 
                icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span>`;
                break;
        }

        if (window.AppConfig.alertSounds && window.AppConfig.alertSounds[data.type]) {
            window.AppEvents.emit('PLAY_SOUND', { path: window.AppConfig.alertSounds[data.type] });
        }

        this.container.style.setProperty('--alert-color', color);
        this.container.style.setProperty('--alert-glow', `${color}55`);

        if (isReward) {
            this.container.innerHTML = `
                <div class="alert-card reward-card">
                    <div class="alert-icon-wrap reward-icon-wrap" style="box-shadow: 0 0 20px var(--alert-glow), inset 0 0 15px var(--alert-glow); border-color: ${color};">
                        <div class="alert-icon reward-svg" style="color: ${color}; filter: drop-shadow(0 0 8px ${color});">${icon}</div>
                    </div>
                    <div class="alert-info">
                        <div class="reward-badge" style="color: ${color}; text-shadow: 0 0 10px var(--alert-glow);">ЗАКАЗ ЗА БАЛЛЫ: ${rewardCategory}</div>
                        <div class="alert-title reward-title">${titleText}</div>
                        ${subText ? `<div class="alert-message reward-msg">"${subText}"</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            this.container.innerHTML = `
                <div class="alert-card">
                    <div class="alert-icon-wrap" style="box-shadow: 0 0 20px var(--alert-glow), inset 0 0 10px var(--alert-glow);">
                        <div class="alert-icon" style="text-shadow: 0 0 15px ${color};">${icon}</div>
                    </div>
                    <div class="alert-info">
                        <div class="alert-title">${titleText}</div>
                        ${subText ? `<div class="alert-message">"${subText}"</div>` : ''}
                    </div>
                </div>
            `;
        }

        this.container.classList.remove('hidden', 'alert-out');
        this.container.classList.add('alert-in');

        setTimeout(() => {
            this.container.classList.remove('alert-in');
            this.container.classList.add('alert-out');
            setTimeout(() => {
                this.container.classList.add('hidden');
                this.playNext();
            }, 500);
        }, window.AppConfig.alertDuration || 5000);
    }
};