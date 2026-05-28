/* ================= УМНАЯ МУЛЬТИМЕДИЙНАЯ КАРТОЧКА ================= */
window.AppGameInfo = {
    container: document.getElementById('game-info-container'),
    coverEl: document.getElementById('gi-cover'),
    noGameEl: document.getElementById('gi-no-game'),
    
    typeBadgeEl: document.getElementById('gi-type-badge'),
    titleWrapper: document.getElementById('gi-title-wrapper'),
    titleEl: document.getElementById('gi-title'),
    tagsContainer: document.getElementById('gi-tags-container'),
    detailsGrid: document.getElementById('gi-details-grid'),

    init: function() {
        const savedGame = localStorage.getItem('uso_current_game');
        if (savedGame) this.set(savedGame, true); 

        window.AppEvents.listen('GAME_SET', d => this.set(d.game));
    },

    set: async function(rawGameName, noAnim = false) {
        if (!this.container) return;

        const gameKey = rawGameName.toLowerCase().trim();
        if (gameKey === "off" || gameKey === "hide" || gameKey === "clear") {
            this.hide(); return;
        }

        let mediaData = this.findLocalGame(gameKey);
        if (!mediaData) mediaData = await this.fetchFromSteam(gameKey);

        this.render(mediaData);
        this.container.classList.remove('hidden');
        localStorage.setItem('uso_current_game', rawGameName); 
        
        if (!noAnim) {
            this.container.classList.remove('pop-anim');
            void this.container.offsetWidth; 
            this.container.classList.add('pop-anim');
        }

        // Логика бегущей строки (Marquee)
        setTimeout(() => this.checkMarquee(), 100);

        if (window.AppTicker) {
            let prefix = mediaData.type === 'series' ? '🎬 Смотрим:' : '🎮 Играем:';
            const msg = `<span style="color: ${mediaData.themeColor || '#FF4477'}; font-weight: 800;">${prefix}</span> <span style="color: #1a1a1a; font-weight: 900;">${mediaData.title}</span>`;
            window.AppTicker.forceShowImmediate(msg);
        }
    },

    checkMarquee: function() {
        // Если текст шире, чем контейнер (220px) — запускаем анимацию
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
                
                return {
                    title: game.name, cover: coverUrl, themeColor: "#1B2838", type: "game",
                    tags: ["Steam Game"], details: { "Платформа": "PC (Steam)" }
                };
            }
        } catch (err) { console.log("[GameInfo] Ошибка поиска Steam:", err); }

        return { 
            title: gameName.toUpperCase(), cover: "", themeColor: "#FF4477", type: "game",
            tags: ["Пользовательская"], details: {} 
        };
    },

    render: function(data) {
        // 1. Устанавливаем цвета Хамелеона
        const color = data.themeColor || '#FF4477';
        this.container.style.setProperty('--media-color', color);
        // Высчитываем легкое свечение на основе цвета (костыль для RGBA)
        this.container.style.setProperty('--media-glow', `${color}33`); // 33 это ~20% прозрачности в HEX

        // 2. Тип и Заголовок
        this.typeBadgeEl.innerText = data.type === 'series' ? "СЕЙЧАС СМОТРИМ" : "СЕЙЧАС ИГРАЕМ";
        this.titleEl.innerText = data.title || "Неизвестно";
        this.titleEl.classList.remove('marquee-active'); // Сброс перед проверкой

        // 3. Обложка
        if (data.cover && data.cover.trim() !== "") {
            this.coverEl.onerror = () => { this.coverEl.classList.add('hidden'); this.noGameEl.style.display = 'flex'; };
            this.coverEl.src = data.cover;
            this.coverEl.classList.remove('hidden');
            this.noGameEl.style.display = 'none';
        } else {
            this.coverEl.src = "";
            this.coverEl.classList.add('hidden');
            this.noGameEl.style.display = 'flex';
        }

        // 4. Генерация Тегов
        this.tagsContainer.innerHTML = '';
        if (data.tags && data.tags.length > 0) {
            data.tags.forEach(tag => {
                const t = document.createElement('div');
                t.className = 'mi-tag';
                t.innerText = tag;
                this.tagsContainer.appendChild(t);
            });
        }

        // 5. Генерация Деталей (Сетка)
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
        localStorage.removeItem('uso_current_game'); 
    }
};

setTimeout(() => window.AppGameInfo.init(), 1000);