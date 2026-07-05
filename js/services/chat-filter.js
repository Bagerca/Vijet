window.ChatFilter = {
    processText: function(htmlString, forbiddenWords) {
        if (!forbiddenWords || forbiddenWords.length === 0) return { text: htmlString, hasForbidden: false };

        let hasForbidden = false; 
        const tags = [];
        let safeString = htmlString.replace(/<[^>]+>/g, (match) => {
            tags.push(match);
            return `__TAG_${tags.length - 1}__`;
        });

        // 1. Поиск точных совпадений
        forbiddenWords.forEach(word => {
            const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${safeWord})`, 'gi');
            if (regex.test(safeString)) {
                hasForbidden = true;
                safeString = safeString.replace(regex, `<span class="censured-badge">CENSURED</span>`);
            }
        });

        // 2. Умный поиск (омоглифы)
        if (!hasForbidden) {
            let textOnly = htmlString.replace(/<[^>]+>/g, '');
            let normalized = this._normalize(textOnly);

            for (let word of forbiddenWords) {
                let cleanRoot = this._normalize(word);
                if (cleanRoot.length > 2 && normalized.includes(cleanRoot)) {
                    hasForbidden = true;
                    safeString = `<div class="censured-message">СООБЩЕНИЕ СКРЫТО ФИЛЬТРОМ</div>`;
                    tags.length = 0; 
                    break;
                }
            }
        }

        let finalResult = safeString.replace(/__TAG_(\d+)__/g, (match, p1) => tags[p1] || match);
        return { text: finalResult, hasForbidden };
    },

    _normalize: function(text) {
        const map = {
            'a':'а', 'e':'е', 'o':'о', 'p':'р', 'c':'с', 'x':'х', 'y':'у', 
            'k':'к', 'm':'м', 't':'т', 'b':'в', '0':'о', '1':'и', '3':'з', 
            '4':'ч', '6':'б', '8':'в', '@':'а'
        };
        let lower = text.toLowerCase();
        let normalized = '';
        for (let char of lower) normalized += map[char] || char; 
        
        normalized = normalized.replace(/[^а-яёa-z]/g, '');
        let deduplicated = '';
        for (let i = 0; i < normalized.length; i++) {
            if (normalized[i] !== normalized[i-1]) deduplicated += normalized[i];
        }
        return deduplicated;
    },

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

    escapeHTML: function(str) { 
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
    }
};