window.AppAlerts = {
    container: document.getElementById('alert-container'),
    queue: [],
    isPlaying: false,

    // Добавление алерта в очередь
    // type: 'follow', 'sub', 'resub', 'gift'
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
        const alertData = this.queue.shift();
        this.render(alertData);
    },

    render: function(data) {
        // Настраиваем визуальную часть в зависимости от типа события
        let icon = "";
        let color = "";
        let titleText = "";
        let subText = data.message;

        switch (data.type) {
            case 'follow':
                icon = `💖`; // Эмодзи или можно заменить на SVG
                color = `#FF69B4`; // Розовый
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> отслеживает канал!`;
                break;
            case 'sub':
                icon = `⭐`;
                color = `#FFD700`; // Золотой
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> оформил подписку!`;
                break;
            case 'resub':
                icon = `🔥`;
                color = `#FF4500`; // Оранжево-красный
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> с нами уже ${data.months} мес.!`;
                break;
            case 'gift':
                icon = `🎁`;
                color = `#9146FF`; // Твичевский фиолетовый
                titleText = `<span class="alert-user" style="color: ${color}">${data.user}</span> подарил подписку!`;
                break;
        }

        // Задаем цвет левой границы и свечения
        this.container.style.borderLeft = `4px solid ${color}`;
        this.container.style.boxShadow = `0 15px 35px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), -4px 0 25px ${color}44`;

        this.container.innerHTML = `
            <div class="alert-icon" style="text-shadow: 0 0 15px ${color};">${icon}</div>
            <div class="alert-info">
                <div class="alert-title">${titleText}</div>
                ${subText ? `<div class="alert-message">"${subText}"</div>` : ''}
            </div>
        `;

        // Показываем с анимацией появления
        this.container.classList.remove('hidden');
        this.container.classList.remove('alert-out');
        this.container.classList.add('alert-in');

        // Ждем нужное время (из конфига)
        setTimeout(() => {
            // Запускаем анимацию исчезновения
            this.container.classList.remove('alert-in');
            this.container.classList.add('alert-out');

            // Ждем завершения анимации (0.5 сек) и запускаем следующий
            setTimeout(() => {
                this.container.classList.add('hidden');
                this.playNext();
            }, 500);

        }, window.AppConfig.alertDuration || 5000);
    }
};