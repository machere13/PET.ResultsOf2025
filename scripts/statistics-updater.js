const STAT_SELECTOR = '[data-statistics-value]';
const TARGET_DATA_KEY = 'statisticsTarget';
const ITEM_SELECTOR = '.section-statistics__content-item';
const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const animationDuration = 1200;
let elementsByKey;
let observer;
const containerState = new WeakMap();

const collectElements = () => {
    if (elementsByKey) {
        return elementsByKey;
    }
    elementsByKey = new Map();
    document.querySelectorAll(STAT_SELECTOR).forEach((node) => {
        const key = node.dataset.statisticsValue;
        if (key) {
            elementsByKey.set(key, node);
        }
    });
    return elementsByKey;
};

const formatValue = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
        return '0';
    }
    return formatter.format(Math.max(0, Math.trunc(value)));
};

const animateElement = (element, target) => {
    const finalValue = Math.max(0, Math.trunc(Number.isFinite(target) ? target : 0));
    if (finalValue === 0) {
        element.textContent = formatValue(0);
        return;
    }
    let startTimestamp;
    const step = (timestamp) => {
        if (!startTimestamp) {
            startTimestamp = timestamp;
        }
        const progress = Math.min((timestamp - startTimestamp) / animationDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(finalValue * eased);
        element.textContent = formatValue(current);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = formatValue(finalValue);
        }
    };
    requestAnimationFrame(step);
};

const animateContainer = (container) => {
    const state = containerState.get(container);
    if (!state || state.animated) {
        return;
    }
    state.animated = true;
    containerState.set(container, state);
    state.element.textContent = formatValue(0);
    animateElement(state.element, state.target);
    if (observer) {
        observer.unobserve(container);
    }
};

const isElementVisibleEnough = (element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (!viewportHeight || rect.height <= 0) {
        return false;
    }
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const ratio = visibleHeight / rect.height;
    return ratio >= 0.5;
};

const handleIntersections = (entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            animateContainer(entry.target);
        }
    });
};

const ensureObserver = () => {
    if (!('IntersectionObserver' in window)) {
        return null;
    }
    if (!observer) {
        observer = new IntersectionObserver(handleIntersections, {
            threshold: [0.35, 0.5, 0.75]
        });
    }
    return observer;
};

const observeContainers = (containers) => {
    const available = containers.filter(Boolean);
    if (!available.length) {
        return;
    }
    const observerInstance = ensureObserver();
    if (!observerInstance) {
        available.forEach((container) => animateContainer(container));
        return;
    }
    available.forEach((container) => observerInstance.observe(container));
    available.forEach((container) => {
        if (isElementVisibleEnough(container)) {
            animateContainer(container);
        }
    });
};

export const applyStatisticsValues = (stats) => {
    const map = collectElements();
    const containers = [];
    Object.entries(stats ?? {}).forEach(([key, value]) => {
        const element = map.get(key);
        if (!element) {
            return;
        }
        const container = element.closest(ITEM_SELECTOR);
        if (!container) {
            return;
        }
        const normalized = Number.isFinite(value) ? value : 0;
        const targetValue = Math.max(0, Math.trunc(normalized));
        element.dataset[TARGET_DATA_KEY] = String(targetValue);
        element.textContent = formatValue(targetValue);
        containerState.set(container, {
            element,
            target: targetValue,
            animated: false
        });
        containers.push(container);
    });
    observeContainers(containers);
};