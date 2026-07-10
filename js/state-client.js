/* ФАЙЛ: js/state-client.js */
/* ================= ПРИЕМНИК СОСТОЯНИЯ (ДЛЯ СЦЕН OBS) ================= */
window.AppStateClient = {
    fallbackTimer: null,

    init: function() {
        // 1. Слушаем ответ от Ядра
        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => this.restoreVisuals(state));

        // 2. Запрашиваем данные чуть быстрее (чтобы не висеть в невидимости слишком долго)
        setTimeout(() => {
            console.log("🙋‍♂️ [СЦЕНА] Загрузилась! Запрашиваю синхронизацию...");
            window.AppEvents.emit('STATE_SYNC_REQUEST');
        }, 800);

        // 3. Просим данные, если сцена была заморожена и снова стала активной
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                window.AppEvents.emit('STATE_SYNC_REQUEST');
            }
        });

        // ПРЕДОХРАНИТЕЛЬ: Если Ядро мертвое или выключено, мы всё равно должны 
        // показать сцену через 2.5 секунды, чтобы стрим не был черным.
        this.fallbackTimer = setTimeout(() => {
            if (!document.body.classList.contains('is-ready')) {
                console.warn("⚠️ [СЦЕНА] Ядро не ответило! Принудительно показываю визуальную часть.");
                document.body.classList.add('is-ready');
            }
        }, 2500);
    },

    restoreVisuals: function(state) {
        console.log("🛠️ [СЦЕНА] Применяю полученные настройки:", state);

        // Блюр
        if (window.AppBlur) window.AppBlur.toggle(state.blur);

        // Тема
        if (window.SystemManager) window.SystemManager.applyTheme(state.theme);

        // Рамка вебкамеры и Фильтры
        if (window.AppMedia) {
            window.AppMedia.toggleCam(state.cam);
            if (state.camFilter) window.AppEvents.emit('CAM_FILTER_SET', { filter: state.camFilter });
        }

        // Колесо
        if (window.AppWheel) window.AppWheel.toggle(state.wheelVisible);

        // Плашка медиа
        if (window.AppMediaInfo && state.media) {
            window.AppMediaInfo.set(state.media.type, state.media.query, true); // true = без анимации
        }

        // Восстановление YouTube плеера
        if (window.AppPlayer && state.youtube.isPlaying && state.youtube.currentId) {
            const container = document.getElementById('widget-container');
            if (container && container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                
                window.AppPlayer.play({
                    id: state.youtube.currentId,
                    user: "Восстановлено",
                    vol: state.youtube.volume
                });
                
                setTimeout(() => {
                    if (window.AppPlayer.yt && typeof window.AppPlayer.yt.seekTo === 'function') {
                        window.AppPlayer.yt.seekTo(state.youtube.currentTime, true);
                    }
                }, 1000);
            }
        } else if (window.AppPlayer && !state.youtube.isPlaying) {
            window.AppPlayer.hide();
        }

        // МАГИЯ АНТИ-МЕРЦАНИЯ:
        // Как только мы применили все настройки, мы плавно проявляем сцену.
        // Используем requestAnimationFrame, чтобы браузер успел отрисовать изменения.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.add('is-ready');
                clearTimeout(this.fallbackTimer); // Отключаем предохранитель, всё прошло успешно
            });
        });
    }
};

window.AppStateClient.init();