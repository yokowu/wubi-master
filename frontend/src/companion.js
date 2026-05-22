import { $ } from './dom.js';
import { WUBI_DICT, ERJI_LIST } from './wubi86_data.js';
import { REAL_YIJI_LIST } from './constants.js';
import { renderHanziDecomposition } from './hanzi.js';
import { api } from './api.js';

export function renderActivePracticeHint(wordObj) {
    const result = $('query-result');
    if (!wordObj || !result) return;

    const char = wordObj.char;
    const info = WUBI_DICT[char];
    if (!info) return;

    result.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'result-card active-hint-card';

    const isYiji = REAL_YIJI_LIST.some(item => item.char === char);
    const isErji = ERJI_LIST.some(item => item.char === char);
    const tag = isYiji ? ' (一级简码)' : (isErji ? ' (二级简码)' : '');

    card.innerHTML = `
        <div class="result-header active-hint-header">
            <span class="result-char active-hint-char">${char}</span>
            <div class="result-meta active-hint-meta">
                <span class="active-hint-title">💡 当前练习字提示</span>
                <span class="active-hint-row">拼音: <strong>${info.p || '无'}</strong></span>
                <span class="active-hint-row">五笔: <strong>${info.w.toUpperCase()}</strong>${tag}</span>
                ${info.s !== info.w ? `<span class="active-hint-row">简码: <strong class="active-hint-strong">${info.s.toUpperCase()}</strong></span>` : ''}
            </div>
        </div>
    `;

    const decomp = document.createElement('div');
    decomp.className = 'active-hint-decomp';
    card.appendChild(decomp);
    result.appendChild(card);

    api.fetchWubi(char)
        .then(data => renderHanziDecomposition(decomp, char, data.code, data.segments, data.units))
        .catch(() => { decomp.innerHTML = '<div class="active-hint-empty">暂无此字笔画拆解</div>'; });
}

export function showPracticePlaceholder(wordObj) {
    const result = $('query-result');
    if (!wordObj || !result) return;
    result.innerHTML = `
        <div class="query-empty practice-placeholder">
            <div class="practice-placeholder-icon">🎯</div>
            <p class="practice-placeholder-title">正在练习中</p>
            <p class="practice-placeholder-hint">
                当前字：<strong>${wordObj.char}</strong><br>
                打字卡顿时，此处将自动呈现该字五笔编码与笔画拆分图解。
            </p>
        </div>
    `;
}

export function restoreDefaultQueryPlaceholder() {
    const result = $('query-result');
    if (!result) return;
    result.innerHTML = `
        <div class="query-empty">
            <p>输入汉字，即可实时查询其五笔86编码、拼音、以及在键盘上的拆分按键路径。</p>
        </div>
    `;
}
