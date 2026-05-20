import './style.css';
import { WUBI_DICT, YIJI_LIST, ERJI_LIST, HIGH_FREQ_LIST, HARD_LIST } from './wubi86_data.js';

// Define the real 25 first-level shortcodes (一级简码) for Wubi 86
const REAL_YIJI_CHARS = ['一', '地', '在', '要', '工', '上', '是', '中', '国', '同', '民', '有', '产', '不', '为', '这', '我', '的', '和', '主', '人', '以', '发', '了', '经'];
const REAL_YIJI_LIST = REAL_YIJI_CHARS.map(char => {
    const info = WUBI_DICT[char];
    return {
        char: char,
        code: info ? info.s : '',
        full: info ? info.w : '',
        py: info ? info.p : ''
    };
});

/**
 * Wubi Master - Application Logic (ES Module version for Vite)
 * Integrates visual keyboard, interactive learning state machine, and Rime 86 lookup dictionary.
 */

// Wubi 86 Keyboard Zone and Mnemonic Mapping
const KEY_ROOTS = {
    'q': { zone: 3, name: 'Q', formula: '金勺缺点无尾鱼', roots: '金 钅 勹 饣 乂 儿 鱼 ⺈', desc: '撇区第5键 (35)' },
    'w': { zone: 3, name: 'W', formula: '人八登头双人一', roots: '人 亻 八 𠆢 𡗗 𠂈', desc: '撇区第4键 (34)' },
    'e': { zone: 3, name: 'E', formula: '月用乃力豕家头', roots: '月 用 乃 力 豕 豸 臼 𠂔 𦥑', desc: '撇区第3键 (33)' },
    'r': { zone: 3, name: 'R', formula: '手旁斤字头双人', roots: '手 扌 斤 爪 𠂊 白 气', desc: '撇区第2键 (32)' },
    't': { zone: 3, name: 'T', formula: '竹手双人双免头', roots: '竹 𥫗 手 攵 夂 𠂿 彳 𠂉 𠂤', desc: '撇区第1键 (31)' },
    'y': { zone: 4, name: 'Y', formula: '言前点半广文门', roots: '言 讠 点 丶 广 文 门 户 礻 衤', desc: '捺区第1键 (41)' },
    'u': { zone: 4, name: 'U', formula: '立辛六门病旁', roots: '立 辛 门 疒 冫 丷 𠫓', desc: '捺区第2键 (42)' },
    'i': { zone: 4, name: 'I', formula: '水旁兴头小倒立', roots: '水 氵 兴 小 ⺌ ⺍ 𣏵', desc: '捺区第3键 (43)' },
    'o': { zone: 4, name: 'O', formula: '火业寻头火', roots: '火 灬 业 亦 米 𠂤', desc: '捺区第4键 (44)' },
    'p': { zone: 4, name: 'P', formula: '之字宝盖建之底', roots: '之 宀 这里 辶 廴 𠂊', desc: '捺区第5键 (45)' },
    'a': { zone: 1, name: 'A', formula: '工戈草头右框七', roots: '工 戈 弋 草 艹 廿 七 匚 𠥓', desc: '横区第5键 (15)' },
    's': { zone: 1, name: 'S', formula: '木丁西', roots: '木 𣎴 丁 西 𠀎 覀', desc: '横区第4键 (14)' },
    'd': { zone: 1, name: 'D', formula: '大犬三横古石厂', roots: '大 犬 𡗗 𠂊 三 古 石 厂 丆', desc: '横区第3键 (13)' },
    'f': { zone: 1, name: 'F', formula: '土士二干十寸雨', roots: '土 士 二 干 十 寸 雨 𠂇 耂', desc: '横区第2键 (12)' },
    'g': { zone: 1, name: 'G', formula: '王旁青头戋五一', roots: '王 玊 𤣩 主 五 戋 𢎘 一', desc: '横区第1键 (11)' },
    'h': { zone: 2, name: 'H', formula: '目具上止卜虎皮', roots: '目 具 𥃧 上 止 卜 虍 皮 ⺊', desc: '竖区第1键 (21)' },
    'j': { zone: 2, name: 'J', formula: '日早两竖与虫依', roots: '日 早 虫 曰 刂', desc: '竖区第2键 (22)' },
    'k': { zone: 2, name: 'K', formula: '口与川字根稀', roots: '口 川', desc: '竖区第3键 (23)' },
    'l': { zone: 2, name: 'L', formula: '田甲方框曾头立', roots: '田 甲 国 囗 四 皿 罒 曾 𠍦', desc: '竖区第4键 (24)' },
    'm': { zone: 2, name: 'M', formula: '山由贝下几朵花', roots: '山 由 贝 冂 几 骨', desc: '竖区第5键 (25)' },
    'x': { zone: 5, name: 'X', formula: '幺母', roots: '幺 纟 母 𢎘 𠃓', desc: '折区第5键 (55)' },
    'c': { zone: 5, name: 'C', formula: '又巴马叠叉', roots: '又 巴 马 𠃜 𠃑', desc: '折区第4键 (54)' },
    'v': { zone: 5, name: 'V', formula: '女刀九臼山底', roots: '女 刀 𠂊 九 臼 𦥑 巛 𡿨', desc: '折区第3键 (53)' },
    'b': { zone: 5, name: 'B', formula: '子耳了也框底', roots: '子 孑 𢎘 耳 阝 卩 了 也', desc: '折区第2键 (52)' },
    'n': { zone: 5, name: 'N', formula: '已半巳满不出己', roots: '已 巳 己 尸 𡰣 𡰤 𡰥 羽 𠂆 心 忄 ⺗', desc: '折区第1键 (51)' },
    'z': { zone: 0, name: 'Z', formula: '万能通配键', roots: '通配/查询键', desc: '帮助/自学键' }
};

const KEYBOARD_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ['space']
];

// App State
let state = {
    mode: 'yiji',         // Current practice mode
    queue: [],            // Practice queue of character objects
    currentIndex: 0,      // Index in the queue
    typedText: '',        // What the user is typing
    
    // Stats tracking
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
    wrongKeysCount: {},             // Map to track wrong key counts
    hasHesitatedOnCurrent: false,   // Track if user has already hesitated on current char
    wrongCharsLedger: new Set(),    // Characters wrong in this session
    
    // Hint timer
    hintTimeout: null,
    showHintActive: false,
    
    // Theme
    theme: 'dark',
    history: []
};

