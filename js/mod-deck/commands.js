const CommandRegistry = {
    // Вспомогательная функция: проверяем, включен ли тумблер "Свой чат"
    getTargetChannel: function() {
        const toggle = document.getElementById('toggle-test-chat');
        if (toggle && toggle.checked) {
            return window.AuthManager.getCreds().user; // Возвращаем логин модератора
        }
        return null; // Вернет null -> TwitchAPI отправит в чат стримера
    },

    commands: {
        'refresh_visual': () => window.TwitchAPI.send('!refresh'),
        'refresh_core': () => window.TwitchAPI.send('!refresh core'),
        'set_death': () => { const v = window.UIBuilder.getVal('input-death-val'); if(v!=="") { window.TwitchAPI.send(`!death set ${v}`); window.UIBuilder.clear('input-death-val'); } },
        'add_death': () => window.TwitchAPI.send('!death'),
        'sub_death': () => window.TwitchAPI.send('!death sub'),
        'force_sync': () => { window.SyncEngine.requestSync(); window.ToastService.show("Запрос отправлен"); },
        
        'play': () => { const v = window.UIBuilder.getVal('input-play'); if(v) { window.TwitchAPI.send(`!play ${v}`); window.UIBuilder.clear('input-play'); } },
        'skip_track': () => window.TwitchAPI.send('!skip'),
        'skip_all': () => window.TwitchAPI.send('!skip all'),
        'clear_queue': () => window.TwitchAPI.send('!clear'),
        'tts': () => { const v = window.UIBuilder.getVal('input-tts'); if(v) { window.TwitchAPI.send(`!tts ${v}`); window.UIBuilder.clear('input-tts'); } },
        'tts_stop': () => window.TwitchAPI.send('!tts stop'),
        
        'fox_sleep': () => window.TwitchAPI.send('!fox sleep'),
        'fox_scared': () => window.TwitchAPI.send('!fox scared'),
        'fox_angry': () => window.TwitchAPI.send('!fox angry'),
        'fox_love': () => window.TwitchAPI.send('!fox love'),
        'fox_jam': () => window.TwitchAPI.send('!fox jam'),
        'fox_nom': () => window.TwitchAPI.send('!fox nom'),
        'emotes_bubble': () => window.TwitchAPI.send('!emotes a'),
        'emotes_fountain': () => window.TwitchAPI.send('!emotes b'),
        'spawn_emotes': () => window.TwitchAPI.send(`Kappa LUL PogChamp Kreygasm ${Math.floor(Math.random() * 1000)}`),
        
        'wheel_show': () => window.TwitchAPI.send('!wheel show'),
        'wheel_hide': () => window.TwitchAPI.send('!wheel hide'),
        'wheel_clear': () => window.TwitchAPI.send('!wheel clear'),
        'wheel_spin': () => window.TwitchAPI.send('!wheel spin'),
        'add_wheel_custom': () => { const v = window.UIBuilder.getVal('input-wheel'); if(v) { window.TwitchAPI.send(`!wheel add ${v}`); window.UIBuilder.clear('input-wheel'); } },
        'add_wheel_db': () => { const v = window.UIBuilder.getSel('custom-wheel-db'); if(v && window.GamesDatabase[v]) { window.TwitchAPI.send(`!wheel add ${window.GamesDatabase[v].title}`); } },
        
        'setgame': () => { const v = window.UIBuilder.getSel('custom-game-select'); window.TwitchAPI.send(v === "off" ? "!game off" : `!game ${v}`); },
        'setmedia_yt': () => { const v = window.UIBuilder.getVal('input-media-yt'); if(v) { window.TwitchAPI.send(`!media yt ${v}`); window.UIBuilder.clear('input-media-yt'); } },
        'settheme': () => { const v = window.UIBuilder.getSel('custom-theme-select'); window.TwitchAPI.send(`!протокол ${v}`); },
        'so': () => { const v = window.UIBuilder.getVal('input-so'); if(v) { window.TwitchAPI.send(`!so ${v}`); window.UIBuilder.clear('input-so'); } },
        'stream_marker': () => { window.TwitchAPI.send('/marker Epic Moment'); window.ToastService.show("🎬 Маркер установлен"); },
        
        // --- БЛОК ТЕСТОВ (ОТПРАВЛЯЮТСЯ В ВЫБРАННЫЙ ЧАТ) ---
        'send_ticker': function() { const v = window.UIBuilder.getVal('input-live-ticker'); if(v) { window.TwitchAPI.send(`!testticker ${v}`, this.getTargetChannel()); window.UIBuilder.clear('input-live-ticker'); } },
        'testalert': function() { const v = window.UIBuilder.getSel('custom-test-alert'); window.TwitchAPI.send(`!${v}`, this.getTargetChannel()); },
        'testfollow': function() { window.TwitchAPI.send('!alert follow', this.getTargetChannel()); setTimeout(() => window.TwitchAPI.send('!testgoal', this.getTargetChannel()), 800); },
        'testchat': function() {
            const bc = window.UIBuilder.getSel('custom-test-chat'); 
            const m = window.UIBuilder.getVal('test-chat-msg'); 
            const flags = Array.from(document.querySelectorAll('.mod-pill.active')).map(p => p.getAttribute('data-mod')).join(" ");
            
            let cmd = `!${bc}`; 
            
            // ФИКС: Заставляем Ядро ИГНОРИРОВАТЬ твою VIP роль при тесте Дефолта
            if (bc === 'testfirst' || bc === 'testhighlight' || bc === 'testmention') {
                cmd += ` -defaultstyle`;
            }
            
            if (flags) cmd += ` ${flags}`; 
            if (m) cmd += ` ${m}`;
            
            window.TwitchAPI.send(cmd, this.getTargetChannel()); 
            window.UIBuilder.clear('test-chat-msg');
        }
    },

    execute: function(action) {
        if (this.commands[action]) { this.commands[action].call(this); } 
        else { console.warn("Неизвестная команда:", action); }
    },

    bindEvents: function() {
        const attachClick = (selector) => {
            document.querySelector(selector).addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn'); if (!btn) return;
                if (!btn.classList.contains('btn-sync')) { btn.style.transform = 'scale(0.92)'; setTimeout(() => btn.style.transform = '', 150); }
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
            
            if (wId === 'cam') window.TwitchAPI.send(`!cam ${state}`);
            else if (wId === 'blur') window.TwitchAPI.send(`!blur ${state}`);
            else if (wId === 'deaths') window.TwitchAPI.send(`!death ${e.target.checked ? 'show' : 'hide'}`);
            else window.TwitchAPI.send(`!widget ${wId} ${state}`);
        });

        const vol = document.getElementById('input-vol');
        if (vol) { 
            vol.addEventListener('input', (e) => { 
                document.getElementById('vol-label').innerText = e.target.value + '%'; 
                vol.style.setProperty('--slider-fill', e.target.value + '%'); 
            }); 
            vol.addEventListener('change', (e) => window.TwitchAPI.send(`!vol ${e.target.value}`)); 
        }

        document.querySelectorAll('.smart-input input, .counter-input').forEach(i => { 
            i.addEventListener('keypress', (e) => { 
                if (e.key === 'Enter') { const b = e.currentTarget.parentElement.querySelector('.action-btn'); if (b) b.click(); } 
            }); 
        });
    }
};

window.CommandRegistry = CommandRegistry;