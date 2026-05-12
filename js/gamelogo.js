window.AppGameLogo = {
    container: document.getElementById('game-logo-container'),
    imgEl: document.getElementById('game-logo-img'),

    set: function(gameKey) {
        // Если написали !game off или !game hide - прячем логотип
        if (gameKey === "off" || gameKey === "hide" || gameKey === "clear") {
            this.container.classList.add('hidden');
            return;
        }

        // Ищем игру в конфиге
        const imgUrl = window.AppConfig.gameLogos[gameKey];

        if (imgUrl) {
            // Если игра есть, меняем картинку и показываем плашку
            this.imgEl.src = imgUrl;
            this.container.classList.remove('hidden');
            
            // Небольшая анимация "подпрыгивания" при смене игры
            this.container.classList.remove('pop-anim');
            void this.container.offsetWidth; 
            this.container.classList.add('pop-anim');
        } else {
            console.log(`[GameLogo] Логотип для "${gameKey}" не найден в config.js`);
        }
    }
};