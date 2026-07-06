/* ФАЙЛ: js/state-client.js */
/* ================= ПРИЕМНИК СОСТОЯНИЯ (ДЛЯ СЦЕН OBS) ================= */
window.AppStateClient = {
    init: function() {
        // 1. Слушаем ответ от Ядра
        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => this.restoreVisuals(state));

        // 2. Как только сцена загрузилась — просим данные
        setTimeout(() => {
            console.log("🙋‍♂️ [СЦЕНА] Загрузилась! Запрашиваю синхронизацию...");
            window.AppEvents.emit('STATE_SYNC_REQUEST');
        }, 1500);

        // 3. Просим данные, если сцена была заморожена и снова стала активной
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                window.AppEvents.emit('STATE_SYNC_REQUEST');
            }
        });
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
    }
};

window.AppStateClient.init();