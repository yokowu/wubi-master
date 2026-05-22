import { $ } from './dom.js';

const TABS = ['ledger', 'weakness', 'query', 'history'];
let activeTab = 'ledger';
let onTabChange = () => {};

export function setupDrawer(opts = {}) {
    if (opts.onTabChange) onTabChange = opts.onTabChange;

    document.querySelectorAll('.drawer-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) selectTab(tab);
        });
    });

    const closeBtn = $('drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    const fabLedger = $('fab-ledger');
    const fabTools = $('fab-tools');
    if (fabLedger) fabLedger.addEventListener('click', () => toggleDrawer('ledger'));
    if (fabTools) fabTools.addEventListener('click', () => toggleDrawer('query'));

    selectTab(activeTab, { silent: true });
}

export function openDrawer(tab) {
    if (tab) selectTab(tab);
    const drawer = $('drawer');
    if (drawer) drawer.hidden = false;
    syncFabState();
}

export function closeDrawer() {
    const drawer = $('drawer');
    if (drawer) drawer.hidden = true;
    syncFabState();
}

function toggleDrawer(tab) {
    const drawer = $('drawer');
    if (!drawer) return;
    if (drawer.hidden) {
        openDrawer(tab);
    } else if (activeTab === tab) {
        closeDrawer();
    } else {
        selectTab(tab);
    }
}

function selectTab(tab, { silent = false } = {}) {
    if (!TABS.includes(tab)) return;
    activeTab = tab;

    document.querySelectorAll('.drawer-tab').forEach(btn => {
        btn.classList.toggle('tab-active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.drawer-pane').forEach(pane => {
        pane.hidden = pane.dataset.pane !== tab;
    });
    syncFabState();
    if (!silent) onTabChange(tab);
}

function syncFabState() {
    const drawer = $('drawer');
    const open = drawer && !drawer.hidden;
    const fabLedger = $('fab-ledger');
    const fabTools = $('fab-tools');

    if (fabLedger) fabLedger.classList.toggle('fab-active', open && (activeTab === 'ledger' || activeTab === 'weakness'));
    if (fabTools) fabTools.classList.toggle('fab-active', open && (activeTab === 'query' || activeTab === 'history'));
}
