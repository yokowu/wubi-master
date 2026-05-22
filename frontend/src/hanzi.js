import HanziWriter from 'hanzi-writer';

const SVG_NS = 'http://www.w3.org/2000/svg';

function drawStrokes(target, strokes, activeIndices) {
    const activeColor = '#1a365d';
    const normalColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#f0ebd9' : '#e5e5e5';

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1024 1024');

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('transform', 'scale(1, -1) translate(0, -1024)');
    svg.appendChild(group);

    strokes.forEach((pathData, idx) => {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', pathData);
        path.style.fill = activeIndices.includes(idx) ? activeColor : normalColor;
        group.appendChild(path);
    });

    target.appendChild(svg);
}

function fallbackSegments(cleanCode, totalStrokes) {
    let numRadicals = cleanCode.length;
    if (cleanCode.length === 3) numRadicals = 2;
    else if (cleanCode.length === 2) numRadicals = 1;
    if (numRadicals <= 0 || totalStrokes <= 0) return [];

    const segments = [];
    const baseSize = Math.floor(totalStrokes / numRadicals);
    const extra = totalStrokes % numRadicals;
    let strokeIdx = 0;
    for (let i = 0; i < numRadicals; i++) {
        const size = baseSize + (i < extra ? 1 : 0);
        const seg = [];
        for (let j = 0; j < size; j++) seg.push(strokeIdx++);
        segments.push(seg);
    }
    return segments;
}

function buildItem(key, unitGlyph, charData, strokeIndices) {
    const item = document.createElement('div');
    item.className = 'decomposition-stroke-item';

    if (key) {
        const badge = document.createElement('div');
        badge.className = 'stroke-key-badge';
        badge.textContent = key.toUpperCase();
        item.appendChild(badge);
    }

    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'stroke-svg-wrapper';
    item.appendChild(svgWrapper);
    drawStrokes(svgWrapper, charData.strokes, strokeIndices);

    if (unitGlyph && unitGlyph.trim()) {
        const name = document.createElement('div');
        name.className = 'stroke-radical-name';
        name.textContent = unitGlyph.trim();
        item.appendChild(name);
    }

    return item;
}

export function renderHanziDecomposition(container, char, code, segments, units) {
    container.innerHTML = '<div style="font-size: 11px; color: var(--text-muted);">正在加载笔画拆解...</div>';

    HanziWriter.loadCharacterData(char)
        .then(charData => {
            let activeSegments = segments;
            const cleanCode = code.toLowerCase().replace(/[^a-z]/g, '');
            const totalStrokes = charData.strokes ? charData.strokes.length : 0;

            if (!activeSegments || activeSegments.length === 0) {
                activeSegments = fallbackSegments(cleanCode, totalStrokes);
            }

            if (!activeSegments || activeSegments.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = '';

            const title = document.createElement('div');
            title.className = 'wubi-decomposition-title';
            title.textContent = '✍️ 笔画拆分图解';
            container.appendChild(title);

            const flex = document.createElement('div');
            flex.className = 'wubi-decomposition-container';
            container.appendChild(flex);

            const keys = Array.from(cleanCode);
            const unitNames = units ? units.trim().split(/\s+/) : [];

            activeSegments.forEach((indices, i) => {
                flex.appendChild(buildItem(keys[i] || '', unitNames[i] || '', charData, indices));
            });

            for (let i = activeSegments.length; i < keys.length; i++) {
                flex.appendChild(buildItem(keys[i], unitNames[i] || '', charData, []));
            }
        })
        .catch(err => {
            console.warn('Failed to load character data for HanziWriter', err);
            container.innerHTML = '';
        });
}
