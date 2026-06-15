/* =====================================================================
   УМНАЯ СТУДИЙНАЯ КОНСОЛЬ (MODULAR ARCHITECTURE + SYNC)
   ===================================================================== */

const AuthManager = {
    getCreds() {
        return {
            channel: localStorage.getItem('uso_mod_channel') || '',
            user: localStorage.getItem('uso_mod_user') || '',
            token: localStorage.getItem('uso_mod_token') || ''
        };
    },
    saveCreds(channel, user, token) {
        if (!token.startsWith('oauth:')) token = 'oauth:' + token;
        localStorage.setItem('uso_mod_channel', channel.trim().toLowerCase());
        localStorage.setItem('uso_mod_user', user.trim().toLowerCase());
        localStorage.setItem('uso_mod_token', token.trim());
    },
    logout() {
        localStorage.clear();
        location.reload();
    },
    isValid() {
        const c = this.getCreds();
        return c.channel && c.user && c.token;
    }
};

const UIManager = {
    init() {
        this.setupCustomSelects();
        this.setupModifierPills();
    },

    showApp(channelName) {
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('ui-channel-name').innerText = channelName;
    },

    updateLiveStatus(state, text) {
        const indicator = document.querySelector('.live-indicator');
        if (!indicator) return;
        const states = {
            'connecting': { color: '#FEE101', pulse: 'none' },
            'connected':  { color: '#00FF7F', pulse: 'pulse 1.5s infinite' },
            'error':      { color: '#FF0050', pulse: 'none' }
        };
        const s = states[state] || states.error;
        indicator.innerHTML = `<span class="live-dot" style="background: ${s.color}; box-shadow: 0 0 10px ${s.color}; animation: ${s.pulse};"></span> ${text}`;
    },

    showToast(msg, isError = false) {
        const toast = document.getElementById('toast');
        toast.innerText = msg; 
        if (isError) {
            toast.style.background = "#FF0050"; toast.style.color = "#fff"; toast.style.boxShadow = "0 10px 30px rgba(255, 0, 80, 0.4)";
        } else {
            toast.style.background = "var(--c-green)"; toast.style.color = "#000"; toast.style.boxShadow = "0 10px 30px var(--c-green-glow)";
        }
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        void toast.offsetWidth; 
        toast.style.animation = null;
        setTimeout(() => toast.classList.add('hidden'), 2500);
    },

    buildMasterSwitches(widgetsConfig) {
        const grid = document.getElementById('widget-master-grid');
        if (!grid) return;
        grid.innerHTML = widgetsConfig.map(w => `
            <div class="toggle-row">
                <span class="toggle-label">${w.label}</span>
                <label class="switch"><input type="checkbox" class="widget-toggle" data-widget="${w.id}" checked><span class="slider"></span></label>
            </div>
        `).join('');
    },

    buildDynamicLists() {
        try {
            // Игры
            if (window.GamesDatabase) {
                let htmlGames = `<div class="optgroup">Игры</div>`;
                let htmlSeries = `<div class="optgroup">Кино/Анимация</div>`;
                for (let key in window.GamesDatabase) {
                    const item = window.GamesDatabase[key];
                    const cover = item.cover ? `<img src="${item.cover}" class="select-item-cover">` : '';
                    const row = `<div class="item-with-cover" data-value="${key}">${cover}<span>${item.title}</span></div>`;
                    if (item.type === 'game') htmlGames += row; else htmlSeries += row;
                }
                const gameList = document.getElementById('dynamic-game-list');
                const wheelList = document.getElementById('dynamic-wheel-list');
                if (gameList) gameList.innerHTML = `<div data-value="off">❌ Скрыть плашку</div>` + htmlGames + htmlSeries;
                if (wheelList) wheelList.innerHTML = htmlGames + htmlSeries;
            }

            // Стили чата (Гарантированно выводим базу, даже если конфиг пустой)
            const chatList = document.getElementById('dynamic-chat-styles');
            if (chatList) {
                let baseOptions = `
                    <div class="optgroup">Обычный чат</div>
                    <div data-value="testfirst">Дефолт (Впервые)</div>
                    <div data-value="testhighlight">Дефолт (За баллы)</div>
                    <div data-value="testmention">Дефолт (Пинг)</div>
                `;
                
                if (window.AppConfig && window.AppConfig.customChatStyles && Object.keys(window.AppConfig.customChatStyles).length > 0) {
                    baseOptions += `<div class="optgroup">Кастомные стили (VIP)</div>`;
                    for (const [login, styleId] of Object.entries(window.AppConfig.customChatStyles)) {
                        baseOptions += `
                            <div data-value="testuser ${login}" class="item-with-cover">
                                <img src="https://ui-avatars.com/api/?name=${login}&background=222&color=fff" id="av-${login}" class="select-item-cover" style="border-radius: 50%;">
                                <span>${login} <span class="text-muted">(${styleId})</span></span>
                            </div>
                        `;
                        this.fetchTwitchAvatar(login);
                    }
                }
                chatList.innerHTML = baseOptions;
            }
        } catch (error) {
            console.error("[USO] Ошибка генерации списков:", error);
            this.showToast("Ошибка в конфиге", true);
        }
    },

    async fetchTwitchAvatar(login) {
        try {
            const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${login}`);
            const data = await res.json();
            if (data && data.length > 0 && data[0].logo) {
                const img = document.getElementById(`av-${login}`);
                if (img) img.src = data[0].logo;
            }
        } catch(e) {}
    },

    syncToggle(widgetId, state) {
        const toggle = document.querySelector(`.widget-toggle[data-widget="${widgetId}"]`);
        if (toggle) {
            const isTurnedOn = (state === 'on' || state === 'show');
            if (toggle.checked !== isTurnedOn) toggle.checked = isTurnedOn;
        }
    },

    setupCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(cs => {
            const sel = cs.querySelector('.select-selected');
            const items = cs.querySelector('.select-items');
            
            const newSel = sel.cloneNode(true);
            sel.parentNode.replaceChild(newSel, sel);
            
            newSel.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const isOpening = items.classList.contains('select-hide');

                document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
                document.querySelectorAll('.select-selected').forEach(el => el.classList.remove('select-arrow-active'));
                document.querySelectorAll('.custom-select').forEach(el => el.style.zIndex = "10");

                if (isOpening) {
                    items.classList.remove('select-hide');
                    newSel.classList.add('select-arrow-active');
                    cs.style.zIndex = "9999"; 
                }
            });
            
            items.addEventListener('click', (e) => {
                const opt = e.target.closest('div[data-value]');
                if (!opt) return;
                
                newSel.innerHTML = opt.innerHTML;
                cs.setAttribute('data-value', opt.getAttribute('data-value'));
                
                items.classList.add('select-hide');
                newSel.classList.remove('select-arrow-active');
                cs.style.zIndex = "10"; 
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
            document.querySelectorAll('.select-selected').forEach(el => el.classList.remove('select-arrow-active'));
            document.querySelectorAll('.custom-select').forEach(el => el.style.zIndex = "10");
        });
    },

    setupModifierPills() { document.querySelectorAll('.mod-pill').forEach(p => p.addEventListener('click', e => e.currentTarget.classList.toggle('active'))); },
    getInputValue(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; },
    clearInput(id) { const el = document.getElementById(id); if (el) el.value = ""; },
    getSelectValue(id) { const el = document.getElementById(id); return el ? el.getAttribute('data-value') : null; }
};

const TwitchAPI = {
    channel: null,
    connect(creds) {
        this.channel = creds.channel;
        UIManager.updateLiveStatus('connecting', 'ПОДКЛЮЧЕНИЕ...');
        ComfyJS.Init(creds.user, creds.token, creds.channel);
        this.setupMonitors();
        this.embedIframes(creds.channel);
        this.setupAutoWakeup();
    },
    setupMonitors() {
        const client = ComfyJS.GetClient();
        if (!client) return;

        client.on("connected", () => { UIManager.updateLiveStatus('connected', 'ПОДКЛЮЧЕНО'); UIManager.showToast("⚡ СВЯЗЬ УСТАНОВЛЕНА"); });
        client.on("disconnected", (r) => { UIManager.updateLiveStatus('error', 'ОТКЛЮЧЕНО'); });
        client.on("reconnect", () => UIManager.updateLiveStatus('connecting', 'ПЕРЕПОДКЛЮЧЕНИЕ'));

        ComfyJS.onCommand = (user, command, message, flags) => {
            const isMod = flags.broadcaster || flags.mod;
            if (!isMod) return;

            const cmd = command.toLowerCase();
            const args = message.toLowerCase().split(' ');

            if (cmd === 'widget' && args.length >= 2) UIManager.syncToggle(args[0], args[1]);
            if (cmd === 'cam') UIManager.syncToggle('cam', args[0]);
            if (cmd === 'blur') UIManager.syncToggle('blur', args[0]);
            if (cmd === 'death' || cmd === 'deaths') UIManager.syncToggle('deaths', args[0]);
        };
    },
    send(commandStr) {
        if (!commandStr) return;
        const client = ComfyJS.GetClient();
        if (client && client.readyState() === "OPEN") {
            ComfyJS.Say(commandStr, this.channel); UIManager.showToast("✔️ Отправлено");
        } else {
            UIManager.showToast("❌ ОШИБКА: НЕТ СВЯЗИ", true); UIManager.updateLiveStatus('error', 'СВЯЗЬ ПОТЕРЯНА');
            if (client) client.connect().catch(e => {});
        }
    },
    embedIframes(channel) {
        let d = window.location.hostname; if (!d || d === "127.0.0.1") d = "localhost";
        try {
            new Twitch.Embed("twitch-video-container", { width: "100%", height: "100%", channel: channel, layout: "video", autoplay: true, muted: true, parent: [d, "github.io"] });
            const f = document.createElement('iframe'); f.src = `https://www.twitch.tv/embed/${channel}/chat?darkpopout&parent=${d}${d.includes('github.io') ? '&parent=github.io' : ''}`; f.style.cssText = "width:100%;height:100%;border:none;"; document.getElementById('twitch-chat-container').appendChild(f);
        } catch (e) {}
    },
    setupAutoWakeup() {
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                const c = ComfyJS.GetClient();
                if (c && c.readyState() !== "OPEN") { UIManager.updateLiveStatus('connecting', 'ВОССТАНОВЛЕНИЕ...'); c.connect().catch(e => {}); }
            }
        });
    }
};

