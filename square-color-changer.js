document.addEventListener('DOMContentLoaded', function() {
    const squares = document.querySelectorAll('.square');
    const resultsSection = document.getElementById('section-results');
    
    function updateSquareColors() {
        squares.forEach(square => {
            const rect = square.getBoundingClientRect();
            const squareCenterY = rect.top + rect.height / 2;
            
            const resultsRect = resultsSection.getBoundingClientRect();
            const isOverResults = squareCenterY >= resultsRect.top;
            
            if (isOverResults) {
                square.style.backgroundColor = 'var(--color-background-black)';
            } else {
                square.style.backgroundColor = 'var(--color-background-white)';
            }
        });
    }
    window.addEventListener('scroll', updateSquareColors);
    window.addEventListener('resize', updateSquareColors);
    updateSquareColors();
});
