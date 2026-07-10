/* ФАЙЛ: js/games-db.js */
/* ================= БАЗА ДАННЫХ ИГР И МЕДИА (!game) ================= */
/* Обновлено под новый компактный UI (единый массив meta) */

window.GamesDatabase = {
    // === ИГРЫ ===
    "subnautica": { 
        title: "Subnautica", cover: "img/covers/subnautica.png", themeColor: "#00E5FF", type: "game",
        meta: ["Выживание", "Unknown Worlds", "2018"]
    },
    "subnautica 2": { 
        title: "Subnautica 2", cover: "img/covers/subnautica_2.png", themeColor: "#00FF7F", type: "game",
        meta: ["Выживание", "Unknown Worlds", "Ожидание"]
    },
    "lethal company": { 
        title: "Lethal Company", cover: "img/covers/lethal_company.webp", themeColor: "#FF4500", type: "game",
        meta: ["Кооп Хоррор", "Zeekerss", "2023"]
    },
    "repo": { 
        title: "R.E.P.O.", cover: "img/covers/repo.jpg", themeColor: "#f39c12", type: "game",
        meta: ["Экшен / Хоррор", "2024"]
    },
    "minecraft": { 
        title: "Minecraft", cover: "img/covers/minecraft.webp", themeColor: "#5ea936", type: "game",
        meta: ["Песочница", "Mojang", "2011"]
    },
    "dome keeper": { 
        title: "Dome Keeper", cover: "img/covers/dome_keeper.jpg", themeColor: "#8e44ad", type: "game",
        meta: ["Рогалик", "Bippinbits", "2022"]
    },
    "winx": { 
        title: "Winx Club: The Magic is Back", cover: "img/covers/winx.png", themeColor: "#FF69B4", type: "game",
        meta: ["Приключения / Магия", "Rainbow", "2026"]
    },
    "valorant": {
        title: "VALORANT", cover: "img/covers/valorant.webp", themeColor: "#FF4655", type: "game",
        meta: ["Тактический шутер", "Riot Games", "2020"]
    },
    "abyssus": {
        title: "Abyssus", cover: "img/covers/abyssus.jpg", themeColor: "#3498db", type: "game",
        meta: ["Экшен / FPS", "DoubleMoose", "202X"]
    },
    "burglin' gnomes": {
        title: "Burglin' Gnomes", cover: "img/covers/burglin_gnomes.png", themeColor: "#2ecc71", type: "game",
        meta: ["Кооп / Аркада", "2024"]
    },
    "content warning": {
        title: "Content Warning", cover: "img/covers/content_warning.png", themeColor: "#f1c40f", type: "game",
        meta: ["Кооп Хоррор", "Skog", "2024"]
    },
    "cs2": {
        title: "Counter-Strike 2", cover: "img/covers/cs2.png", themeColor: "#F59E0B", type: "game",
        meta: ["Тактический шутер", "Valve", "2023"]
    },
    "stick fight": {
        title: "Stick Fight: The Game", cover: "img/covers/stick_fight.png", themeColor: "#e74c3c", type: "game",
        meta: ["Файтинг / Фановая", "Landfall", "2017"]
    },
    "vrchat": {
        title: "VRChat", cover: "img/covers/vrchat.webp", themeColor: "#00E5FF", type: "game",
        meta: ["Социальная Песочница", "VRChat Inc.", "2017"]
    },
    "bendy and the ink factory": {
        title: "Bendy and the Ink Factory", cover: "img/covers/bendy_factory.jpg", themeColor: "#dfca96", type: "game",
        meta: ["Инди Хоррор", "Joey Drew Studios", "Ожидание"]
    },
    "bendy: the cage": {
        title: "Bendy: The Cage", cover: "img/covers/bendy_cage.png", themeColor: "#b89c5f", type: "game",
        meta: ["Выживание / Хоррор", "Joey Drew Studios", "2026"]
    },
    "atomic heart": {
        title: "Atomic Heart", cover: "img/covers/atomic_heart.jpg", themeColor: "#DC2626", type: "game",
        meta: ["Шутер / Экшен", "Mundfish", "2023"]
    },
    "stalker": {
        title: "S.T.A.L.K.E.R.: Тень Чернобыля", cover: "img/covers/stalker.png", themeColor: "#EAB308", type: "game",
        meta: ["Шутер / Выживание", "GSC Game World", "2007"]
    },
    "delivery & beyond": { 
        title: "Delivery & Beyond", cover: "img/covers/delivery_beyond.jpeg", themeColor: "#FF9F43", type: "game",
        meta: ["Кооп / Физика", "2026"]
    },
    "tomodachi life": { 
        title: "Tomodachi Life: Living the Dream", cover: "img/covers/tomodachi.png", themeColor: "#00CED1", type: "game",
        meta: ["Симулятор жизни", "Nintendo"]
    },
    "war thunder": { 
        title: "War Thunder", cover: "img/covers/war_thunder.png", themeColor: "#2D3748", type: "game",
        meta: ["Авиация / Танки", "Gaijin", "2012"]
    },

    // === ФИЛЬМЫ И СЕРИАЛЫ ===
    "digital circus": {
        title: "Удивительный цифровой цирк", cover: "img/covers/digital_circus.jpg", themeColor: "#E52521", type: "series",
        meta: ["Мультсериал", "Glitch Productions", "YouTube"]
    },
    "spider noir": {
        title: "Spider-Noir (Ч/Б)", cover: "img/covers/spider_noir_bw.jpg", themeColor: "#4a4a4a", type: "series",
        meta: ["Супергероика / Нуар", "Николас Кейдж", "2025"]
    },
    "spider noir color": {
        title: "Spider-Noir", cover: "img/covers/spider_noir_bw.jpg", themeColor: "#991B1B", type: "series",
        meta: ["Супергероика", "Николас Кейдж", "2025"]
    },
    "lego batman": {
        title: "Лего Фильм: Бэтмен", cover: "img/covers/lego_batman.jpg", themeColor: "#FFE81F", type: "series",
        meta: ["Мультфильм / Комедия", "Warner Bros.", "2017"]
    }
};