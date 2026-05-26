import { $ } from '../dom.js';
import { getState, mutate } from '../state.js';

export function resetStats() {
    mutate(s => {
        s.startTime = null;
        if (s.timerInterval) clearInterval(s.timerInterval);
        s.timerInterval = null;
        s.totalTyped = 0;
        s.correctTyped = 0;
        s.wrongTyped = 0;
        s.backspaceCount = 0;
        s.totalKeypresses = 0;
        s.currentStreak = 0;
        s.maxStreak = 0;
        s.hesitationCount = 0;
        s.wrongKeysCount = {};
        s.hasHesitatedOnCurrent = false;
    });
    updateStatsUI();
}

export function updateStatsUI() {
    const s = getState();

    const wrongSub = $('stat-wrong-sub');
    if (wrongSub) wrongSub.textContent = `错 ${s.wrongTyped}`;

    const acc = s.totalTyped > 0 ? Math.round((s.correctTyped / s.totalTyped) * 100) : 100;
    const accEl = $('stat-accuracy');
    if (accEl) accEl.textContent = `${acc}%`;

    const streak = $('stat-streak');
    if (streak) streak.textContent = `连对 ${s.currentStreak}`;

    const wpmEl = $('stat-wpm');
    const cpmEl = $('stat-cpm');
    let wpm = 0;
    if (s.startTime && s.correctTyped > 0) {
        const elapsedMin = (new Date() - s.startTime) / 1000 / 60;
        if (elapsedMin > 0.05) wpm = Math.round(s.correctTyped / elapsedMin);
    }
    if (wpmEl) wpmEl.textContent = wpm > 0 ? wpm : (s.startTime && s.correctTyped > 0 ? '...' : '0');
    if (cpmEl) cpmEl.textContent = `字/分 ${wpm}`;

    setRecording(!!s.startTime);
}

function setRecording(on) {
    const badge = $('rec-badge');
    const divider = $('rec-divider');
    [badge, divider].forEach(el => {
        if (!el) return;
        if (on) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
    });
}

export function updateTimer() {
    const s = getState();
    if (!s.startTime) return;
    const elapsed = Math.floor((new Date() - s.startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const sec = (elapsed % 60).toString().padStart(2, '0');
    const t = $('stat-time');
    if (t) t.textContent = `${m}:${sec}`;
    updateStatsUI();
}
