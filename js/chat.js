window.AppChat = {
    container: document.getElementById('chat-messages'),

    addMessage: function(user, message, flags, extra) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        
        // Получаем цвет пользователя из Твича или ставим белый по умолчанию
        const userColor = extra.userColor || '#bf94ff';
        
        // Защита от взлома через чат
        const safeMsg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        msgDiv.innerHTML = `
            <div class="message-header">
                <span class="chat-user" style="color: ${userColor}">${user}:</span>
            </div>
            <div class="chat-text">${safeMsg}</div>
        `;
        
        this.container.appendChild(msgDiv);

        // Лимит сообщений
        if (this.container.children.length > window.AppConfig.maxChatMessages) {
            this.container.removeChild(this.container.firstChild);
        }

        // Удаление по таймеру
        setTimeout(() => {
            msgDiv.classList.add('fade-out');
            setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 1000);
        }, window.AppConfig.chatMsgLifetime);
    }
};