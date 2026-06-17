/* ================= js/tts-core.js ================= */

window.AppTTSCore = {
    queue: [],
    isPlaying: false,
    synth: window.speechSynthesis,
    keepAliveInterval: null,
    activeUtterance: null, 
    availableVoices: [], // Кэш голосов

    init: function() {
        if (!window.AppConfig.ttsEnabled) return;
        
        // ИЗМЕНЕНО: Умная предзагрузка голосов
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
        
        window.AppEvents.listen('TTS_ADD', d => this.add(d.user, d.text));
        window.AppEvents.listen('TTS_CMD', d => { if (d.cmd === 'stop') this.stop(); });
    },

    loadVoices: function() {
        this.availableVoices = this.synth.getVoices();
        if (this.availableVoices.length > 0) {
            console.log(`[TTS] Загружено голосов: ${this.availableVoices.length}`);
        }
    },

    add: function(user, text) {
        if (!window.AppConfig.ttsEnabled || !text) return;

        let cleanText = text.replace(/https?:\/\/[^\s]+/g, "ссылка").replace(/www\.[^\s]+/g, "ссылка"); 
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

        // ИЗМЕНЕНО: Надежный алгоритм выбора русского голоса
        let selectedVoice = null;
        
        // 1. Пытаемся найти кастомный голос юзера
        if (customSettings && customSettings.voiceName) {
            selectedVoice = this.availableVoices.find(v => v.name.toLowerCase().includes(customSettings.voiceName.toLowerCase()) && v.lang.includes('ru'));
        }
        // 2. Ищем премиум голос Google (самый приятный в Chrome)
        if (!selectedVoice) {
            selectedVoice = this.availableVoices.find(v => v.name.includes('Google') && v.lang === 'ru-RU');
        }
        // 3. Ищем голос Microsoft (для Edge)
        if (!selectedVoice) {
            selectedVoice = this.availableVoices.find(v => v.name.includes('Microsoft') && v.lang === 'ru-RU');
        }
        // 4. Берем любой доступный русский голос
        if (!selectedVoice) {
            selectedVoice = this.availableVoices.find(v => v.lang.includes('ru'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            console.warn("[TTS] Русские голоса не найдены в системе! Используется дефолтный голос ОС.");
        }

        const clearKeepAlive = () => {
            if (this.keepAliveInterval) {
                clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = null;
            }
        };

        utterance.onstart = () => {
            window.AppEvents.emit('TTS_EQ_START');
            window.AppEvents.emit('AUDIO_DUCK_START'); 
            window.AppEvents.emit('PET_BASE_STATE', { state: 'listen', active: true }); 
            
            // Фикс бага Chrome, когда длинный текст обрывается через 15 секунд
            this.keepAliveInterval = setInterval(() => {
                if (this.synth.speaking) {
                    this.synth.pause();
                    this.synth.resume();
                }
            }, 14000);
        };
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') window.AppEvents.emit('TTS_EQ_SPIKE');
        };
        
        const finishTTS = () => {
            clearKeepAlive();
            window.AppEvents.emit('TTS_EQ_STOP');
            window.AppEvents.emit('AUDIO_DUCK_STOP'); 
            window.AppEvents.emit('PET_BASE_STATE', { state: 'listen', active: false }); 
            this.activeUtterance = null;
            setTimeout(() => this.playNext(), 500);
        };

        utterance.onend = finishTTS;
        utterance.onerror = (e) => {
            console.error("[TTS] Ошибка синтеза речи:", e);
            finishTTS();
        };

        this.activeUtterance = utterance;
        
        try {
            this.synth.speak(utterance);
        } catch(e) {
            console.error("[TTS] Критический сбой запуска речи:", e);
            finishTTS();
        }
    },

    stop: function() {
        this.queue = []; 
        try { this.synth.cancel(); } catch(e) {}
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