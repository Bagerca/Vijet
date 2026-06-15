window.AppEmotes = {
    container: document.getElementById('emotes-container'),
    mode: "bubble",
    enabled: true,
    activeEmotesCount: 0, // Счетчик активных элементов на экране

    init: function() {
        if (window.AppConfig.emotesMode) this.mode = window.AppConfig.emotesMode;
        if (window.AppConfig.emotesEnabled !== undefined) this.enabled = window.AppConfig.emotesEnabled;

        // Подписка на события
        window.AppEvents.listen('EMOTES_SPAWN', d => this.spawn(d));
        window.AppEvents.listen('EMOTES_CMD', d => { 
            if(d.cmd==='a' || d.cmd==='bubble') this.setMode('bubble');
            else if(d.cmd==='b' || d.cmd==='fountain') this.setMode('fountain');
            else if(d.cmd==='off') this.toggle(false); 
            else if(d.cmd==='on') this.toggle(true);
        });
    },

    setMode: function(newMode) {
        if (newMode === "bubble" || newMode === "fountain") {
            this.mode = newMode;
            console.log(`[Emotes] Режим изменен на: ${newMode}`);
        }
    },

    toggle: function(state) {
        this.enabled = state !== undefined ? state : !this.enabled;
    },

    spawn: function(emotesData) {
        if (!this.enabled || !emotesData || !this.container) return;

        let emoteIds = Object.keys(emotesData);
        if (emoteIds.length === 0) return;

        // Настройки оптимизации производительности рендеринга
        const MAX_CONCURRENT_EMOTES = 60; // Максимальный лимит элементов на экране
        const MAX_PER_EMOTE_TYPE = 8;    // Лимит дубликатов одного смайла на сообщение

        let delayIndex = 0;

        for (let id of emoteIds) {
            let count = emotesData[id].length; 
            let allowedCount = Math.min(count, MAX_PER_EMOTE_TYPE);

            for (let i = 0; i < allowedCount; i++) {
                if (this.activeEmotesCount >= MAX_CONCURRENT_EMOTES) {
                    break; // Прерываем создание элементов при превышении лимита
                }
                this.createEmoteDOM(id, delayIndex);
                this.activeEmotesCount++;
                delayIndex++;
            }
            if (this.activeEmotesCount >= MAX_CONCURRENT_EMOTES) break;
        }
    },

    createEmoteDOM: function(id, delayIndex) {
        const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`;
        const wrap = document.createElement('div');
        const img = document.createElement('img');
        img.src = emoteUrl;

        const staggerDelay = delayIndex * (0.05 + Math.random() * 0.03); 
        
        if (this.mode === 'bubble') {
            wrap.className = 'emote-bubble';
            const size = Math.random(); 
            const scale = 0.5 + size * 1.5; 
            const duration = 5 + (1 - size) * 5; 
            
            let blur = '0px';
            if (size > 0.85) blur = `${(size - 0.8) * 20}px`; 
            else if (size < 0.2) blur = '2px'; 
            
            const xPos = 5 + Math.random() * 90; 
            const swayDir = Math.random() > 0.5 ? 1 : -1; 
            
            wrap.style.left = `${xPos}%`;
            wrap.style.animationDelay = `${staggerDelay}s`;
            wrap.style.setProperty('--e-dur', `${duration}s`);
            
            img.style.setProperty('--e-blur', blur);
            img.style.setProperty('--e-scale', scale);
            img.style.setProperty('--e-dir', swayDir);
            wrap.appendChild(img);
        } 
        else if (this.mode === 'fountain') {
            wrap.className = 'emote-fountain-x';
            img.className = 'emote-fountain-y';
            
            const dir = Math.random() > 0.5 ? 1 : -1;
            const distanceX = (100 + Math.random() * 600) * dir; 
            const peakY = -300 - Math.random() * 600; 
            const rot = (Math.random() * 720 - 360); 
            const scale = 0.7 + Math.random() * 1.2; 
            
            const startOffsetX = (Math.random() - 0.5) * 100;
            wrap.style.left = `calc(50% + ${startOffsetX}px)`;
            wrap.style.animationDelay = `${staggerDelay}s`;
            img.style.animationDelay = `${staggerDelay}s`;
            
            wrap.style.setProperty('--f-x', `${distanceX}px`);
            img.style.setProperty('--f-y', `${peakY}px`);
            img.style.setProperty('--f-rot', `${rot}deg`);
            img.style.setProperty('--f-scale', scale);
            wrap.appendChild(img);
        }

        this.container.appendChild(wrap);
        
        wrap.addEventListener('animationend', (e) => {
            if (e.target === wrap) {
                wrap.remove();
                // Уменьшаем счетчик активных элементов на экране
                this.activeEmotesCount = Math.max(0, this.activeEmotesCount - 1);
            }
        });
    }
};

setTimeout(() => window.AppEmotes.init(), 1000);