// Elements
const elements = {
    themeToggle: null,
    tabs: null,
    wpm: null,
    accuracy: null,
    progress: null,
    time: null,
    wrong: null,
    
    practiceTextFlow: null,
    resetPractice: null,
    charCurrent: null,
    hintPinyin: null,
    hintWubi: null,
    rootsGuide: null,
    
    practiceInput: null,
    inputOverlay: null,
    
    queryInput: null,
    queryBtn: null,
    queryResult: null,
    
    wrongCharsList: null,
    clearWrongBtn: null,
    exportAnkiBtn: null,
    copyAnkiBtn: null,
    wrongActions: null,
    
    keyboardWrapper: null,
    toggleKeycaps: null,
    mnemonicCard: null,
    
    // Diagnostic Report elements
    diagnosticReport: null,
    reportWpm: null,
    reportAccuracy: null,
    reportStreak: null,
    reportBackspace: null,
    reportHesitation: null,
    reportErrorBadges: null,
    reportFeedback: null,
    reportRetryWrongBtn: null,
    reportRestartBtn: null,
    reportCloseBtn: null,
    
    // History Panel Elements
    tabBtnTools: null,
    tabBtnHistory: null,
    contentTools: null,
    contentHistory: null,
    histTotalRounds: null,
    histAvgWpm: null,
    histAvgAcc: null,
    historyTableBody: null,
    exportHistoryBtn: null,
    clearHistoryBtn: null
};

// Initialize DOM bindings and setup application
function init() {
    bindDOMElements();
    renderKeyboard();
    setupEventListeners();
    
    // Load saved wrong characters
    const savedWrong = localStorage.getItem('wubi-wrong-chars');
    state.wrongCharsLedger = new Set(savedWrong ? JSON.parse(savedWrong) : []);
    renderWrongLedgerUI();
    
    // Load practice history
    const savedHistory = localStorage.getItem('wubi-practice-history');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
    } else {
        // Pre-populate with user's initial test data to demonstrate the chart on first load
        state.history = [
            {
                id: 1716209824000,
                date: "2026/5/20 20:57:04",
                mode: "一级简码",
                wpm: 149,
                accuracy: 96,
                wrongCount: 1,
                duration: 10
            },
            {
                id: 1716209336000,
                date: "2026/5/20 20:48:56",
                mode: "二级简码",
                wpm: 51,
                accuracy: 96,
                wrongCount: 2,
                duration: 59
            },
            {
                id: 1716209123000,
                date: "2026/5/20 20:45:23",
                mode: "一级简码",
                wpm: 152,
                accuracy: 100,
                wrongCount: 0,
                duration: 10
            },
            {
                id: 1716209043000,
                date: "2026/5/20 20:44:03",
                mode: "一级简码",
                wpm: 134,
                accuracy: 100,
                wrongCount: 0,
                duration: 11
            }
        ];
        localStorage.setItem('wubi-practice-history', JSON.stringify(state.history));
    }
    renderHistoryUI();
    
    loadPracticeMode('yiji');
    loadTheme();
}

function bindDOMElements() {
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.tabs = document.querySelectorAll('.tab-btn');
    elements.wpm = document.getElementById('stat-wpm');
    elements.accuracy = document.getElementById('stat-accuracy');
    elements.progress = document.getElementById('stat-progress');
    elements.time = document.getElementById('stat-time');
    elements.wrong = document.getElementById('stat-wrong');
    
    elements.practiceTextFlow = document.getElementById('practice-text-flow');
    elements.resetPractice = document.getElementById('reset-practice');
    elements.charCurrent = null;

    elements.hintPinyin = document.getElementById('hint-pinyin');
    elements.hintWubi = document.getElementById('hint-wubi');
    elements.rootsGuide = document.getElementById('roots-guide');
    
    elements.practiceInput = document.getElementById('practice-input');
    elements.inputOverlay = document.getElementById('input-overlay');
    
    elements.queryInput = document.getElementById('query-input');
    elements.queryBtn = document.getElementById('query-btn');
    elements.queryResult = document.getElementById('query-result');
    
    elements.wrongCharsList = document.getElementById('wrong-chars-list');
    elements.clearWrongBtn = document.getElementById('clear-wrong-btn');
    elements.exportAnkiBtn = document.getElementById('export-anki-btn');
    elements.copyAnkiBtn = document.getElementById('copy-anki-btn');
    elements.wrongActions = document.getElementById('wrong-actions');
    
    elements.keyboardWrapper = document.getElementById('keyboard-wrapper');
    elements.toggleKeycaps = document.getElementById('toggle-keycaps');
    elements.mnemonicCard = document.getElementById('mnemonic-card');
    
    // Bind Diagnostic elements
    elements.diagnosticReport = document.getElementById('diagnostic-report');
    elements.reportWpm = document.getElementById('report-wpm');
    elements.reportAccuracy = document.getElementById('report-accuracy');
    elements.reportStreak = document.getElementById('report-streak');
    elements.reportBackspace = document.getElementById('report-backspace');
    elements.reportHesitation = document.getElementById('report-hesitation');
    elements.reportErrorBadges = document.getElementById('report-error-badges');
    elements.reportFeedback = document.getElementById('report-feedback');
    elements.reportRetryWrongBtn = document.getElementById('report-retry-wrong-btn');
    elements.reportRestartBtn = document.getElementById('report-restart-btn');
    elements.reportCloseBtn = document.getElementById('report-close-btn');
    
    // Bind History elements
    elements.tabBtnTools = document.getElementById('tab-btn-tools');
    elements.tabBtnHistory = document.getElementById('tab-btn-history');
    elements.contentTools = document.getElementById('content-tools');
    elements.contentHistory = document.getElementById('content-history');
    elements.histTotalRounds = document.getElementById('hist-total-rounds');
    elements.histAvgWpm = document.getElementById('hist-avg-wpm');
    elements.histAvgAcc = document.getElementById('hist-avg-acc');
    elements.historyTableBody = document.getElementById('history-table-body');
    elements.exportHistoryBtn = document.getElementById('export-history-btn');
    elements.clearHistoryBtn = document.getElementById('clear-history-btn');
}

// --------------------------------------------------------------------------
// Keyboard Rendering & Hover Tooltips
// --------------------------------------------------------------------------
function renderKeyboard() {
    elements.keyboardWrapper.innerHTML = '';
    
    KEYBOARD_LAYOUT.forEach(rowKeys => {
        const rowEl = document.createElement('div');
        rowEl.className = 'keyboard-row';
        
        rowKeys.forEach(key => {
            const btnEl = document.createElement('div');
            btnEl.className = 'kbd-btn';
            
            if (key === 'space') {
                btnEl.classList.add('kbd-btn-space');
                btnEl.setAttribute('data-key', ' ');
                btnEl.setAttribute('data-zone', '0');
                
                const letterEl = document.createElement('span');
                letterEl.className = 'key-letter';
                letterEl.textContent = 'Space / 空格';
                btnEl.appendChild(letterEl);
            } else {
                const config = KEY_ROOTS[key];
                btnEl.setAttribute('data-key', key);
                btnEl.setAttribute('data-zone', config.zone.toString());
                
                // Letter
                const letterEl = document.createElement('span');
                letterEl.className = 'key-letter';
                letterEl.textContent = config.name;
                btnEl.appendChild(letterEl);
                
                // Roots list on key cap
                const rootsEl = document.createElement('span');
                rootsEl.className = 'key-roots';
                rootsEl.textContent = config.roots.split(' ').slice(0, 3).join(' ');
                btnEl.appendChild(rootsEl);
                
                // Zone badge dot
                const badgeEl = document.createElement('span');
                badgeEl.className = 'key-zone-badge';
                btnEl.appendChild(badgeEl);
                
                // Hover event to display tooltip
                btnEl.addEventListener('mouseenter', (e) => showMnemonicTooltip(e, key));
                btnEl.addEventListener('mouseleave', hideMnemonicTooltip);
            }
            
            rowEl.appendChild(btnEl);
        });
        
        elements.keyboardWrapper.appendChild(rowEl);
    });
}

