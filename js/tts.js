window.AppTTS = {
    container: document.getElementById('tts-container'),
    userText: document.getElementById('tts-user'),
    queue: [],
    isPlaying: false,
    synth: window.speechSynthesis,
    eqInterval: null, 

    init: function() {
        if (!window.AppConfig.ttsEnabled) {
            if(this.container) this.container.style.display = 'none';
            return;
        }
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
        
        const baseVolume = (window.AppConfig.ttsVolume || 60) / 100;
        utterance.volume = Math.min(1.0, baseVolume * 2.0);

        const customSettings = window.AppConfig.ttsCustomVoices && window.AppConfig.ttsCustomVoices[currentData.user.toLowerCase()];
        utterance.pitch = customSettings && customSettings.pitch !== undefined ? customSettings.pitch : 1.0;
        utterance.rate = customSettings && customSettings.rate !== undefined ? customSettings.rate : 1.1;

        const voices = this.synth.getVoices();
        let selectedVoice = null;

        if (customSettings && customSettings.voiceName) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes(customSettings.voiceName.toLowerCase()) && v.lang.includes('ru'));
        }

        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang === 'ru-RU' && v.name.includes('Google')) || 
                            voices.find(v => v.lang.includes('ru'));
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        // === СТАРТ ОЗВУЧКИ ===
        utterance.onstart = () => {
            this.startEqualizer();
            // Лиса начинает внимательно слушать
            if (window.AppPet) window.AppPet.setEmotion('listen');
        };
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                this.spikeEqualizer();
            }
        };

        // === КОНЕЦ ОЗВУЧКИ ===
        utterance.onend = () => {
            this.stopEqualizer();
            // Лиса возвращается в норму
            if (window.AppPet && window.AppPet.currentState === 'listen') window.AppPet.setEmotion('idle');
            setTimeout(() => this.playNext(), 500); 
        };

        utterance.onerror = (e) => {
            console.warn("[TTS] Ошибка воспроизведения:", e);
            this.stopEqualizer();
            if (window.AppPet && window.AppPet.currentState === 'listen') window.AppPet.setEmotion('idle');
            this.playNext();
        };

        this.synth.speak(utterance);
    },

    startEqualizer: function() {
        if (this.eqInterval) clearInterval(this.eqInterval);
        const bars = document.querySelectorAll('.tts-bar');
        if (!bars.length) return;
        this.eqInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = 20 + Math.random() * 40; 
                bar.style.height = `${height}%`;
                bar.classList.remove('active-spike');
            });
        }, 120); 
    },

    spikeEqualizer: function() {
        const bars = document.querySelectorAll('.tts-bar');
        bars.forEach(bar => {
            const height = 70 + Math.random() * 30; 
            bar.style.height = `${height}%`;
            bar.classList.add('active-spike');
        });
    },

    stopEqualizer: function() {
        if (this.eqInterval) clearInterval(this.eqInterval);
        const bars = document.querySelectorAll('.tts-bar');
        bars.forEach(bar => {
            bar.style.height = '15%';
            bar.classList.remove('active-spike');
        });
    },

    stop: function() {
        this.queue = []; 
        this.synth.cancel(); 
        this.isPlaying = false;
        this.stopEqualizer();
        this.hideVisual();
        // Сбрасываем слушанье принудительно
        if (window.AppPet && window.AppPet.currentState === 'listen') window.AppPet.setEmotion('idle');
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