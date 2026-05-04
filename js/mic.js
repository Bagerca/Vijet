window.AppMedia = {
    container: document.getElementById('webcam-container'),
    frame: document.getElementById('webcam-frame'),
    video: document.getElementById('webcam-video'),
    
    camEnabled: true,
    micEnabled: true,
    
    init: function() {
        this.initWebcam();
        this.initMic();
        // Добавляем плавность для появления/исчезновения вебки
        this.container.style.transition = "opacity 0.4s ease";
    },

    // ==========================================
    // ФУНКЦИИ УПРАВЛЕНИЯ (Вызываются из чата)
    // ==========================================
    toggleCam: function(forceState) {
        this.camEnabled = forceState !== undefined ? forceState : !this.camEnabled;
        this.container.style.opacity = this.camEnabled ? "1" : "0";
        console.log(`[Media] Камера ${this.camEnabled ? 'ВКЛЮЧЕНА' : 'ВЫКЛЮЧЕНА'}`);
    },

    toggleMic: function(forceState) {
        this.micEnabled = forceState !== undefined ? forceState : !this.micEnabled;
        if (!this.micEnabled) {
            // Если выключили, возвращаем рамке обычный вид без свечения
            this.frame.style.boxShadow = `0 0 10px rgba(145, 70, 255, 0.2)`;
        }
        console.log(`[Media] Эквалайзер ${this.micEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
    },

    // ==========================================
    // ИНИЦИАЛИЗАЦИЯ ВИДЕО (Веб-камера)
    // ==========================================
    initWebcam: async function() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720 }, 
                audio: false 
            });
            this.video.srcObject = stream;
        } catch (err) {
            console.warn("[Media] Ошибка доступа к ВЕБ-КАМЕРЕ. Возможно, она занята другой программой.", err);
        }
    },

    // ==========================================
    // ИНИЦИАЛИЗАЦИЯ АУДИО (Эквалайзер)
    // ==========================================
    initMic: async function() {
        try {
            // Запрашиваем "сырой" звук без браузерных фильтров для идеальной пульсации
            const audioConstraints = {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
            };

            const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
            
            // Выводим в консоль название микрофона, который поймал скрипт (для проверки)
            const audioTrack = stream.getAudioTracks()[0];
            console.log(`[Media] Эквалайзер подключен к микрофону: ${audioTrack.label || 'Микрофон по умолчанию'}`);

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                requestAnimationFrame(draw);
                
                // Если стример выключил эквалайзер командой, пропускаем анимацию
                if (!this.micEnabled) return;

                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
                let average = sum / bufferLength;

                if (average > 10) {
                    // Немного усилили чувствительность (average * 2) для большей динамики
                    let glow = 10 + (average * 2);
                    this.frame.style.boxShadow = `0 0 ${glow}px rgba(145, 70, 255, 0.9), inset 0 0 15px rgba(145, 70, 255, 0.6)`;
                } else {
                    this.frame.style.boxShadow = `0 0 10px rgba(145, 70, 255, 0.2)`;
                }
            };
            draw();
        } catch (err) {
            console.warn("[Media] Ошибка доступа к МИКРОФОНУ. Эквалайзер отключен.", err);
        }
    }
};

// Запускаем с небольшой задержкой, чтобы страница успела прогрузиться
setTimeout(() => window.AppMedia.init(), 1000);