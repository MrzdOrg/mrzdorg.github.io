// 07_validate.js — проверка CONFIG и POLICY перед запуском движка.
// Зависимости: defaults.js, config.js, policy.js. Экспортирует: PULSE_CONFIG_VALID, PULSE_VALIDATE_LOADED.
// При ошибках выводит список в консоль и выставляет PULSE_CONFIG_VALID = false.

(function() {
    // Список обязательных полей: [объект, ключ, ожидаемый тип]
    const REQUIRED = [
        [CONFIG, 'BOUND_TOP',           'number'],
        [CONFIG, 'BOUND_BOTTOM',        'number'],
        [CONFIG, 'HEAD_X_RATIO',        'number'],
        [CONFIG, 'RANDOMNESS_RATIO',    'number'],
        [CONFIG, 'RETENTION',           'number'],
        [CONFIG, 'SMOOTH',              'number'],
        [CONFIG, 'SPEED_RATIO',         'number'],
        [CONFIG, 'THICKNESS_MIN_RATIO', 'number'],
        [CONFIG, 'THICKNESS_MAX_RATIO', 'number'],
        [CONFIG, 'COLOR_TOP',           'array'],
        [CONFIG, 'COLOR_CENTER',        'array'],
        [CONFIG, 'COLOR_BOTTOM',        'array'],
        [CONFIG, 'BG_COLOR',            'string'],
        [CONFIG, 'LINE_JOIN',           'string'],
        [CONFIG, 'LINE_CAP',            'string'],
        [POLICY, 'MAX_DPR',                  'number'],
        [POLICY, 'MAX_DT',                   'number'],
        [POLICY, 'FALLBACK_DT',              'number'],
        [POLICY, 'OFFSCREEN_PADDING_RATIO',  'number'],
        [POLICY, 'MAX_BUFFER_POINTS',        'number'],
        [POLICY, 'ORIENTATION_RESIZE_DELAY', 'number'],
        [POLICY, 'CANVAS_ID',                'string'],
    ];

    // Логические проверки: [функция → bool, сообщение об ошибке]
    const LOGIC_CHECKS = [
        [
            () => window.PULSE_ACTIVE_TARGET !== undefined && window.PULSE_ACTIVE_TARGET !== null,
            'data-target в теге <script> отсутствует'
        ],
        [
            () => window.PULSE_ACTIVE_TARGET === POLICY.CANVAS_ID,
            `data-target "${window.PULSE_ACTIVE_TARGET}" не совпадает с POLICY.CANVAS_ID "${POLICY.CANVAS_ID}"`
        ],
        [() => CONFIG.BOUND_TOP < CONFIG.BOUND_BOTTOM,             'BOUND_TOP должен быть < BOUND_BOTTOM'],
        [() => CONFIG.THICKNESS_MIN_RATIO <= CONFIG.THICKNESS_MAX_RATIO, 'THICKNESS_MIN_RATIO должен быть ≤ THICKNESS_MAX_RATIO'],
        [() => POLICY.MAX_BUFFER_POINTS > 0 && Number.isInteger(POLICY.MAX_BUFFER_POINTS), 'MAX_BUFFER_POINTS должен быть положительным целым'],
        [() => POLICY.FALLBACK_DT < POLICY.MAX_DT,                 'FALLBACK_DT должен быть < MAX_DT'],
        [() => POLICY.CANVAS_ID.trim() !== '',                      'CANVAS_ID не должен быть пустой строкой'],
        [
            () => document.getElementById(POLICY.CANVAS_ID) !== null,
            `В HTML не найден элемент id="${POLICY.CANVAS_ID}"`
        ],
        [
            () => document.getElementById(POLICY.CANVAS_ID) instanceof HTMLCanvasElement,
            `Элемент id="${POLICY.CANVAS_ID}" найден, но это не <canvas>`
        ],
    ];

    const errors = [];

    for (const [obj, key, type] of REQUIRED) {
        const val = obj[key];
        if (val === undefined || val === null) {
            errors.push(`Отсутствует: ${key}`);
        } else if (type === 'array' && !Array.isArray(val)) {
            errors.push(`${key} должен быть массивом, получено: ${typeof val}`);
        } else if (type !== 'array' && typeof val !== type) {
            errors.push(`${key} должен быть ${type}, получено: ${typeof val}`);
        }
    }

    for (const [check, message] of LOGIC_CHECKS) {
        try {
            if (!check()) errors.push(message);
        } catch (e) {
            errors.push(`Ошибка проверки: ${message}`);
        }
    }

    if (errors.length > 0) {
        (window.PulseErrors || { configBlocked: list => console.error(`[PulseEngine] Запуск заблокирован:\n` + list.map(e => '  • ' + e).join('\n')) }).configBlocked(errors);
        window.PULSE_CONFIG_VALID = false;
    } else {
        window.PULSE_CONFIG_VALID = true;
        if (window.PulseErrors) PulseErrors.configValid();
    }

    window.PULSE_VALIDATE_LOADED = true;
    window.PulseModules ||= {};
    window.PulseModules['07_validate.js'] = true;
})();
