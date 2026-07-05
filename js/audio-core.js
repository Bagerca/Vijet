/* ================= АУДИО ЯДРО (Только для core.html) ================= */
window.AppAudioCore = {
    lastPlayed: 0,

    play: function(soundPath) {
        if (!soundPath) return;

        const now = Date.now();
        if (now - this.lastPlayed < 100) return; 
        this.lastPlayed = now;

        try {
            const audio = new Audio(soundPath);
            audio.volume = (window.AppConfig.alertVolume || 50) / 100;
            
            // Включаем Audio Ducking (приглушаем музыку)
            audio.onplay = () => window.AppEvents.emit('AUDIO_DUCK_START');
            audio.onended = () => window.AppEvents.emit('AUDIO_DUCK_STOP');
            audio.onerror = () => window.AppEvents.emit('AUDIO_DUCK_STOP'); // Защита

            audio.play().catch(e => {
                console.warn("[AudioCore] Ошибка:", e);
                window.AppEvents.emit('AUDIO_DUCK_STOP');
            });
        } catch (e) {}
    }
};

window.AppEvents.listen('PLAY_SOUND', d => window.AppAudioCore.play(d.path));