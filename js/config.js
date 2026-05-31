/* ================= ОСНОВНОЙ КОНФИГ СИСТЕМЫ ================= */
window.AppConfig = {
    channelName: "ksusha__sher",
    allowedUsers: ["bagercaa", "to_be_ang", "treebals"], 
    
    // ==========================================
    // СЛОВАРЬ ЗАПРЕТОК (Twitch TOS)
    // Достаточно указать "корни" слов. Умный фильтр сам найдет их, 
    // даже если напишут "п и д 0 р", "н.е_г-р", "x 0 x 0 л" и т.д.
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
    // НАГРАДЫ ЗА БАЛЛЫ КАНАЛА
    // Впиши точные названия наград с Twitch
    // ==========================================
    rewards: {
        series: "Сериал", movie: "Фильм", video: "Видео", game: "Игры", music: "Музыка"
    },

    rewardName: "Заказать видео",
    ttsRewardName: "Озвучить сообщение", 
    feedRewardName: "Покормить лису", 
    wheelRewardName: "Добавить в рулетку", 

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
    petSleepTimeout: 120, // Секунды до сна в тишине

    emotesEnabled: true,      
    emotesMaxPerMessage: 150, 
    emotesMode: "bubble", // "bubble" или "fountain"    

    defaultVolume: 30, // Громкость плеера YouTube при старте
    
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
    goalTitle: "⭐ Фолловеры:",
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
    tickerSpeed: 120, // Скорость прокрутки (пикселей в секунду)
    tickerMessages: [
        "<span class='t-highlight'>МУЗЫКА</span> Пиши !play [ссылка] чтобы заказать трек в очередь. Заставим лису танцевать!",
        "<span class='t-highlight'>ПИТОМЕЦ</span> Лиса спит, если в чате тишина. Каждая смерть на стриме делает её более нервной (!death)",
        "<span class='t-highlight'>ПРАВИЛА</span> Уважайте друг друга. Токсики и политика моментально отправляются в бан-лист.",
        "<span class='t-highlight'>TELEGRAM</span> Анонсы, мемы и лайф-контент ищи здесь: <span style='color: #fff;'>t.me/pizdeckakoi_to</span>",
        "<span class='t-highlight'>ИНТЕРАКТИВ</span> Испытай удачу! Закажи добавление игры в колесо фортуны за баллы канала."
    ]
};