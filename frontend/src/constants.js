import { WUBI_DICT } from './wubi86_data.js';

export const KEY_ROOTS = {
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
    'x': { zone: 5, name: 'X', formula: '幺母', roots: '幺 纟 母 𢎘 𠃓 匕', desc: '折区第5键 (55)' },
    'c': { zone: 5, name: 'C', formula: '又巴马叠叉', roots: '又 巴 马 𠃜 𠃑', desc: '折区第4键 (54)' },
    'v': { zone: 5, name: 'V', formula: '女刀九臼山底', roots: '女 刀 𠂊 九 臼 𦥑 巛 𡿨', desc: '折区第3键 (53)' },
    'b': { zone: 5, name: 'B', formula: '子耳了也框底', roots: '子 孑 𢎘 耳 阝 卩 了 也', desc: '折区第2键 (52)' },
    'n': { zone: 5, name: 'N', formula: '已半巳满不出己', roots: '已 巳 己 尸 𡰣 𡰤 𡰥 羽 𠂆 心 忄 ⺗', desc: '折区第1键 (51)' },
    'z': { zone: 0, name: 'Z', formula: '万能通配键', roots: '通配/查询键', desc: '帮助/自学键' }
};

export const KEYBOARD_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ['space']
];

export const ZONE_KEYS = {
    '1': ['g', 'f', 'd', 's', 'a'],
    '2': ['h', 'j', 'k', 'l', 'm'],
    '3': ['t', 'r', 'e', 'w', 'q'],
    '4': ['y', 'u', 'i', 'o', 'p'],
    '5': ['n', 'b', 'v', 'c', 'x']
};

export const ZONE_LABELS = {
    '1': '横区 (一) 笔画字根',
    '2': '竖区 (丨) 笔画字根',
    '3': '撇区 (丿) 笔画字根',
    '4': '捺区 (丶) 笔画字根',
    '5': '折区 (乙) 笔画字根'
};

export const KEY_TO_ZONE = (() => {
    const map = {};
    for (const [zone, keys] of Object.entries(ZONE_KEYS)) {
        keys.forEach(k => { map[k] = zone; });
    }
    return map;
})();

export const ZONE_NAMES_SHORT = (() => {
    const labels = { '1': '横区', '2': '竖区', '3': '撇区', '4': '捺区', '5': '折区' };
    const map = {};
    for (const [zone, keys] of Object.entries(ZONE_KEYS)) {
        keys.forEach(k => { map[k] = labels[zone]; });
    }
    return map;
})();

export const ZONE_NAMES_LONG = (() => {
    const labels = {
        '1': '横区 (1区)', '2': '竖区 (2区)', '3': '撇区 (3区)',
        '4': '捺区 (4区)', '5': '折区 (5区)'
    };
    const map = {};
    for (const [zone, keys] of Object.entries(ZONE_KEYS)) {
        keys.forEach(k => { map[k] = labels[zone]; });
    }
    return map;
})();

export const MODE_LABELS = {
    'yiji': '一级简码',
    'erji': '二级简码',
    'highfreq': '高频常用',
    'hard': '难拆专项',
    'custom': '自由练习',
    'wrong-review': '错字复习',
    'reinforce': '薄弱强化'
};

export const PRACTICE_PANEL_TITLES = {
    'yiji': '一级简码练习',
    'erji': '二级简码练习',
    'highfreq': '高频常用字练习',
    'hard': '难拆字专项练习',
    'custom': '自由练习模式',
    'wrong-review': '错字复习模式',
    'reinforce': '薄弱区强化特训'
};

export const HISTORY_MODE_LABELS = {
    'yiji': '一级简码',
    'erji': '二级简码',
    'highfreq': '常用高频',
    'hard': '难字专项',
    'custom': '自由练习',
    'wrong-review': '错字复习',
    'reinforce': '薄弱区强化'
};

const REAL_YIJI_CHARS = ['一', '地', '在', '要', '工', '上', '是', '中', '国', '同', '民', '有', '产', '不', '为', '这', '我', '的', '和', '主', '人', '以', '发', '了', '经'];

export const REAL_YIJI_LIST = REAL_YIJI_CHARS.map(char => {
    const info = WUBI_DICT[char];
    return {
        char,
        code: info ? info.s : '',
        full: info ? info.w : '',
        py: info ? info.p : ''
    };
});
