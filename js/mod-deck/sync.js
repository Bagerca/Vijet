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

        // 1. Уникальные Тумблеры
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
            // Игнор-лист для защиты от старых фантомных записей
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

        // 3.5 Синхронизация ползунков частиц (Созвездия)
        if (state.particles) {
            const updateSlider = (id, valId, val, suffix, isFloat = false) => {
                const el = document.getElementById(id);
                const valEl = document.getElementById(valId);
                if (!el || !valEl) return;
                
                const min = el.min;
                const max = el.max;
                const percent = ((val - min) / (max - min)) * 100;
                
                el.value = val;
                el.style.setProperty('--slider-fill', `${percent}%`);
                valEl.innerText = isFloat ? (val / 10).toFixed(1) + suffix : val + suffix;
            };

            updateSlider('part-count', 'part-count-val', state.particles.count, '');
            updateSlider('part-dist', 'part-dist-val', state.particles.distance, 'px');
            updateSlider('part-speed', 'part-speed-val', state.particles.speed * 10, 'x', true);
            
            if (window.DeckUI) {
                window.DeckUI.setSelectValue('part-color', state.particles.color);
            }
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