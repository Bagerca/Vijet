/* ФАЙЛ: js/event-bus.js */
/* ================= EVENT BUS (С ОТКЛЮЧАЕМЫМ ГЛУБИННЫМ ЛОГИРОВАНИЕМ) ================= */
window.StreamBus = new BroadcastChannel('ultimate_overlay_channel');

window.AppEvents = {
    // Читаем статус дебага из памяти браузера
    isDebug: localStorage.getItem('uso_debug_mode') === 'true',

    init: function() {
        // Слушаем изменение дебаг-режима "на лету"
        this.listen('DEBUG_MODE_TOGGLE', d => {
            this.isDebug = d.state;
            localStorage.setItem('uso_debug_mode', d.state);
            if (this.isDebug) console.log("%c[DEBUG] Глубинный мониторинг ВКЛЮЧЕН", "color: #00FF7F; font-size: 14px; font-weight: bold;");
        });
    },

    emit: function(eventName, payload = {}) {
        if (this.isDebug) {
            console.log(`%c[BUS 📤] ${eventName}`, 'color: #FF4477; font-weight: bold;', payload);
        }
        
        window.StreamBus.postMessage({ event: eventName, payload: payload });
        
        window.dispatchEvent(new CustomEvent('local_bus', { 
            detail: { event: eventName, payload: payload } 
        }));
    },
    
    listen: function(eventName, callback) {
        window.StreamBus.addEventListener('message', (e) => {
            if (e.data.event === eventName) {
                if (this.isDebug) console.log(`%c[BUS 📥] ${eventName}`, 'color: #00E5FF; font-weight: bold;', e.data.payload);
                try { callback(e.data.payload); } catch (err) { console.error(`[BUS ❌] Ошибка:`, err); }
            }
        });

        window.addEventListener('local_bus', (e) => {
            if (e.detail.event === eventName) {
                if (this.isDebug) console.log(`%c[BUS 🏠 LOCAL] ${eventName}`, 'color: #00FF7F; font-weight: bold;', e.detail.payload);
                try { callback(e.detail.payload); } catch (err) { console.error(`[BUS ❌ LOCAL] Ошибка:`, err); }
            }
        });
    }
};

window.AppEvents.init();