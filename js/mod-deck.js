/* =====================================================================
   USO MOD DECK: CYBER DASHBOARD (REFACTORED ARCHITECTURE)
   ===================================================================== */

const AuthManager = {
    getCreds: () => ({
        channel: localStorage.getItem('uso_mod_channel') || '',
        user: localStorage.getItem('uso_mod_user') || '',
        token: localStorage.getItem('uso_mod_token') || ''
    }),
    saveCreds: (channel, user, token) => {
        if (!token.startsWith('oauth:')) token = 'oauth:' + token;
        localStorage.setItem('uso_mod_channel', channel.trim().toLowerCase());
        localStorage.setItem('uso_mod_user', user.trim().toLowerCase());
        localStorage.setItem('uso_mod_token', token.trim());
    },
    logout: () => { localStorage.clear(); location.reload(); },
    isValid: function() { const c = this.getCreds(); return c.channel && c.user && c.token; }
};

const ToastService = {
    show: (msg, isError = false) => {
        const toast = document.getElementById('toast');
        toast.innerText = msg; 
        if (isError) {
            toast.style.background = "#FF0050"; toast.style.color = "#fff"; 
            toast.style.boxShadow = "0 10px 30px rgba(255, 0, 80, 0.4)";
        } else {
            toast.style.background = "var(--c-green)"; toast.style.color = "#000"; 
            toast.style.boxShadow = "0 10px 30px var(--c-green-glow)";
        }
        toast.classList.remove('hidden');
        toast.style.animation = 'none'; void toast.offsetWidth; toast.style.animation = null;
        setTimeout(() => toast.classList.add('hidden'), 2500);
    }
};

/* ================= STATE MANAGEMENT ================= */
const DeckState = {
    widgets: {},
    queue: [],
    health: { core: false, visual: false },
    
    updateWidgets: function(newWidgets) {
        this.widgets = { ...this.widgets, ...newWidgets };
        UIBuilder.syncAllSwitches(this.widgets);
    },
    updateQueue: function(newQueue) {
        this.queue = newQueue || [];
        UIBuilder.renderQueue(this.queue);
    },
    updateHealth: function(system, isAlive) {
        this.health[system] = isAlive;
        UIBuilder.updateHealthStatus(system, isAlive);
    }
};

/* ================= СИНХРОНИЗАЦИЯ (HYBRID) ================= */
const SyncEngine = {
    lastCorePing: 0,
    lastVisualPing: 0,

    init: function() {
        // 1. Локальная синхронизация через BroadcastChannel
        if (window.AppEvents) {
            window.AppEvents.listen('SYSTEM_STATE_RESPONSE', (data) => {
                console.log("[SYNC 📥] Локальное обновление состояния", data);
                if (data.widgets) DeckState.updateWidgets(data.widgets);
                if (data.queue) DeckState.updateQueue(data.queue);
            });

            window.AppEvents.listen('QUEUE_STATE', (data) => {
                if (data.items) DeckState.updateQueue(data.items);
            });

            // Heartbeat Listeners
            window.AppEvents.listen('CORE_HEARTBEAT', () => this.ping('core'));
            window.AppEvents.listen('VISUAL_HEARTBEAT', () => this.ping('visual'));
        }

        // Запуск Health Checker-а
        setInterval(() => this.checkHealth(), 5000);
    },

    requestSync: function() {
        console.log("[SYNC 📤] Запрос актуальных данных...");
        if (window.AppEvents) {
            window.AppEvents.emit('SYSTEM_STATE_REQUEST'); // Локальный запрос
        }
        TwitchAPI.send('!uso_sync_req'); // Запрос через чат для удаленных модеров
    },

    ping: function(system) {
        if (system === 'core') this.lastCorePing = Date.now();
        if (system === 'visual') this.lastVisualPing = Date.now();
        DeckState.updateHealth(system, true);
    },

    checkHealth: function() {
        const now = Date.now();
        if (now - this.lastCorePing > 12000) DeckState.updateHealth('core', false);
        if (now - this.lastVisualPing > 12000) DeckState.updateHealth('visual', false);
    },

    // Парсер скрытых системных ответов из чата
    parseChatSync: function(message) {
        if (message.includes('[USO_SYNC]')) {
            try {
                const jsonStr = message.replace('[USO_SYNC]', '').trim();
                const data = JSON.parse(jsonStr);
                console.log("[SYNC 📥] Удаленное обновление из чата", data);
                if (data.widgets) DeckState.updateWidgets(data.widgets);
                if (data.queue) DeckState.updateQueue(data.queue);
            } catch (e) { console.error("Ошибка парсинга USO_SYNC", e); }
            return true; // Сообщаем, что это служебное сообщение
        }
        return false;
    }
};

