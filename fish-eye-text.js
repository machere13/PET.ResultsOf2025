document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('fish-eye-canvas');
    const ctx = canvas.getContext('2d');
    const titleElement = document.getElementById('section-main__title');
    
    const canvasSize = 600;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    document.fonts.ready.then(() => {
        const computedStyle = window.getComputedStyle(titleElement);
        const fontSize = parseInt(computedStyle.fontSize);
        const fontFamily = computedStyle.fontFamily;
        const textColor = computedStyle.color;
        
        const textCanvas = document.createElement('canvas');
        const textCtx = textCanvas.getContext('2d');
        textCanvas.width = canvasSize;
        textCanvas.height = canvasSize;
        
        textCtx.font = `${fontSize}px ${fontFamily}`;
        textCtx.fillStyle = textColor;
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText('Results of 2025', canvasSize / 2, canvasSize / 2);
    
    const imageData = textCtx.getImageData(0, 0, canvasSize, canvasSize);
    
    function applyFishEyeEffect(centerX, centerY, radius) {
        const pixels = imageData.data;
        const newImageData = ctx.createImageData(canvasSize, canvasSize);
        const newPixels = newImageData.data;
        
        for (let i = 0; i < newPixels.length; i += 4) {
            newPixels[i] = 0;
            newPixels[i + 1] = 0;
            newPixels[i + 2] = 0;
            newPixels[i + 3] = 0;
        }
        
        for (let y = 0; y < canvasSize; y++) {
            for (let x = 0; x < canvasSize; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius) {
                    const normalizedDistance = distance / radius;
                    const fishEyeDistance = Math.sqrt(1 - normalizedDistance * normalizedDistance);
                    const newDistance = (normalizedDistance + (1 - fishEyeDistance)) / 2;
                    
                    if (newDistance <= 1) {
                        const angle = Math.atan2(dy, dx);
                        const newX = centerX + newDistance * radius * Math.cos(angle);
                        const newY = centerY + newDistance * radius * Math.sin(angle);
                        
                        const sourceIndex = (Math.floor(newY) * canvasSize + Math.floor(newX)) * 4;
                        const targetIndex = (y * canvasSize + x) * 4;
                        
                        if (sourceIndex >= 0 && sourceIndex < pixels.length) {
                            newPixels[targetIndex] = pixels[sourceIndex];
                            newPixels[targetIndex + 1] = pixels[sourceIndex + 1];
                            newPixels[targetIndex + 2] = pixels[sourceIndex + 2];
                            newPixels[targetIndex + 3] = pixels[sourceIndex + 3];
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(newImageData, 0, 0);
    }
    
    let animationId;
    let time = 0;
    
    function animate() {
        time += 0.01;
        const centerX = canvasSize / 2 + Math.sin(time) * 15;
        const centerY = canvasSize / 2 + Math.cos(time * 0.5) * 3;
        const radius = canvasSize / 3 + Math.sin(time * 0.8) * 10;
        
        applyFishEyeEffect(centerX, centerY, radius);
        
        animationId = requestAnimationFrame(animate);
    }
    
        animate();
    });
});
