window.AppChat = {
    container: document.getElementById('chat-messages'),

    addMessage: function(user, message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        
        // Защита от HTML-инъекций (XSS)
        const safeMsg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        msgDiv.innerHTML = `<span class="chat-user">${user}</span><span class="chat-text">${safeMsg}</span>`;
        this.container.appendChild(msgDiv);

        // Удаление старых сообщений (лимит)
        if (this.container.children.length > window.AppConfig.maxChatMessages) {
            this.container.removeChild(this.container.firstChild);
        }

        // Таймер на исчезновение
        setTimeout(() => {
            msgDiv.style.opacity = '0';
            setTimeout(() => {
                if (msgDiv.parentNode) msgDiv.remove();
            }, 500); // Ждем конец анимации прозрачности
        }, window.AppConfig.chatMsgLifetime);
    }
};