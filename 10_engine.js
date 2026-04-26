// 10_engine.js — canvas-инфраструктура и главный цикл анимации.
// Зависимости: physics.js (PulsePhysics), renderer.js (PulseRenderer), validate.js (PULSE_CONFIG_VALID).
// Экспортирует: PulseEngine. Запускается из init.js через new PulseEngine(POLICY.CANVAS_ID).start().

const _E = window.PulseErrors || {
    missingPhysics:  () => console.error(`[PulseEngine] Не загружен 08_physics.js`),
    missingRenderer: () => console.error(`[PulseEngine] Не загружен 09_renderer.js`),
    invalidConfig:   () => console.error(`[PulseEngine] Конфигурация не прошла валидацию`),
};

if (!window.PulsePhysics)       _E.missingPhysics();
if (!window.PulseRenderer)      _E.missingRenderer();
if (!window.PULSE_CONFIG_VALID) _E.invalidConfig();

if (window.PulsePhysics && window.PulseRenderer && window.PULSE_CONFIG_VALID) {

class PulseEngine {

    constructor(canvasId) {
        this.canvas   = document.getElementById(canvasId);
        this.ctx      = this.canvas.getContext('2d', { alpha: false }); // alpha:false — фон непрозрачный, быстрее
        this.lastTime = performance.now();
        this.physics  = new PulsePhysics(POLICY.MAX_BUFFER_POINTS);
        this.renderer = new PulseRenderer(this.ctx);

        this.setupCanvas();
        this.physics.init(this.centerY, this.buildCache());

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            // Браузер обновляет размеры с задержкой после поворота устройства.
            setTimeout(() => this.handleResize(), POLICY.ORIENTATION_RESIZE_DELAY);
        });
    }

    // Вычисляет производные от размера экрана и конфига.
    // Передаётся в physics.updateCache() и renderer.updateCache().
    buildCache() {
        const centerY = this.height / 2;
        const minY    = this.height * CONFIG.BOUND_TOP;
        const maxY    = this.height * CONFIG.BOUND_BOTTOM;
        return {
            centerY,
            randomness:  this.height * CONFIG.RANDOMNESS_RATIO,
            speed:       this.width  * CONFIG.SPEED_RATIO,
            minY,
            maxY,
            headX:       this.width  * CONFIG.HEAD_X_RATIO,
            minThick:    this.height * CONFIG.THICKNESS_MIN_RATIO,
            maxThick:    this.height * CONFIG.THICKNESS_MAX_RATIO,
            maxDevTop:   centerY - minY,
            maxDevBot:   maxY - centerY,
            offscreen:   this.width  * POLICY.OFFSCREEN_PADDING_RATIO,
            width:       this.width,
            height:      this.height,
            bufferSize:  POLICY.MAX_BUFFER_POINTS,
        };
    }

    // Настраивает физический размер canvas с учётом DPR.
    // DPR ограничен POLICY.MAX_DPR — защита от перегрузки GPU на высоких DPR.
    // Все вычисления ведутся в CSS-пикселях; DPR скрыт внутри ctx.scale().
    setupCanvas() {
        const dpr  = Math.min(window.devicePixelRatio || 1, POLICY.MAX_DPR);
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width  = rect.width  * dpr;
        this.canvas.height = rect.height * dpr;

        // Сброс матрицы перед scale() — без этого каждый ресайз умножал бы масштаб.
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        this.width   = rect.width;
        this.height  = rect.height;
        this.centerY = this.height / 2;

        const cache = this.buildCache();
        this.physics.updateCache(cache);
        this.renderer.updateCache(cache);
    }

    handleResize() {
        const oldWidth  = this.width;
        const oldHeight = this.height;
        this.setupCanvas();
        if (oldHeight > 0 && oldWidth > 0) {
            this.physics.rescale(this.width / oldWidth, this.height / oldHeight);
        }
    }

    // currentTime передаётся браузером автоматически через requestAnimationFrame.
    loop(currentTime) {
        let dt = (currentTime - this.lastTime) / 1000;
        // Аномально долгий кадр (вкладка была свёрнута) — подставляем заглушку.
        if (dt > POLICY.MAX_DT) dt = POLICY.FALLBACK_DT;
        this.lastTime = currentTime;

        this.physics.update(dt);
        this.renderer.render(this.physics);
        requestAnimationFrame((t) => this.loop(t));
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.PulseEngine = PulseEngine;

} // end if (PulsePhysics && PulseRenderer && PULSE_CONFIG_VALID)

window.PulseModules ||= {};
window.PulseModules['10_engine.js'] = true;
