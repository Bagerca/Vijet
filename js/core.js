/* ================= CORE (ЯДРО СИСТЕМЫ) V2.1 (FIXED REWARDS) ================= */

// --- 1. СИСТЕМА ЛОГИРОВАНИЯ ---
window.AppLogger = {
    info: (msg, data = '') => console.log(`%c[CORE ℹ️] ${msg}`, 'color: #00E5FF;', data),
    success: (msg, data = '') => console.log(`%c[CORE ✅] ${msg}`, 'color: #00FF7F;', data),
    warn: (msg, data = '') => console.warn(`%c[CORE ⚠️] ${msg}`, 'color: #FEE101;', data),
    error: (msg, err = '') => {
        console.error(`%c[CORE ❌] ${msg}`, 'color: #FF0050;', err);
        if (window.AppEvents) window.AppEvents.emit('CORE_ERROR', { msg, err: err?.message || err });
    }
};

// --- 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ (STATE MANAGER) ---
window.AppCoreState = {
    widgets: {
        chat: true, media: true, goal: true, alerts: true,
        socials: true, ticker: true, pet: true, emotes: true,
        music: true, tts: true, particles: true, cam: true, 
        blur: false, shoutout: true,
        deaths: (parseInt(localStorage.getItem('uso_deaths') || '0', 10) > 0),
        wheel: false
    },
    theme: localStorage.getItem('uso_current_theme') || 'default',
    media: JSON.parse(localStorage.getItem('uso_current_media') || 'null'),
    volume: window.AppConfig.defaultVolume || 30,
    deathsCount: parseInt(localStorage.getItem('uso_deaths') || '0', 10),

    update: function(updates) {
        let changed = false;
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'widgets') {
                this.widgets = { ...this.widgets, ...value };
                changed = true;
            } else if (this[key] !== value) {
                this[key] = value;
                changed = true;
            }
        }
        if (changed) this.broadcastFullState('local');
    },

    broadcastFullState: function(target = 'local') {
        const payload = {
            widgets: this.widgets,
            queue: window.AppQueueCore ? window.AppQueueCore.items : [],
            theme: this.theme,
            media: this.media,
            volume: this.volume,
            deaths: this.deathsCount
        };
        
        if (target === 'local') {
            window.AppEvents.emit('SYSTEM_STATE_RESPONSE', payload);
        } else if (target === 'remote' && window.AppConfig.channelName) {
            const client = ComfyJS.GetClient();
            if (client && client.readyState() === "OPEN") {
                ComfyJS.Say(`[USO_SYNC] ${JSON.stringify(payload)}`, window.AppConfig.channelName);
            }
        }
    }
};

// --- 3. РЕЕСТР КОМАНД (COMMAND REGISTRY) ---
window.AppCommands = {
    registry: {},
    cooldowns: {},

    register: function(aliases, requiresPermission, cooldownMs, handler) {
        aliases.forEach(alias => {
            this.registry[alias.toLowerCase()] = { requiresPermission, cooldownMs, handler };
        });
    },

    execute: function(user, command, message, flags, extra) {
        const cmdKey = command.toLowerCase();
        const cmdObj = this.registry[cmdKey];
        if (!cmdObj) return false;

        const hasPermission = flags.broadcaster || flags.mod || 
            (window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase()));

        if (cmdObj.requiresPermission && !hasPermission) {
            AppLogger.warn(`Отказ в доступе: !${cmdKey} от ${user}`);
            return true;
        }

        if (cmdObj.cooldownMs > 0) {
            const now = Date.now();
            if (this.cooldowns[cmdKey] && (now - this.cooldowns[cmdKey] < cmdObj.cooldownMs)) return true;
            this.cooldowns[cmdKey] = now;
        }

        try {
            cmdObj.handler(user, message.trim(), message.trim().toLowerCase(), flags, extra);
        } catch (err) {
            AppLogger.error(`Сбой в команде !${cmdKey}`, err);
        }
        return true;
    }
};

