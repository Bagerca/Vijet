ComfyJS.onChat = (user, message, flags, self, extra) => {
    window.AppChat.addMessage(user, message, flags, extra);
};

// ОБРАБОТЧИК БАЛЛОВ КАНАЛА
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    // 1. Награда: Заказать видео
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
    // 2. Награда: Озвучить сообщение (TTS)
    if (reward === window.AppConfig.ttsRewardName && window.AppTTS) {
        window.AppTTS.add(user, message);
    }
};

ComfyJS.onCommand = (user, command, message, flags, extra) => {
    const isMod = flags.broadcaster || flags.mod;
    const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase());
    const hasPermission = isMod || isAllowedUser;
    
    const arg = message.toLowerCase().trim(); 

    switch (command.toLowerCase()) {
        
        case "sr":     
        case "play":   
            if (message !== "") {
                window.AppQueue.add(message, user);
                console.log(`[Twitch] ${user} заказал трек: ${message}`);
            }
            break;

        case "so":
        case "shoutout":
            if (hasPermission && message !== "") window.AppShoutout.add(message);
            break;

        case "skip":
            if (hasPermission) window.AppQueue.next();
            break;
            
        case "clear":
            if (hasPermission) window.AppQueue.clear();
            break;
            
        case "vol":
            if (hasPermission && message !== "") window.AppPlayer.setVolume(message);
            break;

        case "cam":
            if (hasPermission) {
                if (arg === "off") window.AppMedia.toggleCam(false);
                else if (arg === "on") window.AppMedia.toggleCam(true);
                else window.AppMedia.toggleCam();
            }
            break;

        case "mic":
            if (hasPermission) {
                if (arg === "off") window.AppMedia.toggleMic(false);
                else if (arg === "on") window.AppMedia.toggleMic(true);
                else window.AppMedia.toggleMic();
            }
            break;

        case "emotes":
        case "смайлы":
            if (hasPermission && window.AppEmotes) {
                if (arg === "a" || arg === "bubble") window.AppEmotes.setMode("bubble");
                else if (arg === "b" || arg === "fountain") window.AppEmotes.setMode("fountain");
                else if (arg === "off") window.AppEmotes.toggle(false);
                else if (arg === "on") window.AppEmotes.toggle(true);
            }
            break;

        case "tts":
            if (hasPermission && message !== "" && window.AppTTS) {
                if (arg === "stop" || arg === "skip") {
                    window.AppTTS.stop(); 
                } else {
                    window.AppTTS.add(user, message);
                }
            }
            break;

        case "game":
        case "игра":
            if (hasPermission) window.AppGameLogo.set(arg);
            break;

        case "death":
        case "deaths":
        case "смерть":
            if (hasPermission) {
                if (arg === "on" || arg === "show") window.AppDeaths.toggle(true);
                else if (arg === "off" || arg === "hide") window.AppDeaths.toggle(false);
                else if (arg === "-" || arg === "sub") window.AppDeaths.update(1, 'sub');
                else if (arg === "reset" || arg === "clear") window.AppDeaths.update(0, 'set');
                else if (arg.startsWith("set ")) {
                    const num = parseInt(arg.replace("set ", ""));
                    if (!isNaN(num)) window.AppDeaths.update(num, 'set');
                } 
                else window.AppDeaths.update(1, 'add');
            }
            break;

        case "alert":
            if (hasPermission) {
                if (arg === "sub") window.AppAlerts.add("ТестовыйЮзер", "sub");
                else if (arg === "resub") window.AppAlerts.add("ОлдРесабер", "resub", "Обожаю этот стрим!", 12);
                else if (arg === "gift") window.AppAlerts.add("Богач", "gift", "для СлучайныйЗритель");
                // НОВАЯ КОМАНДА ДЛЯ ТЕСТА СЕРИИ ПРОСМОТРОВ
                else if (arg === "streak") window.AppAlerts.add("ПреданныйЗритель", "streak", "Лучший стример, смотрю каждый день!", 5);
                else window.AppAlerts.add("НовыйФолловер", "follow");
            }
            break;
    }
};

ComfyJS.onSub = (user, message, subTierInfo, extra) => { window.AppAlerts.add(user, 'sub', message); };
ComfyJS.onResub = (user, message, streamMonths, cumulativeMonths, subTierInfo, extra) => { window.AppAlerts.add(user, 'resub', message, cumulativeMonths); };
ComfyJS.onSubGift = (gifterUser, streakMonths, recipientUser, senderCount, subTierInfo, extra) => { window.AppAlerts.add(gifterUser, 'gift', `для ${recipientUser}`); };
ComfyJS.onSubMysteryGift = (gifterUser, numbOfSubs, senderCount, subTierInfo, extra) => { window.AppAlerts.add(gifterUser, 'gift', `подарил ${numbOfSubs} саб.!`); };

// ПОДКЛЮЧЕНИЕ К КАНАЛУ
if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
    ComfyJS.Init(window.AppConfig.channelName);

    // =================================================================
    // ПЕРЕХВАТ СЫРЫХ СОБЫТИЙ TWITCH (ДЛЯ СЕРИИ ПРОСМОТРОВ)
    // =================================================================
    const client = ComfyJS.GetClient();
    if (client) {
        client.on("raw_message", (messageCloned, message) => {
            if (message.command === "USERNOTICE" && message.tags) {
                if (message.tags["msg-id"] === "viewermilestone") {
                    
                    const user = message.tags["display-name"] || message.tags["login"];
                    const streakCount = message.tags["msg-param-value"]; 
                    
                    let customMsg = "";
                    if (message.params && message.params.length > 1) {
                        customMsg = message.params[1];
                    }

                    window.AppAlerts.add(user, "streak", customMsg, streakCount);
                }
            }
        });
    }
}