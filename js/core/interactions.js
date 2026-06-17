/* ================= js/core/interactions.js ================= */
/* Модуль обработки интерактивных событий (Награды за баллы, Реакции Питомца) */

window.AppInteractions = {
    greetedUsers: new Set(),

    init: function() {
        window.AppLogger.info("Инициализация контроллера взаимодействий...");

        // Слушаем активацию наград
        window.AppEvents.listen('CHAT_REWARD_ACTIVATED', d => this.handleReward(d.user, d.rewardId, d.message));
        
        // Слушаем семантический разбор чата для реакций питомца
        window.AppEvents.listen('CHAT_MESSAGE_ANALYZED', d => this.handlePetReactions(d));
    },

    handleReward: function(user, rewardId, message) {
        window.AppLogger.info(`🎁 Обработка награды от ${user}: ${rewardId} | Текст: ${message}`);
        window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });
        
        const cfg = window.AppConfig;

        // Рулетка
        if (rewardId === cfg.wheelRewardId) { 
            window.AppCommands.execute(user, "wheel", `add ${message}`, { broadcaster: true });
            window.AppCommands.execute(user, "wheel", "show", { broadcaster: true });
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Рулетка", message });
        }
        // Озвучка (TTS)
        else if (rewardId === cfg.ttsRewardId && window.AppCoreState.widgets.tts) {
            window.AppEvents.emit('TTS_ADD', { user, text: message });
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Озвучка", message });
        }
        // Заказ Музыки
        else if (rewardId === cfg.queueRewardId) {
            window.AppEvents.emit('QUEUE_ADD', { user, url: message });
        }
        // Покормить лису
        else if (rewardId === cfg.feedRewardId) {
            window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 6000 });
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Покормил лису", message });
        }
        // Медиа-алерты (Фильмы, Игры, Сериалы)
        else if (cfg.rewards && window.AppCoreState.widgets.alerts) {
            let matchedCategory = null; 
            let type = null;
            
            if (rewardId === cfg.rewards.series) { type = 'reward_series'; matchedCategory = "Сериал"; }
            else if (rewardId === cfg.rewards.movie) { type = 'reward_movie'; matchedCategory = "Фильм"; }
            else if (rewardId === cfg.rewards.video) { type = 'reward_video'; matchedCategory = "Видео"; }
            else if (rewardId === cfg.rewards.game) { type = 'reward_game'; matchedCategory = "Игра"; }
            else if (rewardId === cfg.rewards.music) { type = 'reward_music'; matchedCategory = "Музыка"; }

            if (type) {
                window.AppEvents.emit('ALERT_ADD', { user, type: type, msg: message });
                window.AppEvents.emit('TICKER_REWARD', { user, reward: matchedCategory, message });
            }
        }
    },

    handlePetReactions: function(data) {
        let petEmotion = null; 
        let petPrio = 0;
        
        const setPet = (emo, prio) => { 
            if (prio > petPrio) { petEmotion = emo; petPrio = prio; } 
        };

        const lowerUser = data.user.toLowerCase();

        // Реакция на запретки
        if (data.hasForbidden) { 
            setPet('angry', 10); 
        } else {
            // Приветствие своих
            const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(lowerUser);
            if ((isAllowedUser || data.isBroadcaster) && !this.greetedUsers.has(lowerUser)) {
                this.greetedUsers.add(lowerUser); 
                setPet('love', 5);
            } 
            
            // Обращение к стримеру
            if (data.isMention) setPet('alert', 4);
            
            // Спам смайликов
            if (data.hasEmotes && window.AppCoreState.widgets.emotes) { 
                setPet('hype', 1); 
            }
        }

        if (petEmotion) {
            window.AppEvents.emit('PET_EMOTION', { emotion: petEmotion, duration: 4000 });
        }
    }
};