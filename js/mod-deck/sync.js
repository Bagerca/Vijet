/* ФАЙЛ: js/mod-deck/sync.js */
/* ================= СИНХРОНИЗАЦИЯ ПАНЕЛИ С ЯДРОМ ================= */
window.DeckSync = {
    init() {
        // Ловим ответ от ядра
        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => this.updateUI(state));

        // Запрашиваем состояние при старте
        setTimeout(() => {
            window.AppEvents.emit('STATE_SYNC_REQUEST');
        }, 1500);

        // И при выходе из спящего режима телефона/браузера
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                window.AppEvents.emit('STATE_SYNC_REQUEST');
            }
        });
    },

    updateUI(state) {
        const setToggle = (id, isActive) => {
            const toggle = document.querySelector(`.widget-toggle[data-widget="${id}"]`);
            if (toggle && toggle.checked !== isActive) {
                toggle.checked = isActive;
            }
        };

        // 1. Уникальные Тумблеры (Имеют собственный стейт в Ядре)
        setToggle('blur', state.blur);
        setToggle('cam', state.cam);
        setToggle('deaths', state.deaths > 0);
        
        // Синхронизируем тумблер Колеса Фортуны
        const wheelBtnShow = document.querySelector('[data-cmd="!wheel show"]');
        if (wheelBtnShow) {
            if (state.wheelVisible) wheelBtnShow.style.boxShadow = 'inset 0 0 10px var(--c-green)';
            else wheelBtnShow.style.boxShadow = 'none';
        }

        // 2. ДИНАМИЧЕСКИЙ МАСТЕР ВИДЖЕТОВ
        if (state.widgets) {
            // ИСПРАВЛЕНИЕ: Игнорируем уникальные тумблеры, даже если они ошибочно попали в память как виджеты
            const ignoreList = ['blur', 'cam', 'deaths']; 
            
            for (const [widgetId, isVisible] of Object.entries(state.widgets)) {
                if (!ignoreList.includes(widgetId)) {
                    setToggle(widgetId, isVisible);
                }
            }
        }
        
        // 3. Громкость музыки
        const volSlider = document.getElementById('input-vol');
        const volLabel = document.getElementById('vol-label');
        if (volSlider && volSlider.value != state.youtube.volume) {
            volSlider.value = state.youtube.volume;
            volSlider.style.setProperty('--slider-fill', state.youtube.volume + '%');
            if (volLabel) volLabel.innerText = state.youtube.volume + '%';
        }

        // 4. Селект Темы
        if (window.DeckUI && state.theme) {
            window.DeckUI.setSelectValue('custom-theme-select', state.theme);
        }

        // 5. Плашка Медиа (Игры и YouTube)
        if (state.media && window.DeckUI) {
            const ytInput = document.getElementById('input-media-yt');
            
            if (state.media.type === 'game' || state.media.type === 'series') {
                window.DeckUI.setSelectValue('custom-game-select', state.media.query);
                if (ytInput) ytInput.value = ''; 
            } 
            else if (state.media.type === 'yt') {
                window.DeckUI.setSelectValue('custom-game-select', 'off'); 
                if (ytInput) ytInput.value = `https://youtube.com/watch?v=${state.media.query}`;
            } 
            else { 
                window.DeckUI.setSelectValue('custom-game-select', 'off');
                if (ytInput) ytInput.value = '';
            }
        }
    }
};