const DEFAULT_COLOR = 'var(--color-background-white)';
const SECTION_CONFIG = [
    {
        id: 'section-results',
        color: 'var(--color-background-black)'
    },
    {
        id: 'section-activity',
        color: 'var(--color-background-white)'
    },
    {
        id: 'section-statistics',
        color: 'var(--color-background-white)'
    }
];

export default function squareColorChanger() {
    const squares = Array.from(document.querySelectorAll('.square'));
    if (!squares.length) {
        return;
    }
    const sections = SECTION_CONFIG.map((config) => ({
        element: document.getElementById(config.id),
        color: config.color
    })).filter((entry) => entry.element);
    if (!sections.length) {
        return;
    }
    const computeSectionTops = () => {
        return sections.map((entry) => ({
            top: entry.element.getBoundingClientRect().top + window.scrollY,
            color: entry.color
        })).sort((a, b) => a.top - b.top);
    };
    let sectionPositions = computeSectionTops();
    const resolveColor = (absoluteY) => {
        let color = DEFAULT_COLOR;
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
    const handleScroll = () => {
        updateSquareColors();
    };
    const handleResize = () => {
        updateSquareColors();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    updateSquareColors();
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
    };
}