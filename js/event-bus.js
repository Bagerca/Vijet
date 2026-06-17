/* ================= EVENT BUS 2.0 (Синхронная Шина с подтверждениями) ================= */
window.StreamBus = new BroadcastChannel('ultimate_overlay_channel');

window.AppEvents = {
    _history: [], // Храним историю для дебага

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
        // Слушаем внешние вкладки
        window.StreamBus.addEventListener('message', (e) => {
            if (e.data.event === eventName) {
                try { callback(e.data.payload); } 
                catch (err) { console.error(`[BUS ❌ EXT] Ошибка в ${eventName}:`, err); }
            }
        });

        // Слушаем локально
        window.addEventListener('local_bus', (e) => {
            if (e.detail.event === eventName) {
                try { callback(e.detail.payload); } 
                catch (err) { console.error(`[BUS ❌ LOC] Ошибка в ${eventName}:`, err); }
            }
        });
    }
};