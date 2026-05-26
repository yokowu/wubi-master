import { $ } from './dom.js';
import { getState, mutate } from './state.js';
import { storage } from './storage.js';
import { WUBI_DICT } from './wubi86_data.js';
import { KEY_ROOTS, REAL_YIJI_LIST, ZONE_KEYS, KEY_TO_ZONE } from './constants.js';
import { findMatchingRoot } from './practice/roots.js';
import { api } from './api.js';
import { ERJI_LIST } from './wubi86_data.js';

let onAddToCustomPractice = () => {};

export function setLedgerHandlers({ addToCustomPractice }) {
    if (addToCustomPractice) onAddToCustomPractice = addToCustomPractice;
}

export function loadInitialWrongChars() {
    mutate(s => { s.wrongCharsLedger = storage.loadWrongChars(); });
}

export function renderWrongLedger() {}

export function addWrongCharacter(wordObj) {
    const ledger = getState().wrongCharsLedger;
    if (ledger.has(wordObj.char)) return;
    ledger.add(wordObj.char);
    storage.saveWrongChars(ledger);
}

export function removeWrongCharacter(char) {
    const ledger = getState().wrongCharsLedger;
    if (!ledger.delete(char)) return;
    storage.saveWrongChars(ledger);
}

export function clearWrongLedger() {
    getState().wrongCharsLedger.clear();
    storage.saveWrongChars(getState().wrongCharsLedger);
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

    api.bumpWeakness(zone).catch(err => {
        console.warn('Failed to sync weakness, falling back to localStorage', err);
        storage.saveAccumulatedErrors(zones);
    });
}

export function loadWeaknessStats() {
    api.fetchWeakness()
        .then(zones => {
            mutate(s => { s.accumulatedWrongZones = zones; });
        })
        .catch(err => {
            console.warn('Backend /api/weakness unavailable, falling back to localStorage', err);
            const zones = storage.loadAccumulatedErrors();
            if (zones) mutate(s => { s.accumulatedWrongZones = zones; });
        });
}

export function renderWeaknessAnalysis() {}

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
