window.AppMedia = {
    container: document.getElementById('webcam-container'),
    frame: document.getElementById('webcam-frame'),
    filterLayer: null, // Слой оптического фильтра
    camEnabled: true, 
    micEnabled: true,
    audioCtx: null,
    analyser: null,
    
    init: function() {
        this.container.style.transition = "opacity 0.4s ease";
        
        // Создаем DOM-элемент для линзы фильтра и вставляем внутрь контейнера
        this.filterLayer = document.createElement('div');
        this.filterLayer.id = 'webcam-filter-layer';
        this.container.appendChild(this.filterLayer);

        // Подписка на события
        window.AppEvents.listen('MEDIA_CAM', d => { 
            if(d.state==='off') this.toggleCam(false); else if(d.state==='on') this.toggleCam(true); else this.toggleCam();
        });
        window.AppEvents.listen('MEDIA_MIC', d => { 
            if(d.state==='off') this.toggleMic(false); else if(d.state==='on') this.toggleMic(true); else this.toggleMic();
        });
        
        // Слушаем изменение оптического фильтра
        window.AppEvents.listen('CAM_FILTER_SET', d => {
            // Очищаем старые фильтры
            this.container.className = this.container.className.replace(/\bfilter-[^ ]+/g, '');
            // Применяем новый
            if (d.filter && d.filter !== 'off') {
                this.container.classList.add(`filter-${d.filter}`);
            }
        });

        setTimeout(() => this.initMic(), 1500);
    },

    toggleCam: function(forceState) {
        this.camEnabled = forceState !== undefined ? forceState : !this.camEnabled;
        this.container.style.opacity = this.camEnabled ? "1" : "0";
    },

    toggleMic: function(forceState) {
        this.micEnabled = forceState !== undefined ? forceState : !this.micEnabled;
        if (!this.micEnabled) {
            this.frame.style.boxShadow = `0 0 15px rgba(255, 68, 119, 0.2)`;
        } else {
            if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        }
    },

    initMic: async function() {
        try {
            const audioConstraints = { echoCancellation: false, autoGainControl: false, noiseSuppression: false };
            const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
            
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            const source = this.audioCtx.createMediaStreamSource(stream);
            
            source.connect(this.analyser);
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const wakeUpAudio = () => { if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); };
            setInterval(wakeUpAudio, 2000);
            wakeUpAudio();

            const draw = () => {
                requestAnimationFrame(draw);
                if (!this.micEnabled) return;

                this.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
                let average = sum / bufferLength;

                if (average > 10) {
                    let glow = 10 + (average * 2); 
                    this.frame.style.boxShadow = `0 0 ${glow}px rgba(255, 68, 119, 0.8), inset 0 0 15px rgba(255, 68, 119, 0.5)`;
                } else {
                    this.frame.style.boxShadow = `0 0 15px rgba(255, 68, 119, 0.2)`;
                }
            };
            draw();
        } catch (err) {
            console.warn("[Media] Ошибка доступа к МИКРОФОНУ. Проверь настройки Windows по умолчанию.", err);
        }
    }
};

window.AppMedia.init();