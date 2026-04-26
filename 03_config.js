// 03_config.js — сборщик пользовательских переопределений CONFIG из HTML.
// Если отключить: движок запустится на дефолтах из defaults.js.
// Зависимости: defaults.js (CONFIG). Экспортирует: CONFIG (мутирует), PULSE_ACTIVE_TARGET.
// Источники (приоритет по порядку): 1) window.PULSE_USER_CONFIG, 2) data-атрибуты <canvas>.
// Доступ только к CONFIG — POLICY защищён от переопределения через HTML.

(function() {
    window.CONFIG ||= {};

    // PULSE_ACTIVE_TARGET — id canvas, захваченный из data-target тега <script src="init.js">.
    const scriptWithTarget = document.querySelector('script[data-target]');
    window.PULSE_ACTIVE_TARGET = scriptWithTarget ? scriptWithTarget.getAttribute('data-target') : null;

    // Источник 1: window.PULSE_USER_CONFIG = { KEY: value } — задаётся в <script> до init.js.
    if (window.PULSE_USER_CONFIG && typeof window.PULSE_USER_CONFIG === 'object') {
        Object.assign(window.CONFIG, window.PULSE_USER_CONFIG);
    }

    // Источник 2: data-атрибуты <canvas> — camelCase → SCREAMING_SNAKE_CASE → CONFIG[key].
    // Фильтр: только ключи существующие в CONFIG (блокирует мусор и попытки писать в POLICY).
    const canvas = window.PULSE_ACTIVE_TARGET ? document.getElementById(window.PULSE_ACTIVE_TARGET) : null;

    if (canvas) {
        const data = canvas.dataset;

        // Допустимые типы после JSON.parse: примитивы и числовой массив [R,G,B].
        const isSafeValue = v =>
            typeof v === 'number'  ||
            typeof v === 'boolean' ||
            typeof v === 'string'  ||
            (Array.isArray(v) && v.every(el => typeof el === 'number'));

        // Паттерн prototype pollution — отклоняем строки с опасными ключами.
        const dangerousPattern = /__(proto|defineGetter|defineSetter|lookupGetter|lookupSetter)__|constructor|prototype/i;

        for (const key in data) {
            const configKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

            if (!(configKey in window.CONFIG)) continue;

            const rawValue = data[key];

            // Пустой атрибут — пропускаем, дефолт из defaults.js остаётся в силе.
            if (rawValue === '') continue;

            if (typeof rawValue !== 'string' || dangerousPattern.test(rawValue)) {
                (window.PulseErrors || { attrDangerous: k => console.warn(`[PulseEngine] «${k}» отклонён — подозрительное содержимое.`) }).attrDangerous(key);
                continue;
            }

            try {
                const parsed = JSON.parse(rawValue.replace(/'/g, '"'));
                if (isSafeValue(parsed)) {
                    window.CONFIG[configKey] = parsed;
                } else {
                    (window.PulseErrors || { attrBadType: k => console.warn(`[PulseEngine] «${k}» отклонён — недопустимый тип после парсинга.`) }).attrBadType(key);
                }
            } catch (e) {
                // JSON.parse упал — значение является строкой (путь, HEX-цвет и т.п.)
                window.CONFIG[configKey] = rawValue;
            }
        }
    }

    window.PulseModules ||= {};
    window.PulseModules['03_config.js'] = true;
})();
