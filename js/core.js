/* ================= CORE (ЯДРО СИСТЕМЫ) ================= */
window.AppCore = {
    avatarCache: {},
    greetedUsers: new Set(), 

    init: function() {
        const now = Date.now();
        const lastClear = localStorage.getItem('uso_avatars_last_clear');
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

        if (!lastClear || (now - parseInt(lastClear)) > ONE_WEEK) {
            console.log("[CORE] Плановая очистка старого кэша аватаров.");
            localStorage.removeItem('uso_avatars');
            localStorage.setItem('uso_avatars_last_clear', now.toString());
            this.avatarCache = {};
        } else {
            const savedAvatars = localStorage.getItem('uso_avatars');
            if (savedAvatars) {
                try { this.avatarCache = JSON.parse(savedAvatars); } catch (e) { this.avatarCache = {}; }
            } else {
                this.avatarCache = {};
            }
        }

        if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
            console.log(`[CORE] Подключение к каналу: ${window.AppConfig.channelName}...`);
            ComfyJS.Init(window.AppConfig.channelName);
            this.setupEvents();
        } else {
            console.warn("[CORE ❌] Имя канала не настроено в config.js!");
        }
    },

    setupEvents: function() {
        ComfyJS.onChat = async (user, message, flags, self, extra) => {
            const userColor = extra.userColor || '#FF4477'; 
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const lowerUser = user.toLowerCase();
            
            let parsedMessage = this.parseEmotes(message, extra.messageEmotes);
            let { text: cleanText, hasForbidden } = this.filterForbiddenWords(parsedMessage);
            
            if (hasForbidden) {
                window.AppEvents.emit('PET_EMOTION', { emotion: 'angry', duration: 4000 });
            } 
            else {
                const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(lowerUser);
                const isStreamer = flags.broadcaster;
                
                if ((isAllowedUser || isStreamer) && !this.greetedUsers.has(lowerUser)) {
                    this.greetedUsers.add(lowerUser);
                    window.AppEvents.emit('PET_EMOTION', { emotion: 'love', duration: 4000 });
                } 
                else if (extra.messageEmotes) {
                    window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });
                    window.AppEvents.emit('EMOTES_SPAWN', extra.messageEmotes);
                }
            }
            
            if (flags.highlighted) {
                window.AppEvents.emit('TICKER_REWARD', { user, reward: "Выделенное сообщение", message });
                window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });
            }

            const avatarUrl = await this.getAvatar(user, userColor);

            let replyData = null;
            if (extra.userState && extra.userState['reply-parent-display-name']) {
                const replyUser = extra.userState['reply-parent-display-name'];
                let replyTextRaw = (extra.userState['reply-parent-msg-body'] || '').replace(/\\s/g, ' '); 
                replyTextRaw = replyTextRaw.replace(/^@[a-zA-Z0-9_]+\s*,?\s*/i, '');
                
                let cleanReply = this.filterForbiddenWords(this.escapeHTML(replyTextRaw)).text;
                replyData = { user: replyUser, htmlText: cleanReply };

                const mentionRegex = new RegExp(`^@${replyUser}\\s*,?\\s*`, 'i');
                cleanText = cleanText.replace(mentionRegex, '');
            }

            window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                user, color: userColor, avatarUrl, time, htmlText: cleanText, replyData
            });
        };

        ComfyJS.onReward = (user, reward, cost, message, extra) => {
            window.AppEvents.emit('TICKER_REWARD', { user, reward, message });
            window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });

            if (reward === window.AppConfig.wheelRewardName) {
                window.AppEvents.emit('WHEEL_ADD', { text: message });
                window.AppEvents.emit('WHEEL_TOGGLE', { state: true });
            }
            if (reward === window.AppConfig.rewardName) window.AppEvents.emit('QUEUE_ADD', { user, url: message });
            if (reward === window.AppConfig.ttsRewardName) window.AppEvents.emit('TTS_ADD', { user, text: message });
            if (reward === window.AppConfig.feedRewardName) window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 6000 });

            const rewards = window.AppConfig.rewards;
            if (rewards) {
                if (reward === rewards.series) window.AppEvents.emit('ALERT_ADD', { user, type: 'reward_series', msg: message });
                else if (reward === rewards.movie) window.AppEvents.emit('ALERT_ADD', { user, type: 'reward_movie', msg: message });
                else if (reward === rewards.video) window.AppEvents.emit('ALERT_ADD', { user, type: 'reward_video', msg: message });
                else if (reward === rewards.game) window.AppEvents.emit('ALERT_ADD', { user, type: 'reward_game', msg: message });
                else if (reward === rewards.music) window.AppEvents.emit('ALERT_ADD', { user, type: 'reward_music', msg: message });
            }
        };

        const triggerLove = () => window.AppEvents.emit('PET_EMOTION', { emotion: 'love', duration: 5000 });
        
        ComfyJS.onSub = (user, message) => { window.AppEvents.emit('ALERT_ADD', { user, type: 'sub', msg: message }); triggerLove(); };
        ComfyJS.onResub = (user, message, sMonths, cMonths) => { window.AppEvents.emit('ALERT_ADD', { user, type: 'resub', msg: message, val: cMonths }); triggerLove(); };
        ComfyJS.onSubGift = (gifter, streak, recUser) => { window.AppEvents.emit('ALERT_ADD', { user: gifter, type: 'gift', msg: `для ${recUser}` }); triggerLove(); };
        ComfyJS.onSubMysteryGift = (gifter, numb) => { window.AppEvents.emit('ALERT_ADD', { user: gifter, type: 'gift', msg: `подарил ${numb} саб.!` }); triggerLove(); };

        ComfyJS.onCommand = (user, command, message, flags) => {
            const isMod = flags.broadcaster || flags.mod;
            const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase());
            const hasPermission = isMod || isAllowedUser;
            
            const arg = message.trim();
            const argLow = arg.toLowerCase(); 

            switch (command.toLowerCase()) {
                case "wheel":
                case "рулетка":
                    if (hasPermission) {
                        if (argLow === "show" || argLow === "on") window.AppEvents.emit('WHEEL_TOGGLE', { state: true });
                        else if (argLow === "hide" || argLow === "off") window.AppEvents.emit('WHEEL_TOGGLE', { state: false });
                        else if (argLow === "clear") window.AppEvents.emit('WHEEL_CMD', { cmd: 'clear' });
                        else if (argLow === "spin") window.AppEvents.emit('WHEEL_CMD', { cmd: 'spin' });
                        else if (argLow.startsWith("add ")) window.AppEvents.emit('WHEEL_ADD', { text: arg.substring(4) });
                        else if (argLow.startsWith("remove ")) window.AppEvents.emit('WHEEL_CMD', { cmd: 'remove', val: arg.substring(7) });
                    }
                    break;
                case "sr":     
                case "play":   
                    if (message !== "") window.AppEvents.emit('QUEUE_ADD', { user, url: message });
                    break;
                case "so":
                case "shoutout":
                    if (hasPermission && message !== "") window.AppEvents.emit('SHOUTOUT_ADD', { user: message });
                    break;
                case "skip": 
                    if (hasPermission) {
                        if (argLow === "all") window.AppEvents.emit('QUEUE_CMD', { cmd: 'skip_all' });
                        else window.AppEvents.emit('QUEUE_CMD', { cmd: 'skip_track' });
                    }
                    break;
                case "clear": if (hasPermission) window.AppEvents.emit('QUEUE_CMD', { cmd: 'clear' }); break;
                case "vol": if (hasPermission && message !== "") window.AppEvents.emit('PLAYER_VOL', { vol: message }); break;
                case "cam": if (hasPermission) window.AppEvents.emit('MEDIA_CAM', { state: argLow }); break;
                case "mic": if (hasPermission) window.AppEvents.emit('MEDIA_MIC', { state: argLow }); break;
                case "emotes":
                case "смайлы":
                    if (hasPermission) window.AppEvents.emit('EMOTES_CMD', { cmd: argLow });
                    break;
                case "tts":
                    if (hasPermission && message !== "") {
                        if (argLow === "stop" || argLow === "skip") window.AppEvents.emit('TTS_CMD', { cmd: 'stop' }); 
                        else window.AppEvents.emit('TTS_ADD', { user, text: message });
                    }
                    break;
                case "blur":
                case "блюр":
                    if (hasPermission) window.AppEvents.emit('BLUR_TOGGLE', { state: argLow });
                    break;
                case "game":
                case "игра":
                    if (hasPermission) window.AppEvents.emit('GAME_SET', { game: argLow });
                    break;
                case "death":
                case "deaths":
                case "смерть":
                    if (hasPermission) {
                        if (argLow !== "off" && argLow !== "hide" && argLow !== "-" && argLow !== "sub" && argLow !== "reset" && argLow !== "clear" && !argLow.startsWith("set")) {
                            window.AppEvents.emit('PET_EMOTION', { emotion: 'scared', duration: 3000 });
                        }
                        window.AppEvents.emit('DEATHS_CMD', { cmd: argLow });
                    }
                    break;
                case "fox":
                case "лиса":
                case "лис":
                    if (hasPermission) {
                        const states = ['idle', 'sleep', 'alert', 'hype', 'love', 'scared', 'angry', 'greet', 'bye', 'jam', 'listen', 'nom'];
                        if (states.includes(argLow)) window.AppEvents.emit('PET_EMOTION', { emotion: argLow, duration: 5000 });
                        else if (argLow === "кусь" || argLow === "ням") window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 5000 });
                        else if (argLow === "привет") window.AppEvents.emit('PET_EMOTION', { emotion: 'greet', duration: 5000 });
                        else if (argLow === "пока") window.AppEvents.emit('PET_EMOTION', { emotion: 'bye', duration: 5000 });
                        else if (argLow === "танцуй" || argLow === "вайб") window.AppEvents.emit('PET_EMOTION', { emotion: 'jam', duration: 5000 });
                    }
                    break;
                case "alert":
                    if (hasPermission) {
                        triggerLove();
                        window.AppEvents.emit('ALERT_TEST', { type: argLow });
                    }
                    break;
            }
        };

        const client = ComfyJS.GetClient();
        if (client) {
            client.on("raw_message", (messageCloned, message) => {
                if (message.command === "USERNOTICE" && message.tags && message.tags["msg-id"] === "viewermilestone") {
                    const user = message.tags["display-name"] || message.tags["login"];
                    const streakCount = message.tags["msg-param-value"]; 
                    let customMsg = (message.params && message.params.length > 1) ? message.params[1] : "";
                    window.AppEvents.emit('ALERT_ADD', { user, type: 'streak', msg: customMsg, val: streakCount });
                    triggerLove();
                }
            });
        }
    },

    getAvatar: async function(username, userColor) {
        if (this.avatarCache[username]) return this.avatarCache[username];
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
            const data = await response.json();
            if (data && data.length > 0 && data[0].logo) {
                this.avatarCache[username] = data[0].logo; 
                localStorage.setItem('uso_avatars', JSON.stringify(this.avatarCache));
                return data[0].logo;
            }
            throw new Error("Нет кастомной аватарки");
        } catch (e) {
            let hexColor = userColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${hexColor}&color=fff&size=64&bold=true`;
            this.avatarCache[username] = fallbackUrl;
            localStorage.setItem('uso_avatars', JSON.stringify(this.avatarCache));
            return fallbackUrl;
        }
    },

    // ==================================================
    // СОВЕРШЕННЫЙ ФИЛЬТР ЗАПРЕТНЫХ СЛОВ (v3)
    // ==================================================
    filterForbiddenWords: function(htmlString) {
        const words = window.AppConfig.forbiddenWords || [];
        if (words.length === 0) return { text: htmlString, hasForbidden: false };

        let hasForbidden = false; 
        
        // 1. ВРЕМЕННО ПРЯЧЕМ СМАЙЛЫ, чтобы случайно не сломать их теги <img>
        const tags = [];
        let safeString = htmlString.replace(/<[^>]+>/g, (match) => {
            tags.push(match);
            return `__TAG_${tags.length - 1}__`;
        });

        // 2. УРОВЕНЬ 1: Классический поиск (точные совпадения)
        words.forEach(word => {
            const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${safeWord})`, 'gi');
            if (regex.test(safeString)) {
                hasForbidden = true;
                safeString = safeString.replace(regex, `<span class="censured-badge">CENSURED</span>`);
            }
        });

        // 3. УРОВЕНЬ 2: Агрессивный детектив (обходы, пробелы, цифры, спам буквами)
        if (!hasForbidden) {
            // Вытаскиваем голый текст
            let textOnly = htmlString.replace(/<[^>]+>/g, '');
            // Мощная нормализация (убирает пробелы, переводит цифры в буквы, схлопывает "пппппидор")
            let normalized = this.normalizeText(textOnly);

            for (let word of words) {
                let cleanRoot = this.normalizeText(word);
                if (cleanRoot.length > 2 && normalized.includes(cleanRoot)) {
                    hasForbidden = true;
                    // Если поймали обход - прячем ВСЁ сообщение
                    safeString = `<div class="censured-message">СООБЩЕНИЕ СКРЫТО ФИЛЬТРОМ</div>`;
                    tags.length = 0; // Удаляем смайлы из памяти
                    break;
                }
            }
        }

        // 4. ВОЗВРАЩАЕМ СМАЙЛЫ НА МЕСТО
        let finalResult = safeString.replace(/__TAG_(\d+)__/g, (match, p1) => {
            return tags[p1] || match;
        });

        return { text: finalResult, hasForbidden };
    },

    // Вспомогательная функция, которая ломает любые уловки зрителей
    normalizeText: function(text) {
        const map = {
            'a':'а', 'e':'е', 'o':'о', 'p':'р', 'c':'с', 'x':'х', 'y':'у', 
            'k':'к', 'm':'м', 't':'т', 'b':'в', '0':'о', '1':'и', '3':'з', 
            '4':'ч', '6':'б', '8':'в', '@':'а'
        };
        let lower = text.toLowerCase();
        let normalized = '';
        for (let char of lower) {
            normalized += map[char] || char; 
        }
        
        // Оставляем ТОЛЬКО буквы (удаляем точки, тире, пробелы)
        normalized = normalized.replace(/[^а-яёa-z]/g, '');
        
        // Схлопываем повторяющиеся подряд буквы (ннннеееееггггррр -> негр)
        let deduplicated = '';
        for (let i = 0; i < normalized.length; i++) {
            if (normalized[i] !== normalized[i-1]) {
                deduplicated += normalized[i];
            }
        }
        return deduplicated;
    },

    parseEmotes: function(message, emotes) {
        if (!emotes) return this.escapeHTML(message);
        let stringArr = message.split('');
        for (let id in emotes) {
            let emotePositions = emotes[id];
            for (let i = 0; i < emotePositions.length; i++) {
                let pos = emotePositions[i].split('-');
                let start = parseInt(pos[0]); let end = parseInt(pos[1]);
                stringArr[start] = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0" class="chat-emote">`;
                for (let j = start + 1; j <= end; j++) stringArr[j] = ''; 
            }
        }
        let finalStr = '';
        for (let i = 0; i < stringArr.length; i++) {
            if (stringArr[i].startsWith('<img')) finalStr += stringArr[i];
            else finalStr += this.escapeHTML(stringArr[i]);
        }
        return finalStr;
    },

    escapeHTML: function(str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
};

window.AppCore.init();