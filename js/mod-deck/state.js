const AuthManager = {
    getCreds: () => ({
        channel: localStorage.getItem('uso_mod_channel') || '',
        user: localStorage.getItem('uso_mod_user') || '',
        token: localStorage.getItem('uso_mod_token') || ''
    }),
    saveCreds: (channel, user, token) => {
        if (!token.startsWith('oauth:')) token = 'oauth:' + token;
        localStorage.setItem('uso_mod_channel', channel.trim().toLowerCase());
        localStorage.setItem('uso_mod_user', user.trim().toLowerCase());
        localStorage.setItem('uso_mod_token', token.trim());
    },
    logout: () => { localStorage.clear(); location.reload(); },
    isValid: function() { const c = this.getCreds(); return c.channel && c.user && c.token; }
};

const DeckState = {
    widgets: {},
    queue: [],
    health: { core: false, visual: false },
    
    updateWidgets: function(newWidgets) {
        this.widgets = { ...this.widgets, ...newWidgets };
        if (window.UIBuilder) window.UIBuilder.syncAllSwitches(this.widgets);
    },
    updateQueue: function(newQueue) {
        this.queue = newQueue || [];
        if (window.UIBuilder) window.UIBuilder.renderQueue(this.queue);
    },
    updateHealth: function(system, isAlive) {
        this.health[system] = isAlive;
        if (window.UIBuilder) window.UIBuilder.updateHealthStatus(system, isAlive);
    }
};

window.AuthManager = AuthManager;
window.DeckState = DeckState;