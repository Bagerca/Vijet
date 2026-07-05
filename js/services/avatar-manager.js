/* ФАЙЛ: js/services/avatar-manager.js */
/* ================= МЕНЕДЖЕР АВАТАРОК (Умный кэш) ================= */
window.AvatarManager = {
    CACHE_KEY: 'uso_avatars_lru',
    MAX_CACHED_USERS: 100, // Храним только 100 последних зрителей

    init: function() {
        // Миграция: очищаем старый "бесконечный" кэш
        if (localStorage.getItem('uso_avatars')) {
            console.log("[AvatarManager] Удаление старой системы кэширования.");
            localStorage.removeItem('uso_avatars');
            localStorage.removeItem('uso_avatars_last_clear');
        }
    },

    get: async function(username, fallbackColor = '#FF4477') {
        const cleanName = username.toLowerCase();
        
        // 1. Проверяем в умном кэше
        const cached = window.AppUtils.LRUCache.get(this.CACHE_KEY, cleanName);
        if (cached) return cached;
        
        // 2. Делаем безопасный API запрос
        try {
            const data = await window.AppUtils.safeFetch(`https://api.ivr.fi/v2/twitch/user?login=${cleanName}`);
            if (data && data.length > 0 && data[0].logo) {
                const avatarUrl = data[0].logo;
                window.AppUtils.LRUCache.set(this.CACHE_KEY, cleanName, avatarUrl, this.MAX_CACHED_USERS);
                return avatarUrl;
            }
            throw new Error("Нет аватарки в API");
        } catch (e) {
            // 3. Фолбэк-заглушка UI-Avatars
            let hexColor = fallbackColor.replace('#', '');
            let fallbackUrl = `https://ui-avatars.com/api/?name=${cleanName}&background=${hexColor}&color=fff&size=64&bold=true`;
            
            // Кэшируем заглушку, чтобы не спамить API ошибками
            window.AppUtils.LRUCache.set(this.CACHE_KEY, cleanName, fallbackUrl, this.MAX_CACHED_USERS);
            return fallbackUrl;
        }
    }
};

window.AvatarManager.init();