import { applyStatisticsValues } from './statistics-updater.js';

const COLOR_SCALE = [
    'rgb(255 255 255 / 6%)',
    'rgb(255 255 255 / 16%)',
    'rgb(255 255 255 / 32%)',
    'rgb(255 255 255 / 64%)',
    'rgb(255 255 255 / 80%)'
];
const API_BASE = 'https://github-contributions-api.jogruber.de/v4/';
const TARGET_YEAR = 2025;

const parseDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
};

const isTargetYear = (value) => {
    const date = value instanceof Date ? value : parseDate(value);
    return !!date && date.getFullYear() === TARGET_YEAR;
};

const formatDate = (date) => {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatContributionWord = (count) => {
    const absolute = Math.abs(count);
    const mod100 = absolute % 100;
    if (mod100 >= 11 && mod100 <= 14) {
        return 'контрибьютов';
    }
    const mod10 = absolute % 10;
    if (mod10 === 1) {
        return 'контрибьют';
    }
    if (mod10 >= 2 && mod10 <= 4) {
        return 'контрибьюта';
    }
    return 'контрибьютов';
};

const createTooltip = () => {
    const element = document.createElement('div');
    element.className = 'section-activity__tooltip';
    const countNode = document.createElement('span');
    countNode.className = 'section-activity__tooltip-count';
    const labelNode = document.createElement('span');
    labelNode.className = 'section-activity__tooltip-label';
    const dateNode = document.createElement('span');
    dateNode.className = 'section-activity__tooltip-date';
    element.append(countNode, labelNode, dateNode);
    document.body.appendChild(element);
    return { element, countNode, labelNode, dateNode };
};

const attachTooltipHandlers = (() => {
    let tooltip;
    const OFFSET = 18;

    const ensureTooltip = () => {
        if (!tooltip) {
            tooltip = createTooltip();
        }
        return tooltip;
    };

    const resolveCell = (container, target) => {
        const cell = target?.closest('.section-activity__cell');
        if (!cell || !container.contains(cell)) {
            return null;
        }
        if (cell.classList.contains('section-activity__cell--outside')) {
            return null;
        }
        if (!cell.dataset.tooltipReady) {
            return null;
        }
        return cell;
    };

    const placeTooltip = (element, clientX, clientY) => {
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = element;
        const padding = 12;
        let x = clientX + OFFSET;
        let y = clientY + OFFSET;
        if (x + offsetWidth + padding > innerWidth) {
            x = clientX - offsetWidth - OFFSET;
        }
        if (y + offsetHeight + padding > innerHeight) {
            y = clientY - offsetHeight - OFFSET;
        }
        if (y < padding) {
            y = padding;
        }
        if (x < padding) {
            x = padding;
        }
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    };

    return (container) => {
        if (!container || container.dataset.tooltipBound === 'true') {
            return;
        }
        container.dataset.tooltipBound = 'true';
        const { element, countNode, labelNode, dateNode } = ensureTooltip();
        let activeCell = null;
        let lastPointerEvent = null;

        const hideTooltip = () => {
            if (activeCell) {
                activeCell.classList.remove('section-activity__cell--active');
                activeCell = null;
            }
            element.classList.remove('section-activity__tooltip--visible');
        };

        const updateTooltipContent = (cell) => {
            const count = Number.parseInt(cell.dataset.count ?? '0', 10) || 0;
            countNode.textContent = String(count);
            labelNode.textContent = formatContributionWord(count);
            dateNode.textContent = cell.dataset.tooltipDate ?? '';
            element.classList.toggle('section-activity__tooltip--empty', count === 0);
        };

        const showTooltip = (cell, event) => {
            if (activeCell === cell) {
                return;
            }
            if (activeCell) {
                activeCell.classList.remove('section-activity__cell--active');
            }
            activeCell = cell;
            activeCell.classList.add('section-activity__cell--active');
            updateTooltipContent(cell);
            element.classList.add('section-activity__tooltip--visible');
            lastPointerEvent = event;
            placeTooltip(element, event.clientX, event.clientY);
        };

        const handlePointerOver = (event) => {
            const cell = resolveCell(container, event.target);
            if (!cell) {
                hideTooltip();
                return;
            }
            showTooltip(cell, event);
        };

        const handlePointerOut = (event) => {
            const toCell = resolveCell(container, event.relatedTarget);
            if (toCell) {
                return;
            }
            hideTooltip();
        };

        const handlePointerMove = (event) => {
            if (!activeCell) {
                return;
            }
            lastPointerEvent = event;
            placeTooltip(element, event.clientX, event.clientY);
        };

        const handlePointerCancel = () => {
            hideTooltip();
        };

        container.addEventListener('pointerover', handlePointerOver);
        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('pointerout', handlePointerOut);
        container.addEventListener('pointerleave', handlePointerCancel);
        container.addEventListener('pointercancel', handlePointerCancel);
        container.addEventListener('pointerup', handlePointerCancel);

        window.addEventListener('scroll', () => {
            if (!activeCell || !element.classList.contains('section-activity__tooltip--visible')) {
                return;
            }
            const reference = lastPointerEvent;
            if (reference) {
                placeTooltip(element, reference.clientX, reference.clientY);
            }
        }, { passive: true });
    };
})();

const normalizeResponse = (payload) => {
    if (!payload) {
        return { days: [], total: 0, max: 0 };
    }
    const collectDays = (weeks) => {
        const buffer = [];
        weeks.forEach((week) => {
            const entries = Array.isArray(week.contributionDays) ? week.contributionDays : week.days ?? [];
            entries.forEach((day) => buffer.push(day));
        });
        return buffer;
    };
    let rawDays = [];
    if (Array.isArray(payload.weeks)) {
        rawDays = collectDays(payload.weeks);
    } else if (Array.isArray(payload.contributions)) {
        rawDays = payload.contributions;
    } else if (Array.isArray(payload.years)) {
        const targetYearEntry =
            payload.years.find((yearEntry) => Number(yearEntry.year) === TARGET_YEAR) ?? payload.years[0];
        if (!targetYearEntry) {
            return { days: [], total: 0, max: 0 };
        }
        rawDays = collectDays(targetYearEntry.weeks ?? []);
    } else {
        return { days: [], total: 0, max: 0 };
    }
    const filtered = rawDays.filter((day) => isTargetYear(day?.date));
    const total = filtered.reduce((acc, day) => acc + (day.count ?? 0), 0);
    const max = filtered.reduce((acc, day) => Math.max(acc, day.count ?? 0), 0);
    return { days: filtered, total, max };
};

const pickColor = (count, max) => {
    if (!max || count <= 0) {
        return COLOR_SCALE[0];
    }
    const ratio = count / max;
    const index = Math.min(
        COLOR_SCALE.length - 1,
        Math.max(1, Math.ceil(1.2*ratio * (COLOR_SCALE.length - 1)))
    );
    return COLOR_SCALE[index];
};

const createUTCDate = (year, month, day) => {
    return new Date(Date.UTC(year, month, day));
};

const getCalendarStart = (date) => {
    const cursor = new Date(date);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor.getUTCDay() !== 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return cursor;
};

const getCalendarEnd = (date) => {
    const cursor = new Date(date);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor.getUTCDay() !== 6) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return cursor;
};

