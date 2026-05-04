// 1. Слушаем сообщения чата (для отрисовки на экране)
ComfyJS.onChat = (user, message, flags, self, extra) => {
    window.AppChat.addMessage(user, message, flags, extra);
};

// 2. Слушаем баллы канала (Заказ музыки)
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
};

// 3. ОБРАБОТЧИК КОМАНД ЧАТА
ComfyJS.onCommand = (user, command, message, flags, extra) => {
    const isMod = flags.broadcaster || flags.mod;
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

        // --- КОМАНДЫ МОДЕРАТОРОВ (Медиа и Плеер) ---
        case "skip":
            if (isMod) window.AppQueue.next();
            break;
            
        case "clear":
            if (isMod) window.AppQueue.clear();
            break;
            
        case "vol":
            if (isMod && message !== "") {
                window.AppPlayer.setVolume(message);
            }
            break;

        case "cam":
            if (isMod) {
                if (arg === "off") window.AppMedia.toggleCam(false);
                else if (arg === "on") window.AppMedia.toggleCam(true);
                else window.AppMedia.toggleCam();
            }
            break;

        case "mic":
            if (isMod) {
                if (arg === "off") window.AppMedia.toggleMic(false);
                else if (arg === "on") window.AppMedia.toggleMic(true);
                else window.AppMedia.toggleMic();
            }
            break;

        // --- КОМАНДА ДЛЯ ТЕСТИРОВАНИЯ АЛЕРТОВ ---
        case "alert":
            if (isMod) {
                if (arg === "sub") window.AppAlerts.add("ТестовыйЮзер", "sub");
                else if (arg === "resub") window.AppAlerts.add("ОлдРесабер", "resub", "Обожаю этот стрим!", 12);
                else if (arg === "gift") window.AppAlerts.add("Богач", "gift", "для СлучайныйЗритель");
                else window.AppAlerts.add("НовыйФолловер", "follow"); // Фоллоу по умолчанию
            }
            break;
    }
};

// 4. СОБЫТИЯ ПОДПИСОК (АЛЕРТЫ)

ComfyJS.onSub = (user, message, subTierInfo, extra) => {
    window.AppAlerts.add(user, 'sub', message);
};

ComfyJS.onResub = (user, message, streamMonths, cumulativeMonths, subTierInfo, extra) => {
    window.AppAlerts.add(user, 'resub', message, cumulativeMonths);
};

ComfyJS.onSubGift = (gifterUser, streakMonths, recipientUser, senderCount, subTierInfo, extra) => {
    window.AppAlerts.add(gifterUser, 'gift', `для ${recipientUser}`);
};

ComfyJS.onSubMysteryGift = (gifterUser, numbOfSubs, senderCount, subTierInfo, extra) => {
    window.AppAlerts.add(gifterUser, 'gift', `подарил ${numbOfSubs} саб.!`);
};

// Подключение к Твичу
if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к каналу: ${window.AppConfig.channelName}`);
} else {
    console.warn("[Twitch] ВНИМАНИЕ: Не забудь вписать свой ник в js/config.js");
}