// 09_renderer.js — отрисовка линии на canvas.
// Зависимости: defaults.js (CONFIG, PulseHooks). Экспортирует: PulseRenderer, PULSE_RENDERER_LOADED.
// Вызывается из engine.js каждый кадр через render(physics).

class PulseRenderer {

    constructor(ctx) {
        this.ctx = ctx;
    }

    // Принимает объект cache из engine.buildCache(). Вызывается при каждом ресайзе.
    updateCache(c) {
        this.cachedMinThick  = c.minThick;
        this.cachedMaxThick  = c.maxThick;
        this.cachedMaxDevTop = c.maxDevTop;
        this.cachedMaxDevBot = c.maxDevBot;
        this.cachedOffscreen = c.offscreen;
        this.cachedCenterY   = c.centerY;
        this.width           = c.width;
        this.height          = c.height;
        this.bufferSize      = c.bufferSize;
    }

    // Рисует один кадр: фон → линия → postRender-хуки.
    render(physics) {
        this.ctx.fillStyle = CONFIG.BG_COLOR;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // ratio: отклонение от центра [0.0 = центр, 1.0 = граница].
        // Используется для интерполяции цвета и толщины.
        // CONFIG.COLOR_* читается напрямую каждый кадр — цвет актуален даже при рантайм-изменениях.
        let ratio = 0;
        let sigR = CONFIG.COLOR_CENTER[0];
        let sigG = CONFIG.COLOR_CENTER[1];
        let sigB = CONFIG.COLOR_CENTER[2];

        if (physics.currentY <= this.cachedCenterY) {
            ratio = this.cachedMaxDevTop > 0
                ? Math.min((this.cachedCenterY - physics.currentY) / this.cachedMaxDevTop, 1.0)
                : 1.0;
            sigR = Math.round(CONFIG.COLOR_CENTER[0] * (1 - ratio) + CONFIG.COLOR_TOP[0] * ratio);
            sigG = Math.round(CONFIG.COLOR_CENTER[1] * (1 - ratio) + CONFIG.COLOR_TOP[1] * ratio);
            sigB = Math.round(CONFIG.COLOR_CENTER[2] * (1 - ratio) + CONFIG.COLOR_TOP[2] * ratio);
        } else {
            ratio = this.cachedMaxDevBot > 0
                ? Math.min((physics.currentY - this.cachedCenterY) / this.cachedMaxDevBot, 1.0)
                : 1.0;
            sigR = Math.round(CONFIG.COLOR_CENTER[0] * (1 - ratio) + CONFIG.COLOR_BOTTOM[0] * ratio);
            sigG = Math.round(CONFIG.COLOR_CENTER[1] * (1 - ratio) + CONFIG.COLOR_BOTTOM[1] * ratio);
            sigB = Math.round(CONFIG.COLOR_CENTER[2] * (1 - ratio) + CONFIG.COLOR_BOTTOM[2] * ratio);
        }

        // Толщина линейно растёт от MIN к MAX по мере отклонения от центра (lerp).
        const dynamicLineWidth = this.cachedMinThick + (ratio * (this.cachedMaxThick - this.cachedMinThick));

        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgb(${sigR}, ${sigG}, ${sigB})`;
        this.ctx.lineWidth   = dynamicLineWidth;
        this.ctx.lineJoin    = CONFIG.LINE_JOIN;
        this.ctx.lineCap     = CONFIG.LINE_CAP;

        let isFirst = true;

        for (let i = 0; i < physics.count; i++) {
            // Кольцевой буфер: самая старая точка на позиции (head - count).
            const idx = (physics.head - physics.count + i + this.bufferSize) % this.bufferSize;

            // Экранный X = абсолютный X − текущий scrollOffset (O(1) вместо O(n) сдвига).
            const x = physics.historyX[idx] - physics.scrollOffset;
            const y = physics.historyY[idx];

            // Пропускаем точку только если и она, и следующая за экраном — иначе линия обрывается у края.
            if (x < this.cachedOffscreen && i < physics.count - 1) {
                const nextIdx = (idx + 1) % this.bufferSize;
                if (physics.historyX[nextIdx] - physics.scrollOffset < this.cachedOffscreen) continue;
            }

            if (isFirst) {
                this.ctx.moveTo(x, y);
                isFirst = false;
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // postRender-хуки: вызываются после линии, до следующего кадра.
        // Сигнатура хука — см. defaults.js (PulseHooks.postRender).
        if (window.PulseHooks?.postRender) {
            for (let i = 0; i < window.PulseHooks.postRender.length; i++) {
                window.PulseHooks.postRender[i](
                    this.ctx,
                    physics.cachedHeadX,
                    physics.currentY,
                    this.height,
                    sigR, sigG, sigB,
                    dynamicLineWidth
                );
            }
        }
    }
}

window.PULSE_RENDERER_LOADED = true;
window.PulseRenderer = PulseRenderer;
window.PulseModules ||= {};
window.PulseModules['09_renderer.js'] = true;
