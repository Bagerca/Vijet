window.AppTicker = {
    container: null,

    init: function() {
        this.container = document.getElementById('ticker-text');
        
        if (!window.AppConfig.tickerMessages || window.AppConfig.tickerMessages.length === 0) {
            document.getElementById('ticker-container').style.display = 'none';
            return;
        }

        // Склеиваем сообщения с красивым разделителем
        const separator = '<span class="ticker-separator">✦</span>';
        const fullText = window.AppConfig.tickerMessages.join(separator) + separator;
        this.container.innerHTML = fullText;

        // Устанавливаем скорость анимации
        this.container.style.animationDuration = (window.AppConfig.tickerSpeed || 40) + "s";

        // Слушаем момент, когда анимация прокрутки завершится
        this.container.addEventListener('animationend', () => {
            // Убираем класс, чтобы сбросить позицию
            this.container.classList.remove('scrolling');
            
            // Запускаем таймер до следующего появления
            setTimeout(() => {
                this.run();
            }, window.AppConfig.tickerInterval || 60000);
        });

        // Запускаем первый круг (можно добавить небольшую задержку при старте стрима)
        setTimeout(() => {
            this.run();
        }, 5000); // Строка поедет через 5 секунд после загрузки оверлея
    },

    run: function() {
        // Добавление этого класса запускает анимацию в CSS
        this.container.classList.add('scrolling');
    }
};

window.AppTicker.init();