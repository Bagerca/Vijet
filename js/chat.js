window.AppChat = {
    container: document.getElementById('chat-messages'),
    avatarCache: {}, 

    addMessage: async function(user, message, flags, extra) {
        // 1. Берем цвет юзера
        const userColor = extra.userColor || '#9146FF';
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const parsedMessage = this.parseEmotes(message, extra.messageEmotes);

        // 2. СНАЧАЛА получаем аватарку (из кэша или API), чтобы не было мерцаний
        const avatarUrl = await this.getAvatar(user, userColor);

        // 3. Создаем элемент сообщения
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.style.borderLeft = `4px solid ${userColor}`;
        
        // НОВАЯ СТРУКТУРА: Аватарка и ник в одном ряду, текст под ними
        msgDiv.innerHTML = `
            <div class="chat-header">
                <img src="${avatarUrl}" class="chat-avatar">
                <span class="chat-user" style="color: ${userColor}">${user}</span>
                <span class="chat-time">${time}</span>
            </div>
            <div class="chat-text">${parsedMessage}</div>
        `;
        
        // 4. Добавляем в контейнер
        this.container.appendChild(msgDiv);

        // 5. Логика лимита сообщений (если превышен maxChatMessages)
        // Ищем все сообщения, КРОМЕ тех, что уже в процессе удаления
        const activeMessages = Array.from(this.container.children).filter(el => !el.classList.contains('chat-out'));

        if (activeMessages.length > window.AppConfig.maxChatMessages) {
            // Берем самое старое сообщение
            const oldestMsg = activeMessages[0];
            
            // Запускаем красивую анимацию исчезновения
            oldestMsg.classList.add('chat-out');
            
            // Ждем завершения анимации (0.4с) и физически удаляем из DOM
            setTimeout(() => {
                if (oldestMsg.parentNode) {
                    oldestMsg.remove();
                }
            }, 400);
        }
    },

    getAvatar: async function(username, userColor) {
        // Если уже загружали эту аватарку, моментально отдаем из кэша
        if (this.avatarCache[username]) return this.avatarCache[username];
        
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].logo) {
                // Сохраняем в кэш
                this.avatarCache[username] = data[0].logo; 
                return data[0].logo;
            }
            throw new Error("Нет кастомной аватарки");
        } catch (e) {
            // Если аватарки нет, генерируем заглушку (с инициалом)
            let hexColor = userColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${hexColor}&color=fff&size=64&bold=true`;
            this.avatarCache[username] = fallbackUrl;
            return fallbackUrl;
        }
    },

    parseEmotes: function(message, emotes) {
        if (!emotes) return this.escapeHTML(message);

        let stringArr = message.split('');
        for (let id in emotes) {
            let emotePositions = emotes[id];
            for (let i = 0; i < emotePositions.length; i++) {
                let pos = emotePositions[i].split('-');
                let start = parseInt(pos[0]); let end = parseInt(pos[1]);
                stringArr[start] = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0" class="chat-emote">`;
                for (let j = start + 1; j <= end; j++) stringArr[j] = ''; 
            }
        }

        let finalStr = '';
        for (let i = 0; i < stringArr.length; i++) {
            if (stringArr[i].startsWith('<img')) finalStr += stringArr[i];
            else finalStr += this.escapeHTML(stringArr[i]);
        }
        return finalStr;
    },

    escapeHTML: function(str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
};