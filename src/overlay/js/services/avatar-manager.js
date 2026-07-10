/* ФАЙЛ: js/services/avatar-manager.js */
/* ================= МЕНЕДЖЕР АВАТАРОК (RAM Cache + Debounced I/O) ================= */
window.AvatarManager = {
    CACHE_KEY: 'uso_avatars_lru',
    MAX_CACHED_USERS: 150, 
    
    // RAM Хранилище (Быстрый доступ)
    ramCache: {},
    saveTimeout: null,

    init: function() {
        // Миграция старого кэша
        if (localStorage.getItem('uso_avatars')) {
            localStorage.removeItem('uso_avatars');
            localStorage.removeItem('uso_avatars_last_clear');
        }

        // Загружаем данные с диска в RAM один раз при старте
        try {
            const saved = localStorage.getItem(this.CACHE_KEY);
            if (saved) this.ramCache = JSON.parse(saved);
        } catch(e) { this.ramCache = {}; }
    },

    syncToDisk: function() {
        // Очищаем старые записи, если превышен лимит, перед записью на диск
        const keys = Object.keys(this.ramCache);
        if (keys.length > this.MAX_CACHED_USERS) {
            keys.sort((a, b) => this.ramCache[a].ts - this.ramCache[b].ts);
            const itemsToRemove = keys.length - this.MAX_CACHED_USERS;
            for (let i = 0; i < itemsToRemove; i++) delete this.ramCache[keys[i]];
        }
        
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.ramCache));
        } catch(e) {
            console.warn("[AvatarManager] Ошибка записи в LocalStorage (переполнение). Очистка.");
            this.ramCache = {};
            localStorage.removeItem(this.CACHE_KEY);
        }
    },

    get: async function(username, fallbackColor = '#FF4477') {
        const cleanName = username.toLowerCase();
        
        // 1. Проверяем в RAM-кэше (МОМЕНТАЛЬНО, без нагрузки на диск)
        if (this.ramCache[cleanName]) {
            this.ramCache[cleanName].ts = Date.now(); // Обновляем время использования
            return this.ramCache[cleanName].value;
        }
        
        // 2. Запрос к API
        try {
            const data = await window.AppUtils.safeFetch(`https://api.ivr.fi/v2/twitch/user?login=${cleanName}`);
            if (data && data.length > 0 && data[0].logo) {
                const avatarUrl = data[0].logo;
                this._saveToRam(cleanName, avatarUrl);
                return avatarUrl;
            }
            throw new Error("Нет аватарки");
        } catch (e) {
            // 3. Фолбэк-заглушка UI-Avatars
            let hexColor = fallbackColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${cleanName}&background=${hexColor}&color=fff&size=64&bold=true`;
            this._saveToRam(cleanName, fallbackUrl);
            return fallbackUrl;
        }
    },

    _saveToRam: function(key, value) {
        this.ramCache[key] = { value: value, ts: Date.now() };
        
        // Отложенная запись на диск (Debounce 5 секунд)
        // Если придет 100 сообщений, мы запишем на диск только 1 раз!
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.syncToDisk(), 5000);
    }
};

window.AvatarManager.init();