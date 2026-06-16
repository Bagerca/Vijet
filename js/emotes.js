/* ================= ЭМОДЗИ ЧАТА (ОПТИМИЗАЦИЯ HTML5 CANVAS + GPU) ================= */

window.AppEmotes = {
    container: document.getElementById('emotes-container'),
    canvas: null,
    ctx: null,
    
    mode: "bubble",
    enabled: true,
    
    emotesArray: [],
    imageCache: {}, // Кэш объектов HTMLImageElement (решает проблему памяти)
    
    animationId: null,
    lastTime: 0,

    init: function() {
        if (!this.container) return;
        if (window.AppConfig.emotesMode) this.mode = window.AppConfig.emotesMode;
        if (window.AppConfig.emotesEnabled !== undefined) this.enabled = window.AppConfig.emotesEnabled;

        // 1. Создаем Canvas поверх всего контейнера
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Чтобы клики проходили сквозь
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });

        // 2. Адаптация под DPI (чтобы смайлы были четкими даже на 4к мониторах)
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 3. Подписки на события
        window.AppEvents.listen('EMOTES_SPAWN', d => this.spawn(d));
        window.AppEvents.listen('EMOTES_CMD', d => {
            if (d.cmd === 'a' || d.cmd === 'bubble') this.setMode('bubble');
            else if (d.cmd === 'b' || d.cmd === 'fountain') this.setMode('fountain');
            else if (d.cmd === 'off') this.toggle(false);
            else if (d.cmd === 'on') this.toggle(true);
        });

        // 4. Запускаем физический движок
        this.loop();
    },

    resize: function() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.container.clientWidth * dpr;
        this.canvas.height = this.container.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);
    },

    setMode: function(newMode) {
        if (newMode === "bubble" || newMode === "fountain") {
            this.mode = newMode;
            console.log(`[Emotes Canvas] Режим физики: ${newMode}`);
        }
    },

    toggle: function(state) {
        this.enabled = state !== undefined ? state : !this.enabled;
        if (!this.enabled) this.emotesArray = []; // Мгновенно стираем все смайлы
    },

    // Умный загрузчик картинок (если спамят 50 одинаковых смайлов, скачает 1 раз)
    getImage: function(id) {
        return new Promise((resolve) => {
            if (this.imageCache[id]) {
                if (this.imageCache[id].loaded) resolve(this.imageCache[id].img);
                else this.imageCache[id].callbacks.push(resolve);
                return;
            }
            
            const img = new Image();
            img.crossOrigin = "anonymous";
            this.imageCache[id] = { img: img, loaded: false, callbacks: [resolve] };
            
            img.onload = () => {
                this.imageCache[id].loaded = true;
                this.imageCache[id].callbacks.forEach(cb => cb(img));
                this.imageCache[id].callbacks = [];
            };
            img.onerror = () => {
                this.imageCache[id].callbacks.forEach(cb => cb(null));
                this.imageCache[id].callbacks = [];
            };
            // Запрашиваем 3.0 (большой размер) для четкости
            img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`;
        });
    },

    spawn: async function(emotesData) {
        if (!this.enabled || !emotesData) return;
        const emoteIds = Object.keys(emotesData);
        if (emoteIds.length === 0) return;

        // Лимиты увеличены, так как Canvas переваривает всё без лагов
        const MAX_CONCURRENT = 150; 
        const MAX_PER_MSG = 15;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        for (let id of emoteIds) {
            let count = Math.min(emotesData[id].length, MAX_PER_MSG);
            const img = await this.getImage(id);
            if (!img) continue;

            for (let i = 0; i < count; i++) {
                if (this.emotesArray.length >= MAX_CONCURRENT) break;

                // Базовый объект физики
                let emote = {
                    img: img,
                    x: 0, y: 0, 
                    vx: 0, vy: 0,
                    scale: 0.6 + Math.random() * 0.6,
                    rotation: 0, rotSpeed: 0,
                    alpha: 1,
                    life: 0, // Таймер жизни
                    swayOffset: Math.random() * Math.PI * 2, // Угол раскачивания
                    swaySpeed: 1.5 + Math.random() * 2
                };

                // Векторы направления зависят от режима
                if (this.mode === 'bubble') {
                    // Пузыри: всплывают снизу вверх
                    emote.x = width * 0.05 + Math.random() * (width * 0.9);
                    emote.y = height + 40 + Math.random() * 100;
                    emote.vy = -(120 + Math.random() * 100); // Скорость вверх (px/sec)
                    emote.startX = emote.x;
                    emote.rotSpeed = (Math.random() - 0.5) * 1.5;
                } else if (this.mode === 'fountain') {
                    // Фонтан: взрыв из центра снизу + гравитация
                    emote.x = width / 2 + (Math.random() - 0.5) * 50;
                    emote.y = height + 20;
                    emote.vx = (Math.random() - 0.5) * 800; // Разброс по X
                    emote.vy = -(600 + Math.random() * 500); // Сильный выстрел вверх
                    emote.rotSpeed = (Math.random() - 0.5) * 10;
                }

                this.emotesArray.push(emote);
            }
        }
    },

    // Основной цикл рендеринга (60 FPS)
    loop: function(timestamp) {
        this.animationId = requestAnimationFrame((ts) => this.loop(ts));
        
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000; // Delta time в секундах
        this.lastTime = timestamp;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Очищаем кадр
        this.ctx.clearRect(0, 0, width, height);

        if (this.emotesArray.length === 0) return;

        // Идем с конца массива, чтобы безопасно удалять элементы через splice
        for (let i = this.emotesArray.length - 1; i >= 0; i--) {
            let e = this.emotesArray[i];
            e.life += dt;

            // --- ФИЗИКА ---
            if (this.mode === 'bubble') {
                e.y += e.vy * dt;
                // Синусоидальное раскачивание по оси X
                e.x = e.startX + Math.sin(e.life * e.swaySpeed + e.swayOffset) * 35;
                e.rotation = Math.sin(e.life * e.swaySpeed + e.swayOffset) * 0.25;
                
                // Плавное затухание (fade-out) в верхней трети экрана
                if (e.y < height * 0.25) {
                    e.alpha -= dt * 1.5;
                }
            } else if (this.mode === 'fountain') {
                // Применяем гравитацию (ускорение свободного падения)
                e.vy += 1500 * dt; 
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                e.rotation += e.rotSpeed * dt;
            }

            // --- ОТРИСОВКА ---
            if (e.alpha > 0 && e.img) {
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, e.alpha);
                this.ctx.translate(e.x, e.y);
                this.ctx.rotate(e.rotation);
                this.ctx.scale(e.scale, e.scale);
                
                // Центрируем картинку по координатам
                const imgW = e.img.width || 32;
                const imgH = e.img.height || 32;
                
                this.ctx.drawImage(e.img, -imgW / 2, -imgH / 2, imgW, imgH);
                this.ctx.restore();
            }

            // --- СБОРКА МУСОРА ---
            // Удаляем смайл, если он исчез или улетел за пределы экрана
            if (e.alpha <= 0 || e.y > height + 100 || e.x < -100 || e.x > width + 100) {
                this.emotesArray.splice(i, 1);
            }
        }
    }
};