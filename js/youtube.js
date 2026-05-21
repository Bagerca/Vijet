/* ================= YOUTUBE ВИДЖЕТ (БЕЗ ЗВУКА) ================= */
window.AppPlayer = {
    yt: null,
    container: document.getElementById('widget-container'),
    nameLabel: document.getElementById('requester-name'),
    volLabel: document.getElementById('volume-level'),
    queueCount: document.getElementById('queue-count'),
    progressBar: document.getElementById('yt-progress-bar'), 
    isReady: false,

    init: function() {
        this.yt = new YT.Player('yt-player', {
            host: 'https://www.youtube-nocookie.com', // Обход блокировщиков
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'disablekb': 1, 
                'modestbranding': 1, 
                'playsinline': 1,
                'origin': window.location.origin // Требование API
            },
            events: {
                'onReady': () => { 
                    this.isReady = true;
                    this.yt.mute(); // СЕКРЕТ ЗДЕСЬ: Виджет ВСЕГДА без звука!
                }
            }
        });

        // Слушаем приказы от Ядра
        window.AppEvents.listen('YT_VISUAL_PLAY', d => this.play(d));
        window.AppEvents.listen('YT_VISUAL_HIDE', () => this.hide());
        window.AppEvents.listen('YT_VISUAL_VOL', d => this.updateVol(d.vol));
        window.AppEvents.listen('YT_VISUAL_STATE', d => this.updateState(d.state));
        window.AppEvents.listen('YT_VISUAL_PROGRESS', d => this.updateProgress(d.percent));
        window.AppEvents.listen('QUEUE_STATE', d => this.updateQueue(d.count));
    },

    play: function(data) {
        if (!this.isReady) return;
        this.nameLabel.innerText = data.user;
        this.updateVol(data.vol);
        this.container.classList.remove('hidden');
        this.progressBar.style.width = '0%';
        
        this.yt.loadVideoById(data.id);
        this.yt.mute(); // Заглушаем принудительно еще раз при загрузке
        this.yt.playVideo(); 
    },

    hide: function() {
        this.container.classList.add('hidden');
        this.container.classList.remove('is-playing');
        if (this.isReady) this.yt.stopVideo();
    },

    updateVol: function(vol) {
        this.volLabel.innerText = vol;
        this.volLabel.classList.remove('animate-pop');
        void this.volLabel.offsetWidth; 
        this.volLabel.classList.add('animate-pop');
    },

    updateState: function(state) {
        if (state === 'playing') this.container.classList.add('is-playing');
        else this.container.classList.remove('is-playing');
    },

    updateProgress: function(percent) {
        this.progressBar.style.width = `${percent}%`;
    },
    
    updateQueue: function(count) {
        if (!this.queueCount) return;
        this.queueCount.innerText = count;
        this.queueCount.classList.remove('animate-pop');
        void this.queueCount.offsetWidth;
        this.queueCount.classList.add('animate-pop');
    }
};

function onYouTubeIframeAPIReady() { window.AppPlayer.init(); }
if (window.YT && window.YT.Player && !window.AppPlayer.isReady) { window.AppPlayer.init(); }