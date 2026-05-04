// 1. Слушаем сообщения чата (для отрисовки на экране)
ComfyJS.onChat = (user, message, flags, self, extra) => {
    window.AppChat.addMessage(user, message, flags, extra);
};

// 2. Слушаем баллы канала
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
};

// 3. ОБРАБОТЧИК КОМАНД ЧАТА
ComfyJS.onCommand = (user, command, message, flags, extra) => {
    // Проверяем, является ли человек модером или стримером
    const isMod = flags.broadcaster || flags.mod;
    
    // Получаем аргумент после команды (например "off" из "!cam off")
    const arg = message.toLowerCase().trim(); 

    switch (command.toLowerCase()) {
        
        // ==========================================
        // ПУБЛИЧНЫЕ КОМАНДЫ (Доступны всем)
        // ==========================================
        
        case "sr":     
        case "play":   
            if (message !== "") {
                window.AppQueue.add(message, user);
                console.log(`[Twitch] ${user} заказал трек: ${message}`);
            }
            break;

        // ==========================================
        // КОМАНДЫ МОДЕРАТОРОВ (Только стример/модер)
        // ==========================================
        
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

        // НОВЫЕ КОМАНДЫ: УПРАВЛЕНИЕ МЕДИА
        case "cam":
            if (isMod) {
                if (arg === "off") window.AppMedia.toggleCam(false);
                else if (arg === "on") window.AppMedia.toggleCam(true);
                else window.AppMedia.toggleCam(); // Переключатель, если написать просто !cam
            }
            break;

        case "mic":
            if (isMod) {
                if (arg === "off") window.AppMedia.toggleMic(false);
                else if (arg === "on") window.AppMedia.toggleMic(true);
                else window.AppMedia.toggleMic(); // Переключатель, если написать просто !mic
            }
            break;
    }
};

// Подключение к Твичу
if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к каналу: ${window.AppConfig.channelName}`);
} else {
    console.warn("[Twitch] ВНИМАНИЕ: Не забудь вписать свой ник в js/config.js");
}