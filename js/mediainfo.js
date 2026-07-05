/* ================= УНИВЕРСАЛЬНАЯ МЕДИА-КАРТОЧКА ================= */
window.AppMediaInfo = {
    container: document.getElementById('media-info-container'),
    coverEl: document.getElementById('mi-cover'),
    noMediaEl: document.getElementById('mi-no-media'),
    ytPlayEl: document.getElementById('mi-yt-play'), // Новая иконка
    
    typeBadgeEl: document.getElementById('mi-type-badge'),
    titleWrapper: document.getElementById('mi-title-wrapper'),
    titleEl: document.getElementById('mi-title'),
    tagsContainer: document.getElementById('mi-tags-container'),
    detailsGrid: document.getElementById('mi-details-grid'),

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
                this.container.classList.remove('pop-anim');
                void this.container.offsetWidth; 
                this.container.classList.add('pop-anim');
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
            const response = await fetch(`https://api.allorigins.win/get?url=${url}`);
            if (!response.ok) throw new Error("Network error");
            const proxyData = await response.json();
            const data = JSON.parse(proxyData.contents);
            
            if (data && data.items && data.items.length > 0) {
                const game = data.items[0]; 
                const coverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/library_600x900_2x.jpg`;
                return { title: game.name, cover: coverUrl, themeColor: "#1B2838", type: "game", tags: ["Steam Game"], details: { "Платформа": "PC (Steam)" } };
            }
        } catch (err) {}
        return { title: gameName.toUpperCase(), cover: "", themeColor: "#FF4477", type: "game", tags: ["Пользовательская"], details: {} };
    },

    fetchFromYouTube: async function(videoId) {
        try {
            const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network error");
            const data = await response.json();
            return {
                title: data.title, cover: data.thumbnail_url, themeColor: "#FF0000", type: "youtube",
                tags: ["YouTube", data.author_name], details: { "Платформа": "YouTube", "Канал": data.author_name }
            };
        } catch (err) { return null; }
    },

    render: function(data) {
        const color = data.themeColor || '#FF4477';
        this.container.style.setProperty('--media-color', color);
        this.container.style.setProperty('--media-glow', `${color}33`);

        // Логика переключения режима "Горизонтальный/Вертикальный"
        if (data.type === 'youtube') {
            this.container.classList.add('is-youtube');
            this.typeBadgeEl.innerText = "РЕАКЦИЯ НА ВИДЕО";
            if (data.cover && data.cover.trim() !== "") this.ytPlayEl.style.display = 'flex';
            else this.ytPlayEl.style.display = 'none';
        } else {
            this.container.classList.remove('is-youtube');
            this.ytPlayEl.style.display = 'none';
            if (data.type === 'series') this.typeBadgeEl.innerText = "СЕЙЧАС СМОТРИМ";
            else this.typeBadgeEl.innerText = "СЕЙЧАС ИГРАЕМ";
        }

        this.titleEl.innerText = data.title || "Неизвестно";
        this.titleEl.classList.remove('marquee-active');

        if (data.cover && data.cover.trim() !== "") {
            this.coverEl.onerror = () => { this.coverEl.classList.add('hidden'); this.noMediaEl.style.display = 'flex'; };
            this.coverEl.src = data.cover;
            this.coverEl.classList.remove('hidden');
            this.noMediaEl.style.display = 'none';
        } else {
            this.coverEl.src = "";
            this.coverEl.classList.add('hidden');
            this.noMediaEl.style.display = 'flex';
            this.ytPlayEl.style.display = 'none'; // Скрываем Play если обложка не прогрузилась
        }

        this.tagsContainer.innerHTML = '';
        if (data.tags && data.tags.length > 0) {
            data.tags.forEach(tag => {
                const t = document.createElement('div');
                t.className = 'mi-tag';
                t.innerText = tag;
                this.tagsContainer.appendChild(t);
            });
        }

        this.detailsGrid.innerHTML = '';
        if (data.details) {
            for (const [key, value] of Object.entries(data.details)) {
                if (value) {
                    const item = document.createElement('div');
                    item.className = 'mi-detail-item';
                    item.innerHTML = `<span class="mi-detail-label">${key}</span><span class="mi-detail-value">${value}</span>`;
                    this.detailsGrid.appendChild(item);
                }
            }
        }
    },

    hide: function() {
        this.container.classList.add('hidden');
        localStorage.removeItem('uso_current_media'); 
    }
};

setTimeout(() => window.AppMediaInfo.init(), 1000);