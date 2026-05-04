// 1. Слушаем сообщения чата (для отрисовки на экране)
ComfyJS.onChat = (user, message, flags, self, extra) => {
    window.AppChat.addMessage(user, message, flags, extra);
};

// 2. Слушаем баллы канала (На будущее, пусть остается)
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
};

// 3. ОБНОВЛЕННЫЕ КОМАНДЫ ЧАТА
ComfyJS.onCommand = (user, command, message, flags, extra) => {
    // Проверяем, является ли человек модером или стримером
    const isMod = flags.broadcaster || flags.mod;

    switch (command.toLowerCase()) {
        
        // ==========================================
        // ПУБЛИЧНЫЕ КОМАНДЫ (Доступны всем зрителям)
        // ==========================================
        
        case "sr":     // Команда !sr (Song Request)
        case "play":   // Команда !play
            if (message !== "") {
                // message - это текст после команды, то есть сама ссылка
                window.AppQueue.add(message, user);
                console.log(`[Twitch] ${user} заказал трек: ${message}`);
            }
            break;


        // ==========================================
        // КОМАНДЫ МОДЕРАТОРОВ (Только стример/модер)
        // ==========================================
        
        case "skip":
            if (isMod) {
                console.log(`[Twitch] Модератор ${user} скипнул трек`);
                window.AppQueue.next();
            }
            break;
            
        case "clear":
            if (isMod) {
                console.log(`[Twitch] Модератор ${user} очистил очередь`);
                window.AppQueue.clear();
            }
            break;
            
        case "vol":
            if (isMod && message !== "") {
                window.AppPlayer.setVolume(message);
                console.log(`[Twitch] Модератор ${user} изменил громкость на ${message}%`);
            }
            break;
    }
};

// Подключение к Твичу
if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к: ${window.AppConfig.channelName}`);
} else {
    console.warn("[Twitch] ВНИМАНИЕ: Не забудь вписать свой ник в js/config.js");
}