/* ================= mod-deck/commands.js ================= */

const CommandRegistry = {
    
    send: function(cmdString) {
        const toggle = document.getElementById('toggle-test-chat');
        let targetChannel = null;
        
        if (toggle && toggle.checked) {
            targetChannel = window.AuthManager.getCreds().user; 
        }
        
        window.TwitchAPI.send(cmdString, targetChannel);
    },

    commands: {
        'refresh_visual': () => CommandRegistry.send('!refresh'),
        'refresh_core': () => CommandRegistry.send('!refresh core'),
        'set_death': () => { const v = window.UIBuilder.getVal('input-death-val'); if(v!=="") { CommandRegistry.send(`!death set ${v}`); window.UIBuilder.clear('input-death-val'); } },
        'add_death': () => CommandRegistry.send('!death'),
        'sub_death': () => CommandRegistry.send('!death sub'),
        
        'force_sync': () => { window.SyncEngine.requestSync(true); window.ToastService.show("Запрос отправлен"); },
        
        'play': () => { const v = window.UIBuilder.getVal('input-play'); if(v) { CommandRegistry.send(`!play ${v}`); window.UIBuilder.clear('input-play'); } },
        'skip_track': () => CommandRegistry.send('!skip'),
        'skip_all': () => CommandRegistry.send('!skip all'),
        'clear_queue': () => CommandRegistry.send('!clear'),
        'tts': () => { const v = window.UIBuilder.getVal('input-tts'); if(v) { CommandRegistry.send(`!tts ${v}`); window.UIBuilder.clear('input-tts'); } },
        'tts_stop': () => CommandRegistry.send('!tts stop'),
        
        'fox_sleep': () => CommandRegistry.send('!fox sleep'),
        'fox_scared': () => CommandRegistry.send('!fox scared'),
        'fox_angry': () => CommandRegistry.send('!fox angry'),
        'fox_love': () => CommandRegistry.send('!fox love'),
        'fox_jam': () => CommandRegistry.send('!fox jam'),
        'fox_nom': () => CommandRegistry.send('!fox nom'),
        'emotes_bubble': () => CommandRegistry.send('!emotes a'),
        'emotes_fountain': () => CommandRegistry.send('!emotes b'),
        'spawn_emotes': () => CommandRegistry.send(`Kappa LUL PogChamp Kreygasm ${Math.floor(Math.random() * 1000)}`),
        
        'wheel_show': () => CommandRegistry.send('!wheel show'),
        'wheel_hide': () => CommandRegistry.send('!wheel hide'),
        'wheel_clear': () => CommandRegistry.send('!wheel clear'),
        'wheel_spin': () => CommandRegistry.send('!wheel spin'),
        'add_wheel_custom': () => { const v = window.UIBuilder.getVal('input-wheel'); if(v) { CommandRegistry.send(`!wheel add ${v}`); window.UIBuilder.clear('input-wheel'); } },
        'add_wheel_db': () => { const v = window.UIBuilder.getSel('custom-wheel-db'); if(v && window.GamesDatabase[v]) { CommandRegistry.send(`!wheel add ${window.GamesDatabase[v].title}`); } },
        
        'send_ticker': () => { const v = window.UIBuilder.getVal('input-live-ticker'); if(v) { CommandRegistry.send(`!testticker ${v}`); window.UIBuilder.clear('input-live-ticker'); } },
        'setgame': () => { const v = window.UIBuilder.getSel('custom-game-select'); CommandRegistry.send(v === "off" ? "!game off" : `!game ${v}`); },
        'setmedia_yt': () => { const v = window.UIBuilder.getVal('input-media-yt'); if(v) { CommandRegistry.send(`!media yt ${v}`); window.UIBuilder.clear('input-media-yt'); } },
        'settheme': () => { const v = window.UIBuilder.getSel('custom-theme-select'); CommandRegistry.send(`!протокол ${v}`); },
        'so': () => { const v = window.UIBuilder.getVal('input-so'); if(v) { CommandRegistry.send(`!so ${v}`); window.UIBuilder.clear('input-so'); } },
        'stream_marker': () => { CommandRegistry.send('/marker Epic Moment'); window.ToastService.show("🎬 Маркер установлен"); },
        
        'testalert': () => { const v = window.UIBuilder.getSel('custom-test-alert'); CommandRegistry.send(`!${v}`); },
        'testfollow': () => { CommandRegistry.send('!alert follow'); setTimeout(() => CommandRegistry.send('!testgoal'), 800); },
        'testchat': () => {
            const bc = window.UIBuilder.getSel('custom-test-chat'); 
            const m = window.UIBuilder.getVal('test-chat-msg'); 
            const flags = Array.from(document.querySelectorAll('.mod-pill.active')).map(p => p.getAttribute('data-mod')).join(" ");
            
            let cmd = `!${bc}`; 
            if (bc === 'testchat') {
                cmd += ` -defaultstyle`;
            }
            if (flags) cmd += ` ${flags}`; 
            if (m) cmd += ` ${m}`;
            
            CommandRegistry.send(cmd); 
            window.UIBuilder.clear('test-chat-msg');
        }
    },

    execute: function(action) {
        if (this.commands[action]) { this.commands[action](); } 
        else { console.warn("Неизвестная команда:", action); }
    },

    bindEvents: function() {
        const attachClick = (selector) => {
            document.querySelector(selector).addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn'); if (!btn) return;
                if (!btn.classList.contains('btn-sync')) { 
                    btn.style.transform = 'scale(0.92)'; 
                    setTimeout(() => btn.style.transform = '', 150); 
                }
                this.execute(btn.getAttribute('data-action'));
            });
        };
        
        attachClick('.control-panel');
        attachClick('.header-right');
        attachClick('.system-status-bar');

        document.addEventListener('change', (e) => {
            if (!e.target.classList.contains('widget-toggle')) return;
            const wId = e.target.getAttribute('data-widget');
            const state = e.target.checked ? 'on' : 'off';
            
            if (wId === 'cam') CommandRegistry.send(`!cam ${state}`);
            else if (wId === 'blur') CommandRegistry.send(`!blur ${state}`);
            else if (wId === 'deaths') CommandRegistry.send(`!death ${e.target.checked ? 'show' : 'hide'}`);
            else CommandRegistry.send(`!widget ${wId} ${state}`);
        });

        const vol = document.getElementById('input-vol');
        if (vol) { 
            vol.addEventListener('input', (e) => { 
                document.getElementById('vol-label').innerText = e.target.value + '%'; 
                vol.style.setProperty('--slider-fill', e.target.value + '%'); 
            }); 
            vol.addEventListener('change', (e) => CommandRegistry.send(`!vol ${e.target.value}`)); 
        }

        document.querySelectorAll('.smart-input input, .counter-input').forEach(i => { 
            i.addEventListener('keypress', (e) => { 
                if (e.key === 'Enter') { 
                    const b = e.currentTarget.parentElement.querySelector('.action-btn'); 
                    if (b) b.click(); 
                } 
            }); 
        });
    }
};

window.CommandRegistry = CommandRegistry;