function showMnemonicTooltip(e, key) {
    const config = KEY_ROOTS[key];
    if (!config) return;
    
    const card = elements.mnemonicCard;
    card.querySelector('.mnemonic-key').textContent = `${config.name} 键`;
    card.querySelector('.mnemonic-formula').textContent = config.formula;
    card.querySelector('.mnemonic-roots').textContent = `字根：${config.roots}`;
    card.querySelector('.mnemonic-desc').textContent = config.desc;
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    card.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 120}px`;
    card.style.top = `${rect.top + window.scrollY - 140}px`;
    card.classList.add('show');
}

function hideMnemonicTooltip() {
    elements.mnemonicCard.classList.remove('show');
}

// --------------------------------------------------------------------------
// Practice Modes & Queue Management
// --------------------------------------------------------------------------
function loadPracticeMode(mode) {
    state.mode = mode;
    state.currentIndex = 0;
    state.typedText = '';
    elements.practiceInput.value = '';
    elements.inputOverlay.textContent = '';
    
    resetStats();
    
    let sourceList = [];
    if (mode === 'yiji') {
        sourceList = REAL_YIJI_LIST;
    } else if (mode === 'erji') {
        sourceList = ERJI_LIST;
    } else if (mode === 'highfreq') {
        sourceList = HIGH_FREQ_LIST;
    } else if (mode === 'hard') {
        sourceList = HARD_LIST;
    } else if (mode === 'custom') {
        sourceList = [];
    } else if (mode === 'wrong-review') {
        sourceList = Array.from(state.wrongCharsLedger).map(char => {
            const info = WUBI_DICT[char];
            return {
                char: char,
                code: info ? info.s : '',
                full: info ? info.w : '',
                py: info ? info.p : ''
            };
        }).filter(item => item.code);
    }
    
    if (mode !== 'custom' && mode !== 'wrong-review') {
        state.queue = shuffleArray([...sourceList]).slice(0, 50);
    } else if (mode === 'wrong-review') {
        state.queue = shuffleArray([...sourceList]);
    } else {
        state.queue = [];
    }
    
    updatePracticeUI();
    resetHintTimer();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updatePracticeUI() {
    if (state.queue.length === 0) {
        if (state.mode === 'custom') {
            elements.practiceTextFlow.innerHTML = '<div class="flow-status">🔍</div>';
            elements.hintPinyin.textContent = '暂无内容';
            elements.hintWubi.textContent = '请在右侧查字并添加';
            elements.rootsGuide.innerHTML = '<span class="empty-text">在右侧查询面板输入生字，点击“添加练习”即可在此练习</span>';
        } else if (state.mode === 'wrong-review') {
            elements.practiceTextFlow.innerHTML = '<div class="flow-status">🏆</div>';
            elements.hintPinyin.textContent = '完美复习!';
            elements.hintWubi.textContent = '所有错字已消灭！';
            elements.rootsGuide.innerHTML = '<span class="empty-text">当前错字本中没有需要复习的汉字啦！</span>';
        } else {
            elements.practiceTextFlow.innerHTML = '<div class="flow-status">🎉</div>';
            elements.hintPinyin.textContent = '通关!';
            elements.hintWubi.textContent = '请选择其他模式';
        }
        elements.practiceInput.disabled = true;
        return;
    }
    
    elements.practiceInput.disabled = false;
    
    // Clear and render all flow characters
    elements.practiceTextFlow.innerHTML = '';
    state.queue.forEach((item, index) => {
        const span = document.createElement('span');
        span.className = 'flow-char';
        span.textContent = item.char;
        
        if (index < state.currentIndex) {
            span.classList.add('typed-correct');
        } else if (index === state.currentIndex) {
            span.classList.add('char-active');
            elements.charCurrent = span; // Set dynamically for correct/wrong animations
        } else {
            span.classList.add('char-upcoming');
        }
        elements.practiceTextFlow.appendChild(span);
    });
    
    const currentWord = state.queue[state.currentIndex];
    
    if (state.showHintActive) {
        elements.hintPinyin.style.opacity = '1';
        elements.hintWubi.style.opacity = '1';
        elements.hintPinyin.textContent = currentWord.py || '无音';
        
        const displayCode = currentWord.code !== currentWord.full ? 
            `${currentWord.code.toUpperCase()} [全码: ${currentWord.full.toUpperCase()}]` : 
            currentWord.full.toUpperCase();
        elements.hintWubi.textContent = displayCode;
        
        renderRootsGuide(currentWord);
    } else {
        elements.hintPinyin.style.opacity = '0';
        elements.hintWubi.style.opacity = '0';
        elements.rootsGuide.innerHTML = '';
    }
    
    elements.progress.textContent = `${state.currentIndex}/${state.queue.length}`;
}


function renderRootsGuide(wordObj) {
    elements.rootsGuide.innerHTML = '';
    const code = wordObj.code;
    
    for (let i = 0; i < code.length; i++) {
        const key = code[i];
        const config = KEY_ROOTS[key];
        
        const card = document.createElement('div');
        card.className = 'root-step-card';
        if (i === state.typedText.length) {
            card.classList.add('active');
        }
        
        const keySpan = document.createElement('span');
        keySpan.className = 'root-key';
        keySpan.textContent = key.toUpperCase();
        card.appendChild(keySpan);
        
        if (config) {
            const rootSpan = document.createElement('span');
            rootSpan.className = 'root-symbol';
            rootSpan.textContent = config.roots.split(' ')[0];
            card.appendChild(rootSpan);
        }
        
        elements.rootsGuide.appendChild(card);
    }
}

// --------------------------------------------------------------------------
// Real-time Input & Verification Logic
// --------------------------------------------------------------------------
function handleInput(e) {
    if (!state.startTime) {
        state.startTime = new Date();
        state.timerInterval = setInterval(updateTimer, 1000);
    }
    
    let rawVal = elements.practiceInput.value;
    rawVal = rawVal.replace(/[^a-zA-Z ]/g, '').toLowerCase();
    elements.practiceInput.value = rawVal;
    
    if (rawVal.includes(' ')) {
        const submitCode = rawVal.replace(' ', '');
        elements.practiceInput.value = '';
        verifySubmission(submitCode);
        return;
    }
    
    state.typedText = rawVal;
    elements.inputOverlay.textContent = state.typedText.toUpperCase();
    
    clearKeyboardGuide();
    
    const currentWord = state.queue[state.currentIndex];
    if (currentWord) {
        if (state.showHintActive) {
            renderRootsGuide(currentWord);
            highlightNextKey(currentWord);
        }
    }
    
    resetHintTimer();
}

function verifySubmission(typedCode) {
    const currentWord = state.queue[state.currentIndex];
    if (!currentWord) return;
    
    state.totalTyped++;
    const isCorrect = (typedCode === currentWord.code || typedCode === currentWord.full);
    
    if (isCorrect) {
        state.correctTyped++;
        state.currentStreak++;
        state.maxStreak = Math.max(state.maxStreak, state.currentStreak);
        
        elements.charCurrent.classList.add('correct-animation');
        elements.practiceInput.className = 'input-success';
        
        setTimeout(() => {
            elements.charCurrent.classList.remove('correct-animation');
            elements.practiceInput.className = '';
        }, 200);
        
        if (state.mode === 'wrong-review') {
            state.wrongCharsLedger.delete(currentWord.char);
            saveWrongLedger();
            renderWrongLedgerUI();
        }
        
        state.hasHesitatedOnCurrent = false; // Reset hesitation tracking for next char
        state.currentIndex++;
        state.typedText = '';
        elements.inputOverlay.textContent = '';
        state.showHintActive = false;
        
        if (state.currentIndex >= state.queue.length) {
            clearInterval(state.timerInterval);
            updatePracticeUI();
            showDiagnosticReport();
        } else {
            updatePracticeUI();
        }
    } else {
        state.wrongTyped++;
        state.currentStreak = 0; // Reset streak
        
        elements.charCurrent.classList.add('wrong-animation');
        elements.practiceInput.className = 'input-error';
        
        setTimeout(() => {
            elements.charCurrent.classList.remove('wrong-animation');
            elements.practiceInput.className = '';
        }, 300);
        
        // Track which key was incorrect
        trackWrongKey(typedCode, currentWord.code);
        
        addWrongCharacter(currentWord);
        
        if (state.mode === 'wrong-review') {
            state.queue.push(currentWord);
        }
        
        state.showHintActive = true;
        state.typedText = '';
        elements.inputOverlay.textContent = '';
        updatePracticeUI();
        highlightNextKey(currentWord);
    }
    
    updateStatsUI();
    resetHintTimer();
}

function handleSpecialKeys(e) {
    if (e.key === 'Backspace') {
        state.backspaceCount++;
    }
}

// --------------------------------------------------------------------------
// Keyboard Visual Feedback
// --------------------------------------------------------------------------
function highlightKey(key, isPressed) {
    const selector = `.kbd-btn[data-key="${key.toLowerCase()}"]`;
    const btn = document.querySelector(selector);
    if (btn) {
        if (isPressed) {
            btn.classList.add('pressed');
        } else {
            btn.classList.remove('pressed');
        }
    }
}

function clearKeyboardGuide() {
    document.querySelectorAll('.kbd-btn').forEach(btn => {
        btn.classList.remove('guide-pulse');
    });
}

function highlightNextKey(wordObj) {
    clearKeyboardGuide();
    
    const code = wordObj.code;
    const typedLen = state.typedText.length;
    
    if (typedLen < code.length) {
        const nextLetter = code[typedLen];
        const btn = document.querySelector(`.kbd-btn[data-key="${nextLetter}"]`);
        if (btn) {
            btn.classList.add('guide-pulse');
        }
    } else {
        const spaceBtn = document.querySelector('.kbd-btn-space');
        if (spaceBtn) {
            spaceBtn.classList.add('guide-pulse');
        }
    }
}

// --------------------------------------------------------------------------
// Hint System (Hesitation Detection)
// --------------------------------------------------------------------------
function resetHintTimer() {
    clearTimeout(state.hintTimeout);
    if (state.showHintActive) return;
    
    state.hintTimeout = setTimeout(() => {
        state.showHintActive = true;
        updatePracticeUI();
        
        const currentWord = state.queue[state.currentIndex];
        if (currentWord) {
            highlightNextKey(currentWord);
            
            // Track hesitation
            if (!state.hasHesitatedOnCurrent) {
                state.hesitationCount++;
                state.hasHesitatedOnCurrent = true;
            }
        }
    }, 1500);
}

// --------------------------------------------------------------------------
// Query Tool & Visual Decomposition
// --------------------------------------------------------------------------
function performQuery() {
    const txt = elements.queryInput.value.trim();
    if (!txt) return;
    
    elements.queryResult.innerHTML = '';
    const chars = Array.from(txt);
    
    chars.forEach(char => {
        const info = WUBI_DICT[char];
        const card = document.createElement('div');
        card.className = 'result-card';
        
        if (info) {
            const isYiji = REAL_YIJI_LIST.some(item => item.char === char);
            const isErji = ERJI_LIST.some(item => item.char === char);
            const shortcutInfo = isYiji ? ' (一级简码)' : (isErji ? ' (二级简码)' : '');
            
            let resultHTML = `
                <div class="result-header">
                    <span class="result-char">${char}</span>
                    <div class="result-meta">
                        <span class="pinyin">拼音: <strong>${info.p || '无'}</strong></span>
                        <span class="wubi-code">五笔: <strong>${info.w}</strong>${shortcutInfo}</span>
                        ${info.s !== info.w ? `<span class="pinyin" style="font-size:12px;">简码: <strong style="color:var(--primary)">${info.s}</strong></span>` : ''}
                    </div>
                </div>
                <div class="result-row">
                    <div class="result-row-title">拆字字根路径</div>
                    <div class="result-roots-list">
            `;
            
            const code = info.w;
            for (let i = 0; i < code.length; i++) {
                const k = code[i];
                const keyConfig = KEY_ROOTS[k];
                if (keyConfig) {
                    resultHTML += `
                        <div class="result-root-item">
                            <span class="key">${k.toUpperCase()}</span>
                            <span class="symbol">${keyConfig.roots.split(' ')[0]}</span>
                            <span class="formula">${keyConfig.formula}</span>
                        </div>
                    `;
                }
            }
            
            resultHTML += `
                    </div>
                </div>
                <button class="btn-secondary add-to-practice-btn" data-char="${char}" style="margin-top:6px; font-size:12px; padding:6px 12px;">添加到自由练习</button>
            `;
            
            card.innerHTML = resultHTML;
            triggerVisualKeyboardSequence(info.w);
            
        } else {
            card.innerHTML = `
                <div class="query-empty">
                    <p style="color: var(--error)">未找到汉字 "${char}" 的五笔86编码。</p>
                </div>
            `;
        }
        
        elements.queryResult.appendChild(card);
    });
    
    document.querySelectorAll('.add-to-practice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const charToAdd = e.target.getAttribute('data-char');
            addCharToCustomPractice(charToAdd);
        });
    });
}

function triggerVisualKeyboardSequence(code) {
    clearKeyboardGuide();
    let idx = 0;
    
    function flashNext() {
        if (idx < code.length) {
            const k = code[idx];
            const btn = document.querySelector(`.kbd-btn[data-key="${k}"]`);
            if (btn) {
                btn.classList.add('guide-pulse');
                setTimeout(() => {
                    btn.classList.remove('guide-pulse');
                    idx++;
                    flashNext();
                }, 400);
            }
        }
    }
    
    flashNext();
}

function addCharToCustomPractice(char) {
    const info = WUBI_DICT[char];
    if (!info) return;
    
    if (state.queue.some(item => item.char === char)) {
        alert(`“${char}” 已在练习队列中`);
        return;
    }
    
    const practiceItem = {
        char: char,
        code: info.s,
        full: info.w,
        py: info.p
    };
    
    if (state.mode !== 'custom') {
        loadPracticeMode('custom');
    }
    
    state.queue.push(practiceItem);
    elements.practiceInput.focus();
    updatePracticeUI();
    resetHintTimer();
}

// --------------------------------------------------------------------------
// Statistics & Wrong Ledger
// --------------------------------------------------------------------------
function saveWrongLedger() {
    localStorage.setItem('wubi-wrong-chars', JSON.stringify(Array.from(state.wrongCharsLedger)));
}

function renderWrongLedgerUI() {
    elements.wrongCharsList.innerHTML = '';
    
    if (state.wrongCharsLedger.size === 0) {
        elements.wrongCharsList.innerHTML = '<span class="empty-text">暂无错字，保持下去！</span>';
        if (elements.wrongActions) elements.wrongActions.style.display = 'none';
        return;
    }
    
    if (elements.wrongActions) elements.wrongActions.style.display = 'flex';
    
    state.wrongCharsLedger.forEach(char => {
        const info = WUBI_DICT[char];
        if (!info) return;
        
        const badge = document.createElement('span');
        badge.className = 'wrong-char-badge';
        badge.innerHTML = `${char}<span>${info.s}</span>`;
        badge.title = '点击添加此错字回练习队列';
        
        badge.addEventListener('click', () => {
            addCharToCustomPractice(char);
        });
        
        elements.wrongCharsList.appendChild(badge);
    });
}

function addWrongCharacter(wordObj) {
    if (state.wrongCharsLedger.has(wordObj.char)) return;
    state.wrongCharsLedger.add(wordObj.char);
    saveWrongLedger();
    renderWrongLedgerUI();
}

function clearWrongLedger() {
    state.wrongCharsLedger.clear();
    saveWrongLedger();
    renderWrongLedgerUI();
}

function generateAnkiContent() {
    let tsvRows = [];
    state.wrongCharsLedger.forEach(char => {
        const info = WUBI_DICT[char];
        if (info) {
            const front = char;
            
            // Generate split path
            let rootsPath = [];
            const code = info.w;
            for (let i = 0; i < code.length; i++) {
                const k = code[i];
                const keyConfig = KEY_ROOTS[k];
                if (keyConfig) {
                    const primaryRoot = keyConfig.roots.split(' ')[0];
                    rootsPath.push(`${primaryRoot}(${k.toUpperCase()})`);
                }
            }
            const pathStr = rootsPath.join(' → ');
            
            const isYiji = REAL_YIJI_LIST.some(item => item.char === char);
            const isErji = ERJI_LIST.some(item => item.char === char);
            const shortcutInfo = isYiji ? ' [一级简码]' : (isErji ? ' [二级简码]' : '');
            
            const back = `拼音: ${info.p || '无'} | 五笔简码: ${info.s.toUpperCase()}${shortcutInfo} | 全码: ${info.w.toUpperCase()} | 拆解: ${pathStr}`;
            
            tsvRows.push(`${front}\t${back}`);
        }
    });
    return tsvRows.join('\n');
}

function exportWrongCharsToAnki() {
    if (state.wrongCharsLedger.size === 0) return;
    const content = generateAnkiContent();
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wubi_wrong_chars_anki_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function copyWrongCharsToClipboard() {
    if (state.wrongCharsLedger.size === 0) return;
    const content = generateAnkiContent();
    navigator.clipboard.writeText(content).then(() => {
        alert('已成功将错字卡片数据复制到剪贴板！可以直接在 Anki 的导入/粘贴中使用。');
    }).catch(err => {
        console.error('Failed to copy to clipboard', err);
        alert('复制失败，请尝试导出 TXT 文件。');
    });
}

function trackWrongKey(typed, correct) {
    if (!correct) return;
    for (let i = 0; i < correct.length; i++) {
        if (i >= typed.length || typed[i] !== correct[i]) {
            const targetKey = correct[i];
            state.wrongKeysCount[targetKey] = (state.wrongKeysCount[targetKey] || 0) + 1;
            break;
        }
    }
}

function showDiagnosticReport() {
    // Record current practice session in history
    recordPracticeSession();

    // Hide normal practice UI
    const textFlow = document.getElementById('practice-text-flow');
    const activeDetail = document.getElementById('active-char-detail');
    const rootsGuide = document.getElementById('roots-guide');
    const inputContainer = document.querySelector('.input-container');
    const practiceInstructions = document.querySelector('.practice-instructions');
    
    if (textFlow) textFlow.style.display = 'none';
    if (activeDetail) activeDetail.style.display = 'none';
    if (rootsGuide) rootsGuide.style.display = 'none';
    if (inputContainer) inputContainer.style.display = 'none';
    if (practiceInstructions) practiceInstructions.style.display = 'none';

    
    // Calculate values
    const elapsedMin = state.startTime ? (new Date() - state.startTime) / 1000 / 60 : 0.1;
    const wpmVal = elapsedMin > 0 ? Math.round(state.correctTyped / elapsedMin) : 0;
    const acc = state.totalTyped > 0 ? Math.round((state.correctTyped / state.totalTyped) * 100) : 100;
    
    // Backspace rate
    const backspacePct = state.totalKeypresses > 0 ? Math.round((state.backspaceCount / state.totalKeypresses) * 100) : 0;
    
    // Hesitation rate
    const totalWords = state.queue.length || 1;
    const hesitationPct = Math.round((state.hesitationCount / totalWords) * 100);
    
    // Bind to DOM
    if (elements.reportWpm) elements.reportWpm.textContent = wpmVal;
    if (elements.reportAccuracy) elements.reportAccuracy.textContent = `${acc}%`;
    if (elements.reportStreak) elements.reportStreak.textContent = state.maxStreak;
    if (elements.reportBackspace) elements.reportBackspace.textContent = `${state.backspaceCount} (${backspacePct}%)`;
    if (elements.reportHesitation) elements.reportHesitation.textContent = `${state.hesitationCount} (${hesitationPct}%)`;
    
    // Process error keys Top 3
    const sortedKeys = Object.entries(state.wrongKeysCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
        
    const badgesContainer = elements.reportErrorBadges;
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        
        if (sortedKeys.length === 0) {
            badgesContainer.innerHTML = '<span class="empty-text" style="color: var(--success);">本次练习无打错的按键，手指极度精准！</span>';
        } else {
            const ZONE_NAMES = {
                'g': '横区', 'f': '横区', 'd': '横区', 's': '横区', 'a': '横区',
                'h': '竖区', 'j': '竖区', 'k': '竖区', 'l': '竖区', 'm': '竖区',
                't': '撇区', 'r': '撇区', 'e': '撇区', 'w': '撇区', 'q': '撇区',
                'y': '捺区', 'u': '捺区', 'i': '捺区', 'o': '捺区', 'p': '捺区',
                'n': '折区', 'b': '折区', 'v': '折区', 'c': '折区', 'x': '折区'
            };
            sortedKeys.forEach(([key, count]) => {
                const zone = ZONE_NAMES[key] || '其它';
                const badge = document.createElement('span');
                badge.className = 'error-badge';
                badge.textContent = `${key.toUpperCase()} (${zone}, ${count}次)`;
                badgesContainer.appendChild(badge);
            });
        }
    }
    
    // Generate feedback comment
    let feedback = '';
    if (acc >= 95 && wpmVal >= 40 && backspacePct < 8 && hesitationPct < 10) {
        feedback = '🏎️ <b>堪称完美的手脑协同！</b> 您的速度极快，准确率极高，且极少出现脑力卡顿。继续保持，您已经打出了五笔大师的风采！';
    } else if (backspacePct >= 15) {
        feedback = '🔙 <b>手速有些急躁！</b> 您的退格率较高（超过了 15%），频繁的修改严重拖慢了您的打字上限。建议放慢击键速度，刻意追求“一次敲对”，求稳再求快！';
    } else if (hesitationPct >= 20) {
        feedback = '🧠 <b>脑力卡顿较多！</b> 本轮您有较多字需要停顿思索字根。这说明字根尚未完全建立纯粹的肌肉记忆。建议多练习“难拆字专项”或使用“错字复习”模式，固化字根直觉。';
    } else if (acc < 85) {
        feedback = '🎯 <b>准确率是提速的关键！</b> 您的正确率偏低。五笔是一门肌肉记忆的艺术，打错一次需要退格修改，相当于做了3倍的无用功。建议不要急于追求速度，放慢节奏，确保每次击键的精准度。';
    } else {
        feedback = '📈 <b>表现稳健！</b> 您的打字节奏良好。若要进一步提速，可以尝试在练习时“视线提前看下一个字”，提前做手指准备，同时刻意减少退格的发生。';
    }
    
    // Display weak zone reminder if applicable
    if (sortedKeys.length > 0) {
        const topKey = sortedKeys[0][0];
        const ZONE_NAMES = {
            'g': '横区 (1区)', 'f': '横区 (1区)', 'd': '横区 (1区)', 's': '横区 (1区)', 'a': '横区 (1区)',
            'h': '竖区 (2区)', 'j': '竖区 (2区)', 'k': '竖区 (2区)', 'l': '竖区 (2区)', 'm': '竖区 (2区)',
            't': '撇区 (3区)', 'r': '撇区 (3区)', 'e': '撇区 (3区)', 'w': '撇区 (3区)', 'q': '撇区 (3区)',
            'y': '捺区 (4区)', 'u': '捺区 (4区)', 'i': '捺区 (4区)', 'o': '捺区 (4区)', 'p': '捺区 (4区)',
            'n': '折区 (5区)', 'b': '折区 (5区)', 'v': '折区 (5区)', 'c': '折区 (5区)', 'x': '折区 (5区)'
        };
        const zoneName = ZONE_NAMES[topKey] || '某个字根区';
        feedback += ` 另外，本轮统计显示您的首要易错按键为 <b>${topKey.toUpperCase()}</b>，对应<b>${zoneName}</b>。可以对照字根图，加强这部分按键的手指跨越练习。`;
    }
    
    if (elements.reportFeedback) elements.reportFeedback.innerHTML = feedback;
    
    if (elements.diagnosticReport) elements.diagnosticReport.style.display = 'flex';
}

function hideDiagnosticReport() {
    if (elements.diagnosticReport) elements.diagnosticReport.style.display = 'none';
    
    // Show normal practice UI
    const textFlow = document.getElementById('practice-text-flow');
    const activeDetail = document.getElementById('active-char-detail');
    const rootsGuide = document.getElementById('roots-guide');
    const inputContainer = document.querySelector('.input-container');
    const practiceInstructions = document.querySelector('.practice-instructions');
    
    if (textFlow) textFlow.style.display = 'flex';
    if (activeDetail) activeDetail.style.display = 'flex';
    if (rootsGuide) rootsGuide.style.display = 'flex';
    if (inputContainer) inputContainer.style.display = 'block';
    if (practiceInstructions) practiceInstructions.style.display = 'block';
    
    elements.practiceInput.disabled = false;
}

// --------------------------------------------------------------------------
// Statistics & Wrong Ledger
// --------------------------------------------------------------------------
function resetStats() {
    state.startTime = null;
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.totalTyped = 0;
    state.correctTyped = 0;
    state.wrongTyped = 0;
    state.backspaceCount = 0;
    state.totalKeypresses = 0;
    state.currentStreak = 0;
    state.maxStreak = 0;
    state.hesitationCount = 0;
    state.wrongKeysCount = {};
    state.hasHesitatedOnCurrent = false;
    
    hideDiagnosticReport();
    updateStatsUI();
}

function updateStatsUI() {
    if (elements.wrong) elements.wrong.textContent = state.wrongTyped;
    
    const acc = state.totalTyped > 0 ? Math.round((state.correctTyped / state.totalTyped) * 100) : 100;
    if (elements.accuracy) elements.accuracy.textContent = `${acc}%`;
    
    if (state.startTime && state.correctTyped > 0) {
        const elapsedMin = (new Date() - state.startTime) / 1000 / 60;
        if (elapsedMin > 0.05) {
            const wpmVal = Math.round(state.correctTyped / elapsedMin);
            if (elements.wpm) elements.wpm.textContent = wpmVal;
        } else {
            if (elements.wpm) elements.wpm.textContent = '...';
        }
    } else {
        if (elements.wpm) elements.wpm.textContent = '0';
    }
}

function updateTimer() {
    if (!state.startTime) return;
    const elapsedSecs = Math.floor((new Date() - state.startTime) / 1000);
    const m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
    const s = (elapsedSecs % 60).toString().padStart(2, '0');
    if (elements.time) elements.time.textContent = `${m}:${s}`;
    
    updateStatsUI();
}

// --------------------------------------------------------------------------
// Theme & Settings
// --------------------------------------------------------------------------
function setupEventListeners() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadPracticeMode(tab.getAttribute('data-mode'));
            elements.practiceInput.focus();
        });
    });
    
    elements.practiceInput.addEventListener('input', handleInput);
    elements.practiceInput.addEventListener('keydown', (e) => {
        if (e.key.length === 1 || e.key === 'Space' || e.key === ' ' || e.key === 'Backspace') {
            state.totalKeypresses++;
        }
        handleSpecialKeys(e);
        highlightKey(e.key, true);
    });
    elements.practiceInput.addEventListener('keyup', (e) => {
        highlightKey(e.key, false);
    });
    
    elements.resetPractice.addEventListener('click', () => {
        loadPracticeMode(state.mode);
        elements.practiceInput.focus();
    });
    
    document.querySelector('.practice-zone').addEventListener('click', () => {
        elements.practiceInput.focus();
    });
    
    elements.queryBtn.addEventListener('click', performQuery);
    elements.queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performQuery();
    });
    
    elements.clearWrongBtn.addEventListener('click', clearWrongLedger);
    elements.exportAnkiBtn.addEventListener('click', exportWrongCharsToAnki);
    elements.copyAnkiBtn.addEventListener('click', copyWrongCharsToClipboard);
    
    // Diagnostic Report Event Listeners
    if (elements.reportRetryWrongBtn) {
        elements.reportRetryWrongBtn.addEventListener('click', () => {
            const wrongChars = Array.from(state.wrongCharsLedger);
            if (wrongChars.length === 0) {
                alert('本轮没有错字，太棒了！');
                return;
            }
            hideDiagnosticReport();
            
            // Set tab to active manually
            elements.tabs.forEach(t => t.classList.remove('active'));
            const tabWrong = document.getElementById('tab-wrong-review');
            if (tabWrong) tabWrong.classList.add('active');
            
            loadPracticeMode('wrong-review');
        });
    }
    
    if (elements.reportRestartBtn) {
        elements.reportRestartBtn.addEventListener('click', () => {
            hideDiagnosticReport();
            loadPracticeMode(state.mode);
        });
    }
    
    if (elements.reportCloseBtn) {
        elements.reportCloseBtn.addEventListener('click', () => {
            hideDiagnosticReport();
        });
    }
    
    elements.toggleKeycaps.addEventListener('change', (e) => {
        const show = e.target.checked;
        document.querySelectorAll('.key-roots').forEach(el => {
            el.style.opacity = show ? '1' : '0';
        });
    });
    
    elements.themeToggle.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = curTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('wubi-theme', nextTheme);
    });

    // Utility tab switcher logic
    if (elements.tabBtnTools && elements.tabBtnHistory) {
        elements.tabBtnTools.addEventListener('click', () => {
            elements.tabBtnTools.classList.add('active');
            elements.tabBtnHistory.classList.remove('active');
            elements.contentTools.style.display = 'flex';
            elements.contentHistory.style.display = 'none';
        });
        
        elements.tabBtnHistory.addEventListener('click', () => {
            elements.tabBtnHistory.classList.add('active');
            elements.tabBtnTools.classList.remove('active');
            elements.contentTools.style.display = 'none';
            elements.contentHistory.style.display = 'flex';
            renderHistoryUI();
        });
    }

    // History action buttons
    if (elements.exportHistoryBtn) {
        elements.exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
    }
    if (elements.clearHistoryBtn) {
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
    }
}

// --------------------------------------------------------------------------
// Practice History Ledger & CSV Export
// --------------------------------------------------------------------------
function recordPracticeSession() {
    if (state.queue.length === 0 || !state.startTime) return;
    
    const elapsedMin = (new Date() - state.startTime) / 1000 / 60;
    const wpmVal = elapsedMin > 0 ? Math.round(state.correctTyped / elapsedMin) : 0;
    const acc = state.totalTyped > 0 ? Math.round((state.correctTyped / state.totalTyped) * 100) : 100;
    const elapsedSec = Math.round((new Date() - state.startTime) / 1000);
    
    const MODE_LABELS = {
        'yiji': '一级简码',
        'erji': '二级简码',
        'highfreq': '常用高频',
        'hard': '难字专项',
        'custom': '自由练习',
        'wrong-review': '错字复习'
    };
    
    const record = {
        id: Date.now(),
        date: new Date().toLocaleString('zh-CN', { hour12: false }),
        mode: MODE_LABELS[state.mode] || state.mode,
        wpm: wpmVal,
        accuracy: acc,
        wrongCount: state.wrongTyped,
        duration: elapsedSec
    };
    
    state.history.unshift(record);
    
    // Cap at 500 records
    if (state.history.length > 500) {
        state.history = state.history.slice(0, 500);
    }
    
    localStorage.setItem('wubi-practice-history', JSON.stringify(state.history));
    renderHistoryUI();
}

function renderHistoryUI() {
    if (!elements.historyTableBody) return;
    
    // Draw the SVG trend line chart
    renderTrendChart();
    
    const hist = state.history;
    const total = hist.length;
    let avgWpm = 0;
    let avgAcc = 0;
    
    if (total > 0) {
        const sumWpm = hist.reduce((sum, item) => sum + item.wpm, 0);
        const sumAcc = hist.reduce((sum, item) => sum + item.accuracy, 0);
        avgWpm = Math.round(sumWpm / total);
        avgAcc = Math.round(sumAcc / total);
    }
    
    if (elements.histTotalRounds) elements.histTotalRounds.textContent = total;
    if (elements.histAvgWpm) elements.histAvgWpm.textContent = avgWpm;
    if (elements.histAvgAcc) elements.histAvgAcc.textContent = `${avgAcc}%`;
    
    elements.historyTableBody.innerHTML = '';
    
    if (total === 0) {
        elements.historyTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-history-text">暂无历史记录，完成一轮打字练习即可记录！</td>
            </tr>
        `;
        return;
    }
    
    const displayRecords = hist.slice(0, 50);
    displayRecords.forEach(record => {
        const tr = document.createElement('tr');
        
        let displayDate = record.date;
        try {
            const parts = record.date.split(' ');
            if (parts.length >= 2) {
                const dateParts = parts[0].split('/');
                const timeParts = parts[1].split(':');
                if (dateParts.length >= 3 && timeParts.length >= 2) {
                    const month = dateParts[1].padStart(2, '0');
                    const day = dateParts[2].padStart(2, '0');
                    const hh = timeParts[0].padStart(2, '0');
                    const mm = timeParts[1].padStart(2, '0');
                    displayDate = `${month}-${day} ${hh}:${mm}`;
                }
            }
        } catch (e) {
            // fallback
        }
        
        tr.innerHTML = `
            <td>${displayDate}</td>
            <td>${record.mode}</td>
            <td><strong>${record.wpm}</strong></td>
            <td>${record.accuracy}%</td>
            <td>${record.wrongCount}</td>
        `;
        elements.historyTableBody.appendChild(tr);
    });
}

