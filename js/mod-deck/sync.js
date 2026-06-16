/* ================= mod-deck/sync.js ================= */

const SyncEngine = {
    lastCorePing: 0,
    lastVisualPing: 0,

    init: function() {
        if (window.AppEvents) {
            window.AppEvents.listen('SYSTEM_STATE_RESPONSE', (data) => {
                console.log("[SYNC 📥] Локальное обновление состояния", data);
                if (data.widgets) window.DeckState.updateWidgets(data.widgets);
                if (data.queue) window.DeckState.updateQueue(data.queue);
                if (data.theme) window.DeckState.updateTheme(data.theme);
                if (data.media !== undefined) window.DeckState.updateMedia(data.media);
                if (data.volume !== undefined) window.DeckState.updateVolume(data.volume);
                if (data.deaths !== undefined) window.DeckState.updateDeaths(data.deaths);
            });

            window.AppEvents.listen('QUEUE_STATE', (data) => {
                if (data.items) window.DeckState.updateQueue(data.items);
            });

            window.AppEvents.listen('CORE_HEARTBEAT', () => this.ping('core'));
            window.AppEvents.listen('VISUAL_HEARTBEAT', () => this.ping('visual'));
        }
        setInterval(() => this.checkHealth(), 5000);
    },

    requestSync: function(isManual = false) {
        console.log("[SYNC 📤] Запрос актуальных данных...");
        if (window.AppEvents) window.AppEvents.emit('SYSTEM_STATE_REQUEST'); 
        if (isManual && window.TwitchAPI) window.TwitchAPI.send('!uso_sync_req'); 
    },

    ping: function(system) {
        if (system === 'core') this.lastCorePing = Date.now();
        if (system === 'visual') this.lastVisualPing = Date.now();
        window.DeckState.updateHealth(system, true);
    },

    checkHealth: function() {
        const now = Date.now();
        if (now - this.lastCorePing > 12000) window.DeckState.updateHealth('core', false);
        if (now - this.lastVisualPing > 12000) window.DeckState.updateHealth('visual', false);
    },

    parseChatSync: function(message) {
        if (message.includes('[USO_SYNC]')) {
            try {
                const jsonStr = message.replace('[USO_SYNC]', '').trim();
                const data = JSON.parse(jsonStr);
                console.log("[SYNC 📥] Удаленное обновление из чата", data);
                if (data.widgets) window.DeckState.updateWidgets(data.widgets);
                if (data.queue) window.DeckState.updateQueue(data.queue);
                if (data.theme) window.DeckState.updateTheme(data.theme);
                if (data.media !== undefined) window.DeckState.updateMedia(data.media);
                if (data.volume !== undefined) window.DeckState.updateVolume(data.volume);
                if (data.deaths !== undefined) window.DeckState.updateDeaths(data.deaths);
            } catch (e) { console.error("Ошибка парсинга USO_SYNC", e); }
            return true; 
        }
        return false;
    }
};

window.SyncEngine = SyncEngine;