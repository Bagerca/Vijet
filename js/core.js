/* ФАЙЛ: js/core.js */
/* ================= CORE (РОУТЕР КОМАНД И ЯДРО) ================= */
window.AppCore = {
    greetedUsers: new Set(), 
    commandCooldowns: {}, 

    // Вынесенный словарь команд (Command Router)
    CommandRouter: {
        "widget": (arg) => { let p = arg.split(' '); if(p.length>=2) window.AppEvents.emit('WIDGET_TOGGLE', { widget: p[0], state: p[1] }); },
        "виджет": (arg) => window.AppCore.CommandRouter["widget"](arg),
        "протокол": (arg) => {
            if (arg === "цирк" || arg === "circus") { window.AppEvents.emit('THEME_CHANGE', { theme: 'circus' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 5000 }); } 
            else if (arg === "нуар" || arg === "noir") { window.AppEvents.emit('THEME_CHANGE', { theme: 'noir' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'listen', duration: 5000 }); } 
            else if (arg === "отмена" || arg === "off" || arg === "default") { window.AppEvents.emit('THEME_CHANGE', { theme: 'default' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'idle', duration: 2000 }); }
        },
        "protocol": (arg) => window.AppCore.CommandRouter["протокол"](arg),
        
        // ==============================================================
        // КНОПКИ РЕФРЕША И ПАНИКИ
        // ==============================================================
        "refresh": (arg) => {
            if (arg === "core") { 
                // 1. Показываем загрузочный экран на стриме
                window.AppEvents.emit('CORE_REBOOT_START');

                // 2. ХАРД-РЕСЕТ: Принудительно отключаем всё на визуле
                window.AppEvents.emit('THEME_CHANGE', { theme: 'default' });
                window.AppEvents.emit('MEDIA_SET', { type: 'off' });
                window.AppEvents.emit('DEATHS_CMD', { cmd: 'reset' }); // ИСПРАВЛЕНО: Сброс в 0
                window.AppEvents.emit('WHEEL_TOGGLE', { state: false });
                window.AppEvents.emit('BLUR_TOGGLE', { state: 'off' });
                window.AppEvents.emit('MEDIA_CAM', { state: 'on' });
                
                // 3. Останавливаем аудио и TTS
                window.AppEvents.emit('QUEUE_CMD', { cmd: 'clear' });
                window.AppEvents.emit('TTS_CMD', { cmd: 'stop' });

                // 4. ЖЕСТКАЯ ЗАЧИСТКА ПАМЯТИ
                // Уничтожаем все сохраненные данные, чтобы Ядро запустилось чистым.
                // Оставляем только настройки авторизации Mod Deck и кэш аватарок.
                const keysToNuke = [
                    'uso_global_state', 'uso_current_media', 'uso_deaths', 
                    'uso_queue', 'uso_wheel_items', 'uso_current_theme'
                ];
                keysToNuke.forEach(k => localStorage.removeItem(k));

                // 5. Перезагрузка самого файла Ядра (core.html)
                // Даем 800мс, чтобы визуальные эффекты закрытия успели отыграть
                setTimeout(() => { 
                    const u = new URL(window.location.href); 
                    u.searchParams.set('nocache', Date.now()); 
                    window.location.href = u.toString(); 
                }, 800); 
            } else {
                // ПЕРЕЗАГРУЗКА ВИЗУАЛА (ОБС браузеров)
                // Ядро работает дальше, музыка играет. Перезагрузятся только картинки.
                window.AppEvents.emit('FORCE_RELOAD_VISUAL');
            }
        },

        "wheel": (arg) => {
            if (arg === "show" || arg === "on") window.AppEvents.emit('WHEEL_TOGGLE', { state: true });
            else if (arg === "hide" || arg === "off") window.AppEvents.emit('WHEEL_TOGGLE', { state: false });
            else if (arg === "clear" || arg === "spin") window.AppEvents.emit('WHEEL_CMD', { cmd: arg });
            else if (arg.startsWith("add ")) window.AppEvents.emit('WHEEL_ADD', { text: arg.substring(4) });
            else if (arg.startsWith("remove ")) window.AppEvents.emit('WHEEL_CMD', { cmd: 'remove', val: arg.substring(7) });
        },
        "рулетка": (arg) => window.AppCore.CommandRouter["wheel"](arg),
        "skip": (arg) => window.AppEvents.emit('QUEUE_CMD', { cmd: arg === "all" ? 'skip_all' : 'skip_track' }),
        "clear": () => window.AppEvents.emit('QUEUE_CMD', { cmd: 'clear' }),
        "vol": (arg) => { if(arg) window.AppEvents.emit('PLAYER_VOL', { vol: arg }); },
        "cam": (arg) => window.AppEvents.emit('MEDIA_CAM', { state: arg }),
        "mic": (arg) => window.AppEvents.emit('MEDIA_MIC', { state: arg }),
        "emotes": (arg) => window.AppEvents.emit('EMOTES_CMD', { cmd: arg }),
        "смайлы": (arg) => window.AppCore.CommandRouter["emotes"](arg),
        "blur": (arg) => window.AppEvents.emit('BLUR_TOGGLE', { state: arg }),
        "блюр": (arg) => window.AppCore.CommandRouter["blur"](arg),
        "media": (arg, msg) => {
            if (arg === "off" || arg === "clear" || arg === "hide") window.AppEvents.emit('MEDIA_SET', { type: 'off' });
            else if (arg.startsWith("yt ") || arg.startsWith("youtube ")) {
                const query = msg.substring(msg.indexOf(' ') + 1).trim();
                const match = query.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                const ytId = (match && match[2].length === 11) ? match[2] : (query.length === 11 ? query : null);
                if (ytId) window.AppEvents.emit('MEDIA_SET', { type: 'yt', query: ytId });
            } else if (arg.startsWith("game ") || arg.startsWith("игра ")) {
                window.AppEvents.emit('MEDIA_SET', { type: 'game', query: arg.replace("game ", "").replace("игра ", "").trim() });
            }
        },
        "медиа": (arg, msg) => window.AppCore.CommandRouter["media"](arg, msg),
        "game": (arg) => window.AppEvents.emit('MEDIA_SET', { type: (arg === "off" || arg === "clear" || arg === "hide") ? 'off' : 'game', query: arg }),
        "игра": (arg) => window.AppCore.CommandRouter["game"](arg),
        "death": (arg) => {
            if (!["off", "hide", "-", "sub", "reset", "clear"].includes(arg) && !arg.startsWith("set")) window.AppEvents.emit('PET_EMOTION', { emotion: 'scared', duration: 3000 });
            window.AppEvents.emit('DEATHS_CMD', { cmd: arg });
        },
        "deaths": (arg) => window.AppCore.CommandRouter["death"](arg),
        "смерть": (arg) => window.AppCore.CommandRouter["death"](arg),
        "fox": (arg) => {
            const states = ['idle', 'sleep', 'alert', 'hype', 'love', 'scared', 'angry', 'greet', 'bye', 'jam', 'listen', 'nom'];
            if (states.includes(arg)) window.AppEvents.emit('PET_EMOTION', { emotion: arg, duration: 5000 });
            else if (arg === "кусь" || arg === "ням") window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 5000 });
            else if (arg === "привет") window.AppEvents.emit('PET_EMOTION', { emotion: 'greet', duration: 5000 });
            else if (arg === "пока") window.AppEvents.emit('PET_EMOTION', { emotion: 'bye', duration: 5000 });
            else if (arg === "танцуй" || arg === "вайб") window.AppEvents.emit('PET_EMOTION', { emotion: 'jam', duration: 5000 });
        },
        "лиса": (arg) => window.AppCore.CommandRouter["fox"](arg),
        "лис": (arg) => window.AppCore.CommandRouter["fox"](arg),
        "alert": (arg) => { window.AppEvents.emit('PET_EMOTION', { emotion: 'love', duration: 5000 }); window.AppEvents.emit('ALERT_TEST', { type: arg }); }
    },

    init: function() {
        if (window.AppConfig.channelName && window.AppConfig.channelName !== "ТВОЙ_НИК") {
            let channelsToListen = [window.AppConfig.channelName];
            if (window.AppConfig.botChannel && window.AppConfig.botChannel.trim() !== "") channelsToListen.push(window.AppConfig.botChannel);
            ComfyJS.Init(null, null, channelsToListen);
            this.setupEvents();
            
            // Если Ядро только что загрузилось после Хард-Ресета, 
            // отправляем сигнал визуалам убрать заглушку "Перезагрузка ядра..."
            setTimeout(() => window.AppEvents.emit('CORE_REBOOT_DONE'), 1000);
        } else { console.warn("[CORE ❌] Имя канала не настроено в config.js!"); }
    },

    generateFakeReply: function() { return { user: "СлучайныйЗритель", htmlText: "Это какой-то текст, на который отвечает кастомный юзер." }; },

    handleTestCommand: function(userAlias, color, avatarUrl, defaultText, arg) {
        let finalMessage = arg;
        const extractFlag = (flag) => {
            const regex = new RegExp(`(^|\\s)${flag}(\\s|$)`);
            if (regex.test(finalMessage)) {
                finalMessage = finalMessage.replace(new RegExp(flag, 'g'), '').trim();
                return true;
            }
            return false;
        };

        let isHighlight = extractFlag('-hl'), isReply = extractFlag('-rep'), isPing = extractFlag('-ping'), isTts = extractFlag('-tts'), isFirstTime = extractFlag('-first');
        finalMessage = finalMessage.replace(/\s+/g, ' ').trim();
        if (finalMessage === "") finalMessage = defaultText;

        let { text: cleanText } = window.ChatFilter.processText(finalMessage, window.AppConfig.forbiddenWords);
        if (isTts) window.AppEvents.emit('TTS_ADD', { user: userAlias, text: cleanText.replace(/<[^>]+>/g, '') });
        if (isPing) cleanText = `<span class="chat-ping">@${window.AppConfig.channelName}</span> ${cleanText}`;

        const userStyle = (window.AppConfig.customChatStyles && window.AppConfig.customChatStyles[userAlias.toLowerCase()]) || null;

        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
            user: userAlias, color: color, avatarUrl: avatarUrl,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            htmlText: cleanText, replyData: isReply ? this.generateFakeReply() : null,
            isFirstTime, isHighlighted: isHighlight, isMention: isPing, styleName: userStyle 
        });
    },

    setupEvents: function() {
        ComfyJS.onChat = async (user, message, flags, self, extra) => {
            const userColor = extra.userColor || '#FF4477'; 
            const lowerUser = user.toLowerCase();
            const isMention = new RegExp(`@${window.AppConfig.channelName}\\b`, 'ig').test(message);

            let { text: cleanText, hasForbidden } = window.ChatFilter.processText(window.ChatFilter.parseEmotes(message, extra.messageEmotes), window.AppConfig.forbiddenWords);

            let petEmotion = null, petPrio = 0;
            const setPet = (emo, prio) => { if (prio > petPrio) { petEmotion = emo; petPrio = prio; } };

            if (hasForbidden) { setPet('angry', 10); } 
            else {
                if ((window.AppConfig.allowedUsers?.map(u=>u.toLowerCase()).includes(lowerUser) || flags.broadcaster) && !this.greetedUsers.has(lowerUser)) {
                    this.greetedUsers.add(lowerUser); setPet('love', 5);
                } 
                if (isMention) setPet('alert', 4);
                if (extra.messageEmotes) { setPet('hype', 1); window.AppEvents.emit('EMOTES_SPAWN', extra.messageEmotes); }
            }
            if (petEmotion) window.AppEvents.emit('PET_EMOTION', { emotion: petEmotion, duration: 4000 });

            if (isMention && !hasForbidden) cleanText = cleanText.replace(new RegExp(`@${window.AppConfig.channelName}\\b`, 'ig'), `<span class="chat-ping">$&</span>`);

            if (flags.highlighted && !hasForbidden) {
                window.AppEvents.emit('TICKER_REWARD', { user, reward: "Выделенное сообщение", message: cleanText });
                window.AppEvents.emit('TTS_ADD', { user, text: cleanText.replace(/<[^>]+>/g, '') });
            }
            
            const avatarUrl = await window.AvatarManager.get(user, userColor);
            let replyData = null;
            if (extra.userState?.['reply-parent-display-name']) {
                const replyUser = extra.userState['reply-parent-display-name'];
                let cleanReply = window.ChatFilter.processText(window.ChatFilter.escapeHTML(extra.userState['reply-parent-msg-body'] || '').replace(/\\s/g, ' ').replace(/^@[a-zA-Z0-9_]+\s*,?\s*/i, ''), window.AppConfig.forbiddenWords).text;
                replyData = { user: replyUser, htmlText: cleanReply };
                cleanText = cleanText.replace(new RegExp(`^@${replyUser}\\s*,?\\s*`, 'i'), '');
            }

            window.AppEvents.emit('CHAT_RENDER_MESSAGE', { 
                user, color: userColor, avatarUrl, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
                htmlText: cleanText, replyData, isFirstTime: extra.userState?.['first-msg'] === '1', 
                isHighlighted: flags.highlighted || !!extra.customRewardId, isMention,
                styleName: window.AppConfig.customChatStyles?.[lowerUser] || null
            });
        };

        ComfyJS.onReward = (user, reward, cost, message) => {
            window.AppEvents.emit('TICKER_REWARD', { user, reward, message });
            window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });

            if (reward === window.AppConfig.wheelRewardName) { window.AppEvents.emit('WHEEL_ADD', { text: message }); window.AppEvents.emit('WHEEL_TOGGLE', { state: true }); }
            if (reward === window.AppConfig.ttsRewardName) window.AppEvents.emit('TTS_ADD', { user, text: message });
            if (reward === window.AppConfig.rewardName) window.AppEvents.emit('QUEUE_ADD', { user, url: message });
            if (reward === window.AppConfig.feedRewardName) window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 6000 });

            const rew = window.AppConfig.rewards;
            if (rew) {
                const map = { [rew.series]: 'reward_series', [rew.movie]: 'reward_movie', [rew.video]: 'reward_video', [rew.game]: 'reward_game', [rew.music]: 'reward_music' };
                if (map[reward]) window.AppEvents.emit('ALERT_ADD', { user, type: map[reward], msg: message });
            }
        };

        ComfyJS.onCommand = async (user, command, message, flags) => {
            const hasPermission = flags.broadcaster || flags.mod || window.AppConfig.allowedUsers?.map(u=>u.toLowerCase()).includes(user.toLowerCase());
            const arg = message.trim();
            const argLow = arg.toLowerCase(); 
            const cmdKey = command.toLowerCase();

            if (['media', 'game', 'игра', 'so', 'shoutout'].includes(cmdKey)) {
                const now = Date.now();
                if (this.commandCooldowns[cmdKey] && now - this.commandCooldowns[cmdKey] < 2000) return;
                this.commandCooldowns[cmdKey] = now;
            }

            if (["sr", "play"].includes(cmdKey) && message !== "") { window.AppEvents.emit('QUEUE_ADD', { user, url: message }); return; }

            if (hasPermission && this.CommandRouter[cmdKey]) {
                this.CommandRouter[cmdKey](argLow, message);
                return;
            }

            if (hasPermission && cmdKey.startsWith('test')) {
                let testAvatar = await window.AvatarManager.get(user, '#FF4477');
                if (cmdKey === "testfirst") this.handleTestCommand(user, "#FF4477", testAvatar, "Привет, я впервые на этом крутом стриме!", "-first " + arg);
                else if (cmdKey === "testmention") this.handleTestCommand(user, "#00E5FF", testAvatar, "Зацени это!", "-ping " + arg);
                else if (cmdKey === "testhighlight") this.handleTestCommand(user, "#FFD700", testAvatar, "Это очень важное сообщение за баллы!", "-hl " + arg);
                else if (cmdKey === "testuser") {
                    let parts = arg.split(' '); let targetUser = parts[0] || user;
                    this.handleTestCommand(targetUser, "#FF4477", await window.AvatarManager.get(targetUser, "#FF4477"), "Проверка кастомного стиля!", parts.slice(1).join(' '));
                }
                else if (cmdKey === "testtts") window.AppEvents.emit('TTS_ADD', { user: arg.split(' ')[0] || "tetlabot", text: arg.split(' ').slice(1).join(' ') || "Тест." });
                else if (cmdKey === "testgoal") window.AppEvents.emit('GOAL_TEST_ADD');
                else if (cmdKey === "testticker") {
                    if (argLow === "music") window.AppEvents.emit('TICKER_CUSTOM', { msg: "<span style='color: #FF4477; font-weight: 800;'>🎵 test_user</span> заказал трек", badge: "МУЗЫКА", color: "#FF4477" });
                    else window.AppEvents.emit('TICKER_CUSTOM', { msg: arg || "Это тестовое сообщение!", badge: "ТЕСТ", color: "#FFD700" });
                }
            }
            
            if (hasPermission && ["so", "shoutout"].includes(cmdKey) && message !== "") window.AppEvents.emit('SHOUTOUT_ADD', { user: message });
            if (hasPermission && cmdKey === "tts" && message !== "") { if (argLow === "stop" || argLow === "skip") window.AppEvents.emit('TTS_CMD', { stop: true }); else window.AppEvents.emit('TTS_ADD', { user, text: message }); }
        };
    }
};
window.AppCore.init();