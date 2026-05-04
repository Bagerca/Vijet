// Обработка наград за баллы
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
};

// Обработка команд модераторов (!skip, !clear, !vol)
ComfyJS.onCommand = (user, command, message, flags, extra) => {
    // Проверяем, есть ли права (стример или модер)
    const hasPermission = flags.broadcaster || flags.mod;
    if (!hasPermission) return;

    switch (command.toLowerCase()) {
        case "skip":
            console.log(`[Twitch] Модератор ${user} скипнул видео.`);
            window.AppQueue.next();
            break;
            
        case "clear":
            console.log(`[Twitch] Модератор ${user} очистил очередь.`);
            window.AppQueue.clear();
            break;
            
        case "vol":
            if (message !== "") {
                window.AppPlayer.setVolume(message);
            }
            break;
    }
};

// Инициализация подключения
if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_КАНАЛ") {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к каналу: ${window.AppConfig.channelName}`);
} else {
    console.error("[Twitch] ОШИБКА: Укажи свой никнейм в js/config.js!");
}