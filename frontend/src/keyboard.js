import { $, $$ } from './dom.js';
import { KEY_ROOTS, KEYBOARD_LAYOUT } from './constants.js';

let mnemonicCard = null;

function showTooltip(e, key) {
    const config = KEY_ROOTS[key];
    if (!config || !mnemonicCard) return;

    const rect = e.currentTarget.getBoundingClientRect();
    mnemonicCard.querySelector('.mnemonic-key').textContent = config.name;
    mnemonicCard.querySelector('.mnemonic-formula').textContent = config.formula;
    mnemonicCard.querySelector('.mnemonic-roots').textContent = `字根：${config.roots}`;
    mnemonicCard.querySelector('.mnemonic-desc').textContent = config.desc;

    mnemonicCard.style.display = 'block';
    mnemonicCard.style.left = `${rect.left + rect.width / 2}px`;
    mnemonicCard.style.top = `${rect.top - 12}px`;
    mnemonicCard.style.transform = 'translate(-50%, -100%)';
}

function hideTooltip() {
    if (mnemonicCard) mnemonicCard.style.display = 'none';
}

export function renderKeyboard() {
    const wrapper = $('keyboard-wrapper');
    mnemonicCard = $('mnemonic-card');
    wrapper.innerHTML = '';

    KEYBOARD_LAYOUT.forEach(rowKeys => {
        const rowEl = document.createElement('div');
        rowEl.className = 'keyboard-row';

        rowKeys.forEach(key => {
            const btn = document.createElement('div');
            btn.className = 'kbd-btn';

            if (key === 'space') {
                btn.classList.add('kbd-btn-space');
                btn.dataset.key = ' ';
                btn.dataset.zone = '0';
                const letter = document.createElement('span');
                letter.className = 'key-letter';
                letter.textContent = 'Space / 空格';
                btn.appendChild(letter);
            } else {
                const config = KEY_ROOTS[key];
                btn.dataset.key = key;
                btn.dataset.zone = String(config.zone);

                const letter = document.createElement('span');
                letter.className = 'key-letter';
                letter.textContent = config.name;
                btn.appendChild(letter);

                const roots = document.createElement('span');
                roots.className = 'key-roots';
                roots.textContent = config.roots.split(' ').slice(0, 3).join(' ');
                btn.appendChild(roots);

                const badge = document.createElement('span');
                badge.className = 'key-zone-badge';
                btn.appendChild(badge);

                btn.addEventListener('mouseenter', (e) => showTooltip(e, key));
                btn.addEventListener('mouseleave', hideTooltip);
            }

            rowEl.appendChild(btn);
        });

        wrapper.appendChild(rowEl);
    });
}

export function highlightKey(key, isPressed) {
    const btn = document.querySelector(`.kbd-btn[data-key="${key.toLowerCase()}"]`);
    if (!btn) return;
    btn.classList.toggle('pressed', isPressed);
}

export function clearKeyboardGuide() {
    $$('.kbd-btn').forEach(btn => btn.classList.remove('guide-pulse'));
}

export function highlightNextKey(wordObj, typedLen) {
    clearKeyboardGuide();
    const code = wordObj.code;
    if (typedLen < code.length) {
        const next = code[typedLen];
        const btn = document.querySelector(`.kbd-btn[data-key="${next}"]`);
        if (btn) btn.classList.add('guide-pulse');
    } else {
        const space = document.querySelector('.kbd-btn-space');
        if (space) space.classList.add('guide-pulse');
    }
}

export function flashCodeSequence(code) {
    clearKeyboardGuide();
    let idx = 0;
    const tick = () => {
        if (idx >= code.length) return;
        const k = code[idx];
        const btn = document.querySelector(`.kbd-btn[data-key="${k}"]`);
        if (!btn) return;
        btn.classList.add('guide-pulse');
        setTimeout(() => {
            btn.classList.remove('guide-pulse');
            idx++;
            tick();
        }, 400);
    };
    tick();
}
