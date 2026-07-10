/* ФАЙЛ: js/mod-deck/dropdown.js */
/* ================= УМНЫЕ ВЫПАДАЮЩИЕ СПИСКИ (С ПОИСКОМ) ================= */

class CustomSelect {
    constructor(element) {
        this.el = element;
        this.selected = this.el.querySelector('.select-selected');
        this.itemsList = this.el.querySelector('.select-items');
        this.isSearchable = this.el.classList.contains('searchable');
        
        this.init();
    }

    init() {
        // Заменяем узел, чтобы сбросить старые слушатели
        const newSelected = this.selected.cloneNode(true);
        this.selected.parentNode.replaceChild(newSelected, this.selected);
        this.selected = newSelected;

        // Если включен поиск, добавляем input
        if (this.isSearchable && !this.el.querySelector('.select-search')) {
            const searchHtml = `<div class="select-search"><input type="text" placeholder="Поиск..." autocomplete="off"></div>`;
            this.itemsList.insertAdjacentHTML('afterbegin', searchHtml);
            
            this.searchInput = this.itemsList.querySelector('input');
            this.searchInput.addEventListener('click', e => e.stopPropagation());
            this.searchInput.addEventListener('input', (e) => this.filterItems(e.target.value));
        }

        // Клик по шапке
        this.selected.addEventListener('click', (e) => {
            e.stopPropagation();
            const isClosing = !this.itemsList.classList.contains('select-hide');
            
            CustomSelect.closeAll(); // Закрываем все остальные
            
            if (!isClosing) {
                this.open();
            }
        });

        // Клик по элементам списка
        this.itemsList.querySelectorAll('div[data-value]').forEach(option => {
            option.addEventListener('click', () => {
                this.selected.innerHTML = option.innerHTML;
                this.el.setAttribute('data-value', option.getAttribute('data-value'));
                this.close();
                
                // Триггер мутации (нужно для color pickers)
                this.el.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    open() {
        CustomSelect.resetZIndex();
        this.el.closest('.card')?.style.setProperty('z-index', '9999');
        this.el.closest('.smart-input')?.style.setProperty('z-index', '9999');
        
        this.itemsList.classList.remove('select-hide');
        this.selected.classList.add('select-arrow-active');
        
        if (this.isSearchable && this.searchInput) {
            this.searchInput.value = '';
            this.filterItems('');
            setTimeout(() => this.searchInput.focus(), 100);
        }
    }

    close() {
        this.itemsList.classList.add('select-hide');
        this.selected.classList.remove('select-arrow-active');
        CustomSelect.resetZIndex();
    }

    filterItems(query) {
        const lowerQuery = query.toLowerCase().trim();
        const options = this.itemsList.querySelectorAll('div[data-value]');
        const optgroups = this.itemsList.querySelectorAll('.optgroup');

        options.forEach(opt => {
            const text = opt.textContent.toLowerCase();
            if (text.includes(lowerQuery)) opt.style.display = '';
            else opt.style.display = 'none';
        });

        // Умное скрытие заголовков групп, если все элементы внутри скрыты
        optgroups.forEach(group => {
            let hasVisibleSiblings = false;
            let nextEl = group.nextElementSibling;
            
            while (nextEl && !nextEl.classList.contains('optgroup')) {
                if (nextEl.style.display !== 'none' && !nextEl.classList.contains('select-search')) {
                    hasVisibleSiblings = true;
                    break;
                }
                nextEl = nextEl.nextElementSibling;
            }
            
            group.style.display = hasVisibleSiblings ? '' : 'none';
        });
    }

    static closeAll() {
        document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
        document.querySelectorAll('.select-selected').forEach(el => el.classList.remove('select-arrow-active'));
        CustomSelect.resetZIndex();
    }

    static resetZIndex() {
        document.querySelectorAll('.card').forEach(c => c.style.zIndex = '');
        document.querySelectorAll('.smart-input').forEach(i => i.style.zIndex = '2');
    }
}

// Глобальный слушатель клика вне селектов
document.addEventListener('click', () => CustomSelect.closeAll());