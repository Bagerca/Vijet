/* ФАЙЛ: js/utils.js */
/* ================= БАЗОВЫЕ УТИЛИТЫ СИСТЕМЫ ================= */
window.AppUtils = {
    /**
     * Безопасный перезапуск CSS-анимации без Layout Thrashing (микро-фризов OBS)
     */
    restartAnimation: function(element, className) {
        if (!element) return;
        element.classList.remove(className);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.classList.add(className);
            });
        });
    },

    /**
     * Безопасный Fetch с умной задержкой.
     */
    safeFetch: async function(url, options = {}, maxRetries = 2) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP Ошибка: ${response.status}`);
                return await response.json();
            } catch (err) {
                if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
                    console.warn(`[AppUtils] Доступ к ${url} заблокирован сетью/провайдером.`);
                    throw err; 
                }
                if (i === maxRetries - 1) {
                    console.error(`[AppUtils] Ошибка запроса к ${url} после ${maxRetries} попыток.`, err);
                    throw err; 
                }
                await new Promise(res => setTimeout(res, 500));
            }
        }
    },

    /**
     * LRU (Least Recently Used) Cache для LocalStorage.
     */
    LRUCache: {
        get: function(cacheKey, itemKey) {
            try {
                const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                if (cache[itemKey]) {
                    cache[itemKey].ts = Date.now(); 
                    localStorage.setItem(cacheKey, JSON.stringify(cache));
                    return cache[itemKey].value;
                }
            } catch(e) { }
            return null;
        },
        
        set: function(cacheKey, itemKey, value, maxItems = 100) {
            try {
                const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                cache[itemKey] = { value: value, ts: Date.now() };
                
                const keys = Object.keys(cache);
                if (keys.length > maxItems) {
                    keys.sort((a, b) => cache[a].ts - cache[b].ts);
                    const itemsToRemove = keys.length - maxItems;
                    for (let i = 0; i < itemsToRemove; i++) delete cache[keys[i]];
                }
                localStorage.setItem(cacheKey, JSON.stringify(cache));
            } catch(e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    localStorage.removeItem(cacheKey); 
                }
            }
        }
    }
};