/* ================= UI BUILDER (View Controller) ================= */
const UIBuilder = {
    widgetsConfig: [
        { id: 'chat', label: 'Чат' }, { id: 'media', label: 'Сейчас играем' }, { id: 'goal', label: 'Цель фолловеров' }, { id: 'alerts', label: 'Алерты' },
        { id: 'socials', label: 'Соцсети' }, { id: 'ticker', label: 'Бегущая строка' }, { id: 'pet', label: 'Питомец (Лиса)' }, { id: 'emotes', label: 'Смайлы чата' },
        { id: 'music', label: 'Плеер YouTube' }, { id: 'tts', label: 'TTS Эквалайзер' }, { id: 'particles', label: 'Фон. частицы' }, { id: 'shoutout', label: 'Shoutout' }
    ],

    init: function() {
        this.buildMasterSwitches();
        this.buildDynamicLists();
        this.setupCustomControls();
    },

    buildMasterSwitches: function() {
        const grid = document.getElementById('widget-master-grid');
        if (!grid) return;
        grid.innerHTML = this.widgetsConfig.map(w => `
            <div class="toggle-row">
                <span class="toggle-label">${w.label}</span>
                <label class="switch"><input type="checkbox" class="widget-toggle" data-widget="${w.id}"><span class="slider"></span></label>
            </div>
        `).join('');
    },

    syncAllSwitches: function(widgetsMap) {
        document.querySelectorAll('.widget-toggle').forEach(toggle => {
            const wId = toggle.getAttribute('data-widget');
            if (widgetsMap[wId] !== undefined) {
                toggle.checked = widgetsMap[wId];
            }
        });
    },

    renderQueue: function(items) {
        const container = document.getElementById('deck-queue-list');
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="queue-empty-text">Очередь пуста</div>`;
            return;
        }
        container.innerHTML = items.map((item, index) => `
            <div class="queue-item">
                <span class="queue-index">#${index + 1}</span>
                <span class="queue-title" title="${item.id}">${item.type === 'video' ? 'Видео' : 'Плейлист'} [${item.id}]</span>
                <span class="queue-user">от ${item.user}</span>
            </div>
        `).join('');
    },

    updateHealthStatus: function(system, isAlive) {
        const el = document.getElementById(`health-${system}`);
        if (el) {
            el.className = `status-pill ${isAlive ? 'status-ok' : 'status-error'}`;
        }
    },

    setLiveStatus: function(state) {
        const dot = document.getElementById('live-dot');
        const text = document.getElementById('live-text');
        if (!dot || !text) return;
        
        if (state === 'connected') { dot.classList.add('active'); text.innerText = 'LIVE'; }
        else if (state === 'error') { dot.classList.remove('active'); text.innerText = 'ERROR'; dot.style.background = '#FF0050'; }
        else { dot.classList.remove('active'); text.innerText = 'CONNECTING...'; dot.style.background = '#FEE101'; }
    },

    buildDynamicLists: function() {
        try {
            if (window.GamesDatabase) {
                let htmlGames = `<div class="optgroup">Игры</div>`;
                let htmlSeries = `<div class="optgroup">Кино/Анимация</div>`;
                for (let key in window.GamesDatabase) {
                    const item = window.GamesDatabase[key];
                    const cover = item.cover ? `<img src="${item.cover}" class="select-item-cover">` : '';
                    const row = `<div class="item-with-cover" data-value="${key}">${cover}<span>${item.title}</span></div>`;
                    if (item.type === 'game') htmlGames += row; else htmlSeries += row;
                }
                document.getElementById('dynamic-game-list').innerHTML = `<div data-value="off">❌ Скрыть плашку</div>` + htmlGames + htmlSeries;
                document.getElementById('dynamic-wheel-list').innerHTML = htmlGames + htmlSeries;
            }

            const chatList = document.getElementById('dynamic-chat-styles');
            if (chatList) {
                let baseOptions = `<div class="optgroup">Обычный чат</div><div data-value="testfirst">Дефолт (Впервые)</div><div data-value="testhighlight">Дефолт (За баллы)</div><div data-value="testmention">Дефолт (Пинг)</div>`;
                if (window.AppConfig && window.AppConfig.customChatStyles) {
                    baseOptions += `<div class="optgroup">Кастомные стили (VIP)</div>`;
                    for (const [login, styleId] of Object.entries(window.AppConfig.customChatStyles)) {
                        baseOptions += `<div data-value="testuser ${login}" class="item-with-cover"><img src="https://ui-avatars.com/api/?name=${login}&background=222&color=fff" id="av-${login}" class="select-item-cover" style="border-radius: 50%;"><span>${login} <span class="text-muted">(${styleId})</span></span></div>`;
                        this.fetchTwitchAvatar(login);
                    }
                }
                chatList.innerHTML = baseOptions;
            }
        } catch (e) { ToastService.show("Ошибка в конфиге", true); }
    },

    fetchTwitchAvatar: async function(login) {
        try {
            const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${login}`);
            const data = await res.json();
            if (data && data[0] && data[0].logo) document.getElementById(`av-${login}`).src = data[0].logo;
        } catch(e) {}
    },

    setupCustomControls: function() {
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
                if (isOpening) { items.classList.remove('select-hide'); newSel.classList.add('select-arrow-active'); }
            });
            
            items.addEventListener('click', (e) => {
                const opt = e.target.closest('div[data-value]');
                if (!opt) return;
                newSel.innerHTML = opt.innerHTML;
                cs.setAttribute('data-value', opt.getAttribute('data-value'));
                items.classList.add('select-hide'); newSel.classList.remove('select-arrow-active');
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
            document.querySelectorAll('.select-selected').forEach(el => el.classList.remove('select-arrow-active'));
        });

        document.querySelectorAll('.mod-pill').forEach(p => p.addEventListener('click', e => e.currentTarget.classList.toggle('active')));
    },
    
    getVal: (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; },
    getSel: (id) => { const el = document.getElementById(id); return el ? el.getAttribute('data-value') : null; },
    clear: (id) => { const el = document.getElementById(id); if (el) el.value = ""; }
};

