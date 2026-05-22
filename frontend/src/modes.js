import { $ } from './dom.js';
import { PRACTICE_PANEL_TITLES } from './constants.js';
import { hideDiagnosticReport } from './diagnostic.js';
import { loadPracticeMode } from './practice/engine.js';
import { restoreDefaultQueryPlaceholder } from './companion.js';
import { renderHistoryUI } from './history.js';

const QUERY_PANEL_TITLES = {
    query: '🔍 汉字五笔编码拆分查询',
    history: '📈 训练历史与走势',
    practice: '🎯 练习伴侣'
};

function setQueryPanelTitle(mode) {
    const el = $('query-panel-title');
    if (!el) return;
    el.textContent = QUERY_PANEL_TITLES[mode] || QUERY_PANEL_TITLES.practice;
}

function setPracticePanelTitle(mode) {
    const el = $('practice-panel-title');
    if (el) el.textContent = PRACTICE_PANEL_TITLES[mode] || '五笔练习';
}

function setLayout(layoutClass) {
    const main = document.querySelector('.app-main');
    if (main) main.className = `app-main ${layoutClass}`;
}

function showHistoryPanel(show) {
    const tools = $('content-tools');
    const history = $('content-history');
    if (tools) tools.style.display = show ? 'none' : 'flex';
    if (history) history.style.display = show ? 'flex' : 'none';
}

export function switchMode(mode) {
    if (!mode) return;

    const select = $('mode-select');
    if (select) select.value = mode;

    hideDiagnosticReport();
    setPracticePanelTitle(mode);

    if (mode === 'query') {
        setQueryPanelTitle('query');
        setLayout('layout-query');
        showHistoryPanel(false);
        restoreDefaultQueryPlaceholder();
        const input = $('query-input');
        if (input) input.focus();
        return;
    }

    if (mode === 'history') {
        setQueryPanelTitle('history');
        setLayout('layout-history');
        showHistoryPanel(true);
        renderHistoryUI();
        return;
    }

    setQueryPanelTitle('practice');
    setLayout('layout-practice');
    showHistoryPanel(false);
    loadPracticeMode(mode);
    const input = $('practice-input');
    if (input) input.focus();
}
