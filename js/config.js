/* ================= ОСНОВНОЙ КОНФИГ СИСТЕМЫ ================= */
window.AppConfig = {
    channelName: "ksusha__sher",
    allowedUsers: ["bagercaa", "to_be_ang", "treebals"], 
    
    // ==========================================
    // КАСТОМНЫЕ СТИЛИ ПОЛЬЗОВАТЕЛЕЙ (UI Баблы)
    // Ключ: никнейм (маленькими буквами). Значение: ID стиля (используется в CSS).
    // ==========================================
    customChatStyles: {
        "ksusha__sher": "neon_owner",
        "bagercaa": "hollow_knight",
        "kiriika1": "minecraft",
        "kiriika11": "minecraft",
        "to_be_ang": "angel",
        "dragonsmaddison": "bendy",
        "darkl1us": "tactical",
        "tetlabot": "terminal",
        "treebals": "terminal"
    },

    // ==========================================
    // СЛОВАРЬ ЗАПРЕТОК (Twitch TOS)
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

    // ==========================================
    // ЗВУКИ И АЛЕРТЫ
    // ==========================================
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

    // ==========================================
    // НАГРАДЫ ЗА БАЛЛЫ КАНАЛА (Используем уникальные ID наград)
    // ==========================================
    rewards: {
        series: "70eee76b-c0c8-4d53-a306-b62d607a0454", // Сериалы (буквы З / Р)
        movie: "c6e13d1e-627c-460c-8ecc-3ed0e6e4bbd3",  // Фильмы (буквы Фильм / Щ)
        video: "d9669af3-a984-4830-bbd9-70f328397b35",  // Видео (буквы Видео / К)
        game: "04b6b849-4b41-4f70-ba4d-79db4625af68",   // Игры (буквы Игры / Ц)
        music: "72160fcc-a6d8-4692-9447-b05ed67ee33b"   // Музыка (буквы Музыка / И)
    },

    // Наград на плеер (радио), кормление, рулетку и отдельную озвучку пока нет (оставляем null):
    queueRewardId: null, 
    ttsRewardId: null, 
    feedRewardId: null, 
    wheelRewardId: null, 

    // ==========================================
    // КОЛЕСО ФОРТУНЫ
    // ==========================================
    wheelSpinTime: 8, 
    wheelColors: ["#FF4477", "#ffffff", "#1a1a25", "#00E5FF"], 
    wheelMaxItems: 15, 

    // ==========================================
    // ВИДЖЕТЫ (Питомец, Эмодзи, Музыка, Чат)
    // ==========================================
    petEnabled: true,
    petSleepTimeout: 120,

    emotesEnabled: true,      
    emotesMaxPerMessage: 150, 
    emotesMode: "bubble",    

    defaultVolume: 30,
    
    chatMsgLifetime: 15000,
    maxChatMessages: 12,

    // ==========================================
    // ОЗВУЧКА СООБЩЕНИЙ (TTS)
    // ==========================================
    ttsEnabled: true,         
    ttsVolume: 100,            
    ttsMaxLength: 150,        

    ttsCustomVoices: {
        "bagercaa": { pitch: 0.2, rate: 0.8 }, 
        "to_be_ang": { pitch: 2.0, rate: 1.3 }
    },

    // ==========================================
    // ЦЕЛЬ (ФОЛЛОВЕРЫ)
    // ==========================================
    goalTarget: 200,             
    goalTitle: "Фолловеры:",
    goalColor: "#FF4477",        
    goalUpdateInterval: 30000,

    // ==========================================
    // РОТАТОР СОЦСЕТЕЙ И БЕГУЩАЯ СТРОКА 2.0
    // ==========================================
    socialRotateTime: 30000,       
    socialNetworks: [
        { id: "telegram", title: "Telegram", handle: "t.me/pizdeckakoi_to", color: "#24A1DE" },
        { id: "tiktok", title: "TikTok", handle: "@_ksusha_sher_", color: "#FF0050" },
        { id: "vk", title: "ВКонтакте", handle: "vk.com/club236843653", color: "#0077FF" }
    ],
    
    tickerInterval: 60000, 
    tickerSpeed: 120,
    
    tickerMessages: [
        "<span class='t-highlight'>МУЗЫКА</span> Пиши !play [ссылка] чтобы заказать трек в очередь. Заставим лису танцевать!",
        "<span class='t-highlight'>ПРАВИЛА</span> Уважайте друг друга. Токсики и политика моментально отправляются в бан-лист.",
        "<span class='t-highlight'>TELEGRAM</span> Анонсы, мемы и лайф-контент ищи здесь: <span style='color: #fff;'>t.me/pizdeckakoi_to</span>",
        "<span class='t-highlight'>ОЗВУЧКА</span> В чате работает бот-диктор (TTS). Закажи озвучку своего сообщения за баллы.",
        "<span class='t-highlight'>СОВЕТ</span> Спойлеры к играм караются временным мутом (таймаутом). Дайте мне насладиться сюжетом!",
        "<span class='t-highlight'>УЮТ</span> Главное правило стрима: чай должен быть горячим, а чат — добрым.",
        "<span class='t-highlight'>VIP</span> Модераторы и VIP-зрители имеют уникальный дизайн сообщений на экране.",
        "<span class='t-highlight'>VK</span> Группа ВКонтакте: <span style='color: #fff;'>vk.com/club236843653</span> — Подписывайся, чтобы не теряться!",
        "<span class='t-highlight'>TIKTOK</span> Клипы, фейлы и смешные моменты ищи в TikTok: <span style='color: #fff;'>@_ksusha_sher_</span>",
        "<span class='t-highlight'>ПОДДЕРЖКА</span> Оформив платную подписку, ты получаешь уникальный бейдж и мою безграничную любовь 💜",
        "<span class='t-highlight'>СТРИК</span> Приходи на стримы чаще! Смотри трансляции подряд, чтобы набить стрик зрителя.",
        "<span class='t-highlight'>ЦЕЛЬ</span> Помоги добить полоску фолловеров внизу экрана. Каждый новый зритель важен!",
        "<span class='t-highlight'>СИСТЕМА</span> Анализ уровня токсичности чата... Уровень в норме. Продолжаем трансляцию.",
        "<span class='t-highlight'>ВНИМАНИЕ</span> Стример может тупить, не замечать очевидного и забывать, куда идти. Это фича, а не баг.",
        "<span class='t-highlight'>ОПРОС</span> Что лучше: пицца или суши? Пиши свой ответ в чат прямо сейчас!",
        "<span class='t-highlight'>ФАКТ</span> 99% зрителей забывают поставить лайк/фоллоу. Докажи, что ты из 1% элиты!"
    ]
};