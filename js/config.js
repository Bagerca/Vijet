window.AppConfig = {
    channelName: "ksusha__sher",
    allowedUsers: ["bagercaa", "to_be_ang"], 
    
    forbiddenWords: ["негр", "пидор", "даун", "чурка", "хохол", "кацап", "запретка"],

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

    gamesDatabase: {
        "subnautica": { 
            title: "Subnautica", cover: "img/covers/subnautica.jpg", 
            rating: "9.5 / 10", year: 2018, genre: "Выживание", 
            developer: "Unknown Worlds", platform: "PC" 
        },
        "subnautica 2": { 
            title: "Subnautica 2", cover: "img/covers/subnautica_2.jpg", 
            rating: "Ожидание", year: 2025, genre: "Выживание", 
            developer: "Unknown Worlds", platform: "PC" 
        },
        "lethal company": { 
            title: "Lethal Company", cover: "img/covers/lethal_company.jpg", 
            rating: "9.0 / 10", year: 2023, genre: "Кооп Хоррор", 
            developer: "Zeekerss", platform: "PC" 
        },
        "repo": { 
            title: "R.E.P.O.", cover: "img/covers/repo.jpg", 
            rating: "8.5 / 10", year: 2024, genre: "Экшен / Хоррор", 
            developer: "Студия", platform: "PC" 
        },
        "winx": { 
            title: "Winx Club", cover: "img/covers/winx.jpg", 
            rating: "10 / 10 (Легенда)", year: 2006, genre: "Приключения", 
            developer: "Konami", platform: "PC / PS2" 
        },
        "minecraft": { 
            title: "Minecraft", cover: "img/covers/minecraft.jpg", 
            rating: "10 / 10", year: 2011, genre: "Песочница", 
            developer: "Mojang", platform: "PC" 
        },
        "dome keeper": { 
            title: "Dome Keeper", cover: "img/covers/dome_keeper.jpg", 
            rating: "8.8 / 10", year: 2022, genre: "Рогалик", 
            developer: "Bippinbits", platform: "PC" 
        }
    },

    defaultVolume: 30,
    chatMsgLifetime: 15000,
    maxChatMessages: 12,

    // ==========================================
    // НАСТРОЙКИ: Цель (Фолловеры)
    // ==========================================
    goalTarget: 200,             // Изменено на 200
    goalTitle: "⭐ Фолловеры:",
    goalColor: "#FF4477",        // ВЕРНУЛ ЦВЕТ!
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