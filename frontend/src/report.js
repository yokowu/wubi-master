import { $ } from './dom.js';
import { getState } from './state.js';
import { HISTORY_MODE_LABELS } from './constants.js';

const MODE_SUB = {
    yiji: '一级简码 / 常用字',
    erji: '二级简码 / 常用字',
    highfreq: '高频常用 / 高频表',
    hard: '难拆专项 / 难拆表',
    custom: '自由练习 / 自定义',
    'wrong-review': '错字复习 / 错字本',
    reinforce: '薄弱强化 / 薄弱区',
};

let handlers = {};

export function setupReportModal({ onRestart, onClose, onSecondary }) {
    handlers = { onRestart, onClose, onSecondary };
    const overlay = $('report-overlay');
    const close = $('report-close');
    const restart = $('report-restart');
    const secondary = $('report-secondary');

    if (overlay) overlay.addEventListener('click', e => {
        if (e.target === overlay) handlers.onClose && handlers.onClose();
    });
    if (close) close.addEventListener('click', () => handlers.onClose && handlers.onClose());
    if (restart) restart.addEventListener('click', () => handlers.onRestart && handlers.onRestart());
    if (secondary) secondary.addEventListener('click', () => {
        if (handlers.onSecondary) handlers.onSecondary();
        else if (handlers.onClose) handlers.onClose();
    });
}

export function showReport() {
    const overlay = $('report-overlay');
    if (!overlay) return;
    populate();
    overlay.removeAttribute('hidden');
}

export function hideReport() {
    const overlay = $('report-overlay');
    if (overlay) overlay.setAttribute('hidden', '');
}

function fmtTime(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function populate() {
    const s = getState();
    const elapsedMs = s.startTime ? (new Date() - s.startTime) : 0;
    const elapsedMin = elapsedMs / 1000 / 60;
    const elapsedSec = Math.round(elapsedMs / 1000);

    const wpm = elapsedMin > 0 ? Math.round(s.correctTyped / elapsedMin) : 0;
    const acc = s.totalTyped > 0 ? Math.round((s.correctTyped / s.totalTyped) * 100 * 10) / 10 : 100;
    const cpm = elapsedMin > 0 ? Math.round(s.totalKeypresses / elapsedMin) : 0;
    const done = s.currentIndex;
    const total = s.queue.length;

    const session = `${MODE_SUB[s.mode] || HISTORY_MODE_LABELS[s.mode] || s.mode} / session #${(s.history && s.history.length || 0) + 1}`;
    const time = `${fmtTime(s.startTime || new Date())} · 用时 ${fmtDuration(elapsedSec)}`;

    setText('report-session', session);
    setText('report-time', time);
    setText('report-wpm', String(wpm));
    setText('report-wpm-foot', `连对 ${s.maxStreak} · 停顿 ${s.hesitationCount}`);
    setText('report-accuracy', String(acc));
    setText('report-accuracy-foot', `错 ${s.wrongTyped} / 总 ${s.totalTyped}`);
    setText('report-cpm', String(cpm));
    setText('report-cpm-foot', `回退 ${s.backspaceCount} 次`);
    setText('report-done', String(done));
    setText('report-done-unit', `/ ${total}`);
    setText('report-done-foot', total > 0 && done >= total ? '全部完成' : `已完成 ${done}/${total}`);
}

function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
}
