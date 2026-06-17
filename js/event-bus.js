/* ================= EVENT BUS 3.0 (Синхронная Шина с отпиской) ================= */
window.StreamBus = new BroadcastChannel('ultimate_overlay_channel');

window.AppEvents = {
    _history: [], 
    _listeners: {}, // Храним ссылки на функции-обработчики

    emit: function(eventName, payload = {}) {
        this._history.push({ time: Date.now(), event: eventName, payload });
        if (this._history.length > 50) this._history.shift();

        console.log(`%c[BUS 📤] ${eventName}`, 'color: #FF4477; font-weight: bold;', payload);
        
        // Отправляем в другие вкладки
        window.StreamBus.postMessage({ event: eventName, payload: payload });
        
        // Отправляем локально
        window.dispatchEvent(new CustomEvent('local_bus', { 
            detail: { event: eventName, payload: payload } 
        }));
    },
    
    listen: function(eventName, callback) {
        if (!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }

        // Внешний обработчик (BroadcastChannel)
        const extHandler = (e) => {
            if (e.data.event === eventName) {
                try { callback(e.data.payload); } 
                catch (err) { console.error(`[BUS ❌ EXT] Ошибка в ${eventName}:`, err); }
            }
        };

        // Локальный обработчик (CustomEvent)
        const locHandler = (e) => {
            if (e.detail.event === eventName) {
                try { callback(e.detail.payload); } 
                catch (err) { console.error(`[BUS ❌ LOC] Ошибка в ${eventName}:`, err); }
            }
        };

        // Сохраняем ссылки для возможности отписки
        this._listeners[eventName].push({ 
            originalCb: callback, 
            extHandler: extHandler, 
            locHandler: locHandler 
        });

        window.StreamBus.addEventListener('message', extHandler);
        window.addEventListener('local_bus', locHandler);
    },

    unlisten: function(eventName, callback) {
        if (!this._listeners[eventName]) return;

        this._listeners[eventName] = this._listeners[eventName].filter(listener => {
            if (listener.originalCb === callback) {
                // Удаляем слушателей из браузера
                window.StreamBus.removeEventListener('message', listener.extHandler);
                window.removeEventListener('local_bus', listener.locHandler);
                return false; // Удаляем из массива
            }
            return true;
        });
    }
};