// --- 4. ОСНОВНОЕ ЯДРО ---
window.AppCore = {
    greetedUsers: new Set(), 

    init: function() {
        if (!window.AppConfig.channelName || window.AppConfig.channelName === "ТВОЙ_НИК") {
            AppLogger.error("Имя канала не настроено в config.js!");
            return;
        }

        let channelsToJoin = [window.AppConfig.channelName];
        if (window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.length > 0) {
            channelsToJoin = channelsToJoin.concat(window.AppConfig.allowedUsers);
        }
        channelsToJoin = [...new Set(channelsToJoin.map(c => c.toLowerCase()))];
        
        AppLogger.info(`Подключение к чатам: ${channelsToJoin.join(', ')}...`);
        ComfyJS.Init(window.AppConfig.channelName, "", channelsToJoin);
        
        this.registerAllCommands();
        this.setupEvents();
        
        setInterval(() => window.AppEvents.emit('CORE_HEARTBEAT'), 5000);
        
        this.setupEventListeners();
        setTimeout(() => window.AppEvents.emit('CORE_REBOOT_DONE'), 1000);
    },

    setupEventListeners: function() {
        window.AppEvents.listen('SYSTEM_STATE_REQUEST', () => AppCoreState.broadcastFullState('local'));
        
        window.AppEvents.listen('WIDGET_TOGGLE', (d) => {
            if (AppCoreState.widgets[d.widget] !== undefined) {
                AppCoreState.update({ widgets: { [d.widget]: (d.state === 'on' || d.state === 'show') } });
            }
        });

        window.AppEvents.listen('MEDIA_CAM', (d) => AppCoreState.update({ widgets: { cam: (d.state === 'on') } }));
        window.AppEvents.listen('BLUR_TOGGLE', (d) => AppCoreState.update({ widgets: { blur: (d.state === 'on') } }));
        window.AppEvents.listen('WHEEL_TOGGLE', (d) => AppCoreState.update({ widgets: { wheel: d.state } }));
        
        window.AppEvents.listen('DEATHS_CMD', (d) => {
            let newCount = AppCoreState.deathsCount;
            let showWidget = AppCoreState.widgets.deaths;

            if (d.cmd === 'show' || d.cmd === 'on') showWidget = true;
            else if (d.cmd === 'hide' || d.cmd === 'off') showWidget = false;
            else if (d.cmd === '-' || d.cmd === 'sub') {
                newCount = Math.max(0, newCount - 1);
                if (newCount === 0) showWidget = false;
            }
            else if (d.cmd === 'reset' || d.cmd === 'clear') {
                newCount = 0; showWidget = false;
            }
            else if (d.cmd.startsWith('set ')) {
                newCount = parseInt(d.cmd.replace('set ', '')) || 0;
                showWidget = newCount > 0;
            }
            else {
                newCount++; showWidget = true; 
            }
            AppCoreState.update({ deathsCount: newCount, widgets: { deaths: showWidget } });
        });

        window.AppEvents.listen('PLAYER_VOL', (d) => AppCoreState.update({ volume: parseInt(d.vol) || 0 }));
        window.AppEvents.listen('THEME_CHANGE', (d) => AppCoreState.update({ theme: d.theme }));
        window.AppEvents.listen('MEDIA_SET', (d) => {
            const newMedia = (d.type === 'off' || d.query === 'off' || d.query === 'clear') ? null : { type: d.type, query: d.query };
            AppCoreState.update({ media: newMedia });
        });
    },

    generateFakeReply: function() {
        return { user: "СлучайныйЗритель", htmlText: "Это какой-то текст, на который отвечает кастомный юзер." };
    },

    handleTestCommand: function(userAlias, color, avatarUrl, defaultText, arg) {
        let isHighlight = false, isReply = false, isPing = false, isTts = false, isFirstTime = false, forceDefaultStyle = false; 
        let finalMessage = arg;
        let role = (userAlias === window.AppConfig.channelName) ? "broadcaster" : "viewer";

        if (finalMessage.includes("-mod")) { role = "mod"; finalMessage = finalMessage.replace(/-mod/gi, "").trim(); }
        if (finalMessage.includes("-hl")) { isHighlight = true; finalMessage = finalMessage.replace(/-hl/gi, "").trim(); }
        if (finalMessage.includes("-rep")) { isReply = true; finalMessage = finalMessage.replace(/-rep/gi, "").trim(); }
        if (finalMessage.includes("-ping")) { isPing = true; finalMessage = finalMessage.replace(/-ping/gi, "").trim(); }
        if (finalMessage.includes("-tts")) { isTts = true; finalMessage = finalMessage.replace(/-tts/gi, "").trim(); }
        if (finalMessage.includes("-first")) { isFirstTime = true; finalMessage = finalMessage.replace(/-first/gi, "").trim(); }
        if (finalMessage.includes("-defaultstyle")) { forceDefaultStyle = true; finalMessage = finalMessage.replace(/-defaultstyle/gi, "").trim(); }

        finalMessage = finalMessage.replace(/\s+/g, " ").trim() || defaultText;

        let { text: cleanText, hasForbidden } = window.ChatFilter.processText(finalMessage, window.AppConfig.forbiddenWords);

        if (isTts && AppCoreState.widgets['tts']) {
            window.AppEvents.emit('TTS_ADD', { user: userAlias, text: cleanText.replace(/<[^>]+>/g, '') });
        }

        if (isPing && !hasForbidden) {
            cleanText = `<span class="chat-ping">@${window.AppConfig.channelName}</span> ${cleanText}`;
        }

        const userStyle = forceDefaultStyle ? null : ((window.AppConfig.customChatStyles && window.AppConfig.customChatStyles[userAlias.toLowerCase()]) || null);

        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
            user: userAlias, color: color, avatarUrl: avatarUrl,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            htmlText: cleanText, replyData: isReply ? this.generateFakeReply() : null,
            isFirstTime: isFirstTime, isHighlighted: isHighlight, isMention: isPing,
            styleName: userStyle, role: role,
            badges: role === 'mod' ? { moderator: "1" } : (role === 'broadcaster' ? { broadcaster: "1" } : null)
        });
    },

    registerAllCommands: function() {
        const c = window.AppCommands;

        c.register(['uso_sync_req'], true, 0, () => AppCoreState.broadcastFullState('remote'));
        
        c.register(['refresh'], true, 0, (user, arg, argLow) => {
            window.AppEvents.emit('THEME_CHANGE', { theme: 'default' });
            window.AppEvents.emit('MEDIA_SET', { type: 'off' });
            window.AppEvents.emit('DEATHS_CMD', { cmd: 'reset' });
            window.AppEvents.emit('QUEUE_CMD', { cmd: 'clear' });
            window.AppEvents.emit('TTS_CMD', { stop: true });
            window.AppEvents.emit('WHEEL_TOGGLE', { state: false });
            window.AppEvents.emit('BLUR_TOGGLE', { state: 'off' });

            localStorage.setItem('uso_current_theme', 'default');
            localStorage.removeItem('uso_current_media');
            localStorage.setItem('uso_deaths', '0');
            localStorage.removeItem('uso_queue');

            if (argLow === "core") { 
                window.AppEvents.emit('CORE_REBOOT_START'); 
                window.AppEvents.emit('FORCE_RELOAD_VISUAL'); 
                setTimeout(() => { 
                    const coreUrl = new URL(window.location.href); 
                    coreUrl.searchParams.set('nocache', Date.now()); 
                    window.location.href = coreUrl.toString(); 
                }, 500); 
            } else { 
                window.AppEvents.emit('FORCE_RELOAD_VISUAL'); 
                setTimeout(() => AppCoreState.broadcastFullState('local'), 800);
            }
        });

        c.register(['widget', 'виджет'], true, 0, (user, arg, argLow) => {
            let parts = argLow.split(' '); 
            if (parts.length >= 2) window.AppEvents.emit('WIDGET_TOGGLE', { widget: parts[0], state: parts[1] });
        });
        
        c.register(['blur', 'блюр'], true, 0, (u, a, argLow) => window.AppEvents.emit('BLUR_TOGGLE', { state: argLow }));
        c.register(['cam'], true, 0, (u, a, argLow) => window.AppEvents.emit('MEDIA_CAM', { state: argLow }));
        c.register(['mic'], true, 0, (u, a, argLow) => window.AppEvents.emit('MEDIA_MIC', { state: argLow }));

        c.register(['протокол', 'protocol'], true, 0, (user, arg, argLow) => {
            if (argLow === "цирк" || argLow === "circus") { window.AppEvents.emit('THEME_CHANGE', { theme: 'circus' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 5000 }); } 
            else if (argLow === "нуар" || argLow === "noir") { window.AppEvents.emit('THEME_CHANGE', { theme: 'noir' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'listen', duration: 5000 }); } 
            else if (argLow === "отмена" || argLow === "off" || argLow === "default") { window.AppEvents.emit('THEME_CHANGE', { theme: 'default' }); window.AppEvents.emit('PET_EMOTION', { emotion: 'idle', duration: 2000 }); }
        });

        c.register(['media', 'медиа'], true, 2000, (user, arg, argLow) => {
            if (argLow === "off" || argLow === "clear" || argLow === "hide") window.AppEvents.emit('MEDIA_SET', { type: 'off' });
            else if (argLow.startsWith("yt ") || argLow.startsWith("youtube ")) {
                const query = arg.substring(arg.indexOf(' ') + 1).trim();
                const match = query.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                const ytId = (match && match[2].length === 11) ? match[2] : (query.length === 11 ? query : null);
                if (ytId) window.AppEvents.emit('MEDIA_SET', { type: 'yt', query: ytId });
            } else if (argLow.startsWith("game ") || argLow.startsWith("игра ")) {
                window.AppEvents.emit('MEDIA_SET', { type: 'game', query: argLow.replace("game ", "").replace("игра ", "").trim() });
            }
        });

        c.register(['game', 'игра'], true, 2000, (u, a, argLow) => {
            if (argLow === "off" || argLow === "clear" || argLow === "hide") window.AppEvents.emit('MEDIA_SET', { type: 'off' }); 
            else window.AppEvents.emit('MEDIA_SET', { type: 'game', query: argLow });
        });

        c.register(['so', 'shoutout'], true, 2000, (u, arg) => {
            if (arg !== "" && AppCoreState.widgets.shoutout) window.AppEvents.emit('SHOUTOUT_ADD', { user: arg });
        });

        c.register(['play', 'sr'], false, 0, (user, arg) => { if (arg !== "") window.AppEvents.emit('QUEUE_ADD', { user, url: arg }); });
        c.register(['skip'], true, 0, (u, a, argLow) => window.AppEvents.emit('QUEUE_CMD', { cmd: argLow === "all" ? 'skip_all' : 'skip_track' }));
        c.register(['clear'], true, 0, () => window.AppEvents.emit('QUEUE_CMD', { cmd: 'clear' }));
        c.register(['vol'], true, 0, (u, arg) => { if (arg !== "") window.AppEvents.emit('PLAYER_VOL', { vol: arg }); });

        c.register(['tts'], true, 0, (user, arg, argLow) => {
            if (arg !== "") {
                if (argLow === "stop" || argLow === "skip") window.AppEvents.emit('TTS_CMD', { stop: true }); 
                else if (AppCoreState.widgets.tts) window.AppEvents.emit('TTS_ADD', { user, text: arg });
            }
        });

        c.register(['emotes', 'смайлы'], true, 0, (u, a, argLow) => window.AppEvents.emit('EMOTES_CMD', { cmd: argLow }));
        c.register(['fox', 'лиса', 'лис'], true, 0, (u, a, argLow) => {
            const states = ['idle', 'sleep', 'alert', 'hype', 'love', 'scared', 'angry', 'greet', 'bye', 'jam', 'listen', 'nom'];
            if (states.includes(argLow)) window.AppEvents.emit('PET_EMOTION', { emotion: argLow, duration: 5000 });
            else if (argLow === "кусь" || argLow === "ням") window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 5000 });
            else if (argLow === "привет") window.AppEvents.emit('PET_EMOTION', { emotion: 'greet', duration: 5000 });
            else if (argLow === "пока") window.AppEvents.emit('PET_EMOTION', { emotion: 'bye', duration: 5000 });
            else if (argLow === "танцуй" || argLow === "вайб") window.AppEvents.emit('PET_EMOTION', { emotion: 'jam', duration: 5000 });
        });

        c.register(['death', 'deaths', 'смерть'], true, 0, (u, a, argLow) => {
            if (!["off", "hide", "-", "sub", "reset", "clear"].includes(argLow) && !argLow.startsWith("set")) {
                window.AppEvents.emit('PET_EMOTION', { emotion: 'scared', duration: 3000 });
            }
            window.AppEvents.emit('DEATHS_CMD', { cmd: argLow });
        });

        c.register(['wheel', 'рулетка'], true, 0, (u, arg, argLow) => {
            if (argLow === "show" || argLow === "on") window.AppEvents.emit('WHEEL_TOGGLE', { state: true });
            else if (argLow === "hide" || argLow === "off") window.AppEvents.emit('WHEEL_TOGGLE', { state: false });
            else if (argLow === "clear") window.AppEvents.emit('WHEEL_CMD', { cmd: 'clear' });
            else if (argLow === "spin") window.AppEvents.emit('WHEEL_CMD', { cmd: 'spin' });
            else if (argLow.startsWith("add ")) window.AppEvents.emit('WHEEL_ADD', { text: arg.substring(4) });
            else if (argLow.startsWith("remove ")) window.AppEvents.emit('WHEEL_CMD', { cmd: 'remove', val: arg.substring(7) });
        });

        c.register(['alert'], true, 0, (u, a, argLow) => {
            if (AppCoreState.widgets.alerts) { 
                window.AppEvents.emit('PET_EMOTION', { emotion: 'love', duration: 5000 }); 
                window.AppEvents.emit('ALERT_TEST', { type: argLow }); 
            }
        });
        
        c.register(['testgoal'], true, 0, () => window.AppEvents.emit('GOAL_TEST_ADD'));
        
        c.register(['testticker'], true, 0, (u, arg, argLow) => {
            if (argLow === "music") window.AppEvents.emit('TICKER_CUSTOM', { msg: "<span style='color: #FF4477; font-weight: 800;'>🎵 test_user</span> заказал трек: Секретная Песня", badge: "МУЗЫКА", color: "#FF4477" });
            else if (argLow === "alert") window.AppEvents.emit('TICKER_CUSTOM', { msg: "<span style='color: #00FF7F; font-weight: 800;'>💎 big_boss</span> активировал: Выпить шот", badge: "НАГРАДА", color: "#00FF7F" });
            else window.AppEvents.emit('TICKER_CUSTOM', { msg: arg || "Это тестовое сообщение для проверки системы бегущей строки 2.0!", badge: "ТЕСТ", color: "#FFD700" });
        });

        const getTestAvatar = async (name) => await window.AvatarManager.get(name, '#FF4477');
        
        c.register(['testchat'], true, 0, async (u, arg) => this.handleTestCommand(u, "#FF4477", await getTestAvatar(u), "Проверка дефолтного чата на связи!", arg));
        c.register(['testfirst'], true, 0, async (u, arg) => this.handleTestCommand(u, "#FF4477", await getTestAvatar(u), "Привет, я впервые на этом крутом стриме!", "-first " + arg));
        c.register(['testmention'], true, 0, async (u, arg) => this.handleTestCommand(u, "#00E5FF", await getTestAvatar(u), "Зацени это!", "-ping " + arg));
        c.register(['testhighlight'], true, 0, async (u, arg) => this.handleTestCommand(u, "#FFD700", await getTestAvatar(u), "Это очень важное сообщение за баллы!", "-hl " + arg));
        
        c.register(['testuser'], true, 0, async (user, arg) => {
            let parts = arg.split(' '); let targetUser = parts[0] || user; let restArgs = parts.slice(1).join(' '); 
            this.handleTestCommand(targetUser, "#FF4477", await getTestAvatar(targetUser), "Проверка кастомного стиля на связи!", restArgs);
        });

        c.register(['testtts'], true, 0, (user, arg) => {
            if (AppCoreState.widgets.tts) {
                let parts = arg.split(' '); let targetUser = parts[0] || "tetlabot"; 
                let ttsText = parts.slice(1).join(' ') || "Внимание. Тестирование вокального модуля успешно завершено."; 
                window.AppEvents.emit('TTS_ADD', { user: targetUser, text: ttsText });
            }
        });
    },

    // --- ОБРАБОТЧИКИ НАГРАД (ВЫНЕСЕНО В ОТДЕЛЬНУЮ ФУНКЦИЮ) ---
    handleRewardById: function(user, rewardId, message) {
        AppLogger.info(`🎁 Обработка награды от ${user}: ${rewardId} | Текст: ${message}`);
        
        window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });

        const cfg = window.AppConfig;

        if (rewardId === cfg.wheelRewardId) { 
            window.AppEvents.emit('WHEEL_ADD', { text: message }); 
            window.AppEvents.emit('WHEEL_TOGGLE', { state: true }); 
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Рулетка", message });
        }
        else if (rewardId === cfg.ttsRewardId && AppCoreState.widgets.tts) {
            window.AppEvents.emit('TTS_ADD', { user, text: message });
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Озвучка", message });
        }
        else if (rewardId === cfg.queueRewardId) {
            window.AppEvents.emit('QUEUE_ADD', { user, url: message });
        }
        else if (rewardId === cfg.feedRewardId) {
            window.AppEvents.emit('PET_EMOTION', { emotion: 'nom', duration: 6000 });
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Покормил лису", message });
        }
        else if (cfg.rewards && AppCoreState.widgets.alerts) {
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

    // --- ОБРАБОТЧИКИ TWITCH СОБЫТИЙ ---
    setupEvents: function() {
        ComfyJS.onCommand = async (user, command, message, flags, extra) => {
            window.AppCommands.execute(user, command, message, flags, extra);
        };

        ComfyJS.onChat = async (user, message, flags, self, extra) => {
            if (extra.customRewardId) {
                this.handleRewardById(user, extra.customRewardId, message);
            }

            const userColor = extra.userColor || '#FF4477'; 
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const lowerUser = user.toLowerCase();
            
            const isFirstTime = extra.userState && (extra.userState['first-msg'] === true || extra.userState['first-msg'] === '1');
            const isHighlighted = flags.highlighted || !!extra.customRewardId;

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
                if (extra.messageEmotes && AppCoreState.widgets.emotes) { 
                    setPet('hype', 1); 
                    window.AppEvents.emit('EMOTES_SPAWN', extra.messageEmotes); 
                }
            }
            if (petEmotion) window.AppEvents.emit('PET_EMOTION', { emotion: petEmotion, duration: 4000 });

            if (isMention && !hasForbidden) cleanText = cleanText.replace(mentionRegex, `<span class="chat-ping">$&</span>`);

            if (flags.highlighted && !hasForbidden) {
                window.AppEvents.emit('TICKER_REWARD', { user, reward: "Выделенное сообщение", message: cleanText });
                if (AppCoreState.widgets.tts) {
                    window.AppEvents.emit('TTS_ADD', { user: user, text: cleanText.replace(/<[^>]+>/g, '') });
                }
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
            
            let role = 'viewer';
            if (flags.broadcaster) role = 'broadcaster';
            else if (flags.mod) role = 'mod';
            else if (flags.vip) role = 'vip';
            else if (flags.subscriber || flags.founder) role = 'sub';

            window.AppEvents.emit('CHAT_RENDER_MESSAGE', { 
                user, color: userColor, avatarUrl, time, htmlText: cleanText, 
                replyData, isFirstTime, isHighlighted, isMention,
                styleName: userStyle, role: role, badges: extra.userBadges
            });
        };

        const triggerLove = () => window.AppEvents.emit('PET_EMOTION', { emotion: 'love', duration: 5000 });
        
        ComfyJS.onSub = (user, message) => { if(AppCoreState.widgets.alerts) window.AppEvents.emit('ALERT_ADD', { user, type: 'sub', msg: message }); triggerLove(); };
        ComfyJS.onResub = (user, message, sMonths, cMonths) => { if(AppCoreState.widgets.alerts) window.AppEvents.emit('ALERT_ADD', { user, type: 'resub', msg: message, val: cMonths }); triggerLove(); };
        ComfyJS.onSubGift = (gifter, streak, recUser) => { if(AppCoreState.widgets.alerts) window.AppEvents.emit('ALERT_ADD', { user: gifter, type: 'gift', msg: `для ${recUser}` }); triggerLove(); };
        ComfyJS.onSubMysteryGift = (gifter, numb) => { if(AppCoreState.widgets.alerts) window.AppEvents.emit('ALERT_ADD', { user: gifter, type: 'gift', msg: `подарил ${numb} саб.!` }); triggerLove(); };

        const client = ComfyJS.GetClient();
        if (client) {
            client.on("raw_message", (messageCloned, message) => {
                if (message.command === "USERNOTICE" && message.tags && message.tags["msg-id"] === "viewermilestone") {
                    if(AppCoreState.widgets.alerts) window.AppEvents.emit('ALERT_ADD', { user: message.tags["display-name"] || message.tags["login"], type: 'streak', msg: (message.params && message.params.length > 1) ? message.params[1] : "", val: message.tags["msg-param-value"] });
                    triggerLove();
                }
            });
        }
    }
};

window.AppCore.init();