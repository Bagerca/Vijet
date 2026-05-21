/* ================= ЧАТ (ГЛУПЫЙ ВИДЖЕТ) ================= */
window.AppChat = {
    container: document.getElementById('chat-messages'),

    init: function() {
        // Подписываемся на события от Ядра
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', (data) => this.renderMessage(data));
        
        // Сброс таймера сна питомца (пока оставим это здесь, потом перенесем в ядро)
        window.AppEvents.listen('CHAT_RENDER_MESSAGE', () => {
            if (window.AppPet) window.AppPet.resetSleepTimer();
        });
    },

    renderMessage: function(data) {
        let replyHTML = '';

        if (data.replyData) {
            replyHTML = `
                <div class="chat-reply">
                    <div class="chat-reply-user">
                        <svg class="reply-icon" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                        ${data.replyData.user}
                    </div>
                    <div class="chat-reply-text">${data.replyData.htmlText}</div>
                </div>
            `;
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.style.borderLeft = `4px solid ${data.color}`;
        
        msgDiv.innerHTML = `
            ${replyHTML}
            <div class="chat-header">
                <img src="${data.avatarUrl}" class="chat-avatar">
                <span class="chat-user" style="color: ${data.color}">${data.user}</span>
                <span class="chat-time">${data.time}</span>
            </div>
            <div class="chat-text">${data.htmlText}</div>
        `;
        
        this.container.appendChild(msgDiv);

        // Удаление старых сообщений
        const activeMessages = Array.from(this.container.children).filter(el => !el.classList.contains('chat-out'));
        if (activeMessages.length > window.AppConfig.maxChatMessages) {
            const oldestMsg = activeMessages[0];
            oldestMsg.classList.add('chat-out');
            setTimeout(() => {
                if (oldestMsg.parentNode) oldestMsg.remove();
            }, 400);
        }
    }
};

window.AppChat.init();