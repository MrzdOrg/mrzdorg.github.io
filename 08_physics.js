// 08_physics.js — физика движения линии.
// Зависимости: defaults.js (CONFIG, POLICY). Экспортирует: PulsePhysics, PULSE_PHYSICS_LOADED.
// Кольцевой буфер historyX/historyY хранит абсолютные координаты точек.
// scrollOffset — накопленный сдвиг ленты; вычитается при отрисовке вместо O(n) сдвига точек.

class PulsePhysics {

    constructor(bufferSize) {
        // Переиспользуемый буфер для crypto.getRandomValues — не создаём объект каждый кадр.
        this.cryptoBuffer = new Uint32Array(1);

        // Float32Array: два отдельных массива быстрее массива объектов {x, y}.
        this.historyX   = new Float32Array(bufferSize);
        this.historyY   = new Float32Array(bufferSize);
        this.bufferSize = bufferSize;
        this.head       = 0; // индекс следующей записи
        this.count      = 0; // количество записанных точек (растёт до bufferSize)

        this.scrollOffset = 0; // накопленный горизонтальный сдвиг ленты
        this.currentY     = 0; // текущая отрисовываемая Y (плавно следует за targetY)
        this.targetY      = 0; // целевая Y (прыгает случайно)
    }

    // Вызывается из engine.js после первого setupCanvas().
    init(centerY, cachedValues) {
        this.currentY = centerY;
        this.targetY  = centerY;
        this.updateCache(cachedValues);
    }

    // Принимает объект cache из engine.buildCache(). Вызывается при каждом ресайзе.
    updateCache(c) {
        this.cachedRandomness = c.randomness;
        this.cachedSpeed      = c.speed;
        this.cachedMinY       = c.minY;
        this.cachedMaxY       = c.maxY;
        this.cachedHeadX      = c.headX;
        this.cachedCenterY    = c.centerY;
    }

    // Криптографический RNG: равномернее Math.random(), возвращает [-0.5, 0.5].
    getEntropy() {
        window.crypto.getRandomValues(this.cryptoBuffer);
        return (this.cryptoBuffer[0] / 4294967295) - 0.5;
    }

    // dt — секунды с предыдущего кадра. Умножение на dt делает физику frame-rate independent.
    update(dt) {
        this.targetY += this.getEntropy() * this.cachedRandomness * dt;
        this.targetY += (this.cachedCenterY - this.targetY) * CONFIG.RETENTION * dt;

        if (this.targetY < this.cachedMinY) this.targetY = this.cachedMinY;
        if (this.targetY > this.cachedMaxY) this.targetY = this.cachedMaxY;

        // SMOOTH=1.0 → мгновенно; SMOOTH<1.0 → инерция
        this.currentY += (this.targetY - this.currentY) * CONFIG.SMOOTH * dt;

        this.scrollOffset += this.cachedSpeed * dt;

        // Записываем абсолютный X (с учётом scrollOffset) — при отрисовке вычтем текущий offset.
        this.historyX[this.head] = this.cachedHeadX + this.scrollOffset;
        this.historyY[this.head] = this.currentY;

        this.head = (this.head + 1) % this.bufferSize;
        if (this.count < this.bufferSize) this.count++;
    }

    // Масштабирует состояние после ресайза. Вызывается из engine.handleResize().
    rescale(scaleX, scaleY) {
        this.currentY     *= scaleY;
        this.targetY      *= scaleY;
        this.scrollOffset *= scaleX;

        for (let i = 0; i < this.count; i++) {
            this.historyY[i] *= scaleY;
            this.historyX[i] *= scaleX;
        }
    }
}

window.PULSE_PHYSICS_LOADED = true;
window.PulsePhysics = PulsePhysics;
window.PulseModules ||= {};
window.PulseModules['08_physics.js'] = true;
