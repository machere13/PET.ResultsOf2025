import squareColorChanger from './square-color-changer.js';
import fishEyeText from './fish-eye-text.js';
import footerTextEffect from './footer-text-effect.js';
import initGithubHeatmap from './github-heatmap.js';
import initResultsCounter from './counter-animation.js';
import initStatisticsBackdrop from './statistics-backdrop.js';

await Promise.all([
    fishEyeText(),
    squareColorChanger(),
    footerTextEffect(),
    initGithubHeatmap(),
    initStatisticsBackdrop()
]);

initResultsCounter();