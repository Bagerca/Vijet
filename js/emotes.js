/* ================= js/emotes.js ================= */

window.AppEmotes = {
    container: document.getElementById('emotes-container'),
    canvas: null,
    ctx: null,
    dpr: 1, 
    
    mode: "bubble",
    enabled: true,
    
    emotesArray: [],
    imageCache: {}, 
    
    animationId: null,
    lastTime: 0,
    isInitialized: false,

    init: function() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (!this.container || this.canvas) return; 

        if (window.AppConfig.emotesMode) this.mode = window.AppConfig.emotesMode;
        if (window.AppConfig.emotesEnabled !== undefined) this.enabled = window.AppConfig.emotesEnabled;

        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; 
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });

        this.resize();
        window.addEventListener('resize', () => this.resize());

        window.AppEvents.listen('EMOTES_SPAWN', d => this.spawn(d));
        window.AppEvents.listen('EMOTES_CMD', d => {
            if (d.cmd === 'a' || d.cmd === 'bubble') this.setMode('bubble');
            else if (d.cmd === 'b' || d.cmd === 'fountain') this.setMode('fountain');
            else if (d.cmd === 'off') this.toggle(false);
            else if (d.cmd === 'on') this.toggle(true);
        });

        this.animationId = requestAnimationFrame((ts) => this.loop(ts));
        console.log("%c[Эмодзи Canvas] 🫧 3D Движок частиц запущен", "color: #00FF7F");
    },

    resize: function() {
        this.dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.container.clientWidth * this.dpr;
        this.canvas.height = this.container.clientHeight * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    },

    setMode: function(newMode) {
        if (newMode === "bubble" || newMode === "fountain") {
            this.mode = newMode;
        }
    },

    toggle: function(state) {
        this.enabled = state !== undefined ? state : !this.enabled;
        if (!this.enabled) this.emotesArray = [];
    },

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
            img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`;
        });
    },

    spawn: async function(emotesData) {
        // Защита от накопления смайлов в свернутой вкладке (переключение сцен)
        if (!this.enabled || !emotesData || document.hidden) return;
        const emoteIds = Object.keys(emotesData);
        if (emoteIds.length === 0) return;

        const MAX_CONCURRENT = window.AppConfig.emotesMaxPerMessage || 150; 
        const MAX_PER_MSG = 15; 

        const imagePromises = emoteIds.map(id => this.getImage(id).then(img => ({ id, img })));
        const loadedImages = await Promise.all(imagePromises);

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        for (let data of loadedImages) {
            if (!data.img) continue;
            
            let count = Math.min(emotesData[data.id].length, MAX_PER_MSG);

            for (let i = 0; i < count; i++) {
                if (this.emotesArray.length >= MAX_CONCURRENT) break;

                const layerRoll = Math.random();
                let layer = 1; 
                if (layerRoll < 0.25) layer = 0; 
                else if (layerRoll > 0.75) layer = 2; 

                let scaleBase, speedMult, swayMult;
                if (layer === 0) { 
                    scaleBase = 0.35 + Math.random() * 0.2; 
                    speedMult = 0.6 + Math.random() * 0.2;  
                    swayMult = 15; 
                } else if (layer === 1) { 
                    scaleBase = 0.7 + Math.random() * 0.4;  
                    speedMult = 1.0 + Math.random() * 0.3;  
                    swayMult = 35; 
                } else { 
                    scaleBase = 1.4 + Math.random() * 0.6;  
                    speedMult = 1.6 + Math.random() * 0.5;  
                    swayMult = 60; 
                }

                let emote = {
                    img: data.img,
                    layer: layer, 
                    x: 0, y: 0, 
                    vx: 0, vy: 0,
                    scale: scaleBase,
                    rotation: 0, rotSpeed: 0,
                    alpha: 1,
                    life: 0, 
                    swayOffset: Math.random() * Math.PI * 2,
                    swaySpeed: 1.5 + Math.random() * 1.5,
                    swayAmplitude: swayMult
                };

                if (this.mode === 'bubble') {
                    emote.x = width * 0.05 + Math.random() * (width * 0.9);
                    emote.y = height + 40 + Math.random() * 100;
                    emote.vy = -(100 + Math.random() * 80) * speedMult; 
                    emote.startX = emote.x;
                    emote.rotSpeed = (Math.random() - 0.5) * 1.5;
                } else if (this.mode === 'fountain') {
                    emote.x = width / 2 + (Math.random() - 0.5) * 50;
                    emote.y = height + 20;
                    emote.vx = (Math.random() - 0.5) * 600 * speedMult; 
                    emote.vy = -(600 + Math.random() * 400) * speedMult; 
                    emote.rotSpeed = (Math.random() - 0.5) * 10;
                }

                this.emotesArray.push(emote);
            }
        }
    },

    loop: function(timestamp) {
        this.animationId = requestAnimationFrame((ts) => this.loop(ts));
        
        if (!timestamp) timestamp = performance.now();
        if (!this.lastTime) this.lastTime = timestamp;
        
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Очистка мусора при пробуждении сцены после долгой паузы
        if (dt > 0.5) { 
            this.emotesArray = [];
            return;
        }

        if (dt > 0.1) dt = 0.016; 

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.ctx.clearRect(0, 0, width, height);

        if (this.emotesArray.length === 0) return;

        for (let i = this.emotesArray.length - 1; i >= 0; i--) {
            let e = this.emotesArray[i];
            e.life += dt;

            if (this.mode === 'bubble') {
                e.y += e.vy * dt;
                e.x = e.startX + Math.sin(e.life * e.swaySpeed + e.swayOffset) * e.swayAmplitude;
                e.rotation = Math.sin(e.life * e.swaySpeed + e.swayOffset) * 0.25;
                
                if (e.y < height * 0.2) e.alpha -= dt * 1.5; 
                
            } else if (this.mode === 'fountain') {
                e.vy += 1500 * dt; 
                e.x += e.vx * dt;
                e.y += e.vy * dt;
                e.rotation += e.rotSpeed * dt;
            }

            if (e.alpha <= 0 || e.y > height + 300 || e.y < -300 || e.x < -200 || e.x > width + 200) {
                this.emotesArray.splice(i, 1);
            }
        }

        for (let currentLayer = 0; currentLayer <= 2; currentLayer++) {
            if (currentLayer === 0) {
                this.ctx.filter = `blur(${3 * this.dpr}px)`; 
            } else if (currentLayer === 1) {
                this.ctx.filter = 'none'; 
            } else if (currentLayer === 2) {
                this.ctx.filter = `blur(${4 * this.dpr}px)`; 
            }

            for (let i = 0; i < this.emotesArray.length; i++) {
                let e = this.emotesArray[i];
                if (e.layer !== currentLayer || !e.img) continue;

                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, Math.min(1, e.alpha));
                this.ctx.translate(e.x, e.y);
                this.ctx.rotate(e.rotation);
                this.ctx.scale(e.scale, e.scale);
                
                const imgW = e.img.width || 32;
                const imgH = e.img.height || 32;
                
                this.ctx.drawImage(e.img, -imgW / 2, -imgH / 2, imgW, imgH);
                this.ctx.restore();
            }
        }
        
        this.ctx.filter = 'none';
    }
};