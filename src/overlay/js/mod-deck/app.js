/* ==========================================================
   ГЛАВНЫЙ ОРКЕСТРАТОР ПАНЕЛИ УПРАВЛЕНИЯ (MOD DECK)
   Отвечает за последовательный запуск всех раздробленных модулей.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.info("[USO] Инициализация модульной панели управления...");

    // 1. Инициализация визуального интерфейса и элементов (Тосты, Селекты, Пиллсы)
    if (window.DeckUI) window.DeckUI.init();

    // 2. Инициализация тумблеров (Мастер виджетов)
    if (window.DeckWidgets) window.DeckWidgets.init();

    // 3. Подключение обработчиков кликов по кнопкам
    if (window.DeckCommands) window.DeckCommands.init();

    // 4. Локальная синхронизация очереди треков
    if (window.DeckQueue) window.DeckQueue.init();

    // 5. НОВОЕ: Подключение к Ядру для получения актуального статуса (Блюр, Камера, Музыка)
    if (window.DeckSync) window.DeckSync.init();

    // 6. Подключение к Twitch и авторизация (Должно запускаться самым последним!)
    if (window.DeckAuth) window.DeckAuth.init();
});