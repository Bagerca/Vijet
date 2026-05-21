/* ================= TTS ЯДРО (Только для core.html) ================= */
window.AppTTSCore = {
    queue: [],
    isPlaying: false,
    synth: window.speechSynthesis,

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
        
        // Команда интерфейсу: Покажи плашку!
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

        utterance.onstart = () => {
            window.AppEvents.emit('TTS_EQ_START');
            window.AppEvents.emit('PET_EMOTION', { emotion: 'listen' });
        };
        utterance.onboundary = (event) => {
            if (event.name === 'word') window.AppEvents.emit('TTS_EQ_SPIKE');
        };
        utterance.onend = () => {
            window.AppEvents.emit('TTS_EQ_STOP');
            window.AppEvents.emit('PET_EMOTION', { emotion: 'idle' });
            setTimeout(() => this.playNext(), 500); 
        };
        utterance.onerror = () => {
            window.AppEvents.emit('TTS_EQ_STOP');
            window.AppEvents.emit('PET_EMOTION', { emotion: 'idle' });
            this.playNext();
        };

        this.synth.speak(utterance);
    },

    stop: function() {
        this.queue = []; 
        this.synth.cancel(); 
        this.isPlaying = false;
        window.AppEvents.emit('TTS_EQ_STOP');
        window.AppEvents.emit('TTS_VISUAL_HIDE');
        window.AppEvents.emit('PET_EMOTION', { emotion: 'idle' });
    }
};

setTimeout(() => window.AppTTSCore.init(), 1000);