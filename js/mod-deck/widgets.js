/* ФАЙЛ: js/mod-deck/widgets.js */

window.DeckWidgets = {
    groups: [
        { 
            title: "Основные", 
            items: [{ id: 'chat', label: 'Чат' }, { id: 'media', label: 'Сейчас играем' }, { id: 'alerts', label: 'Алерты' }] 
        },
        { 
            title: "Инфо и Цели", 
            items: [{ id: 'socials', label: 'Соцсети' }, { id: 'goal', label: 'Цель фолловеров' }, { id: 'ticker', label: 'Бегущая строка' }] 
        },
        { 
            title: "Интерактив", 
            items: [{ id: 'pet', label: 'Питомец (Лиса)' }, { id: 'emotes', label: 'Смайлы чата' }, { id: 'music', label: 'ПлеЕР YouTube' }, { id: 'tts', label: 'TTS Эквалайзер' }] 
        },
        { 
            title: "Эффекты", 
            items: [{ id: 'particles', label: 'Фон. частицы' }, { id: 'shoutout', label: 'Shoutout' }] 
        }
    ],

    init() {
        const grid = document.getElementById('widget-master-grid');
        if (!grid) return;

        // Генерируем сгруппированный HTML
        grid.innerHTML = this.groups.map(group => `
            <div class="widget-group">
                <div class="widget-group-title">${group.title}</div>
                ${group.items.map(w => `
                    <div class="toggle-row">
                        <span class="toggle-label">${w.label}</span>
                        <label class="switch"><input type="checkbox" class="widget-toggle" data-widget="${w.id}" checked><span class="slider"></span></label>
                    </div>
                `).join('')}
            </div>
        `).join('');

        document.querySelectorAll('.widget-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const widgetName = e.target.getAttribute('data-widget');
                const state = e.target.checked ? 'on' : 'off';
                window.DeckAuth.sendCommand(`!widget ${widgetName} ${state}`);
            });
        });
    },

    syncToggleFromChat(command, message) {
        const cmd = command.toLowerCase();
        const arg = message.trim().toLowerCase();
        
        const setToggle = (id, stateStr) => {
            const toggle = document.querySelector(`.widget-toggle[data-widget="${id}"]`);
            if (toggle) toggle.checked = (stateStr === 'on' || stateStr === 'show');
        };

        if (cmd === 'widget' || cmd === 'виджет') {
            const parts = arg.split(' ');
            if (parts.length >= 2) setToggle(parts[0], parts[1]);
        }
    }
};