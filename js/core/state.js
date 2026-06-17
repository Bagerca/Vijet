/* ================= js/core/state.js ================= */

window.AppLogger = {
    info: (msg, data = '') => console.log(`%c[CORE ℹ️] ${msg}`, 'color: #00E5FF;', data),
    success: (msg, data = '') => console.log(`%c[CORE ✅] ${msg}`, 'color: #00FF7F;', data),
    warn: (msg, data = '') => console.warn(`%c[CORE ⚠️] ${msg}`, 'color: #FEE101;', data),
    error: (msg, err = '') => {
        console.error(`%c[CORE ❌] ${msg}`, 'color: #FF0050;', err);
        if (window.AppEvents) window.AppEvents.emit('CORE_ERROR', { msg, err: err?.message || err });
    }
};

window.AppCoreState = {
    widgets: {
        chat: true, media: true, goal: true, alerts: true,
        socials: true, ticker: true, pet: true, emotes: true,
        music: true, tts: true, particles: true, cam: true, 
        blur: false, shoutout: true, deaths: false, wheel: false
    },
    theme: 'default', media: null, volume: window.AppConfig.defaultVolume || 30,
    deathsCount: 0, queue: [], wheelItems: [],

    init: function() {
        try {
            const saved = JSON.parse(localStorage.getItem('uso_master_state') || '{}');
            if (saved.theme !== undefined) this.theme = saved.theme;
            if (saved.media !== undefined) this.media = saved.media;
            if (saved.volume !== undefined) this.volume = saved.volume;
            if (saved.queue !== undefined) this.queue = saved.queue;
            if (saved.wheelItems !== undefined) this.wheelItems = saved.wheelItems;
            if (saved.deathsCount !== undefined) {
                this.deathsCount = saved.deathsCount;
                this.widgets.deaths = this.deathsCount > 0; 
            }
        } catch(e) { AppLogger.warn("Сбой чтения кэша State, используем дефолт."); }
    },

    save: function() {
        localStorage.setItem('uso_master_state', JSON.stringify({
            theme: this.theme, media: this.media, volume: this.volume,
            deathsCount: this.deathsCount, queue: this.queue, wheelItems: this.wheelItems
        }));
    },

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
        if (changed) {
            this.save();
            this.broadcastFullState('local');
            this.syncVisuals(updates);
        }
    },

    syncVisuals: function(specificUpdates = null) {
        const sendAll = specificUpdates === null; 
        if (sendAll || specificUpdates.deathsCount !== undefined || (specificUpdates.widgets && specificUpdates.widgets.deaths !== undefined)) {
            window.AppEvents.emit('DEATHS_UPDATE_UI', { count: this.deathsCount, isVisible: this.widgets.deaths });
        }
        if (sendAll || specificUpdates.theme !== undefined) window.AppEvents.emit('THEME_UPDATE_UI', { theme: this.theme });
        if (sendAll || specificUpdates.media !== undefined) window.AppEvents.emit('MEDIA_UPDATE_UI', this.media);
        if (sendAll || specificUpdates.wheelItems !== undefined) window.AppEvents.emit('WHEEL_UPDATE_UI', { items: this.wheelItems });
        if (sendAll || specificUpdates.queue !== undefined) window.AppEvents.emit('QUEUE_STATE', { count: this.queue.length, items: this.queue });
    },

    broadcastFullState: function(target = 'local') {
        const payload = {
            widgets: this.widgets, queue: this.queue, theme: this.theme,
            media: this.media, volume: this.volume, deaths: this.deathsCount, wheelItems: this.wheelItems
        };
        if (target === 'local') window.AppEvents.emit('SYSTEM_STATE_RESPONSE', payload);
        else if (target === 'remote' && window.AppConfig.channelName) {
            const client = window.ComfyJS ? window.ComfyJS.GetClient() : null;
            if (client && client.readyState() === "OPEN") {
                window.ComfyJS.Say(`[USO_SYNC] ${JSON.stringify(payload)}`, window.AppConfig.channelName);
            }
        }
    }
};