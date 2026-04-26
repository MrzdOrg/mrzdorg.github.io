// 00_init.js — точка входа. Единственный файл подключённый в HTML.
// Зависимости: нет. Динамически загружает все модули в нужном порядке.
//
// Поддерживает два режима:
//   РАЗРАБОТКА — файлы загружаются динамически через load().
//   БАНДЛ — все файлы склеены перед этим кодом; load() пропускает уже загруженные модули.
//
// Порядок склейки для бандла:
//   01_DEFAULTS.js → 02_ERRORS.js → 03_config.js → 04_HOOKS.js → 05_POLICY.js →
//   06_logo.js → 07_validate.js → 08_physics.js → 09_renderer.js → 10_engine.js → 00_init.js

window.PulseModules ||= {};

const ALLOWED_MODULES = new Set([
    '01_DEFAULTS.js', '02_ERRORS.js', '03_config.js', '04_HOOKS.js', '05_POLICY.js',
    '06_logo.js', '07_validate.js', '08_physics.js', '09_renderer.js', '10_engine.js',
]);

// Фолбек на случай если 02_ERRORS.js не загрузился.
const E = () => window.PulseErrors || {
    invalidModule:  name => console.error(`[PulseEngine] Недопустимый модуль: ${name}`),
    missingModule:  name => console.error(`[PulseEngine] Не загружен критичный файл: ${name}`),
    engineNotReady: ()   => console.error(`[PulseEngine] 10_engine.js загрузился, но PulseEngine не объявлен.`),
};

const load = src => {
    const name = src.replace('./', '');
    if (!ALLOWED_MODULES.has(name)) {
        E().invalidModule(name);
        return Promise.reject();
    }
    if (window.PulseModules[name]) return Promise.resolve();
    return new Promise(resolve => {
        const s   = document.createElement('script');
        s.src     = `./${name}`;
        s.onload  = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
    });
};

const check = flags => {
    const missing = flags.filter(([flag]) => !window[flag]);
    missing.forEach(([, name]) => E().missingModule(name));
    return missing.length === 0;
};

load('./01_DEFAULTS.js')
    .then(() => {
        if (!check([['PULSE_DEFAULTS_LOADED', '01_DEFAULTS.js']])) return Promise.reject();
        return load('./02_ERRORS.js');
    })
    .then(() => {
        return Promise.all([
            load('./03_config.js'),
            load('./04_HOOKS.js'),
        ]);
    })
    .then(() => load('./05_POLICY.js'))
    .then(() => load('./06_logo.js'))
    .then(() => load('./07_validate.js'))
    .then(() => {
        if (!check([['PULSE_VALIDATE_LOADED', '07_validate.js']])) return Promise.reject();
        if (!window.PULSE_CONFIG_VALID) return Promise.reject();
        return Promise.all([
            load('./08_physics.js'),
            load('./09_renderer.js'),
        ]);
    })
    .then(() => {
        if (!check([
            ['PULSE_PHYSICS_LOADED',  '08_physics.js'],
            ['PULSE_RENDERER_LOADED', '09_renderer.js'],
        ])) return Promise.reject();
        return load('./10_engine.js');
    })
    .then(() => {
        if (window.PulseEngine) {
            new PulseEngine(POLICY.CANVAS_ID).start();
            E().engineStarted(POLICY.CANVAS_ID);
        } else {
            E().engineNotReady();
        }
    })
    .catch(() => {});
