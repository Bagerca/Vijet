window.AppParticles = {
    canvas: document.getElementById('particles-canvas'),
    ctx: null,
    particlesArray: [],
    
    init: function() {
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        for (let i = 0; i < 60; i++) {
            this.particlesArray.push(this.createParticle());
        }
        this.animate();
    },

    createParticle: function() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2.5 + 0.5,
            speedX: Math.random() * 0.4 - 0.2,
            speedY: Math.random() * 0.4 - 0.2,
            opacity: Math.random() * 0.4 + 0.1
        };
    },

    animate: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.particlesArray.length; i++) {
            let p = this.particlesArray[i];
            p.x += p.speedX; p.y += p.speedY;
            if (p.x > this.canvas.width) p.x = 0; if (p.x < 0) p.x = this.canvas.width;
            if (p.y > this.canvas.height) p.y = 0; if (p.y < 0) p.y = this.canvas.height;

            // Розовые частицы
            this.ctx.fillStyle = `rgba(255, 68, 119, ${p.opacity})`;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill();
        }
        requestAnimationFrame(this.animate.bind(this));
    }
};
window.AppParticles.init();