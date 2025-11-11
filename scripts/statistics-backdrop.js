const CANVAS_ID = 'section-statistics__backdrop-canvas';
const LINE_COUNT = 9;
const SEGMENTS = 32;
const BASE_ALPHA = 0.18;
const HIGHLIGHT_ALPHA = 0.32;
const HIGHLIGHT_WIDTH = 1.8;
const BASE_WIDTH = 1.1;

const formatColor = (alpha) => {
    return `rgba(255, 255, 255, ${alpha})`;
};

const createContext = (canvas) => {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    const adjust = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    adjust();
    const getSize = () => ({ width, height });
    return { ctx, adjust, getSize };
};

const lens = (x, y, centerX, centerY, radius, intensity) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!radius || distance > radius) {
        return { x, y, influence: 0 };
    }
    const ratio = distance / radius;
    const strength = 1 - ratio * ratio;
    const factor = 1 + intensity * strength * strength;
    return {
        x: centerX + dx * factor,
        y: centerY + dy * factor,
        influence: strength
    };
};

const drawLine = (ctx, samples, color, width) => {
    if (!samples.length) {
        return;
    }
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(samples[0].x, samples[0].y);
    for (let i = 1; i < samples.length; i += 1) {
        ctx.lineTo(samples[i].x, samples[i].y);
    }
    ctx.stroke();
};

const render = (ctx, width, height, time) => {
    ctx.clearRect(0, 0, width, height);
    if (!width || !height) {
        return;
    }
    const centerX = width * 0.5 + Math.sin(time * 0.25) * width * 0.18;
    const centerY = height * 0.5 + Math.cos(time * 0.3) * height * 0.12;
    const radius = Math.max(width, height) * 0.38 + Math.sin(time * 0.6) * Math.min(width, height) * 0.08;
    const intensity = 0.55 + Math.sin(time * 0.8) * 0.1;
    const secondaryRadius = radius * 0.55;
    const secondaryIntensity = intensity * 1.4;
    const drawSeries = (orientation) => {
        for (let i = 0; i < LINE_COUNT; i += 1) {
            const t = i / (LINE_COUNT - 1);
            const basePos = orientation === 'vertical' ? width * t : height * t;
            const samples = [];
            let maxInfluence = 0;
            for (let segment = 0; segment <= SEGMENTS; segment += 1) {
                const ratio = segment / SEGMENTS;
                const rawX = orientation === 'vertical' ? basePos : width * ratio;
                const rawY = orientation === 'vertical' ? height * ratio : basePos;
                const swirl = Math.sin(time * 0.9 + ratio * Math.PI * 2 + i * 0.7) * 8;
                const offsetX = orientation === 'vertical' ? rawX + swirl : rawX;
                const offsetY = orientation === 'vertical' ? rawY : rawY + swirl;
                const primary = lens(offsetX, offsetY, centerX, centerY, radius, intensity);
                const secondary = lens(primary.x, primary.y, width - centerX, height - centerY, secondaryRadius, secondaryIntensity);
                samples.push({ x: secondary.x, y: secondary.y });
                if (primary.influence > maxInfluence) {
                    maxInfluence = primary.influence;
                }
                if (secondary.influence > maxInfluence) {
                    maxInfluence = secondary.influence;
                }
            }
            const alpha = BASE_ALPHA + (HIGHLIGHT_ALPHA - BASE_ALPHA) * maxInfluence;
            const lineWidth = BASE_WIDTH + (HIGHLIGHT_WIDTH - BASE_WIDTH) * maxInfluence;
            drawLine(ctx, samples, formatColor(alpha), lineWidth);
        }
    };
    drawSeries('vertical');
    drawSeries('horizontal');
};

const SCROLL_SCOPE = 8000;
const SCROLL_OFFSET = 1200;

const initStatisticsBackdrop = () => {
    const canvas = document.getElementById(CANVAS_ID);
    const section = document.getElementById('section-statistics');
    if (!canvas || !section) {
        return;
    }
    const { ctx, adjust, getSize } = createContext(canvas);
    let animationFrame = 0;
    let running = true;
    const loop = (timestamp) => {
        if (!running) {
            return;
        }
        const { width, height } = getSize();
        const progress = Math.min(1, Math.max(0, (window.scrollY - SCROLL_OFFSET) / SCROLL_SCOPE));
        render(ctx, width, height, timestamp * 0.0018 + progress * 40);
        animationFrame = requestAnimationFrame(loop);
    };
    const handleResize = () => {
        adjust();
    };
    handleResize();
    animationFrame = requestAnimationFrame(loop);
    window.addEventListener('resize', handleResize);
    let resizeObserver = null;
    if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(section);
    }
    const onVisibilityChange = () => {
        if (!running) {
            return;
        }
        if (document.visibilityState === 'hidden') {
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
        } else if (!animationFrame) {
            animationFrame = requestAnimationFrame(loop);
        }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const cleanup = () => {
        running = false;
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    window.addEventListener('beforeunload', cleanup);
};

export default initStatisticsBackdrop;
