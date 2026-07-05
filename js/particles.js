/* ФАЙЛ: js/particles.js */
/* ================= ФОНОВЫЕ ЧАСТИЦЫ (СОЗВЕЗДИЯ / NETWORK) ================= */

window.AppParticles = {
    canvas: document.getElementById('particles-canvas'),
    ctx: null,
    particlesArray: [],
    animationId: null,
    
    // Настройки по умолчанию (перезапишутся из Ядра)
    settings: {
        count: 80,
        speed: 1.0,
        distance: 120,
        color: '#ffffff'
    },

    init: function() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Слушаем настройки из Ядра
        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => {
            if (state.particles) {
                const oldSettings = JSON.stringify(this.settings);
                this.settings = { ...this.settings, ...state.particles };
                
                // Пересоздаем частицы только если изменилось их количество
                if (JSON.parse(oldSettings).count !== this.settings.count) {
                    this.initParticles();
                }
            }
        });

        // Слушаем изменения в реальном времени от пульта модератора
        window.AppEvents.listen('PARTICLES_UPDATE_SETTINGS', newSettings => {
            const oldCount = this.settings.count;
            this.settings = { ...this.settings, ...newSettings };
            if (oldCount !== this.settings.count) this.initParticles();
        });

        this.initParticles();
        this.animate();
    },

    resize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    // Конвертация HEX в RGB для управления прозрачностью линий
    hexToRgb: function(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    },

    initParticles: function() {
        this.particlesArray = [];
        // Ограничиваем максимум для защиты от лагов OBS
        const maxParticles = Math.min(this.settings.count, 150); 
        
        for (let i = 0; i < maxParticles; i++) {
            this.particlesArray.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5
            });
        }
    },

    animate: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const rgb = this.hexToRgb(this.settings.color);
        const speedMult = this.settings.speed;
        const linkDist = this.settings.distance;

        // Обновление и отрисовка точек
        for (let i = 0; i < this.particlesArray.length; i++) {
            let p = this.particlesArray[i];

            // Движение с учетом множителя скорости
            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;

            // Отскок от краев экрана
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Отрисовка самой точки с легким свечением
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // Сбрасываем тень для линий
        }

        // Отрисовка линий созвездий (O(N^2) сложность)
        for (let a = 0; a < this.particlesArray.length; a++) {
            for (let b = a + 1; b < this.particlesArray.length; b++) {
                let p1 = this.particlesArray[a];
                let p2 = this.particlesArray[b];
                
                let dx = p1.x - p2.x;
                let dy = p1.y - p2.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < linkDist) {
                    // Чем ближе точки, тем ярче линия
                    let opacity = 1 - (distance / linkDist);
                    // Снижаем общую яркость линий, чтобы они не перекрывали текст
                    opacity *= 0.4; 

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    },

    // Функция для эффекта колеса фортуны (взрыв частиц)
    spawnBurst: function(amount) {
        if (!this.canvas) return;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        for (let i = 0; i < amount; i++) {
            this.particlesArray.push({
                x: cx, y: cy,
                radius: Math.random() * 3 + 1,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 100 // Временные частицы можно добавить позже
            });
        }
    }
};

window.AppParticles.init();