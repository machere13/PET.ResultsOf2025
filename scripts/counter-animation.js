export default function initResultsCounter() {
    const counterElement = document.querySelector('.section-results__count');
    if (!counterElement) {
        return;
    }

    const targetValue = parseInt(counterElement.dataset.target ?? counterElement.textContent ?? '0', 10);
    if (Number.isNaN(targetValue)) {
        return;
    }

    counterElement.textContent = '0';

    const duration = 1200;
    let startTimestamp = 0;

    const animate = (timestamp) => {
        if (!startTimestamp) {
            startTimestamp = timestamp;
        }

        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(targetValue * easedProgress);

        counterElement.textContent = String(currentValue);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            counterElement.textContent = String(targetValue);
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                requestAnimationFrame(animate);
                observer.disconnect();
            }
        });
    }, { threshold: 0.4 });

    const container = counterElement.closest('#section-results');
    if (!container) {
        requestAnimationFrame(animate);
        return;
    }

    observer.observe(container);
}
