import { $ } from './dom.js';
import { PRACTICE_PANEL_TITLES } from './constants.js';
import { loadPracticeMode } from './practice/engine.js';

const MODE_LABELS = {
    yiji: '一级简码',
    erji: '二级简码',
    highfreq: '高频常用',
    hard: '难拆专项',
    custom: '自由练习',
    'wrong-review': '错字复习',
    reinforce: '薄弱强化'
};

const MODE_SUBLABELS = {
    yiji: '常用字',
    erji: '常用字',
    highfreq: '高频表',
    hard: '难拆表',
    custom: '自定义',
    'wrong-review': '错字本',
    reinforce: '薄弱区'
};

function setBreadcrumb(mode) {
    const modeLabel = $('topbar-mode-label');
    const subLabel = $('topbar-submode');
    if (modeLabel) modeLabel.textContent = MODE_LABELS[mode] || '练习';
    if (subLabel) subLabel.textContent = MODE_SUBLABELS[mode] || '';

    document.querySelectorAll('.sb-nav-item').forEach(el => {
        el.classList.toggle('is-active', el.dataset.mode === mode);
    });
}

export function switchMode(mode) {
    if (!mode) return;
    setBreadcrumb(mode);
    loadPracticeMode(mode);
    const input = $('practice-input');
    if (input) input.focus();
}

export { PRACTICE_PANEL_TITLES };
