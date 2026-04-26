// 06_logo.js — отрисовка SVG-логотипа на голове линии через postRender-хук.
// Если отключить: логотип не отображается, остальное работает.
// Зависимости: defaults.js (CONFIG, POLICY, PulseHooks). Экспортирует: регистрирует хук в PulseHooks.postRender.
//
// Приоритет загрузки SVG:
//   1. CONFIG.LOGO_SVG — внешний файл (fetch + проверка сигнатуры <svg)
//   2. POLICY.LOGO_SVG_SOURCE — зашитый Base64 фолбек
// Размер логотипа кешируется и пересчитывается только при изменении lineWidth.

window.PulseHooks ||= { postRender: [] };

const hasLogoData = POLICY.LOGO_SVG_SOURCE?.trim() !== '';
const hasLogoFile = CONFIG.LOGO_SVG?.trim() !== '';

if (hasLogoData || hasLogoFile) {

    const img = new Image();
    let isReady       = false;
    let triedFallback = false;

    img.onload = () => { isReady = true; };
    img.onerror = () => {
        if (!triedFallback && hasLogoData) {
            activateFallback();
        } else {
            isReady = false;
        }
    };

    // Загружает Base64 из POLICY.LOGO_SVG_SOURCE. Добавляет data URI префикс если нужно.
    function activateFallback() {
        triedFallback = true;
        const prefix = 'data:image/svg+xml;base64,';
        img.src = POLICY.LOGO_SVG_SOURCE.startsWith('data:')
            ? POLICY.LOGO_SVG_SOURCE
            : prefix + POLICY.LOGO_SVG_SOURCE;
    }

    if (hasLogoFile) {
        // Загружаем внешний файл как текст и проверяем сигнатуру <svg — расширение легко подделать.
        fetch(CONFIG.LOGO_SVG)
            .then(r => { if (!r.ok) throw new Error(); return r.text(); })
            .then(text => {
                if (text.trim().toLowerCase().includes('<svg')) {
                    const blob = new Blob([text], { type: 'image/svg+xml' });
                    img.src = URL.createObjectURL(blob);
                } else {
                    activateFallback();
                }
            })
            .catch(() => activateFallback());
    } else {
        activateFallback();
    }

    // offCanvas используется для перекраски SVG в цвет линии через composite operation.
    // source-in: новая заливка видна только там где есть пиксели SVG (маска).
    const offCanvas = document.createElement('canvas');
    const offCtx    = offCanvas.getContext('2d', { alpha: true });

    let cachedSize      = 0;
    let cachedLineWidth = -1;

    // Сигнатура хука — см. defaults.js (PulseHooks.postRender).
    window.PulseHooks.postRender.push((ctx, headX, headY, screenHeight, r, g, b, lineWidth) => {
        if (!isReady) return;

        // Пересчёт размера только при изменении lineWidth — экономия CPU.
        if (lineWidth !== cachedLineWidth) {
            cachedLineWidth = lineWidth;
            const screenWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
            const majorSide   = Math.max(screenWidth, screenHeight);
            const minSize     = majorSide * CONFIG.LOGO_MIN_SIZE_RATIO;
            const maxSize     = majorSide * CONFIG.LOGO_MAX_RATIO;
            cachedSize = Math.ceil(Math.min(Math.max(lineWidth * POLICY.LOGO_SCALE_FACTOR, minSize), maxSize));
        }

        const size = cachedSize;

        if (offCanvas.width !== size) {
            offCanvas.width  = size;
            offCanvas.height = size;
        }

        offCtx.clearRect(0, 0, size, size);
        offCtx.globalCompositeOperation = 'source-over';
        offCtx.drawImage(img, 0, 0, size, size);

        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        offCtx.fillRect(0, 0, size, size);

        ctx.drawImage(offCanvas,
            headX + (lineWidth * POLICY.LOGO_OFFSET_X_RATIO),
            headY - (size     * POLICY.LOGO_OFFSET_Y_RATIO),
            size, size
        );
    });
}

window.PulseModules ||= {};
window.PulseModules['06_logo.js'] = true;
