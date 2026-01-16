import fs from 'fs';
import path from 'path';
import { getTasksDataPath } from './deployConfigManager.js';
import * as TaskManager from './taskManager.js';

// 获取周期任务根目录
function getPeriodicTasksRoot(): string {
    return path.join(getTasksDataPath(), 'periodicTasks');
}

// ============ 类型定义 ============

// 周期类型
export type PeriodicType = 'daily' | 'weekly' | 'monthly';

// 周几（0-6，周一到周日）
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// 周期任务配置
export interface PeriodicTask {
    id: string;
    title: string;                      // 任务名
    periodicType: PeriodicType;         // 周期类型

    // 每日循环配置
    // 无需额外配置，每天自动创建

    // 每周循环配置
    weekDays?: WeekDay[];               // 每周几执行（0=周一，6=周日）

    // 每月循环配置
    monthDays?: number[];               // 每月几号执行（1-31）

    // 通用配置
    taskDuration: number;               // 任务耗时（天数）
    executorIds?: string[];             // 执行人ID列表
    description?: string;               // 任务描述
    detail?: string;                    // 任务详情

    // 累计控制
    maxRepeatCount?: number;            // 最大重复次数（0或undefined表示无限制）
    currentRepeatCount: number;         // 当前已重复次数

    // 时间范围
    startDate: string;                  // 周期任务开始日期
    endDate?: string;                   // 周期任务结束日期（可选）

    // 状态
    isActive: boolean;                  // 是否激活
    lastGeneratedDate?: string;         // 最后生成待办的日期

    createdAt: string;
    updatedAt: string;
}

// 周期任务索引
interface PeriodicTaskIndex {
    tasks: string[];  // 任务ID列表
    lastTaskId: number;
}

// ============ 工具函数 ============

function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
}

