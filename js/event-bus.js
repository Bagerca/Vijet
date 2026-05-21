/* ================= EVENT BUS (ШИНА СОБЫТИЙ) ================= */
// Канал связи между Ядром (core.html) и Виджетами (index.html)
window.StreamBus = new BroadcastChannel('ultimate_overlay_channel');

window.AppEvents = {
    // Отправить сообщение в канал
    emit: function(eventName, payload = {}) {
        window.StreamBus.postMessage({ event: eventName, payload: payload });
    },
    
    // Слушать сообщения из канала
    listen: function(eventName, callback) {
        window.StreamBus.addEventListener('message', (e) => {
            if (e.data.event === eventName) {
                callback(e.data.payload);
            }
        });
    }
};