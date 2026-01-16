import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取游戏数据目录路径
export function getGamesDBPath() {
    return path.join(__dirname, '../../../fileDB/games');
}

// 游戏数据文件路径
const GAMES_FILE = path.join(getGamesDBPath(), 'games.json');
const STATS_FILE = path.join(getGamesDBPath(), 'gameStats.json');
const SAVES_FILE = path.join(getGamesDBPath(), 'gameSaves.json');

// 初始化游戏数据库
export function initGamesDB() {
    const dbPath = getGamesDBPath();
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }

    // 初始化游戏列表
    if (!fs.existsSync(GAMES_FILE)) {
        const defaultGames = [
            {
                id: 'game2048',
                name: '2048',
                cover: '/uploadFiles/gameFiles/2048/cover.png',
                description: '经典数字合成游戏',
                enabled: true,
                createTime: new Date().toISOString()
            },
            {
                id: 'followDance',
                name: '跟随跳舞',
                cover: '/uploadFiles/gameFiles/followDance/cover.png',
                description: '跟着视频一起跳舞',
                enabled: true,
                createTime: new Date().toISOString()
            },
            {
                id: 'mathBattle',
                name: '数字大战',
                cover: '/uploadFiles/gameFiles/mathBattle/cover.png',
                description: '数学运算闯关游戏',
                enabled: true,
                createTime: new Date().toISOString()
            }
        ];
        fs.writeFileSync(GAMES_FILE, JSON.stringify(defaultGames, null, 2));
    }

    // 初始化统计数据
    if (!fs.existsSync(STATS_FILE)) {
        fs.writeFileSync(STATS_FILE, JSON.stringify({}, null, 2));
    }

    // 初始化存档数据
    if (!fs.existsSync(SAVES_FILE)) {
        fs.writeFileSync(SAVES_FILE, JSON.stringify({}, null, 2));
    }
}

// 读取游戏列表
export function getGamesList() {
    const data = fs.readFileSync(GAMES_FILE, 'utf-8');
    return JSON.parse(data);
}

// 读取所有游戏统计
export function getAllGameStats() {
    const data = fs.readFileSync(STATS_FILE, 'utf-8');
    return JSON.parse(data);
}

// 读取单个游戏统计
export function getGameStats(gameId: string) {
    const allStats = getAllGameStats();
    return allStats[gameId] || null;
}

// 初始化游戏统计数据
function initGameStats(gameId: string) {
    return {
        gameCount: 0,
        totalPlayTime: 0,
        todayPlayTime: 0,
        highestScore: 0,
        todayHighestScore: 0,
        lastPlayDate: '',
        todayDate: ''
    };
}

// 更新游戏统计
export function updateGameStats(gameId: string, score: number, playTime: number) {
    const allStats = getAllGameStats();
    const today = new Date().toISOString().split('T')[0];

    // 如果游戏统计不存在，初始化
    if (!allStats[gameId]) {
        allStats[gameId] = initGameStats(gameId);
    }

    const stats = allStats[gameId];

    // 更新游戏次数
    stats.gameCount++;

    // 更新累计游戏时间
    stats.totalPlayTime += playTime;

    // 检查是否是新的一天，如果是则重置今日数据
    if (stats.todayDate !== today) {
        stats.todayDate = today;
        stats.todayPlayTime = 0;
        stats.todayHighestScore = 0;
    }

    // 更新今日游戏时间
    stats.todayPlayTime += playTime;

    // 更新历史最高分
    if (score > stats.highestScore) {
        stats.highestScore = score;
    }

    // 更新今日最高分
    if (score > stats.todayHighestScore) {
        stats.todayHighestScore = score;
    }

    // 更新最后游戏日期
    stats.lastPlayDate = new Date().toISOString();

    // 保存更新后的统计数据
    fs.writeFileSync(STATS_FILE, JSON.stringify(allStats, null, 2));

    return stats;
}

// 获取游戏存档
export function getGameSave(gameId: string) {
    const data = fs.readFileSync(SAVES_FILE, 'utf-8');
    const saves = JSON.parse(data);
    return saves[gameId] || null;
}

// 保存游戏存档
export function saveGame(gameId: string, gameData: any) {
    const data = fs.readFileSync(SAVES_FILE, 'utf-8');
    const saves = JSON.parse(data);

    saves[gameId] = {
        saveTime: new Date().toISOString(),
        gameData
    };

    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2));
    return saves[gameId];
}

// 删除游戏存档
export function deleteGameSave(gameId: string) {
    const data = fs.readFileSync(SAVES_FILE, 'utf-8');
    const saves = JSON.parse(data);

    if (saves[gameId]) {
        delete saves[gameId];
        fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2));
        return true;
    }
    return false;
}