function writeJsonFile(filePath: string, data: any): void {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(): string {
    return 'pt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getNow(): string {
    return new Date().toISOString();
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// 获取日期是周几（0=周一，6=周日，符合中国习惯）
function getChineseWeekDay(date: Date): WeekDay {
    const day = date.getDay();
    return (day === 0 ? 6 : day - 1) as WeekDay;
}

// ============ 文件路径 ============

function getIndexPath(): string {
    return path.join(getPeriodicTasksRoot(), 'index.json');
}

function getTaskPath(taskId: string): string {
    return path.join(getPeriodicTasksRoot(), 'tasks', `${taskId}.json`);
}

// ============ 索引管理 ============

function loadIndex(): PeriodicTaskIndex {
    return readJsonFile<PeriodicTaskIndex>(getIndexPath(), {
        tasks: [],
        lastTaskId: 0
    });
}

function saveIndex(index: PeriodicTaskIndex): void {
    writeJsonFile(getIndexPath(), index);
}

// ============ 初始化 ============

export function initPeriodicTasksDB(): void {
    ensureDir(getPeriodicTasksRoot());
    ensureDir(path.join(getPeriodicTasksRoot(), 'tasks'));

    if (!fs.existsSync(getIndexPath())) {
        saveIndex({
            tasks: [],
            lastTaskId: 0
        });
    }

    console.log('🔄 周期任务数据库已初始化');
}

// ============ 周期任务 CRUD ============

// 创建周期任务
export function createPeriodicTask(data: {
    title: string;
    periodicType: PeriodicType;
    weekDays?: WeekDay[];
    monthDays?: number[];
    taskDuration: number;
    executorIds?: string[];
    description?: string;
    detail?: string;
    maxRepeatCount?: number;
    startDate: string;
    endDate?: string;
}): PeriodicTask {
    const now = getNow();
    const id = generateId();

    const task: PeriodicTask = {
        id,
        title: data.title,
        periodicType: data.periodicType,
        weekDays: data.weekDays,
        monthDays: data.monthDays,
        taskDuration: data.taskDuration || 1,
        executorIds: data.executorIds || [],
        description: data.description,
        detail: data.detail,
        maxRepeatCount: data.maxRepeatCount,
        currentRepeatCount: 0,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        createdAt: now,
        updatedAt: now
    };

    // 保存任务
    writeJsonFile(getTaskPath(id), task);

    // 更新索引
    const index = loadIndex();
    index.tasks.push(id);
    index.lastTaskId++;
    saveIndex(index);

    return task;
}

// 获取周期任务
export function getPeriodicTaskById(taskId: string): PeriodicTask | null {
    const taskPath = getTaskPath(taskId);
    if (!fs.existsSync(taskPath)) {
        return null;
    }
    return readJsonFile<PeriodicTask | null>(taskPath, null);
}

// 获取所有周期任务
export function getAllPeriodicTasks(): PeriodicTask[] {
    const index = loadIndex();
    const tasks: PeriodicTask[] = [];

    for (const taskId of index.tasks) {
        const task = getPeriodicTaskById(taskId);
        if (task) {
            tasks.push(task);
        }
    }

    // 按创建时间倒序
    tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return tasks;
}

// 更新周期任务
export function updatePeriodicTask(taskId: string, data: Partial<PeriodicTask>): PeriodicTask | null {
    const task = getPeriodicTaskById(taskId);
    if (!task) {
        return null;
    }

    const updatedTask: PeriodicTask = {
        ...task,
        ...data,
        id: taskId,
        updatedAt: getNow()
    };

    writeJsonFile(getTaskPath(taskId), updatedTask);
    return updatedTask;
}

// 删除周期任务
export function deletePeriodicTask(taskId: string): boolean {
    const taskPath = getTaskPath(taskId);
    if (!fs.existsSync(taskPath)) {
        return false;
    }

    // 删除任务文件
    fs.unlinkSync(taskPath);

    // 更新索引
    const index = loadIndex();
    index.tasks = index.tasks.filter(id => id !== taskId);
    saveIndex(index);

    return true;
}

// ============ 周期任务执行逻辑 ============

// 检查某个日期是否应该生成任务
function shouldGenerateTask(task: PeriodicTask, date: Date): boolean {
    const dateStr = formatDate(date);

    // 检查日期范围
    if (dateStr < task.startDate) {
        return false;
    }
    if (task.endDate && dateStr > task.endDate) {
        return false;
    }

    // 检查重复次数限制
    if (task.maxRepeatCount && task.maxRepeatCount > 0 && task.currentRepeatCount >= task.maxRepeatCount) {
        return false;
    }

    // 检查是否已经生成过
    if (task.lastGeneratedDate && dateStr <= task.lastGeneratedDate) {
        return false;
    }

    // 根据周期类型检查
    switch (task.periodicType) {
        case 'daily':
            return true;

        case 'weekly':
            if (!task.weekDays || task.weekDays.length === 0) {
                return false;
            }
            const weekDay = getChineseWeekDay(date);
            return task.weekDays.includes(weekDay);

        case 'monthly':
            if (!task.monthDays || task.monthDays.length === 0) {
                return false;
            }
            const monthDay = date.getDate();
            return task.monthDays.includes(monthDay);

        default:
            return false;
    }
}

// 为指定日期生成待办任务
export function generateTodoTaskForDate(periodicTaskId: string, date: Date): boolean {
    const periodicTask = getPeriodicTaskById(periodicTaskId);
    if (!periodicTask || !periodicTask.isActive) {
        return false;
    }

    if (!shouldGenerateTask(periodicTask, date)) {
        return false;
    }

    const startDate = formatDate(date);
    const endDate = formatDate(addDays(date, periodicTask.taskDuration - 1));

    // 创建待办任务
    TaskManager.createTask({
        title: periodicTask.title,
        startDate,
        endDate,
        executorIds: periodicTask.executorIds,
        description: periodicTask.description,
        detail: periodicTask.detail,
        periodicTaskId: periodicTask.id
    });

    // 更新周期任务状态
    updatePeriodicTask(periodicTaskId, {
        currentRepeatCount: periodicTask.currentRepeatCount + 1,
        lastGeneratedDate: startDate
    });

    return true;
}

// 为所有激活的周期任务生成指定日期的待办
export function generateAllTodoTasksForDate(date: Date): number {
    const tasks = getAllPeriodicTasks();
    let generatedCount = 0;

    for (const task of tasks) {
        if (task.isActive && generateTodoTaskForDate(task.id, date)) {
            generatedCount++;
        }
    }

    return generatedCount;
}

// 检查并生成今天的任务（通常在应用启动时或定时调用）
export function checkAndGenerateTodayTasks(): number {
    const today = new Date();
    return generateAllTodoTasksForDate(today);
}

// 批量生成日期范围内的任务（用于补充历史任务或预生成）
export function generateTasksForDateRange(startDate: Date, endDate: Date): number {
    let totalGenerated = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        totalGenerated += generateAllTodoTasksForDate(current);
        current.setDate(current.getDate() + 1);
    }

    return totalGenerated;
}

// ============ 统计功能 ============

// 获取周期任务生成的待办任务
export function getGeneratedTasks(periodicTaskId: string): any[] {
    const allTasks = TaskManager.getAllTasks();
    return allTasks.filter(task => task.periodicTaskId === periodicTaskId);
}

// 获取周期任务统计信息
export function getPeriodicTaskStats(periodicTaskId: string): {
    totalGenerated: number;
    completed: number;
    pending: number;
} {
    const tasks = getGeneratedTasks(periodicTaskId);
    return {
        totalGenerated: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length
    };
}
