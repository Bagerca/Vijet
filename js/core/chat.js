/* ================= js/core/chat.js ================= */

window.AppChatProcessor = {
    greetedUsers: new Set(), 
    processedMessageIds: new Set(),

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

        if (isTts && window.AppCoreState.widgets['tts']) {
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

    handleRewardById: function(user, rewardId, message) {
        window.AppLogger.info(`🎁 Обработка награды от ${user}: ${rewardId} | Текст: ${message}`);
        window.AppEvents.emit('PET_EMOTION', { emotion: 'hype', duration: 3000 });
        const cfg = window.AppConfig;

        if (rewardId === cfg.wheelRewardId) { 
            window.AppCommands.execute(user, "wheel", `add ${message}`, {broadcaster: true});
            window.AppCommands.execute(user, "wheel", "show", {broadcaster: true});
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Рулетка", message });
        }
        else if (rewardId === cfg.ttsRewardId && window.AppCoreState.widgets.tts) {
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
        else if (cfg.rewards && window.AppCoreState.widgets.alerts) {
            let matchedCategory = null; let type = null;
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

    processIncomingChat: async function(user, message, flags, self, extra) {
        // Дедупликация
        const msgId = extra.id;
        if (msgId) {
            if (this.processedMessageIds.has(msgId)) return; 
            this.processedMessageIds.add(msgId);
            if (this.processedMessageIds.size > 100) {
                this.processedMessageIds = new Set(Array.from(this.processedMessageIds).slice(-50));
            }
        }

        if (extra.customRewardId) this.handleRewardById(user, extra.customRewardId, message);

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
            if (extra.messageEmotes && window.AppCoreState.widgets.emotes) { 
                setPet('hype', 1); window.AppEvents.emit('EMOTES_SPAWN', extra.messageEmotes); 
            }
        }
        if (petEmotion) window.AppEvents.emit('PET_EMOTION', { emotion: petEmotion, duration: 4000 });

        if (isMention && !hasForbidden) cleanText = cleanText.replace(mentionRegex, `<span class="chat-ping">$&</span>`);

        if (flags.highlighted && !hasForbidden) {
            window.AppEvents.emit('TICKER_REWARD', { user, reward: "Выделенное сообщение", message: cleanText });
            if (window.AppCoreState.widgets.tts) window.AppEvents.emit('TTS_ADD', { user: user, text: cleanText.replace(/<[^>]+>/g, '') });
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
            replyData, isFirstTime, isHighlighted, isMention, styleName: userStyle, role: role, badges: extra.userBadges
        });
    }
};