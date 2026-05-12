window.AppConfig = {
    channelName: "ksusha__sher",
    allowedUsers: ["bagercaa", "to_be_ang"], 
    // ==========================================
    // НАСТРОЙКИ: Авто-цензура в чате
    // ==========================================
    // Впиши сюда корни или целые слова. Скрипт заблюрит их, не обращая внимания на регистр.
    forbiddenWords: ["негр", "пидор", "даун", "чурка", "хохол", "кацап", "запретка"],

    // ==========================================
    // НАСТРОЙКИ: Логотипы игр над вебкой
    // ==========================================
    // Слева - то, что пишут в чате (!game cs). Справа - путь к картинке в папке.
    gameLogos: {
        "subnautica": "img/games/subnautica.png",
        "repo": "img/games/repo.png",
        "val": "img/games/valorant.png",
        "rl": "img/games/rocketleague.png",
        "jc": "img/games/justchatting.png"
    },

    rewardName: "Заказать видео",
    defaultVolume: 30,
    chatMsgLifetime: 15000,
    maxChatMessages: 12,

    // НОВЫЙ РОЗОВЫЙ ЦВЕТ ДЛЯ GOAL БАРА
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
        "🎁 Оформи платную подписку, чтобы отключить рекламу и получить крутые смайлы",
        "🔊 Модеры могут менять громкость музыки командой !vol [0-100]"
    ]
};