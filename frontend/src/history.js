import { $ } from './dom.js';
import { getState, mutate } from './state.js';
import { storage } from './storage.js';
import { HISTORY_MODE_LABELS } from './constants.js';
import { api } from './api.js';

const CHART_CONFIG = {
    '一级简码': { color: 'var(--text-primary)', strokeDash: 'none', marker: 'circle' },
    '二级简码': { color: '#555555', strokeDash: '4,3', marker: 'square' },
    '常用高频': { color: '#777777', strokeDash: 'none', marker: 'triangle' },
    '难字专项': { color: '#999999', strokeDash: '1,3', marker: 'diamond' },
    '错字复习': { color: '#b33939', strokeDash: 'none', marker: 'cross' },
    '自由练习': { color: '#cccccc', strokeDash: '4,3', marker: 'circle' }
};
const MODES_LIST = ['一级简码', '二级简码', '常用高频', '难字专项', '错字复习', '自由练习'];

function normalizeRecord(r) {
    return {
        id: r.id,
        date: new Date(r.timestamp || r.date).toLocaleString('zh-CN', { hour12: false }),
        mode: r.mode,
        wpm: r.wpm,
        accuracy: r.accuracy,
        wrongCount: r.wrong_count !== undefined ? r.wrong_count : r.wrongCount,
        duration: r.duration
    };
}

export function loadPracticeHistory() {
    api.fetchHistory()
        .then(data => {
            mutate(s => { s.history = data.map(normalizeRecord); });
            renderHistoryUI();
        })
        .catch(err => {
            console.warn('Backend /api/records unavailable, falling back to localStorage', err);
            mutate(s => { s.history = storage.loadHistory(); });
            renderHistoryUI();
        });
}

export function recordPracticeSession() {
    const s = getState();
    if (s.queue.length === 0 || !s.startTime) return;

    const elapsedMin = (new Date() - s.startTime) / 1000 / 60;
    const wpm = elapsedMin > 0 ? Math.round(s.correctTyped / elapsedMin) : 0;
    const acc = s.totalTyped > 0 ? Math.round((s.correctTyped / s.totalTyped) * 100) : 100;
    const elapsedSec = Math.round((new Date() - s.startTime) / 1000);

    const record = {
        id: Date.now(),
        date: new Date().toLocaleString('zh-CN', { hour12: false }),
        mode: HISTORY_MODE_LABELS[s.mode] || s.mode,
        wpm,
        accuracy: acc,
        wrongCount: s.wrongTyped,
        duration: elapsedSec
    };

    s.history.unshift(record);
    if (s.history.length > 500) s.history = s.history.slice(0, 500);
    renderHistoryUI();

    api.saveRecord({
        mode: record.mode,
        wpm: record.wpm,
        accuracy: record.accuracy,
        wrong_count: record.wrongCount,
        duration: record.duration
    })
        .then(() => loadPracticeHistory())
        .catch(err => {
            console.warn('Failed to sync record, falling back to localStorage', err);
            storage.saveHistory(s.history);
        });
}

export function clearHistory() {
    if (!confirm('确定要清空所有的训练历史记录吗？此操作无法撤销。')) return;

    mutate(s => { s.history = []; });
    renderHistoryUI();

    api.clearHistory()
        .then(() => loadPracticeHistory())
        .catch(err => {
            console.warn('Failed to clear records on backend, clearing locally', err);
            storage.clearHistory();
        });
}

export function exportHistoryToCSV() {
    const history = getState().history;
    if (history.length === 0) {
        alert('暂无历史记录可导出！');
        return;
    }
    let csv = '﻿';
    csv += '时间,练习模式,打字速度(WPM),准确率(%),错字数,练习时长(秒)\n';
    history.forEach(r => {
        csv += `"${r.date}","${r.mode}",${r.wpm},${r.accuracy},${r.wrongCount},${r.duration}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wubi_practice_history_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function shortDate(date) {
    const parts = date.split(' ');
    if (parts.length < 2) return date;
    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');
    if (dateParts.length < 3 || timeParts.length < 2) return date;
    const month = dateParts[1].padStart(2, '0');
    const day = dateParts[2].padStart(2, '0');
    const hh = timeParts[0].padStart(2, '0');
    const mm = timeParts[1].padStart(2, '0');
    return `${month}-${day} ${hh}:${mm}`;
}

export function renderHistoryUI() {
    const tbody = $('history-table-body');
    if (tbody) {
        renderTrendChart();
    }

    const hist = getState().history;
    const total = hist.length;
    let avgWpm = 0;
    let avgAcc = 0;
    if (total > 0) {
        avgWpm = Math.round(hist.reduce((sum, x) => sum + x.wpm, 0) / total);
        avgAcc = Math.round(hist.reduce((sum, x) => sum + x.accuracy, 0) / total);
    }

    const totalEl = $('hist-total-rounds');
    if (totalEl) totalEl.textContent = total;
    const wpmEl = $('hist-avg-wpm');
    if (wpmEl) wpmEl.textContent = avgWpm;
    const accEl = $('hist-avg-acc');
    if (accEl) accEl.textContent = `${avgAcc}%`;

    if (tbody) {
        tbody.innerHTML = '';
        if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-history-text">暂无历史记录，完成一轮打字练习即可记录！</td></tr>';
        } else {
            hist.slice(0, 50).forEach(record => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>${shortDate(record.date)}</td>
            <td>${record.mode}</td>
            <td><strong>${record.wpm}</strong></td>
            <td>${record.accuracy}%</td>
            <td>${record.wrongCount}</td>
        `;
                tbody.appendChild(tr);
            });
        }
    }
}

