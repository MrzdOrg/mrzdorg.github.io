// 02_ERRORS.js — централизованная система логирования PulseEngine.
// Зависимости: нет. Экспортирует: PulseErrors, PulseLog.
// Фолбек: если файл не загрузился, каждый модуль использует console напрямую.
//
// УРОВНИ ЛОГИРОВАНИЯ (PulseLog.LEVEL):
//   FATAL  — движок не может запуститься, выполнение остановлено. console.error.
//   ERROR  — ошибка в данных или конфиге, движок продолжает работу. console.error.
//   WARN   — подозрительное значение отклонено, использован дефолт. console.warn.
//   INFO   — объявление о старте, загрузке модулей, состоянии системы. console.info.
//   SILENT — вывод отключён полностью. Для продакшна.
//
// УПРАВЛЕНИЕ УРОВНЕМ:
//   PulseLog.LEVEL = 'SILENT';  // отключить всё
//   PulseLog.LEVEL = 'WARN';    // только FATAL + ERROR + WARN
//   PulseLog.LEVEL = 'INFO';    // всё включено (дефолт)

window.PulseLog = {

    LEVEL: 'INFO', // дефолт; перезаписывается из CONFIG.LOG_LEVEL после загрузки 01_DEFAULTS.js

    _order: { FATAL: 0, ERROR: 1, WARN: 2, INFO: 3, SILENT: 99 },

    _should(level) {
        return this._order[level] <= this._order[this.LEVEL];
    },

    fatal(...args) { if (this._should('FATAL')) console.error('[FATAL]', ...args); },
    error(...args) { if (this._should('ERROR')) console.error('[ERROR]', ...args); },
    warn (...args) { if (this._should('WARN'))  console.warn ('[WARN]',  ...args); },
    info (...args) { if (this._should('INFO'))  console.info ('[INFO]',  ...args); },

};

window.PulseErrors = {

    // --- FATAL: движок остановлен ---

    // 00_init.js
    invalidModule:   name => PulseLog.fatal(`[PulseEngine] Недопустимый модуль: ${name}`),
    missingModule:   name => PulseLog.fatal(`[PulseEngine] Не загружен критичный файл: ${name}`),
    engineNotReady:  ()   => PulseLog.fatal(`[PulseEngine] 10_engine.js загрузился, но PulseEngine не объявлен.`),

    // 07_validate.js
    configBlocked:   list => PulseLog.fatal(`[PulseEngine] Запуск заблокирован:\n` + list.map(e => '  • ' + e).join('\n')),

    // 10_engine.js
    missingPhysics:  ()   => PulseLog.fatal(`[PulseEngine] Не загружен 08_physics.js`),
    missingRenderer: ()   => PulseLog.fatal(`[PulseEngine] Не загружен 09_renderer.js`),
    invalidConfig:   ()   => PulseLog.fatal(`[PulseEngine] Конфигурация не прошла валидацию`),

    // --- WARN: значение отклонено, используется дефолт ---

    // 03_config.js
    attrDangerous:   key  => PulseLog.warn(`[PulseEngine] «${key}» отклонён — подозрительное содержимое.`),
    attrBadType:     key  => PulseLog.warn(`[PulseEngine] «${key}» отклонён — недопустимый тип после парсинга.`),

    // --- INFO: объявления о состоянии системы ---

    moduleLoaded:    name => PulseLog.info(`[PulseEngine] Модуль загружен: ${name}`),
    engineStarted:   id   => PulseLog.info(`[PulseEngine] Движок запущен. Canvas: ${id}`),
    configValid:     ()   => PulseLog.info(`[PulseEngine] Конфигурация прошла валидацию.`),

};

window.PulseModules ||= {};
window.PulseModules['02_ERRORS.js'] = true;

// Применяем CONFIG.LOG_LEVEL если он уже задан через HTML или PULSE_USER_CONFIG.
if (window.CONFIG?.LOG_LEVEL) PulseLog.LEVEL = CONFIG.LOG_LEVEL;