const toISODate = (date) => {
    return date.toISOString().slice(0, 10);
};

const buildCalendarWeeks = (days, max) => {
    const calendarStart = getCalendarStart(createUTCDate(TARGET_YEAR, 0, 1));
    const calendarEnd = getCalendarEnd(createUTCDate(TARGET_YEAR, 11, 31));
    const map = new Map();
    days.forEach((day) => {
        const date = parseDate(day?.date);
        if (date) {
            map.set(toISODate(date), day);
        }
    });
    const weeks = [];
    let cursor = new Date(calendarStart);
    let currentWeek = [];
    while (cursor <= calendarEnd) {
        const iso = toISODate(cursor);
        const source = map.get(iso);
        const count = source?.count ?? 0;
        currentWeek.push({
            date: iso,
            count,
            color: pickColor(count, max),
            inYear: cursor.getUTCFullYear() === TARGET_YEAR
        });
        if (currentWeek.length === 7) {
            weeks.push({
                firstDay: currentWeek[0].date,
                days: currentWeek
            });
            currentWeek = [];
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (currentWeek.length) {
        while (currentWeek.length < 7) {
            currentWeek.push({
                date: null,
                count: 0,
                color: COLOR_SCALE[0],
                inYear: false
            });
        }
        weeks.push({
            firstDay: currentWeek[0].date,
            days: currentWeek
        });
    }
    return weeks;
};

const flattenCalendarDays = (weeks) => {
    const buffer = [];
    weeks.forEach((week) => {
        const days = Array.isArray(week.days) ? week.days : [];
        days.forEach((day) => {
            if (day?.inYear) {
                buffer.push(day);
            }
        });
    });
    return buffer;
};

const calculateLongestStreak = (days) => {
    let longest = 0;
    let current = 0;
    days.forEach((day) => {
        const hasContributions = (day?.count ?? 0) > 0;
        if (hasContributions) {
            current += 1;
            if (current > longest) {
                longest = current;
            }
        } else {
            current = 0;
        }
    });
    return longest;
};

const countActiveDays = (days) => {
    return days.reduce((acc, day) => {
        return acc + ((day?.count ?? 0) > 0 ? 1 : 0);
    }, 0);
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

const fetchContributions = async (username) => {
    const response = await fetch(`${API_BASE}${encodeURIComponent(username)}?y=${TARGET_YEAR}`);
    if (!response.ok) {
        return null;
    }
    return response.json();
};

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
    const raw = await fetchContributions(username);
    if (!raw) {
        return;
    }
    const { days, total, max } = normalizeResponse(raw);
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
