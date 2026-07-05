/* ================= БАЗА ДАННЫХ ИГР И МЕДИА (!game) ================= */
/* Формат адаптирован под новую умную карточку (с тегами, цветами и сеткой) */

window.GamesDatabase = {
    // === ИГРЫ ===
    "subnautica": { 
        title: "Subnautica", cover: "img/covers/subnautica.png", themeColor: "#00E5FF", type: "game",
        tags: ["Выживание", "9.5 / 10"], details: { "Разработчик": "Unknown Worlds", "Год": "2018", "Платформа": "PC" }
    },
    "subnautica 2": { 
        title: "Subnautica 2", cover: "img/covers/subnautica_2.png", themeColor: "#00FF7F", type: "game",
        tags: ["Выживание", "Ожидание"], details: { "Разработчик": "Unknown Worlds", "Год": "2025", "Платформа": "PC" }
    },
    "lethal company": { 
        title: "Lethal Company", cover: "img/covers/lethal_company.webp", themeColor: "#FF4500", type: "game",
        tags: ["Кооп Хоррор", "9.0 / 10"], details: { "Разработчик": "Zeekerss", "Год": "2023", "Платформа": "PC" }
    },
    "repo": { 
        title: "R.E.P.O.", cover: "img/covers/repo.jpg", themeColor: "#f39c12", type: "game",
        tags: ["Экшен / Хоррор", "8.5 / 10"], details: { "Разработчик": "Студия", "Год": "2024", "Платформа": "PC" }
    },
    "minecraft": { 
        title: "Minecraft", cover: "img/covers/minecraft.webp", themeColor: "#5ea936", type: "game",
        tags: ["Песочница", "10 / 10"], details: { "Разработчик": "Mojang", "Год": "2011", "Платформа": "PC" }
    },
    "dome keeper": { 
        title: "Dome Keeper", cover: "img/covers/dome_keeper.jpg", themeColor: "#8e44ad", type: "game",
        tags: ["Рогалик", "8.8 / 10"], details: { "Разработчик": "Bippinbits", "Год": "2022", "Платформа": "PC" }
    },
    "winx": { 
        title: "Winx Club: The Magic is Back", cover: "img/covers/winx.png", themeColor: "#FF69B4", type: "game",
        tags: ["Приключения / Магия", "Ожидание"], details: { "Разработчик": "Rainbow", "Год": "2026", "Платформа": "PC" }
    },
    "valorant": {
        title: "VALORANT", cover: "img/covers/valorant.webp", themeColor: "#FF4655", type: "game",
        tags: ["Тактический шутер", "Бесплатно"], details: { "Разработчик": "Riot Games", "Год": "2020", "Платформа": "PC" }
    },
    "abyssus": {
        title: "Abyssus", cover: "img/covers/abyssus.jpg", themeColor: "#3498db", type: "game",
        tags: ["Экшен / FPS", "Ожидание"], details: { "Разработчик": "DoubleMoose", "Год": "202X", "Платформа": "PC" }
    },
    "burglin' gnomes": {
        title: "Burglin' Gnomes", cover: "img/covers/burglin_gnomes.png", themeColor: "#2ecc71", type: "game",
        tags: ["Кооп / Аркада", "TBA"], details: { "Разработчик": "Студия", "Год": "2024", "Платформа": "PC" }
    },
    "content warning": {
        title: "Content Warning", cover: "img/covers/content_warning.png", themeColor: "#f1c40f", type: "game",
        tags: ["Кооп Хоррор", "9.0 / 10"], details: { "Разработчик": "Skog, Zorro", "Год": "2024", "Платформа": "PC" }
    },
    "cs2": {
        title: "Counter-Strike 2", cover: "img/covers/cs2.png", themeColor: "#F59E0B", type: "game",
        tags: ["Тактический шутер", "Бесплатно"], details: { "Разработчик": "Valve", "Год": "2023", "Платформа": "PC" }
    },
    "stick fight": {
        title: "Stick Fight: The Game", cover: "img/covers/stick_fight.png", themeColor: "#e74c3c", type: "game",
        tags: ["Файтинг / Фановая", "9.0 / 10"], details: { "Разработчик": "Landfall", "Год": "2017", "Платформа": "PC" }
    },
    "vrchat": {
        title: "VRChat", cover: "img/covers/vrchat.webp", themeColor: "#00E5FF", type: "game",
        tags: ["Социальная Песочница", "Бесплатно"], details: { "Разработчик": "VRChat Inc.", "Год": "2017", "Платформа": "PC / VR" }
    },
    "bendy and the ink factory": {
        title: "Bendy and the Ink Factory", cover: "img/covers/bendy_factory.jpg", themeColor: "#dfca96", type: "game",
        tags: ["Инди Хоррор", "Ожидание"], details: { "Разработчик": "Joey Drew Studios", "Год": "202X", "Платформа": "PC" }
    },
    "bendy: the cage": {
        title: "Bendy: The Cage", cover: "img/covers/bendy_cage.png", themeColor: "#b89c5f", type: "game",
        tags: ["Выживание / Хоррор", "Ожидание"], details: { "Разработчик": "Joey Drew Studios", "Год": "2026", "Платформа": "PC" }
    },
    "atomic heart": {
        title: "Atomic Heart", cover: "img/covers/atomic_heart.jpg", themeColor: "#DC2626", type: "game",
        tags: ["Шутер / Экшен", "8.5 / 10"], details: { "Разработчик": "Mundfish", "Год": "2023", "Платформа": "PC" }
    },
    "stalker": {
        title: "S.T.A.L.K.E.R.: Тень Чернобыля", cover: "img/covers/stalker.png", themeColor: "#EAB308", type: "game",
        tags: ["Шутер / Выживание", "9.0 / 10"], details: { "Разработчик": "GSC Game World", "Год": "2007", "Платформа": "PC" }
    },

    // === ФИЛЬМЫ И СЕРИАЛЫ ===
    "digital circus": {
        title: "Удивительный цифровой цирк", cover: "img/covers/digital_circus.jpg", themeColor: "#E52521", type: "series",
        tags: ["Мультсериал", "Сюрреализм"], details: { "Студия": "Glitch Productions", "Эпизоды": "Выходят", "Платформа": "YouTube" }
    },
    "spider noir": {
        title: "Spider-Noir (Ч/Б)", cover: "img/covers/spider_noir_bw.jpg", themeColor: "#4a4a4a", type: "series",
        tags: ["Супергероика", "Нуар"], details: { "В гл. роли": "Николас Кейдж", "Платформа": "Amazon Prime", "Год": "2025" }
    },
    "spider noir color": {
        title: "Spider-Noir", cover: "img/covers/с.jpg", themeColor: "#991B1B", type: "series",
        tags: ["Супергероика", "Комиксы"], details: { "В гл. роли": "Николас Кейдж", "Платформа": "Amazon Prime", "Год": "2025" }
    },
    "lego batman": {
        title: "Лего Фильм: Бэтмен", cover: "img/covers/lego_batman.jpg", themeColor: "#FFE81F", type: "series",
        tags: ["Мультфильм", "Комедия"], details: { "Студия": "Warner Bros.", "Год": "2017" }
    }
};