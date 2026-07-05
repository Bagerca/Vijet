/* ФАЙЛ: js/mod-deck/commands.js */

window.DeckCommands = {
    init() {
        const volSlider = document.getElementById('input-vol');
        const volLabel = document.getElementById('vol-label');
        if (volSlider && volLabel) {
            
            // ЗАЩИТА ОТ РАССИНХРОНА: Блокируем входящие пакеты, пока тянем ползунок
            const lockSlider = () => volSlider.setAttribute('data-dragging', 'true');
            const unlockSlider = () => setTimeout(() => volSlider.removeAttribute('data-dragging'), 1000);
            
            volSlider.addEventListener('mousedown', lockSlider);
            volSlider.addEventListener('touchstart', lockSlider, {passive: true});
            volSlider.addEventListener('mouseup', unlockSlider);
            volSlider.addEventListener('touchend', unlockSlider);

            volSlider.addEventListener('input', (e) => {
                lockSlider(); // На всякий случай блокируем и при движении
                const val = e.target.value;
                volLabel.innerText = val + '%';
                volSlider.style.setProperty('--slider-fill', val + '%');
            });
            
            volSlider.addEventListener('change', (e) => {
                window.DeckAuth.sendCommand(`!vol ${e.target.value}`);
                unlockSlider(); // Снимаем блок через секунду после отпускания
            });
        }

        document.querySelector('.control-panel').addEventListener('click', (e) => {
            const btn = e.target.closest('.cmd-btn, .action-btn');
            if (!btn || btn.classList.contains('btn-hold')) return;

            btn.style.transform = 'scale(0.92)';
            setTimeout(() => btn.style.transform = '', 150);

            const cmd = btn.getAttribute('data-cmd');
            if (cmd) { 
                window.DeckAuth.sendCommand(cmd); 
                return; 
            }

            this.handleAction(btn.getAttribute('data-action'));
        });

        document.querySelectorAll('.smart-input input, .counter-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.parentElement.querySelector('.action-btn')?.click();
                }
            });
        });
    },

    handleAction(action) {
        const getVal = (id) => document.getElementById(id)?.value.trim();
        const getAttr = (id, attr) => document.getElementById(id)?.getAttribute(attr);
        const clearVal = (id) => { const el = document.getElementById(id); if (el) el.value = ''; };

        let val;
        switch(action) {
            case 'play':
                val = getVal('input-play'); if (val) { window.DeckAuth.sendCommand(`!play ${val}`); clearVal('input-play'); } break;
            case 'tts':
                val = getVal('input-tts'); if (val) { window.DeckAuth.sendCommand(`!tts ${val}`); clearVal('input-tts'); } break;
            case 'so':
                val = getVal('input-so'); if (val) { window.DeckAuth.sendCommand(`!so ${val}`); clearVal('input-so'); } break;
            case 'set_death':
                val = getVal('input-death-val'); if (val) { window.DeckAuth.sendCommand(`!death set ${val}`); clearVal('input-death-val'); } break;
            case 'setmedia_yt':
                val = getVal('input-media-yt'); if (val) { window.DeckAuth.sendCommand(`!media yt ${val}`); clearVal('input-media-yt'); } break;
            case 'setgame':
                val = getAttr('custom-game-select', 'data-value');
                if (val) window.DeckAuth.sendCommand(val === "off" ? `!game off` : `!game ${val}`); 
                break;
            case 'settheme':
                val = getAttr('custom-theme-select', 'data-value');
                if (val) window.DeckAuth.sendCommand(`!протокол ${val}`); 
                break;
            case 'testalert':
                val = getAttr('custom-test-alert', 'data-value');
                if (val) window.DeckAuth.sendCommand(`!${val}`); 
                break;
            case 'testfollow':
                window.DeckAuth.sendCommand('!alert follow');
                setTimeout(() => window.DeckAuth.sendCommand('!testgoal'), 800);
                break;
            case 'testchat':
                const baseCmd = getAttr('custom-test-chat', 'data-value');
                let msgInput = getVal('test-chat-msg') || 'Пример текста!';
                let flags = Array.from(document.querySelectorAll('.mod-pill.active')).map(p => p.getAttribute('data-mod'));
                
                if (flags.includes('-c_word')) {
                    msgInput = msgInput + ' пидор'; 
                    flags = flags.filter(f => f !== '-c_word');
                }
                if (flags.includes('-c_msg')) {
                    msgInput = 'п1д0p ' + msgInput; 
                    flags = flags.filter(f => f !== '-c_msg');
                }
                
                let finalCmd = `!${baseCmd}`;
                if (flags.length > 0) finalCmd += ` ${flags.join(' ')}`;
                finalCmd += ` ${msgInput}`;
                
                window.DeckAuth.sendCommand(finalCmd); 
                clearVal('test-chat-msg'); 
                break;
            case 'add_wheel_custom':
                val = getVal('input-wheel'); if (val) { window.DeckAuth.sendCommand(`!wheel add ${val}`); clearVal('input-wheel'); } break;
            case 'add_wheel_db':
                val = getAttr('custom-wheel-db', 'data-value');
                if (val) {
                    const dbItem = window.GamesDatabase?.[val];
                    window.DeckAuth.sendCommand(`!wheel add ${dbItem ? dbItem.title : val}`);
                } 
                break;
            case 'spawn_emotes':
                window.DeckAuth.sendCommand(`Kappa LUL PogChamp BibleThump Kreygasm Kappa LUL PogChamp BibleThump Kreygasm ${Math.floor(Math.random() * 1000)}`);
                break;
            case 'testticker_custom':
                val = getVal('input-test-ticker'); if (val) { window.DeckAuth.sendCommand(`!testticker ${val}`); clearVal('input-test-ticker'); } break;
        }
    }
};