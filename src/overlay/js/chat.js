/* ФАЙЛ: js/chat.js */
/* ================= ЧАТ (СТАБИЛЬНЫЙ РЕНДЕР С ОЧИСТКОЙ VRAM) ================= */
window.AppChat = {
    container: document.getElementById('chat-messages'),
    maxMessages: window.AppConfig.maxChatMessages || 12,

    init: function() {
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', (data) => this.renderMessage(data));
        // Слушаем сигнал асинхронного обновления аватарки
        window.AppEvents.listen('CHAT_UPDATE_AVATAR', (data) => this.updateAvatar(data));
        
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', () => {
            if (window.AppPet) window.AppPet.resetSleepTimer();
        });
    },

    updateAvatar: function(data) {
        // Находим сообщение по ID и подменяем ему картинку на лету
        const msgBlock = document.getElementById(data.id);
        if (msgBlock) {
            msgBlock.style.setProperty('--avatar-img', `url('${data.avatarUrl}')`);
        }
    },

    renderMessage: function(data) {
        let stateClasses = ''; 
        let badgesHTML = '';
        let replyHTML = '';
        let bellHTML = '';

        if (data.isFirstTime) {
            stateClasses += ' is-first-time';
            badgesHTML += `<div class="chat-badge chat-badge-first"><svg class="badge-sparkle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"></path></svg><span>Впервые</span></div>`;
        }
        if (data.isHighlighted) {
            stateClasses += ' is-highlighted';
            badgesHTML += `<div class="chat-badge chat-badge-highlight"><svg class="badge-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span>Выделено</span></div>`;
        }
        if (data.isMention) {
            stateClasses += ' is-mention';
            bellHTML = `<svg class="chat-ping-bell" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`;
        }

        if (data.replyData) {
            replyHTML = `
                <div class="chat-reply">
                    <div class="chat-reply-user">
                        <svg class="reply-icon" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                        <span>${data.replyData.user}</span>
                    </div>
                    <div class="chat-reply-text">${data.replyData.htmlText}</div>
                </div>
            `;
        }

        const blockDiv = document.createElement('div');
        blockDiv.id = data.id; // Устанавливаем ID для поиска
        blockDiv.className = `chat-block${stateClasses}`;
        blockDiv.setAttribute('data-style', data.styleName ? data.styleName : 'default');
        blockDiv.setAttribute('data-user', data.user.toLowerCase());
        
        blockDiv.style.setProperty('--user-color', data.color);
        blockDiv.style.setProperty('--avatar-img', `url('${data.avatarUrl}')`);
        blockDiv.style.willChange = 'transform, opacity';

        blockDiv.innerHTML = `
            <div class="chat-fx-backdrop"></div>
            <div class="chat-bubble">
                <div class="chat-bubble-bg"></div>
                <div class="chat-avatar-slot">
                    <div class="chat-avatar"></div>
                </div>
                <div class="chat-content">
                    ${replyHTML}
                    <div class="chat-header">
                        <div class="chat-header-info">
                            ${badgesHTML ? `<div class="chat-badges-wrap">${badgesHTML}</div>` : ''}
                            <span class="chat-user">${data.user}</span>
                        </div>
                        <div class="chat-header-right">
                            ${bellHTML}
                            <span class="chat-time">${data.time}</span>
                        </div>
                    </div>
                    <div class="chat-text">
                        <div class="chat-text-inner">${data.htmlText}</div>
                    </div>
                </div>
            </div>
            <div class="chat-fx-front"></div>
        `;
        
        // Синхронное добавление гарантирует, что сообщения не "перепутаются" при одновременном спаме
        this.container.appendChild(blockDiv);

        // --- ИСПРАВЛЕННАЯ ЛОГИКА ОЧИСТКИ СТАРЫХ СООБЩЕНИЙ ---
        // Ищем только "живые" сообщения (исключаем те, которые уже анимируются на выход)
        const activeMessages = Array.from(this.container.querySelectorAll('.chat-block:not(.chat-out)'));

        if (activeMessages.length > this.maxMessages) {
            const excessCount = activeMessages.length - this.maxMessages;
            
            // Удаляем строго самое старое из живых
            for (let i = 0; i < excessCount; i++) {
                const msgToHide = activeMessages[i];
                msgToHide.classList.add('chat-out');
                
                // Удаляем из DOM только после завершения анимации исчезновения
                msgToHide.addEventListener('animationend', (e) => {
                    if (e.animationName === 'slideOutChat') {
                        msgToHide.style.setProperty('--avatar-img', 'none'); // Сброс VRAM
                        msgToHide.remove();
                    }
                }, { once: true });
            }
        }
    }
};

window.AppChat.init();