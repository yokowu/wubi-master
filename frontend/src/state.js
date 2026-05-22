const listeners = new Set();

let state = {
    mode: 'yiji',
    queue: [],
    currentIndex: 0,
    typedText: '',

    startTime: null,
    timerInterval: null,
    totalTyped: 0,
    correctTyped: 0,
    wrongTyped: 0,
    backspaceCount: 0,
    totalKeypresses: 0,
    currentStreak: 0,
    maxStreak: 0,
    hesitationCount: 0,
    wrongKeysCount: {},
    hasHesitatedOnCurrent: false,
    wrongCharsLedger: new Set(),
    accumulatedWrongZones: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },

    hintTimeout: null,
    showHintActive: false,

    theme: 'dark',
    history: []
};

export const getState = () => state;

export function setState(patch) {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
    listeners.forEach(fn => fn(state));
}

export function mutate(fn) {
    fn(state);
    listeners.forEach(l => l(state));
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