/* ================= COMMAND PATTERN (ROUTER) ================= */
const CommandRegistry = {
    commands: {
        // Управление Эфиром
        'refresh_visual': () => TwitchAPI.send('!refresh'),
        'refresh_core': () => TwitchAPI.send('!refresh core'),
        'set_death': () => { const v = UIBuilder.getVal('input-death-val'); if(v!=="") { TwitchAPI.send(`!death set ${v}`); UIBuilder.clear('input-death-val'); } },
        'add_death': () => TwitchAPI.send('!death'),
        'sub_death': () => TwitchAPI.send('!death sub'),
        'force_sync': () => { SyncEngine.requestSync(); ToastService.show("Запрос отправлен"); },
        
        // Музыка
        'play': () => { const v = UIBuilder.getVal('input-play'); if(v) { TwitchAPI.send(`!play ${v}`); UIBuilder.clear('input-play'); } },
        'skip_track': () => TwitchAPI.send('!skip'),
        'skip_all': () => TwitchAPI.send('!skip all'),
        'clear_queue': () => TwitchAPI.send('!clear'),
        'tts': () => { const v = UIBuilder.getVal('input-tts'); if(v) { TwitchAPI.send(`!tts ${v}`); UIBuilder.clear('input-tts'); } },
        'tts_stop': () => TwitchAPI.send('!tts stop'),
        
        // Интерактив (Лиса и Эмоции)
        'fox_sleep': () => TwitchAPI.send('!fox sleep'),
        'fox_scared': () => TwitchAPI.send('!fox scared'),
        'fox_angry': () => TwitchAPI.send('!fox angry'),
        'fox_love': () => TwitchAPI.send('!fox love'),
        'fox_jam': () => TwitchAPI.send('!fox jam'),
        'fox_nom': () => TwitchAPI.send('!fox nom'),
        'emotes_bubble': () => TwitchAPI.send('!emotes a'),
        'emotes_fountain': () => TwitchAPI.send('!emotes b'),
        'spawn_emotes': () => TwitchAPI.send(`Kappa LUL PogChamp Kreygasm ${Math.floor(Math.random() * 1000)}`),
        
        // Рулетка
        'wheel_show': () => TwitchAPI.send('!wheel show'),
        'wheel_hide': () => TwitchAPI.send('!wheel hide'),
        'wheel_clear': () => TwitchAPI.send('!wheel clear'),
        'wheel_spin': () => TwitchAPI.send('!wheel spin'),
        'add_wheel_custom': () => { const v = UIBuilder.getVal('input-wheel'); if(v) { TwitchAPI.send(`!wheel add ${v}`); UIBuilder.clear('input-wheel'); } },
        'add_wheel_db': () => { const v = UIBuilder.getSel('custom-wheel-db'); if(v && window.GamesDatabase[v]) { TwitchAPI.send(`!wheel add ${window.GamesDatabase[v].title}`); } },
        
        // Оформление
        'send_ticker': () => { const v = UIBuilder.getVal('input-live-ticker'); if(v) { TwitchAPI.send(`!testticker ${v}`); UIBuilder.clear('input-live-ticker'); } },
        'setgame': () => { const v = UIBuilder.getSel('custom-game-select'); TwitchAPI.send(v === "off" ? "!game off" : `!game ${v}`); },
        'setmedia_yt': () => { const v = UIBuilder.getVal('input-media-yt'); if(v) { TwitchAPI.send(`!media yt ${v}`); UIBuilder.clear('input-media-yt'); } },
        'settheme': () => { const v = UIBuilder.getSel('custom-theme-select'); TwitchAPI.send(`!протокол ${v}`); },
        'so': () => { const v = UIBuilder.getVal('input-so'); if(v) { TwitchAPI.send(`!so ${v}`); UIBuilder.clear('input-so'); } },
        'stream_marker': () => { TwitchAPI.send('/marker Epic Moment'); ToastService.show("🎬 Маркер установлен"); },
        
        // Тесты
        'testalert': () => { const v = UIBuilder.getSel('custom-test-alert'); TwitchAPI.send(`!${v}`); },
        'testfollow': () => { TwitchAPI.send('!alert follow'); setTimeout(() => TwitchAPI.send('!testgoal'), 800); },
        'testchat': () => {
            const bc = UIBuilder.getSel('custom-test-chat'); 
            const m = UIBuilder.getVal('test-chat-msg'); 
            const flags = Array.from(document.querySelectorAll('.mod-pill.active')).map(p => p.getAttribute('data-mod')).join(" ");
            let cmd = `!${bc}`; if (flags) cmd += ` ${flags}`; if (m) cmd += ` ${m}`;
            TwitchAPI.send(cmd); UIBuilder.clear('test-chat-msg');
        }
    },

    execute: function(action) {
        if (this.commands[action]) { this.commands[action](); } 
        else { console.warn("Неизвестная команда:", action); }
    },

    bindEvents: function() {
        // Клик по кнопкам-действиям
        document.querySelector('.control-panel').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn'); if (!btn) return;
            btn.style.transform = 'scale(0.92)'; setTimeout(() => btn.style.transform = '', 150);
            this.execute(btn.getAttribute('data-action'));
        });
        document.querySelector('.header-right').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn'); if (!btn) return;
            this.execute(btn.getAttribute('data-action'));
        });
        document.querySelector('.system-status-bar').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn'); if (!btn) return;
            this.execute(btn.getAttribute('data-action'));
        });

        // Тумблеры
        document.addEventListener('change', (e) => {
            if (!e.target.classList.contains('widget-toggle')) return;
            const wId = e.target.getAttribute('data-widget');
            const state = e.target.checked ? 'on' : 'off';
            
            // Отправляем команду в ядро (оно само обновит state и разошлет всем панелям)
            if (wId === 'cam') TwitchAPI.send(`!cam ${state}`);
            else if (wId === 'blur') TwitchAPI.send(`!blur ${state}`);
            else if (wId === 'deaths') TwitchAPI.send(`!death ${e.target.checked ? 'show' : 'hide'}`);
            else TwitchAPI.send(`!widget ${wId} ${state}`);
        });

        // Ползунок громкости
        const vol = document.getElementById('input-vol');
        if (vol) { 
            vol.addEventListener('input', (e) => { 
                document.getElementById('vol-label').innerText = e.target.value + '%'; 
                vol.style.setProperty('--slider-fill', e.target.value + '%'); 
            }); 
            vol.addEventListener('change', (e) => TwitchAPI.send(`!vol ${e.target.value}`)); 
        }

        // Enter в инпутах
        document.querySelectorAll('.smart-input input, .counter-input').forEach(i => { 
            i.addEventListener('keypress', (e) => { 
                if (e.key === 'Enter') { const b = e.currentTarget.parentElement.querySelector('.action-btn'); if (b) b.click(); } 
            }); 
        });
    }
};

