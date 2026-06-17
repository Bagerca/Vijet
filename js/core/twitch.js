/* ================= js/core/twitch.js ================= */

window.AppTwitch = {
    init: function() {
        let channelsToJoin = [window.AppConfig.channelName];
        if (window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.length > 0) {
            channelsToJoin = channelsToJoin.concat(window.AppConfig.allowedUsers);
        }
        channelsToJoin = [...new Set(channelsToJoin.map(c => c.toLowerCase()))];
        
        window.AppLogger.info(`Подключение к чатам: ${channelsToJoin.join(', ')}...`);
        window.ComfyJS.Init(window.AppConfig.channelName, "", channelsToJoin);
        
        this.setupEvents();
    },

    setupEvents: function() {
        window.ComfyJS.onCommand = async (user, command, message, flags, extra) => {
            window.AppCommands.execute(user, command, message, flags, extra);
        };

        window.ComfyJS.onChat = async (user, message, flags, self, extra) => {
            window.AppChatProcessor.processIncomingChat(user, message, flags, self, extra);
        };

        const ev = window.AppEvents;
        const triggerLove = () => ev.emit('PET_EMOTION', { emotion: 'love', duration: 5000 });
        
        window.ComfyJS.onSub = (user, message) => { if(window.AppCoreState.widgets.alerts) ev.emit('ALERT_ADD', { user, type: 'sub', msg: message }); triggerLove(); };
        window.ComfyJS.onResub = (user, message, sMonths, cMonths) => { if(window.AppCoreState.widgets.alerts) ev.emit('ALERT_ADD', { user, type: 'resub', msg: message, val: cMonths }); triggerLove(); };
        window.ComfyJS.onSubGift = (gifter, streak, recUser) => { if(window.AppCoreState.widgets.alerts) ev.emit('ALERT_ADD', { user: gifter, type: 'gift', msg: `для ${recUser}` }); triggerLove(); };
        window.ComfyJS.onSubMysteryGift = (gifter, numb) => { if(window.AppCoreState.widgets.alerts) ev.emit('ALERT_ADD', { user: gifter, type: 'gift', msg: `подарил ${numb} саб.!` }); triggerLove(); };

        const client = window.ComfyJS.GetClient();
        if (client) {
            client.on("raw_message", (messageCloned, message) => {
                if (message.command === "USERNOTICE" && message.tags && message.tags["msg-id"] === "viewermilestone") {
                    if(window.AppCoreState.widgets.alerts) ev.emit('ALERT_ADD', { user: message.tags["display-name"] || message.tags["login"], type: 'streak', msg: (message.params && message.params.length > 1) ? message.params[1] : "", val: message.tags["msg-param-value"] });
                    triggerLove();
                }
            });
        }
    }
};