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

        this.container.style.boxShadow = `0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px ${userColor}55`;
        this.container.style.borderTop = `4px solid ${userColor}`;

        this.container.innerHTML = `
            <div class="shoutout-avatar-wrapper" style="box-shadow: 0 0 25px ${userColor}88;">
                <img src="${avatarUrl}" class="shoutout-avatar">
            </div>
            <div class="shoutout-info">
                <div class="shoutout-badge">ОБРАТИТЕ ВНИМАНИЕ</div>
                <div class="shoutout-name" style="color: ${userColor}; text-shadow: 0 0 15px ${userColor}88;">${displayName}</div>
                <div class="shoutout-cta">Залетайте на канал и жмите фоллоу! 💜</div>
                <div class="shoutout-url">twitch.tv/<span>${userData.login}</span></div>
            </div>
        `;

        this.container.classList.remove('hidden');
        this.container.classList.remove('shoutout-out');
        this.container.classList.add('shoutout-in');

        setTimeout(() => {
            this.container.classList.remove('shoutout-in');
            this.container.classList.add('shoutout-out');

            setTimeout(() => {
                this.container.classList.add('hidden');
                this.playNext();
            }, 600); 
        }, window.AppConfig.shoutoutDuration || 8000);
    }
};