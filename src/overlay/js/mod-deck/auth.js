/* ФАЙЛ: js/mod-deck/auth.js */

window.DeckAuth = {
    creds: {
        channel: localStorage.getItem('uso_mod_channel') || '',
        user: localStorage.getItem('uso_mod_user') || '',
        token: localStorage.getItem('uso_mod_token') || ''
    },
    
    activeTargetChannel: '', 
    isConnectedOnce: false, // Флаг успешного коннекта

    init() {
        const modal = document.getElementById('auth-modal');
        
        if (this.creds.channel && this.creds.user && this.creds.token) {
            this.connect();
        } else {
            modal.showModal();
        }

        document.getElementById('btn-connect').addEventListener('click', () => {
            let channel = document.getElementById('auth-channel').value.trim().toLowerCase();
            let user = document.getElementById('auth-user').value.trim().toLowerCase();
            let token = document.getElementById('auth-token').value.trim();

            if (!channel || !user || !token) { 
                alert("Заполните все поля!"); 
                return; 
            }

            // ЖЕСТКАЯ ОЧИСТКА ВВОДА (Убираем кириллицу, пробелы, невидимые символы)
            // Это спасет от ошибки "String contains non ISO-8859-1 code point"
            channel = channel.replace(/[^a-z0-9_]/g, '');
            user = user.replace(/[^a-z0-9_]/g, '');
            token = token.replace(/[^a-zA-Z0-9:]/g, ''); // Оставляем только латиницу, цифры и двоеточие

            if (!token.startsWith('oauth:')) token = 'oauth:' + token;

            localStorage.setItem('uso_mod_channel', channel);
            localStorage.setItem('uso_mod_user', user);
            localStorage.setItem('uso_mod_token', token);

            this.creds = { channel, user, token };
            modal.close();
            this.connect();
        });

        document.getElementById('btn-logout')?.addEventListener('click', () => {
            localStorage.clear(); 
            location.reload();
        });
    },

    connect() {
        // Очищаем кэшированные данные на всякий случай перед отправкой в ComfyJS
        this.creds.channel = this.creds.channel.replace(/[^a-z0-9_]/ig, '');
        this.creds.user = this.creds.user.replace(/[^a-z0-9_]/ig, '');
        this.creds.token = this.creds.token.replace(/[^a-zA-Z0-9:]/g, '');

        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('ui-channel-name').innerText = this.creds.channel;
        
        this.activeTargetChannel = this.creds.channel; 
        
        window.DeckUI.updateStatus('yellow', 'ПОДКЛЮЧЕНИЕ...');

        try {
            ComfyJS.Init(this.creds.user, this.creds.token, [this.creds.channel, this.creds.user]);
            this.setupMonitors();
            this.embedTwitch();
        } catch (error) {
            console.error("[USO] Ошибка инициализации ComfyJS", error);
            this.handleFatalAuthError();
        }
    },

    setTargetChannel(type) {
        if (type === 'main') {
            this.activeTargetChannel = this.creds.channel;
        } else if (type === 'bot') {
            this.activeTargetChannel = this.creds.user;
        }
        window.DeckUI.showToast(`🎯 Чат изменен на: ${this.activeTargetChannel}`);
    },

    setupMonitors() {
        const client = ComfyJS.GetClient();
        if (!client) return;

        client.on("connected", () => {
            this.isConnectedOnce = true;
            window.DeckUI.updateStatus('green', 'ПОДКЛЮЧЕНО');
            window.DeckUI.showToast("⚡ СВЯЗЬ УСТАНОВЛЕНА");
        });

        client.on("disconnected", (reason) => {
            window.DeckUI.updateStatus('red', 'ОТКЛЮЧЕНО');
            console.warn("[USO] Соединение разорвано:", reason);

            // Если мы отключились НИ РАЗУ не подключившись успешно (битый токен)
            if (!this.isConnectedOnce || reason === "Login authentication failed") {
                this.handleFatalAuthError();
            }
        });

        client.on("reconnect", () => {
            if (!localStorage.getItem('uso_mod_token')) return;
            window.DeckUI.updateStatus('yellow', 'ПЕРЕПОДКЛЮЧЕНИЕ');
        });

        ComfyJS.onCommand = (user, command, message, flags) => {
            if (flags.broadcaster || flags.mod || user.toLowerCase() === this.creds.user.toLowerCase()) {
                window.DeckWidgets.syncToggleFromChat(command, message);
            }
        };

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible' && client.readyState() !== "OPEN") {
                if (!localStorage.getItem('uso_mod_token')) return;
                window.DeckUI.updateStatus('yellow', 'ВОССТАНОВЛЕНИЕ...');
                client.connect().catch(e => console.warn("Ошибка реконнекта:", e));
            }
        });
    },

    handleFatalAuthError() {
        window.DeckUI.showToast('❌ ОШИБКА АВТОРИЗАЦИИ! Сброс...');
        localStorage.removeItem('uso_mod_token');
        this.creds.token = '';
        
        try { 
            const client = ComfyJS.GetClient();
            if (client) client.disconnect(); 
        } catch (e) {}

        // Перезапускаем интерфейс, чтобы ввести токен заново
        setTimeout(() => {
            location.reload();
        }, 2000);
    },

    embedTwitch() {
        const channelName = this.creds.channel;
        let currentDomain = window.location.hostname || "localhost";

        document.getElementById('twitch-video-container').innerHTML = '';
        document.getElementById('twitch-chat-container').innerHTML = '';

        try {
            new Twitch.Embed("twitch-video-container", {
                width: "100%", height: "100%",
                channel: channelName, layout: "video", autoplay: true, muted: true,
                parent: [currentDomain, "github.io"] 
            });

            const chatIframe = document.createElement('iframe');
            let iframeSrc = `https://www.twitch.tv/embed/${channelName}/chat?darkpopout&parent=${currentDomain}`;
            if (currentDomain.includes('github.io')) iframeSrc += `&parent=github.io`;
            
            chatIframe.src = iframeSrc;
            chatIframe.style.cssText = "width: 100%; height: 100%; border: none;";
            document.getElementById('twitch-chat-container').appendChild(chatIframe);
        } catch (e) {
            console.warn("[USO] Ошибка встройки Twitch:", e);
        }
    },

    sendCommand(cmdString) {
        if (!cmdString?.trim()) return;
        
        const client = ComfyJS.GetClient();
        if (client && client.readyState() === "OPEN") {
            ComfyJS.Say(cmdString, this.activeTargetChannel);
            window.DeckUI.showToast(`✔️ Отправлено`);
        } else {
            window.DeckUI.showToast(`❌ НЕТ СВЯЗИ`);
            window.DeckUI.updateStatus('red', 'ОТКЛЮЧЕНО');
            if (client) client.connect().catch(() => {});
        }
    }
};