/* ================= CORE (ЯДРО СИСТЕМЫ) ================= */
window.AppCore = {
    greetedUsers: new Set(), 
    commandCooldowns: {}, 

    init: function() {
        if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
            console.log(`[CORE] Подключение к каналу: ${window.AppConfig.channelName}...`);
            ComfyJS.Init(window.AppConfig.channelName);
            this.setupEvents();
            
            // Сигнализируем визуалу, что ядро успешно запустилось
            setTimeout(() => {
                window.AppEvents.emit('CORE_REBOOT_DONE');
            }, 1000);
            
        } else {
            console.warn("[CORE ❌] Имя канала не настроено в config.js!");
        }
    },

    generateFakeReply: function() {
        return { user: "СлучайныйЗритель", htmlText: "Это какой-то текст, на который отвечает кастомный юзер." };
    },

    handleTestCommand: function(userAlias, color, avatarUrl, defaultText, arg) {
        let isHighlight = false;
        let isReply = false;
        let isPing = false;
        let isTts = false;
        let isFirstTime = false;
        let finalMessage = arg;

        // Мокирование ролей для тестов
        let role = "viewer";
        if (userAlias === window.AppConfig.channelName) role = "broadcaster";
        else if (finalMessage.includes("-mod")) { role = "mod"; finalMessage = finalMessage.replace("-mod", "").trim(); }

        if (finalMessage.includes("-hl")) { isHighlight = true; finalMessage = finalMessage.replace("-hl", "").trim(); }
        if (finalMessage.includes("-rep")) { isReply = true; finalMessage = finalMessage.replace("-rep", "").trim(); }
        if (finalMessage.includes("-ping")) { isPing = true; finalMessage = finalMessage.replace("-ping", "").trim(); }
        if (finalMessage.includes("-tts")) { isTts = true; finalMessage = finalMessage.replace("-tts", "").trim(); }
        if (finalMessage.includes("-first")) { isFirstTime = true; finalMessage = finalMessage.replace("-first", "").trim(); }

        if (finalMessage === "") finalMessage = defaultText;

        let { text: cleanText, hasForbidden } = window.ChatFilter.processText(finalMessage, window.AppConfig.forbiddenWords);

        if (isTts) {
            let cleanTtsText = cleanText.replace(/<[^>]+>/g, ''); 
            window.AppEvents.emit('TTS_ADD', { user: userAlias, text: cleanTtsText });
        }

        if (isPing) cleanText = `<span class="chat-ping">@${window.AppConfig.channelName}</span> ${cleanText}`;

        // Достаем кастомный стиль для теста
        const userStyle = (window.AppConfig.customChatStyles && window.AppConfig.customChatStyles[userAlias.toLowerCase()]) || null;

        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
            user: userAlias, color: color, avatarUrl: avatarUrl,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            htmlText: cleanText, replyData: isReply ? this.generateFakeReply() : null,
            isFirstTime: isFirstTime, isHighlighted: isHighlight, isMention: isPing,
            styleName: userStyle,
            role: role,
            badges: role === 'mod' ? { moderator: "1" } : (role === 'broadcaster' ? { broadcaster: "1" } : null)
        });
    },

    setupEvents: function() {
        ComfyJS.onChat = async (user, message, flags, self, extra) => {
            const userColor = extra.userColor || '#FF4477'; 
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const lowerUser = user.toLowerCase();
            
            const isFirstTime = extra.userState && (extra.userState['first-msg'] === true || extra.userState['first-msg'] === '1');
            const isTwitchHighlight = flags.highlighted;
            const isCustomReward = !!extra.customRewardId;
            const isHighlighted = isTwitchHighlight || isCustomReward;

            let parsedMessage = window.ChatFilter.parseEmotes(message, extra.messageEmotes);
            let { text: cleanText, hasForbidden } = window.ChatFilter.processText(parsedMessage, window.AppConfig.forbiddenWords);
            
            const mentionRegex = new RegExp(`@${window.AppConfig.channelName}\\b`, 'ig');
            const isMention = mentionRegex.test(cleanText);

            let petEmotion = null; let petPrio = 0;
            const setPet = (emo, prio) => { if (prio > petPrio) { petEmotion = emo; petPrio = prio; } };

            if (hasForbidden) { setPet('angry', 10); } 
            else {
                const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(lowerUser);
                if ((isAllowedUser || flags.broadcaster) && !this.greetedUsers.has(lowerUser)) {
                    this.greetedUsers.add(lowerUser); setPet('love', 5);
                } 
                if (isMention) setPet('alert', 4);
                if (extra.messageEmotes) { setPet('hype', 1); window.AppEvents.emit('EMOTES_SPAWN', extra.messageEmotes); }
            }
            if (petEmotion) window.AppEvents.emit('PET_EMOTION', { emotion: petEmotion, duration: 4000 });

            if (isMention && !hasForbidden) cleanText = cleanText.replace(mentionRegex, `<span class="chat-ping">$&</span>`);

            if (isTwitchHighlight && !hasForbidden) {
                window.AppEvents.emit('TICKER_REWARD', { user, reward: "Выделенное сообщение", message: cleanText });
                window.AppEvents.emit('TTS_ADD', { user: user, text: cleanText.replace(/<[^>]+>/g, '') });
            }
            
            const avatarUrl = await window.AvatarManager.get(user, userColor);
            let replyData = null;
            if (extra.userState && extra.userState['reply-parent-display-name']) {
                const replyUser = extra.userState['reply-parent-display-name'];
                let replyTextRaw = (extra.userState['reply-parent-msg-body'] || '').replace(/\\s/g, ' ').replace(/^@[a-zA-Z0-9_]+\s*,?\s*/i, '');
                let cleanReply = window.ChatFilter.processText(window.ChatFilter.escapeHTML(replyTextRaw), window.AppConfig.forbiddenWords).text;
                replyData = { user: replyUser, htmlText: cleanReply };
                cleanText = cleanText.replace(new RegExp(`^@${replyUser}\\s*,?\\s*`, 'i'), '');
            }

            const userStyle = (window.AppConfig.customChatStyles && window.AppConfig.customChatStyles[lowerUser]) || null;
            
            // Определяем роль пользователя
            let role = 'viewer';
            if (flags.broadcaster) role = 'broadcaster';
            else if (flags.mod) role = 'mod';
            else if (flags.vip) role = 'vip';
            else if (flags.subscriber || flags.founder) role = 'sub';

            window.AppEvents.emit('CHAT_RENDER_MESSAGE', { 
                user, color: userColor, avatarUrl, time, htmlText: cleanText, 
                replyData, isFirstTime, isHighlighted, isMention,
                styleName: userStyle,
                role: role,
                badges: extra.userBadges
            });
        };

        ComfyJS.onReward = (user, reward, cost, message, extra) => {
            window.AppEvents.emit('TICKER_REWARD', { user, reward, message });
            window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });

            if (reward === window.AppConfig.wheelRewardName) { window.AppEvents.emit('WHEEL_ADD', { text: message }); window.AppEvents.emit('WHEEL_TOGGLE', { state: true }); }
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

        ComfyJS.onCommand = async (user, command, message, flags) => {
            const isMod = flags.broadcaster || flags.mod;
            const isAllowedUser = window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase());
            const hasPermission = isMod || isAllowedUser;
            
            const arg = message.trim();
            const argLow = arg.toLowerCase(); 
            const cmdKey = command.toLowerCase();

            const heavyCommands = ['media', 'game', 'игра', 'so', 'shoutout'];
            if (heavyCommands.includes(cmdKey)) {
                const now = Date.now();
                if (this.commandCooldowns[cmdKey] && now - this.commandCooldowns[cmdKey] < 2000) return;
                this.commandCooldowns[cmdKey] = now;
            }

            let testAvatar = "https://ui-avatars.com/api/?name=Test&background=FF4477&color=fff";
            if (hasPermission && cmdKey.startsWith('test')) {
                testAvatar = await window.AvatarManager.get(user, '#FF4477');
            }

            switch (cmdKey) {
                case "widget":
                case "виджет":
                    if (hasPermission) {
                        let parts = argLow.split(' ');
                        if (parts.length >= 2) window.AppEvents.emit('WIDGET_TOGGLE', { widget: parts[0], state: parts[1] });
                    }
                    break;
                case "протокол":
                case "protocol":
                    if (hasPermission) {
                        if (argLow === "цирк" || argLow === "circus") { window.AppEvents.emit('THEME_CHANGE', { theme: 'circus' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 5000 }); } 
                        else if (argLow === "нуар" || argLow === "noir") { window.AppEvents.emit('THEME_CHANGE', { theme: 'noir' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'listen', duration: 5000 }); } 
                        else if (argLow === "отмена" || argLow === "off" || argLow === "default") { window.AppEvents.emit('THEME_CHANGE', { theme: 'default' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'idle', duration: 2000 }); }
                    }
                    break;
                case "refresh":
                    if (hasPermission) {
                        if (argLow === "core") { 
                            window.AppEvents.emit('CORE_REBOOT_START');
                            setTimeout(() => {
                                const coreUrl = new URL(window.location.href); 
                                coreUrl.searchParams.set('nocache', Date.now()); 
                                window.location.href = coreUrl.toString(); 
                            }, 300);
                        } 
                        else {
                            window.AppEvents.emit('FORCE_RELOAD_VISUAL');
                        }
                    }
                    break;

                // Базовые тесты дефолтного чата
                case "testfirst": if (hasPermission) this.handleTestCommand(user, "#FF4477", testAvatar, "Привет, я впервые на этом крутом стриме!", "-first " + arg); break;
                case "testmention": if (hasPermission) this.handleTestCommand(user, "#00E5FF", testAvatar, "Зацени это!", "-ping " + arg); break;
                case "testhighlight": if (hasPermission) this.handleTestCommand(user, "#FFD700", testAvatar, "Это очень важное сообщение за баллы!", "-hl " + arg); break;

                // УНИВЕРСАЛЬНАЯ КОМАНДА ДЛЯ ЛЮБОГО ЮЗЕРА
                case "testuser": 
                    if (hasPermission) {
                        let parts = arg.split(' ');
                        let targetUser = parts[0] || user;
                        let restArgs = parts.slice(1).join(' ');
                        let targetAvatar = await window.AvatarManager.get(targetUser, "#FF4477");
                        this.handleTestCommand(targetUser, "#FF4477", targetAvatar, "Проверка кастомного стиля на связи!", restArgs);
                    } 
                    break;

                case "testtts": if (hasPermission) { let parts = arg.split(' '); let targetUser = parts[0] || "tetlabot"; let ttsText = parts.slice(1).join(' ') || "Внимание. Тестирование вокального модуля успешно завершено."; window.AppEvents.emit('TTS_ADD', { user: targetUser, text: ttsText }); } break;

                // Тест цели (фолловеров)
                case "testgoal": 
                    if (hasPermission) window.AppEvents.emit('GOAL_TEST_ADD'); 
                    break;

                // Тест бегущей строки 2.0
                case "testticker":
                    if (hasPermission) {
                        if (argLow === "music") {
                            window.AppEvents.emit('TICKER_CUSTOM', { msg: "<span style='color: #FF4477; font-weight: 800;'>🎵 test_user</span> заказал трек: Секретная Песня", badge: "МУЗЫКА", color: "#FF4477" });
                        } else if (argLow === "alert") {
                            window.AppEvents.emit('TICKER_CUSTOM', { msg: "<span style='color: #00FF7F; font-weight: 800;'>💎 big_boss</span> активировал: Выпить шот", badge: "НАГРАДА", color: "#00FF7F" });
                        } else {
                            window.AppEvents.emit('TICKER_CUSTOM', { msg: arg || "Это тестовое сообщение для проверки системы бегущей строки 2.0!", badge: "ТЕСТ", color: "#FFD700" });
                        }
                    }
                    break;

                // Базовые команды управления
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
                case "play":   if (message !== "") window.AppEvents.emit('QUEUE_ADD', { user, url: message }); break;
                case "so":
                case "shoutout": if (hasPermission && message !== "") window.AppEvents.emit('SHOUTOUT_ADD', { user: message }); break;
                case "skip": if (hasPermission) { if (argLow === "all") window.AppEvents.emit('QUEUE_CMD', { cmd: 'skip_all' }); else window.AppEvents.emit('QUEUE_CMD', { cmd: 'skip_track' }); } break;
                case "clear": if (hasPermission) window.AppEvents.emit('QUEUE_CMD', { cmd: 'clear' }); break;
                case "vol": if (hasPermission && message !== "") window.AppEvents.emit('PLAYER_VOL', { vol: message }); break;
                case "cam": if (hasPermission) window.AppEvents.emit('MEDIA_CAM', { state: argLow }); break;
                case "mic": if (hasPermission) window.AppEvents.emit('MEDIA_MIC', { state: argLow }); break;
                case "emotes":
                case "смайлы": if (hasPermission) window.AppEvents.emit('EMOTES_CMD', { cmd: argLow }); break;
                case "tts": if (hasPermission && message !== "") { if (argLow === "stop" || argLow === "skip") window.AppEvents.emit('TTS_CMD', { stop: true }); else window.AppEvents.emit('TTS_ADD', { user, text: message }); } break;
                case "blur":
                case "блюр": if (hasPermission) window.AppEvents.emit('BLUR_TOGGLE', { state: argLow }); break;
                case "media":
                case "медиа":
                    if (hasPermission) {
                        if (argLow === "off" || argLow === "clear" || argLow === "hide") window.AppEvents.emit('MEDIA_SET', { type: 'off' });
                        else if (argLow.startsWith("yt ") || argLow.startsWith("youtube ")) {
                            const query = arg.substring(arg.indexOf(' ') + 1).trim();
                            const match = query.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                            const ytId = (match && match[2].length === 11) ? match[2] : (query.length === 11 ? query : null);
                            if (ytId) window.AppEvents.emit('MEDIA_SET', { type: 'yt', query: ytId });
                        } else if (argLow.startsWith("game ") || argLow.startsWith("игра ")) {
                            window.AppEvents.emit('MEDIA_SET', { type: 'game', query: argLow.replace("game ", "").replace("игра ", "").trim() });
                        }
                    }
                    break;
                case "game":
                case "игра": if (hasPermission) { if (argLow === "off" || argLow === "clear" || argLow === "hide") window.AppEvents.emit('MEDIA_SET', { type: 'off' }); else window.AppEvents.emit('MEDIA_SET', { type: 'game', query: argLow }); } break;
                case "death":
                case "deaths":
                case "смерть":
                    if (hasPermission) {
                        if (!["off", "hide", "-", "sub", "reset", "clear"].includes(argLow) && !argLow.startsWith("set")) window.AppEvents.emit('PET_EMOTION', { emotion: 'scared', duration: 3000 });
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
                case "alert": if (hasPermission) { triggerLove(); window.AppEvents.emit('ALERT_TEST', { type: argLow }); } break;
            }
        };

        const client = ComfyJS.GetClient();
        if (client) {
            client.on("raw_message", (messageCloned, message) => {
                if (message.command === "USERNOTICE" && message.tags && message.tags["msg-id"] === "viewermilestone") {
                    window.AppEvents.emit('ALERT_ADD', { user: message.tags["display-name"] || message.tags["login"], type: 'streak', msg: (message.params && message.params.length > 1) ? message.params[1] : "", val: message.tags["msg-param-value"] });
                    triggerLove();
                }
            });
        }
    }
};

window.AppCore.init();