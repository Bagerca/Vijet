window.AppConfig = {
    channelName: "ksusha__sher",
    allowedUsers: ["bagercaa", "to_be_ang"], 
    
    // ==========================================
    // РАСШИРЕННЫЙ СЛОВАРЬ ЗАПРЕТОК (Twitch TOS)
    // Достаточно указать только "корни" слов. Умный фильтр сам найдет их, 
    // даже если напишут "п и д 0 р", "н.е_г-р", "x 0 x 0 л" или "n1gg3r"
    // ==========================================
    forbiddenWords: [
        "негр", "nigg", "нигг", "нигер",
        "пидор", "пидар", "pidor", "pidar", "педик", "pedik",
        "даун", "daun", "аутист", "retard",
        "чурка", "хач", "чурек",
        "хохол", "xoxol", "hoxol", "свинорус", "русня", "кацап", "москаль",
        "шлюха", "шалава", "whore", "slut",
        "запретка", "осуждаю"
    ],

    alertVolume: 40,
    alertSounds: {
        "follow": "sounds/follow.mp3",
        "sub": "sounds/sub.mp3",
        "resub": "sounds/sub.mp3",
        "gift": "sounds/gift.mp3",
        "streak": "sounds/streak.mp3",
        "reward_series": "sounds/series.mp3",
        "reward_movie": "sounds/movie.mp3",
        "reward_video": "sounds/video.mp3",
        "reward_game": "sounds/game.mp3",
        "reward_music": "sounds/music.mp3"
    },
    
    deathSound: "sounds/death.mp3",       
    shoutoutSound: "sounds/shoutout.mp3", 

    rewards: {
        series: "Сериал", movie: "Фильм", video: "Видео", game: "Игры", music: "Музыка"
    },

    rewardName: "Заказать видео",
    ttsRewardName: "Озвучить сообщение", 
    feedRewardName: "Покормить лису", 

    // ==========================================
    // НАСТРОЙКИ: Колесо Фортуны
    // ==========================================
    wheelRewardName: "Добавить в рулетку", 
    wheelSpinTime: 8, 
    wheelColors: ["#FF4477", "#ffffff", "#1a1a25", "#00E5FF"], 
    wheelMaxItems: 15, 

    petEnabled: true,
    petSleepTimeout: 120,

    emotesEnabled: true,      
    emotesMaxPerMessage: 150, 
    emotesMode: "bubble",     

    ttsEnabled: true,         
    ttsVolume: 60,            
    ttsMaxLength: 150,        

    ttsCustomVoices: {
        "bagercaa": { pitch: 0.2, rate: 0.8 }, 
        "to_be_ang": { pitch: 2.0, rate: 1.3 }
    },

    // ==========================================
    // БАЗА ДАННЫХ ИГР ДЛЯ ПЛАШКИ (!game [название])
    // ==========================================
    gamesDatabase: {
        "subnautica": { 
            title: "Subnautica", cover: "img/covers/subnautica.png", 
            rating: "9.5 / 10", year: 2018, genre: "Выживание", 
            developer: "Unknown Worlds", platform: "PC" 
        },
        "subnautica 2": { 
            title: "Subnautica 2", cover: "img/covers/subnautica_2.png", 
            rating: "Ожидание", year: 2025, genre: "Выживание", 
            developer: "Unknown Worlds", platform: "PC" 
        },
        "lethal company": { 
            title: "Lethal Company", cover: "img/covers/lethal_company.webp", 
            rating: "9.0 / 10", year: 2023, genre: "Кооп Хоррор", 
            developer: "Zeekerss", platform: "PC" 
        },
        "repo": { 
            title: "R.E.P.O.", cover: "img/covers/repo.jpg", 
            rating: "8.5 / 10", year: 2024, genre: "Экшен / Хоррор", 
            developer: "Студия", platform: "PC" 
        },
        "minecraft": { 
            title: "Minecraft", cover: "img/covers/minecraft.webp", 
            rating: "10 / 10", year: 2011, genre: "Песочница", 
            developer: "Mojang", platform: "PC" 
        },
        "dome keeper": { 
            title: "Dome Keeper", cover: "img/covers/dome_keeper.jpg", 
            rating: "8.8 / 10", year: 2022, genre: "Рогалик", 
            developer: "Bippinbits", platform: "PC" 
        },
        
        // --- НОВЫЕ И ОБНОВЛЕННЫЕ ИГРЫ ---
        "winx": { 
            title: "Winx Club: The Magic is Back", cover: "img/covers/winx.png", 
            rating: "Ожидание", year: 2026, genre: "Приключения / Магия", 
            developer: "Rainbow", platform: "PC" 
        },
        "valorant": {
            title: "VALORANT", cover: "img/covers/valorant.webp",
            rating: "Бесплатно", year: 2020, genre: "Тактический шутер",
            developer: "Riot Games", platform: "PC"
        },
        "abyssus": {
            title: "Abyssus", cover: "img/covers/abyssus.jpg",
            rating: "Ожидание", year: "202X", genre: "Экшен / FPS",
            developer: "DoubleMoose", platform: "PC"
        },
        "burglin' gnomes": {
            title: "Burglin' Gnomes", cover: "img/covers/burglin_gnomes.png",
            rating: "TBA", year: "2024", genre: "Кооп / Аркада",
            developer: "Студия", platform: "PC"
        },
        "content warning": {
            title: "Content Warning", cover: "img/covers/content_warning.jpg",
            rating: "9.0 / 10", year: 2024, genre: "Кооп Хоррор",
            developer: "Skog, Zorro", platform: "PC"
        },
        "cs2": { // Синоним для быстрого вызова
            title: "Counter-Strike 2", cover: "img/covers/cs2.png",
            rating: "Бесплатно", year: 2023, genre: "Тактический шутер",
            developer: "Valve", platform: "PC"
        },
        "stick fight": {
            title: "Stick Fight: The Game", cover: "img/covers/stick_fight.png",
            rating: "9.0 / 10", year: 2017, genre: "Файтинг / Фановая",
            developer: "Landfall", platform: "PC"
        },
        "vrchat": {
            title: "VRChat", cover: "img/covers/vrchat.webp",
            rating: "Бесплатно", year: 2017, genre: "Социальная Песочница",
            developer: "VRChat Inc.", platform: "PC / VR"
        },
        "bendy and the ink factory": {
            title: "Bendy and the Ink Factory", cover: "img/covers/bendy_factory.jpg",
            rating: "Ожидание", year: "202X", genre: "Инди Хоррор",
            developer: "Joey Drew Studios", platform: "PC"
        },
        "bendy: the cage": {
            title: "Bendy: The Cage", cover: "img/covers/bendy_cage.png",
            rating: "Ожидание", year: "2024", genre: "Выживание / Хоррор",
            developer: "Joey Drew Studios", platform: "PC"
        },
        "atomic heart": {
            title: "Atomic Heart", cover: "img/covers/atomic_heart.jpg",
            rating: "8.5 / 10", year: 2023, genre: "Шутер / Экшен",
            developer: "Mundfish", platform: "PC"
        }
    },

    defaultVolume: 30,
    chatMsgLifetime: 15000,
    maxChatMessages: 12,

    // ==========================================
    // НАСТРОЙКИ: Цель (Фолловеры)
    // ==========================================
    goalTarget: 200,             
    goalTitle: "⭐ Фолловеры:",
    goalColor: "#FF4477",        
    goalUpdateInterval: 30000,

    socialRotateTime: 30000,       
    socialNetworks: [
        { id: "telegram", title: "Telegram", handle: "t.me/pizdeckakoi_to", color: "#24A1DE" },
        { id: "tiktok", title: "TikTok", handle: "@_ksusha_sher_", color: "#FF0050" },
        { id: "vk", title: "ВКонтакте", handle: "vk.com/club236843653", color: "#0077FF" }
    ],
    
    tickerInterval: 60000,         
    tickerMessages: [
        "🎵 Пиши !play [ссылка] чтобы заказать трек в очередь",
        "💬 Общайся в чате, задавай вопросы, чувствуй себя как дома",
        "✈️ Подписывайся на Telegram t.me/pizdeckakoi_to, там анонсы и лайф-контент",
        "🛡️ Уважайте друг друга. Токсики и политота отправляются в бан"
    ]
};