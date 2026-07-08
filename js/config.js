/* ФАЙЛ: js/config.js */
/* ================= ОСНОВНОЙ КОНФИГ СИСТЕМЫ ================= */
window.AppConfig = {
    channelName: "ksusha__sher",
    botChannel: "bagercaa",
    allowedUsers: ["bagercaa", "to_be_ang", "treebals"], 
    
    customChatStyles: {
        "ksusha__sher": "neon_owner",
        "bagercaa": "hollow_knight",
        "kiriika1": "minecraft",
        "kiriika11": "minecraft",
        "to_be_ang": "angel",
        "dragonsmaddison": "bendy",
        "darkl1us": "tactical"
    },

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

    rewards: { series: "Сериал", movie: "Фильм", video: "Видео", game: "Игры", music: "Музыка" },
    rewardName: "Заказать видео",
    ttsRewardName: "Озвучить сообщение", 
    feedRewardName: "Покормить лису", 
    wheelRewardName: "Добавить в рулетку", 

    wheelSpinTime: 8, 
    wheelColors: ["#FF4477", "#ffffff", "#1a1a25", "#00E5FF"], 
    wheelMaxItems: 15, 

    petEnabled: true,
    petSleepTimeout: 120,

    emotesEnabled: true,      
    emotesMaxPerMessage: 150, 
    emotesMode: "bubble",    

    defaultVolume: 30,
    chatMsgLifetime: 15000,
    maxChatMessages: 12,

    ttsEnabled: true,         
    ttsVolume: 100,            
    ttsMaxLength: 150,        
    ttsCustomVoices: {
        "bagercaa": { pitch: 0.2, rate: 0.8 }, 
        "to_be_ang": { pitch: 2.0, rate: 1.3 }
    },

    goalTarget: 200,             
    goalTitle: "Фолловеры:",
    goalColor: "#FF4477",        
    goalUpdateInterval: 30000,

    socialRotateTime: 30000,       
    socialNetworks: [
        { id: "telegram", title: "Telegram", handle: "t.me/pizdeckakoi_to", color: "#24A1DE" },
        { id: "tiktok", title: "TikTok", handle: "@_ksusha_sher_", color: "#FF0050" },
        { id: "vk", title: "ВКонтакте", handle: "vk.com/club236843653", color: "#0077FF" }
    ],
    
    tickerInterval: 60000, 
    tickerSpeed: 120,
    tickerMessages: [
        "<span class='t-highlight'>МУЗЫКА</span> Пиши !play [ссылка] чтобы заказать трек в очередь.",
        "<span class='t-highlight'>ПРАВИЛА</span> Уважайте друг друга. Токсики отправляются в бан-лист.",
        "<span class='t-highlight'>TELEGRAM</span> Анонсы и мемы: <span style='color: #fff;'>t.me/pizdeckakoi_to</span>"
    ],

    // ==========================================
    // НАСТРОЙКИ MOD DECK
    // ==========================================
    modDeck: {
        themes: [
            { cmd: "default", name: "🟢 Дефолт (Неон)" },
            { cmd: "нуар", name: "🕵️‍♂️ Нуар (Комикс)" },
            { cmd: "цирк", name: "🎪 Цифровой Цирк" }
        ],
        alerts: [
            { cmd: "alert sub", name: "⭐ Обычная подписка" },
            { cmd: "alert resub", name: "🔥 Продление (Ресаб)" },
            { cmd: "alert gift", name: "🎁 Подарочная подписка" },
            { cmd: "alert streak", name: "📺 Стрик просмотра" },
            { cmd: "alert follow", name: "💖 Новый фолловер" },
            { group: "Награды за баллы" },
            { cmd: "alert series", name: "🎬 Заказ сериала" },
            { cmd: "alert movie", name: "🍿 Заказ фильма" },
            { cmd: "alert video", name: "📺 Заказ видео" },
            { cmd: "alert game", name: "🎮 Заказ игры" },
            { cmd: "alert music", name: "🎵 Заказ музыки" }
        ],
        // НОВОЕ: Soundboard (Звуковая панель)
        soundboard: [
            { id: "bruh", name: "🥁 Бадум-тсс", path: "sounds/bruh.mp3" },
            { id: "cricket", name: "🦗 Сверчок", path: "sounds/crickets.mp3" },
            { id: "fail", name: "🎺 Провал", path: "sounds/fail.mp3" },
            { id: "wow", name: "✨ Вау", path: "sounds/wow.mp3" },
            { id: "run", name: "🏃 Run", path: "sounds/run.mp3" },
            { id: "nani", name: "❓ Nani?!", path: "sounds/nani.mp3" }
        ]
    }
};