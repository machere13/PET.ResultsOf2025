import { applyStatisticsValues } from './statistics-updater.js';
import { fetchContributions } from './github-heatmap-api.js';
import { buildCalendarWeeks, flattenCalendarDays, calculateLongestStreak, countActiveDays } from './github-heatmap-calendar.js';
import attachTooltipHandlers from './github-heatmap-tooltip.js';
import { renderGrid, applyColumns } from './github-heatmap-render.js';

const initGithubHeatmap = async () => {
    const section = document.getElementById('section-activity');
    if (!section) {
        return;
    }
    const username = section.dataset.githubUsername;
    if (!username) {
        return;
    }
    const gridContainer = document.getElementById('github-heatmap-grid');
    if (!gridContainer) {
        return;
    }
    const data = await fetchContributions(username);
    if (!data) {
        return;
    }
    const { days, total, max } = data;
    const weeks = buildCalendarWeeks(days, max);
    if (!weeks.length) {
        return;
    }
    applyColumns(gridContainer, weeks.length);
    renderGrid(gridContainer, weeks, max);
    attachTooltipHandlers(gridContainer);
    const calendarDays = flattenCalendarDays(weeks);
    applyStatisticsValues({
        total: total,
        'longest-streak': calculateLongestStreak(calendarDays),
        'active-days': countActiveDays(calendarDays),
        'max-per-day': max
    });
};

export default initGithubHeatmap;
