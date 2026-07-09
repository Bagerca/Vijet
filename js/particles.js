/* ФАЙЛ: js/particles.js */
/* ================= ФОНОВЫЕ ЧАСТИЦЫ (SPRITE-RENDERING OPTIMIZATION) ================= */

window.AppParticles = {
    canvas: document.getElementById('particles-canvas'),
    ctx: null,
    particlesArray: [],
    animationId: null,
    
    // Off-screen canvas для кэширования свечения (Спасет GPU от смерти)
    spriteCanvas: null,
    spriteCtx: null,
    
    settings: { count: 80, speed: 1.0, distance: 120, color: '#ffffff' },
    cachedRgb: { r: 255, g: 255, b: 255 },
    lastHexColor: '#ffffff',

    init: function() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        // Создаем скрытый холст для спрайта
        this.spriteCanvas = document.createElement('canvas');
        this.spriteCtx = this.spriteCanvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        window.AppEvents.listen('STATE_SYNC_RESPONSE', state => {
            if (state.particles) {
                const oldSettings = JSON.stringify(this.settings);
                this.settings = { ...this.settings, ...state.particles };
                if (JSON.parse(oldSettings).count !== this.settings.count) this.initParticles();
                if (JSON.parse(oldSettings).color !== this.settings.color) this.preRenderSprite();
            }
        });

        window.AppEvents.listen('PARTICLES_UPDATE_SETTINGS', newSettings => {
            const oldCount = this.settings.count;
            const oldColor = this.settings.color;
            this.settings = { ...this.settings, ...newSettings };
            
            if (oldCount !== this.settings.count) this.initParticles();
            if (oldColor !== this.settings.color) this.preRenderSprite();
        });

        this.initParticles();
        this.preRenderSprite(); // Рисуем спрайт 1 раз
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
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
            this.cachedRgb = { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
            this.lastHexColor = hex;
        }
        return this.cachedRgb;
    },

    // МАГИЯ ОПТИМИЗАЦИИ: Рисуем светящуюся точку 1 раз в памяти
    preRenderSprite: function() {
        const rgb = this.hexToRgbCached(this.settings.color);
        const radius = 3; // Максимальный радиус
        const glow = 10;  // Размер свечения
        const size = (radius + glow) * 2;
        
        this.spriteCanvas.width = size;
        this.spriteCanvas.height = size;
        
        this.spriteCtx.clearRect(0, 0, size, size);
        this.spriteCtx.beginPath();
        this.spriteCtx.arc(size/2, size/2, radius, 0, Math.PI * 2);
        this.spriteCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
        this.spriteCtx.shadowBlur = glow;
        this.spriteCtx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
        this.spriteCtx.fill();
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
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const rgb = this.cachedRgb; // Используем кэш
        const speedMult = this.settings.speed;
        const linkDist = this.settings.distance;
        const linkDistSq = linkDist * linkDist; 

        // 1. Отрисовка частиц через готовый Спрайт (Быстрее в 100 раз)
        for (let i = 0; i < this.particlesArray.length; i++) {
            let p = this.particlesArray[i];

            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Вместо тяжелого arc() + shadowBlur, просто копируем картинку!
            const spriteOffset = (p.radius + 10); // Радиус + свечение из preRenderSprite
            this.ctx.drawImage(this.spriteCanvas, p.x - spriteOffset, p.y - spriteOffset);
        }

        // 2. Линии (Остались на батчинге, что тоже очень быстро)
        const BUCKET_COUNT = 20; 
        const MAX_OPACITY = 0.4;
        const lineBuckets = Array.from({length: BUCKET_COUNT}, () => []);

        for (let a = 0; a < this.particlesArray.length; a++) {
            let p1 = this.particlesArray[a];
            for (let b = a + 1; b < this.particlesArray.length; b++) {
                let p2 = this.particlesArray[b];
                let dx = p1.x - p2.x;
                let dy = p1.y - p2.y;
                let distSq = dx * dx + dy * dy;

                if (distSq < linkDistSq) {
                    let distance = Math.sqrt(distSq);
                    let opacity = 1 - (distance / linkDist);
                    opacity *= MAX_OPACITY; 
                    
                    let bucketIndex = Math.floor((opacity / MAX_OPACITY) * BUCKET_COUNT);
                    if (bucketIndex >= BUCKET_COUNT) bucketIndex = BUCKET_COUNT - 1;
                    if (bucketIndex < 0) continue;

                    lineBuckets[bucketIndex].push(p1.x, p1.y, p2.x, p2.y);
                }
            }
        }

        this.ctx.lineWidth = 1;
        for (let i = 0; i < BUCKET_COUNT; i++) {
            let bucket = lineBuckets[i];
            if (bucket.length === 0) continue;
            
            let alpha = (i / BUCKET_COUNT) * MAX_OPACITY + (MAX_OPACITY / BUCKET_COUNT / 2);
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

            for (let j = 0; j < bucket.length; j += 4) {
                this.ctx.moveTo(bucket[j], bucket[j+1]);
                this.ctx.lineTo(bucket[j+2], bucket[j+3]);
            }
            this.ctx.stroke(); 
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