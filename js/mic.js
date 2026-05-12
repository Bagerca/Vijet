window.AppMedia = {
    container: document.getElementById('webcam-container'),
    frame: document.getElementById('webcam-frame'),
    camEnabled: true, micEnabled: true,
    
    init: function() {
        this.initMic();
        this.container.style.transition = "opacity 0.4s ease";
    },

    toggleCam: function(forceState) {
        this.camEnabled = forceState !== undefined ? forceState : !this.camEnabled;
        this.container.style.opacity = this.camEnabled ? "1" : "0";
    },

    toggleMic: function(forceState) {
        this.micEnabled = forceState !== undefined ? forceState : !this.micEnabled;
        if (!this.micEnabled) {
            this.frame.style.boxShadow = `0 0 15px rgba(255, 68, 119, 0.2)`;
        }
    },

    initMic: async function() {
        try {
            const audioConstraints = { echoCancellation: false, autoGainControl: false, noiseSuppression: false };
            const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                requestAnimationFrame(draw);
                if (!this.micEnabled) return;

                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
                let average = sum / bufferLength;

                if (average > 10) {
                    let glow = 10 + (average * 2);
                    // РОЗОВОЕ СВЕЧЕНИЕ
                    this.frame.style.boxShadow = `0 0 ${glow}px rgba(255, 68, 119, 0.8), inset 0 0 15px rgba(255, 68, 119, 0.5)`;
                } else {
                    this.frame.style.boxShadow = `0 0 15px rgba(255, 68, 119, 0.2)`;
                }
            };
            draw();
        } catch (err) {
            console.warn("[Media] Ошибка доступа к МИКРОФОНУ.", err);
        }
    }
};
setTimeout(() => window.AppMedia.init(), 1000);