// 1. Слушаем сообщения чата
ComfyJS.onChat = (user, message, flags, self, extra) => {
    window.AppChat.addMessage(user, message);
};

// 2. Слушаем баллы канала (Музыка)
ComfyJS.onReward = (user, reward, cost, message, extra) => {
    if (reward === window.AppConfig.rewardName) {
        window.AppQueue.add(message, user);
    }
};

// 3. Слушаем команды модераторов
ComfyJS.onCommand = (user, command, message, flags, extra) => {
    const isMod = flags.broadcaster || flags.mod;
    if (!isMod) return;

    switch (command.toLowerCase()) {
        case "skip":  window.AppQueue.next(); break;
        case "clear": window.AppQueue.clear(); break;
        case "vol":   window.AppPlayer.setVolume(message); break;
    }
};

// Подключение к Твичу
if (window.AppConfig.channelName) {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к: ${window.AppConfig.channelName}`);
}