window.AppShoutout = {
    container: document.getElementById('shoutout-container'),
    queue: [],
    isPlaying: false,

    add: function(username) {
        const cleanName = username.replace('@', '').split(' ')[0].trim().toLowerCase();
        if (cleanName) {
            this.queue.push(cleanName);
            if (!this.isPlaying) this.playNext();
        }
    },

    playNext: async function() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const targetUser = this.queue.shift();

        try {
            // Обращаемся к API для получения детальных данных
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${targetUser}`);
            const data = await response.json();

            if (data && data.length > 0) {
                this.render(data[0]);
            } else {
                this.playNext();
            }
        } catch (err) {
            console.error("[Shoutout] Ошибка получения данных:", err);
            this.playNext();
        }
    },

    render: function(userData) {
        const displayName = userData.displayName || userData.login;
        const userColor = userData.chatColor || "#9146FF"; 
        const avatarUrl = userData.logo || `https://ui-avatars.com/api/?name=${displayName}&background=1a1a1e&color=fff`;
        
        // Достаем дополнительные данные (Форматируем числа для красоты)
        const followers = userData.followers ? userData.followers.toLocaleString('ru-RU') : "0";
        const category = (userData.lastBroadcast && userData.lastBroadcast.game) ? userData.lastBroadcast.game.displayName : "Just Chatting";

        // Передаем основной цвет в CSS-переменную для гибкой стилизации
        this.container.style.setProperty('--user-color', userColor);
        this.container.style.setProperty('--user-glow', `${userColor}44`);

        this.container.innerHTML = `
            <div class="so-card">
                <!-- Блик на стекле (Анимация пролета) -->
                <div class="so-shine"></div>
                
                <div class="so-left">
                    <div class="so-avatar-wrapper">
                        <img src="${avatarUrl}" class="so-avatar">
                        <div class="so-avatar-ring"></div>
                    </div>
                </div>
                
                <div class="so-right">
                    <div class="so-badge">
                        <div class="so-dot"></div>
                        ВНИМАНИЕ, РЕКОМЕНДАЦИЯ
                    </div>
                    
                    <!-- ИСПРАВЛЕН ГРАДИЕНТ НИКА: теперь он переходит в тёмно-серый (#1a1a1a) для идеальной читаемости -->
                    <div class="so-name" style="background-image: linear-gradient(90deg, ${userColor} 0%, #1a1a1a 120%);">
                        ${displayName}
                    </div>
                    
                    <div class="so-meta">
                        <div class="so-meta-item">🎮 ${category}</div>
                        <div class="so-meta-item">👥 ${followers} фолл.</div>
                    </div>
                    
                    <div class="so-url">
                        twitch.tv/<span>${userData.login}</span>
                    </div>
                </div>
            </div>
        `;

        this.container.classList.remove('hidden');
        this.container.classList.remove('shoutout-out');
        
        // ВОСПРОИЗВЕДЕНИЕ ЗВУКА РЕКЛАМЫ (SHOUTOUT)
        if (window.AppConfig.shoutoutSound) {
            try {
                const audio = new Audio(window.AppConfig.shoutoutSound);
                audio.volume = (window.AppConfig.alertVolume || 50) / 100;
                audio.play().catch(e => console.warn("[Shoutout] Звук заблокирован браузером:", e));
            } catch (e) {
                console.warn("[Shoutout] Ошибка воспроизведения звука:", e);
            }
        }

        // Запускаем анимацию появления
        this.container.classList.add('shoutout-in');

        // Ждем время из конфига
        setTimeout(() => {
            this.container.classList.remove('shoutout-in');
            this.container.classList.add('shoutout-out');

            // Полностью прячем после завершения анимации исчезновения
            setTimeout(() => {
                this.container.classList.add('hidden');
                this.playNext();
            }, 800); // 800мс на красивое угасание
        }, window.AppConfig.shoutoutDuration || 8000);
    }
};