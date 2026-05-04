window.AppChat = {
    container: document.getElementById('chat-messages'),
    avatarCache: {}, // Кэш аватарок, чтобы не грузить одно и то же

    addMessage: async function(user, message, flags, extra) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        
        // Базовая структура с серой заглушкой вместо аватарки
        const userColor = extra.userColor || '#ffffff';
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        // Обработка смайлов и защита
        const parsedMessage = this.parseEmotes(message, extra.messageEmotes);

        msgDiv.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" class="chat-avatar" id="avatar-${extra.id}">
            <div class="chat-content">
                <div class="chat-header">
                    <span class="chat-user" style="color: ${userColor}">${user}</span>
                    <span class="chat-time">${time}</span>
                </div>
                <div class="chat-text">${parsedMessage}</div>
            </div>
        `;
        
        this.container.appendChild(msgDiv);

        // Лимит сообщений
        if (this.container.children.length > window.AppConfig.maxChatMessages) {
            this.container.removeChild(this.container.firstChild);
        }

        // Удаление по таймеру
        setTimeout(() => {
            msgDiv.style.opacity = '0';
            setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 500);
        }, window.AppConfig.chatMsgLifetime);

        // Асинхронно подгружаем аватарку
        const avatarUrl = await this.getAvatar(user);
        const avatarImg = msgDiv.querySelector(`#avatar-${extra.id}`);
        if (avatarImg) avatarImg.src = avatarUrl;
    },

    // Функция получения аватарки
    getAvatar: async function(username) {
        if (this.avatarCache[username]) return this.avatarCache[username];
        try {
            // Используем публичный API для получения URL аватарки Твича
            const response = await fetch(`https://decapi.me/twitch/avatar/${username}`);
            const url = await response.text();
            this.avatarCache[username] = url; // Сохраняем в кэш
            return url;
        } catch (e) {
            // Если ошибка - ставим дефолтную Твич аватарку
            return 'https://static-cdn.jtvnw.net/user-default-pictures-uv/41780b5a-def8-11e9-94d9-784f43822e80-profile_image-70x70.png';
        }
    },

    // Функция замены текста на смайлики
    parseEmotes: function(message, emotes) {
        if (!emotes) return this.escapeHTML(message);

        let stringArr = message.split('');
        for (let id in emotes) {
            let emotePositions = emotes[id];
            for (let i = 0; i < emotePositions.length; i++) {
                let pos = emotePositions[i].split('-');
                let start = parseInt(pos[0]);
                let end = parseInt(pos[1]);
                
                // Вставляем HTML картинки вместо начала слова
                stringArr[start] = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0" class="chat-emote">`;
                // Очищаем остальные буквы слова
                for (let j = start + 1; j <= end; j++) {
                    stringArr[j] = ''; 
                }
            }
        }

        // Собираем обратно, экранируя обычный текст, чтобы нас не взломали
        let finalStr = '';
        for (let i = 0; i < stringArr.length; i++) {
            if (stringArr[i].startsWith('<img')) {
                finalStr += stringArr[i];
            } else {
                finalStr += this.escapeHTML(stringArr[i]);
            }
        }
        return finalStr;
    },

    escapeHTML: function(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};