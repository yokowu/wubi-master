import { $ } from './dom.js';
import { getState } from './state.js';

let onOpen = () => {};

export function setupLedgerBadge(opts = {}) {
    if (opts.onOpen) onOpen = opts.onOpen;
    refreshLedgerBadge();
}

export function refreshLedgerBadge() {
    const badge = $('fab-ledger-badge');
    if (!badge) return;
    const size = getState().wrongCharsLedger?.size || 0;
    if (size === 0) {
        badge.hidden = true;
        badge.textContent = '0';
    } else {
        badge.hidden = false;
        badge.textContent = String(size);
    }
}

export function openLedger() {
    onOpen('ledger');
}
