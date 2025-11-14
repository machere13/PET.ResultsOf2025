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

const fetchContributions = async (username) => {
    try {
        const response = await fetch(`${API_BASE}${encodeURIComponent(username)}?y=${TARGET_YEAR}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return normalizeResponse(data);
    } catch (error) {
        console.error('Failed to fetch GitHub contributions:', error);
        return null;
    }
};

export { fetchContributions, parseDate, isTargetYear, TARGET_YEAR };

