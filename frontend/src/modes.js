import { $ } from './dom.js';
import { PRACTICE_PANEL_TITLES } from './constants.js';
import { hideDiagnosticReport } from './diagnostic.js';
import { loadPracticeMode } from './practice/engine.js';

function setStageTitle(mode) {
    const el = $('practice-panel-title');
    if (el) el.textContent = PRACTICE_PANEL_TITLES[mode] || '五笔练习';
}

export function switchMode(mode) {
    if (!mode) return;

    const select = $('mode-select');
    if (select && select.value !== mode) select.value = mode;

    hideDiagnosticReport();
    setStageTitle(mode);
    loadPracticeMode(mode);

    const input = $('practice-input');
    if (input) input.focus();
}