function clearHistory() {
    if (confirm('确定要清空所有的训练历史记录吗？此操作无法撤销。')) {
        state.history = [];
        localStorage.removeItem('wubi-practice-history');
        renderHistoryUI();
    }
}

function exportHistoryToCSV() {
    if (state.history.length === 0) {
        alert('暂无历史记录可导出！');
        return;
    }
    
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += '时间,练习模式,打字速度(WPM),准确率(%),错字数,练习时长(秒)\n';
    
    state.history.forEach(r => {
        csvContent += `"${r.date}","${r.mode}",${r.wpm},${r.accuracy},${r.wrongCount},${r.duration}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wubi_practice_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderTrendChart() {
    const chartContainer = document.getElementById('history-chart-container');
    if (!chartContainer) return;
    
    // Group history records by mode
    const modeGroups = {};
    const modesList = ['一级简码', '二级简码', '常用高频', '难字专项', '错字复习', '自由练习'];
    
    modesList.forEach(m => {
        modeGroups[m] = state.history.filter(item => item.mode === m).slice(0, 5).reverse();
    });
    
    // Determine which modes have enough data (at least 1 attempt) to render
    const activeModes = modesList.filter(m => modeGroups[m].length >= 1);
    if (activeModes.length === 0) {
        chartContainer.innerHTML = '<div class="chart-empty">需在任意模式下完成至少 1 次练习以绘制速度走势图</div>';
        return;
    }
    
    const width = 360;
    const height = 120;
    const paddingLeft = 32;
    const paddingRight = 16;
    const paddingTop = 26;
    const paddingBottom = 20;
    
    // Find absolute WPM range across all active modes
    let allWpms = [];
    activeModes.forEach(m => {
        allWpms.push(...modeGroups[m].map(h => h.wpm));
    });
    const maxWpm = Math.max(...allWpms, 40);
    const minWpm = Math.min(...allWpms, 0);
    const rangeWpm = maxWpm - minWpm || 10;
    
    // Draw Y-axis grid lines and labels
    let gridLines = '';
    const gridCount = 2;
    for (let i = 0; i <= gridCount; i++) {
        const y = paddingTop + (i * (height - paddingTop - paddingBottom) / gridCount);
        const wpmVal = Math.round(maxWpm - (i * rangeWpm / gridCount));
        gridLines += `
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-color-muted)" stroke-width="0.5" stroke-dasharray="2,2"/>
            <text x="${paddingLeft - 6}" y="${y + 3}" font-size="8" fill="var(--text-muted)" text-anchor="end" font-family="monospace">${wpmVal}</text>
        `;
    }
    
    // Draw X-axis labels (Session 1 to 5)
    let xLabels = '';
    const maxPoints = 5;
    for (let i = 0; i < maxPoints; i++) {
        const x = paddingLeft + (i * (width - paddingLeft - paddingRight) / (maxPoints - 1));
        xLabels += `<text x="${x}" y="${height - 4}" font-size="8" fill="var(--text-muted)" text-anchor="middle">第${i+1}次</text>`;
    }
    
    // Visual styling map for modes
    const CHART_CONFIG = {
        '一级简码': { color: 'var(--text-primary)', strokeDash: 'none', marker: 'circle' },
        '二级简码': { color: '#555555', strokeDash: '4,3', marker: 'square' },
        '常用高频': { color: '#777777', strokeDash: 'none', marker: 'triangle' },
        '难字专项': { color: '#999999', strokeDash: '1,3', marker: 'diamond' },
        '错字复习': { color: '#b33939', strokeDash: 'none', marker: 'cross' },
        '自由练习': { color: '#cccccc', strokeDash: '4,3', marker: 'circle' }
    };
    
    let linesSvg = '';
    let markersSvg = '';
    
    activeModes.forEach(m => {
        const data = modeGroups[m];
        const config = CHART_CONFIG[m] || { color: '#888', strokeDash: 'none', marker: 'circle' };
        
        // Map WPM data to SVG coordinate points
        const points = data.map((item, index) => {
            const x = paddingLeft + (index * (width - paddingLeft - paddingRight) / (maxPoints - 1));
            const y = height - paddingBottom - ((item.wpm - minWpm) * (height - paddingTop - paddingBottom) / rangeWpm);
            return { x, y, wpm: item.wpm, date: item.date };
        });
        
        // Construct SVG line path (only if at least 2 points exist)
        if (points.length >= 2) {
            let pathD = '';
            points.forEach((p, idx) => {
                if (idx === 0) pathD += `M ${p.x} ${p.y}`;
                else pathD += ` L ${p.x} ${p.y}`;
            });
            
            linesSvg += `
                <path d="${pathD}" fill="none" stroke="${config.color}" stroke-width="1.5" stroke-dasharray="${config.strokeDash}" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        }
        
        // Construct markers and overlay transparent hover zones
        points.forEach((p, idx) => {
            let markerShape = '';
            const shortDate = p.date.includes(' ') ? p.date.split(' ')[0] : p.date;
            const tooltipMsg = `${m} (第${idx+1}次): ${p.wpm} WPM | ${shortDate}`;
            
            if (config.marker === 'circle') {
                markerShape = `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
            } else if (config.marker === 'square') {
                markerShape = `<rect x="${p.x - 2.5}" y="${p.y - 2.5}" width="5" height="5" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
            } else if (config.marker === 'triangle') {
                markerShape = `<polygon points="${p.x},${p.y - 3.5} ${p.x + 3},${p.y + 2.5} ${p.x - 3},${p.y + 2.5}" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
            } else if (config.marker === 'diamond') {
                markerShape = `<polygon points="${p.x},${p.y - 4} ${p.x + 4},${p.y} ${p.x},${p.y + 4} ${p.x - 4},${p.y}" fill="var(--bg-panel)" stroke="${config.color}" stroke-width="1.5"/>`;
            } else {
                // Cross / Plus style
                markerShape = `
                    <line x1="${p.x - 2.5}" y1="${p.y - 2.5}" x2="${p.x + 2.5}" y2="${p.y + 2.5}" stroke="${config.color}" stroke-width="1.5"/>
                    <line x1="${p.x - 2.5}" y1="${p.y + 2.5}" x2="${p.x + 2.5}" y2="${p.y - 2.5}" stroke="${config.color}" stroke-width="1.5"/>
                `;
            }
            
            markersSvg += `
                <g onmouseenter="showChartTooltip('${tooltipMsg}')" onmouseleave="hideChartTooltip()">
                    ${markerShape}
                    <circle cx="${p.x}" cy="${p.y}" r="8" fill="transparent" style="cursor: pointer;"/>
                </g>
            `;
        });
    });
    
    const svgContent = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <!-- Grid Lines -->
            ${gridLines}
            
            <!-- X Axis Labels -->
            ${xLabels}
            
            <!-- Tooltip Text Node -->
            <text id="chart-tooltip" x="${width / 2}" y="12" font-size="9" font-weight="700" fill="var(--text-primary)" text-anchor="middle" font-family="monospace"></text>
            
            <!-- Lines -->
            ${linesSvg}
            
            <!-- Markers -->
            ${markersSvg}
        </svg>
    `;
    
    chartContainer.innerHTML = svgContent;
    
    // Bind tooltip functions to window object
    if (!window.showChartTooltip) {
        window.showChartTooltip = function(text) {
            const el = document.getElementById('chart-tooltip');
            if (el) el.textContent = text;
        };
        window.hideChartTooltip = function() {
            const el = document.getElementById('chart-tooltip');
            if (el) el.textContent = '';
        };
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('wubi-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Initialize when JS loads and DOM is parsed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
