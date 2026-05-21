/* ================= EVENT BUS (ШИНА СОБЫТИЙ С ЛОГАМИ) ================= */
window.StreamBus = new BroadcastChannel('ultimate_overlay_channel');

window.AppEvents = {
    emit: function(eventName, payload = {}) {
        console.log(`%c[BUS 📤] ${eventName}`, 'color: #FF4477; font-weight: bold;', payload);
        window.StreamBus.postMessage({ event: eventName, payload: payload });
    },
    
    listen: function(eventName, callback) {
        window.StreamBus.addEventListener('message', (e) => {
            if (e.data.event === eventName) {
                console.log(`%c[BUS 📥] ${eventName}`, 'color: #00E5FF; font-weight: bold;', e.data.payload);
                try {
                    callback(e.data.payload);
                } catch (err) {
                    console.error(`[BUS ❌] Ошибка в обработчике события ${eventName}:`, err);
                }
            }
        });
    }
};