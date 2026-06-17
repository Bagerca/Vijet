/* ================= js/blur.js ================= */

window.AppBlur = {
    container: document.getElementById('screen-blur-overlay'),
    isActive: false,
    isInitialized: false,

    init: function() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        window.AppEvents.listen('BLUR_TOGGLE', d => { 
            if(d.state==='off') this.toggle(false); 
            else if(d.state==='on') this.toggle(true); 
            else this.toggle();
        });
    },

    toggle: function(forceState) {
        if (!this.container) return;
        
        this.isActive = forceState !== undefined ? forceState : !this.isActive;
        
        if (this.isActive) {
            this.container.classList.add('blur-active');
            if (window.AppPet) window.AppPet.setEmotion('alert', 3000);
        } else {
            this.container.classList.remove('blur-active');
        }
    }
};