const CommandRouter = {
    widgetsConfig: [
        { id: 'chat', label: 'Чат' }, { id: 'media', label: 'Сейчас играем' }, { id: 'goal', label: 'Цель фолловеров' }, { id: 'alerts', label: 'Алерты' },
        { id: 'socials', label: 'Соцсети' }, { id: 'ticker', label: 'Бегущая строка' }, { id: 'pet', label: 'Питомец (Лиса)' }, { id: 'emotes', label: 'Смайлы чата' },
        { id: 'music', label: 'Плеер YouTube' }, { id: 'tts', label: 'TTS Эквалайзер' }, { id: 'particles', label: 'Фон. частицы' }, { id: 'shoutout', label: 'Shoutout' }
    ],
    init() { UIManager.buildMasterSwitches(this.widgetsConfig); this.bindEvents(); },
    bindEvents() {
        document.getElementById('widget-master-grid').addEventListener('change', (e) => {
            if (!e.target.classList.contains('widget-toggle')) return;
            TwitchAPI.send(`!widget ${e.target.getAttribute('data-widget')} ${e.target.checked ? 'on' : 'off'}`);
        });
        document.querySelectorAll('.widget-toggle').forEach(t => {
            if (t.closest('#widget-master-grid')) return; 
            t.addEventListener('change', (e) => {
                const w = e.target.getAttribute('data-widget'); const s = e.target.checked ? 'on' : 'off';
                if (w === 'cam') TwitchAPI.send(`!cam ${s}`); else if (w === 'blur') TwitchAPI.send(`!blur ${s}`); else if (w === 'deaths') TwitchAPI.send(`!death ${e.target.checked ? 'show' : 'hide'}`);
            });
        });
        const vol = document.getElementById('input-vol');
        if (vol) { vol.addEventListener('input', (e) => { document.getElementById('vol-label').innerText = e.target.value + '%'; vol.style.setProperty('--slider-fill', e.target.value + '%'); }); vol.addEventListener('change', (e) => TwitchAPI.send(`!vol ${e.target.value}`)); }
        document.querySelectorAll('.smart-input input, .counter-input').forEach(i => { i.addEventListener('keypress', (e) => { if (e.key === 'Enter') { const b = e.currentTarget.parentElement.querySelector('.action-btn'); if (b) b.click(); } }); });
        document.querySelector('.control-panel').addEventListener('click', (e) => {
            const btn = e.target.closest('.cmd-btn, .action-btn'); if (!btn) return;
            btn.style.transform = 'scale(0.92)'; setTimeout(() => btn.style.transform = '', 150);
            const cmd = btn.getAttribute('data-cmd'); if (cmd) { TwitchAPI.send(cmd); return; }
            this.handleAction(btn.getAttribute('data-action'));
        });
    },
    handleAction(action) {
        let v, c = null;
        switch(action) {
            case 'play': v = UIManager.getInputValue('input-play'); if (v) { c = `!play ${v}`; UIManager.clearInput('input-play'); } break;
            case 'tts': v = UIManager.getInputValue('input-tts'); if (v) { c = `!tts ${v}`; UIManager.clearInput('input-tts'); } break;
            case 'so': v = UIManager.getInputValue('input-so'); if (v) { c = `!so ${v}`; UIManager.clearInput('input-so'); } break;
            case 'set_death': v = UIManager.getInputValue('input-death-val'); if (v !== "") { c = `!death set ${v}`; UIManager.clearInput('input-death-val'); } break;
            case 'setmedia_yt': v = UIManager.getInputValue('input-media-yt'); if (v) { c = `!media yt ${v}`; UIManager.clearInput('input-media-yt'); } break;
            case 'setgame': v = UIManager.getSelectValue('custom-game-select'); c = v === "off" ? "!game off" : `!game ${v}`; break;
            case 'settheme': v = UIManager.getSelectValue('custom-theme-select'); c = `!протокол ${v}`; break;
            case 'testalert': v = UIManager.getSelectValue('custom-test-alert'); c = `!${v}`; break;
            case 'testfollow': TwitchAPI.send('!alert follow'); setTimeout(() => TwitchAPI.send('!testgoal'), 800); break;
            case 'testchat': const bc = UIManager.getSelectValue('custom-test-chat'); const m = UIManager.getInputValue('test-chat-msg'); let f = Array.from(document.querySelectorAll('.mod-pill.active')).map(p => p.getAttribute('data-mod')).join(" "); c = `!${bc}`; if (f) c += ` ${f}`; if (m) c += ` ${m}`; UIManager.clearInput('test-chat-msg'); break;
            case 'add_wheel_custom': v = UIManager.getInputValue('input-wheel'); if (v) { c = `!wheel add ${v}`; UIManager.clearInput('input-wheel'); } break;
            case 'add_wheel_db': v = UIManager.getSelectValue('custom-wheel-db'); if (v) { const d = window.GamesDatabase[v]; c = `!wheel add ${d ? d.title : v}`; } break;
            case 'spawn_emotes': c = `Kappa LUL PogChamp BibleThump Kreygasm ${Math.floor(Math.random() * 1000)}`; break;
            case 'testticker_custom': v = UIManager.getInputValue('input-test-ticker'); if (v) { c = `!testticker ${v}`; UIManager.clearInput('input-test-ticker'); } break;
        }
        if (c) TwitchAPI.send(c);
    }
};

const AppDeck = {
    init() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            const c = document.getElementById('auth-channel').value; const u = document.getElementById('auth-user').value; const t = document.getElementById('auth-token').value;
            if (!c || !u || !t) return alert("Заполните все поля!"); AuthManager.saveCreds(c, u, t); this.start();
        });
        const btnLogout = document.getElementById('btn-logout'); if (btnLogout) btnLogout.addEventListener('click', () => AuthManager.logout());
        if (AuthManager.isValid()) this.start(); else document.getElementById('auth-modal').classList.remove('hidden');
    },
    start() {
        const creds = AuthManager.getCreds();
        UIManager.showApp(creds.channel); UIManager.buildDynamicLists(); UIManager.init();
        CommandRouter.init(); TwitchAPI.connect(creds);
    }
};

window.onload = () => AppDeck.init();