/* ФАЙЛ: js/mic.js */
/* ================= УПРАВЛЕНИЕ ВЕБКАМЕРОЙ И ФИЛЬТРАМИ (БЕЗ АУДИО-СВЕЧЕНИЯ) ================= */
window.AppMedia = {
    container: document.getElementById('webcam-container'),
    frame: document.getElementById('webcam-frame'),
    filterLayer: null, 
    camEnabled: true, 
    
    init: function() {
        this.container.style.transition = "opacity 0.4s ease";
        
        // Создаем DOM-элемент для линзы фильтра
        this.filterLayer = document.createElement('div');
        this.filterLayer.id = 'webcam-filter-layer';
        this.container.appendChild(this.filterLayer);

        // Подписка на включение/выключение рамки
        window.AppEvents.listen('MEDIA_CAM', d => { 
            if(d.state==='off') this.toggleCam(false); 
            else if(d.state==='on') this.toggleCam(true); 
            else this.toggleCam();
        });
        
        // Слушаем изменение оптического фильтра (Нуар, ПНВ и тд)
        window.AppEvents.listen('CAM_FILTER_SET', d => {
            this.container.className = this.container.className.replace(/\bfilter-[^ ]+/g, '');
            if (d.filter && d.filter !== 'off') {
                this.container.classList.add(`filter-${d.filter}`);
            }
        });
    },

    toggleCam: function(forceState) {
        this.camEnabled = forceState !== undefined ? forceState : !this.camEnabled;
        this.container.style.opacity = this.camEnabled ? "1" : "0";
    }
};

window.AppMedia.init();