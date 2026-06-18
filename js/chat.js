/* ================= ЧАТ (ПРОДВИНУТАЯ АРХИТЕКТУРА + ДЕДУПЛИКАТОР) ================= */
window.AppChat = {
    container: document.getElementById('chat-messages'),
    renderedMessageIds: new Set(), // Кэш ID для предотвращения дублирования

    init: function() {
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', (data) => this.renderMessage(data));
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', () => {
            if (window.AppPet) window.AppPet.resetSleepTimer();
        });
    },

    renderMessage: function(data) {
        // ДЕДУПЛИКАЦИЯ: Если сообщение с таким ID уже отрисовано на экране — жестко игнорируем дубликат
        if (data.id) {
            if (this.renderedMessageIds.has(data.id)) {
                console.log(`[DEDUPLICATOR 🛑] Дубликат сообщения отсечен: ${data.user} - ID: ${data.id}`);
                return; 
            }
            this.renderedMessageIds.add(data.id);
            
            // Очищаем старые записи кэша, чтобы не росла память
            if (this.renderedMessageIds.size > 100) {
                this.renderedMessageIds = new Set(Array.from(this.renderedMessageIds).slice(-50));
            }
        }

        let metaHTML = '';
        let extraClasses = '';
        let bellHTML = '';

        if (data.replyData) {
            metaHTML += `
                <div class="chat-reply">
                    <div class="chat-reply-user">
                        <svg class="reply-icon" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                        ${data.replyData.user}
                    </div>
                    <div class="chat-reply-text">${data.replyData.htmlText}</div>
                </div>
            `;
        }

        if (data.isFirstTime) {
            extraClasses += ' is-first-time';
            metaHTML += `
                <div class="chat-badge chat-badge-first">
                    <svg class="badge-sparkle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"></path></svg>
                    Впервые в чате
                </div>
            `;
        }

        if (data.isHighlighted) {
            extraClasses += ' is-highlighted';
            metaHTML += `
                <div class="chat-badge chat-badge-highlight">
                    <svg class="badge-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Выделено за баллы
                </div>
            `;
        }

        if (data.isMention) {
            extraClasses += ' is-mention';
            bellHTML = `<svg class="chat-ping-bell" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`;
        }

        const blockDiv = document.createElement('div');
        blockDiv.className = `chat-block${extraClasses}`;
        blockDiv.setAttribute('data-user', data.user.toLowerCase());
        
        if (data.styleName) {
            blockDiv.setAttribute('data-style', data.styleName);
        }
        
        blockDiv.style.setProperty('--user-color', data.color);
        
        blockDiv.innerHTML = `
            ${metaHTML ? `<div class="chat-meta">${metaHTML}</div>` : ''}
            
            <div class="chat-bubble">
                <div class="chat-header">
                    <img src="${data.avatarUrl}" class="chat-avatar">
                    <span class="chat-user" style="color: ${data.color}">${data.user}</span>
                    <div class="chat-header-right">
                        ${bellHTML}
                        <span class="chat-time">${data.time}</span>
                    </div>
                </div>
                <div class="chat-text">${data.htmlText}</div>
            </div>
        `;
        
        this.container.appendChild(blockDiv);

        const activeMessages = Array.from(this.container.children).filter(el => !el.classList.contains('chat-out'));
        if (activeMessages.length > window.AppConfig.maxChatMessages) {
            const oldestMsg = activeMessages[0];
            oldestMsg.classList.add('chat-out');
            setTimeout(() => { if (oldestMsg.parentNode) oldestMsg.remove(); }, 400);
        }
    }
};

window.AppChat.init();