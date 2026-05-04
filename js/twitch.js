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
    if (!isMod) return;

    switch (command.toLowerCase()) {
        case "skip":  window.AppQueue.next(); break;
        case "clear": window.AppQueue.clear(); break;
        case "vol":   window.AppPlayer.setVolume(message); break;
        case "testvid": 
            window.AppQueue.add("https://youtu.be/dQw4w9WgXcQ", user); 
            break;
    }
};

if (window.AppConfig.channelName) {
    ComfyJS.Init(window.AppConfig.channelName);
    console.log(`[Twitch] Подключено к: ${window.AppConfig.channelName}`);
} else {
    console.warn("[Twitch] ВНИМАНИЕ: Не забудь вписать свой ник в js/config.js");
}