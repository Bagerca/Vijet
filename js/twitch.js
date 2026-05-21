ComfyJS.onChat = (user, message, flags, self, extra) => {
    if (window.AppChat) window.AppChat.addMessage(user, message, flags, extra);
    
    if (extra.messageEmotes && window.AppPet) {
        window.AppPet.setEmotion('hype', 3000);
    }

    if (flags.highlighted) {
        if (window.AppTicker) window.AppTicker.showRewardEvent(user, "Выделенное сообщение", message);
        if (window.AppPet) window.AppPet.setEmotion('hype', 3000);
    }
};

ComfyJS.onReward = (user, reward, cost, message, extra) => {
    
    if (window.AppTicker) window.AppTicker.showRewardEvent(user, reward, message);
    if (window.AppPet) window.AppPet.setEmotion('hype', 3000);

    // === НОВАЯ НАГРАДА: КОЛЕСО ФОРТУНЫ ===
    if (reward === window.AppConfig.wheelRewardName && window.AppWheel) {
        window.AppWheel.add(message);
        window.AppWheel.toggle(true); // Автоматически показываем колесо
    }

    if (reward === window.AppConfig.rewardName && window.AppQueue) {
        window.AppQueue.add(message, user);
    }
    
    if (reward === window.AppConfig.ttsRewardName && window.AppTTS) {
        window.AppTTS.add(user, message);
    }
    
    if (reward === window.AppConfig.feedRewardName && window.AppPet) {
        window.AppPet.setEmotion('nom', 6000); 
    }

    if (window.AppAlerts && window.AppConfig.rewards) {
        if (reward === window.AppConfig.rewards.series) window.AppAlerts.add(user, "reward_series", message);
        else if (reward === window.AppConfig.rewards.movie) window.AppAlerts.add(user, "reward_movie", message);
        else if (reward === window.AppConfig.rewards.video) window.AppAlerts.add(user, "reward_video", message);
        else if (reward === window.AppConfig.rewards.game) window.AppAlerts.add(user, "reward_game", message);
        else if (reward === window.AppConfig.rewards.music) window.AppAlerts.add(user, "reward_music", message);
    }
};

