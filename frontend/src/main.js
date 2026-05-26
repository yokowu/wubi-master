import './style.css';

import { $ } from './dom.js';
import { getState, mutate } from './state.js';
import { storage } from './storage.js';

import {
    loadInitialWrongChars,
    setLedgerHandlers,
    loadWeaknessStats
} from './ledger.js';
import { loadPracticeHistory, recordPracticeSession } from './history.js';
import {
    loadPracticeMode,
    addCharToCustomPractice,
    handleInput,
    handleSpecialKeys,
    setEngineHandlers
} from './practice/engine.js';
import { switchMode } from './modes.js';
import { showReport, hideReport, setupReportModal } from './report.js';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function setupSidebarNav() {
    document.querySelectorAll('.sb-nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
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

function setupResetButton() {
    const btn = $('reset-practice');
    if (!btn) return;
    btn.addEventListener('click', () => {
        loadPracticeMode(getState().mode);
        const input = $('practice-input');
        if (input) input.focus();
    });
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
    });

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('button, a, input, select')) return;
        input.focus();
    });
}

function setupGlobalKeys() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = $('report-overlay');
            if (overlay && !overlay.hasAttribute('hidden')) {
                e.preventDefault();
                hideReport();
                const input = $('practice-input');
                if (input) input.focus();
                return;
            }
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            loadPracticeMode(getState().mode);
            const input = $('practice-input');
            if (input) input.focus();
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            showReport();
            return;
        }
        if ((e.metaKey || e.ctrlKey) && /^[1-7]$/.test(e.key)) {
            e.preventDefault();
            const order = ['yiji', 'erji', 'highfreq', 'hard', 'custom', 'wrong-review', 'reinforce'];
            switchMode(order[Number(e.key) - 1]);
        }
    });
}

function setupStreakGrid() {
    const grid = $('sb-streak-grid');
    const valEl = $('sb-streak-days');
    if (!grid) return;

    const history = storage.loadHistory() || [];
    const days = new Set();
    history.forEach(rec => {
        if (rec && rec.timestamp) {
            const d = new Date(rec.timestamp);
            days.add(d.toISOString().slice(0, 10));
        }
    });

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (days.has(key)) streak++;
        else if (i === 0) continue;
        else break;
    }
    if (valEl) valEl.textContent = `${streak} 天`;

    grid.innerHTML = '';
    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const cell = document.createElement('span');
        cell.className = 'sb-streak-cell' + (days.has(key) ? ' is-on' : '');
        grid.appendChild(cell);
    }
}

function init() {
    setEngineHandlers({
        onComplete: () => {
            recordPracticeSession();
            showReport();
        }
    });
    setLedgerHandlers({ addToCustomPractice: addCharToCustomPractice });

    setupSidebarNav();
    setupThemeToggle();
    setupResetButton();
    setupPracticeInput();
    setupGlobalKeys();
    setupReportModal({
        onRestart: () => {
            hideReport();
            loadPracticeMode(getState().mode);
            const input = $('practice-input');
            if (input) input.focus();
        },
        onClose: () => {
            hideReport();
            const input = $('practice-input');
            if (input) input.focus();
        }
    });

    const openReportBtn = $('open-report');
    if (openReportBtn) openReportBtn.addEventListener('click', () => showReport());

    loadInitialWrongChars();
    loadPracticeHistory();
    loadWeaknessStats();
    setupStreakGrid();

    applyTheme(storage.loadTheme());
    switchMode('yiji');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
