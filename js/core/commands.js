/* ================= js/core/commands.js ================= */

window.AppCommands = {
    registry: {},
    cooldowns: {},

    register: function(aliases, requiresPermission, cooldownMs, handler) {
        aliases.forEach(alias => {
            this.registry[alias.toLowerCase()] = { requiresPermission, cooldownMs, handler };
        });
    },

    execute: function(user, command, message, flags, extra) {
        const cmdKey = command.toLowerCase();
        const cmdObj = this.registry[cmdKey];
        if (!cmdObj) return false;

        const hasPermission = flags.broadcaster || flags.mod || 
            (window.AppConfig.allowedUsers && window.AppConfig.allowedUsers.map(u => u.toLowerCase()).includes(user.toLowerCase()));

        if (cmdObj.requiresPermission && !hasPermission) {
            window.AppLogger.warn(`Отказ в доступе: !${cmdKey} от ${user}`);
            return true;
        }

        if (cmdObj.cooldownMs > 0) {
            const now = Date.now();
            if (this.cooldowns[cmdKey] && (now - this.cooldowns[cmdKey] < cmdObj.cooldownMs)) return true;
            this.cooldowns[cmdKey] = now;
        }

        try {
            cmdObj.handler(user, message.trim(), message.trim().toLowerCase(), flags, extra);
        } catch (err) {
            window.AppLogger.error(`Сбой в команде !${cmdKey}`, err);
        }
        return true;
    }
};