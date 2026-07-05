/* ФАЙЛ: js/mod-deck/ui.js */

window.DeckUI = {
    init() {
        this.setupCustomSelects();
        this.setupModifierPills();
        this.setupHoldButtons();
        this.setupParticleSliders();
        this.populateDynamicSelects();

        // 1. Прослушка переключателя ЦЕЛЕВОГО ЧАТА
        const targetChatSelect = document.getElementById('target-chat-select');
        if (targetChatSelect) {
            targetChatSelect.addEventListener('click', () => {
                setTimeout(() => {
                    const val = targetChatSelect.getAttribute('data-value');
                    if (window.DeckAuth) window.DeckAuth.setTargetChannel(val);
                }, 50); 
            });
        }

        // 2. Инициализация тумблера ДЕБАГА
        const debugToggle = document.getElementById('toggle-debug');
        if (debugToggle) {
            debugToggle.checked = localStorage.getItem('uso_debug_mode') === 'true';
            
            debugToggle.addEventListener('change', (e) => {
                const isDebug = e.target.checked;
                window.AppEvents.emit('DEBUG_MODE_TOGGLE', { state: isDebug });
                this.showToast(isDebug ? '🐞 ЛОГИ ВКЛЮЧЕНЫ' : '🤫 ТИХИЙ РЕЖИМ');
            });
        }
    },

    updateStatus(colorType, text) {
        const indicator = document.querySelector('.live-indicator');
        if (!indicator) return;
        
        let hexColor = colorType === 'yellow' ? '#FEE101' : colorType === 'red' ? '#FF0050' : '#00FF7F'; 
        let animation = colorType === 'green' ? 'pulse 1.5s infinite' : 'none';

        indicator.innerHTML = `<span class="live-dot" style="background: ${hexColor}; box-shadow: 0 0 10px ${hexColor}; animation: ${animation};"></span> <span id="ui-status-text">${text}</span>`;
    },

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.innerText = msg; 
        const isError = msg.includes("ОШИБКА") || msg.includes("НЕТ СВЯЗИ");
        
        toast.style.background = isError ? "#FF0050" : "var(--c-green)";
        toast.style.color = isError ? "#fff" : "#000";
        toast.style.boxShadow = isError ? "0 10px 30px rgba(255, 0, 80, 0.4)" : "0 10px 30px var(--c-green-glow)";

        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        void toast.offsetWidth; 
        toast.style.animation = null;
        
        setTimeout(() => toast.classList.add('hidden'), 2500);
    },

    // ПРОГРАММНОЕ ПЕРЕКЛЮЧЕНИЕ СЕЛЕКТОВ
    setSelectValue(selectId, value) {
        const customSelect = document.getElementById(selectId);
        if (!customSelect) return;
        
        // ФИКС БАГА С UNDEFINED
        let safeValue = value;
        if (!safeValue || safeValue === 'undefined' || safeValue === 'null') safeValue = 'off';

        if (customSelect.getAttribute('data-value') === safeValue) return;

        const itemsList = customSelect.querySelector('.select-items');
        const selectedVisual = customSelect.querySelector('.select-selected');
        
        if (!itemsList || !selectedVisual) return;

        const targetOption = Array.from(itemsList.querySelectorAll('div[data-value]'))
                                  .find(opt => opt.getAttribute('data-value') === safeValue);

        if (targetOption) {
            customSelect.setAttribute('data-value', safeValue);
            selectedVisual.innerHTML = targetOption.innerHTML;
        } else {
            customSelect.setAttribute('data-value', safeValue);
            selectedVisual.innerHTML = safeValue === 'off' ? '❌ Скрыть плашку' : `🎮 ${safeValue}`;
        }
    },

    setupCustomSelects() {
        const resetZIndex = () => {
            document.querySelectorAll('.card').forEach(c => c.style.zIndex = '');
            document.querySelectorAll('.smart-input').forEach(i => i.style.zIndex = '2');
        };

        document.querySelectorAll('.custom-select').forEach(customSelect => {
            const selected = customSelect.querySelector('.select-selected');
            const itemsList = customSelect.querySelector('.select-items');

            const newSelected = selected.cloneNode(true);
            selected.parentNode.replaceChild(newSelected, selected);
            
            newSelected.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.select-items').forEach(el => { if (el !== itemsList) el.classList.add('select-hide'); });
                document.querySelectorAll('.select-selected').forEach(el => { if (el !== newSelected) el.classList.remove('select-arrow-active'); });
                
                if (itemsList.classList.contains('select-hide')) {
                    resetZIndex(); 
                    customSelect.closest('.card')?.style.setProperty('z-index', '9999');
                    customSelect.closest('.smart-input')?.style.setProperty('z-index', '9999');
                    itemsList.classList.remove('select-hide');
                    newSelected.classList.add('select-arrow-active');
                } else {
                    itemsList.classList.add('select-hide');
                    newSelected.classList.remove('select-arrow-active');
                    resetZIndex();
                }
            });

            itemsList.querySelectorAll('div[data-value]').forEach(option => {
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

    setupModifierPills() {
        document.querySelectorAll('.mod-pill').forEach(pill => {
            pill.addEventListener('click', e => e.currentTarget.classList.toggle('active'));
        });
    },

    // ЛОГИКА УДЕРЖАНИЯ КНОПОК ДЛЯ ЗАЩИТЫ ОТ МИССКЛИКОВ
    setupHoldButtons() {
        document.querySelectorAll('.btn-hold').forEach(btn => {
            let timer;
            
            const triggerAction = () => {
                btn.classList.remove('holding');
                const cmd = btn.getAttribute('data-cmd');
                const action = btn.getAttribute('data-action');
                
                if (cmd && window.DeckAuth) window.DeckAuth.sendCommand(cmd);
                else if (action && window.DeckCommands) window.DeckCommands.handleAction(action);
            };

            const startHold = (e) => {
                if (e.type === 'touchstart') e.preventDefault(); 
                btn.classList.add('holding');
                timer = setTimeout(triggerAction, 1500); 
            };
            
            const stopHold = () => {
                clearTimeout(timer);
                btn.classList.remove('holding');
            };

            btn.addEventListener('mousedown', startHold);
            btn.addEventListener('mouseup', stopHold);
            btn.addEventListener('mouseleave', stopHold);
            btn.addEventListener('touchstart', startHold, {passive: false});
            btn.addEventListener('touchend', stopHold);
        });
    },

    // ЛОГИКА НАСТРОЙКИ ЧАСТИЦ С ДЕБАУНСОМ
    setupParticleSliders() {
        let updateTimer;
        
        const emitUpdate = () => {
            const count = parseInt(document.getElementById('part-count').value);
            const dist = parseInt(document.getElementById('part-dist').value);
            const speed = parseInt(document.getElementById('part-speed').value) / 10; 
            const color = document.getElementById('part-color').getAttribute('data-value');

            window.AppEvents.emit('PARTICLES_CFG', { count, distance: dist, speed, color });
        };

        const attachSlider = (id, valId, suffix, isFloat = false) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(valId);
            if (!el || !valEl) return;

            el.addEventListener('input', (e) => {
                const val = e.target.value;
                const min = e.target.min;
                const max = e.target.max;
                const percent = ((val - min) / (max - min)) * 100;
                
                el.style.setProperty('--slider-fill', `${percent}%`);
                
                if (isFloat) valEl.innerText = (val / 10).toFixed(1) + suffix;
                else valEl.innerText = val + suffix;

                clearTimeout(updateTimer);
                updateTimer = setTimeout(emitUpdate, 50);
            });
        };

        attachSlider('part-count', 'part-count-val', '');
        attachSlider('part-dist', 'part-dist-val', 'px');
        attachSlider('part-speed', 'part-speed-val', 'x', true);

        const colorSelect = document.getElementById('part-color');
        if (colorSelect) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(m => {
                    if (m.attributeName === 'data-value') emitUpdate();
                });
            });
            observer.observe(colorSelect, { attributes: true });
        }
    },

    populateDynamicSelects() {
        if (window.GamesDatabase) {
            let htmlGames = `<div class="optgroup">Игры</div>`;
            let htmlSeries = `<div class="optgroup">Кино/Анимация</div>`;
            
            for (let key in window.GamesDatabase) {
                const item = window.GamesDatabase[key];
                const coverHtml = item.cover ? `<img src="${item.cover}" class="select-item-cover" alt="cover">` : '';
                const row = `<div class="item-with-cover" data-value="${key}">${coverHtml}<span>${item.title}</span></div>`;
                item.type === 'game' ? htmlGames += row : htmlSeries += row;
            }

            const gameList = document.getElementById('dynamic-game-list');
            if (gameList) gameList.innerHTML = `<div data-value="off">❌ Скрыть плашку</div>` + htmlGames + htmlSeries;
            
            const wheelList = document.getElementById('dynamic-wheel-list');
            if (wheelList) wheelList.innerHTML = htmlGames + htmlSeries;
        }

        const chatList = document.getElementById('dynamic-chat-styles');
        if (chatList) {
            const vipUsers = [
                { login: "ksusha__sher", label: "Neon (Владелец)" },
                { login: "bagercaa", label: "Hollow Knight" },
                { login: "kiriika1", label: "Minecraft" },
                { login: "to_be_ang", label: "Ангел" },
                { login: "dragonsmaddison", label: "Bendy 1930s" },
                { login: "darkl1us", label: "Tactical HUD" },
                { login: "tetlabot", label: "Terminal" },
                { login: "treebals", label: "Terminal" }
            ];

            chatList.innerHTML = `
                <div class="optgroup">Обычный чат</div>
                <div data-value="testuser default_user">Дефолт (Обычное)</div>
                <div class="optgroup">Кастомные стили (VIP)</div>
                ${vipUsers.map(u => `
                    <div data-value="testuser ${u.login}" class="item-with-cover">
                        <img src="https://ui-avatars.com/api/?name=${u.login}&background=222&color=fff" id="av-${u.login}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #222;">
                        <span>${u.login} <span class="text-muted">(${u.label})</span></span>
                    </div>`).join('')}
            `;

            vipUsers.forEach(u => {
                fetch(`https://api.ivr.fi/v2/twitch/user?login=${u.login}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data?.[0]?.logo) {
                            const img = document.getElementById(`av-${u.login}`);
                            if (img) img.src = data[0].logo;
                        }
                    }).catch(() => {});
            });
        }
        
        this.setupCustomSelects(); 
    }
};