const TwitchAPI = {
    channel: null,
    
    connect: function(creds) {
        this.channel = creds.channel;
        window.UIBuilder.setLiveStatus('connecting');
        ComfyJS.Init(creds.user, creds.token, creds.channel);
        
        ComfyJS.onConnected = () => { 
            window.UIBuilder.setLiveStatus('connected'); 
            window.ToastService.show("⚡ СВЯЗЬ УСТАНОВЛЕНА"); 
            setTimeout(() => window.SyncEngine.requestSync(), 1500);
        };
        ComfyJS.onDisconnected = () => window.UIBuilder.setLiveStatus('error');
        ComfyJS.onReconnect = () => window.UIBuilder.setLiveStatus('connecting');

        ComfyJS.onMessage = (user, message, flags, self, extra) => {
            if (self) return; 
            if (window.SyncEngine.parseChatSync(message)) {
                console.log("[TWITCH] Служебное сообщение перехвачено.");
            }
        };

        this.embedIframes(creds.channel);
    },

    send: function(commandStr, customChannel = null) {
        if (!commandStr) return;
        const client = ComfyJS.GetClient();
        
        // Выбор чата для отправки (Основа или Мой чат)
        const targetChannel = customChannel || this.channel;

        if (client && client.readyState() === "OPEN") {
            ComfyJS.Say(commandStr, targetChannel); 
            window.ToastService.show("✔️ Отправлено");
        } else {
            window.ToastService.show("❌ ОШИБКА: НЕТ СВЯЗИ", true); 
            window.UIBuilder.setLiveStatus('error');
            if (client) client.connect().catch(e => {});
        }
    },

    embedIframes: function(channel) {
        let d = window.location.hostname; if (!d || d === "127.0.0.1") d = "localhost";
        try {
            new Twitch.Embed("twitch-video-container", { width: "100%", height: "100%", channel: channel, layout: "video", autoplay: true, muted: true, parent: [d, "github.io"] });
            const f = document.createElement('iframe'); 
            f.src = `https://www.twitch.tv/embed/${channel}/chat?darkpopout&parent=${d}${d.includes('github.io') ? '&parent=github.io' : ''}`; 
            f.style.cssText = "width:100%;height:100%;border:none;"; 
            document.getElementById('twitch-chat-container').appendChild(f);
        } catch (e) {}
    }
};

window.TwitchAPI = TwitchAPI;