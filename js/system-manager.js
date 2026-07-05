/* ФАЙЛ: js/system-manager.js */
/* ================= МЕНЕДЖЕР СИСТЕМЫ И ВИДЖЕТОВ ================= */
window.SystemManager = {
    widgetMap: { 
        'chat': 'chat-container', 'music': 'widget-container', 'socials': 'social-rotator', 
        'alerts': 'alert-container', 'shoutout': 'shoutout-container', 'goal': 'goal-container', 
        'ticker': 'ticker-container', 'deaths': 'deaths-container', 'particles': 'particles-canvas', 
        'emotes': 'emotes-container', 'tts': 'tts-container', 'blur': 'screen-blur-overlay', 
        'wheel': 'wheel-overlay', 'cam': 'webcam-frame', 'media': 'media-info-container', 'pet': 'pet-container',
        'gameinfo': 'media-info-container'
    },

    init: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const activeWidgetsParam = urlParams.get('widgets'); 
        const sceneParam = urlParams.get('scene');

        if (sceneParam) document.body.classList.add(`scene-${sceneParam}`);

        if (sceneParam === 'starting' || sceneParam === 'ending') {
            const ytPlayer = document.getElementById('yt-player'); if (ytPlayer) ytPlayer.remove(); 
            const widgetContainer = document.getElementById('widget-container'); if (widgetContainer) widgetContainer.remove();
        }

        // Отключение CSS скрытых виджетов
        if (activeWidgetsParam) {
            document.body.style.setProperty('background', 'transparent', 'important');
            document.documentElement.style.setProperty('background', 'transparent', 'important');
            const activeWidgets = activeWidgetsParam.split(',').map(w => w.trim());

            for (const [key, id] of Object.entries(this.widgetMap)) {
                if (!activeWidgets.includes(key)) {
                    const el = document.getElementById(id);
                    if (el) el.style.setProperty('display', 'none', 'important');
                }
            }
            if (!activeWidgets.includes('cam') && !activeWidgets.includes('pet')) {
                const camCont = document.getElementById('webcam-container');
                if (camCont) camCont.style.setProperty('display', 'none', 'important');
            }
            // Background js logic is now handled strictly by index.html script loader
        }

        this.bindEvents();
        this.applyTheme(localStorage.getItem('uso_current_theme') || 'default');
    },

    bindEvents: function() {
        window.AppEvents.listen('FORCE_RELOAD_VISUAL', () => this.triggerRefreshUI());
        window.AppEvents.listen('CORE_REBOOT_START', () => this.triggerCoreRefreshUI('start'));
        window.AppEvents.listen('CORE_REBOOT_DONE', () => this.triggerCoreRefreshUI('done'));
        
        window.AppEvents.listen('WIDGET_TOGGLE', (data) => {
            const elId = this.widgetMap[data.widget];
            if (elId) {
                const el = document.getElementById(elId);
                if (el) {
                    if (data.state === 'off' || data.state === 'hide') el.style.setProperty('display', 'none', 'important');
                    else if (data.state === 'on' || data.state === 'show') {
                        el.style.removeProperty('display');
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