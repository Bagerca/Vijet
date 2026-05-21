/* ================= АУДИО ЯДРО (Только для core.html) ================= */
window.AppAudioCore = {
    lastPlayed: 0,

    play: function(soundPath) {
        if (!soundPath) return;

        // Защита от эха (если несколько виджетов прислали сигнал одновременно)
        const now = Date.now();
        if (now - this.lastPlayed < 100) return; 
        this.lastPlayed = now;

        try {
            const audio = new Audio(soundPath);
            audio.volume = (window.AppConfig.alertVolume || 50) / 100;
            audio.play().catch(e => console.warn("[AudioCore] Ошибка:", e));
        } catch (e) {}
    }
};

window.AppEvents.listen('PLAY_SOUND', d => window.AppAudioCore.play(d.path));