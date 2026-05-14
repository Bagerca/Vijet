window.AppTTS = {
    container: document.getElementById('tts-container'),
    userText: document.getElementById('tts-user'),
    queue: [],
    isPlaying: false,
    synth: window.speechSynthesis,

    init: function() {
        if (!window.AppConfig.ttsEnabled) {
            if(this.container) this.container.style.display = 'none';
            return;
        }
        // Предзагрузка голосов
        let voices = this.synth.getVoices();
        if (voices.length === 0) {
            this.synth.onvoiceschanged = () => { voices = this.synth.getVoices(); };
        }
    },

    add: function(user, text) {
        if (!window.AppConfig.ttsEnabled || !text) return;

        let cleanText = text.replace(/https?:\/\/[^\s]+/g, ""); 
        cleanText = cleanText.replace(/www\.[^\s]+/g, ""); 
        cleanText = cleanText.replace(/(.)\1{10,}/g, "$1$1$1"); 

        if (cleanText.length > window.AppConfig.ttsMaxLength) {
            cleanText = cleanText.substring(0, window.AppConfig.ttsMaxLength) + "...";
        }

        if (cleanText.trim().length > 0) {
            this.queue.push({ user: user, text: cleanText.trim() });
            if (!this.isPlaying) this.playNext();
        }
    },

    playNext: function() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            this.hideVisual();
            return;
        }

        this.isPlaying = true;
        const currentData = this.queue.shift();
        
        this.showVisual(currentData.user);

        const utterance = new SpeechSynthesisUtterance(currentData.text);
        utterance.lang = 'ru-RU'; 
        utterance.volume = (window.AppConfig.ttsVolume || 50) / 100;

        // ==========================================
        // МАГИЯ КАСТОМНЫХ ГОЛОСОВ
        // ==========================================
        // Ищем ник в нижнем регистре в конфиге
        const customSettings = window.AppConfig.ttsCustomVoices && window.AppConfig.ttsCustomVoices[currentData.user.toLowerCase()];

        // Применяем настройки (если их нет, ставим дефолт: pitch 1.0, rate 1.1)
        utterance.pitch = customSettings && customSettings.pitch !== undefined ? customSettings.pitch : 1.0;
        utterance.rate = customSettings && customSettings.rate !== undefined ? customSettings.rate : 1.1;

        const voices = this.synth.getVoices();
        let selectedVoice = null;

        // 1. Если для юзера жестко задано имя голоса (например, Pavel)
        if (customSettings && customSettings.voiceName) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes(customSettings.voiceName.toLowerCase()) && v.lang.includes('ru'));
        }

        // 2. Если голос не найден или не задан — ищем стандартный русский
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang === 'ru-RU' && v.name.includes('Google')) || 
                            voices.find(v => v.lang.includes('ru'));
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        // ==========================================

        utterance.onend = () => {
            setTimeout(() => this.playNext(), 500); 
        };

        utterance.onerror = (e) => {
            console.warn("[TTS] Ошибка воспроизведения:", e);
            this.playNext();
        };

        this.synth.speak(utterance);
    },

    stop: function() {
        this.queue = []; 
        this.synth.cancel(); 
        this.isPlaying = false;
        this.hideVisual();
    },

    showVisual: function(user) {
        if (!this.container) return;
        this.userText.innerText = user;
        this.container.classList.remove('hidden');
        this.container.classList.add('tts-in');
        this.container.classList.remove('tts-out');
    },

    hideVisual: function() {
        if (!this.container) return;
        this.container.classList.remove('tts-in');
        this.container.classList.add('tts-out');
        setTimeout(() => {
            if(!this.isPlaying) this.container.classList.add('hidden');
        }, 500);
    }
};

setTimeout(() => window.AppTTS.init(), 1000);