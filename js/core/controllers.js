/* ================= js/core/controllers.js ================= */

window.AppControllers = {
    registerAll: function() {
        const c = window.AppCommands;
        const state = window.AppCoreState;
        const ev = window.AppEvents;

        c.register(['uso_sync_req'], true, 0, () => state.broadcastFullState('remote'));
        
        c.register(['refresh'], true, 0, (user, arg, argLow) => {
            localStorage.removeItem('uso_current_media'); localStorage.removeItem('uso_current_theme');
            localStorage.removeItem('uso_deaths'); localStorage.removeItem('uso_queue'); localStorage.removeItem('uso_wheel_items');

            state.update({ theme: 'default', media: null, deathsCount: 0, queue: [], wheelItems: [], widgets: { deaths: false, wheel: false, blur: false } });
            ev.emit('TTS_CMD', { stop: true });

            if (argLow === "core") { 
                ev.emit('CORE_REBOOT_START'); ev.emit('FORCE_RELOAD_VISUAL'); 
                setTimeout(() => { const coreUrl = new URL(window.location.href); coreUrl.searchParams.set('nocache', Date.now()); window.location.href = coreUrl.toString(); }, 500); 
            } else { 
                ev.emit('FORCE_RELOAD_VISUAL'); setTimeout(() => state.broadcastFullState('local'), 800);
            }
        });

        c.register(['widget', 'виджет'], true, 0, (user, arg, argLow) => { let parts = argLow.split(' '); if (parts.length >= 2) ev.emit('WIDGET_TOGGLE', { widget: parts[0], state: parts[1] }); });
        c.register(['blur', 'блюр'], true, 0, (u, a, argLow) => ev.emit('BLUR_TOGGLE', { state: argLow }));
        c.register(['cam'], true, 0, (u, a, argLow) => ev.emit('MEDIA_CAM', { state: argLow }));
        c.register(['mic'], true, 0, (u, a, argLow) => ev.emit('MEDIA_MIC', { state: argLow }));

        c.register(['протокол', 'protocol'], true, 0, (user, arg, argLow) => {
            if (argLow === "цирк" || argLow === "circus") { ev.emit('THEME_CHANGE', { theme: 'circus' }); ev.emit('PET_EMOTION', { emotion: 'hype', duration: 5000 }); } 
            else if (argLow === "нуар" || argLow === "noir") { ev.emit('THEME_CHANGE', { theme: 'noir' }); ev.emit('PET_EMOTION', { emotion: 'listen', duration: 5000 }); } 
            else if (argLow === "отмена" || argLow === "off" || argLow === "default") { ev.emit('THEME_CHANGE', { theme: 'default' }); ev.emit('PET_EMOTION', { emotion: 'idle', duration: 2000 }); }
        });

        c.register(['media', 'медиа'], true, 2000, (user, arg, argLow) => {
            if (argLow === "off" || argLow === "clear" || argLow === "hide") ev.emit('MEDIA_SET', { type: 'off' });
            else if (argLow.startsWith("yt ") || argLow.startsWith("youtube ")) {
                const query = arg.substring(arg.indexOf(' ') + 1).trim();
                const match = query.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                const ytId = (match && match[2].length === 11) ? match[2] : (query.length === 11 ? query : null);
                if (ytId) ev.emit('MEDIA_SET', { type: 'yt', query: ytId });
            } else if (argLow.startsWith("game ") || argLow.startsWith("игра ")) {
                ev.emit('MEDIA_SET', { type: 'game', query: argLow.replace("game ", "").replace("игра ", "").trim() });
            }
        });

        c.register(['game', 'игра'], true, 2000, (u, a, argLow) => { if (argLow === "off" || argLow === "clear" || argLow === "hide") ev.emit('MEDIA_SET', { type: 'off' }); else ev.emit('MEDIA_SET', { type: 'game', query: argLow }); });
        c.register(['so', 'shoutout'], true, 2000, (u, arg) => { if (arg !== "" && state.widgets.shoutout) ev.emit('SHOUTOUT_ADD', { user: arg }); });
        c.register(['play', 'sr'], false, 0, (user, arg) => { if (arg !== "") ev.emit('QUEUE_ADD', { user, url: arg }); });
        c.register(['skip'], true, 0, (u, a, argLow) => ev.emit('QUEUE_CMD', { cmd: argLow === "all" ? 'skip_all' : 'skip_track' }));
        c.register(['clear'], true, 0, () => ev.emit('QUEUE_CMD', { cmd: 'clear' }));
        c.register(['vol'], true, 0, (u, arg) => { if (arg !== "") ev.emit('PLAYER_VOL', { vol: arg }); });
        c.register(['tts'], true, 0, (user, arg, argLow) => { if (arg !== "") { if (argLow === "stop" || argLow === "skip") ev.emit('TTS_CMD', { stop: true }); else if (state.widgets.tts) ev.emit('TTS_ADD', { user, text: arg }); } });
        c.register(['emotes', 'смайлы'], true, 0, (u, a, argLow) => ev.emit('EMOTES_CMD', { cmd: argLow }));
        
        c.register(['fox', 'лиса', 'лис'], true, 0, (u, a, argLow) => {
            const states = ['idle', 'sleep', 'alert', 'hype', 'love', 'scared', 'angry', 'greet', 'bye', 'jam', 'listen', 'nom'];
            if (states.includes(argLow)) ev.emit('PET_EMOTION', { emotion: argLow, duration: 5000 });
            else if (argLow === "кусь" || argLow === "ням") ev.emit('PET_EMOTION', { emotion: 'nom', duration: 5000 });
            else if (argLow === "привет") ev.emit('PET_EMOTION', { emotion: 'greet', duration: 5000 });
            else if (argLow === "пока") ev.emit('PET_EMOTION', { emotion: 'bye', duration: 5000 });
            else if (argLow === "танцуй" || argLow === "вайб") ev.emit('PET_EMOTION', { emotion: 'jam', duration: 5000 });
        });

        c.register(['death', 'deaths', 'смерть'], true, 0, (u, a, argLow) => {
            if (!["off", "hide", "-", "sub", "reset", "clear"].includes(argLow) && !argLow.startsWith("set")) ev.emit('PET_EMOTION', { emotion: 'scared', duration: 3000 });
            ev.emit('DEATHS_CMD', { cmd: argLow });
        });

        c.register(['wheel', 'рулетка'], true, 0, (u, arg, argLow) => {
            if (argLow === "show" || argLow === "on") ev.emit('WHEEL_TOGGLE', { state: true });
            else if (argLow === "hide" || argLow === "off") ev.emit('WHEEL_TOGGLE', { state: false });
            else if (argLow === "spin") ev.emit('WHEEL_CMD', { cmd: 'spin' });
            else if (argLow === "clear") state.update({ wheelItems: [] });
            else if (argLow.startsWith("add ")) { const t = arg.substring(4).trim(); if (t && state.wheelItems.length < (window.AppConfig.wheelMaxItems || 15)) state.update({ wheelItems: [...state.wheelItems, t] }); }
            else if (argLow.startsWith("remove ")) {
                const val = arg.substring(7).trim(); const num = parseInt(val); let newItems = [...state.wheelItems];
                if (!isNaN(num) && num > 0 && num <= newItems.length) newItems.splice(num - 1, 1);
                else { const idx = newItems.findIndex(i => i.toLowerCase() === val.toLowerCase()); if (idx !== -1) newItems.splice(idx, 1); }
                state.update({ wheelItems: newItems });
            }
        });

        c.register(['alert'], true, 0, (u, a, argLow) => { if (state.widgets.alerts) { ev.emit('PET_EMOTION', { emotion: 'love', duration: 5000 }); ev.emit('ALERT_TEST', { type: argLow }); } });
        c.register(['testgoal'], true, 0, () => ev.emit('GOAL_TEST_ADD'));
        c.register(['testticker'], true, 0, (u, arg, argLow) => {
            if (argLow === "music") ev.emit('TICKER_CUSTOM', { msg: "<span style='color: #FF4477; font-weight: 800;'>🎵 test_user</span> заказал трек: Секретная Песня", badge: "МУЗЫКА", color: "#FF4477" });
            else if (argLow === "alert") ev.emit('TICKER_CUSTOM', { msg: "<span style='color: #00FF7F; font-weight: 800;'>💎 big_boss</span> активировал: Выпить шот", badge: "НАГРАДА", color: "#00FF7F" });
            else ev.emit('TICKER_CUSTOM', { msg: arg || "Тестовая строка", badge: "ТЕСТ", color: "#FFD700" });
        });

        const getTestAv = async (n) => await window.AvatarManager.get(n, '#FF4477');
        const chat = window.AppChatProcessor;
        
        c.register(['testchat'], true, 0, async (u, arg) => chat.handleTestCommand(u, "#FF4477", await getTestAv(u), "Проверка дефолтного чата на связи!", arg));
        c.register(['testfirst'], true, 0, async (u, arg) => chat.handleTestCommand(u, "#FF4477", await getTestAv(u), "Привет, я впервые на этом крутом стриме!", "-first " + arg));
        c.register(['testmention'], true, 0, async (u, arg) => chat.handleTestCommand(u, "#00E5FF", await getTestAv(u), "Зацени это!", "-ping " + arg));
        c.register(['testhighlight'], true, 0, async (u, arg) => chat.handleTestCommand(u, "#FFD700", await getTestAv(u), "Это очень важное сообщение за баллы!", "-hl " + arg));
        
        c.register(['testuser'], true, 0, async (user, arg) => { let parts = arg.split(' '); let targetUser = parts[0] || user; let restArgs = parts.slice(1).join(' '); chat.handleTestCommand(targetUser, "#FF4477", await getTestAv(targetUser), "Проверка кастомного стиля на связи!", restArgs); });
        c.register(['testtts'], true, 0, (user, arg) => { if (state.widgets.tts) { let parts = arg.split(' '); let targetUser = parts[0] || "tetlabot"; let ttsText = parts.slice(1).join(' ') || "Внимание. Тестирование вокального модуля успешно завершено."; ev.emit('TTS_ADD', { user: targetUser, text: ttsText }); } });
    }
};