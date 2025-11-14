import { parseDate, isTargetYear, TARGET_YEAR } from './github-heatmap-api.js';
import { pickColor } from './github-heatmap-calendar.js';

const formatDate = (date) => {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const renderGrid = (container, weeks, max) => {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    weeks.forEach((week) => {
        const days = Array.isArray(week.days) ? week.days : [];
        days.forEach((day) => {
            const date = parseDate(day?.date);
            const cell = document.createElement('div');
            cell.className = 'section-activity__cell';
            if (day?.inYear && isTargetYear(date)) {
                const count = day.count ?? 0;
                cell.style.backgroundColor = day.color ?? pickColor(count, max);
                cell.dataset.count = count;
                const displayDate = formatDate(date);
                cell.dataset.tooltipReady = 'true';
                cell.dataset.tooltipDate = displayDate;
            } else {
                cell.classList.add('section-activity__cell--outside');
                cell.dataset.count = '';
                cell.dataset.tooltipReady = '';
                cell.style.backgroundColor = 'transparent';
            }
            fragment.appendChild(cell);
        });
    });
    container.appendChild(fragment);
};

const applyColumns = (element, count) => {
    element.style.gridTemplateColumns = `repeat(${count}, minmax(12px, 1fr))`;
};

export { renderGrid, applyColumns };

