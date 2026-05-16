window.AppBlur = {
    container: document.getElementById('screen-blur-overlay'),
    isActive: false,

    toggle: function(forceState) {
        if (!this.container) return;
        
        this.isActive = forceState !== undefined ? forceState : !this.isActive;
        
        if (this.isActive) {
            this.container.classList.add('blur-active');
            // Питомец реагирует на включение режима "секретности"
            if (window.AppPet) window.AppPet.setEmotion('alert', 3000);
        } else {
            this.container.classList.remove('blur-active');
        }
    }
};