/* ================= TWITCH API И ИНТЕГРАЦИИ ================= */
const TwitchAPI = {
    channel: null,
    connect: function(creds) {
        this.channel = creds.channel;
        UIBuilder.setLiveStatus('connecting');
        ComfyJS.Init(creds.user, creds.token, creds.channel);
        
        ComfyJS.onConnected = () => { 
            UIBuilder.setLiveStatus('connected'); 
            ToastService.show("⚡ СВЯЗЬ УСТАНОВЛЕНА"); 
            setTimeout(() => SyncEngine.requestSync(), 1500);
        };
        ComfyJS.onDisconnected = () => UIBuilder.setLiveStatus('error');
        ComfyJS.onReconnect = () => UIBuilder.setLiveStatus('connecting');

        // Перехват системных сообщений от бота
        ComfyJS.onMessage = (user, message, flags, self, extra) => {
            if (self) return; // Игнорируем свои же сообщения
            // Если парсер узнал системное сообщение, прячем его из UI, но применяем данные
            if (SyncEngine.parseChatSync(message)) {
                console.log("[TWITCH] Служебное сообщение перехвачено и скрыто.");
            }
        };

        this.embedIframes(creds.channel);
    },

    send: function(commandStr) {
        if (!commandStr) return;
        const client = ComfyJS.GetClient();
        if (client && client.readyState() === "OPEN") {
            ComfyJS.Say(commandStr, this.channel); 
            ToastService.show("✔️ Отправлено");
        } else {
            ToastService.show("❌ ОШИБКА: НЕТ СВЯЗИ", true); 
            UIBuilder.setLiveStatus('error');
            if (client) client.connect().catch(e => {});
        }
    },

    embedIframes: function(channel) {
        let d = window.location.hostname; if (!d || d === "127.0.0.1") d = "localhost";
        try {
            new Twitch.Embed("twitch-video-container", { width: "100%", height: "100%", channel: channel, layout: "video", autoplay: true, muted: true, parent: [d, "github.io"] });
            const f = document.createElement('iframe'); 
            f.src = `https://www.twitch.tv/embed/${channel}/chat?darkpopout&parent=${d}${d.includes('github.io') ? '&parent=github.io' : ''}`; 
            f.style.cssText = "width:100%;height:100%;border:none;"; 
            document.getElementById('twitch-chat-container').appendChild(f);
        } catch (e) {}
    }
};

/* ================= ИНИЦИАЛИЗАЦИЯ ================= */
const AppDeck = {
    init: function() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            const c = document.getElementById('auth-channel').value; const u = document.getElementById('auth-user').value; const t = document.getElementById('auth-token').value;
            if (!c || !u || !t) return alert("Заполните все поля!"); AuthManager.saveCreds(c, u, t); this.start();
        });
        document.getElementById('btn-logout').addEventListener('click', () => AuthManager.logout());
        
        if (AuthManager.isValid()) this.start(); 
        else document.getElementById('auth-modal').classList.remove('hidden');
    },
    start: function() {
        const creds = AuthManager.getCreds();
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('ui-channel-name').innerText = creds.channel;
        
        UIBuilder.init();
        CommandRegistry.bindEvents();
        SyncEngine.init();
        TwitchAPI.connect(creds);
    }
};

window.onload = () => AppDeck.init();