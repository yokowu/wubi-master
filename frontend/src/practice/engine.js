import { $ } from '../dom.js';
import { getState, mutate } from '../state.js';
import { WUBI_DICT, ERJI_LIST, HIGH_FREQ_LIST, HARD_LIST } from '../wubi86_data.js';
import { REAL_YIJI_LIST, ZONE_KEYS } from '../constants.js';
import { highlightNextKey, clearKeyboardGuide } from '../keyboard.js';
import {
    addWrongCharacter,
    removeWrongCharacter,
    trackWrongKey,
    findWeakestZone
} from '../ledger.js';
import {
    renderQueue,
    setActiveIndex,
    getActiveCharElement,
    renderHints,
    renderProgress,
    renderInstructions,
    setHintsVisibility,
    renderPracticeDecomposition
} from './render.js';
import { resetStats, updateStatsUI, updateTimer } from './stats.js';

let onSessionComplete = () => {};

export function setEngineHandlers({ onComplete }) {
    if (onComplete) onSessionComplete = onComplete;
}

function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildReinforceQueue() {
    const weakest = findWeakestZone();
    const zoneKeys = ZONE_KEYS[weakest];
    const candidates = new Map();

    getState().wrongCharsLedger.forEach(char => {
        const info = WUBI_DICT[char];
        if (info && info.s && zoneKeys.includes(info.s[0])) {
            candidates.set(char, { char, code: info.s, full: info.w, py: info.p });
        }
    });

    [HIGH_FREQ_LIST, ERJI_LIST].forEach(list => {
        list.forEach(item => {
            if (item && item.code && zoneKeys.includes(item.code[0])) {
                candidates.set(item.char, { ...item });
            }
        });
    });

    return shuffle(Array.from(candidates.values())).slice(0, 30);
}

function sourceListFor(mode) {
    switch (mode) {
        case 'yiji': return REAL_YIJI_LIST;
        case 'erji': return ERJI_LIST;
        case 'highfreq': return HIGH_FREQ_LIST;
        case 'hard': return HARD_LIST;
        case 'wrong-review':
            return Array.from(getState().wrongCharsLedger)
                .map(char => {
                    const info = WUBI_DICT[char];
                    return info ? { char, code: info.s, full: info.w, py: info.p } : null;
                })
                .filter(Boolean);
        default: return [];
    }
}

export function loadPracticeMode(mode) {
    mutate(s => {
        s.mode = mode;
        s.currentIndex = 0;
        s.typedText = '';
    });

    const input = $('practice-input');
    if (input) input.value = '';
    const overlay = $('input-overlay');
    if (overlay) overlay.textContent = '';

    resetStats();

    let queue = [];
    if (mode === 'reinforce') {
        queue = buildReinforceQueue();
    } else if (mode === 'wrong-review') {
        queue = shuffle(sourceListFor(mode));
    } else if (mode === 'custom') {
        queue = [];
    } else {
        queue = shuffle(sourceListFor(mode)).slice(0, 50);
    }

    mutate(s => { s.queue = queue; });

    renderQueue();
    renderProgress();
    renderInstructions(mode);

    setHintsVisibility(false);
    resetHintTimer();
}

export function addCharToCustomPractice(char) {
    const info = WUBI_DICT[char];
    if (!info) return;

    const s = getState();
    if (s.queue.some(item => item.char === char)) {
        alert(`"${char}" 已在练习队列中`);
        return;
    }

    const item = { char, code: info.s, full: info.w, py: info.p };

    if (s.mode !== 'custom') {
        loadPracticeMode('custom');
    }
    getState().queue.push(item);

    const input = $('practice-input');
    if (input) input.focus();

    renderQueue();
    renderProgress();
    resetHintTimer();
}

export function handleInput() {
    const input = $('practice-input');
    const overlay = $('input-overlay');
    if (!input) return;

    const s = getState();
    if (!s.startTime) {
        mutate(st => {
            st.startTime = new Date();
            st.timerInterval = setInterval(updateTimer, 1000);
        });
    }

    let raw = input.value.replace(/[^a-zA-Z ]/g, '').toLowerCase();
    input.value = raw;

    if (raw.includes(' ')) {
        const code = raw.replace(' ', '');
        input.value = '';
        verifySubmission(code);
        return;
    }

    mutate(st => { st.typedText = raw; });
    if (overlay) overlay.textContent = raw.toUpperCase();

    clearKeyboardGuide();

    const word = s.queue[s.currentIndex];
    if (word && getState().showHintActive) {
        highlightNextKey(word, raw.length);
    }

    resetHintTimer();
}

function verifySubmission(typedCode) {
    const s = getState();
    const word = s.queue[s.currentIndex];
    if (!word) return;

    const isCorrect = typedCode === word.code || typedCode === word.full;
    mutate(st => { st.totalTyped++; });

    const activeEl = getActiveCharElement();
    const input = $('practice-input');
    const overlay = $('input-overlay');

    if (isCorrect) {
        mutate(st => {
            st.correctTyped++;
            st.currentStreak++;
            st.maxStreak = Math.max(st.maxStreak, st.currentStreak);
        });

        if (activeEl) activeEl.classList.add('correct-animation');
        setTimeout(() => {
            if (activeEl) activeEl.classList.remove('correct-animation');
        }, 200);

        if (s.mode === 'wrong-review') {
            removeWrongCharacter(word.char);
        }

        const prevIndex = s.currentIndex;
        mutate(st => {
            st.hasHesitatedOnCurrent = false;
            st.currentIndex++;
            st.typedText = '';
            st.showHintActive = false;
        });
        if (overlay) overlay.textContent = '';
        setHintsVisibility(false);

        const next = getState();
        if (next.currentIndex >= next.queue.length) {
            clearInterval(next.timerInterval);
            setActiveIndex(prevIndex, -1);
            renderProgress();
            onSessionComplete();
        } else {
            setActiveIndex(prevIndex, next.currentIndex);
            renderProgress();
        }
    } else {
        mutate(st => {
            st.wrongTyped++;
            st.currentStreak = 0;
        });

        if (activeEl) activeEl.classList.add('wrong-animation', 'is-error');
        setTimeout(() => {
            if (activeEl) activeEl.classList.remove('wrong-animation', 'is-error');
        }, 300);

        trackWrongKey(typedCode, word.code);
        addWrongCharacter(word);

        if (s.mode === 'wrong-review') {
            getState().queue.push(word);
            renderQueue();
        }

        mutate(st => {
            st.showHintActive = true;
            st.typedText = '';
        });
        if (overlay) overlay.textContent = '';

        renderHints(word);
        renderPracticeDecomposition(word);
        highlightNextKey(word, 0);
        setHintsVisibility(true);
    }

    updateStatsUI();
    resetHintTimer();
}

export function handleSpecialKeys(e) {
    if (e.key === 'Backspace') {
        mutate(st => { st.backspaceCount++; });
    }
}

export function resetHintTimer() {
    const s = getState();
    if (s.hintTimeout) clearTimeout(s.hintTimeout);
    if (s.showHintActive) return;

    const handle = setTimeout(() => {
        const cur = getState();
        const word = cur.queue[cur.currentIndex];
        if (!word) return;

        mutate(st => {
            st.showHintActive = true;
            if (!st.hasHesitatedOnCurrent) {
                st.hesitationCount++;
                st.hasHesitatedOnCurrent = true;
            }
        });

        renderHints(word);
        renderPracticeDecomposition(word);
        highlightNextKey(word, cur.typedText.length);
        setHintsVisibility(true);
    }, 1500);

    mutate(st => { st.hintTimeout = handle; });
}
