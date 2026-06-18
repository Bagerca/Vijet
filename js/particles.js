/* ================= js/particles.js ================= */

window.AppParticles = {
    canvas: document.getElementById('particles-canvas'),
    ctx: null,
    particlesArray: [],
    maxParticles: 45,   // Оптимальное количество точек для сохранения читаемости фона
    maxDistance: 130,   // Пороговое расстояние для отрисовки линий созвездий
    isInitialized: false,
    
    init: function() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        // Слушаем изменение темы для мгновенной синхронизации цветов
        if (window.AppEvents) {
            window.AppEvents.listen('THEME_UPDATE_UI', () => this.syncThemeStyles());
        }

        this.particlesArray = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlesArray.push(this.createParticle());
        }
        this.animate();
    },

    resize: function() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    // Чтение цветовых переменных напрямую из CSS (Custom Properties) элемента body
    getThemeParticleColor: function() {
        const style = getComputedStyle(document.body);
        
        // Читаем переменные из активной CSS-темы
        const color1 = style.getPropertyValue('--particle-color-1').trim();
        const color2 = style.getPropertyValue('--particle-color-2').trim();
        
        // Дефолтный резервный розовый, если в CSS-файле темы переменные не заданы
        const fallbackColor = '255, 68, 119';

        const activeColors = [];
        if (color1) activeColors.push(color1);
        if (color2) activeColors.push(color2);

        // Если цвета найдены — выбираем случайный, иначе берем дефолтный розовый
        if (activeColors.length === 0) return fallbackColor;
        return activeColors[Math.floor(Math.random() * activeColors.length)];
    },

    // Метод обновляет цвета у всех активных частиц при смене класса темы на body
    syncThemeStyles: function() {
        // Даем браузеру один фрейм применить новые CSS-классы к body перед чтением стилей
        requestAnimationFrame(() => {
            this.particlesArray.forEach(p => {
                p.colorRGB = this.getThemeParticleColor();
            });
        });
    },

    createParticle: function() {
        const baseOpacity = Math.random() * 0.25 + 0.15; // Мягкая базовая непрозрачность
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 1.6 + 0.6,             // Компактный размер звездных узлов
            speedX: (Math.random() * 0.16 - 0.08),       // Плавный и ленивый дрейф
            speedY: (Math.random() * 0.16 - 0.08),
            baseOpacity: baseOpacity,
            opacity: baseOpacity,
            twinkleSpeed: 0.008 + Math.random() * 0.015, // Асинхронное мерцание
            phase: Math.random() * Math.PI * 2,
            colorRGB: this.getThemeParticleColor()       // Динамический цвет из CSS
        };
    },

    animate: function() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const len = this.particlesArray.length;

        // 1. Отрисовка линий созвездий (Plexus)
        for (let i = 0; i < len; i++) {
            const p1 = this.particlesArray[i];
            for (let j = i + 1; j < len; j++) {
                const p2 = this.particlesArray[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Если точки близко, рисуем тонкую соединительную нить цвета первой точки
                if (dist < this.maxDistance) {
                    const alpha = (1 - (dist / this.maxDistance)) * 0.12; 
                    this.ctx.strokeStyle = `rgba(${p1.colorRGB}, ${alpha})`;
                    this.ctx.lineWidth = 0.6; // Ультратонкая обводка
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        // 2. Обновление координат и отрисовка самих звезд
        for (let i = 0; i < len; i++) {
            const p = this.particlesArray[i];
            
            p.x += p.speedX; 
            p.y += p.speedY;

            // Возврат в границы экрана при выходе за пределы (с небольшим запасом)
            if (p.x > this.canvas.width + 10) p.x = -10; 
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.y > this.canvas.height + 10) p.y = -10; 
            if (p.y < -10) p.y = this.canvas.height + 10;

            // Расчет мерцания на основе тригонометрической фазы
            p.phase += p.twinkleSpeed;
            p.opacity = p.baseOpacity * (0.3 + Math.abs(Math.sin(p.phase)) * 0.7);

            // Отрисовка звезды в ее индивидуальном цвете
            this.ctx.fillStyle = `rgba(${p.colorRGB}, ${p.opacity})`;
            this.ctx.beginPath(); 
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
            this.ctx.fill();
        }

        requestAnimationFrame(this.animate.bind(this));
    }
};