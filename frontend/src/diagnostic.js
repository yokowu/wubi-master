import { $ } from './dom.js';
import { getState } from './state.js';
import { ZONE_NAMES_SHORT, ZONE_NAMES_LONG } from './constants.js';

const HIDE_DURING_REPORT = [
    'practice-text-flow',
    'active-char-detail',
    'roots-guide'
];

function setPracticeUIVisibility(show) {
    HIDE_DURING_REPORT.forEach(id => {
        const el = $(id);
        if (el) el.style.display = show ? 'flex' : 'none';
    });
    const inputContainer = document.querySelector('.input-container');
    const instr = document.querySelector('.practice-instructions');
    if (inputContainer) inputContainer.style.display = show ? 'block' : 'none';
    if (instr) instr.style.display = show ? 'block' : 'none';
}

function buildFeedback(acc, wpm, backspacePct, hesitationPct, sortedKeys) {
    let text;
    if (acc >= 95 && wpm >= 40 && backspacePct < 8 && hesitationPct < 10) {
        text = '✨ <b>手脑合一的指尖华尔兹！</b> 你的手指在键盘上跳起了流畅的舞步，速度与精度都堪称艺术！这一刻，字根已经完美融入了你的肌肉直觉，继续保持这种无我的心流状态，你就是天生的五笔舞者！';
    } else if (backspacePct >= 15) {
        text = '🚀 <b>风速已至，指尖还差一丝沉稳！</b> 你的退格率偏高（超过了 15%），说明指尖冲刺得比脑海中的字根映射还要快，频繁修改就像开跑车一直在急刹车。不妨试着把速度稍放慢 10%，寻找"一击必中"的笃定感。记住：慢即是快，稳扎稳打才是王道！';
    } else if (hesitationPct >= 20) {
        text = '🌱 <b>正在生长的神经网络！</b> 本轮你停下来思索字根的时间稍长。别沮丧，这说明大脑正在拼命建立新的神经通路！每一个停顿的瞬间，都是肌肉记忆在进行深度刻写。建议多用"错字复习"模式，给手指和脑海一点温柔的时间，很快你就能超越思考！';
    } else if (acc < 85) {
        text = '🎯 <b>每一击都值得被温柔对待！</b> 现在的准确率稍微有些跑偏了。在五笔的世界里，打错一个字意味着"敲错-退格-重新敲"这 3 倍的时间损耗。请试着放慢节奏，去倾听手指敲下正确字符时的清脆声，先找到百分百命中的成就感，速度自然会如期而至！';
    } else {
        text = '💪 <b>稳扎稳打，每一次练习都在闪闪发光！</b> 你的节奏感非常好，表现出沉稳而自信的状态。如果想再进一步，可以尝试在练习时"用余光提前看下一个字"，给手指下达预备指令。向着真正的肌肉直觉，稳步迈进吧！';
    }

    if (sortedKeys.length > 0) {
        const topKey = sortedKeys[0][0];
        const zone = ZONE_NAMES_LONG[topKey] || '某个字根区';
        text += ` <br/><br/>💡 <b>悄悄告诉你一个突破点</b>：本轮我们发现你的手指和 <b>${topKey.toUpperCase()}</b> 键（对应<b>${zone}</b>）玩起了捉迷藏，成了错按的常客。练习时可以给这片区域一点点偏爱和关照，相信很快它就会被你的指尖彻底驯服！`;
    }
    return text;
}

export function showDiagnosticReport(onRecorded) {
    if (typeof onRecorded === 'function') onRecorded();

    setPracticeUIVisibility(false);

    const s = getState();
    const elapsedMin = s.startTime ? (new Date() - s.startTime) / 1000 / 60 : 0.1;
    const wpm = elapsedMin > 0 ? Math.round(s.correctTyped / elapsedMin) : 0;
    const acc = s.totalTyped > 0 ? Math.round((s.correctTyped / s.totalTyped) * 100) : 100;
    const backspacePct = s.totalKeypresses > 0 ? Math.round((s.backspaceCount / s.totalKeypresses) * 100) : 0;
    const totalWords = s.queue.length || 1;
    const hesitationPct = Math.round((s.hesitationCount / totalWords) * 100);

    const wpmEl = $('report-wpm');
    if (wpmEl) wpmEl.textContent = wpm;
    const accEl = $('report-accuracy');
    if (accEl) accEl.textContent = `${acc}%`;
    const streakEl = $('report-streak');
    if (streakEl) streakEl.textContent = s.maxStreak;
    const bsEl = $('report-backspace');
    if (bsEl) bsEl.textContent = `${s.backspaceCount} (${backspacePct}%)`;
    const hesEl = $('report-hesitation');
    if (hesEl) hesEl.textContent = `${s.hesitationCount} (${hesitationPct}%)`;

    const sorted = Object.entries(s.wrongKeysCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const badges = $('report-error-badges');
    if (badges) {
        badges.innerHTML = '';
        if (sorted.length === 0) {
            badges.innerHTML = '<span class="empty-text empty-text-success">本次练习无打错的按键，手指极度精准！</span>';
        } else {
            sorted.forEach(([key, count]) => {
                const zone = ZONE_NAMES_SHORT[key] || '其它';
                const badge = document.createElement('span');
                badge.className = 'error-badge';
                badge.textContent = `${key.toUpperCase()} (${zone}, ${count}次)`;
                badges.appendChild(badge);
            });
        }
    }

    const feedback = $('report-feedback');
    if (feedback) feedback.innerHTML = buildFeedback(acc, wpm, backspacePct, hesitationPct, sorted);

    const report = $('diagnostic-report');
    if (report) report.style.display = 'flex';
}

export function hideDiagnosticReport() {
    const report = $('diagnostic-report');
    if (report) report.style.display = 'none';
    setPracticeUIVisibility(true);
    const input = $('practice-input');
    if (input) input.disabled = false;
}
