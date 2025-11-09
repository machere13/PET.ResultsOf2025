const COLOR_SCALE = ['rgb(255 255 255 / 8%)', '#0e4429', '#006d32', '#26a641', '#39d353'];
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

const normalizeResponse = (payload) => {
    if (!payload) {
        throw new Error('empty payload');
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
            throw new Error('no years data');
        }
        rawDays = collectDays(targetYearEntry.weeks ?? []);
    } else {
        throw new Error('unsupported payload shape');
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
        Math.max(1, Math.ceil(ratio * (COLOR_SCALE.length - 1)))
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
                const labelCount = count === 1 ? '1 контрибьют' : `${count} контрибьютов`;
                cell.setAttribute('title', `${labelCount} · ${displayDate}`);
            } else {
                cell.classList.add('section-activity__cell--outside');
                cell.dataset.count = '';
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

const updateTotal = (element, total, weeks) => {
    if (!weeks.length) {
        element.textContent = '0 контрибьютов · 2025';
        return;
    }
    const rangeStart = createUTCDate(TARGET_YEAR, 0, 1);
    const rangeEnd = createUTCDate(TARGET_YEAR, 11, 31);
    const formattedRange = `${formatDate(rangeStart)} — ${formatDate(rangeEnd)}`;
    element.textContent = `${total} контрибьютов · ${formattedRange}`;
};

const fetchContributions = async (username) => {
    const response = await fetch(`${API_BASE}${encodeURIComponent(username)}?y=${TARGET_YEAR}`);
    if (!response.ok) {
        throw new Error(`request failed with ${response.status}`);
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
    const totalElement = document.getElementById('section-activity__total');
    const errorElement = document.getElementById('github-heatmap-error');
    if (!gridContainer || !totalElement || !errorElement) {
        return;
    }
    errorElement.hidden = true;
    try {
        const raw = await fetchContributions(username);
        const { days, total, max } = normalizeResponse(raw);
        const weeks = buildCalendarWeeks(days, max);
        if (!weeks.length) {
            throw new Error('no weeks');
        }
        applyColumns(gridContainer, weeks.length);
        renderGrid(gridContainer, weeks, max);
        updateTotal(totalElement, total, weeks);
    } catch (error) {
        errorElement.hidden = false;
        totalElement.textContent = '–';
        console.error('github heatmap', error);
    }
};

export default initGithubHeatmap;

