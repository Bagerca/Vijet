window.AppChat = {
    container: document.getElementById('chat-messages'),
    avatarCache: {}, 

    init: function() {
        const savedAvatars = localStorage.getItem('uso_avatars');
        if (savedAvatars) {
            try { this.avatarCache = JSON.parse(savedAvatars); } 
            catch (e) { this.avatarCache = {}; }
        }
    },

    addMessage: async function(user, message, flags, extra) {
        if (window.AppPet) window.AppPet.resetSleepTimer();

        const userColor = extra.userColor || '#FF4477'; 
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        // 1. Сначала парсим смайлы и запретки
        let parsedMessage = this.parseEmotes(message, extra.messageEmotes);
        parsedMessage = this.filterForbiddenWords(parsedMessage);

        if (extra.messageEmotes && window.AppEmotes) {
            window.AppEmotes.spawn(extra.messageEmotes);
        }

        const avatarUrl = await this.getAvatar(user, userColor);

        // ==========================================
        // ЛОГИКА ОФИЦИАЛЬНЫХ ОТВЕТОВ TWITCH (REPLY)
        // ==========================================
        let replyHTML = '';
        const userState = extra.userState || {};

        if (userState['reply-parent-display-name']) {
            const replyUser = userState['reply-parent-display-name'];
            let replyTextRaw = (userState['reply-parent-msg-body'] || '').replace(/\\s/g, ' '); 
            
            // ИСПРАВЛЕНИЕ: Удаляем @Никнейм в начале ЦИТИРУЕМОГО текста (если человек ответил на ответ)
            replyTextRaw = replyTextRaw.replace(/^@[a-zA-Z0-9_]+\s*,?\s*/i, '');

            let cleanReplyText = this.filterForbiddenWords(this.escapeHTML(replyTextRaw)); 

            // НОВЫЙ ВИЗУАЛ: Добавлена SVG-иконка стрелочки
            replyHTML = `
                <div class="chat-reply">
                    <div class="chat-reply-user">
                        <svg class="reply-icon" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                        ${replyUser}
                    </div>
                    <div class="chat-reply-text">${cleanReplyText}</div>
                </div>
            `;

            // Убираем визуальное "@Никнейм " в начале самого сообщения (отвечающего)
            const mentionRegex = new RegExp(`^@${replyUser}\\s*,?\\s*`, 'i');
            parsedMessage = parsedMessage.replace(mentionRegex, '');
        }
        // ==========================================

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.style.borderLeft = `4px solid ${userColor}`;
        
        msgDiv.innerHTML = `
            ${replyHTML}
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
        let hasForbidden = false; 

        words.forEach(word => {
            const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(?![^<]*>)(${safeWord})`, 'gi');
            
            if (regex.test(result)) hasForbidden = true; 
            result = result.replace(regex, `<span class="blurred-word">$1</span>`);
        });

        if (hasForbidden && window.AppPet) window.AppPet.setEmotion('angry', 4000);
        return result;
    },

    getAvatar: async function(username, userColor) {
        if (this.avatarCache[username]) return this.avatarCache[username];
        
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].logo) {
                this.avatarCache[username] = data[0].logo; 
                localStorage.setItem('uso_avatars', JSON.stringify(this.avatarCache));
                return data[0].logo;
            }
            throw new Error("Нет кастомной аватарки");
        } catch (e) {
            let hexColor = userColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${hexColor}&color=fff&size=64&bold=true`;
            this.avatarCache[username] = fallbackUrl;
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

window.AppChat.init();