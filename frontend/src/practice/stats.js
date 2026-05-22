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
    const wrong = $('stat-wrong');
    if (wrong) wrong.textContent = s.wrongTyped;

    const acc = s.totalTyped > 0 ? Math.round((s.correctTyped / s.totalTyped) * 100) : 100;
    const accEl = $('stat-accuracy');
    if (accEl) accEl.textContent = `${acc}%`;

    const wpmEl = $('stat-wpm');
    if (!wpmEl) return;

    if (s.startTime && s.correctTyped > 0) {
        const elapsedMin = (new Date() - s.startTime) / 1000 / 60;
        if (elapsedMin > 0.05) {
            wpmEl.textContent = Math.round(s.correctTyped / elapsedMin);
        } else {
            wpmEl.textContent = '...';
        }
    } else {
        wpmEl.textContent = '0';
    }
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
