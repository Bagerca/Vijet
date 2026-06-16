/* ================= mod-deck/ui.js ================= */

const ToastService = {
    show: (msg, isError = false) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
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

const UIBuilder = {
    widgetsConfig: [
        { id: 'chat', label: 'Чат' }, { id: 'media', label: 'Сейчас играем' }, { id: 'goal', label: 'Цель фолловеров' }, { id: 'alerts', label: 'Алерты' },
        { id: 'socials', label: 'Соцсети' }, { id: 'ticker', label: 'Бегущая строка' }, { id: 'pet', label: 'Питомец (Лиса)' }, { id: 'emotes', label: 'Смайлы чата' },
        { id: 'music', label: 'Плеер YouTube' }, { id: 'tts', label: 'TTS Озвучка' }, { id: 'particles', label: 'Фон. частицы' }, { id: 'shoutout', label: 'Shoutout' }
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

    syncTheme: function(theme) {
        const cs = document.getElementById('custom-theme-select');
        if (!cs) return;
        cs.setAttribute('data-value', theme);
        const sel = cs.querySelector('.select-selected');
        const items = cs.querySelectorAll('.select-items div[data-value]');
        items.forEach(opt => {
            if (opt.getAttribute('data-value') === theme) {
                sel.innerHTML = opt.innerHTML;
            }
        });
    },

    syncMedia: function(media) {
        const gameCs = document.getElementById('custom-game-select');
        const ytInput = document.getElementById('input-media-yt');
        
        if (gameCs) {
            gameCs.setAttribute('data-value', 'off');
            gameCs.querySelector('.select-selected').innerHTML = '❌ Скрыть плашку';
        }
        if (ytInput) ytInput.value = '';

        if (!media) return;

        if (media.type === 'game' || media.type === 'series') {
            if (gameCs) {
                gameCs.setAttribute('data-value', media.query);
                const items = gameCs.querySelectorAll('.select-items div[data-value]');
                let found = false;
                items.forEach(opt => {
                    if (opt.getAttribute('data-value') === media.query) {
                        gameCs.querySelector('.select-selected').innerHTML = opt.innerHTML;
                        found = true;
                    }
                });
                if (!found) gameCs.querySelector('.select-selected').innerHTML = `<span>${media.query}</span>`;
            }
        } else if (media.type === 'yt') {
            if (ytInput) ytInput.value = media.query;
        }
    },

    syncVolume: function(vol) {
        const volInput = document.getElementById('input-vol');
        const volLabel = document.getElementById('vol-label');
        if (volInput && volLabel) {
            volInput.value = vol;
            volLabel.innerText = vol + '%';
            volInput.style.setProperty('--slider-fill', vol + '%');
        }
    },

    syncDeaths: function(count) {
        const deathInput = document.getElementById('input-death-val');
        if (deathInput) {
            deathInput.placeholder = `Сейчас: ${count}`;
        }
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
        if (el) el.className = `status-pill ${isAlive ? 'status-ok' : 'status-error'}`;
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
                let baseOptions = `<div class="optgroup">Обычный чат</div><div data-value="testchat">Дефолт (Обычный)</div>`;
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
                document.querySelectorAll('.custom-select').forEach(el => el.style.zIndex = "10");
                
                if (isOpening) { 
                    items.classList.remove('select-hide'); 
                    newSel.classList.add('select-arrow-active'); 
                    cs.style.zIndex = "999"; 
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

        document.querySelectorAll('.mod-pill').forEach(p => p.addEventListener('click', e => e.currentTarget.classList.toggle('active')));
    },
    
    getVal: (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; },
    getSel: (id) => { const el = document.getElementById(id); return el ? el.getAttribute('data-value') : null; },
    clear: (id) => { const el = document.getElementById(id); if (el) el.value = ""; }
};

window.ToastService = ToastService;
window.UIBuilder = UIBuilder;