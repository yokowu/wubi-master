import { $ } from '../dom.js';
import { getState } from '../state.js';
import { KEY_ROOTS, ZONE_KEYS, ZONE_LABELS } from '../constants.js';
import { findMatchingRoot } from './roots.js';
import { findWeakestZone } from '../ledger.js';

export function renderQueue() {
    const flow = $('practice-text-flow');
    const input = $('practice-input');
    const s = getState();

    if (s.queue.length === 0) {
        renderEmptyQueue(flow, s.mode);
        if (input) input.disabled = true;
        return;
    }
    if (input) input.disabled = false;

    flow.innerHTML = '';
    s.queue.forEach((item, idx) => {
        const span = document.createElement('span');
        span.className = 'flow-char';
        span.textContent = item.char;
        if (idx < s.currentIndex) span.classList.add('typed-correct');
        else if (idx === s.currentIndex) span.classList.add('char-active');
        else span.classList.add('char-upcoming');
        flow.appendChild(span);
    });
}

function renderEmptyQueue(flow, mode) {
    const pinyin = $('hint-pinyin');
    const wubi = $('hint-wubi');
    const roots = $('roots-guide');

    if (mode === 'custom') {
        flow.innerHTML = '<div class="flow-status">🔍</div>';
        if (pinyin) pinyin.textContent = '暂无内容';
        if (wubi) wubi.textContent = '请在右侧查字并添加';
        if (roots) roots.innerHTML = '<span class="empty-text">在右侧查询面板输入生字，点击"添加练习"即可在此练习</span>';
    } else if (mode === 'wrong-review') {
        flow.innerHTML = '<div class="flow-status">🏆</div>';
        if (pinyin) pinyin.textContent = '完美复习!';
        if (wubi) wubi.textContent = '所有错字已消灭！';
        if (roots) roots.innerHTML = '<span class="empty-text">当前错字本中没有需要复习的汉字啦！</span>';
    } else {
        flow.innerHTML = '<div class="flow-status">🎉</div>';
        if (pinyin) pinyin.textContent = '通关!';
        if (wubi) wubi.textContent = '请选择其他模式';
    }
}

export function setActiveIndex(prevIdx, nextIdx) {
    const flow = $('practice-text-flow');
    if (!flow) return null;

    if (prevIdx >= 0 && prevIdx < flow.children.length) {
        const prev = flow.children[prevIdx];
        prev.classList.remove('char-active', 'char-upcoming');
        prev.classList.add('typed-correct');
    }
    if (nextIdx >= 0 && nextIdx < flow.children.length) {
        const next = flow.children[nextIdx];
        next.classList.remove('typed-correct', 'char-upcoming');
        next.classList.add('char-active');
        return next;
    }
    return null;
}

export function getActiveCharElement() {
    const flow = $('practice-text-flow');
    if (!flow) return null;
    return flow.querySelector('.flow-char.char-active');
}

export function renderHints(wordObj) {
    const pinyin = $('hint-pinyin');
    const wubi = $('hint-wubi');
    if (pinyin) pinyin.textContent = wordObj.py || '无音';
    if (wubi) {
        const display = wordObj.code !== wordObj.full
            ? `${wordObj.code.toUpperCase()} [全码: ${wordObj.full.toUpperCase()}]`
            : wordObj.full.toUpperCase();
        wubi.textContent = display;
    }
}

export function setHintsVisibility(visible) {
    const detail = $('active-char-detail');
    const guide = $('roots-guide');
    if (detail) detail.classList.toggle('is-visible', visible);
    if (guide) guide.classList.toggle('is-visible', visible);
}

export function renderRootsGuide(wordObj, typedLen) {
    const guide = $('roots-guide');
    if (!guide) return;
    guide.innerHTML = '';

    for (let i = 0; i < wordObj.code.length; i++) {
        const key = wordObj.code[i];
        const card = document.createElement('div');
        card.className = 'root-step-card';
        if (i === typedLen) card.classList.add('active');

        const keySpan = document.createElement('span');
        keySpan.className = 'root-key';
        keySpan.textContent = key.toUpperCase();
        card.appendChild(keySpan);

        if (KEY_ROOTS[key]) {
            const symbol = document.createElement('span');
            symbol.className = 'root-symbol';
            symbol.textContent = findMatchingRoot(wordObj.char, key);
            card.appendChild(symbol);
        }

        guide.appendChild(card);
    }
}

export function renderProgress() {
    const s = getState();
    const el = $('stat-progress');
    if (el) el.textContent = `${s.currentIndex}/${s.queue.length}`;
}

export function renderInstructions(mode) {
    const el = $('instruction-text');
    if (!el) return;

    if (mode === 'reinforce') {
        const weakest = findWeakestZone();
        const label = ZONE_LABELS[weakest];
        const keys = ZONE_KEYS[weakest].join(', ').toUpperCase();
        el.innerHTML = `🎯 <b>${label}强化训练中</b>：系统当前针对您的最薄弱键区（<b>${keys}</b>）进行特训。请按空格提交击键。`;
    } else {
        el.innerHTML = '敲击物理键盘对应的五笔编码，然后按 <span class="kbd-key">Space 空格</span> 提交。遇到不会的字，可以停顿 1.5 秒查看键位提示。';
    }
}
