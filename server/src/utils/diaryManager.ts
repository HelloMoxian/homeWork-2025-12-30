import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日记根目录
const DIARY_ROOT = path.join(__dirname, '../../../data/diaries');
const DIARY_UPLOAD_ROOT = path.join(__dirname, '../../../uploadFiles/diaryFiles');

// ============ 类型定义 ============

// 心情选项
export const MOOD_OPTIONS = {
    morning: [
        { value: 'happy', label: '开心', emoji: '😊' },
        { value: 'excited', label: '兴奋', emoji: '🤩' },
        { value: 'peaceful', label: '平静', emoji: '😌' },
        { value: 'sleepy', label: '困倦', emoji: '😴' },
        { value: 'grumpy', label: '起床气', emoji: '😤' },
        { value: 'energetic', label: '精力充沛', emoji: '💪' }
    ],
    afternoon: [
        { value: 'happy', label: '开心', emoji: '😊' },
        { value: 'focused', label: '专注', emoji: '🎯' },
        { value: 'tired', label: '疲惫', emoji: '😫' },
        { value: 'bored', label: '无聊', emoji: '😑' },
        { value: 'excited', label: '兴奋', emoji: '🤩' },
        { value: 'relaxed', label: '放松', emoji: '😎' }
    ],
    evening: [
        { value: 'satisfied', label: '满足', emoji: '😊' },
        { value: 'tired', label: '疲惫', emoji: '😫' },
        { value: 'peaceful', label: '平静', emoji: '😌' },
        { value: 'accomplished', label: '有成就感', emoji: '🏆' },
        { value: 'grateful', label: '感恩', emoji: '🙏' },
        { value: 'sleepy', label: '困了', emoji: '😴' }
    ]
};

// 天气选项
export const WEATHER_OPTIONS = [
    { value: 'sunny', label: '晴天', emoji: '☀️' },
    { value: 'cloudy', label: '多云', emoji: '⛅' },
    { value: 'overcast', label: '阴天', emoji: '☁️' },
    { value: 'rainy', label: '下雨', emoji: '🌧️' },
    { value: 'stormy', label: '雷雨', emoji: '⛈️' },
    { value: 'snowy', label: '下雪', emoji: '❄️' },
    { value: 'windy', label: '大风', emoji: '💨' },
    { value: 'foggy', label: '雾', emoji: '🌫️' },
    { value: 'hot', label: '炎热', emoji: '🔥' },
    { value: 'cold', label: '寒冷', emoji: '🥶' }
];

// 心情记录
export interface MoodRecord {
    period: 'morning' | 'afternoon' | 'evening';
    moods: string[];  // 选中的心情值
    customMood?: string;  // 自定义心情文字
}

// 饮食记录
export interface MealRecord {
    period: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    content: string;  // 文字描述
    audioPath?: string;  // 录音路径
}

// 日记数据结构
export interface DiaryEntry {
    id: string;  // 日期格式: YYYY-MM-DD
    date: string;  // 日期
    weather?: string;  // 天气
    moods: MoodRecord[];  // 心情记录
    meals: MealRecord[];  // 饮食记录
    events: string;  // 一天的事情
    images: string[];  // 图片路径列表
    videos: string[];  // 视频路径列表
    audios: string[];  // 音频路径列表
    created_at: string;
    updated_at: string;
}

// ============ 工具函数 ============

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function readJsonFile<T>(filePath: string): T | null {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return null;
}

