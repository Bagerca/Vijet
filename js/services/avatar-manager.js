window.AvatarManager = {
    cache: {},

    init: function() {
        const now = Date.now();
        const lastClear = localStorage.getItem('uso_avatars_last_clear');
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

        if (!lastClear || (now - parseInt(lastClear)) > ONE_WEEK) {
            this.clearCache();
            localStorage.setItem('uso_avatars_last_clear', now.toString());
        } else {
            const saved = localStorage.getItem('uso_avatars');
            this.cache = saved ? JSON.parse(saved) : {};
        }

        // Подписка на события перезагрузки для очистки кэша
        if (window.AppEvents) {
            window.AppEvents.listen('FORCE_RELOAD_VISUAL', () => this.clearCache());
            window.AppEvents.listen('CORE_REBOOT_START', () => this.clearCache());
        }
    },

    clearCache: function() {
        console.log("[AvatarManager] Очистка кэша аватаров из памяти и localStorage.");
        localStorage.removeItem('uso_avatars');
        this.cache = {};
    },

    get: async function(username, fallbackColor) {
        if (this.cache[username]) return this.cache[username];
        
        try {
            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
            const data = await response.json();
            if (data && data.length > 0 && data[0].logo) {
                this.cache[username] = data[0].logo; 
                localStorage.setItem('uso_avatars', JSON.stringify(this.cache));
                return data[0].logo;
            }
            throw new Error("Нет аватарки");
        } catch (e) {
            let hexColor = fallbackColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${hexColor}&color=fff&size=64&bold=true`;
            this.cache[username] = fallbackUrl;
            localStorage.setItem('uso_avatars', JSON.stringify(this.cache));
            return fallbackUrl;
        }
    }
};

window.AvatarManager.init();