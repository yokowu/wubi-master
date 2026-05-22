import { KEY_ROOTS } from '../constants.js';
import { WUBI_COMPONENTS } from '../wubi_components.js';

const COMPONENT_ALIASES = {
    '纟': ['丝', '纟'],
    '人': ['亻', '人', '八'],
    '水': ['氵', '水', '氺'],
    '言': ['讠', '言'],
    '草': ['艹', '草'],
    '之': ['辶', '之', '廴'],
    '金': ['钅', '金'],
    '饣': ['饣', '食'],
    '心': ['忄', '心', '⺗'],
    '宀': ['宀', '冖'],
    '火': ['灬', '火'],
    '手': ['扌', '手'],
    '竹': ['𥫗', '竹'],
    '礻': ['礻', '示'],
    '衤': ['衤', '衣']
};

export function findMatchingRoot(char, key) {
    const config = KEY_ROOTS[key];
    if (!config) return '';

    const keyRoots = config.roots.split(' ');
    const fallback = keyRoots[0] || '';
    if (!char) return fallback;

    const components = WUBI_COMPONENTS[char] || [];

    for (const r of keyRoots) {
        if (char === r) return r;
        if (components.includes(r)) return r;
    }

    for (const r of keyRoots) {
        const aliases = COMPONENT_ALIASES[r] || [];
        for (const a of aliases) {
            if (components.includes(a)) return r;
        }
    }

    return fallback;
}
