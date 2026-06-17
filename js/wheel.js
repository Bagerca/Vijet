/* ================= КОЛЕСО ФОРТУНЫ (DUMB WIDGET) ================= */
window.AppWheel = {
    overlay: document.getElementById('wheel-overlay'),
    canvas: document.getElementById('wheel-canvas'),
    winnerEl: document.getElementById('wheel-winner'),
    winnerName: document.getElementById('winner-name'),
    
    ctx: null,
    items: [],
    colors: window.AppConfig.wheelColors || ["#FF4477", "#ffffff", "#1a1a25", "#00E5FF"],
    isSpinning: false,
    currentRotation: 0,
    isVisible: false,

    init: function() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 600 * dpr;
        this.canvas.height = 600 * dpr;
        this.ctx.scale(dpr, dpr);

        // Больше никакого localStorage. Ждем команды от Ядра!
        window.AppEvents.listen('WHEEL_UPDATE_UI', d => {
            this.items = d.items || [];
            this.draw();
        });

        window.AppEvents.listen('WHEEL_TOGGLE', d => this.toggle(d.state));
        window.AppEvents.listen('WHEEL_CMD', d => { 
            if(d.cmd === 'spin') this.spin(); 
        });

        this.draw();

        this.canvas.addEventListener('transitionend', () => {
            if (this.isSpinning) this.onSpinEnd();
        });
    },

    toggle: function(forceState) {
        this.isVisible = forceState !== undefined ? forceState : !this.isVisible;
        if (this.isVisible) {
            this.overlay.classList.remove('hidden');
            this.winnerEl.classList.add('hidden'); 
            this.draw();
            if(window.AppParticles && typeof window.AppParticles.spawnBurst === 'function') {
                window.AppParticles.spawnBurst(50);
            }
        } else {
            this.overlay.classList.add('hidden');
            this.winnerEl.classList.add('hidden');
        }
    },

    draw: function() {
        if (!this.ctx) return;
        const w = 600; const h = 600;
        const cx = w / 2; const cy = h / 2; const radius = w / 2;

        this.ctx.clearRect(0, 0, w, h);

        if (this.items.length === 0) {
            this.ctx.fillStyle = "rgba(0,0,0,0.1)";
            this.ctx.beginPath(); this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI); this.ctx.fill();
            this.ctx.fillStyle = "#fff"; this.ctx.textAlign = "center"; this.ctx.font = "bold 24px Montserrat";
            this.ctx.fillText("Пусто", cx, cy + 8);
            return;
        }

        const sliceAngle = (2 * Math.PI) / this.items.length;
        let startAngle = -Math.PI / 2 - (sliceAngle / 2);
        let fontSize = Math.min(28, Math.max(12, (radius * sliceAngle) / 2));

        for (let i = 0; i < this.items.length; i++) {
            let colorIndex = i % this.colors.length;
            if (i === this.items.length - 1 && colorIndex === 0 && this.items.length % this.colors.length === 1) colorIndex = 1; 

            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            this.ctx.fillStyle = this.colors[colorIndex];
            this.ctx.fill();
            this.ctx.strokeStyle = "rgba(255,255,255,0.2)";
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = "right";
            
            const isWhite = this.colors[colorIndex].toLowerCase() === "#ffffff";
            this.ctx.fillStyle = isWhite ? "#1a1a1a" : "#ffffff";
            this.ctx.font = `900 ${fontSize}px Montserrat`;
            
            let text = this.items[i];
            if (text.length > 20) text = text.substring(0, 18) + "...";

            this.ctx.fillText(text, radius - 40, fontSize/3);
            this.ctx.restore();

            startAngle += sliceAngle;
        }
    },

    spin: function() {
        if (this.isSpinning || this.items.length < 2) return;
        this.isSpinning = true;
        this.winnerEl.classList.add('hidden');

        const randomSpins = 5 + Math.random() * 5;
        this.currentRotation += randomSpins * 360;

        const duration = window.AppConfig.wheelSpinTime || 8;
        this.canvas.style.transition = `transform ${duration}s cubic-bezier(0.15, 0.9, 0.25, 1)`;
        this.canvas.style.transform = `rotate(${this.currentRotation}deg)`;
    },

    onSpinEnd: function() {
        this.isSpinning = false;
        
        const modRot = this.currentRotation % 360; 
        const localAngle = (360 - modRot) % 360;
        const sectorSize = 360 / this.items.length;
        
        const adjustedAngle = (localAngle + (sectorSize / 2)) % 360;
        const winnerIndex = Math.floor(adjustedAngle / sectorSize);
        const winnerText = this.items[winnerIndex];

        this.winnerName.innerText = winnerText;
        this.winnerEl.classList.remove('hidden');

        // Отправляем сигнал Ядру установить эту игру в плашку медиа
        setTimeout(() => {
            // Чтобы обновить Ядро, вызываем команду через Event Bus (эмуляция команды чата)
            window.AppCommands.execute("СИСТЕМА", "game", winnerText, {broadcaster: true});
        }, 1000); 
    }
};