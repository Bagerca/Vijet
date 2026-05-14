window.AppChat = {
    container: document.getElementById('chat-messages'),
    avatarCache: {}, 

    init: function() {
        // Восстанавливаем кеш аватарок из хранилища (чтобы не спамить API при перезагрузке)
        const savedAvatars = localStorage.getItem('uso_avatars');
        if (savedAvatars) {
            try {
                this.avatarCache = JSON.parse(savedAvatars);
            } catch (e) {
                this.avatarCache = {};
            }
        }
    },

    addMessage: async function(user, message, flags, extra) {
        // СБРОС ТАЙМЕРА СНА ДЛЯ ПИТОМЦА ПРИ КАЖДОМ СООБЩЕНИИ
        if (window.AppPet) window.AppPet.resetSleepTimer();

        const userColor = extra.userColor || '#FF4477'; // По умолчанию розовый
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        // 1. Парсим смайлы и экранируем текст
        let parsedMessage = this.parseEmotes(message, extra.messageEmotes);
        
        // 2. ПРОПУСКАЕМ ЧЕРЕЗ ФИЛЬТР ЗАПРЕТОК
        parsedMessage = this.filterForbiddenWords(parsedMessage);

        // ==========================================
        // ПЕРЕДАЕМ ЭМОДЗИ ДЛЯ АНИМАЦИИ НА ЭКРАНЕ
        // ==========================================
        if (extra.messageEmotes && window.AppEmotes) {
            window.AppEmotes.spawn(extra.messageEmotes);
        }

        const avatarUrl = await this.getAvatar(user, userColor);

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.style.borderLeft = `4px solid ${userColor}`;
        
        msgDiv.innerHTML = `
            <div class="chat-header">
                <img src="${avatarUrl}" class="chat-avatar">
                <span class="chat-user" style="color: ${userColor}">${user}</span>
                <span class="chat-time">${time}</span>
            </div>
            <div class="chat-text">${parsedMessage}</div>
        `;
        
        this.container.appendChild(msgDiv);

        const activeMessages = Array.from(this.container.children).filter(el => !el.classList.contains('chat-out'));

        if (activeMessages.length > window.AppConfig.maxChatMessages) {
            const oldestMsg = activeMessages[0];
            oldestMsg.classList.add('chat-out');
            setTimeout(() => {
                if (oldestMsg.parentNode) oldestMsg.remove();
            }, 400);
        }
    },

    filterForbiddenWords: function(htmlString) {
        const words = window.AppConfig.forbiddenWords || [];
        if (words.length === 0) return htmlString;

        let result = htmlString;
        let hasForbidden = false; // Флаг для определения запреток

        words.forEach(word => {
            const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?![^<]*>)(${safeWord})`, 'gi');
            
            // Если найдено плохое слово, ставим флаг
            if (regex.test(result)) hasForbidden = true; 
            
            result = result.replace(regex, `<span class="blurred-word">$1</span>`);
        });

        // Если в сообщении была запретка, лисичка злится на 4 секунды
        if (hasForbidden && window.AppPet) {
            window.AppPet.setEmotion('angry', 4000);
        }

        return result;
    },

    getAvatar: async function(username, userColor) {
        // Если есть в локальном кеше — сразу отдаем
        if (this.avatarCache[username]) return this.avatarCache[username];
        
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].logo) {
                this.avatarCache[username] = data[0].logo; 
                
                // Обновляем базу аватарок в localStorage
                localStorage.setItem('uso_avatars', JSON.stringify(this.avatarCache));
                
                return data[0].logo;
            }
            throw new Error("Нет кастомной аватарки");
        } catch (e) {
            let hexColor = userColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${hexColor}&color=fff&size=64&bold=true`;
            
            this.avatarCache[username] = fallbackUrl;
            // Обновляем базу
            localStorage.setItem('uso_avatars', JSON.stringify(this.avatarCache));
            
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

// Инициализация чата
window.AppChat.init();