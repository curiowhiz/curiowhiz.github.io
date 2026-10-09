// ============================================================
// TRACE.JS - Hero response curve
// A load-test style curve: a spike, a damped oscillation, then a steady
// state that rests on the results ledger. It draws once, left to right,
// and then stays still. With reduced motion it simply appears finished.
// Decorative only: aria-hidden, no text, no data.
// ============================================================

(function () {
    const canvas = document.getElementById('hero-trace');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const DURATION = 2400;

    let width = 0;
    let height = 0;
    let progress = 0;
    let startTime = null;
    let rafId = null;

    // Deterministic pseudo-noise so the curve is identical on every load.
    function noise(i) {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        return (x - Math.floor(x)) * 2 - 1;
    }

    function cssColor(name, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    }

    // y position for a normalised x in [0, 1]
    function curveY(t) {
        const base = height - 7;
        const spikeAt = 0.16;
        const amplitude = height * 0.72;

        if (t < spikeAt) {
            // ramp up with a slight stagger, like requests queueing
            const k = t / spikeAt;
            return base - amplitude * Math.pow(k, 2.2) + noise(t * 400) * 1.4 * k;
        }

        const s = t - spikeAt;
        const envelope = Math.exp(-s * 9);
        const wave = Math.cos(s * 58);
        const jitter = noise(t * 900) * (1.2 + 5 * envelope);
        return base - amplitude * envelope * wave * 0.55 - amplitude * 0.45 * envelope + jitter;
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        if (!width) return;

        const accent = cssColor('--accent', '#0D5C5C');
        const rule = cssColor('--rule', '#C7D2D5');
        const steps = Math.max(120, Math.round(width / 3));
        const limit = Math.max(1, Math.round(steps * progress));

        // steady-state reference line
        ctx.save();
        ctx.strokeStyle = rule;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(0, height - 7.5);
        ctx.lineTo(width, height - 7.5);
        ctx.stroke();
        ctx.restore();

        // the curve itself
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= limit; i++) {
            const t = i / steps;
            const x = t * width;
            const y = curveY(t);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    function tick(now) {
        if (startTime === null) startTime = now;
        const raw = Math.min((now - startTime) / DURATION, 1);
        progress = 1 - Math.pow(1 - raw, 3); // ease-out
        draw();
        if (raw < 1) rafId = requestAnimationFrame(tick);
    }

    function start() {
        if (reduceMotion.matches) {
            progress = 1;
            draw();
            return;
        }
        progress = 0;
        startTime = null;
        rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    // Redraw when the colour scheme flips so the line keeps its contrast.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);

    resize();
    start();
})();
