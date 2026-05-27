/* ================= CORE (ЯДРО СИСТЕМЫ) ================= */
window.AppCore = {
    greetedUsers: new Set(), 

    init: function() {
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
            
            // Проверки флагов сообщения
            const isFirstTime = extra.userState && (extra.userState['first-msg'] === true || extra.userState['first-msg'] === '1');
            const isTwitchHighlight = flags.highlighted;
            const isCustomReward = !!extra.customRewardId;
            const isHighlighted = isTwitchHighlight || isCustomReward;

            // ДЕЛЕГИРОВАНИЕ: Модуль ChatFilter парсит эмодзи и проверяет мат
            let parsedMessage = window.ChatFilter.parseEmotes(message, extra.messageEmotes);
            let { text: cleanText, hasForbidden } = window.ChatFilter.processText(parsedMessage, window.AppConfig.forbiddenWords);
            
            // Проверка на пинг (Упоминание стримера)
            const streamerName = window.AppConfig.channelName;
            const mentionRegex = new RegExp(`@${streamerName}\\b`, 'ig');
            const isMention = mentionRegex.test(cleanText);

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

                if (isMention) {
                    window.AppEvents.emit('PET_EMOTION', { emotion: 'alert', duration: 3000 });
                    cleanText = cleanText.replace(mentionRegex, `<span class="chat-ping">$&</span>`);
                }

                // Авто-озвучка дефолтного выделения Twitch
                if (isTwitchHighlight) {
                    window.AppEvents.emit('TICKER_REWARD', { user, reward: "Выделенное сообщение", message: cleanText });
                    window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });
                    
                    let textForTTS = cleanText.replace(/<[^>]+>/g, ''); // чистим от HTML
                    window.AppEvents.emit('TTS_ADD', { user: user, text: textForTTS });
                }
            }
            
            // ДЕЛЕГИРОВАНИЕ: Модуль AvatarManager сам достает из кэша или качает с API
            const avatarUrl = await window.AvatarManager.get(user, userColor);

            // Обработка ответов (реплаев)
            let replyData = null;
            if (extra.userState && extra.userState['reply-parent-display-name']) {
                const replyUser = extra.userState['reply-parent-display-name'];
                let replyTextRaw = (extra.userState['reply-parent-msg-body'] || '').replace(/\\s/g, ' '); 
                replyTextRaw = replyTextRaw.replace(/^@[a-zA-Z0-9_]+\s*,?\s*/i, '');
                
                // ДЕЛЕГИРОВАНИЕ: Защита и фильтрация текста ответа
                let escapedReply = window.ChatFilter.escapeHTML(replyTextRaw);
                let cleanReply = window.ChatFilter.processText(escapedReply, window.AppConfig.forbiddenWords).text;
                replyData = { user: replyUser, htmlText: cleanReply };

                const replyMentionRegex = new RegExp(`^@${replyUser}\\s*,?\\s*`, 'i');
                cleanText = cleanText.replace(replyMentionRegex, '');
            }

            // Отправка готовых данных в визуализатор (index.html)
            window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                user, color: userColor, avatarUrl, time, htmlText: cleanText, replyData, isFirstTime, isHighlighted, isMention
            });
        };

        ComfyJS.onReward = (user, reward, cost, message, extra) => {
            window.AppEvents.emit('TICKER_REWARD', { user, reward, message });
            window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });

            if (reward === window.AppConfig.wheelRewardName) {
                window.AppEvents.emit('WHEEL_ADD', { text: message });
                window.AppEvents.emit('WHEEL_TOGGLE', { state: true });
            }
            if (reward === window.AppConfig.ttsRewardName) window.AppEvents.emit('TTS_ADD', { user, text: message });
            if (reward === window.AppConfig.rewardName) window.AppEvents.emit('QUEUE_ADD', { user, url: message });
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
                // === ГЛОБАЛЬНЫЕ ТЕМЫ (ПРОТОКОЛЫ) ===
                case "протокол":
                case "protocol":
                    if (hasPermission) {
                        if (argLow === "цирк" || argLow === "circus") {
                            window.AppEvents.emit('THEME_CHANGE', { theme: 'circus' });
                            window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 5000 });
                        } 
                        else if (argLow === "отмена" || argLow === "off" || argLow === "default") {
                            window.AppEvents.emit('THEME_CHANGE', { theme: 'default' });
                            window.AppEvents.emit('PET_EMOTION', { emotion: 'idle', duration: 2000 });
                        }
                    }
                    break;

                // === КОМАНДЫ ПЕРЕЗАГРУЗКИ (HOT RELOAD) ===
                case "refresh":
                    if (hasPermission) {
                        if (argLow === "core") {
                            console.log("🔄 [CORE] Принудительная перезагрузка ЯДРА по команде из чата!");
                            const coreUrl = new URL(window.location.href);
                            coreUrl.searchParams.set('nocache', Date.now());
                            window.location.href = coreUrl.toString();
                        } else {
                            console.log("🔄 [CORE] Отправлен сигнал на перезагрузку ВИЗУАЛЬНОГО СЛОЯ...");
                            window.AppEvents.emit('FORCE_RELOAD_VISUAL');
                        }
                    }
                    break;

                // === ТЕСТОВЫЕ КОМАНДЫ ЧАТА ===
                case "testfirst":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "Новичок", color: "#00FF7F", avatarUrl: "https://ui-avatars.com/api/?name=Н&background=00FF7F&color=fff",
                            time: "00:00", htmlText: arg || "Привет, я тут впервые!", replyData: null, isFirstTime: true
                        });
                    }
                    break;
                case "testhighlight":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "Богач", color: "#a29bfe", avatarUrl: "https://ui-avatars.com/api/?name=Б&background=a29bfe&color=fff",
                            time: "00:00", htmlText: arg || "Сообщение за баллы!", replyData: null, isHighlighted: true
                        });
                    }
                    break;
                case "testmention":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "Фанат", color: "#FFD700", avatarUrl: "https://ui-avatars.com/api/?name=Ф&background=FFD700&color=fff",
                            time: "00:00", htmlText: `Эй, <span class="chat-ping">@${window.AppConfig.channelName}</span> прочитай это!`, replyData: null, isMention: true
                        });
                    }
                    break;
                    
                // === ТЕСТЫ КАСТОМНЫХ ПРОФИЛЕЙ (USERS CSS) ===
                case "testhk":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "bagercaa", color: "#8bb9d2", avatarUrl: "https://ui-avatars.com/api/?name=bg&background=10141e&color=8bb9d2",
                            time: "00:00", htmlText: arg || "Высшее существо, эти слова для тебя одного...", replyData: null
                        });
                    }
                    break;
                case "testmc":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "kiriika1", color: "#5ea936", avatarUrl: "https://ui-avatars.com/api/?name=MC&background=744d32&color=fff",
                            time: "00:00", htmlText: arg || "Пшшш... крипер сзади!", replyData: null
                        });
                    }
                    break;
                case "testangel":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "to_be_ang", color: "#FFD700", avatarUrl: "https://ui-avatars.com/api/?name=ANG&background=fff&color=FFD700",
                            time: "00:00", htmlText: arg || "Свет укажет нам путь...", replyData: null
                        });
                    }
                    break;
                case "testbendy":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "dragonsmaddison", color: "#13100c", avatarUrl: "https://ui-avatars.com/api/?name=DM&background=dfca96&color=13100c",
                            time: "00:00", htmlText: arg || "Чернила текут рекой в этой старой студии...", replyData: null
                        });
                    }
                    break;
                case "testhacker":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "tetlabot", color: "#00ff41", avatarUrl: "https://ui-avatars.com/api/?name=SYS&background=000&color=00ff41",
                            time: "00:00", htmlText: arg || "System breach detected. Firewall disabled.", replyData: null
                        });
                    }
                    break;
                case "testpda":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "ksusha__sher", color: "#00ffea", avatarUrl: "https://ui-avatars.com/api/?name=PDA&background=091e32&color=00ffea",
                            time: "00:00", htmlText: arg || "Внимание: Обнаружены формы жизни класса Левиафан.", replyData: null
                        });
                    }
                    break;
                case "testarmy":
                    if (hasPermission) {
                        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
                            user: "darkl1us", 
                            color: "#dd5500", 
                            avatarUrl: "https://ui-avatars.com/api/?name=DL&background=1a1c19&color=dd5500",
                            time: "00:00", 
                            htmlText: arg || "Цель обнаружена. Запрашиваю поддержку с воздуха.", 
                            replyData: null
                        });
                    }
                    break;
                // ===================================

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
                        if (argLow === "stop" || argLow === "skip") window.AppEvents.emit('TTS_CMD', { stop: true }); 
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
    }
};

window.AppCore.init();