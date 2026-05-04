window.AppQueue = {
    items: [],
    isPlaying: false,

    // Добавить видео в очередь
    add: function(url, user) {
        const videoId = this.extractId(url);
        if (videoId) {
            this.items.push({ id: videoId, user: user });
            console.log(`[Queue] Добавлено видео ${videoId} от ${user}`);
            
            // Если сейчас ничего не играет - запускаем
            if (!this.isPlaying) {
                this.next();
            }
        } else {
            console.warn(`[Queue] Не удалось найти ID YouTube в сообщении: ${url}`);
        }
    },

    // Включить следующее видео
    next: function() {
        if (this.items.length > 0) {
            this.isPlaying = true;
            const nextVideo = this.items.shift(); // Берем первое из очереди
            window.AppPlayer.play(nextVideo.id, nextVideo.user);
        } else {
            // Очередь пуста
            this.isPlaying = false;
            window.AppPlayer.hide();
        }
    },

    // Очистить очередь
    clear: function() {
        this.items = [];
        this.next(); // Вызовет остановку, так как массив теперь пуст
        console.log("[Queue] Очередь очищена");
    },

    // Парсер ссылок (понимает обычные ссылки, шортсы, мобильные ссылки)
    extractId: function(url) {
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }
};