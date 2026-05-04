window.AppAlerts = {
    container: document.getElementById('alert-container'),
    queue: [],
    isPlaying: false,

    add: function(user, type, message = "", months = 0) {
        this.queue.push({ user, type, message, months });
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
        let icon = ""; let color = ""; let titleText = ""; let subText = data.message;

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
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> с нами уже ${data.months} мес.!`;
                break;
            case 'gift':
                icon = `🎁`; color = `#9146FF`; 
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> подарил подписку!`;
                break;
        }

        // Передаем цвета в CSS для создания ровного неона
        this.container.style.setProperty('--alert-color', color);
        this.container.style.setProperty('--alert-glow', `${color}55`); // полупрозрачный цвет

        this.container.innerHTML = `
            <div class="alert-card">
                <!-- Идеально ровный круг для эмодзи с собственным неоном -->
                <div class="alert-icon-wrap" style="box-shadow: 0 0 20px var(--alert-glow), inset 0 0 10px var(--alert-glow);">
                    <div class="alert-icon" style="text-shadow: 0 0 15px ${color};">${icon}</div>
                </div>
                
                <div class="alert-info">
                    <div class="alert-title">${titleText}</div>
                    ${subText ? `<div class="alert-message">"${subText}"</div>` : ''}
                </div>
            </div>
        `;

        this.container.classList.remove('hidden');
        this.container.classList.remove('alert-out');
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