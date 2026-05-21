window.AppGameInfo = {
    container: document.getElementById('game-info-container'),
    coverEl: document.getElementById('gi-cover'),
    noGameEl: document.getElementById('gi-no-game'),
    
    titleEl: document.getElementById('gi-title'),
    ratingEl: document.getElementById('gi-rating'),
    yearEl: document.getElementById('gi-year'),
    genreEl: document.getElementById('gi-genre'),
    devEl: document.getElementById('gi-dev'),
    platEl: document.getElementById('gi-plat'),

    rows: {
        rating: document.getElementById('row-rating'),
        year: document.getElementById('row-year'),
        genre: document.getElementById('row-genre'),
        dev: document.getElementById('row-dev'),
        plat: document.getElementById('row-plat')
    },

    init: function() {
        const savedGame = localStorage.getItem('uso_current_game');
        if (savedGame) this.set(savedGame, true); 
    },

    set: async function(rawGameName, noAnim = false) {
        if (!this.container) return;

        const gameKey = rawGameName.toLowerCase().trim();

        if (gameKey === "off" || gameKey === "hide" || gameKey === "clear") {
            this.hide();
            return;
        }

        // ШАГ 1: Поиск в локальной базе (config.js)
        let gameData = this.findLocalGame(gameKey);

        // ШАГ 2: Если не нашли локально, обращаемся к API Steam!
        if (!gameData) {
            gameData = await this.fetchFromSteam(gameKey);
        }

        // ШАГ 3: Рендеринг (Даже если пришла просто заглушка)
        this.render(gameData);
        this.container.classList.remove('hidden');
        localStorage.setItem('uso_current_game', rawGameName); // Сохраняем оригинал имени
        
        if (!noAnim) {
            this.container.classList.remove('pop-anim');
            void this.container.offsetWidth; 
            this.container.classList.add('pop-anim');
        }

        // === СИНЕРГИЯ ЭКОСИСТЕМЫ ===
        
        // 1. Бегущая строка
        if (window.AppTicker) {
            const msg = `<span style="color: #FF4477; font-weight: 800;">🎮 Сейчас на стриме:</span> <span style="color: #1a1a1a; font-weight: 900;">${gameData.title}</span>`;
            window.AppTicker.forceShowImmediate(msg);
        }

        // 2. Умная реакция питомца (Если жанр содержит Хоррор)
        if (window.AppPet && gameData.genre && gameData.genre.toLowerCase().includes("хоррор")) {
            window.AppPet.setEmotion('scared', 5000);
        }
    },

    // Нечеткий поиск по конфигу
    findLocalGame: function(searchKey) {
        const db = window.AppConfig.gamesDatabase;
        if (db[searchKey]) return db[searchKey]; // Прямое попадание
        
        // Ищем вхождение (например, ввели "lethal", а в базе "lethal company")
        for (let key in db) {
            if (key.includes(searchKey) || searchKey.includes(key)) {
                return db[key];
            }
        }
        return null; // Ничего не нашли
    },

    // Магия: Поиск игры в Steam
    fetchFromSteam: async function(gameName) {
        try {
            // Используем публичный Steam Store API через прокси (AllOrigins) для обхода CORS в браузере OBS
            const url = encodeURIComponent(`https://store.steampowered.com/api/storesearch/?term=${gameName}&l=russian&cc=RU`);
            const response = await fetch(`https://api.allorigins.win/get?url=${url}`);
            
            if (!response.ok) throw new Error("Network error");
            const proxyData = await response.json();
            const data = JSON.parse(proxyData.contents);
            
            if (data && data.items && data.items.length > 0) {
                const game = data.items[0]; // Берем первый результат
                
                // Формируем красивую вертикальную обложку Steam
                const coverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/library_600x900_2x.jpg`;
                
                // Цена
                let price = "Бесплатно / Нет";
                if (game.price && game.price.final) price = (game.price.final / 100) + " руб.";

                return {
                    title: game.name,
                    cover: coverUrl,
                    rating: "Из Steam", // API поиска не отдает рейтинг
                    year: price,        // Подменяем Год на Цену (для красоты)
                    genre: "Неизвестно", 
                    developer: "Поиск Steam",
                    platform: "PC"
                };
            }
        } catch (err) {
            console.log("[GameInfo] Ошибка поиска Steam:", err);
        }

        // Фолбэк (Если Steam упал или игру не нашли, показываем заглушку)
        return {
            title: gameName.toUpperCase(),
            cover: "",
            rating: "N/A",
            year: "", genre: "", developer: "", platform: "Custom"
        };
    },

    render: function(data) {
        this.titleEl.innerText = data.title || "Неизвестно";

        if (data.cover && data.cover.trim() !== "") {
            // Чтобы картинка из Steam не выскочила поломанной (если её нет на сервере), вешаем обработчик ошибки
            this.coverEl.onerror = () => {
                this.coverEl.classList.add('hidden');
                this.noGameEl.style.display = 'flex';
            };
            this.coverEl.src = data.cover;
            this.coverEl.classList.remove('hidden');
            this.noGameEl.style.display = 'none';
        } else {
            this.coverEl.src = "";
            this.coverEl.classList.add('hidden');
            this.noGameEl.style.display = 'flex';
        }

        this.updateRow('rating', data.rating);
        this.updateRow('year', data.year);
        this.updateRow('genre', data.genre);
        this.updateRow('dev', data.developer);
        this.updateRow('plat', data.platform);
    },

    updateRow: function(key, value) {
        const row = this.rows[key];
        if (!row) return;
        if (value !== undefined && value !== null && value !== "") {
            row.style.display = 'flex';
            if (key === 'rating') this.ratingEl.innerText = value;
            else if (key === 'year') this.yearEl.innerText = value;
            else if (key === 'genre') this.genreEl.innerText = value;
            else if (key === 'dev') this.devEl.innerText = value;
            else if (key === 'plat') this.platEl.innerText = value;
        } else {
            row.style.display = 'none'; 
        }
    },

    hide: function() {
        this.container.classList.add('hidden');
        localStorage.removeItem('uso_current_game'); 
    }
};

setTimeout(() => window.AppGameInfo.init(), 1000);