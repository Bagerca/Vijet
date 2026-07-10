/* ФАЙЛ: js/event-bus.js */
/* ================= EVENT BUS (WEBSOCKETS EDITION) ================= */
// Теперь связь работает через интернет/локальную сеть без задержек

window.AppEvents = {
    isDebug: localStorage.getItem('uso_debug_mode') === 'true',
    socket: null,

    init: function() {
        // Подключаем WebSockets, если скрипт io загружен
        if (typeof io !== 'undefined') {
            // Подключаемся к тому же хосту, откуда загружена страница
            this.socket = io({ transports: ['websocket', 'polling'] });
            
            // Слушаем входящие события из космоса (от других окон/OBS/ModDeck)
            this.socket.on('uso_event', (data) => {
                if (this.isDebug) console.log(`%c[SOCKET 📥] ${data.event}`, 'color: #00E5FF; font-weight: bold;', data.payload);
                
                // Ретранслируем в локальный DOM, чтобы наши скрипты (core.js, queue.js и др.) их поймали
                window.dispatchEvent(new CustomEvent(`uso_${data.event}`, { detail: data.payload }));
            });
        } else {
            console.warn("[BUS ⚠️] Socket.io не найден! Связь между окнами работать не будет.");
        }

        // Локальное переключение логов
        this.listen('DEBUG_MODE_TOGGLE', d => {
            this.isDebug = d.state;
            localStorage.setItem('uso_debug_mode', d.state);
            if (this.isDebug) console.log("%c[DEBUG] Глубинный мониторинг ВКЛЮЧЕН", "color: #00FF7F; font-weight: bold;");
        });
    },

    emit: function(eventName, payload = {}) {
        if (this.isDebug) {
            console.log(`%c[BUS 📤] ${eventName}`, 'color: #FF4477; font-weight: bold;', payload);
        }
        
        // 1. Отправляем сигнал на Сервер, чтобы он раздал его всем остальным
        if (this.socket) {
            this.socket.emit('uso_event', { event: eventName, payload: payload });
        }
        
        // 2. Вызываем локально (для модулей, которые живут в этом же окне)
        window.dispatchEvent(new CustomEvent(`uso_${eventName}`, { detail: payload }));
    },
    
    listen: function(eventName, callback) {
        window.addEventListener(`uso_${eventName}`, (e) => {
            try { callback(e.detail); } catch (err) { console.error(`[BUS ❌] Ошибка в обработчике ${eventName}:`, err); }
        });
    }
};

window.AppEvents.init();