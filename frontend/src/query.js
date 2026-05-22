import { $ } from './dom.js';
import { WUBI_DICT, ERJI_LIST } from './wubi86_data.js';
import { REAL_YIJI_LIST } from './constants.js';
import { renderHanziDecomposition } from './hanzi.js';
import { flashCodeSequence } from './keyboard.js';
import { api } from './api.js';

let onAddToCustomPractice = () => {};

export function setQueryHandlers({ addToCustomPractice }) {
    if (addToCustomPractice) onAddToCustomPractice = addToCustomPractice;
}

export function performQuery() {
    const input = $('query-input');
    const result = $('query-result');
    if (!input || !result) return;

    const txt = input.value.trim();
    if (!txt) return;

    result.innerHTML = '';
    Array.from(txt).forEach(char => {
        const info = WUBI_DICT[char];
        const card = document.createElement('div');
        card.className = 'result-card';

        if (info) {
            const isYiji = REAL_YIJI_LIST.some(item => item.char === char);
            const isErji = ERJI_LIST.some(item => item.char === char);
            const tag = isYiji ? ' (一级简码)' : (isErji ? ' (二级简码)' : '');

            card.innerHTML = `
                <div class="result-header">
                    <span class="result-char">${char}</span>
                    <div class="result-meta">
                        <span class="pinyin">拼音: <strong>${info.p || '无'}</strong></span>
                        <span class="wubi-code">五笔: <strong>${info.w}</strong>${tag}</span>
                        ${info.s !== info.w ? `<span class="pinyin pinyin-shortcode">简码: <strong class="shortcode-strong">${info.s}</strong></span>` : ''}
                    </div>
                </div>
                <button class="btn-secondary add-to-practice-btn" data-char="${char}">添加到自由练习</button>
            `;

            const decomp = document.createElement('div');
            decomp.className = 'query-decomp';
            card.appendChild(decomp);

            api.fetchWubi(char)
                .then(data => renderHanziDecomposition(decomp, char, data.code, data.segments, data.units))
                .catch(() => {});

            flashCodeSequence(info.w);
        } else {
            card.innerHTML = `
                <div class="query-empty">
                    <p class="query-empty-error">未找到汉字 "${char}" 的五笔86编码。</p>
                </div>
            `;
        }
        result.appendChild(card);
    });

    result.querySelectorAll('.add-to-practice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const charToAdd = e.currentTarget.getAttribute('data-char');
            onAddToCustomPractice(charToAdd);
        });
    });
}
