import { $ } from '../dom.js';
import { getState } from '../state.js';
import { WUBI_DICT } from '../wubi86_data.js';

const SEG_PALETTE = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];

function buildModeIndex(history) {
    const order = [];
    const seen = new Set();
    history.forEach(r => {
        const m = r.mode;
        if (!m || seen.has(m)) return;
        seen.add(m);
        order.push(m);
    });
    const segClass = {};
    order.forEach((m, i) => { segClass[m] = SEG_PALETTE[i % SEG_PALETTE.length]; });
    return { order, segClass };
}

function fmtDate(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${m}-${dd}`;
}

function dayKey(d) {
    return d.toISOString().slice(0, 10);
}

function buildStatCard({ index, label, value, unit, delta, color }) {
    const card = document.createElement('div');
    card.className = 'stat-card bracket';
    card.dataset.color = color;
    card.innerHTML = `
        <div class="stat-card-head">
            <span class="stat-card-label">// ${label}</span>
            <span class="stat-card-index">${index}</span>
        </div>
        <div class="stat-card-value">${value}</div>
        <div class="stat-card-foot">
            <span class="stat-card-delta${delta && delta.startsWith('-') ? ' is-down' : ''}">${delta || '—'}</span>
            <span class="stat-card-unit">${unit}</span>
        </div>
    `;
    return card;
}

function renderMetrics() {
    const container = $('stats-metrics');
    if (!container) return;

    const history = getState().history || [];
    const recent = history.slice(0, 10);
    const prev = history.slice(10, 20);

    const avg = arr => arr.length ? Math.round(arr.reduce((s, r) => s + r, 0) / arr.length * 10) / 10 : 0;
    const sum = arr => arr.reduce((s, r) => s + r, 0);

    const wpmNow = avg(recent.map(r => r.wpm));
    const wpmPrev = avg(prev.map(r => r.wpm));
    const accNow = avg(recent.map(r => r.accuracy));
    const accPrev = avg(prev.map(r => r.accuracy));

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekRecords = history.filter(r => {
        const t = new Date(r.timestamp || r.date);
        return t >= weekStart;
    });
    const keysWeek = sum(weekRecords.map(r => Math.round(((r.wpm || 0) * (r.duration || 0)) / 60 * 4)));
    const keysWeekPrev = sum(history.slice(0, 30).map(r => Math.round(((r.wpm || 0) * (r.duration || 0)) / 60 * 4))) - keysWeek;

    const sessionsCount = history.length;
    const avgDurationSec = sessionsCount ? Math.round(sum(history.map(r => r.duration || 0)) / sessionsCount) : 0;
    const avgDurationMin = Math.round(avgDurationSec / 60);

    const formatKeys = n => {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return String(n);
    };
    const deltaPct = (now, before) => {
        if (!before) return now > 0 ? '+100%' : '—';
        const pct = Math.round(((now - before) / before) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}% 较上次`;
    };
    const deltaAbs = (now, before, suffix = '') => {
        if (!before) return now > 0 ? `+${now}${suffix}` : '—';
        const diff = Math.round((now - before) * 10) / 10;
        return `${diff >= 0 ? '+' : ''}${diff}${suffix} 较上次`;
    };

    container.innerHTML = '';
    container.appendChild(buildStatCard({
        index: '01', label: '字速', value: wpmNow || 0, unit: '字/分钟',
        delta: deltaPct(wpmNow, wpmPrev), color: 'c1'
    }));
    container.appendChild(buildStatCard({
        index: '02', label: '准确率', value: accNow ? `${accNow}%` : '—', unit: '错/百字',
        delta: deltaAbs(accNow, accPrev, '%'), color: 'c2'
    }));
    container.appendChild(buildStatCard({
        index: '03', label: '击键数', value: formatKeys(keysWeek), unit: '本周',
        delta: deltaPct(keysWeek, keysWeekPrev), color: 'c3'
    }));
    container.appendChild(buildStatCard({
        index: '04', label: '单次时长', value: `${avgDurationMin} 分`, unit: '日均',
        delta: sessionsCount ? `共 ${sessionsCount} 次` : '—', color: 'c4'
    }));
}

