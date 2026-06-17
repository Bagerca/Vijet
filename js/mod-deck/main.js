/* ================= js/mod-deck/main.js ================= */

// ИЗМЕНЕНО: Файл очищен от дублей AuthManager, DeckState и т.д.
// Теперь он выполняет только функцию стартера (Bootstrapper).
const AppDeck = {
    init: function() {
        document.getElementById('btn-connect').addEventListener('click', () => {
            const c = document.getElementById('auth-channel').value; 
            const u = document.getElementById('auth-user').value; 
            const t = document.getElementById('auth-token').value;
            
            if (!c || !u || !t) return alert("Заполните все поля!"); 
            window.AuthManager.saveCreds(c, u, t); 
            this.start();
        });
        
        document.getElementById('btn-logout').addEventListener('click', () => window.AuthManager.logout());
        
        if (window.AuthManager.isValid()) this.start(); 
        else document.getElementById('auth-modal').classList.remove('hidden');
    },
    
    start: function() {
        const creds = window.AuthManager.getCreds();
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('ui-channel-name').innerText = creds.channel;
        
        // Запуск модулей
        window.UIBuilder.init();
        window.CommandRegistry.bindEvents();
        window.SyncEngine.init();
        window.TwitchAPI.connect(creds);
    }
};

// Запуск после загрузки всех скриптов
window.onload = () => AppDeck.init();