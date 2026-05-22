import { $ } from './dom.js';
import { getState, mutate } from './state.js';
import { storage } from './storage.js';
import { WUBI_DICT } from './wubi86_data.js';
import { KEY_ROOTS, REAL_YIJI_LIST, ZONE_KEYS, KEY_TO_ZONE } from './constants.js';
import { findMatchingRoot } from './practice/roots.js';
import { api } from './api.js';
import { ERJI_LIST } from './wubi86_data.js';
import { refreshLedgerBadge } from './fab.js';

let onAddToCustomPractice = () => {};

export function setLedgerHandlers({ addToCustomPractice }) {
    if (addToCustomPractice) onAddToCustomPractice = addToCustomPractice;
}

export function loadInitialWrongChars() {
    mutate(s => { s.wrongCharsLedger = storage.loadWrongChars(); });
}

export function renderWrongLedger() {
    const list = $('wrong-chars-list');
    const actions = $('wrong-actions');
    if (!list) return;

    const ledger = getState().wrongCharsLedger;
    list.innerHTML = '';

    if (ledger.size === 0) {
        list.innerHTML = '<span class="empty-text">暂无错字，保持下去！</span>';
        if (actions) actions.hidden = true;
        refreshLedgerBadge();
        return;
    }

    if (actions) actions.hidden = false;

    ledger.forEach(char => {
        const info = WUBI_DICT[char];
        if (!info) return;

        const badge = document.createElement('span');
        badge.className = 'wrong-char-badge';
        badge.innerHTML = `${char}<span>${info.s}</span>`;
        badge.title = '点击添加此错字回练习队列';
        badge.addEventListener('click', () => onAddToCustomPractice(char));
        list.appendChild(badge);
    });

    refreshLedgerBadge();
}

export function addWrongCharacter(wordObj) {
    const ledger = getState().wrongCharsLedger;
    if (ledger.has(wordObj.char)) return;
    ledger.add(wordObj.char);
    storage.saveWrongChars(ledger);
    renderWrongLedger();
}

export function removeWrongCharacter(char) {
    const ledger = getState().wrongCharsLedger;
    if (!ledger.delete(char)) return;
    storage.saveWrongChars(ledger);
    renderWrongLedger();
}

export function clearWrongLedger() {
    getState().wrongCharsLedger.clear();
    storage.saveWrongChars(getState().wrongCharsLedger);
    renderWrongLedger();
}

function generateAnkiContent() {
    const rows = [];
    getState().wrongCharsLedger.forEach(char => {
        const info = WUBI_DICT[char];
        if (!info) return;

        const rootsPath = [];
        const code = info.w;
        for (let i = 0; i < code.length; i++) {
            const k = code[i];
            if (KEY_ROOTS[k]) {
                rootsPath.push(`${findMatchingRoot(char, k)}(${k.toUpperCase()})`);
            }
        }

        const isYiji = REAL_YIJI_LIST.some(item => item.char === char);
        const isErji = ERJI_LIST.some(item => item.char === char);
        const tag = isYiji ? ' [一级简码]' : (isErji ? ' [二级简码]' : '');

        const back = `拼音: ${info.p || '无'} | 五笔简码: ${info.s.toUpperCase()}${tag} | 全码: ${info.w.toUpperCase()} | 拆解: ${rootsPath.join(' → ')}`;
        rows.push(`${char}\t${back}`);
    });
    return rows.join('\n');
}

export function exportWrongCharsToAnki() {
    if (getState().wrongCharsLedger.size === 0) return;
    const content = generateAnkiContent();
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wubi_wrong_anki_${Date.now()}.tsv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function copyWrongCharsToClipboard() {
    if (getState().wrongCharsLedger.size === 0) return;
    const content = generateAnkiContent();
    navigator.clipboard.writeText(content)
        .then(() => alert(`已复制 ${getState().wrongCharsLedger.size} 张 Anki 卡片到剪贴板`))
        .catch(() => alert('复制失败，请手动选择导出 Anki'));
}

export function trackWrongKey(typed, correct) {
    const cnt = getState().wrongKeysCount;
    for (let i = 0; i < correct.length; i++) {
        if (typed[i] !== correct[i]) {
            const key = correct[i];
            cnt[key] = (cnt[key] || 0) + 1;
            accumulatePermanentError(key);
            break;
        }
    }
}

function accumulatePermanentError(key) {
    const zone = KEY_TO_ZONE[key];
    if (!zone) return;

    const zones = getState().accumulatedWrongZones;
    zones[zone] = (zones[zone] || 0) + 1;
    renderWeaknessAnalysis();

    api.bumpWeakness(zone).catch(err => {
        console.warn('Failed to sync weakness, falling back to localStorage', err);
        storage.saveAccumulatedErrors(zones);
    });
}

export function loadWeaknessStats() {
    api.fetchWeakness()
        .then(zones => {
            mutate(s => { s.accumulatedWrongZones = zones; });
            renderWeaknessAnalysis();
        })
        .catch(err => {
            console.warn('Backend /api/weakness unavailable, falling back to localStorage', err);
            const zones = storage.loadAccumulatedErrors();
            if (zones) mutate(s => { s.accumulatedWrongZones = zones; });
            renderWeaknessAnalysis();
        });
}

export function renderWeaknessAnalysis() {
    const data = getState().accumulatedWrongZones;
    const counts = ['1', '2', '3', '4', '5'].map(z => data[z] || 0);
    const max = Math.max(...counts);
    const total = counts.reduce((a, b) => a + b, 0);

    const btn = $('reinforce-weak-btn');
    if (btn) btn.toggleAttribute('disabled', total === 0);

    for (let i = 1; i <= 5; i++) {
        const count = data[String(i)] || 0;
        const countEl = $(`weak-count-${i}`);
        const fill = $(`weak-fill-${i}`);
        if (countEl) countEl.textContent = `${count}次`;
        if (fill) fill.style.width = `${max > 0 ? Math.round((count / max) * 100) : 0}%`;
    }
}

export function findWeakestZone() {
    const zones = getState().accumulatedWrongZones;
    let weakest = '1';
    let max = -1;
    for (const [zone, count] of Object.entries(zones)) {
        if (count > max) {
            max = count;
            weakest = zone;
        }
    }
    return weakest;
}

export { ZONE_KEYS };
