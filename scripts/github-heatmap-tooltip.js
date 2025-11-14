const CONTRIBUTION_WORDS = {
    singular: 'контрибьют',
    dual: 'контрибьюта',
    plural: 'контрибьютов'
};

const TOOLTIP_OFFSET = 18;
const TOOLTIP_PADDING = 12;

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
        return CONTRIBUTION_WORDS.plural;
    }
    const mod10 = absolute % 10;
    if (mod10 === 1) {
        return CONTRIBUTION_WORDS.singular;
    }
    if (mod10 >= 2 && mod10 <= 4) {
        return CONTRIBUTION_WORDS.dual;
    }
    return CONTRIBUTION_WORDS.plural;
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

const placeTooltip = (element, clientX, clientY) => {
    const { innerWidth, innerHeight } = window;
    const { offsetWidth, offsetHeight } = element;
    let x = clientX + TOOLTIP_OFFSET;
    let y = clientY + TOOLTIP_OFFSET;
    if (x + offsetWidth + TOOLTIP_PADDING > innerWidth) {
        x = clientX - offsetWidth - TOOLTIP_OFFSET;
    }
    if (y + offsetHeight + TOOLTIP_PADDING > innerHeight) {
        y = clientY - offsetHeight - TOOLTIP_OFFSET;
    }
    if (y < TOOLTIP_PADDING) {
        y = TOOLTIP_PADDING;
    }
    if (x < TOOLTIP_PADDING) {
        x = TOOLTIP_PADDING;
    }
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
};

const attachTooltipHandlers = (() => {
    let tooltip;

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

        const handleScroll = () => {
            if (!activeCell || !element.classList.contains('section-activity__tooltip--visible')) {
                return;
            }
            const reference = lastPointerEvent;
            if (reference) {
                placeTooltip(element, reference.clientX, reference.clientY);
            }
        };

        container.addEventListener('pointerover', handlePointerOver);
        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('pointerout', handlePointerOut);
        container.addEventListener('pointerleave', handlePointerCancel);
        container.addEventListener('pointercancel', handlePointerCancel);
        container.addEventListener('pointerup', handlePointerCancel);

        window.addEventListener('scroll', handleScroll, { passive: true });
    };
})();

export default attachTooltipHandlers;