function renderTrend() {
    const yaxis = $('trend-yaxis');
    const bars = $('trend-bars');
    const xaxis = $('trend-xaxis');
    const legend = $('trend-legend');
    if (!bars) return;

    const history = getState().history || [];
    const { order: modeOrder, segClass } = buildModeIndex(history);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    const dayBuckets = {};
    const emptyBucket = () => Object.fromEntries(modeOrder.map(m => [m, []]));
    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = dayKey(d);
        days.push({ key, label: fmtDate(d) });
        dayBuckets[key] = emptyBucket();
    }

    history.forEach(r => {
        const t = new Date(r.timestamp || r.date);
        t.setHours(0, 0, 0, 0);
        const key = dayKey(t);
        if (!dayBuckets[key] || !r.mode) return;
        dayBuckets[key][r.mode].push(r.wpm || 0);
    });

    const modeAvg = Object.fromEntries(modeOrder.map(m => [m, []]));
    history.forEach(r => {
        if (r.mode && r.wpm) modeAvg[r.mode].push(r.wpm);
    });

    const yMax = 60;
    const ySteps = [60, 45, 30, 15, 0];

    if (yaxis) {
        yaxis.innerHTML = ySteps.map(v => `<span>${v}</span>`).join('');
    }

    bars.innerHTML = '';
    days.forEach(({ key }) => {
        const col = document.createElement('div');
        col.className = 'trend-bar-col';

        const stack = document.createElement('div');
        stack.className = 'trend-bar-stack';

        const buckets = dayBuckets[key];
        const segs = modeOrder.map(mode => {
            const arr = buckets[mode];
            if (!arr || !arr.length) return null;
            const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
            return { mode, avg };
        }).filter(Boolean);

        if (segs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'trend-bar-empty';
            stack.appendChild(empty);
        } else {
            const totalPct = segs.reduce((s, x) => s + Math.min(100, (x.avg / yMax) * 100), 0);
            stack.style.height = `${Math.min(100, totalPct)}%`;
            segs.forEach(({ mode, avg }) => {
                const seg = document.createElement('div');
                seg.className = `trend-bar-seg ${segClass[mode]}`;
                seg.style.flex = `${Math.min(100, (avg / yMax) * 100)} 0 0`;
                seg.title = `${mode} · ${Math.round(avg)} 字速`;
                stack.appendChild(seg);
            });
        }

        col.appendChild(stack);
        bars.appendChild(col);
    });

    if (xaxis) {
        xaxis.innerHTML = '';
        days.forEach(({ label }, i) => {
            const cell = document.createElement('span');
            cell.className = 'trend-xaxis-cell';
            cell.textContent = (i % 2 === 0) ? label : '';
            xaxis.appendChild(cell);
        });
    }

    if (legend) {
        legend.innerHTML = '';
        if (modeOrder.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'trend-legend-empty';
            empty.textContent = '暂无数据';
            legend.appendChild(empty);
        } else {
            modeOrder.forEach(mode => {
                const arr = modeAvg[mode];
                const mean = arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
                const item = document.createElement('span');
                item.className = 'trend-legend-item';
                item.innerHTML = `
                    <span class="trend-legend-swatch trend-bar-seg ${segClass[mode]}"></span>
                    <span class="trend-legend-label">${mode}</span>
                    <span class="trend-legend-mean">均 ${mean}</span>
                `;
                legend.appendChild(item);
            });
        }
    }
}

function renderWeakTable() {
    const table = $('weak-table');
    if (!table) return;

    const cnt = getState().wrongKeysCount || {};
    const ledger = Array.from(getState().wrongCharsLedger || []);

    const charStats = ledger.map(ch => {
        const info = WUBI_DICT[ch];
        if (!info) return null;
        const code = info.w || info.s || '';
        let weight = 1;
        for (const k of code) weight = Math.max(weight, cnt[k] || 1);
        return { char: ch, code, count: weight };
    }).filter(Boolean);

    charStats.sort((a, b) => b.count - a.count);
    const top = charStats.slice(0, 5);
    const maxCount = top.length ? top[0].count : 1;
    const totalErr = charStats.reduce((s, x) => s + x.count, 0) || 1;

    table.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'weak-row is-head';
    head.innerHTML = `
        <span>#</span><span>字</span><span>编码</span><span>错率</span><span>次数</span>
    `;
    table.appendChild(head);

    if (top.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'weak-row';
        empty.innerHTML = `<span style="grid-column: span 5; text-align:center; color: var(--ink-tertiary);">暂无错字记录</span>`;
        table.appendChild(empty);
        return;
    }

    top.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'weak-row' + (idx === 0 ? ' is-top' : '');
        const rate = Math.round((item.count / totalErr) * 1000) / 10;
        const barPct = Math.round((item.count / maxCount) * 100);
        row.innerHTML = `
            <span class="weak-cell-rank">${String(idx + 1).padStart(2, '0')}</span>
            <span class="weak-cell-char">${item.char}</span>
            <span class="weak-cell-code">${item.code}</span>
            <span class="weak-cell-rate">${rate}%</span>
            <span class="weak-cell-count">
                <span>${item.count}</span>
                <span class="weak-cell-bar"><span class="weak-cell-bar-fill" style="width:${barPct}%"></span></span>
            </span>
        `;
        table.appendChild(row);
    });
}

function renderSessTable() {
    const table = $('sess-table');
    if (!table) return;

    const history = (getState().history || []).slice(0, 7);

    table.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'sess-row is-head';
    head.innerHTML = `
        <span>时间</span><span>模式</span><span>字速</span><span>准确</span><span>时长</span>
    `;
    table.appendChild(head);

    if (history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'sess-row';
        empty.innerHTML = `<span style="grid-column: span 5; text-align:center; color: var(--ink-tertiary);">暂无练习记录</span>`;
        table.appendChild(empty);
        return;
    }

    history.forEach(r => {
        const row = document.createElement('div');
        row.className = 'sess-row';
        const t = new Date(r.timestamp || r.date);
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        const dur = Math.round((r.duration || 0) / 60);
        row.innerHTML = `
            <span>${hh}:${mm}</span>
            <span class="sess-cell-mode">${r.mode || '-'}</span>
            <span class="sess-cell-num">${r.wpm}</span>
            <span class="sess-cell-num">${r.accuracy}%</span>
            <span>${dur} 分</span>
        `;
        table.appendChild(row);
    });
}

export function renderStatsPage() {
    renderMetrics();
    renderTrend();
    renderWeakTable();
    renderSessTable();
}
