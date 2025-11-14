const CANVAS_SIZE = 600;
const TIME_INCREMENT = 0.01;
const CENTER_X_AMPLITUDE = 15;
const CENTER_Y_AMPLITUDE = 3;
const CENTER_Y_FREQUENCY = 0.5;
const RADIUS_BASE = CANVAS_SIZE / 3;
const RADIUS_FREQUENCY = 0.8;
const RADIUS_AMPLITUDE = 10;

export default function fishEyeText() {
    const canvas = document.getElementById('fish-eye-canvas');
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext('2d');
    const titleElement = document.getElementById('section-main__title');
    if (!titleElement) {
        return;
    }
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    let animationId = null;
    
    document.fonts.ready.then(() => {
        const computedStyle = window.getComputedStyle(titleElement);
        const fontSize = Number.parseInt(computedStyle.fontSize, 10);
        const fontFamily = computedStyle.fontFamily;
        const textColor = computedStyle.color;
        
        const textCanvas = document.createElement('canvas');
        const textCtx = textCanvas.getContext('2d');
        textCanvas.width = CANVAS_SIZE;
        textCanvas.height = CANVAS_SIZE;
        
        textCtx.font = `${fontSize}px ${fontFamily}`;
        textCtx.fillStyle = textColor;
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText('Results of 2025', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    
        const imageData = textCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        function applyFishEyeEffect(centerX, centerY, radius) {
            const pixels = imageData.data;
            const newImageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
            const newPixels = newImageData.data;
            
            for (let i = 0; i < newPixels.length; i += 4) {
                newPixels[i] = 0;
                newPixels[i + 1] = 0;
                newPixels[i + 2] = 0;
                newPixels[i + 3] = 0;
            }
            
            for (let y = 0; y < CANVAS_SIZE; y++) {
                for (let x = 0; x < CANVAS_SIZE; x++) {
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
                            
                            const sourceIndex = (Math.floor(newY) * CANVAS_SIZE + Math.floor(newX)) * 4;
                            const targetIndex = (y * CANVAS_SIZE + x) * 4;
                            
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
        
        let time = 0;
        
        function animate() {
            time += TIME_INCREMENT;
            const centerX = CANVAS_SIZE / 2 + Math.sin(time) * CENTER_X_AMPLITUDE;
            const centerY = CANVAS_SIZE / 2 + Math.cos(time * CENTER_Y_FREQUENCY) * CENTER_Y_AMPLITUDE;
            const radius = RADIUS_BASE + Math.sin(time * RADIUS_FREQUENCY) * RADIUS_AMPLITUDE;
            
            applyFishEyeEffect(centerX, centerY, radius);
            
            animationId = requestAnimationFrame(animate);
        }
        
        animate();
    });
    
    return () => {
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };
}
