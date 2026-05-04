window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    isReady: false,

    init: function() {
        this.yt = new YT.Player('yt-player', {
            playerVars: {
                'autoplay': 1,
                'controls': 0,      // Убираем элементы управления
                'disablekb': 1,     // Отключаем клавиатуру
                'modestbranding': 1 // Убираем логотип Ютуба
            },
            events: {
                'onReady': () => { 
                    this.isReady = true;
                    this.yt.setVolume(window.AppConfig.defaultVolume);
                    console.log("[Player] YouTube API Готов");
                },
                'onStateChange': this.onStateChange.bind(this),
                'onError': this.onError.bind(this)
            }
        });
    },

    play: function(videoId, user) {
        if (!this.isReady) return;
        
        // Обновляем текст на плашке
        this.nameLabel.innerText = user;
        
        // Показываем виджет
        this.container.classList.remove('hidden');
        
        // Загружаем и включаем видео
        this.yt.loadVideoById(videoId);
    },

    hide: function() {
        this.container.classList.add('hidden');
        if (this.isReady && this.yt.stopVideo) {
            this.yt.stopVideo();
        }
    },

    setVolume: function(vol) {
        if (this.isReady) {
            let safeVol = Math.max(0, Math.min(100, parseInt(vol) || window.AppConfig.defaultVolume));
            this.yt.setVolume(safeVol);
            console.log(`[Player] Громкость: ${safeVol}%`);
        }
    },

    onStateChange: function(event) {
        // YT.PlayerState.ENDED == 0 (видео закончилось)
        if (event.data === 0) {
            window.AppQueue.next();
        }
    },

    onError: function(event) {
        console.error(`[Player] Ошибка воспроизведения (Код: ${event.data}). Скипаем...`);
        // Пропускаем проблемное видео
        window.AppQueue.next();
    }
};

// Системная функция, которую вызывает сам YouTube Iframe API при загрузке скрипта
function onYouTubeIframeAPIReady() {
    window.AppPlayer.init();
}