function renderTrendChart() {
    const container = $('history-chart-container');
    if (!container) return;

    const history = getState().history;
    const modeGroups = {};
    MODES_LIST.forEach(m => {
        modeGroups[m] = history.filter(item => item.mode === m).slice(0, 5).reverse();
    });
    const activeModes = MODES_LIST.filter(m => modeGroups[m].length >= 1);
    if (activeModes.length === 0) {
        container.innerHTML = '<div class="chart-empty">需在任意模式下完成至少 1 次练习以绘制速度走势图</div>';
        return;
    }

    const width = 360;
    const height = 120;
    const padL = 32;
    const padR = 16;
    const padT = 26;
    const padB = 20;
    const innerH = height - padT - padB;
    const innerW = width - padL - padR;
    const maxPoints = 5;

    const allWpms = activeModes.flatMap(m => modeGroups[m].map(h => h.wpm));
    const maxWpm = Math.max(...allWpms, 40);
    const minWpm = Math.min(...allWpms, 0);
    const rangeWpm = maxWpm - minWpm || 10;

    let gridLines = '';
    for (let i = 0; i <= 2; i++) {
        const y = padT + (i * innerH / 2);
        const wpmVal = Math.round(maxWpm - (i * rangeWpm / 2));
        gridLines += `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="var(--border-color-muted)" stroke-width="0.5" stroke-dasharray="2,2"/>`;
        gridLines += `<text x="${padL - 6}" y="${y + 3}" font-size="8" fill="var(--text-muted)" text-anchor="end" font-family="monospace">${wpmVal}</text>`;
    }

    let xLabels = '';
    for (let i = 0; i < maxPoints; i++) {
        const x = padL + (i * innerW / (maxPoints - 1));
        xLabels += `<text x="${x}" y="${height - 4}" font-size="8" fill="var(--text-muted)" text-anchor="middle">第${i + 1}次</text>`;
    }

    let lines = '';
    let markers = '';
    activeModes.forEach(m => {
        const data = modeGroups[m];
        const config = CHART_CONFIG[m];

        const points = data.map((item, idx) => ({
            x: padL + (idx * innerW / (maxPoints - 1)),
            y: height - padB - ((item.wpm - minWpm) * innerH / rangeWpm),
            wpm: item.wpm,
            date: item.date
        }));

        if (points.length >= 2) {
            const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            lines += `<path d="${d}" fill="none" stroke="${config.color}" stroke-width="1.5" stroke-dasharray="${config.strokeDash}" stroke-linecap="round" stroke-linejoin="round"/>`;
        }

        points.forEach((p, idx) => {
            const tooltip = `${m} (第${idx + 1}次): ${p.wpm} WPM | ${p.date.includes(' ') ? p.date.split(' ')[0] : p.date}`;
            const shape = markerShape(config, p);
            markers += `
                <g onmouseenter="showChartTooltip('${tooltip}')" onmouseleave="hideChartTooltip()">
                    ${shape}
                    <circle cx="${p.x}" cy="${p.y}" r="8" fill="transparent" class="chart-hover-zone"/>
                </g>
            `;
        });
    });

    container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
            ${gridLines}
            ${xLabels}
            <text id="chart-tooltip" x="${width / 2}" y="12" font-size="9" font-weight="700" fill="var(--text-primary)" text-anchor="middle" font-family="monospace"></text>
            ${lines}
            ${markers}
        </svg>
    `;

    if (!window.showChartTooltip) {
        window.showChartTooltip = (text) => {
            const el = document.getElementById('chart-tooltip');
            if (el) el.textContent = text;
        };
        window.hideChartTooltip = () => {
            const el = document.getElementById('chart-tooltip');
            if (el) el.textContent = '';
        };
    }
}

function markerShape(config, p) {
    switch (config.marker) {
        case 'square':
            return `<rect x="${p.x - 2.5}" y="${p.y - 2.5}" width="5" height="5" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
        case 'triangle':
            return `<polygon points="${p.x},${p.y - 3.5} ${p.x + 3},${p.y + 2.5} ${p.x - 3},${p.y + 2.5}" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
        case 'diamond':
            return `<polygon points="${p.x},${p.y - 4} ${p.x + 4},${p.y} ${p.x},${p.y + 4} ${p.x - 4},${p.y}" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
        case 'cross':
            return `
                <line x1="${p.x - 2.5}" y1="${p.y - 2.5}" x2="${p.x + 2.5}" y2="${p.y + 2.5}" stroke="${config.color}" stroke-width="1.5"/>
                <line x1="${p.x - 2.5}" y1="${p.y + 2.5}" x2="${p.x + 2.5}" y2="${p.y - 2.5}" stroke="${config.color}" stroke-width="1.5"/>
            `;
        case 'circle':
        default:
            return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
    }
}
