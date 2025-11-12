const NBSP = '\u00A0';
const applyChar = (value) => (value === ' ' || value === '' || value === undefined ? NBSP : value);

const padLine = (line, targetLength) => {
    if (targetLength <= line.length) {
        return line;
    }
    const diff = targetLength - line.length;
    const startPad = Math.floor(diff / 2);
    const endPad = diff - startPad;
    return `${' '.repeat(startPad)}${line}${' '.repeat(endPad)}`;
};

const normalizeLines = (original, alternate) => {
    const result = [];
    const maxLines = Math.max(original.length, alternate.length);
    for (let lineIndex = 0; lineIndex < maxLines; lineIndex += 1) {
        const originalLine = original[lineIndex] ?? '';
        const alternateLine = alternate[lineIndex] ?? '';
        const maxLength = Math.max(originalLine.length, alternateLine.length);
        const normalizedOriginal = padLine(originalLine, maxLength);
        const normalizedAlternate = padLine(alternateLine, maxLength);
        const originalChars = [];
        const alternateChars = [];
        for (let charIndex = 0; charIndex < maxLength; charIndex += 1) {
            originalChars.push(normalizedOriginal[charIndex] ?? ' ');
            alternateChars.push(normalizedAlternate[charIndex] ?? ' ');
        }
        result.push({ originalChars, alternateChars });
    }
    return result;
};

const buildStructure = (container, blueprint) => {
    container.innerHTML = '';
    const spans = [];
    blueprint.forEach(({ originalChars, alternateChars }) => {
        const lineDiv = document.createElement('div');
        lineDiv.style.display = 'block';
        lineDiv.style.textAlign = 'center';
        originalChars.forEach((char, index) => {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.transition = 'opacity 0.18s ease';
            span.style.willChange = 'opacity';
            const originalChar = char ?? ' ';
            const alternateChar = alternateChars[index] ?? ' ';
            span.dataset.originalChar = originalChar;
            span.dataset.alternateChar = alternateChar;
            span.dataset.currentChar = originalChar;
            span.textContent = applyChar(originalChar);
            spans.push(span);
            lineDiv.appendChild(span);
        });
        container.appendChild(lineDiv);
    });
    return spans;
};

export default function footerTextEffect() {
    const footer = document.querySelector('footer');
    if (!footer) {
        return;
    }
    const preElements = footer.querySelectorAll('pre');
    if (preElements.length < 2) {
        return;
    }
    const firstText = preElements[0];
    const secondText = preElements[1];
    const firstLines = firstText.textContent.split(/\r?\n/);
    const secondLines = secondText.textContent.split(/\r?\n/);
    secondText.style.display = 'none';
    const blueprint = normalizeLines(firstLines, secondLines);
    const spans = buildStructure(firstText, blueprint);
    let activeTarget = 'originalChar';
    let timeoutIds = [];
    const clearAnimation = () => {
        timeoutIds.forEach((id) => clearTimeout(id));
        timeoutIds = [];
    };
    const animateTo = (targetKey) => {
        if (activeTarget === targetKey) {
            return;
        }
        clearAnimation();
        activeTarget = targetKey;
        spans.forEach((span) => {
            const targetChar = span.dataset[targetKey] ?? ' ';
            if (span.dataset.currentChar === targetChar) {
                return;
            }
            const hasDelay = Math.random() < 0.35;
            const delay = hasDelay ? Math.random() * 160 : 0;
            const timeoutId = setTimeout(() => {
                if (activeTarget !== targetKey) {
                    return;
                }
                span.style.opacity = '0';
                const innerId = setTimeout(() => {
                    if (activeTarget !== targetKey) {
                        return;
                    }
                    span.textContent = applyChar(targetChar);
                    span.dataset.currentChar = targetChar;
                    span.style.opacity = '1';
                }, 90);
                timeoutIds.push(innerId);
            }, delay);
            timeoutIds.push(timeoutId);
        });
    };
    footer.addEventListener('mouseenter', () => {
        animateTo('alternateChar');
    });
    footer.addEventListener('mouseleave', () => {
        animateTo('originalChar');
    });
}
