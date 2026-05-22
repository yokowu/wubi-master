import './style.css';

import { $ } from './dom.js';
import { getState, mutate } from './state.js';
import { storage } from './storage.js';

import { renderKeyboard, highlightKey } from './keyboard.js';
import {
    loadInitialWrongChars,
    renderWrongLedger,
    clearWrongLedger,
    exportWrongCharsToAnki,
    copyWrongCharsToClipboard,
    setLedgerHandlers,
    loadWeaknessStats
} from './ledger.js';
import {
    loadPracticeHistory,
    exportHistoryToCSV,
    clearHistory,
    recordPracticeSession
} from './history.js';
import {
    loadPracticeMode,
    addCharToCustomPractice,
    handleInput,
    handleSpecialKeys,
    setEngineHandlers
} from './practice/engine.js';
import { showDiagnosticReport, hideDiagnosticReport } from './diagnostic.js';
import { performQuery, setQueryHandlers } from './query.js';
import { switchMode } from './modes.js';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function setupKeyboardPanel() {
    const toggle = $('toggle-keyboard-panel');
    const footer = document.querySelector('.app-footer');
    if (!toggle || !footer) return;

    const saved = storage.loadShowKeyboard();
    const show = saved === null ? window.innerWidth > 1024 : saved;
    toggle.checked = show;
    footer.style.display = show ? 'block' : 'none';

    toggle.addEventListener('change', (e) => {
        const on = e.target.checked;
        footer.style.display = on ? 'block' : 'none';
        storage.saveShowKeyboard(on);
    });

    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        const cur = window.innerWidth;
        if (lastWidth > 1024 && cur <= 1024) {
            toggle.checked = false;
            footer.style.display = 'none';
            storage.saveShowKeyboard(false);
        }
        lastWidth = cur;
    });
}

function setupKeycapsToggle() {
    const toggle = $('toggle-keycaps');
    if (!toggle) return;
    toggle.addEventListener('change', (e) => {
        const show = e.target.checked;
        document.querySelectorAll('.key-roots').forEach(el => {
            el.style.opacity = show ? '1' : '0';
        });
    });
}

function setupThemeToggle() {
    const btn = $('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        storage.saveTheme(next);
    });
}

function setupModeSelect() {
    const select = $('mode-select');
    if (!select) return;
    select.addEventListener('change', (e) => switchMode(e.target.value));
}

function setupPracticeInput() {
    const input = $('practice-input');
    if (!input) return;

    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', (e) => {
        if (e.key.length === 1 || e.key === ' ' || e.key === 'Backspace') {
            mutate(s => { s.totalKeypresses++; });
        }
        handleSpecialKeys(e);
        highlightKey(e.key, true);
    });
    input.addEventListener('keyup', (e) => highlightKey(e.key, false));

    const reset = $('reset-practice');
    if (reset) {
        reset.addEventListener('click', () => {
            loadPracticeMode(getState().mode);
            input.focus();
        });
    }

    const zone = document.querySelector('.practice-zone');
    if (zone) zone.addEventListener('click', () => input.focus());
}

function setupQueryPanel() {
    const btn = $('query-btn');
    const input = $('query-input');
    if (btn) btn.addEventListener('click', performQuery);
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') performQuery();
        });
    }
}

function setupWrongActions() {
    const clear = $('clear-wrong-btn');
    const exportBtn = $('export-anki-btn');
    const copy = $('copy-anki-btn');
    if (clear) clear.addEventListener('click', clearWrongLedger);
    if (exportBtn) exportBtn.addEventListener('click', exportWrongCharsToAnki);
    if (copy) copy.addEventListener('click', copyWrongCharsToClipboard);
}

function setupReinforce() {
    const btn = $('reinforce-weak-btn');
    if (btn) btn.addEventListener('click', () => switchMode('reinforce'));
}

function setupDiagnosticActions() {
    const retry = $('report-retry-wrong-btn');
    const restart = $('report-restart-btn');
    const close = $('report-close-btn');

    if (retry) {
        retry.addEventListener('click', () => {
            const ledger = getState().wrongCharsLedger;
            if (ledger.size === 0) {
                alert('本轮没有错字，太棒了！');
                return;
            }
            hideDiagnosticReport();
            switchMode('wrong-review');
        });
    }
    if (restart) {
        restart.addEventListener('click', () => {
            hideDiagnosticReport();
            loadPracticeMode(getState().mode);
        });
    }
    if (close) {
        close.addEventListener('click', hideDiagnosticReport);
    }
}

function setupHistoryActions() {
    const exportBtn = $('export-history-btn');
    const clearBtn = $('clear-history-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportHistoryToCSV);
    if (clearBtn) clearBtn.addEventListener('click', clearHistory);
}

function init() {
    renderKeyboard();

    setEngineHandlers({
        onComplete: () => showDiagnosticReport(recordPracticeSession)
    });
    setLedgerHandlers({ addToCustomPractice: addCharToCustomPractice });
    setQueryHandlers({ addToCustomPractice: addCharToCustomPractice });

    setupModeSelect();
    setupPracticeInput();
    setupQueryPanel();
    setupWrongActions();
    setupReinforce();
    setupDiagnosticActions();
    setupHistoryActions();
    setupKeycapsToggle();
    setupThemeToggle();
    setupKeyboardPanel();

    loadInitialWrongChars();
    renderWrongLedger();

    loadPracticeHistory();
    loadWeaknessStats();

    applyTheme(storage.loadTheme());
    switchMode('yiji');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
