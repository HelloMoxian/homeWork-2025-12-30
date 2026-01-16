import fs from 'fs';
import path from 'path';
import { getTasksDataPath } from './deployConfigManager.js';

// 获取任务根目录（从配置读取）
function getTasksRoot(): string {
    return path.join(getTasksDataPath(), 'todoTasks');
}

// 获取任务上传文件根目录
function getTasksUploadRoot(): string {
    return path.join(getTasksDataPath(), 'uploads');
}

// ============ 类型定义 ============

// 任务状态
export type TaskStatus = 'pending' | 'completed';

// 执行人任务状态
export interface ExecutorStatus {
    memberId: string;
    status: TaskStatus;
    completedAt?: string;
}

// 待做任务数据结构
export interface TodoTask {
    id: string;                     // 唯一标识
    title: string;                  // 任务名（必填）
    startDate: string;              // 起始时间（必填，YYYY-MM-DD）
    endDate: string;                // 终止时间（必填，YYYY-MM-DD）
    executorIds?: string[];         // 执行人ID列表（可选，从家庭成员中获取）
    description?: string;           // 任务描述（一句话）
    detail?: string;                // 任务详情（支持Markdown）
    images?: string[];              // 任务图片路径列表
    audioPath?: string;             // 任务录音路径
    status: TaskStatus;             // 任务状态
    executorStatuses?: ExecutorStatus[]; // 各执行人任务状态
    createdAt: string;
    updatedAt: string;
    // 周期任务关联
    periodicTaskId?: string;        // 来源周期任务ID
}

