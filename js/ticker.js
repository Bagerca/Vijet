/* ================= js/ticker.js ================= */

window.AppTicker = {
    container: document.getElementById('ticker-container'),
    maskEl: document.getElementById('ticker-mask'),
    textEl: document.getElementById('ticker-text'),
    badgeTextEl: document.getElementById('ticker-badge-text'),
    badgeDotEl: document.querySelector('#ticker-badge .t-dot'),
    
    priorityQueue: [],      
    messageBag: [],         
    
    state: 0,               
    currentIsPriority: false, 
    
    intervalTimerId: null,
    textMotionTimerId: null,
    hideTimerId: null,
    speed: window.AppConfig.tickerSpeed || 120, 
    isInitialized: false, // Флаг инициализации

    init: function() {
        // Защита от двойного запуска
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (!window.AppConfig.tickerMessages || window.AppConfig.tickerMessages.length === 0) {
            this.container.style.display = 'none'; 
            return;
        }
        
        window.AppEvents.listen('TICKER_MUSIC', d => this.showMusicEvent(d.data, d.user));
        window.AppEvents.listen('TICKER_REWARD', d => this.showRewardEvent(d.user, d.reward, d.message));
        window.AppEvents.listen('TICKER_CUSTOM', d => this.forceShowImmediate(d.msg, d.badge, d.color));
        
        this.fillBag(); 
        this.scheduleNext();
    },

    fillBag: function() {
        let msgs = [...window.AppConfig.tickerMessages];
        for (let i = msgs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [msgs[i], msgs[j]] = [msgs[j], msgs[i]];
        }
        this.messageBag = msgs;
    },

    getDefaultMessage: function() {
        if (this.messageBag.length === 0) this.fillBag();
        const msg = this.messageBag.pop();
        return { html: msg, badge: "ИНФО", color: "#00FF7F" };
    },

    scheduleNext: function() {
        clearTimeout(this.intervalTimerId);
        const interval = window.AppConfig.tickerInterval || 60000;
        
        this.intervalTimerId = setTimeout(() => {
            if (this.state === 0 && this.priorityQueue.length === 0) {
                this.playNext();
            }
        }, interval);
    },

    forceShowImmediate: function(msg, badgeName = "СИСТЕМА", color = "#FF4477") {
        this.priorityQueue.push({ html: msg, badge: badgeName, color: color });
        
        if (this.state === 0) {
            this.playNext();
        } 
        else if (this.state === 1 && !this.currentIsPriority) {
            this.interrupt();
        }
    },

    interrupt: function() {
        if (this.state !== 1) return; 
        this.state = 2; 
        
        clearTimeout(this.textMotionTimerId);
        clearTimeout(this.hideTimerId);
        
        this.textEl.style.transition = 'none'; 
        this.container.classList.remove('visible');
        this.container.classList.add('is-leaving');
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.classList.remove('is-leaving');
            this.state = 0; 
            this.playNext(); 
        }, 600);
    },

    playNext: function() {
        if (this.state !== 0) return; 
        this.state = 1; 
        clearTimeout(this.intervalTimerId);
        
        let item;
        if (this.priorityQueue.length > 0) {
            item = this.priorityQueue.shift();
            this.currentIsPriority = true; 
        } else {
            item = this.getDefaultMessage();
            this.currentIsPriority = false; 
        }
        
        this.badgeTextEl.innerText = item.badge;
        this.badgeDotEl.style.backgroundColor = item.color;
        this.badgeDotEl.style.boxShadow = `0 0 10px ${item.color}`;
        this.textEl.innerHTML = item.html;
        this.textEl.style.transition = 'none';
        
        this.container.classList.remove('hidden', 'is-leaving');
        void this.container.offsetWidth; 
        
        const maskWidth = this.maskEl.offsetWidth;
        const textWidth = this.textEl.scrollWidth;
        this.textEl.style.transform = `translate3d(${maskWidth}px, 0, 0)`;
        void this.textEl.offsetWidth; 
        
        const distance = maskWidth + textWidth; 
        const duration = distance / this.speed;

        this.container.classList.add('visible'); 
        
        this.textMotionTimerId = setTimeout(() => {
            this.textEl.style.transition = `transform ${duration}s linear`;
            this.textEl.style.transform = `translate3d(-${textWidth + 50}px, 0, 0)`;
        }, 800);
        
        this.hideTimerId = setTimeout(() => {
            this.hideTicker();
        }, 800 + (duration * 1000) + 200); 
    },

    hideTicker: function() {
        if (this.state !== 1) return; 
        this.state = 2; 
        
        this.container.classList.remove('visible');
        this.container.classList.add('is-leaving');
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.classList.remove('is-leaving');
            this.state = 0; 
            
            if (this.priorityQueue.length > 0) this.playNext();
            else this.scheduleNext(); 
        }, 600);
    },

    showMusicEvent: async function(ytData, user) {
        let msg = '';
        if (ytData.type === 'playlist') {
            msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал целый плейлист!`;
            this.forceShowImmediate(msg, "МУЗЫКА", "#FF4477");
        } else {
            try {
                const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytData.id}&format=json`);
                const data = await response.json();
                msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал трек: <span style="color: #1a1a1a;">${data.title}</span>`;
            } catch (err) {
                msg = `<span style="color: #FF4477; font-weight: 800;">🎵 ${user}</span> заказал новую музыку!`;
            }
            this.forceShowImmediate(msg, "МУЗЫКА", "#FF4477");
        }
    },

    showRewardEvent: function(user, rewardName, userInput) {
        let msg = `<span style="color: #00FF7F; font-weight: 800;">💎 ${user}</span> активировал: <span style="color: #1a1a1a; font-weight: 800;">${rewardName}</span>`;
        if (userInput && userInput.trim() !== "") {
            const cleanInput = userInput.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
            msg += ` <span style="color: rgba(0,0,0,0.6); font-style: italic;">"${cleanInput}"</span>`;
        }
        this.forceShowImmediate(msg, "НАГРАДА", "#00FF7F");
    }
};
// УДАЛЕНО: window.AppTicker.init();