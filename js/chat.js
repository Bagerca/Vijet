/* ================= ЧАТ (OPTIMIZED DOM RENDERING + STATE MANAGEMENT) ================= */
window.AppChat = {
    container: document.getElementById('chat-messages'),
    activeMessageCount: 0, 
    
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
        if (!this.templates.message) return;

        // 1. Клонируем закэшированный шаблон
        const msgFragment = this.templates.message.content.cloneNode(true);
        const blockNode = msgFragment.querySelector('.chat-block');
        const metaNode = msgFragment.querySelector('.chat-meta');

        // 2. Настраиваем переменные и Data-атрибуты (Стейт-менеджмент)
        blockNode.setAttribute('data-user', data.user.toLowerCase());
        if (data.styleName) blockNode.setAttribute('data-style', data.styleName);
        blockNode.style.setProperty('--user-color', data.color);

        blockNode.setAttribute('data-msg-type', data.isHighlighted ? 'highlight' : 'normal');
        blockNode.setAttribute('data-mention', data.isMention ? 'true' : 'false');
        blockNode.setAttribute('data-first', data.isFirstTime ? 'true' : 'false');
        blockNode.setAttribute('data-role', data.role || 'viewer');

        // 3. Значки Twitch (Бейджи)
        const badgesContainer = msgFragment.querySelector('.chat-badges');
        if (data.badges) {
            let bHtml = '';
            if (data.badges.broadcaster) bHtml += `<div class="tw-badge tb-broadcaster"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.83L19.5 19h-15L12 5.83zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z"/></svg></div>`;
            else if (data.badges.moderator) bHtml += `<div class="tw-badge tb-mod"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></div>`;
            else if (data.badges.vip) bHtml += `<div class="tw-badge tb-vip"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`;
            if (data.badges.subscriber || data.badges.founder) bHtml += `<div class="tw-badge tb-sub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>`;
            
            badgesContainer.innerHTML = bHtml;
            badgesContainer.style.display = bHtml ? 'flex' : 'none';
        } else {
            badgesContainer.style.display = 'none';
        }

        // 4. Быстрое заполнение контента
        msgFragment.querySelector('.chat-user').textContent = data.user;
        msgFragment.querySelector('.chat-user').style.color = data.color;
        msgFragment.querySelector('.chat-time').textContent = data.time;
        msgFragment.querySelector('.chat-avatar').src = data.avatarUrl;
        msgFragment.querySelector('.chat-text').innerHTML = data.htmlText;

        // 5. Опциональные элементы
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
            metaNode.appendChild(this.templates.badgeFirst.content.cloneNode(true));
        }

        if (data.isHighlighted) {
            hasMeta = true;
            metaNode.appendChild(this.templates.badgeHigh.content.cloneNode(true));
        }

        if (hasMeta) metaNode.style.display = 'flex';

        // 6. Рендер в DOM
        this.container.appendChild(msgFragment);
        this.activeMessageCount++;
        const addedNode = this.container.lastElementChild;

        // 7. Жизненный цикл (Локальный хук после рендера)
        // ВАЖНО: Используем нативный CustomEvent вместо EventBus, 
        // так как DOM-узлы нельзя клонировать и передавать в другие вкладки!
        window.dispatchEvent(new CustomEvent('CHAT_NODE_RENDERED', {
            detail: {
                node: addedNode,
                styleName: data.styleName,
                text: data.htmlText
            }
        }));

        // 8. Очистка старых сообщений
        const maxMsgs = window.AppConfig.maxChatMessages || 12;
        if (this.activeMessageCount > maxMsgs) {
            const oldestMsg = this.container.querySelector('.chat-block:not(.chat-out)');
            if (oldestMsg) {
                oldestMsg.classList.add('chat-out');
                this.activeMessageCount--; 
                setTimeout(() => { if (oldestMsg.parentNode) oldestMsg.remove(); }, 400);
            }
        }
    }
};

window.AppChat.init();