ComfyJS.onCommand = (user, command, message, flags, extra) => {
    const isMod = flags.broadcaster || flags.mod;
    const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase());
    const hasPermission = isMod || isAllowedUser;
    
    const arg = message.trim(); // Оставляем оригинальный регистр для рулетки
    const argLow = arg.toLowerCase(); 

    switch (command.toLowerCase()) {
        
        // === КОМАНДЫ РУЛЕТКИ ===
        case "wheel":
        case "рулетка":
            if (hasPermission && window.AppWheel) {
                if (argLow === "show" || argLow === "on") window.AppWheel.toggle(true);
                else if (argLow === "hide" || argLow === "off") window.AppWheel.toggle(false);
                else if (argLow === "clear") window.AppWheel.clear();
                else if (argLow === "spin") window.AppWheel.spin();
                else if (argLow.startsWith("add ")) {
                    window.AppWheel.add(arg.substring(4));
                }
                else if (argLow.startsWith("remove ")) {
                    window.AppWheel.remove(arg.substring(7));
                }
            }
            break;

        case "sr":     
        case "play":   
            if (message !== "" && window.AppQueue) window.AppQueue.add(message, user);
            break;

        case "so":
        case "shoutout":
            if (hasPermission && message !== "" && window.AppShoutout) window.AppShoutout.add(message);
            break;

        case "skip":
            if (hasPermission && window.AppQueue) window.AppQueue.next();
            break;
            
        case "clear":
            if (hasPermission && window.AppQueue) window.AppQueue.clear();
            break;
            
        case "vol":
            if (hasPermission && message !== "" && window.AppPlayer) window.AppPlayer.setVolume(message);
            break;

        case "cam":
            if (hasPermission && window.AppMedia) {
                if (argLow === "off") window.AppMedia.toggleCam(false);
                else if (argLow === "on") window.AppMedia.toggleCam(true);
                else window.AppMedia.toggleCam();
            }
            break;

        case "mic":
            if (hasPermission && window.AppMedia) {
                if (argLow === "off") window.AppMedia.toggleMic(false);
                else if (argLow === "on") window.AppMedia.toggleMic(true);
                else window.AppMedia.toggleMic();
            }
            break;

        case "emotes":
        case "смайлы":
            if (hasPermission && window.AppEmotes) {
                if (argLow === "a" || argLow === "bubble") window.AppEmotes.setMode("bubble");
                else if (argLow === "b" || argLow === "fountain") window.AppEmotes.setMode("fountain");
                else if (argLow === "off") window.AppEmotes.toggle(false);
                else if (argLow === "on") window.AppEmotes.toggle(true);
            }
            break;

        case "tts":
            if (hasPermission && message !== "" && window.AppTTS) {
                if (argLow === "stop" || argLow === "skip") window.AppTTS.stop(); 
                else window.AppTTS.add(user, message);
            }
            break;

        case "blur":
        case "блюр":
            if (hasPermission && window.AppBlur) {
                if (argLow === "off") window.AppBlur.toggle(false);
                else if (argLow === "on") window.AppBlur.toggle(true);
                else window.AppBlur.toggle();
            }
            break;

        case "game":
        case "игра":
            if (hasPermission && window.AppGameInfo) window.AppGameInfo.set(argLow);
            break;

        case "death":
        case "deaths":
        case "смерть":
            if (hasPermission) {
                if (window.AppPet && argLow !== "off" && argLow !== "hide" && argLow !== "-" && argLow !== "sub" && argLow !== "reset" && argLow !== "clear" && !argLow.startsWith("set")) {
                    window.AppPet.setEmotion('scared', 3000);
                }

                if (window.AppDeaths) {
                    if (argLow === "on" || argLow === "show") window.AppDeaths.toggle(true);
                    else if (argLow === "off" || argLow === "hide") window.AppDeaths.toggle(false);
                    else if (argLow === "-" || argLow === "sub") window.AppDeaths.update(1, 'sub');
                    else if (argLow === "reset" || argLow === "clear") window.AppDeaths.update(0, 'set');
                    else if (argLow.startsWith("set ")) {
                        const num = parseInt(argLow.replace("set ", ""));
                        if (!isNaN(num)) window.AppDeaths.update(num, 'set');
                    } 
                    else window.AppDeaths.update(1, 'add');
                }
            }
            break;

        case "fox":
        case "лиса":
        case "лис":
            if (hasPermission && window.AppPet) {
                const allowedStates = ['idle', 'sleep', 'alert', 'hype', 'love', 'scared', 'angry', 'greet', 'bye', 'jam', 'listen', 'nom'];
                
                if (allowedStates.includes(argLow)) {
                    window.AppPet.setEmotion(argLow, 5000); 
                } else if (argLow === "кусь" || argLow === "ням") {
                    window.AppPet.setEmotion('nom', 5000);
                } else if (argLow === "привет") {
                    window.AppPet.setEmotion('greet', 5000);
                } else if (argLow === "пока") {
                    window.AppPet.setEmotion('bye', 5000);
                } else if (argLow === "танцуй" || argLow === "вайб") {
                    window.AppPet.setEmotion('jam', 5000);
                }
            }
            break;

        case "alert":
            if (hasPermission) {
                if (window.AppPet) window.AppPet.setEmotion('love', window.AppConfig.alertDuration || 5000);

                if (window.AppAlerts) {
                    if (argLow === "sub") window.AppAlerts.add("ТестовыйЮзер", "sub");
                    else if (argLow === "resub") window.AppAlerts.add("ОлдРесабер", "resub", "Обожаю этот стрим!", 12);
                    else if (argLow === "gift") window.AppAlerts.add("Богач", "gift", "для СлучайныйЗритель");
                    else if (argLow === "streak") window.AppAlerts.add("ПреданныйЗритель", "streak", "Лучший стример, смотрю каждый день!", 5);
                    else if (argLow === "series") window.AppAlerts.add("Киноман", "reward_series", "Давай смотреть Во все тяжкие!");
                    else if (argLow === "movie") window.AppAlerts.add("Зритель", "reward_movie", "Гарри Поттер пожалуйста");
                    else if (argLow === "video") window.AppAlerts.add("Кекус", "reward_video", "Смешные коты");
                    else if (argLow === "game") window.AppAlerts.add("Геймер", "reward_game", "Го в Доту?");
                    else if (argLow === "music") window.AppAlerts.add("Меломан", "reward_music", "Врубай фонк");
                    else window.AppAlerts.add("НовыйФолловер", "follow");
                }
            }
            break;
    }
};

const triggerPetLove = () => {
    if (window.AppPet) window.AppPet.setEmotion('love', window.AppConfig.alertDuration || 5000);
};

ComfyJS.onSub = (user, message, subTierInfo, extra) => { 
    if (window.AppAlerts) window.AppAlerts.add(user, 'sub', message); 
    triggerPetLove();
};
ComfyJS.onResub = (user, message, streamMonths, cumulativeMonths, subTierInfo, extra) => { 
    if (window.AppAlerts) window.AppAlerts.add(user, 'resub', message, cumulativeMonths); 
    triggerPetLove();
};
ComfyJS.onSubGift = (gifterUser, streakMonths, recipientUser, senderCount, subTierInfo, extra) => { 
    if (window.AppAlerts) window.AppAlerts.add(gifterUser, 'gift', `для ${recipientUser}`); 
    triggerPetLove();
};
ComfyJS.onSubMysteryGift = (gifterUser, numbOfSubs, senderCount, subTierInfo, extra) => { 
    if (window.AppAlerts) window.AppAlerts.add(gifterUser, 'gift', `подарил ${numbOfSubs} саб.!`); 
    triggerPetLove();
};

if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
    ComfyJS.Init(window.AppConfig.channelName);

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

                    if (window.AppAlerts) window.AppAlerts.add(user, "streak", customMsg, streakCount);
                    triggerPetLove();
                }
            }
        });
    }
}