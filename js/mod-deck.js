/* ================= УМНАЯ СТУДИЙНАЯ КОНСОЛЬ (NEON EDITION) ================= */

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
        this.setupCustomSelects(); // Инициализация красивых списков
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

        // 1. ПОДКЛЮЧАЕМ ЧАТ
        ComfyJS.Init(this.creds.user, this.creds.token, this.creds.channel);
        ComfyJS.onConnected = () => this.showToast("Связь с ядром установлена!");

        // 2. ВСТРАИВАЕМ TWITCH СТРИМ И ЧАТ
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
            console.warn("Встройка Twitch не удалась. Убедитесь, что вы используете локальный сервер (localhost).", e);
        }
    },

    sendCmd: function(commandString) {
        if (!commandString || commandString.trim() === "") return;
        ComfyJS.Say(commandString, this.creds.channel);
        this.showToast(`Отправлено: ${commandString.split(' ')[0]}`);
    },

    showToast: function(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg; toast.classList.remove('hidden');
        // Сброс анимации для повторных кликов
        toast.style.animation = 'none';
        toast.offsetHeight; 
        toast.style.animation = null;
        
        setTimeout(() => toast.classList.add('hidden'), 2500);
    },

    // --- ЛОГИКА КАСТОМНЫХ ВЫПАДАЮЩИХ СПИСКОВ ---
    setupCustomSelects: function() {
        const customSelects = document.querySelectorAll('.custom-select');
        
        customSelects.forEach(customSelect => {
            const selected = customSelect.querySelector('.select-selected');
            const itemsList = customSelect.querySelector('.select-items');

            // Клик по шапке (открыть/закрыть)
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                // Закрываем все остальные открытые списки
                document.querySelectorAll('.select-items').forEach(el => {
                    if (el !== itemsList) el.classList.add('select-hide');
                });
                document.querySelectorAll('.select-selected').forEach(el => {
                    if (el !== selected) el.classList.remove('select-arrow-active');
                });
                
                itemsList.classList.toggle('select-hide');
                selected.classList.toggle('select-arrow-active');
            });

            // Клик по элементу списка
            const options = itemsList.querySelectorAll('div[data-value]');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    selected.innerHTML = option.innerHTML;
                    customSelect.setAttribute('data-value', option.getAttribute('data-value'));
                    itemsList.classList.add('select-hide');
                    selected.classList.remove('select-arrow-active');
                });
            });
        });

        // Закрываем списки при клике вне их области
        document.addEventListener('click', () => {
            document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
            document.querySelectorAll('.select-selected').forEach(el => el.classList.remove('select-arrow-active'));
        });
    },

    bindCommands: function() {
        // Обычные кнопки с командами в data-cmd
        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Добавляем эффект нажатия на кнопку для отклика
                const t = e.currentTarget;
                t.style.transform = 'scale(0.9)';
                setTimeout(() => t.style.transform = '', 150);
                this.sendCmd(t.getAttribute('data-cmd'));
            });
        });

        // Умные кнопки (читают данные из инпутов и селектов)
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                let inputEl, val;

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
                    
                    // Чтение из кастомного селекта
                    case 'setgame':
                        inputEl = document.getElementById('custom-game-select'); val = inputEl.getAttribute('data-value');
                        if (val === "off") this.sendCmd(`!game off`); else this.sendCmd(`!game ${val}`);
                        break;
                    case 'settheme':
                        inputEl = document.getElementById('custom-theme-select'); val = inputEl.getAttribute('data-value');
                        this.sendCmd(`!протокол ${val}`);
                        break;
                }
            });
        });

        // Отправка по нажатию Enter в инпутах
        document.querySelectorAll('.smart-input input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') e.currentTarget.parentElement.querySelector('.action-btn').click();
            });
        });
    }
};

window.onload = () => AppDeck.init();