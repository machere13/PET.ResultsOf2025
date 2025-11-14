const ANIMATION_DURATION = 1200;
const INTERSECTION_THRESHOLD = 0.4;

export default function initResultsCounter() {
    const counterElement = document.querySelector('.section-results__count');
    if (!counterElement) {
        return;
    }

    const targetValue = Number.parseInt(
        counterElement.dataset.target ?? counterElement.textContent ?? '0',
        10
    );
    if (Number.isNaN(targetValue)) {
        return;
    }

    counterElement.textContent = '0';

    let startTimestamp = 0;
    let animationId = null;

    const animate = (timestamp) => {
        if (!startTimestamp) {
            startTimestamp = timestamp;
        }

        const progress = Math.min((timestamp - startTimestamp) / ANIMATION_DURATION, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(targetValue * easedProgress);

        counterElement.textContent = String(currentValue);

        if (progress < 1) {
            animationId = requestAnimationFrame(animate);
        } else {
            counterElement.textContent = String(targetValue);
            animationId = null;
        }
    };

    const container = counterElement.closest('#section-results');
    if (!container) {
        counterElement.parentElement?.classList?.add('is-visible-entities');
        animationId = requestAnimationFrame(animate);
        return () => {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
            }
        };
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible-entities');
                    animationId = requestAnimationFrame(animate);
                    observer.disconnect();
                }
            });
        },
        { threshold: INTERSECTION_THRESHOLD }
    );

    observer.observe(container);

    return () => {
        observer.disconnect();
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
        }
    };
}
