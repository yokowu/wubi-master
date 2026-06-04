import { $ } from '../dom.js';
import { api } from '../api.js';
import { WUBI_DICT } from '../wubi86_data.js';
import { WUBI_COMPONENTS } from '../wubi_components.js';

const DEFAULT_CHARS = ['我', '搜', '字', '根', '拆', '解', '这', '中'];
const MAX_RESULTS = 40;
const SVG_NS = 'http://www.w3.org/2000/svg';

let activeChar = '我';
let renderToken = 0;
let hanziWriter;

export function setupSearchPage() {
    const input = $('search-input');
    if (!input) return;

    input.addEventListener('input', () => renderSearchPage(input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = document.querySelector('.search-result-item');
            if (first) first.click();
        }
    });

    renderSearchPage(input.value || activeChar);
}

export function focusSearch() {
    const input = $('search-input');
    if (!input) return;
    input.focus();
    input.select();
}

function renderSearchPage(query = '') {
    const results = findResults(query);
    if (!results.length) {
        renderResults([]);
        renderEmpty(query);
        return;
    }

    if (!results.some(item => item.char === activeChar)) activeChar = results[0].char;
    renderResults(results);
    renderDecomposition(results.find(item => item.char === activeChar) || results[0]);
}

function findResults(query) {
    const q = query.trim();
    if (!q) return DEFAULT_CHARS.map(toResult).filter(Boolean);

    const chars = Array.from(q).filter(ch => WUBI_DICT[ch] || WUBI_COMPONENTS[ch]);
    if (chars.length) return uniqueResults(chars);

    const lower = q.toLowerCase();
    const matched = [];
    for (const [char, info] of Object.entries(WUBI_DICT)) {
        const shortCode = (info.s || '').toLowerCase();
        const fullCode = (info.w || '').toLowerCase();
        const py = (info.p || '').toLowerCase();
        if (shortCode.startsWith(lower) || fullCode.startsWith(lower) || py.startsWith(lower)) {
            matched.push(toResult(char));
        }
        if (matched.length >= MAX_RESULTS) break;
    }
    return matched.filter(Boolean);
}

function uniqueResults(chars) {
    const seen = new Set();
    const out = [];
    for (const char of chars) {
        if (seen.has(char)) continue;
        const result = toResult(char);
        if (!result) continue;
        seen.add(char);
        out.push(result);
    }
    return out;
}

function toResult(char) {
    const info = WUBI_DICT[char] || {};
    if (!info.w && !WUBI_COMPONENTS[char]) return null;
    return {
        char,
        code: info.s || info.w || '',
        full: info.w || info.s || '',
        py: info.p || '',
        components: WUBI_COMPONENTS[char] || []
    };
}

function renderResults(results) {
    const list = $('search-results');
    const count = $('search-count');
    if (count) count.textContent = `${results.length} 个结果`;
    if (!list) return;

    list.innerHTML = '';
    results.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'search-result-item';
        btn.classList.toggle('is-active', item.char === activeChar);
        btn.innerHTML = `
            <span class="search-result-char">${escapeHtml(item.char)}</span>
            <span class="search-result-main">
                <span class="search-result-code">${escapeHtml(item.code || item.full || '—')}</span>
                <span class="search-result-meta">${escapeHtml(item.py || '无拼音')} · 全码 ${escapeHtml(item.full || '—')}</span>
            </span>
        `;
        btn.addEventListener('click', () => {
            activeChar = item.char;
            renderResults(results);
            renderDecomposition(item);
        });
        list.appendChild(btn);
    });
}

function renderEmpty(query) {
    renderToken++;
    setText('search-hp-code', '五笔 —');
    setText('search-hp-meta', query.trim() ? '未找到' : '输入汉字');
    setText('search-hp-char', '—');
    setHtml('search-hp-canvas', '<div class="hp-canvas-empty">无结果</div>');
    setHtml('search-hp-radicals', '');
}

function renderDecomposition(item) {
    const canvas = $('search-hp-canvas');
    const radicals = $('search-hp-radicals');
    if (!canvas || !radicals || !item) return;

    const display = item.code !== item.full
        ? `${item.code.toLowerCase()} · 全码 ${item.full.toLowerCase()}`
        : (item.full || item.code || '—').toLowerCase();
    setText('search-hp-code', `五笔 ${display}${item.py ? ` · ${item.py}` : ''}`);
    setText('search-hp-meta', `${item.components.length} 组件`);
    setText('search-hp-char', item.char);

    canvas.innerHTML = '<div class="hp-canvas-empty">加载中...</div>';
    radicals.innerHTML = '';

    const token = ++renderToken;
    Promise.all([
        api.fetchWubi(item.char).catch(() => null),
        loadCharData(item.char).catch(() => null)
    ]).then(([wubi, charData]) => {
        if (token !== renderToken) return;

        const strokes = (charData && charData.strokes) || null;
        if (strokes) {
            drawStrokes(canvas, strokes, strokes.map((_, i) => i), 196);
            setText('search-hp-meta', `${strokes.length} 笔 · ${item.components.length} 组件`);
        } else {
            canvas.innerHTML = `<span class="hp-glyph">${escapeHtml(item.char)}</span>`;
        }

        const code = (item.full || item.code || '').toLowerCase();
        const segments = wubi && wubi.segments && wubi.segments.length ? wubi.segments : null;
        renderRadicalCards(radicals, code, strokes, segments);
    }).catch(() => {
        if (token !== renderToken) return;
        canvas.innerHTML = `<span class="hp-glyph">${escapeHtml(item.char)}</span>`;
        radicals.innerHTML = '';
    });
}

function getHanziWriter() {
    if (!hanziWriter) {
        hanziWriter = import('hanzi-writer').then(m => m.default || m);
    }
    return hanziWriter;
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

function renderRadicalCards(container, code, strokes, segments) {
    container.innerHTML = '';
    if (!code) {
        container.innerHTML = '<span class="search-empty">暂无五笔编码</span>';
        return;
    }

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

    const glyph = document.createElement('span');
    glyph.className = 'hp-radical-glyph';
    card.appendChild(glyph);

    const keyEl = document.createElement('span');
    keyEl.className = 'hp-radical-key';
    keyEl.textContent = (key || '').toLowerCase();
    card.appendChild(keyEl);

    const foot = document.createElement('span');
    foot.className = 'hp-radical-foot';
    foot.textContent = isRecognition ? '识别码' : `${indices.length} 笔`;
    card.appendChild(foot);

    if (isRecognition) {
        glyph.textContent = '识';
    } else if (strokes) {
        drawStrokes(glyph, strokes, indices, 56);
    } else {
        glyph.textContent = '·';
    }

    return card;
}

function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
}

function setHtml(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
