/* ФАЙЛ: js/mod-deck/auth.js */

window.DeckAuth = {
    creds: {
        channel: localStorage.getItem('uso_mod_channel') || '',
        user: localStorage.getItem('uso_mod_user') || '',
        token: localStorage.getItem('uso_mod_token') || ''
    },
    
    activeTargetChannel: '', // Канал, куда сейчас полетят команды

    init() {
        const modal = document.getElementById('auth-modal');
        
        if (this.creds.channel && this.creds.user && this.creds.token) {
            this.connect();
        } else {
            modal.showModal();
        }

        document.getElementById('btn-connect').addEventListener('click', () => {
            const channel = document.getElementById('auth-channel').value.trim().toLowerCase();
            const user = document.getElementById('auth-user').value.trim().toLowerCase();
            let token = document.getElementById('auth-token').value.trim();

            if (!channel || !user || !token) { 
                alert("Заполните все поля!"); 
                return; 
            }
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
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('ui-channel-name').innerText = this.creds.channel;
        
        // По умолчанию стреляем в основной канал
        this.activeTargetChannel = this.creds.channel; 
        
        window.DeckUI.updateStatus('yellow', 'ПОДКЛЮЧЕНИЕ...');

        try {
            // ВАЖНО: Подключаемся сразу к двум каналам для прослушки (К основному и к каналу бота)
            ComfyJS.Init(this.creds.user, this.creds.token, [this.creds.channel, this.creds.user]);
            this.setupMonitors();
            this.embedTwitch();
        } catch (error) {
            console.error("[USO] Ошибка инициализации ComfyJS", error);
            window.DeckUI.showToast('❌ ОШИБКА ПОДКЛЮЧЕНИЯ');
        }
    },

    setTargetChannel(type) {
        if (type === 'main') {
            this.activeTargetChannel = this.creds.channel;
        } else if (type === 'bot') {
            this.activeTargetChannel = this.creds.user; // Аккаунт модера/бота
        }
        window.DeckUI.showToast(`🎯 Чат изменен на: ${this.activeTargetChannel}`);
    },

    setupMonitors() {
        const client = ComfyJS.GetClient();
        if (!client) return;

        client.on("connected", () => {
            window.DeckUI.updateStatus('green', 'ПОДКЛЮЧЕНО');
            window.DeckUI.showToast("⚡ СВЯЗЬ УСТАНОВЛЕНА");
        });

        client.on("disconnected", (reason) => {
            window.DeckUI.updateStatus('red', 'ОТКЛЮЧЕНО');
            console.warn("[USO] Соединение разорвано:", reason);
        });

        client.on("reconnect", () => {
            window.DeckUI.updateStatus('yellow', 'ПЕРЕПОДКЛЮЧЕНИЕ');
        });

        // Слушаем чат для обратной синхронизации тумблеров
        ComfyJS.onCommand = (user, command, message, flags) => {
            if (flags.broadcaster || flags.mod || user.toLowerCase() === this.creds.user.toLowerCase()) {
                window.DeckWidgets.syncToggleFromChat(command, message);
            }
        };

        // Авто-пробуждение
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible' && client.readyState() !== "OPEN") {
                window.DeckUI.updateStatus('yellow', 'ВОССТАНОВЛЕНИЕ...');
                client.connect().catch(e => console.warn("Ошибка реконнекта:", e));
            }
        });
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
            // ВАЖНО: Отправляем команду в АКТИВНЫЙ целевой чат
            ComfyJS.Say(cmdString, this.activeTargetChannel);
            window.DeckUI.showToast(`✔️ Отправлено`);
        } else {
            window.DeckUI.showToast(`❌ НЕТ СВЯЗИ`);
            window.DeckUI.updateStatus('red', 'ОТКЛЮЧЕНО');
            if (client) client.connect().catch(() => {});
        }
    }
};