/* ФАЙЛ: js/state-core.js */
/* ================= ХРАНИТЕЛЬ СОСТОЯНИЯ (ТОЛЬКО ДЛЯ CORE) ================= */
window.AppStateCore = {
    state: {
        theme: 'default', blur: false, cam: true, deaths: 0, wheelVisible: false,
        media: { type: 'off', query: null },
        youtube: { isPlaying: false, currentId: null, currentTime: 0, volume: 30, currentUser: null },
        // НОВОЕ: Реестр состояний для ВСЕХ виджетов (Мастер Виджетов)
        widgets: {} 
    },
    saveTimeout: null, // Таймер для Debounce

    init: function() {
        this.loadFromStorage();

        // Слушаем ИЗМЕНЕНИЯ БАЗОВЫХ СУЩНОСТЕЙ
        window.AppEvents.listen('BLUR_TOGGLE', d => { 
            if (d.state === 'on') this.state.blur = true;
            else if (d.state === 'off') this.state.blur = false;
            else this.state.blur = !this.state.blur; 
            this.save(); 
        });
        
        window.AppEvents.listen('MEDIA_CAM', d => { this.state.cam = d.state === 'on'; this.save(); });
        window.AppEvents.listen('THEME_CHANGE', d => { this.state.theme = d.theme; this.save(); });
        window.AppEvents.listen('WHEEL_TOGGLE', d => { this.state.wheelVisible = d.state; this.save(); });
        window.AppEvents.listen('MEDIA_SET', d => { this.state.media = { type: d.type, query: d.query }; this.save(); });
        
        // НОВОЕ: Ловим скрытие/показ любых других виджетов
        window.AppEvents.listen('WIDGET_TOGGLE', d => {
            this.state.widgets[d.widget] = (d.state === 'on' || d.state === 'show');
            this.save();
        });
        
        // Музыка
        window.AppEvents.listen('YT_VISUAL_PLAY', d => { 
            this.state.youtube.currentId = d.id; 
            this.state.youtube.isPlaying = true; 
            this.state.youtube.volume = d.vol; 
            this.state.youtube.currentUser = d.user; 
            this.save(); 
        });
        
        window.AppEvents.listen('YT_VISUAL_HIDE', () => { 
            this.state.youtube.isPlaying = false; 
            this.state.youtube.currentId = null;
            this.state.youtube.currentUser = null;
            this.save(); 
        });
        
        window.AppEvents.listen('YT_VISUAL_STATE', d => { this.state.youtube.isPlaying = d.state === 'playing'; this.save(); });
        window.AppEvents.listen('YT_VISUAL_VOL', d => { this.state.youtube.volume = d.vol; this.save(); });
        window.AppEvents.listen('YT_VISUAL_PROGRESS', d => { this.state.youtube.currentTime = d.currentTime; });

        window.AppEvents.listen('STATE_SYNC_REQUEST', () => {
            this.state.deaths = parseInt(localStorage.getItem('uso_deaths') || 0);
            window.AppEvents.emit('STATE_SYNC_RESPONSE', this.state);
        });
    },

    save: function() {
        // Мгновенная рассылка по сети (для отклика UI в Mod Deck и OBS)
        window.AppEvents.emit('STATE_SYNC_RESPONSE', this.state);

        // Отложенная запись на диск (Debounce 1 sec)
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            localStorage.setItem('uso_global_state', JSON.stringify(this.state));
        }, 1000);
    },

    loadFromStorage: function() {
        try {
            const saved = localStorage.getItem('uso_global_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                // Убеждаемся что объект виджетов существует
                if (!this.state.widgets) this.state.widgets = {};
            }
        } catch (e) {}
    }
};

setTimeout(() => window.AppStateCore.init(), 1000);