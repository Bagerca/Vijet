/* ================= МЕНЕДЖЕР АВАТАРОВ (INDEXED DB + ЛОКАЛЬНЫЙ SVG) ================= */

window.AvatarManager = {
    memoryCache: {}, // Быстрый доступ в оперативной памяти
    db: null,
    dbReady: false,

    init: async function() {
        // Подписка на очистку кэша
        if (window.AppEvents) {
            window.AppEvents.listen('FORCE_RELOAD_VISUAL', () => this.clearCache());
            window.AppEvents.listen('CORE_REBOOT_START', () => this.clearCache());
        }

        try {
            await this.initDB();
            await this.checkCacheExpiration();
        } catch (e) {
            console.warn("[AvatarManager] Ошибка инициализации БД, работаем только в ОЗУ:", e);
        }
    },

    // 1. Инициализация IndexedDB
    initDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('USOCacheDB', 1);

            request.onerror = (e) => reject(e);
            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.dbReady = true;
                resolve();
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('avatars')) {
                    db.createObjectStore('avatars', { keyPath: 'username' });
                }
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            };
        });
    },

    // 2. Инвалидация кэша раз в неделю (чтобы обновлять аватарки, если юзер их сменил)
    checkCacheExpiration: async function() {
        if (!this.dbReady) return;
        const now = Date.now();
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

        try {
            const tx = this.db.transaction('meta', 'readonly');
            const store = tx.objectStore('meta');
            const req = store.get('last_clear');

            req.onsuccess = () => {
                const lastClear = req.result ? req.result.value : 0;
                if (now - lastClear > ONE_WEEK) {
                    this.clearCache();
                    this.setMeta('last_clear', now);
                }
            };
        } catch (e) { console.warn("[AvatarManager] Сбой проверки времени жизни кэша"); }
    },

    setMeta: function(key, value) {
        if (!this.dbReady) return;
        const tx = this.db.transaction('meta', 'readwrite');
        tx.objectStore('meta').put({ key, value });
    },

    clearCache: function() {
        console.log("[AvatarManager] Глубокая очистка кэша аватаров...");
        this.memoryCache = {};
        if (this.dbReady) {
            const tx = this.db.transaction('avatars', 'readwrite');
            tx.objectStore('avatars').clear();
            this.setMeta('last_clear', Date.now());
        }
    },

    // 3. Локальный генератор SVG (Zero-Network Fallback)
    generateLocalSVG: function(username, hexColor) {
        const cleanColor = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
        const initial = username.charAt(0).toUpperCase();
        
        // Математическая генерация SVG
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
                <rect width="64" height="64" fill="${cleanColor}"/>
                <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" 
                      font-family="Montserrat, sans-serif" font-size="34" font-weight="900" fill="#ffffff">
                    ${initial}
                </text>
            </svg>
        `.replace(/\s+/g, " ").trim();

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    },

    // 4. Главный метод получения аватарки
    get: async function(username, fallbackColor) {
        const lowerName = username.toLowerCase();

        // А) Проверяем ОЗУ
        if (this.memoryCache[lowerName]) return this.memoryCache[lowerName];

        // Б) Проверяем IndexedDB
        if (this.dbReady) {
            try {
                const cachedData = await new Promise((resolve, reject) => {
                    const tx = this.db.transaction('avatars', 'readonly');
                    const req = tx.objectStore('avatars').get(lowerName);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject();
                });
                
                if (cachedData && cachedData.url) {
                    this.memoryCache[lowerName] = cachedData.url;
                    return cachedData.url;
                }
            } catch (e) {}
        }

        // В) Сетевой запрос к API
        let finalUrl = null;
        try {
            // Добавляем AbortController на случай зависания API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // Таймут 3 сек

            const response = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${lowerName}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            if (data && data.length > 0 && data[0].logo) {
                finalUrl = data[0].logo;
            } else {
                throw new Error("Аватар не найден в API");
            }
        } catch (e) {
            // Г) Полный отказ сети -> генерируем SVG локально!
            finalUrl = this.generateLocalSVG(username, fallbackColor || '#FF4477');
        }

        // Сохраняем результат в ОЗУ и БД
        this.memoryCache[lowerName] = finalUrl;
        if (this.dbReady) {
            const tx = this.db.transaction('avatars', 'readwrite');
            tx.objectStore('avatars').put({ username: lowerName, url: finalUrl });
        }

        return finalUrl;
    }
};

window.AvatarManager.init();