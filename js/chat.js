window.AppChat = {
    container: document.getElementById('chat-messages'),
    avatarCache: {}, 

    addMessage: async function(user, message, flags, extra) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        
        // Цвет пользователя (если его нет, берем фиолетовый)
        const userColor = extra.userColor || '#9146FF';
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        // Парсим смайлы
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

        if (this.container.children.length > window.AppConfig.maxChatMessages) {
            this.container.removeChild(this.container.firstChild);
        }

        setTimeout(() => {
            msgDiv.style.opacity = '0';
            setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 500);
        }, window.AppConfig.chatMsgLifetime);

        // Получаем аватарку (передаем цвет для генерации заглушки)
        const avatarUrl = await this.getAvatar(user, userColor);
        const avatarImg = msgDiv.querySelector(`#avatar-${extra.id}`);
        if (avatarImg) avatarImg.src = avatarUrl;
    },

    // Умное получение аватарки
    getAvatar: async function(username, userColor) {
        if (this.avatarCache[username]) return this.avatarCache[username];
        
        try {
            const response = await fetch(`https://decapi.me/twitch/avatar/${username}`);
            const url = await response.text();

            // Если вернулся стандартный пустой аватар Твича или ошибка -> идем в catch
            if (url.includes("user-default-pictures") || url.includes("Error") || url.includes("not found")) {
                throw new Error("No custom avatar");
            }

            this.avatarCache[username] = url; 
            return url;
            
        } catch (e) {
            // ГЕНЕРАЦИЯ КРАСИВОЙ АВАТАРКИ
            // Убираем решетку из hex-цвета (#9146FF -> 9146FF)
            let hexColor = userColor.replace('#', '');
            
            // Генерируем картинку: первая буква ника + цвет пользователя + белый текст
            let fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${hexColor}&color=fff&size=64&bold=true`;
            
            this.avatarCache[username] = fallbackUrl;
            return fallbackUrl;
        }
    },

    // Парсер смайликов
    parseEmotes: function(message, emotes) {
        if (!emotes) return this.escapeHTML(message);

        let stringArr = message.split('');
        for (let id in emotes) {
            let emotePositions = emotes[id];
            for (let i = 0; i < emotePositions.length; i++) {
                let pos = emotePositions[i].split('-');
                let start = parseInt(pos[0]);
                let end = parseInt(pos[1]);
                
                stringArr[start] = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0" class="chat-emote">`;
                for (let j = start + 1; j <= end; j++) {
                    stringArr[j] = ''; 
                }
            }
        }

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