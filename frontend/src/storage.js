const KEYS = {
    wrongChars: 'wubi-wrong-chars',
    accumulatedErrors: 'wubi-accumulated-errors',
    practiceHistory: 'wubi-practice-history',
    showKeyboard: 'wubi-show-keyboard',
    theme: 'wubi-theme'
};

function read(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function write(key, value) {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, raw);
}

function remove(key) {
    localStorage.removeItem(key);
}

export const storage = {
    loadWrongChars: () => new Set(read(KEYS.wrongChars, [])),
    saveWrongChars: (set) => write(KEYS.wrongChars, Array.from(set)),

    loadAccumulatedErrors: () => {
        const data = read(KEYS.accumulatedErrors);
        return data && data.zones ? data.zones : null;
    },
    saveAccumulatedErrors: (zones) => write(KEYS.accumulatedErrors, { zones }),

    loadHistory: () => read(KEYS.practiceHistory, []),
    saveHistory: (history) => write(KEYS.practiceHistory, history),
    clearHistory: () => remove(KEYS.practiceHistory),

    loadShowKeyboard: () => {
        const v = localStorage.getItem(KEYS.showKeyboard);
        return v === null ? null : v === 'true';
    },
    saveShowKeyboard: (show) => write(KEYS.showKeyboard, show ? 'true' : 'false'),

    loadTheme: () => localStorage.getItem(KEYS.theme) || 'light',
    saveTheme: (theme) => write(KEYS.theme, theme)
};
