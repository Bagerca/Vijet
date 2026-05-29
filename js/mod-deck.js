/* ================= УМНАЯ СТУДИЙНАЯ КОНСОЛЬ (PRO EDITION) ================= */

const AppDeck = {
    creds: {
        channel: localStorage.getItem('uso_mod_channel') || '',
        user: localStorage.getItem('uso_mod_user') || '',
        token: localStorage.getItem('uso_mod_token') || ''
    },

    init: function() {
        this.bindAuthEvents();
        if (this.creds.channel && this.creds.user && this.creds.token) {
            this.connectToTwitch();
        } else {
            document.getElementById('auth-modal').classList.remove('hidden');
        }
        
        this.populateDynamicSelects(); 
        this.setupCustomSelects();     
        this.setupModifierPills(); 
        this.bindCommands();
    },

    bindAuthEvents: function() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            const channel = document.getElementById('auth-channel').value.trim().toLowerCase();
            const user = document.getElementById('auth-user').value.trim().toLowerCase();
            let token = document.getElementById('auth-token').value.trim();

            if (!channel || !user || !token) { alert("Заполните все поля!"); return; }
            if (!token.startsWith('oauth:')) token = 'oauth:' + token;

            localStorage.setItem('uso_mod_channel', channel);
            localStorage.setItem('uso_mod_user', user);
            localStorage.setItem('uso_mod_token', token);

            this.creds = { channel, user, token };
            this.connectToTwitch();
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            localStorage.clear(); location.reload();
        });
    },

    connectToTwitch: function() {
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('ui-channel-name').innerText = this.creds.channel;

        ComfyJS.Init(this.creds.user, this.creds.token, this.creds.channel);
        ComfyJS.onConnected = () => this.showToast("⚡ СВЯЗЬ С ЯДРОМ УСТАНОВЛЕНА");

        this.embedTwitchWidgets();
    },

    embedTwitchWidgets: function() {
        const channelName = this.creds.channel;
        let currentDomain = window.location.hostname;
        if (currentDomain === "" || currentDomain === "127.0.0.1") currentDomain = "localhost";

        document.getElementById('twitch-video-container').innerHTML = '';
        document.getElementById('twitch-chat-container').innerHTML = '';

        try {
            new Twitch.Embed("twitch-video-container", {
                width: "100%", height: "100%",
                channel: channelName, layout: "video", autoplay: true, muted: true,
                parent: [currentDomain]
            });

            const chatIframe = document.createElement('iframe');
            chatIframe.src = `https://www.twitch.tv/embed/${channelName}/chat?darkpopout&parent=${currentDomain}`;
            chatIframe.style.width = "100%"; chatIframe.style.height = "100%"; chatIframe.style.border = "none";
            document.getElementById('twitch-chat-container').appendChild(chatIframe);
        } catch (e) {
            console.warn("Встройка Twitch не удалась.", e);
        }
    },

    sendCmd: function(commandString) {
        if (!commandString || commandString.trim() === "") return;
        ComfyJS.Say(commandString, this.creds.channel);
        this.showToast(`✔️ ${commandString.split(' ')[0]}`);
    },

    showToast: function(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg; toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight; 
        toast.style.animation = null;
        setTimeout(() => toast.classList.add('hidden'), 2500);
    },

    populateDynamicSelects: function() {
        if (!window.GamesDatabase) return;

        const gameList = document.getElementById('dynamic-game-list');
        const wheelList = document.getElementById('dynamic-wheel-list');
        
        let htmlGames = `<div class="optgroup">Игры</div>`;
        let htmlSeries = `<div class="optgroup">Кино/Анимация</div>`;
        
        for (let key in window.GamesDatabase) {
            const item = window.GamesDatabase[key];
            const coverHtml = item.cover ? `<img src="${item.cover}" class="select-item-cover">` : '';
            const row = `<div class="item-with-cover" data-value="${key}">${coverHtml}<span>${item.title}</span></div>`;
            
            if (item.type === 'game') htmlGames += row;
            else htmlSeries += row;
        }

        if (gameList) gameList.innerHTML = `<div data-value="off">❌ Скрыть плашку</div>` + htmlGames + htmlSeries;
        if (wheelList) wheelList.innerHTML = htmlGames + htmlSeries;
    },

    setupCustomSelects: function() {
        const customSelects = document.querySelectorAll('.custom-select');
        
        const resetZIndex = () => {
            document.querySelectorAll('.card').forEach(c => c.style.zIndex = '');
            document.querySelectorAll('.smart-input').forEach(i => i.style.zIndex = '2');
        };

        customSelects.forEach(customSelect => {
            const selected = customSelect.querySelector('.select-selected');
            const itemsList = customSelect.querySelector('.select-items');

            const newSelected = selected.cloneNode(true);
            selected.parentNode.replaceChild(newSelected, selected);
            
            newSelected.addEventListener('click', (e) => {
                e.stopPropagation();
                
                document.querySelectorAll('.select-items').forEach(el => {
                    if (el !== itemsList) el.classList.add('select-hide');
                });
                document.querySelectorAll('.select-selected').forEach(el => {
                    if (el !== newSelected) el.classList.remove('select-arrow-active');
                });
                
                const isOpening = itemsList.classList.contains('select-hide');
                
                if (isOpening) {
                    resetZIndex(); 
                    const parentCard = customSelect.closest('.card');
                    const parentInput = customSelect.closest('.smart-input');
                    if (parentCard) parentCard.style.zIndex = '9999';
                    if (parentInput) parentInput.style.zIndex = '9999';

                    itemsList.classList.remove('select-hide');
                    newSelected.classList.add('select-arrow-active');
                } else {
                    itemsList.classList.add('select-hide');
                    newSelected.classList.remove('select-arrow-active');
                    resetZIndex();
                }
            });

            const options = itemsList.querySelectorAll('div[data-value]');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    newSelected.innerHTML = option.innerHTML;
                    customSelect.setAttribute('data-value', option.getAttribute('data-value'));
                    itemsList.classList.add('select-hide');
                    newSelected.classList.remove('select-arrow-active');
                    resetZIndex(); 
                });
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
            document.querySelectorAll('.select-selected').forEach(el => el.classList.remove('select-arrow-active'));
            resetZIndex();
        });
    },

    setupModifierPills: function() {
        document.querySelectorAll('.mod-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.currentTarget.classList.toggle('active');
            });
        });
    },

    bindCommands: function() {
        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const t = e.currentTarget;
                t.style.transform = 'scale(0.92)';
                setTimeout(() => t.style.transform = '', 150);
                this.sendCmd(t.getAttribute('data-cmd'));
            });
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                let inputEl, val;

                const t = e.currentTarget;
                t.style.transform = 'scale(0.92)';
                setTimeout(() => t.style.transform = '', 150);

                switch(action) {
                    case 'play':
                        inputEl = document.getElementById('input-play'); val = inputEl.value.trim();
                        if (val) { this.sendCmd(`!play ${val}`); inputEl.value = ''; } break;
                    case 'tts':
                        inputEl = document.getElementById('input-tts'); val = inputEl.value.trim();
                        if (val) { this.sendCmd(`!tts ${val}`); inputEl.value = ''; } break;
                    case 'so':
                        inputEl = document.getElementById('input-so'); val = inputEl.value.trim();
                        if (val) { this.sendCmd(`!so ${val}`); inputEl.value = ''; } break;
                    
                    case 'set_death':
                        inputEl = document.getElementById('input-death-val'); val = inputEl.value.trim();
                        if (val !== "") { this.sendCmd(`!death set ${val}`); inputEl.value = ''; } break;

                    case 'setgame':
                        inputEl = document.getElementById('custom-game-select'); val = inputEl.getAttribute('data-value');
                        if (val === "off") this.sendCmd(`!game off`); else this.sendCmd(`!game ${val}`);
                        break;
                    case 'settheme':
                        inputEl = document.getElementById('custom-theme-select'); val = inputEl.getAttribute('data-value');
                        this.sendCmd(`!протокол ${val}`);
                        break;
                        
                    case 'testalert':
                        inputEl = document.getElementById('custom-test-alert'); val = inputEl.getAttribute('data-value');
                        this.sendCmd(`!${val}`);
                        break;
                    
                    case 'testchat':
                        const baseCmd = document.getElementById('custom-test-chat').getAttribute('data-value');
                        const msgInput = document.getElementById('test-chat-msg').value.trim();
                        
                        let flags = "";
                        document.querySelectorAll('.mod-pill.active').forEach(pill => {
                            flags += pill.getAttribute('data-mod') + " ";
                        });
                        
                        let finalCmd = `!${baseCmd}`;
                        if (flags.trim() !== "") finalCmd += ` ${flags.trim()}`;
                        if (msgInput !== "") finalCmd += ` ${msgInput}`;
                        
                        this.sendCmd(finalCmd);
                        document.getElementById('test-chat-msg').value = '';
                        break;

                    case 'add_wheel_custom':
                        inputEl = document.getElementById('input-wheel'); val = inputEl.value.trim();
                        if (val) { this.sendCmd(`!wheel add ${val}`); inputEl.value = ''; } break;
                    
                    case 'add_wheel_db':
                        inputEl = document.getElementById('custom-wheel-db'); val = inputEl.getAttribute('data-value');
                        if (val && val !== "") {
                            const dbItem = window.GamesDatabase[val];
                            const name = dbItem ? dbItem.title : val;
                            this.sendCmd(`!wheel add ${name}`);
                        }
                        break;
                        
                    // НОВОЕ: Спавн кучи эмодзи
                    case 'spawn_emotes':
                        // Отправляем строку с кучей глобальных смайлов Twitch, ядро их распарсит
                        // Добавляем рандомное число, чтобы антиспам Twitch не заблокировал одинаковые сообщения
                        this.sendCmd(`Kappa LUL PogChamp BibleThump Kreygasm Kappa LUL PogChamp BibleThump Kreygasm ${Math.floor(Math.random() * 1000)}`);
                        break;
                }
            });
        });

        document.querySelectorAll('.smart-input input, .mini-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const actionBtn = e.currentTarget.parentElement.querySelector('.action-btn');
                    if (actionBtn) actionBtn.click();
                }
            });
        });
    }
};

window.onload = () => AppDeck.init();