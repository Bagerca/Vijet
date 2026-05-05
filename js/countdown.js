window.AppCountdown = {
    timerEl: document.getElementById('starting-timer'),
    minutes: 5, // Сколько минут идет отсчет
    seconds: 0,
    interval: null,

    init: function() {
        // Запускаем таймер ТОЛЬКО если мы на сцене приветствия
        if (!document.body.classList.contains('scene-starting')) return;

        this.updateDisplay();
        
        this.interval = setInterval(() => {
            if (this.seconds === 0) {
                if (this.minutes === 0) {
                    clearInterval(this.interval);
                    this.timerEl.innerText = "ПОГНАЛИ!";
                    this.timerEl.style.color = "#00FF7F"; // Зеленый при окончании
                    this.timerEl.style.textShadow = "0 0 40px rgba(0, 255, 127, 0.8)";
                    return;
                }
                this.minutes--;
                this.seconds = 59;
            } else {
                this.seconds--;
            }
            this.updateDisplay();
        }, 1000);
    },

    updateDisplay: function() {
        const m = this.minutes < 10 ? "0" + this.minutes : this.minutes;
        const s = this.seconds < 10 ? "0" + this.seconds : this.seconds;
        this.timerEl.innerText = `${m}:${s}`;
    }
};

// Запуск
setTimeout(() => window.AppCountdown.init(), 1000);