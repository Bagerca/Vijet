window.AppEmotes = {
    container: document.getElementById('emotes-container'),
    mode: "bubble", // по умолчанию
    enabled: true,

    init: function() {
        if (window.AppConfig.emotesMode) this.mode = window.AppConfig.emotesMode;
        if (window.AppConfig.emotesEnabled !== undefined) this.enabled = window.AppConfig.emotesEnabled;
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

        // ПИТОМЕЦ РАДУЕТСЯ, КОГДА СПАМЯТ СМАЙЛЫ В ЧАТ
        if (window.AppPet) window.AppPet.setEmotion('hype', 3000);

        let emoteIds = Object.keys(emotesData);
        if (emoteIds.length === 0) return;

        let maxSpawn = window.AppConfig.emotesMaxPerMessage || 100;
        let spawned = 0;
        let delayIndex = 0; // Индекс для создания красивой очереди вылета

        for (let id of emoteIds) {
            let count = emotesData[id].length; 
            for (let i = 0; i < count; i++) {
                if (spawned >= maxSpawn) break;
                
                this.createEmoteDOM(id, delayIndex);
                
                spawned++;
                delayIndex++;
            }
            if (spawned >= maxSpawn) break;
        }
    },

    createEmoteDOM: function(id, delayIndex) {
        const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`;
        const wrap = document.createElement('div');
        const img = document.createElement('img');
        img.src = emoteUrl;

        // Микро-задержка (0.05 сек), чтобы смайлы летели друг за другом, а не кучей
        const staggerDelay = delayIndex * (0.05 + Math.random() * 0.03); 
        
        // РЕЖИМ А: ПУЗЫРИ (Bubble)
        if (this.mode === 'bubble') {
            wrap.className = 'emote-bubble';
            
            const size = Math.random(); // 0..1
            const scale = 0.5 + size * 1.5; // от 0.5 до 2.0
            const duration = 5 + (1 - size) * 5; // Маленькие летят медленнее (до 10с), большие быстрее (до 5с)
            
            // Эффект глубины резкости (Camera Focus)
            let blur = '0px';
            if (size > 0.85) blur = `${(size - 0.8) * 20}px`; // Сильно крупные размыты
            else if (size < 0.2) blur = '2px'; // Очень мелкие на фоне чуть размыты
            
            const xPos = 5 + Math.random() * 90; // Позиция по горизонтали (5% - 95%)
            const swayDir = Math.random() > 0.5 ? 1 : -1; // В какую сторону качнется сначала
            
            wrap.style.left = `${xPos}%`;
            wrap.style.animationDelay = `${staggerDelay}s`;
            wrap.style.setProperty('--e-dur', `${duration}s`);
            
            img.style.setProperty('--e-blur', blur);
            img.style.setProperty('--e-scale', scale);
            img.style.setProperty('--e-dir', swayDir);
            
            wrap.appendChild(img);
        } 
        
        // РЕЖИМ Б: ФОНТАН (Fountain)
        else if (this.mode === 'fountain') {
            wrap.className = 'emote-fountain-x';
            img.className = 'emote-fountain-y';
            
            const dir = Math.random() > 0.5 ? 1 : -1;
            const distanceX = (100 + Math.random() * 600) * dir; // Разлет в ширину
            const peakY = -300 - Math.random() * 600; // Разлет в высоту (парабола)
            const rot = (Math.random() * 720 - 360); // Кручение вокруг своей оси
            const scale = 0.7 + Math.random() * 1.2; // Разные размеры
            
            // Немного сдвигаем точку выстрела от центра, чтобы было органичнее
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

        // Уборка мусора
        wrap.addEventListener('animationend', (e) => {
            if (e.target === wrap) {
                wrap.remove();
            }
        });
    }
};

setTimeout(() => window.AppEmotes.init(), 1000);