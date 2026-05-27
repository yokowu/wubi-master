import { $ } from '../dom.js';
import { getState } from '../state.js';
import { ZONE_KEYS, ZONE_LABELS } from '../constants.js';
import { findWeakestZone } from '../ledger.js';
import { ERJI_LIST, HIGH_FREQ_LIST } from '../wubi86_data.js';
import { REAL_YIJI_LIST } from '../constants.js';
import { api } from '../api.js';

let decompToken = 0;
const SVG_NS = 'http://www.w3.org/2000/svg';

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
    const messages = {
        custom: '自由练习 · 暂无内容',
        'wrong-review': '错字本已清空 · 完美复习',
    };
    flow.innerHTML = `<div class="flow-status">${messages[mode] || '通关 · 请选择其他模式'}</div>`;
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

function modeTag(char) {
    if (REAL_YIJI_LIST.some(it => it.char === char)) return '一级简码';
    if (ERJI_LIST.some(it => it.char === char)) return '二级简码';
    if (HIGH_FREQ_LIST.some(it => it.char === char)) return '常用高频';
    return '';
}

export function renderHints(wordObj) {
    const glyph = $('hp-char');
    const code = $('hp-code');
    if (glyph) glyph.textContent = wordObj.char || '—';
    if (code) {
        const display = wordObj.code !== wordObj.full
            ? `${wordObj.code.toLowerCase()} · 全码 ${wordObj.full.toLowerCase()}`
            : wordObj.full.toLowerCase();
        const tag = modeTag(wordObj.char);
        code.textContent = `五笔 ${display}${tag ? ` · ${tag}` : ''}${wordObj.py ? ` · ${wordObj.py}` : ''}`;
    }
}

export function setHintsVisibility(visible) {
    const panel = $('hanzi-panel');
    if (panel) panel.classList.toggle('is-visible', visible);
    if (!visible) {
        decompToken++;
        const canvas = $('hp-canvas');
        if (canvas) canvas.innerHTML = '';
        const radicals = $('hp-radicals');
        if (radicals) radicals.innerHTML = '';
        const meta = $('hp-meta');
        if (meta) meta.textContent = '';
    }
}

export function renderPracticeDecomposition(wordObj) {
    const canvas = $('hp-canvas');
    const radicals = $('hp-radicals');
    const meta = $('hp-meta');
    if (!canvas || !radicals || !wordObj) return;

    canvas.innerHTML = '<div class="hp-canvas-empty">加载中...</div>';
    radicals.innerHTML = '';
    if (meta) meta.textContent = '';

    const token = ++decompToken;

    Promise.all([
        api.fetchWubi(wordObj.char).catch(() => null),
        loadCharData(wordObj.char).catch(() => null)
    ]).then(([wubi, charData]) => {
        if (token !== decompToken) return;

        const strokes = (charData && charData.strokes) || null;
        if (strokes) {
            drawStrokes(canvas, strokes, strokes.map((_, i) => i), 196);
            if (meta) meta.textContent = `${strokes.length} 笔`;
        } else {
            canvas.innerHTML = '<div class="hp-canvas-empty">无字形</div>';
        }

        const code = (wordObj.full || wordObj.code || '').toLowerCase();
        const segments = wubi && wubi.segments && wubi.segments.length ? wubi.segments : null;
        renderRadicalCards(radicals, wordObj, code, strokes, segments);
    }).catch(() => {
        if (token !== decompToken) return;
        canvas.innerHTML = '';
        radicals.innerHTML = '';
    });
}

let _hanziWriter;
function getHanziWriter() {
    if (!_hanziWriter) {
        _hanziWriter = import('hanzi-writer').then(m => m.default || m);
    }
    return _hanziWriter;
}
function loadCharData(char) {
    return getHanziWriter().then(HanziWriter => HanziWriter.loadCharacterData(char));
}

function themeColors() {
    const root = getComputedStyle(document.documentElement);
    const active = (root.getPropertyValue('--ink-primary') || '').trim() || '#0B1220';
    const dim = (root.getPropertyValue('--ink-muted') || '').trim() || '#D8DCE5';
    return { active, dim };
}

function drawStrokes(target, strokes, activeIndices, size) {
    target.innerHTML = '';
    if (!strokes || !strokes.length) return;
    const { active, dim } = themeColors();
    const set = new Set(activeIndices || []);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1024 1024');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('transform', 'scale(1, -1) translate(0, -1024)');
    svg.appendChild(group);

    strokes.forEach((d, idx) => {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', set.has(idx) ? active : dim);
        group.appendChild(path);
    });
    target.appendChild(svg);
}

function renderRadicalCards(container, wordObj, code, strokes, segments) {
    container.innerHTML = '';
    for (let i = 0; i < code.length; i++) {
        const indices = segments && segments[i];
        const isRecognition = !indices || indices.length === 0;
        container.appendChild(buildRadicalCard(strokes, indices || [], code[i], isRecognition));
    }
}

function buildRadicalCard(strokes, indices, key, isRecognition) {
    const card = document.createElement('div');
    card.className = 'hp-radical';
    if (isRecognition) card.classList.add('is-recognition');

    const g = document.createElement('span');
    g.className = 'hp-radical-glyph';
    card.appendChild(g);

    const k = document.createElement('span');
    k.className = 'hp-radical-key';
    k.textContent = (key || '').toLowerCase();
    card.appendChild(k);

    const foot = document.createElement('span');
    foot.className = 'hp-radical-foot';
    if (isRecognition) {
        foot.textContent = '识别码';
    } else {
        foot.textContent = indices.length ? `${indices.length} 笔` : '';
    }
    card.appendChild(foot);

    if (isRecognition) {
        g.textContent = '识';
    } else if (strokes) {
        drawStrokes(g, strokes, indices, 56);
    } else {
        g.textContent = '·';
    }

    return card;
}

export function renderProgress() {
    const s = getState();
    const el = $('stat-progress');
    if (el) el.textContent = `${s.currentIndex} / ${s.queue.length}`;
    const meta = $('practice-meta-progress');
    if (meta) meta.textContent = `第 ${Math.min(s.currentIndex + 1, s.queue.length || 1)} 字 / 共 ${s.queue.length} 字`;
    const footer = $('footer-progress');
    if (footer) footer.textContent = `行 ${s.currentIndex}:${s.queue.length}`;
}

export function renderInstructions(mode) {
    const sub = $('topbar-submode');
    if (!sub) return;
    if (mode === 'reinforce') {
        const weakest = findWeakestZone();
        const label = ZONE_LABELS[weakest];
        const keys = ZONE_KEYS[weakest].join(',').toUpperCase();
        sub.textContent = `${label} · ${keys}`;
    }
}
