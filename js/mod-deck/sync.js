/* ================= СИНХРОНИЗАЦИЯ ПАНЕЛИ С ЯДРОМ ================= */
window.DeckSync = {
    init() {
        // Ловим ответ от ядра
        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => this.updateUI(state));

        // Запрашиваем состояние при старте
        setTimeout(() => {
            window.AppEvents.emit('STATE_SYNC_REQUEST');
        }, 2000);

        // И при выходе из спящего режима телефона/браузера
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                window.AppEvents.emit('STATE_SYNC_REQUEST');
            }
        });
    },

    updateUI(state) {
        console.log("🛠️ [MOD DECK] Синхронизация интерфейса с Ядром", state);

        const setToggle = (id, isActive) => {
            const toggle = document.querySelector(`.widget-toggle[data-widget="${id}"]`);
            if (toggle && toggle.checked !== isActive) {
                toggle.checked = isActive;
            }
        };

        // Тумблеры
        setToggle('blur', state.blur);
        setToggle('cam', state.cam);
        
        // Громкость
        const volSlider = document.getElementById('input-vol');
        const volLabel = document.getElementById('vol-label');
        if (volSlider && volSlider.value != state.youtube.volume) {
            volSlider.value = state.youtube.volume;
            volSlider.style.setProperty('--slider-fill', state.youtube.volume + '%');
            if (volLabel) volLabel.innerText = state.youtube.volume + '%';
        }

        // Селект темы
        const themeSelect = document.getElementById('custom-theme-select');
        if (themeSelect && themeSelect.getAttribute('data-value') !== state.theme) {
            themeSelect.setAttribute('data-value', state.theme);
            const selectedVisual = themeSelect.querySelector('.select-selected');
            const options = themeSelect.querySelectorAll('.select-items div');
            options.forEach(opt => {
                if (opt.getAttribute('data-value') === state.theme && selectedVisual) {
                    selectedVisual.innerHTML = opt.innerHTML;
                }
            });
        }
    }
};

// Вызываем в app.js
// В файле js/mod-deck/app.js добавь строку: window.DeckSync.init();