function writeJsonFile(filePath: string, data: any): void {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getDirectories(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    return fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// 生成日记ID（日期格式）
function generateDiaryId(date?: Date): string {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取日记目录路径
function getDiaryPath(diaryId: string): string {
    return path.join(DIARY_ROOT, diaryId);
}

// 获取日记配置文件路径
function getDiaryConfigPath(diaryId: string): string {
    return path.join(getDiaryPath(diaryId), 'diary.json');
}

// 获取日记上传文件目录
function getDiaryMediaPath(diaryId: string): string {
    return path.join(DIARY_UPLOAD_ROOT, diaryId);
}

// ============ 日记 CRUD ============

// 获取所有日记列表（只返回基础信息）
export function getAllDiaries(): DiaryEntry[] {
    ensureDir(DIARY_ROOT);
    const dirs = getDirectories(DIARY_ROOT);
    const diaries: DiaryEntry[] = [];

    for (const dirName of dirs) {
        const configPath = getDiaryConfigPath(dirName);
        const diary = readJsonFile<DiaryEntry>(configPath);
        if (diary) {
            diaries.push(diary);
        }
    }

    // 按日期倒序排列
    diaries.sort((a, b) => b.date.localeCompare(a.date));
    return diaries;
}

// 按年月获取日记列表
export function getDiariesByMonth(year: number, month: number): DiaryEntry[] {
    const allDiaries = getAllDiaries();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return allDiaries.filter(d => d.date.startsWith(monthStr));
}

// 获取单个日记
export function getDiaryById(diaryId: string): DiaryEntry | null {
    const configPath = getDiaryConfigPath(diaryId);
    return readJsonFile<DiaryEntry>(configPath);
}

// 获取或创建今日日记
export function getTodayDiary(): DiaryEntry {
    const diaryId = generateDiaryId();
    let diary = getDiaryById(diaryId);

    if (!diary) {
        diary = createDiary({ date: diaryId });
    }

    return diary;
}

// 创建日记
export function createDiary(data: { date: string }): DiaryEntry {
    const diaryId = data.date;
    const diaryPath = getDiaryPath(diaryId);
    ensureDir(diaryPath);

    const now = new Date().toISOString();
    const diary: DiaryEntry = {
        id: diaryId,
        date: data.date,
        weather: undefined,
        moods: [],
        meals: [],
        events: '',
        images: [],
        videos: [],
        audios: [],
        created_at: now,
        updated_at: now
    };

    writeJsonFile(getDiaryConfigPath(diaryId), diary);
    return diary;
}

// 更新日记
export function updateDiary(diaryId: string, data: Partial<DiaryEntry>): boolean {
    const configPath = getDiaryConfigPath(diaryId);
    const diary = readJsonFile<DiaryEntry>(configPath);

    if (!diary) return false;

    const updatedDiary: DiaryEntry = {
        ...diary,
        ...data,
        id: diaryId, // 确保ID不变
        date: diary.date, // 确保日期不变
        updated_at: new Date().toISOString()
    };

    writeJsonFile(configPath, updatedDiary);
    return true;
}

// 删除日记
export function deleteDiary(diaryId: string): { success: boolean; error?: string } {
    const diaryPath = getDiaryPath(diaryId);
    const mediaPath = getDiaryMediaPath(diaryId);

    if (!fs.existsSync(diaryPath)) {
        return { success: false, error: '日记不存在' };
    }

    try {
        // 删除日记目录
        fs.rmSync(diaryPath, { recursive: true });

        // 删除媒体文件目录（如果存在）
        if (fs.existsSync(mediaPath)) {
            fs.rmSync(mediaPath, { recursive: true });
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ============ 心情管理 ============

// 更新心情
export function updateMood(diaryId: string, moodRecord: MoodRecord): boolean {
    const diary = getDiaryById(diaryId);
    if (!diary) return false;

    // 查找并更新或添加心情记录
    const existingIndex = diary.moods.findIndex(m => m.period === moodRecord.period);
    if (existingIndex >= 0) {
        diary.moods[existingIndex] = moodRecord;
    } else {
        diary.moods.push(moodRecord);
    }

    return updateDiary(diaryId, { moods: diary.moods });
}

// ============ 饮食管理 ============

// 更新饮食
export function updateMeal(diaryId: string, mealRecord: MealRecord): boolean {
    const diary = getDiaryById(diaryId);
    if (!diary) return false;

    // 查找并更新或添加饮食记录
    const existingIndex = diary.meals.findIndex(m => m.period === mealRecord.period);
    if (existingIndex >= 0) {
        diary.meals[existingIndex] = mealRecord;
    } else {
        diary.meals.push(mealRecord);
    }

    return updateDiary(diaryId, { meals: diary.meals });
}

// ============ 媒体文件管理 ============

// 保存媒体文件
export function saveMediaFile(
    diaryId: string,
    type: 'image' | 'video' | 'audio',
    buffer: Buffer,
    filename: string
): { success: boolean; path?: string; error?: string } {
    try {
        const mediaPath = getDiaryMediaPath(diaryId);
        ensureDir(mediaPath);

        const timestamp = Date.now();
        const ext = path.extname(filename);
        const prefix = type === 'image' ? 'img' : type === 'video' ? 'vid' : 'aud';
        const newFilename = `${prefix}_${timestamp}_${Math.random().toString(36).substring(7)}${ext}`;
        const filePath = path.join(mediaPath, newFilename);

        fs.writeFileSync(filePath, buffer);

        // 更新日记记录
        const diary = getDiaryById(diaryId);
        if (diary) {
            const relativePath = `uploadFiles/diaryFiles/${diaryId}/${newFilename}`;
            if (type === 'image') {
                diary.images.push(relativePath);
                updateDiary(diaryId, { images: diary.images });
            } else if (type === 'video') {
                diary.videos.push(relativePath);
                updateDiary(diaryId, { videos: diary.videos });
            } else {
                diary.audios.push(relativePath);
                updateDiary(diaryId, { audios: diary.audios });
            }
        }

        return { success: true, path: `uploadFiles/diaryFiles/${diaryId}/${newFilename}` };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// 删除媒体文件
export function deleteMediaFile(
    diaryId: string,
    type: 'image' | 'video' | 'audio',
    filePath: string
): boolean {
    try {
        const diary = getDiaryById(diaryId);
        if (!diary) return false;

        // 从列表中移除
        if (type === 'image') {
            diary.images = diary.images.filter(p => p !== filePath);
            updateDiary(diaryId, { images: diary.images });
        } else if (type === 'video') {
            diary.videos = diary.videos.filter(p => p !== filePath);
            updateDiary(diaryId, { videos: diary.videos });
        } else {
            diary.audios = diary.audios.filter(p => p !== filePath);
            updateDiary(diaryId, { audios: diary.audios });
        }

        // 删除实际文件
        const fullPath = path.join(__dirname, '../../../', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        return true;
    } catch (error) {
        console.error('Delete media file error:', error);
        return false;
    }
}

// 获取心情和天气选项
export function getOptions() {
    return {
        moodOptions: MOOD_OPTIONS,
        weatherOptions: WEATHER_OPTIONS
    };
}
