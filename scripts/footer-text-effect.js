export default function footerTextEffect() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const preElements = footer.querySelectorAll('pre');
    if (preElements.length < 2) return;

    const firstText = preElements[0];
    const secondText = preElements[1];

    const firstTextContent = firstText.textContent;
    const secondTextContent = secondText.textContent;

    secondText.style.display = 'none';

    function splitIntoLines(text) {
        return text.split(/\r?\n/);
    }

    const firstLines = splitIntoLines(firstTextContent);
    const secondLines = splitIntoLines(secondTextContent);

    function createStructure(container, lines) {
        container.innerHTML = '';
        lines.forEach((line) => {
            const lineDiv = document.createElement('div');
            lineDiv.style.display = 'block';
            
            const chars = Array.from(line);
            chars.forEach((char) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.transition = 'opacity 0.1s ease';
                span.style.display = 'inline';
                lineDiv.appendChild(span);
            });
            
            container.appendChild(lineDiv);
        });
    }

    createStructure(firstText, firstLines);

    let isAnimating = false;
    let timeoutIds = [];

    function clearAnimation() {
        timeoutIds.forEach(id => clearTimeout(id));
        timeoutIds = [];
        isAnimating = false;
    }

    function startReplaceAnimation() {
        clearAnimation();
        isAnimating = true;

        const firstLineDivs = firstText.querySelectorAll('div');
        
        firstLineDivs.forEach((lineDiv, lineIndex) => {
            const firstLineSpans = lineDiv.querySelectorAll('span');
            const secondLine = secondLines[lineIndex] || '';
            const secondLineChars = Array.from(secondLine);

            firstLineSpans.forEach((span, charIndex) => {
                if (charIndex < secondLineChars.length) {
                    const newChar = secondLineChars[charIndex];
                    const hasDelay = Math.random() < 0.3;
                    const delay = hasDelay ? Math.random() * 150 : 0;
                    
                    const timeoutId1 = setTimeout(() => {
                        if (!isAnimating) return;
                        span.style.opacity = '0';
                        const timeoutId2 = setTimeout(() => {
                            if (!isAnimating) return;
                            span.textContent = newChar === ' ' ? '\u00A0' : newChar;
                            span.style.opacity = '1';
                        }, 50);
                        timeoutIds.push(timeoutId2);
                    }, delay);
                    timeoutIds.push(timeoutId1);
                } else {
                    const hasDelay = Math.random() < 0.3;
                    const delay = hasDelay ? Math.random() * 150 : 0;
                    const timeoutId = setTimeout(() => {
                        if (!isAnimating) return;
                        span.style.opacity = '0';
                    }, delay);
                    timeoutIds.push(timeoutId);
                }
            });

            if (secondLineChars.length > firstLineSpans.length) {
                for (let i = firstLineSpans.length; i < secondLineChars.length; i++) {
                    const newChar = secondLineChars[i];
                    const hasDelay = Math.random() < 0.3;
                    const delay = hasDelay ? Math.random() * 150 : 0;
                    
                    const timeoutId1 = setTimeout(() => {
                        if (!isAnimating) return;
                        const span = document.createElement('span');
                        span.style.transition = 'opacity 0.1s ease';
                        span.style.display = 'inline';
                        span.style.opacity = '0';
                        span.textContent = newChar === ' ' ? '\u00A0' : newChar;
                        
                        lineDiv.appendChild(span);
                        const timeoutId2 = setTimeout(() => {
                            if (!isAnimating) return;
                            span.style.opacity = '1';
                        }, 50);
                        timeoutIds.push(timeoutId2);
                    }, delay);
                    timeoutIds.push(timeoutId1);
                }
            }
        });

        if (secondLines.length > firstLineDivs.length) {
            for (let i = firstLineDivs.length; i < secondLines.length; i++) {
                const newLine = secondLines[i];
                const newLineChars = Array.from(newLine);
                
                const timeoutId = setTimeout(() => {
                    if (!isAnimating) return;
                    const lineDiv = document.createElement('div');
                    lineDiv.style.display = 'block';
                    lineDiv.style.opacity = '0';
                    
                    newLineChars.forEach((char) => {
                        const span = document.createElement('span');
                        span.textContent = char === ' ' ? '\u00A0' : char;
                        span.style.transition = 'opacity 0.1s ease';
                        span.style.display = 'inline';
                        span.style.opacity = '0';
                        lineDiv.appendChild(span);
                    });
                    
                    firstText.appendChild(lineDiv);
                    setTimeout(() => {
                        lineDiv.style.opacity = '1';
                        const spans = lineDiv.querySelectorAll('span');
                        spans.forEach(span => {
                            span.style.opacity = '1';
                        });
                    }, 50);
                }, i * 50);
                timeoutIds.push(timeoutId);
            }
        }

        const timeoutId = setTimeout(() => {
            if (!isAnimating) return;
            
            createStructure(firstText, secondLines);
            
            isAnimating = false;
        }, 400);
        timeoutIds.push(timeoutId);
    }

    function startReverseAnimation() {
        clearAnimation();
        firstText.style.transition = 'opacity 0.2s ease';
        firstText.style.opacity = '0';
        setTimeout(() => {
            createStructure(firstText, firstLines);
            firstText.style.opacity = '1';
        }, 200);
    }

    footer.addEventListener('mouseenter', startReplaceAnimation);
    footer.addEventListener('mouseleave', startReverseAnimation);
}
