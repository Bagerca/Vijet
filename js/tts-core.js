/* ================= TTS ЯДРО (Только для core.html) ================= */
window.AppTTSCore = {
    queue: [],
    isPlaying: false,
    synth: window.speechSynthesis,
    keepAliveInterval: null,
    activeUtterance: null, // Защита от Garbage Collector (Bug fix)

    init: function() {
        if (!window.AppConfig.ttsEnabled) return;
        let voices = this.synth.getVoices();
        if (voices.length === 0) this.synth.onvoiceschanged = () => { voices = this.synth.getVoices(); };
        
        window.AppEvents.listen('TTS_ADD', d => this.add(d.user, d.text));
        window.AppEvents.listen('TTS_CMD', d => { if (d.cmd === 'stop') this.stop(); });
    },

    add: function(user, text) {
        if (!window.AppConfig.ttsEnabled || !text) return;

        let cleanText = text.replace(/https?:\/\/[^\s]+/g, "").replace(/www\.[^\s]+/g, ""); 
        cleanText = cleanText.replace(/(.)\1{10,}/g, "$1$1$1"); 
        if (cleanText.length > window.AppConfig.ttsMaxLength) cleanText = cleanText.substring(0, window.AppConfig.ttsMaxLength) + "...";

        if (cleanText.trim().length > 0) {
            this.queue.push({ user: user, text: cleanText.trim() });
            if (!this.isPlaying) this.playNext();
        }
    },

    playNext: function() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            window.AppEvents.emit('TTS_VISUAL_HIDE');
            return;
        }

        this.isPlaying = true;
        const currentData = this.queue.shift();
        
        window.AppEvents.emit('TTS_VISUAL_SHOW', { user: currentData.user });

        const utterance = new SpeechSynthesisUtterance(currentData.text);
        utterance.lang = 'ru-RU'; 
        utterance.volume = Math.min(1.0, ((window.AppConfig.ttsVolume || 60) / 100) * 2.0);

        const customSettings = window.AppConfig.ttsCustomVoices && window.AppConfig.ttsCustomVoices[currentData.user.toLowerCase()];
        utterance.pitch = customSettings && customSettings.pitch !== undefined ? customSettings.pitch : 1.0;
        utterance.rate = customSettings && customSettings.rate !== undefined ? customSettings.rate : 1.1;

        const voices = this.synth.getVoices();
        let selectedVoice = null;
        if (customSettings && customSettings.voiceName) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes(customSettings.voiceName.toLowerCase()) && v.lang.includes('ru'));
        }
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'ru-RU' && v.name.includes('Google')) || voices.find(v => v.lang.includes('ru'));
        if (selectedVoice) utterance.voice = selectedVoice;

        const clearKeepAlive = () => {
            if (this.keepAliveInterval) {
                clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = null;
            }
        };

        utterance.onstart = () => {
            window.AppEvents.emit('TTS_EQ_START');
            window.AppEvents.emit('AUDIO_DUCK_START'); // Приглушаем YouTube
            window.AppEvents.emit('PET_BASE_STATE', { state: 'listen', active: true }); // Питомец начинает слушать (в стек)
            
            this.keepAliveInterval = setInterval(() => {
                if (this.synth.speaking) {
                    this.synth.pause();
                    this.synth.resume();
                }
            }, 10000);
        };
        utterance.onboundary = (event) => {
            if (event.name === 'word') window.AppEvents.emit('TTS_EQ_SPIKE');
        };
        
        const finishTTS = () => {
            clearKeepAlive();
            window.AppEvents.emit('TTS_EQ_STOP');
            window.AppEvents.emit('AUDIO_DUCK_STOP'); // Возвращаем громкость музыки
            window.AppEvents.emit('PET_BASE_STATE', { state: 'listen', active: false }); // Убираем 'listen' из стека
            this.activeUtterance = null;
            setTimeout(() => this.playNext(), 500);
        };

        utterance.onend = finishTTS;
        utterance.onerror = finishTTS;

        // Сохраняем ссылку, чтобы GC не убил объект (Bug Fix)
        this.activeUtterance = utterance;
        this.synth.speak(utterance);
    },

    stop: function() {
        this.queue = []; 
        this.synth.cancel(); 
        this.isPlaying = false;
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
        window.AppEvents.emit('TTS_EQ_STOP');
        window.AppEvents.emit('TTS_VISUAL_HIDE');
        window.AppEvents.emit('AUDIO_DUCK_STOP');
        window.AppEvents.emit('PET_BASE_STATE', { state: 'listen', active: false });
    }
};

setTimeout(() => window.AppTTSCore.init(), 1000);