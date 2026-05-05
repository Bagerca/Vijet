ComfyJS.onChat = (user, message, flags, self, extra) => {
    window.AppChat.addMessage(user, message, flags, extra);
};

ComfyJS.onReward = (user, reward, cost, message, extra) => {
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
};

ComfyJS.onCommand = (user, command, message, flags, extra) => {
    const isMod = flags.broadcaster || flags.mod;
    const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase());
    const hasPermission = isMod || isAllowedUser;
    
    const arg = message.toLowerCase().trim(); 

    switch (command.toLowerCase()) {
        
        // --- ПУБЛИЧНЫЕ КОМАНДЫ ---
        case "sr":     
        case "play":   
            if (message !== "") {
                window.AppQueue.add(message, user);
                console.log(`[Twitch] ${user} заказал трек: ${message}`);
            }
            break;

        // --- КОМАНДЫ МОДЕРАТОРОВ И VIP ---
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

        // ==========================================
        // НОВОЕ: УПРАВЛЕНИЕ СЧЕТЧИКОМ СМЕРТЕЙ
        // ==========================================
        case "death":
        case "deaths":
        case "смерть":
            if (hasPermission) {
                if (arg === "on" || arg === "show") {
                    window.AppDeaths.toggle(true); // Включить интерфейс
                } 
                else if (arg === "off" || arg === "hide") {
                    window.AppDeaths.toggle(false); // Выключить интерфейс
                } 
                else if (arg === "-" || arg === "sub") {
                    window.AppDeaths.update(1, 'sub'); // Минус 1 смерть
                } 
                else if (arg === "reset" || arg === "clear") {
                    window.AppDeaths.update(0, 'set'); // Сброс до 0
                } 
                else if (arg.startsWith("set ")) {
                    const num = parseInt(arg.replace("set ", "")); // !death set 15
                    if (!isNaN(num)) window.AppDeaths.update(num, 'set');
                } 
                else {
                    // Если просто написать "!death" или "!death +"
                    window.AppDeaths.update(1, 'add'); // Плюс 1 смерть
                }
            }
            break;

        case "alert":
            if (hasPermission) {
                if (arg === "sub") window.AppAlerts.add("ТестовыйЮзер", "sub");
                else if (arg === "resub") window.AppAlerts.add("ОлдРесабер", "resub", "Обожаю этот стрим!", 12);
                else if (arg === "gift") window.AppAlerts.add("Богач", "gift", "для СлучайныйЗритель");
                else window.AppAlerts.add("НовыйФолловер", "follow");
            }
            break;
    }
};

ComfyJS.onSub = (user, message, subTierInfo, extra) => { window.AppAlerts.add(user, 'sub', message); };
ComfyJS.onResub = (user, message, streamMonths, cumulativeMonths, subTierInfo, extra) => { window.AppAlerts.add(user, 'resub', message, cumulativeMonths); };
ComfyJS.onSubGift = (gifterUser, streakMonths, recipientUser, senderCount, subTierInfo, extra) => { window.AppAlerts.add(gifterUser, 'gift', `для ${recipientUser}`); };
ComfyJS.onSubMysteryGift = (gifterUser, numbOfSubs, senderCount, subTierInfo, extra) => { window.AppAlerts.add(gifterUser, 'gift', `подарил ${numbOfSubs} саб.!`); };

if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к каналу: ${window.AppConfig.channelName}`);
} else {
    console.warn("[Twitch] ВНИМАНИЕ: Не забудь вписать свой ник в js/config.js");
}