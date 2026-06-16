/* ================= ЧАТ V2.0 (OBJECT POOLING & ULTRA-PERFORMANCE) ================= */

window.AppChat = {
    container: document.getElementById('chat-messages'),
    
    // --- Система пула ---
    pool: [],       // Склад свободных (скрытых) сообщений
    active: [],     // Массив сообщений, которые сейчас на экране
    poolSize: 25,   // Размер склада (Лимит + Запас на случай спама)

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
        if (!this.templates.message) return;

        // 1. ИНИЦИАЛИЗАЦИЯ ПУЛА (Создаем DOM-узлы заранее)
        const maxMsgs = window.AppConfig.maxChatMessages || 12;
        this.poolSize = maxMsgs + 10; // Лимит + буфер
        
        for (let i = 0; i < this.poolSize; i++) {
            const frag = this.templates.message.content.cloneNode(true);
            const block = frag.querySelector('.chat-block');
            
            // Кэшируем ссылки на внутренние элементы, чтобы не делать тяжелый querySelector при каждом сообщении
            block.ui = {
                meta: block.querySelector('.chat-meta'),
                avatar: block.querySelector('.chat-avatar'),
                badges: block.querySelector('.chat-badges'),
                user: block.querySelector('.chat-user'),
                time: block.querySelector('.chat-time'),
                text: block.querySelector('.chat-text')
            };
            
            this.pool.push(block);
        }

        // Подписка на события
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', (data) => this.renderMessage(data));
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', () => {
            if (window.AppPet) window.AppPet.resetSleepTimer();
        });
    },

    // Очистка узла перед возвратом в работу
    cleanElement: function(el) {
        el.className = 'chat-block'; // Сброс классов (убирает анимацию ухода)
        el.removeAttribute('data-style');
        el.setAttribute('data-msg-type', 'normal');
        el.setAttribute('data-role', 'viewer');
        el.setAttribute('data-first', 'false');
        el.setAttribute('data-mention', 'false');
        el.style.removeProperty('--user-color');
        
        // Быстрая очистка внутренностей
        el.ui.meta.innerHTML = '';
        el.ui.meta.style.display = 'none';
        el.ui.badges.innerHTML = '';
        el.ui.badges.style.display = 'none';
        el.ui.text.innerHTML = '';
        
        return el;
    },

    renderMessage: function(data) {
        // 1. ДОСТАЕМ ЭЛЕМЕНТ ИЗ ПУЛА
        let el;
        if (this.pool.length > 0) {
            el = this.pool.pop();
        } else {
            // Аварийный режим: если пул пуст (жесточайший спам), 
            // моментально крадем самое старое сообщение с экрана
            el = this.active.shift();
            if (el && el.parentNode) el.remove();
        }

        if (!el) return;

        // 2. ОБНУЛЯЕМ ЕГО СОСТОЯНИЕ
        this.cleanElement(el);

        // 3. ЗАПОЛНЯЕМ НОВЫМИ ДАННЫМИ
        el.setAttribute('data-user', data.user.toLowerCase());
        if (data.styleName) el.setAttribute('data-style', data.styleName);
        el.style.setProperty('--user-color', data.color);
        el.setAttribute('data-msg-type', data.isHighlighted ? 'highlight' : 'normal');
        el.setAttribute('data-mention', data.isMention ? 'true' : 'false');
        el.setAttribute('data-first', data.isFirstTime ? 'true' : 'false');
        el.setAttribute('data-role', data.role || 'viewer');

        // Значки Twitch
        if (data.badges) {
            let bHtml = '';
            if (data.badges.broadcaster) bHtml += `<div class="tw-badge tb-broadcaster"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.83L19.5 19h-15L12 5.83zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z"/></svg></div>`;
            else if (data.badges.moderator) bHtml += `<div class="tw-badge tb-mod"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></div>`;
            else if (data.badges.vip) bHtml += `<div class="tw-badge tb-vip"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`;
            if (data.badges.subscriber || data.badges.founder) bHtml += `<div class="tw-badge tb-sub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>`;
            
            if (bHtml) {
                el.ui.badges.innerHTML = bHtml;
                el.ui.badges.style.display = 'flex';
            }
        }

        el.ui.user.textContent = data.user;
        el.ui.user.style.color = data.color;
        el.ui.time.textContent = data.time;
        el.ui.avatar.src = data.avatarUrl;
        el.ui.text.innerHTML = data.htmlText;

        // Блок Меты (реплаи и бейджики)
        let hasMeta = false;
        const badgesWrapper = document.createElement('div');
        badgesWrapper.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap; width: 100%;";
        
        if (data.isFirstTime) {
            hasMeta = true;
            badgesWrapper.appendChild(this.templates.badgeFirst.content.cloneNode(true));
        }

        if (data.isHighlighted) {
            hasMeta = true;
            badgesWrapper.appendChild(this.templates.badgeHigh.content.cloneNode(true));
        }

        if (badgesWrapper.childNodes.length > 0) {
            el.ui.meta.appendChild(badgesWrapper);
        }

        if (data.replyData) {
            hasMeta = true;
            const replyFrag = this.templates.reply.content.cloneNode(true);
            replyFrag.querySelector('.reply-name').textContent = data.replyData.user;
            replyFrag.querySelector('.chat-reply-text').innerHTML = data.replyData.htmlText;
            replyFrag.querySelector('.chat-reply').style.setProperty('--reply-color', this.getColorFromName(data.replyData.user));
            el.ui.meta.appendChild(replyFrag);
        }

        if (hasMeta) el.ui.meta.style.display = 'flex';

        // 4. ДОБАВЛЯЕМ В КОНЕЦ ЧАТА И РЕГИСТРИРУЕМ
        this.container.appendChild(el);
        this.active.push(el);

        // Отправляем эвент для других скриптов, если им нужно что-то сделать с узлом
        window.dispatchEvent(new CustomEvent('CHAT_NODE_RENDERED', {
            detail: { node: el, styleName: data.styleName, text: data.htmlText }
        }));

        // 5. ПРОВЕРЯЕМ ЛИМИТ ЧАТА (Выгоняем старые сообщения)
        const maxMsgs = window.AppConfig.maxChatMessages || 12;
        if (this.active.length > maxMsgs) {
            const oldestMsg = this.active.shift();
            
            if (oldestMsg) {
                // Запускаем CSS анимацию исчезновения
                oldestMsg.classList.add('chat-out');
                
                // Ждем, пока анимация пройдет (400ms как в chat.css)
                setTimeout(() => { 
                    if (oldestMsg.parentNode) oldestMsg.remove(); 
                    // ВОЗВРАЩАЕМ ЭЛЕМЕНТ В ПУЛ ДЛЯ СЛЕДУЮЩИХ СООБЩЕНИЙ
                    this.pool.unshift(oldestMsg); 
                }, 400); 
            }
        }
    }
};

window.AppChat.init();