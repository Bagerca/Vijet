/* ФАЙЛ: js/mod-deck/ui.js */

window.DeckUI = {
    init() {
        this.populateDynamicSelects(); 
        this.setupModifierPills();
        this.setupHoldButtons();
        this.setupParticleSliders();
        this.renderSoundboard(); // Рисуем саундборд

        const targetChatSelect = document.getElementById('target-chat-select');
        if (targetChatSelect) {
            targetChatSelect.addEventListener('click', () => {
                setTimeout(() => {
                    const val = targetChatSelect.getAttribute('data-value');
                    if (window.DeckAuth) window.DeckAuth.setTargetChannel(val);
                }, 50); 
            });
        }

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

    buttonFeedback(btn) {
        if (!btn || btn.classList.contains('btn-hold') || btn.classList.contains('btn-fox')) return;
        
        const originalHtml = btn.innerHTML;
        const originalWidth = btn.offsetWidth;
        
        btn.style.width = `${originalWidth}px`;
        btn.classList.add('btn-success');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        
        setTimeout(() => {
            btn.classList.remove('btn-success');
            btn.innerHTML = originalHtml;
            btn.style.width = '';
        }, 1000);
    },

    setSelectValue(selectId, value) {
        const customSelect = document.getElementById(selectId);
        if (!customSelect) return;
        let safeValue = value;
        if (!safeValue || safeValue === 'undefined' || safeValue === 'null') safeValue = 'off';
        if (customSelect.getAttribute('data-value') === safeValue) return;

        const itemsList = customSelect.querySelector('.select-items');
        const selectedVisual = customSelect.querySelector('.select-selected');
        if (!itemsList || !selectedVisual) return;

        const targetOption = Array.from(itemsList.querySelectorAll('div[data-value]')).find(opt => opt.getAttribute('data-value') === safeValue);

        if (targetOption) {
            customSelect.setAttribute('data-value', safeValue);
            selectedVisual.innerHTML = targetOption.innerHTML;
        } else {
            customSelect.setAttribute('data-value', safeValue);
            selectedVisual.innerHTML = safeValue === 'off' ? '❌ Скрыть плашку' : `🎮 ${safeValue}`;
        }
    },

    setupModifierPills() {
        document.querySelectorAll('.mod-pill').forEach(pill => {
            pill.addEventListener('click', e => e.currentTarget.classList.toggle('active'));
        });
    },

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
            const stopHold = () => { clearTimeout(timer); btn.classList.remove('holding'); };

            btn.addEventListener('mousedown', startHold);
            btn.addEventListener('mouseup', stopHold);
            btn.addEventListener('mouseleave', stopHold);
            btn.addEventListener('touchstart', startHold, {passive: false});
            btn.addEventListener('touchend', stopHold);
        });
    },

    setupParticleSliders() {
        const emitUpdate = () => {
            const count = parseInt(document.getElementById('part-count').value);
            const dist = parseInt(document.getElementById('part-dist').value);
            const speed = parseInt(document.getElementById('part-speed').value) / 10; 
            const color = document.getElementById('part-color').getAttribute('data-value');
            
            // Отправляем настройки через чат Twitch, чтобы OBS их увидел
            if (window.DeckAuth) {
                window.DeckAuth.sendCommand(`!particles ${count} ${dist} ${speed} ${color}`);
            }
        };

        const attachSlider = (id, valId, suffix, isFloat = false) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(valId);
            if (!el || !valEl) return;
            
            const lock = () => el.setAttribute('data-dragging', 'true');
            const unlock = () => {
                setTimeout(() => el.removeAttribute('data-dragging'), 1000);
            };
            
            el.addEventListener('mousedown', lock);
            el.addEventListener('touchstart', lock, {passive: true});
            
            // Визуальное обновление ползунка
            el.addEventListener('input', (e) => {
                lock();
                const val = e.target.value;
                const min = e.target.min;
                const max = e.target.max;
                const percent = ((val - min) / (max - min)) * 100;
                el.style.setProperty('--slider-fill', `${percent}%`);
                if (isFloat) valEl.innerText = (val / 10).toFixed(1) + suffix;
                else valEl.innerText = val + suffix;
            });

            // Отправка команды при отпускании мышки (смене значения)
            el.addEventListener('change', () => {
                emitUpdate();
                unlock();
            });
            
            el.addEventListener('mouseup', unlock);
            el.addEventListener('touchend', unlock);
        };

        attachSlider('part-count', 'part-count-val', '');
        attachSlider('part-dist', 'part-dist-val', 'px');
        attachSlider('part-speed', 'part-speed-val', 'x', true);
        
        // Отправка при изменении цвета в выпадающем списке
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

    renderSoundboard() {
        const container = document.getElementById('soundboard-grid');
        if (!container || !window.AppConfig.modDeck || !window.AppConfig.modDeck.soundboard) return;

        const sounds = window.AppConfig.modDeck.soundboard;
        container.innerHTML = sounds.map(snd => `
            <button type="button" class="btn btn-outline cmd-btn" data-cmd="!sound ${snd.id}" title="${snd.name}">${snd.name}</button>
        `).join('');
    },

    populateDynamicSelects() {
        if (window.GamesDatabase) {
            let htmlGames = `<div class="optgroup">Игры</div>`;
            let htmlSeries = `<div class="optgroup">Кино/Анимация</div>`;
            for (let key in window.GamesDatabase) {
                const item = window.GamesDatabase[key];
                const coverHtml = item.cover ? `<img src="${item.cover}" class="select-item-cover" alt="cover">` : '';
                const tagHtml = (item.tags && item.tags.length > 0) ? `<span class="item-mini-tag">${item.tags[0]}</span>` : '';
                const row = `<div class="item-with-cover" data-value="${key}">${coverHtml}<div class="item-cover-info"><span class="item-cover-title">${item.title}</span>${tagHtml}</div></div>`;
                item.type === 'game' ? htmlGames += row : htmlSeries += row;
            }
            const gameList = document.getElementById('dynamic-game-list');
            if (gameList) gameList.innerHTML = `<div data-value="off" style="padding: 16px;">❌ Скрыть плашку</div>` + htmlGames + htmlSeries;
            const wheelList = document.getElementById('dynamic-wheel-list');
            if (wheelList) wheelList.innerHTML = htmlGames + htmlSeries;
        }

        const chatList = document.getElementById('dynamic-chat-styles');
        if (chatList && window.AppConfig && window.AppConfig.customChatStyles) {
            const stylesObj = window.AppConfig.customChatStyles;
            const formatLabel = (str) => { if (!str) return "Custom"; return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); };
            let vipsHtml = `<div class="optgroup">Обычный чат</div><div data-value="testuser default_user" style="padding: 16px;">Дефолт (Обычное)</div><div class="optgroup">Кастомные стили (VIP)</div>`;
            const vipLogins = Object.keys(stylesObj);
            vipLogins.forEach(login => {
                const styleName = stylesObj[login];
                const label = login === window.AppConfig.channelName ? "Владелец" : formatLabel(styleName);
                vipsHtml += `<div data-value="testuser ${login}" class="item-with-cover" style="padding: 12px 16px !important;"><img src="https://ui-avatars.com/api/?name=${login}&background=222&color=fff" id="av-${login}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #222;"><span style="font-size: 13px; font-weight: 500; color: #fff;">${login} <span class="text-muted">(${label})</span></span></div>`;
            });
            chatList.innerHTML = vipsHtml;
            vipLogins.forEach(login => {
                fetch(`https://api.ivr.fi/v2/twitch/user?login=${login}`).then(res => res.json()).then(data => {
                    if (data?.[0]?.logo) { const img = document.getElementById(`av-${login}`); if (img) img.src = data[0].logo; }
                }).catch(() => {});
            });
        }

        const themeSelect = document.getElementById('custom-theme-select');
        if (themeSelect && window.AppConfig && window.AppConfig.modDeck && window.AppConfig.modDeck.themes) {
            const themeList = themeSelect.querySelector('.select-items');
            const themeDisplay = themeSelect.querySelector('.select-selected');
            const themes = window.AppConfig.modDeck.themes;
            if (themeList && themes.length > 0) {
                themeList.innerHTML = themes.map(t => `<div data-value="${t.cmd}" style="padding: 16px;">${t.name}</div>`).join('');
                themeSelect.setAttribute('data-value', themes[0].cmd);
                themeDisplay.innerHTML = themes[0].name;
            }
        }

        const alertSelect = document.getElementById('custom-test-alert');
        if (alertSelect && window.AppConfig && window.AppConfig.modDeck && window.AppConfig.modDeck.alerts) {
            const alertList = alertSelect.querySelector('.select-items');
            const alertDisplay = alertSelect.querySelector('.select-selected');
            const alerts = window.AppConfig.modDeck.alerts;
            if (alertList && alerts.length > 0) {
                let alertHtml = ''; let firstValidAlert = null;
                alerts.forEach(a => {
                    if (a.group) alertHtml += `<div class="optgroup">${a.group}</div>`;
                    else { if (!firstValidAlert) firstValidAlert = a; alertHtml += `<div data-value="${a.cmd}" style="padding: 16px;">${a.name}</div>`; }
                });
                alertList.innerHTML = alertHtml;
                if (firstValidAlert) { alertSelect.setAttribute('data-value', firstValidAlert.cmd); alertDisplay.innerHTML = firstValidAlert.name; }
            }
        }

        document.querySelectorAll('.custom-select').forEach(el => new CustomSelect(el));
    }
};