export default function squareColorChanger() {
    const squares = Array.from(document.querySelectorAll('.square'));
    if (!squares.length) {
        return;
    }
    const sections = [
        {
            element: document.getElementById('section-results'),
            color: 'var(--color-background-black)'
        },
        {
            element: document.getElementById('section-activity'),
            color: 'var(--color-background-white)'
        },
        {
            element: document.getElementById('section-statistics'),
            color: 'var(--color-background-white)'
        }
    ].filter((entry) => entry.element);
    if (!sections.length) {
        return;
    }
    const defaultColor = 'var(--color-background-white)';
    const computeSectionTops = () => {
        return sections.map((entry) => ({
            top: entry.element.getBoundingClientRect().top + window.scrollY,
            color: entry.color
        })).sort((a, b) => a.top - b.top);
    };
    let sectionPositions = computeSectionTops();
    const resolveColor = (absoluteY) => {
        let color = defaultColor;
        for (let i = 0; i < sectionPositions.length; i += 1) {
            if (absoluteY >= sectionPositions[i].top) {
                color = sectionPositions[i].color;
            } else {
                break;
            }
        }
        return color;
    };
    const updateSquareColors = () => {
        sectionPositions = computeSectionTops();
        squares.forEach((square) => {
            const rect = square.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2 + window.scrollY;
            square.style.backgroundColor = resolveColor(centerY);
        });
    };
    window.addEventListener('scroll', updateSquareColors, { passive: true });
    window.addEventListener('resize', updateSquareColors);
    updateSquareColors();
}