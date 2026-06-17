/* ================= js/core/main.js ================= */

window.AppCoreMain = {
    init: function() {
        if (!window.AppConfig.channelName || window.AppConfig.channelName === "ТВОЙ_НИК") {
            window.AppLogger.error("Имя канала не настроено в config.js!");
            return;
        }

        window.AppCoreState.init(); 
        window.AppControllers.registerAll();
        window.AppTwitch.init();
        
        this.setupSystemListeners();
        setInterval(() => window.AppEvents.emit('CORE_HEARTBEAT'), 5000);
    },

    setupSystemListeners: function() {
        const ev = window.AppEvents;
        const state = window.AppCoreState;

        ev.listen('VISUAL_READY', () => {
            window.AppLogger.info("Визуал на связи. Высылаю настройки...");
            state.syncVisuals(null); 
        });

        ev.listen('SYSTEM_STATE_REQUEST', () => state.broadcastFullState('local'));
        
        ev.listen('WIDGET_TOGGLE', (d) => {
            if (state.widgets[d.widget] !== undefined) state.update({ widgets: { [d.widget]: (d.state === 'on' || d.state === 'show') } });
        });

        ev.listen('MEDIA_CAM', (d) => state.update({ widgets: { cam: (d.state === 'on') } }));
        ev.listen('BLUR_TOGGLE', (d) => state.update({ widgets: { blur: (d.state === 'on') } }));
        ev.listen('WHEEL_TOGGLE', (d) => state.update({ widgets: { wheel: d.state } }));
        
        ev.listen('DEATHS_CMD', (d) => {
            let newCount = state.deathsCount;
            let showWidget = state.widgets.deaths;

            if (d.cmd === 'show' || d.cmd === 'on') showWidget = true;
            else if (d.cmd === 'hide' || d.cmd === 'off') showWidget = false;
            else if (d.cmd === '-' || d.cmd === 'sub') { newCount = Math.max(0, newCount - 1); if (newCount === 0) showWidget = false; }
            else if (d.cmd === 'reset' || d.cmd === 'clear') { newCount = 0; showWidget = false; }
            else if (d.cmd.startsWith('set ')) { newCount = parseInt(d.cmd.replace('set ', '')) || 0; showWidget = newCount > 0; }
            else { newCount++; showWidget = true; }
            state.update({ deathsCount: newCount, widgets: { deaths: showWidget } });
        });

        ev.listen('PLAYER_VOL', (d) => state.update({ volume: parseInt(d.vol) || 0 }));
        ev.listen('THEME_CHANGE', (d) => state.update({ theme: d.theme }));
        ev.listen('MEDIA_SET', (d) => {
            const newMedia = (d.type === 'off' || d.query === 'off' || d.query === 'clear') ? null : { type: d.type, query: d.query };
            state.update({ media: newMedia });
        });
    }
};