// ============ 2048 样式组管理 ============
const STYLES_2048_FILE = path.join(getGamesDBPath(), '2048_styles.json');

// 默认样式组
const DEFAULT_STYLE_GROUP = {
    id: 'default',
    name: '经典样式',
    description: '原版2048经典配色',
    tileStyles: {
        2: { backgroundColor: '#eee4da', textColor: '#776e65' },
        4: { backgroundColor: '#ede0c8', textColor: '#776e65' },
        8: { backgroundColor: '#f2b179', textColor: '#f9f6f2' },
        16: { backgroundColor: '#f59563', textColor: '#f9f6f2' },
        32: { backgroundColor: '#f67c5f', textColor: '#f9f6f2' },
        64: { backgroundColor: '#f65e3b', textColor: '#f9f6f2' },
        128: { backgroundColor: '#edcf72', textColor: '#f9f6f2' },
        256: { backgroundColor: '#edcc61', textColor: '#f9f6f2' },
        512: { backgroundColor: '#edc850', textColor: '#f9f6f2' },
        1024: { backgroundColor: '#edc53f', textColor: '#f9f6f2' },
        2048: { backgroundColor: '#edc22e', textColor: '#f9f6f2' },
        4096: { backgroundColor: '#3c3a32', textColor: '#f9f6f2' },
        8192: { backgroundColor: '#3c3a32', textColor: '#f9f6f2' },
    },
    boardBackground: '#bbada0',
    emptyTileColor: '#cdc1b4',
    createTime: new Date().toISOString()
};

// 初始化2048样式数据
export function init2048Styles() {
    if (!fs.existsSync(STYLES_2048_FILE)) {
        fs.writeFileSync(STYLES_2048_FILE, JSON.stringify([DEFAULT_STYLE_GROUP], null, 2));
    }
}

// 获取所有样式组
export function get2048StyleGroups() {
    if (!fs.existsSync(STYLES_2048_FILE)) {
        init2048Styles();
    }
    const data = fs.readFileSync(STYLES_2048_FILE, 'utf-8');
    return JSON.parse(data);
}

// 保存样式组
export function save2048StyleGroup(styleGroup: any) {
    const styles = get2048StyleGroups();
    const existingIndex = styles.findIndex((s: any) => s.id === styleGroup.id);

    if (existingIndex >= 0) {
        styles[existingIndex] = { ...styles[existingIndex], ...styleGroup };
    } else {
        styles.push(styleGroup);
    }

    fs.writeFileSync(STYLES_2048_FILE, JSON.stringify(styles, null, 2));
    return styleGroup;
}

// 删除样式组
export function delete2048StyleGroup(styleGroupId: string) {
    if (styleGroupId === 'default') return false; // 不能删除默认样式

    const styles = get2048StyleGroups();
    const newStyles = styles.filter((s: any) => s.id !== styleGroupId);

    if (newStyles.length === styles.length) return false;

    fs.writeFileSync(STYLES_2048_FILE, JSON.stringify(newStyles, null, 2));
    return true;
}
// ============ 跟随跳舞模板管理 ============
const DANCE_TEMPLATES_FILE = path.join(getGamesDBPath(), 'dance_templates.json');

// 初始化跳舞模板数据
export function initDanceTemplates() {
    if (!fs.existsSync(DANCE_TEMPLATES_FILE)) {
        fs.writeFileSync(DANCE_TEMPLATES_FILE, JSON.stringify([], null, 2));
    }
}

// 获取所有跳舞模板
export function getDanceTemplates() {
    if (!fs.existsSync(DANCE_TEMPLATES_FILE)) {
        initDanceTemplates();
    }
    const data = fs.readFileSync(DANCE_TEMPLATES_FILE, 'utf-8');
    return JSON.parse(data);
}

// 添加跳舞模板
export function addDanceTemplate(template: any) {
    const templates = getDanceTemplates();
    templates.push(template);
    fs.writeFileSync(DANCE_TEMPLATES_FILE, JSON.stringify(templates, null, 2));
    return template;
}

// 删除跳舞模板
export function deleteDanceTemplate(templateId: string) {
    const templates = getDanceTemplates();
    const template = templates.find((t: any) => t.id === templateId);
    const newTemplates = templates.filter((t: any) => t.id !== templateId);

    if (newTemplates.length === templates.length) return null;

    fs.writeFileSync(DANCE_TEMPLATES_FILE, JSON.stringify(newTemplates, null, 2));
    return template;
}