window.AppConfig = {
    channelName: "ksusha__sher",
    allowedUsers: ["bagercaa", "to_be_ang"], 
    
    // ==========================================
    // НАСТРОЙКИ: Авто-цензура в чате
    // ==========================================
    forbiddenWords: ["негр", "пидор", "даун", "чурка", "хохол", "кацап", "запретка"],

    // ==========================================
    // НАСТРОЙКИ: Пиксельный Питомец
    // ==========================================
    petEnabled: true,
    petSleepTimeout: 120, // Через сколько СЕКУНД тишины в чате питомец уснет (Zzz)

    // ==========================================
    // НАСТРОЙКИ: Анимации смайликов (Летящие эмодзи)
    // ==========================================
    emotesEnabled: true,      
    emotesMaxPerMessage: 150, 
    emotesMode: "bubble",     

// ==========================================
    // НАСТРОЙКИ: Голосовая озвучка (TTS)
    // ==========================================
    ttsEnabled: true,         
    ttsVolume: 60,            
    ttsMaxLength: 150,        
    ttsRewardName: "Озвучить сообщение", 

    // КАСТОМНЫЕ ГОЛОСА ДЛЯ КОНКРЕТНЫХ ЛЮДЕЙ
    // pitch: тональность (от 0.1 до 2.0, где 1.0 - норма)
    // rate: скорость (от 0.1 до 2.0, где 1.0 - норма)
    ttsCustomVoices: {
        "bagercaa": { pitch: 0.2, rate: 0.8 }, // Очень низкий и медленный голос (Демон)
        "to_be_ang": { pitch: 2.0, rate: 1.3 }, // Высокий и быстрый голос (Бурундук)
        // Можно добавить мужской голос, если он установлен в Windows:
        // "какойто_ник": { pitch: 1.0, rate: 1.0, voiceName: "Pavel" } 
    },

    // ==========================================
    // НАСТРОЙКИ: Логотипы игр над вебкой
    // ==========================================
    gameLogos: {
        "subnautica": "img/games/subnautica.png",
        "repo": "img/games/repo.png",
        "lethal_company": "img/games/lethal_company.png",
        "burglin_gnomes": "img/games/burglin_gnomes.png",
        "winx": "img/games/winx_club_the_magic_is_back.png"
    },

    rewardName: "Заказать видео",
    defaultVolume: 30,
    chatMsgLifetime: 15000,
    maxChatMessages: 12,

    goalTarget: 500,
    goalTitle: "⭐ Фолловеры:",
    goalColor: "#FF4477", 
    goalUpdateInterval: 30000,

    socialRotateTime: 30000,       
    socialNetworks: [
        { id: "telegram", title: "Telegram", handle: "t.me/pizdeckakoi_to", color: "#24A1DE" },
        { id: "tiktok", title: "TikTok", handle: "@_ksusha_sher_", color: "#FF0050" },
        { id: "vk", title: "ВКонтакте", handle: "vk.com/club236843653", color: "#0077FF" }
    ],

    alertDuration: 5000,           
    shoutoutDuration: 8000,        

    tickerSpeed: 40,               
    tickerInterval: 60000,         
    tickerMessages: [
        "🎵 Пиши !play [ссылка] чтобы заказать трек в очередь",
        "💬 Общайся в чате, задавай вопросы, чувствуй себя как дома",
        "✈️ Подписывайся на Telegram t.me/pizdeckakoi_to, там анонсы и лайф-контент",
        "🛡️ Уважайте друг друга. Токсики и политота отправляются в бан",
        "💎 Используй баллы канала, чтобы заказать видео вне очереди",
        "🔊 Модеры могут менять громкость музыки командой !vol [0-100]"
    ]
};