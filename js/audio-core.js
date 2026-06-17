/* ================= js/audio-core.js ================= */

window.AppAudioCore = {
    lastPlayed: 0,

    play: function(soundPath) {
        if (!soundPath) return;

        const now = Date.now();
        // Защита от спама звуками (не чаще раза в 100мс)
        if (now - this.lastPlayed < 100) return; 
        this.lastPlayed = now;

        try {
            const audio = new Audio(soundPath);
            audio.volume = (window.AppConfig.alertVolume || 50) / 100;
            
            audio.onplay = () => window.AppEvents.emit('AUDIO_DUCK_START');
            audio.onended = () => window.AppEvents.emit('AUDIO_DUCK_STOP');
            
            // Если звук не найден или заблокирован браузером
            audio.onerror = (e) => {
                console.warn(`[AudioCore] Не удалось загрузить аудио: ${soundPath}`);
                window.AppEvents.emit('AUDIO_DUCK_STOP');
            };

            // ИЗМЕНЕНО: Обработка DOMException (например, если нет фокуса на странице)
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("[AudioCore] Автовоспроизведение заблокировано или файл не найден:", error.message);
                    window.AppEvents.emit('AUDIO_DUCK_STOP');
                });
            }
        } catch (e) {
            console.error("[AudioCore] Системная ошибка аудио:", e);
            window.AppEvents.emit('AUDIO_DUCK_STOP');
        }
    }
};

window.AppEvents.listen('PLAY_SOUND', d => window.AppAudioCore.play(d.path));