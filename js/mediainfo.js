/* ФАЙЛ: js/mediainfo.js */
/* ================= УНИВЕРСАЛЬНАЯ МЕДИА-КАРТОЧКА (С ГЕНЕРАЦИЕЙ ПОСТЕРОВ) ================= */
window.AppMediaInfo = {
    container: document.getElementById('media-info-container'),
    posterBreakout: document.querySelector('.mi-poster-breakout'),
    coverEl: document.getElementById('mi-cover'),
    noMediaEl: document.getElementById('mi-no-media'),
    ytPlayEl: document.getElementById('mi-yt-play'), 
    
    typeBadgeEl: document.getElementById('mi-type-badge'),
    titleWrapper: document.getElementById('mi-title-wrapper'),
    titleEl: document.getElementById('mi-title'),
    metaRowEl: document.getElementById('mi-meta-row'), // Новый контейнер метаданных

    init: function() {
        const savedMedia = localStorage.getItem('uso_current_media');
        if (savedMedia) {
            try {
                const data = JSON.parse(savedMedia);
                this.set(data.type, data.query, true); 
            } catch(e) {}
        }

        window.AppEvents.listen('MEDIA_SET', d => this.set(d.type, d.query));
    },

    set: async function(type, query, noAnim = false) {
        if (!this.container) return;

        if (type === "off" || query === "off" || query === "clear") {
            this.hide(); return;
        }

        let mediaData = null;

        if (type === 'game') {
            const gameKey = query.toLowerCase().trim();
            mediaData = this.findLocalGame(gameKey);
            // Если игры нет в локальной базе - ищем в Steam
            if (!mediaData) mediaData = await this.fetchFromSteam(gameKey);
        }
        else if (type === 'yt') {
            mediaData = await this.fetchFromYouTube(query);
        }

        if (mediaData) {
            this.render(mediaData);
            this.container.classList.remove('hidden');
            localStorage.setItem('uso_current_media', JSON.stringify({ type: type, query: query })); 
            
            if (!noAnim) {
                // Используем безопасный метод перезапуска анимации
                window.AppUtils.restartAnimation(this.container, 'pop-anim');
            }

            setTimeout(() => this.checkMarquee(), 100);

            if (window.AppTicker && !noAnim) {
                let prefix = mediaData.type === 'youtube' ? '📺 Реакция:' : (mediaData.type === 'series' ? '🎬 Смотрим:' : '🎮 Играем:');
                const msg = `<span style="color: ${mediaData.themeColor || '#FF4477'}; font-weight: 800;">${prefix}</span> <span style="color: #1a1a1a; font-weight: 900;">${mediaData.title}</span>`;
                window.AppTicker.forceShowImmediate(msg);
            }
        }
    },

    checkMarquee: function() {
        if (this.titleEl.scrollWidth > this.titleWrapper.clientWidth + 5) {
            this.titleEl.classList.add('marquee-active');
        } else {
            this.titleEl.classList.remove('marquee-active');
        }
    },

    findLocalGame: function(searchKey) {
        const db = window.GamesDatabase || {}; 
        if (db[searchKey]) return db[searchKey]; 
        for (let key in db) {
            if (key.includes(searchKey) || searchKey.includes(key)) return db[key];
        }
        return null; 
    },

    fetchFromSteam: async function(gameName) {
        try {
            const url = encodeURIComponent(`https://store.steampowered.com/api/storesearch/?term=${gameName}&l=russian&cc=RU`);
            const data = await window.AppUtils.safeFetch(`https://api.allorigins.win/get?url=${url}`);
            const steamData = JSON.parse(data.contents);
            
            if (steamData && steamData.items && steamData.items.length > 0) {
                const game = steamData.items[0]; 
                const coverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/library_600x900_2x.jpg`;
                return { 
                    title: game.name, cover: coverUrl, themeColor: "#1B2838", type: "game", 
                    meta: ["Steam", "PC"] // Компактная мета
                };
            }
        } catch (err) {
            console.warn("[MediaInfo] Steam API недоступен, генерируем заглушку.");
        }
        // Если Steam не нашел игру, возвращаем специальный флаг cover: "generated"
        return { title: gameName.toUpperCase(), cover: "generated", themeColor: "#FF4477", type: "game", meta: ["Пользовательская игра"] };
    },

    fetchFromYouTube: async function(videoId) {
        try {
            const data = await window.AppUtils.safeFetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            return {
                title: data.title, cover: data.thumbnail_url, themeColor: "#FF0000", type: "youtube",
                meta: [data.author_name] // Оставляем ТОЛЬКО имя канала
            };
        } catch (err) { return null; }
    },

    // Функция генерации красивого фона на основе строки
    generateGradientPlaceholder: function(title) {
        let hash = 0;
        for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
        const hue1 = Math.abs(hash % 360);
        const hue2 = (hue1 + 40) % 360;
        
        // Очищаем старые стили
        this.posterBreakout.style.background = `linear-gradient(135deg, hsl(${hue1}, 80%, 50%), hsl(${hue2}, 80%, 40%))`;
        
        // Достаем инициалы (первые 2 буквы или слова)
        let initials = title.substring(0, 2).toUpperCase();
        let words = title.split(' ');
        if (words.length > 1) initials = (words[0][0] + words[1][0]).toUpperCase();

        this.noMediaEl.innerHTML = `<div class="mi-generated-initials">${initials}</div>`;
        this.noMediaEl.style.display = 'flex';
        this.noMediaEl.style.background = 'transparent'; // Убираем темный фон
    },

    render: function(data) {
        const color = data.themeColor || '#FF4477';
        this.container.style.setProperty('--media-color', color);
        this.container.style.setProperty('--media-glow', `${color}33`);

        if (data.type === 'youtube') {
            this.container.classList.add('is-youtube');
            this.typeBadgeEl.innerText = "РЕАКЦИЯ НА ВИДЕО";
            this.ytPlayEl.style.display = (data.cover && data.cover !== "generated") ? 'flex' : 'none';
        } else {
            this.container.classList.remove('is-youtube');
            this.ytPlayEl.style.display = 'none';
            this.typeBadgeEl.innerText = data.type === 'series' ? "СЕЙЧАС СМОТРИМ" : "СЕЙЧАС ИГРАЕМ";
        }

        this.titleEl.innerText = data.title || "Неизвестно";
        this.titleEl.classList.remove('marquee-active');

        // СБРОС: Убираем градиентный фон по умолчанию
        this.posterBreakout.style.background = '';

        if (data.cover === "generated") {
            this.coverEl.src = "";
            this.coverEl.classList.add('hidden');
            this.generateGradientPlaceholder(data.title);
        } 
        else if (data.cover && data.cover.trim() !== "") {
            this.coverEl.onerror = () => { 
                this.coverEl.classList.add('hidden'); 
                this.generateGradientPlaceholder(data.title); 
            };
            this.coverEl.src = data.cover;
            this.coverEl.classList.remove('hidden');
            this.noMediaEl.style.display = 'none';
        } 
        else {
            this.coverEl.src = "";
            this.coverEl.classList.add('hidden');
            this.noMediaEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <div class="mi-no-text">NO SIGNAL</div>
            `;
            this.noMediaEl.style.display = 'flex';
            this.noMediaEl.style.background = 'linear-gradient(135deg, #1a1a24, #0a0a0f)';
        }

        // Рендер чистой строки меты
        this.metaRowEl.innerHTML = '';
        if (data.meta && data.meta.length > 0) {
            data.meta.forEach(itemText => {
                if(itemText) {
                    const span = document.createElement('span');
                    span.className = 'mi-meta-item';
                    span.innerText = itemText;
                    this.metaRowEl.appendChild(span);
                }
            });
        }
    },

    hide: function() {
        this.container.classList.add('hidden');
        localStorage.removeItem('uso_current_media'); 
    }
};

setTimeout(() => window.AppMediaInfo.init(), 1000);