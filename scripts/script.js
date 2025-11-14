import squareColorChanger from './square-color-changer.js';
import fishEyeText from './fish-eye-text.js';
import footerTextEffect from './footer-text-effect.js';
import initGithubHeatmap from './github-heatmap.js';
import initResultsCounter from './counter-animation.js';
import initStatisticsBackdrop from './statistics-backdrop.js';

const initModules = async () => {
    const modules = [
        { name: 'fishEyeText', init: () => Promise.resolve(fishEyeText()) },
        { name: 'squareColorChanger', init: () => Promise.resolve(squareColorChanger()) },
        { name: 'footerTextEffect', init: () => Promise.resolve(footerTextEffect()) },
        { name: 'initGithubHeatmap', init: initGithubHeatmap },
        { name: 'initStatisticsBackdrop', init: () => Promise.resolve(initStatisticsBackdrop()) }
    ];
    const results = await Promise.allSettled(modules.map((m) => m.init()));
    for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        if (result.status === 'rejected') {
            console.error(`Failed to initialize ${modules[i].name}:`, result.reason);
        }
    }
};

initModules();
initResultsCounter();