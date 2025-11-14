import { parseDate, TARGET_YEAR } from './github-heatmap-api.js';

const COLOR_SCALE = [
    'rgb(255 255 255 / 6%)',
    'rgb(255 255 255 / 16%)',
    'rgb(255 255 255 / 32%)',
    'rgb(255 255 255 / 64%)',
    'rgb(255 255 255 / 80%)'
];

const pickColor = (count, max) => {
    if (!max || count <= 0) {
        return COLOR_SCALE[0];
    }
    const ratio = count / max;
    const index = Math.min(
        COLOR_SCALE.length - 1,
        Math.max(1, Math.ceil(1.2 * ratio * (COLOR_SCALE.length - 1)))
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

export { buildCalendarWeeks, flattenCalendarDays, calculateLongestStreak, countActiveDays, pickColor };

