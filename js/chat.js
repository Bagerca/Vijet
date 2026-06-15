/* ================= ЧАТ (OPTIMIZED DOM RENDERING) ================= */
window.AppChat = {
    container: document.getElementById('chat-messages'),
    activeMessageCount: 0, 
    
    // Кэшируем шаблоны при загрузке, чтобы не искать их каждый раз
    templates: {
        message: document.getElementById('tpl-chat-message'),
        reply: document.getElementById('tpl-chat-reply'),
        badgeFirst: document.getElementById('tpl-chat-badge-first'),
        badgeHigh: document.getElementById('tpl-chat-badge-highlight')
    },

    getColorFromName: function(name) {
        const colors = ["#FF4477", "#00E5FF", "#00FF7F", "#FFD700", "#a29bfe", "#fd79a8", "#74b9ff", "#55efc4", "#ff7675", "#F59E0B"];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    },

    init: function() {
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', (data) => this.renderMessage(data));
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', () => {
            if (window.AppPet) window.AppPet.resetSleepTimer();
        });
    },

    renderMessage: function(data) {
        if (!this.templates.message) return; // Защита

        // 1. Клонируем закэшированный шаблон
        const msgFragment = this.templates.message.content.cloneNode(true);
        const blockNode = msgFragment.querySelector('.chat-block');
        const metaNode = msgFragment.querySelector('.chat-meta');

        // 2. Настраиваем переменные (CSS API)
        blockNode.setAttribute('data-user', data.user.toLowerCase());
        if (data.styleName) blockNode.setAttribute('data-style', data.styleName);
        blockNode.style.setProperty('--user-color', data.color);

        // 3. Быстрое заполнение контента
        msgFragment.querySelector('.chat-user').textContent = data.user;
        msgFragment.querySelector('.chat-user').style.color = data.color;
        msgFragment.querySelector('.chat-time').textContent = data.time;
        msgFragment.querySelector('.chat-avatar').src = data.avatarUrl;
        msgFragment.querySelector('.chat-text').innerHTML = data.htmlText;

        // 4. Опциональные элементы
        let hasMeta = false;

        if (data.replyData) {
            hasMeta = true;
            const replyFrag = this.templates.reply.content.cloneNode(true);
            replyFrag.querySelector('.reply-name').textContent = data.replyData.user;
            replyFrag.querySelector('.chat-reply-text').innerHTML = data.replyData.htmlText;
            replyFrag.querySelector('.chat-reply').style.setProperty('--reply-color', this.getColorFromName(data.replyData.user));
            metaNode.appendChild(replyFrag);
        }

        if (data.isFirstTime) {
            hasMeta = true;
            blockNode.classList.add('is-first-time');
            metaNode.appendChild(this.templates.badgeFirst.content.cloneNode(true));
        }

        if (data.isHighlighted) {
            hasMeta = true;
            blockNode.classList.add('is-highlighted');
            metaNode.appendChild(this.templates.badgeHigh.content.cloneNode(true));
        }

        if (hasMeta) metaNode.style.display = 'flex';

        if (data.isMention) {
            blockNode.classList.add('is-mention');
            msgFragment.querySelector('.chat-ping-bell').style.display = 'block';
        }

        // 5. Рендер
        this.container.appendChild(msgFragment);
        this.activeMessageCount++;

        // 6. Очистка без тяжелого Array.from().filter() на каждый чих
        const maxMsgs = window.AppConfig.maxChatMessages || 12;
        if (this.activeMessageCount > maxMsgs) {
            // Ищем первый элемент, который еще не в процессе удаления
            const oldestMsg = this.container.querySelector('.chat-block:not(.chat-out)');
            if (oldestMsg) {
                oldestMsg.classList.add('chat-out');
                this.activeMessageCount--; // Сразу уменьшаем счетчик
                setTimeout(() => { if (oldestMsg.parentNode) oldestMsg.remove(); }, 400);
            }
        }
    }
};

window.AppChat.init();