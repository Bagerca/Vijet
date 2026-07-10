/* ФАЙЛ: js/audio-core.js */
/* ================= АУДИО ЯДРО (ОПТИМИЗАЦИЯ ПАМЯТИ) ================= */
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
            
            // Функция безопасного уничтожения аудио-объекта
            const cleanup = () => {
                window.AppEvents.emit('AUDIO_DUCK_STOP');
                // УТЕЧКА ПАМЯТИ ИСПРАВЛЕНА: Обнуляем src, чтобы GC сразу выкинул файл из RAM
                audio.src = '';
            };

            audio.onended = cleanup;
            audio.onerror = cleanup;

            audio.play().catch(e => {
                console.warn("[AudioCore] Ошибка воспроизведения:", e);
                cleanup();
            });
        } catch (e) {}
    }
};

window.AppEvents.listen('PLAY_SOUND', d => window.AppAudioCore.play(d.path));