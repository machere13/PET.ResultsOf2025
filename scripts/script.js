import squareColorChanger from './square-color-changer.js';
import fishEyeText from './fish-eye-text.js';

await Promise.all([
    fishEyeText(),
    squareColorChanger()
]);