import squareColorChanger from './square-color-changer.js';
import fishEyeText from './fish-eye-text.js';
import footerTextEffect from './footer-text-effect.js';

await Promise.all([
    fishEyeText(),
    squareColorChanger(),
    footerTextEffect()
]);