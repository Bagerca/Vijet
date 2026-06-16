/* ================= УМНЫЙ ФИЛЬТР ЧАТА V4.2 (Ultra-Compatible & Safe Sidechain) ================= */

window.ChatFilter = {
    isCompiled: false,
    compiled: { roots: [], exacts: [], whitelist: [] },

    // 1. КОРНИ. Блокируются в любых склонениях (пидор, пидорас, пидорский).
    badRoots: [ 
        "негр", "nigg", "пидор", "пидар", "pidor", "pidar", "педик", "pedik", 
        "даун", "daun", "аутист", "retard", "чурк", "чурек", 
        "хохол", "xoxol", "hoxol", "свинорус", "русня", "кацап", "москаль", 
        "шлюх", "шалав", "whore", "slut" 
    ],
    
    // 2. ТОЧНЫЕ СЛОВА. Блокируются только если стоят отдельно.
    exactWords: [ 
        "хач", "hach", "xach", "запретка", "осуждаю" 
    ],
    
    // 3. БЕЛЫЙ СПИСОК. Слова-щиты. Спасают от случайных банов.
    whitelist: [ 
        "негромк", "снегр", "негритян", "винегрет", "интегр", "эмигр", "иммигр", "черногор", "сенегал", 
        "педикюр", "педиатр", "энциклопеди", "велосипед", "логопед", "педигри", 
        "дауншифт", "локдаун", "даунхил", "сандаун", "мелтдаун", 
        "хохот", "хохолок", "хохолком", "прохохот", 
        "хачапур", "тхач", "лихач", "богач", "трюкач", "тягач", "пугач", "строгач", "ткач", "кумач" 
    ],

    // 4. СЛОВАРЬ МУТАЦИЙ (Для защиты от замены букв цифрами и английскими аналогами)
    letterMap: {
        'а': '[аa@4]', 'a': '[аa@4]', 'б': '[бb6]', 'b': '[бb6]', 'в': '[вv8w]', 'v': '[вv8w]', 'w': '[вv8w]',
        'г': '[гg]', 'g': '[гg]', 'д': '[дd]', 'd': '[дd]', 'е': '[еeё3]', 'e': '[еeё3]',
        'ж': '(ж|zh)', 'з': '[зz3]', 'z': '[зz3]', 'и': '[иi1!y]', 'i': '[иi1!y]', 'y': '[иi1!y]',
        'й': '[йj]', 'j': '[йj]', 'к': '[кk]', 'k': '[кk]', 'л': '[лl]', 'l': '[лl]',
        'м': '[мm]', 'm': '[мm]', 'н': '[нn]', 'n': '[нn]', 'о': '[оo0]', 'o': '[оo0]',
        'п': '[пp]', 'p': '[пp]', 'р': '[рr]', 'r': '[рr]', 'с': '[сsc]', 's': '[сsc]', 'c': '[сscц]',
        'т': '[тt]', 't': '[тt]', 'у': '[уu]', 'u': '[уu]', 'ф': '[фf]', 'f': '[фf]',
        'х': '[хxh]', 'h': '[хxh]', 'x': '[хxh]', 'ц': '[цc]', 'c': '[цc]', 'ч': '(ч|4|ch)', 'ш': '(ш|sh)',
        'щ': '(щ|sch)', 'ъ': 'ъ?', 'ы': '[ыi]', 'ь': 'ь?', 'э': '[эe]', 'ю': '(ю|u|yu)', 'я': '(я|ya)'
    },

    // Математический генератор формулы поиска с защитой от двойного квантификатора
    _buildPattern: function(word) {
        let pattern = '';
        for (let char of word.toLowerCase()) {
            if (this.letterMap[char]) {
                let mapped = this.letterMap[char];
                // Защита: если мутация уже содержит квантификатор '?' (как у ь/ъ), не клеим к нему '+'
                if (mapped.endsWith('?')) {
                    pattern += mapped + '[\\s\\W_]*';
                } else {
                    pattern += mapped + '+[\\s\\W_]*';
                }
            } else {
                let safeChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                pattern += safeChar + '+[\\s\\W_]*';
            }
        }
        return pattern.replace(/\[\\s\\W_\]\*$/, ''); // Убираем хвост
    },

    // Компиляция всех слов в регулярные выражения (вызывается один раз)
    compile: function(configWords) {
        const safeWords = configWords || [];
        
        // Объединяем конфиг со встроенным словарем
        safeWords.forEach(w => {
            if (w && !this.badRoots.includes(w) && !this.exactWords.includes(w)) {
                this.badRoots.push(w);
            }
        });

        this.whitelist.forEach(w => {
            this.compiled.whitelist.push(new RegExp(`(${this._buildPattern(w)})`, 'gi'));
        });

        this.exactWords.forEach(w => {
            // Ищет слово только если оно ограничено пробелами или краями строки
            this.compiled.exacts.push(new RegExp(`(^|[^a-zа-яё0-9])(${this._buildPattern(w)})($|[^a-zа-яё0-9])`, 'gi'));
        });

        this.badRoots.forEach(w => {
            this.compiled.roots.push(new RegExp(`(${this._buildPattern(w)})`, 'gi'));
        });

        this.isCompiled = true;
    },

    // Главный конвейер очистки
    processText: function(htmlString, configWords) {
        if (!this.isCompiled) this.compile(configWords);

        let hasForbidden = false; 
        const tags = [];
        const safes = [];
        
        // ШАГ 1: Защищаем HTML теги (смайлы, иконки) от поломки
        let processingString = htmlString.replace(/<[^>]+>/g, (match) => {
            tags.push(match);
            return `__TAG_${tags.length - 1}__`;
        });

        // ШАГ 2: Активируем ЩИТ (прячем нормальные слова из Белого Списка)
        this.compiled.whitelist.forEach(regex => {
            processingString = processingString.replace(regex, (match) => {
                safes.push(match);
                return `__SAFE_${safes.length - 1}__`;
            });
        });

        // ШАГ 3: Уничтожаем ТОЧНЫЕ матерные слова
        this.compiled.exacts.forEach(regex => {
            let original = processingString;
            processingString = processingString.replace(regex, `$1__BAD__$3`);
            if (processingString !== original) {
                hasForbidden = true;
            }
        });

        // ШАГ 4: Уничтожаем КОРНИ матерных слов (в любых формах и с любыми пробелами)
        this.compiled.roots.forEach(regex => {
            let original = processingString;
            processingString = processingString.replace(regex, `__BAD__`);
            if (processingString !== original) {
                hasForbidden = true;
            }
        });

        // ШАГ 5: Превращаем убитые слова в красивые бейджики
        processingString = processingString.replace(/__BAD__/g, `<span class="censured-badge">CENSURED</span>`);

        // ШАГ 6: Снимаем щит (возвращаем нормальные слова)
        processingString = processingString.replace(/__SAFE_(\d+)__/g, (match, p1) => safes[p1] || match);

        // ШАГ 7: Возвращаем HTML теги
        let finalResult = processingString.replace(/__TAG_(\d+)__/g, (match, p1) => tags[p1] || match);

        // ШАГ 8: Если в сообщении был ТОЛЬКО мат, заменяем всё сообщение
        if (hasForbidden) {
            let cleanText = finalResult.replace(/<[^>]+>/g, '').trim();
            if (cleanText === "CENSURED" || cleanText === "CENSURED CENSURED") {
                finalResult = `<div class="censured-message">СООБЩЕНИЕ СКРЫТО ФИЛЬТРОМ</div>`;
            }
        }

        return { text: finalResult, hasForbidden };
    },

    // Парсер эмодзи Твича
    parseEmotes: function(message, emotes) {
        if (!emotes) return this.escapeHTML(message);
        let stringArr = message.split('');
        for (let id in emotes) {
            let emotePositions = emotes[id];
            for (let i = 0; i < emotePositions.length; i++) {
                let pos = emotePositions[i].split('-');
                let start = parseInt(pos[0]); let end = parseInt(pos[1]);
                stringArr[start] = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0" class="chat-emote">`;
                for (let j = start + 1; j <= end; j++) stringArr[j] = ''; 
            }
        }
        let finalStr = '';
        for (let i = 0; i < stringArr.length; i++) {
            if (stringArr[i].startsWith('<img')) finalStr += stringArr[i];
            else finalStr += this.escapeHTML(stringArr[i]);
        }
        return finalStr;
    },

    // Экранирование опасных символов
    escapeHTML: function(str) { 
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
    }
};