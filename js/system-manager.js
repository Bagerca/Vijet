/* ФАЙЛ: js/system-manager.js */
/* ================= МЕНЕДЖЕР СИСТЕМЫ И ВИДЖЕТОВ (DOM DESTRUCTION) ================= */
window.SystemManager = {
    // Карта: ключ (из URL) -> ID элемента в DOM
    widgetMap: { 
        'chat': 'chat-container', 
        'music': 'widget-container', 
        'socials': 'social-rotator', 
        'alerts': 'alert-container', 
        'shoutout': 'shoutout-container', 
        'goal': 'goal-container', 
        'ticker': 'ticker-container', 
        'deaths': 'deaths-container', 
        'particles': 'particles-canvas', 
        'emotes': 'emotes-container', 
        'tts': 'tts-container', 
        'blur': 'screen-blur-overlay', 
        'wheel': 'wheel-overlay', 
        'cam': 'webcam-frame', // Управляем только рамкой, контейнер общий с петом
        'media': 'media-info-container', 
        'pet': 'pet-container',
        'gameinfo': 'media-info-container' // Алиас для совместимости
    },

    init: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const activeWidgetsParam = urlParams.get('widgets'); 
        const sceneParam = urlParams.get('scene');

        // 1. Устанавливаем сцену в body для базовых CSS стилей
        if (sceneParam) document.body.classList.add(`scene-${sceneParam}`);

        // 2. ЖЕСТКАЯ ЗАЧИСТКА ДОМА ДЛЯ СЦЕН (Без CSS-костылей)
        // На сценах старта и конца удаляем всё, что может мешать
        if (sceneParam === 'starting' || sceneParam === 'ending') {
            const removeIds = [
                'chat-container', 'webcam-container', 'widget-container', 
                'deaths-container', 'alert-container', 'media-info-container', 
                'pet-container', 'emotes-container', 'tts-container'
            ];
            removeIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
        }

        // 3. ИЗОЛИРОВАННЫЙ РЕЖИМ ВИДЖЕТОВ (Разделение по ссылкам в OBS)
        if (activeWidgetsParam) {
            // Делаем фон прозрачным для оверлеев
            document.body.style.setProperty('background', 'transparent', 'important');
            document.documentElement.style.setProperty('background', 'transparent', 'important');
            
            const activeWidgets = activeWidgetsParam.split(',').map(w => w.trim().toLowerCase());
            
            // Собираем Set уникальных ID элементов, которые ДОЛЖНЫ остаться
            const allowedIds = new Set();
            activeWidgets.forEach(w => {
                if (this.widgetMap[w]) allowedIds.add(this.widgetMap[w]);
            });

            // Перебираем все известные виджеты
            for (const [key, id] of Object.entries(this.widgetMap)) {
                // Если элемент НЕ в списке разрешенных - УДАЛЯЕМ ЕГО ФИЗИЧЕСКИ ИЗ HTML
                if (!allowedIds.has(id)) {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                }
            }

            // Специфичная логика для контейнера вебки (он хранит и рамку, и питомца)
            const camFrame = document.getElementById('webcam-frame');
            const petCont = document.getElementById('pet-container');
            if (!camFrame && !petCont) {
                const mainCamCont = document.getElementById('webcam-container');
                if (mainCamCont) mainCamCont.remove();
            }
        }

        this.bindEvents();
        this.applyTheme(localStorage.getItem('uso_current_theme') || 'default');
    },

    bindEvents: function() {
        window.AppEvents.listen('FORCE_RELOAD_VISUAL', () => this.triggerRefreshUI());
        window.AppEvents.listen('CORE_REBOOT_START', () => this.triggerCoreRefreshUI('start'));
        window.AppEvents.listen('CORE_REBOOT_DONE', () => this.triggerCoreRefreshUI('done'));
        
        // Ручное переключение через команды чата (!widget chat off)
        window.AppEvents.listen('WIDGET_TOGGLE', (data) => {
            const elId = this.widgetMap[data.widget];
            if (elId) {
                const el = document.getElementById(elId);
                if (el) {
                    if (data.state === 'off' || data.state === 'hide') {
                        el.style.setProperty('display', 'none', 'important');
                    } else if (data.state === 'on' || data.state === 'show') {
                        el.style.removeProperty('display');
                        // Специфика чата
                        if (elId === 'chat-container') el.style.setProperty('display', 'flex', 'important');
                    }
                }
            }
        });

        window.AppEvents.listen('THEME_CHANGE', (data) => this.applyTheme(data.theme));
    },

    applyTheme: function(themeName) {
        document.body.classList.remove('theme-circus', 'theme-noir'); 
        if (themeName && themeName !== 'default') document.body.classList.add(`theme-${themeName}`);
        localStorage.setItem('uso_current_theme', themeName || 'default');
    },

    triggerRefreshUI: function() {
        const scene = document.getElementById('scene-wrapper');
        if (scene) { scene.style.transition = "filter 0.4s ease, opacity 0.4s ease"; scene.style.filter = "blur(8px)"; scene.style.opacity = "0.7"; }
        setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.set('nocache', Date.now());
            window.location.href = url.toString();
        }, 1000); 
    },

    triggerCoreRefreshUI: function(state) {
        let loader = document.getElementById('uso-core-loader');
        if (state === 'start') {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'uso-core-loader';
                loader.style.cssText = `position: fixed; bottom: 40px; right: 40px; z-index: 999999; display: flex; align-items: center; gap: 12px; padding: 12px 24px; background: rgba(20, 20, 25, 0.95); border: 1px solid rgba(255, 68, 119, 0.5); border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color: #fff;`;
                loader.innerHTML = `<span style="font-size: 13px; font-weight: 800;">Перезагрузка ядра...</span>`;
                document.body.appendChild(loader);
            }
        } else if (state === 'done') {
            if (loader) loader.remove();
        }
    }
};
window.SystemManager.init();