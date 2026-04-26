// 01_DEFAULTS.js — дефолтные значения CONFIG.
// Порядок: должен быть первым. Все поля ??= — не перезапишут значения из config.js.
// Зависимости: нет. Экспортирует: CONFIG, PulseHooks, PULSE_DEFAULTS_LOADED.

window.PulseModules ||= {};
window.CONFIG  ||= {};

// --- CONFIG: пользовательские параметры анимации ---
// Границы движения линии (доля высоты экрана, 0.0–1.0)
CONFIG.BOUND_TOP            ??= 2 / 12;
CONFIG.BOUND_BOTTOM         ??= 10 / 12;
// Горизонтальная позиция головы линии (0.0 = левый край, 1.0 = правый)
CONFIG.HEAD_X_RATIO         ??= 0.5;
// Физика движения
CONFIG.RANDOMNESS_RATIO     ??= 1.0;   // сила случайного отклонения (× высота / сек)
CONFIG.RETENTION            ??= 0.01;  // сила притяжения к центру
CONFIG.SMOOTH               ??= 1.0;   // инерция: 1.0 = мгновенно, < 1.0 = плавно
CONFIG.SPEED_RATIO          ??= 1;     // скорость прокрутки (× ширина / сек)
// Толщина линии (доля высоты экрана)
CONFIG.THICKNESS_MIN_RATIO  ??= 0.001;
CONFIG.THICKNESS_MAX_RATIO  ??= 0.1;
// Цвет линии по позиции [R, G, B]
CONFIG.COLOR_TOP            ??= [0, 255, 0];
CONFIG.COLOR_CENTER         ??= [0, 0, 255];
CONFIG.COLOR_BOTTOM         ??= [255, 0, 0];
// Логотип
CONFIG.LOGO_SVG             ??= "";        // путь к внешнему SVG; "" = отключён
CONFIG.LOGO_MIN_SIZE_RATIO  ??= 1 / 12;   // минимальный размер логотипа (доля большей стороны экрана)
CONFIG.LOGO_MAX_RATIO       ??= 1 / 6;    // максимальный размер логотипа (доля большей стороны экрана)
// Стиль canvas
CONFIG.BG_COLOR             ??= '#000';
CONFIG.LINE_JOIN            ??= 'round';   // 'round' | 'bevel' | 'miter'
CONFIG.LINE_CAP             ??= 'round';   // 'round' | 'butt' | 'square'
// Уровень логирования — управляет выводом в консоль. См. 02_ERRORS.js.
// FATAL | ERROR | WARN | INFO | SILENT
CONFIG.LOG_LEVEL            ??= 'INFO';

// PulseHooks.postRender — массив хуков, вызываемых каждый кадр после отрисовки линии.
// Сигнатура: (ctx, headX, headY, screenHeight, r, g, b, lineWidth) => void
window.PulseHooks ||= { postRender: [] };

window.PULSE_DEFAULTS_LOADED = true;
window.PulseModules['01_DEFAULTS.js'] = true;
