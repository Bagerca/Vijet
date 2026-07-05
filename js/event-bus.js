/* ================= EVENT BUS (ШИНА СОБЫТИЙ С ЛОГАМИ И ЛОКАЛЬНЫМ ЭХО) ================= */
window.StreamBus = new BroadcastChannel('ultimate_overlay_channel');

window.AppEvents = {
    emit: function(eventName, payload = {}) {
        console.log(`%c[BUS 📤] ${eventName}`, 'color: #FF4477; font-weight: bold;', payload);
        
        // 1. Отправляем сигнал в ДРУГИЕ вкладки (index.html)
        window.StreamBus.postMessage({ event: eventName, payload: payload });
        
        // 2. Отправляем сигнал САМИМ СЕБЕ (внутри core.html)
        window.dispatchEvent(new CustomEvent('local_bus', { 
            detail: { event: eventName, payload: payload } 
        }));
    },
    
    listen: function(eventName, callback) {
        // Слушаем другие вкладки
        window.StreamBus.addEventListener('message', (e) => {
            if (e.data.event === eventName) {
                console.log(`%c[BUS 📥] ${eventName}`, 'color: #00E5FF; font-weight: bold;', e.data.payload);
                try { callback(e.data.payload); } catch (err) { console.error(`[BUS ❌] Ошибка:`, err); }
            }
        });

        // Слушаем соседние скрипты внутри этой же вкладки
        window.addEventListener('local_bus', (e) => {
            if (e.detail.event === eventName) {
                console.log(`%c[BUS 🏠 LOCAL] ${eventName}`, 'color: #00FF7F; font-weight: bold;', e.detail.payload);
                try { callback(e.detail.payload); } catch (err) { console.error(`[BUS ❌ LOCAL] Ошибка:`, err); }
            }
        });
    }
};