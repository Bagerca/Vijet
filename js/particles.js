/* ФАЙЛ: js/particles.js */
/* ================= ФОНОВЫЕ ЧАСТИЦЫ (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ) ================= */

window.AppParticles = {
    canvas: document.getElementById('particles-canvas'),
    ctx: null,
    particlesArray: [],
    animationId: null,
    
    settings: {
        count: 80,
        speed: 1.0,
        distance: 120,
        color: '#ffffff'
    },

    // Кэшированные значения для избежания лишних расчетов
    cachedRgb: { r: 255, g: 255, b: 255 },
    lastHexColor: '#ffffff',

    init: function() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d', { alpha: true }); // alpha: true для прозрачного фона
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => {
            if (state.particles) {
                const oldSettings = JSON.stringify(this.settings);
                this.settings = { ...this.settings, ...state.particles };
                
                if (JSON.parse(oldSettings).count !== this.settings.count) {
                    this.initParticles();
                }
            }
        });

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

    hexToRgbCached: function(hex) {
        if (hex === this.lastHexColor) return this.cachedRgb;
        
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            this.cachedRgb = {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            };
            this.lastHexColor = hex;
        }
        return this.cachedRgb;
    },

    initParticles: function() {
        this.particlesArray = [];
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
        
        const rgb = this.hexToRgbCached(this.settings.color);
        const speedMult = this.settings.speed;
        const linkDist = this.settings.distance;
        const linkDistSq = linkDist * linkDist; // Используем квадрат для быстрой отбраковки

        // ==========================================
        // 1. ОПТИМИЗАЦИЯ: Батчинг отрисовки точек
        // ==========================================
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
        this.ctx.beginPath(); // Начинаем единый путь для всех точек

        for (let i = 0; i < this.particlesArray.length; i++) {
            let p = this.particlesArray[i];

            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Рисуем кружок. Важно сделать moveTo, чтобы круги не соединялись линиями
            this.ctx.moveTo(p.x + p.radius, p.y);
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }
        this.ctx.fill(); // Отрисовываем ВСЕ точки одним вызовом видеокарты!
        this.ctx.shadowBlur = 0; // Сбрасываем тень для линий

        // ==========================================
        // 2. ОПТИМИЗАЦИЯ: Батчинг линий (Группировка по прозрачности)
        // ==========================================
        const BUCKET_COUNT = 20; // 20 уровней прозрачности для идеальной плавности
        const MAX_OPACITY = 0.4;
        
        // Создаем массив плоских массивов для избежания Garbage Collection
        const lineBuckets = Array.from({length: BUCKET_COUNT}, () => []);

        for (let a = 0; a < this.particlesArray.length; a++) {
            let p1 = this.particlesArray[a];
            
            for (let b = a + 1; b < this.particlesArray.length; b++) {
                let p2 = this.particlesArray[b];
                
                let dx = p1.x - p2.x;
                let dy = p1.y - p2.y;
                let distSq = dx * dx + dy * dy;

                // Быстрая отбраковка без Math.sqrt
                if (distSq < linkDistSq) {
                    let distance = Math.sqrt(distSq); // Вычисляем корень только для нужных точек
                    
                    let opacity = 1 - (distance / linkDist);
                    opacity *= MAX_OPACITY; // Глобальный множитель яркости
                    
                    // Вычисляем номер корзины (от 0 до 19)
                    let bucketIndex = Math.floor((opacity / MAX_OPACITY) * BUCKET_COUNT);
                    if (bucketIndex >= BUCKET_COUNT) bucketIndex = BUCKET_COUNT - 1;
                    if (bucketIndex < 0) continue;

                    // Кладем координаты в плоский массив (4 числа = 1 линия)
                    lineBuckets[bucketIndex].push(p1.x, p1.y, p2.x, p2.y);
                }
            }
        }

        // Отрисовка всех линий максимум за 20 вызовов stroke()
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < BUCKET_COUNT; i++) {
            let bucket = lineBuckets[i];
            if (bucket.length === 0) continue;
            
            // Вычисляем среднюю прозрачность для этой корзины
            let alpha = (i / BUCKET_COUNT) * MAX_OPACITY + (MAX_OPACITY / BUCKET_COUNT / 2);
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

            // Достаем координаты по 4 штуки
            for (let j = 0; j < bucket.length; j += 4) {
                this.ctx.moveTo(bucket[j], bucket[j+1]);
                this.ctx.lineTo(bucket[j+2], bucket[j+3]);
            }
            
            this.ctx.stroke(); // Рисуем все линии этого уровня прозрачности разом
        }

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    },

    spawnBurst: function(amount) {
        if (!this.canvas) return;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        for (let i = 0; i < amount; i++) {
            this.particlesArray.push({
                x: cx, y: cy,
                radius: Math.random() * 3 + 1,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15
            });
        }
    }
};

window.AppParticles.init();