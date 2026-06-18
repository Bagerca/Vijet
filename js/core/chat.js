/* ================= js/core/chat.js ================= */

window.AppChatProcessor = {
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
            window.AppEvents.emit('TTS_ADD', { 
                user: userAlias, 
                text: cleanText.replace(/<[^>]+>/g, ''),
                forceDefault: forceDefaultStyle
            });
        }

        if (isPing && !hasForbidden) {
            cleanText = `<span class="chat-ping">@${window.AppConfig.channelName}</span> ${cleanText}`;
        }

        const userStyle = forceDefaultStyle ? null : ((window.AppConfig.customChatStyles && window.AppConfig.customChatStyles[userAlias.toLowerCase()]) || null);

        // Для тестовых команд генерируем случайный уникальный ID
        const fakeMsgId = "test_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

        window.AppEvents.emit('CHAT_RENDER_MESSAGE', {
            id: fakeMsgId,
            user: userAlias, color: color, avatarUrl: avatarUrl,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            htmlText: cleanText, replyData: isReply ? this.generateFakeReply() : null,
            isFirstTime: isFirstTime, isHighlighted: isHighlight, isMention: isPing,
            styleName: userStyle, role: role,
            badges: role === 'mod' ? { moderator: "1" } : (role === 'broadcaster' ? { broadcaster: "1" } : null)
        });
    },

    processIncomingChat: async function(user, message, flags, self, extra) {
        const msgId = extra.id;
        if (msgId) {
            if (this.processedMessageIds.has(msgId)) return; 
            this.processedMessageIds.add(msgId);
            if (this.processedMessageIds.size > 100) {
                this.processedMessageIds = new Set(Array.from(this.processedMessageIds).slice(-50));
            }
        }

        if (extra.customRewardId) {
            window.AppEvents.emit('CHAT_REWARD_ACTIVATED', { user, rewardId: extra.customRewardId, message });
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

        window.AppEvents.emit('CHAT_MESSAGE_ANALYZED', {
            user: user,
            hasForbidden: hasForbidden,
            isMention: isMention,
            hasEmotes: !!extra.messageEmotes,
            isFirstTime: isFirstTime,
            isBroadcaster: flags.broadcaster
        });

        if (extra.messageEmotes && window.AppCoreState.widgets.emotes && !hasForbidden) { 
            window.AppEvents.emit('EMOTES_SPAWN', extra.messageEmotes); 
        }

        if (isMention && !hasForbidden) {
            cleanText = cleanText.replace(mentionRegex, `<span class="chat-ping">$&</span>`);
        }

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
            id: msgId, // Передаем уникальный ID
            user, color: userColor, avatarUrl, time, htmlText: cleanText, 
            replyData, isFirstTime, isHighlighted, isMention, styleName: userStyle, role: role, badges: extra.userBadges
        });
    }
};