// 任务索引（按月份组织，高效查询）
interface TaskIndex {
    // 月份 -> 任务ID列表的映射
    monthlyIndex: {
        [monthKey: string]: string[];  // 格式: "YYYY-MM" -> ["taskId1", "taskId2", ...]
    };
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
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getNow(): string {
    return new Date().toISOString();
}

// 获取日期所属的月份键
function getMonthKey(dateStr: string): string {
    return dateStr.substring(0, 7); // "YYYY-MM"
}

// 获取两个日期之间的所有月份
function getMonthsBetween(startDate: string, endDate: string): string[] {
    const months: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}

// ============ 文件路径 ============

function getIndexPath(): string {
    return path.join(getTasksRoot(), 'index.json');
}

function getTaskPath(taskId: string): string {
    return path.join(getTasksRoot(), 'tasks', `${taskId}.json`);
}

function getTaskMediaPath(taskId: string): string {
    return path.join(getTasksUploadRoot(), taskId);
}

// ============ 索引管理 ============

function loadIndex(): TaskIndex {
    return readJsonFile<TaskIndex>(getIndexPath(), {
        monthlyIndex: {},
        lastTaskId: 0
    });
}

function saveIndex(index: TaskIndex): void {
    writeJsonFile(getIndexPath(), index);
}

// 添加任务到索引
function addTaskToIndex(task: TodoTask): void {
    const index = loadIndex();
    const months = getMonthsBetween(task.startDate, task.endDate);

    for (const month of months) {
        if (!index.monthlyIndex[month]) {
            index.monthlyIndex[month] = [];
        }
        if (!index.monthlyIndex[month].includes(task.id)) {
            index.monthlyIndex[month].push(task.id);
        }
    }

    saveIndex(index);
}

// 从索引中移除任务
function removeTaskFromIndex(taskId: string): void {
    const index = loadIndex();

    for (const month in index.monthlyIndex) {
        index.monthlyIndex[month] = index.monthlyIndex[month].filter(id => id !== taskId);
        if (index.monthlyIndex[month].length === 0) {
            delete index.monthlyIndex[month];
        }
    }

    saveIndex(index);
}

// 更新任务在索引中的位置（日期可能变化）
function updateTaskInIndex(oldTask: TodoTask, newTask: TodoTask): void {
    // 如果日期没变，不需要更新索引
    if (oldTask.startDate === newTask.startDate && oldTask.endDate === newTask.endDate) {
        return;
    }

    // 移除旧的索引
    removeTaskFromIndex(oldTask.id);
    // 添加新的索引
    addTaskToIndex(newTask);
}

// ============ 初始化 ============

export function initTasksDB(): void {
    ensureDir(getTasksRoot());
    ensureDir(path.join(getTasksRoot(), 'tasks'));
    ensureDir(getTasksUploadRoot());

    // 确保索引文件存在
    if (!fs.existsSync(getIndexPath())) {
        saveIndex({
            monthlyIndex: {},
            lastTaskId: 0
        });
    }

    console.log('📋 待做任务数据库已初始化');
}

// ============ 任务 CRUD ============

// 创建任务
export function createTask(data: {
    title: string;
    startDate: string;
    endDate: string;
    executorIds?: string[];
    description?: string;
    detail?: string;
    periodicTaskId?: string;
}): TodoTask {
    const now = getNow();
    const id = generateId();

    const task: TodoTask = {
        id,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        executorIds: data.executorIds || [],
        description: data.description,
        detail: data.detail,
        images: [],
        status: 'pending',
        executorStatuses: data.executorIds?.map(memberId => ({
            memberId,
            status: 'pending' as TaskStatus
        })) || [],
        createdAt: now,
        updatedAt: now,
        periodicTaskId: data.periodicTaskId
    };

    // 保存任务文件
    writeJsonFile(getTaskPath(id), task);

    // 更新索引
    addTaskToIndex(task);

    // 更新lastTaskId
    const index = loadIndex();
    index.lastTaskId++;
    saveIndex(index);

    return task;
}

// 获取任务
export function getTaskById(taskId: string): TodoTask | null {
    const taskPath = getTaskPath(taskId);
    if (!fs.existsSync(taskPath)) {
        return null;
    }
    return readJsonFile<TodoTask | null>(taskPath, null);
}

// 更新任务
export function updateTask(taskId: string, data: Partial<TodoTask>): TodoTask | null {
    const task = getTaskById(taskId);
    if (!task) {
        return null;
    }

    const oldTask = { ...task };
    const updatedTask: TodoTask = {
        ...task,
        ...data,
        id: taskId, // 确保ID不变
        updatedAt: getNow()
    };

    // 保存更新后的任务
    writeJsonFile(getTaskPath(taskId), updatedTask);

    // 更新索引（如果日期变化）
    updateTaskInIndex(oldTask, updatedTask);

    return updatedTask;
}

// 删除任务
export function deleteTask(taskId: string): boolean {
    const taskPath = getTaskPath(taskId);
    if (!fs.existsSync(taskPath)) {
        return false;
    }

    // 删除任务文件
    fs.unlinkSync(taskPath);

    // 从索引中移除
    removeTaskFromIndex(taskId);

    // 删除关联的媒体文件
    const mediaPath = getTaskMediaPath(taskId);
    if (fs.existsSync(mediaPath)) {
        fs.rmSync(mediaPath, { recursive: true, force: true });
    }

    return true;
}

// ============ 查询功能 ============

// 获取指定日期相关的任务（日期在任务的起止时间范围内）
export function getTasksByDate(dateStr: string): TodoTask[] {
    const monthKey = getMonthKey(dateStr);
    const index = loadIndex();
    const taskIds = index.monthlyIndex[monthKey] || [];

    const tasks: TodoTask[] = [];
    for (const taskId of taskIds) {
        const task = getTaskById(taskId);
        if (task && dateStr >= task.startDate && dateStr <= task.endDate) {
            tasks.push(task);
        }
    }

    return tasks;
}

// 获取指定月份的所有任务
export function getTasksByMonth(year: number, month: number): TodoTask[] {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const index = loadIndex();
    const taskIds = index.monthlyIndex[monthKey] || [];

    const tasks: TodoTask[] = [];
    const seenIds = new Set<string>();

    for (const taskId of taskIds) {
        if (seenIds.has(taskId)) continue;
        seenIds.add(taskId);

        const task = getTaskById(taskId);
        if (task) {
            tasks.push(task);
        }
    }

    return tasks;
}

// 获取所有任务
export function getAllTasks(): TodoTask[] {
    const tasksDir = path.join(getTasksRoot(), 'tasks');
    if (!fs.existsSync(tasksDir)) {
        return [];
    }

    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.json'));
    const tasks: TodoTask[] = [];

    for (const file of files) {
        const task = readJsonFile<TodoTask | null>(path.join(tasksDir, file), null);
        if (task) {
            tasks.push(task);
        }
    }

    // 按创建时间倒序
    tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return tasks;
}

// 获取指定执行人的任务
export function getTasksByExecutor(memberId: string, dateStr?: string): TodoTask[] {
    let tasks: TodoTask[];

    if (dateStr) {
        tasks = getTasksByDate(dateStr);
    } else {
        tasks = getAllTasks();
    }

    return tasks.filter(task =>
        !task.executorIds ||
        task.executorIds.length === 0 ||
        task.executorIds.includes(memberId)
    );
}

// ============ 任务状态管理 ============

// 更新任务整体状态
export function updateTaskStatus(taskId: string, status: TaskStatus): TodoTask | null {
    return updateTask(taskId, { status });
}

// 更新执行人的任务状态
export function updateExecutorStatus(taskId: string, memberId: string, status: TaskStatus): TodoTask | null {
    const task = getTaskById(taskId);
    if (!task) {
        return null;
    }

    const executorStatuses = task.executorStatuses || [];
    const existingIndex = executorStatuses.findIndex(es => es.memberId === memberId);

    const newStatus: ExecutorStatus = {
        memberId,
        status,
        completedAt: status === 'completed' ? getNow() : undefined
    };

    if (existingIndex >= 0) {
        executorStatuses[existingIndex] = newStatus;
    } else {
        executorStatuses.push(newStatus);
    }

    // 检查是否所有执行人都已完成，自动更新任务整体状态
    const allCompleted = task.executorIds && task.executorIds.length > 0 &&
        task.executorIds.every(id =>
            executorStatuses.find(es => es.memberId === id)?.status === 'completed'
        );

    return updateTask(taskId, {
        executorStatuses,
        status: allCompleted ? 'completed' : task.status
    });
}

// ============ 媒体文件管理 ============

// 获取任务媒体目录
export function ensureTaskMediaDir(taskId: string): string {
    const mediaPath = getTaskMediaPath(taskId);
    ensureDir(mediaPath);
    return mediaPath;
}

// 添加图片到任务
export function addImageToTask(taskId: string, imagePath: string): TodoTask | null {
    const task = getTaskById(taskId);
    if (!task) {
        return null;
    }

    const images = task.images || [];
    images.push(imagePath);

    return updateTask(taskId, { images });
}

// 删除任务图片
export function removeImageFromTask(taskId: string, imagePath: string): TodoTask | null {
    const task = getTaskById(taskId);
    if (!task) {
        return null;
    }

    const images = (task.images || []).filter(p => p !== imagePath);

    // 删除实际文件
    const fullPath = path.join(getTasksUploadRoot(), imagePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }

    return updateTask(taskId, { images });
}

// 设置任务录音
export function setTaskAudio(taskId: string, audioPath: string | undefined): TodoTask | null {
    return updateTask(taskId, { audioPath });
}

// 获取上传目录路径（供路由使用）
export function getUploadPath(): string {
    return getTasksUploadRoot();
}
