window.AppMic = {
    frame: document.getElementById('webcam-frame'),
    
    init: async function() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);
                
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
                let average = sum / bufferLength;

                if (average > 10) {
                    let glow = 10 + (average * 1.5);
                    this.frame.style.boxShadow = `0 0 ${glow}px rgba(145, 70, 255, 0.8), inset 0 0 10px rgba(145, 70, 255, 0.5)`;
                } else {
                    this.frame.style.boxShadow = `0 0 10px rgba(145, 70, 255, 0.2)`;
                }
            };
            draw();
        } catch (err) {
            console.warn("[Mic] Ошибка или нет доступа к микрофону. Эквалайзер вебки отключен.", err);
        }
    }
};

setTimeout(() => window.AppMic.init(), 1000);