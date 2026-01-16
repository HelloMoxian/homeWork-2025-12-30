import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import * as TaskManager from '../utils/taskManager.js';
import { compressImageBuffer, isImageFile } from '../utils/imageCompress.js';

export default async function tasksRoutes(fastify: FastifyInstance) {

    // ============ 任务 CRUD ============

    // 获取所有任务
    fastify.get('/api/tasks', async (request, reply) => {
        try {
            const tasks = TaskManager.getAllTasks();
            return { success: true, data: tasks };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取指定日期的任务
    fastify.get<{ Querystring: { date: string } }>('/api/tasks/by-date', async (request, reply) => {
        try {
            const { date } = request.query;
            if (!date) {
                return reply.status(400).send({ success: false, error: '缺少日期参数' });
            }
            const tasks = TaskManager.getTasksByDate(date);
            return { success: true, data: tasks };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取指定月份的任务
    fastify.get<{ Querystring: { year: string; month: string } }>('/api/tasks/by-month', async (request, reply) => {
        try {
            const { year, month } = request.query;
            if (!year || !month) {
                return reply.status(400).send({ success: false, error: '缺少年月参数' });
            }
            const tasks = TaskManager.getTasksByMonth(parseInt(year), parseInt(month));
            return { success: true, data: tasks };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取指定执行人的任务
    fastify.get<{ Params: { memberId: string }; Querystring: { date?: string } }>('/api/tasks/by-executor/:memberId', async (request, reply) => {
        try {
            const { memberId } = request.params;
            const { date } = request.query;
            const tasks = TaskManager.getTasksByExecutor(memberId, date);
            return { success: true, data: tasks };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个任务
    fastify.get<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
        try {
            const task = TaskManager.getTaskById(request.params.id);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建任务
    fastify.post<{
        Body: {
            title: string;
            startDate: string;
            endDate: string;
            executorIds?: string[];
            description?: string;
            detail?: string;
            periodicTaskId?: string;
        }
    }>('/api/tasks', async (request, reply) => {
        try {
            const { title, startDate, endDate, executorIds, description, detail, periodicTaskId } = request.body;

            if (!title || !startDate || !endDate) {
                return reply.status(400).send({ success: false, error: '任务名、起始时间和终止时间为必填项' });
            }

            const task = TaskManager.createTask({
                title,
                startDate,
                endDate,
                executorIds,
                description,
                detail,
                periodicTaskId
            });

            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新任务
    fastify.put<{
        Params: { id: string };
        Body: Partial<{
            title: string;
            startDate: string;
            endDate: string;
            executorIds: string[];
            description: string;
            detail: string;
            status: 'pending' | 'completed';
        }>
    }>('/api/tasks/:id', async (request, reply) => {
        try {
            const task = TaskManager.updateTask(request.params.id, request.body);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除任务
    fastify.delete<{ Params: { id: string } }>('/api/tasks/:id', async (request, reply) => {
        try {
            const success = TaskManager.deleteTask(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 任务状态管理 ============

    // 更新任务状态
    fastify.put<{
        Params: { id: string };
        Body: { status: 'pending' | 'completed' }
    }>('/api/tasks/:id/status', async (request, reply) => {
        try {
            const { status } = request.body;
            const task = TaskManager.updateTaskStatus(request.params.id, status);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新执行人状态
    fastify.put<{
        Params: { id: string; memberId: string };
        Body: { status: 'pending' | 'completed' }
    }>('/api/tasks/:id/executor/:memberId/status', async (request, reply) => {
        try {
            const { id, memberId } = request.params;
            const { status } = request.body;
            const task = TaskManager.updateExecutorStatus(id, memberId, status);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 媒体文件管理 ============

    // 上传任务图片
    fastify.post<{ Params: { id: string } }>('/api/tasks/:id/images', async (request, reply) => {
        try {
            const { id } = request.params;
            const task = TaskManager.getTaskById(id);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }

            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有上传文件' });
            }

            const buffer = await data.toBuffer();
            const filename = `${Date.now()}-${data.filename}`;
            const relativePath = `${id}/${filename}`;

            // 确保目录存在
            TaskManager.ensureTaskMediaDir(id);

            // 压缩并保存图片
            let finalBuffer = buffer;
            if (isImageFile(data.filename)) {
                try {
                    finalBuffer = await compressImageBuffer(buffer, data.filename);
                } catch (e) {
                    console.error('图片压缩失败，使用原始文件:', e);
                }
            }

            const uploadPath = TaskManager.getUploadPath();
            const fullPath = path.join(uploadPath, relativePath);
            fs.writeFileSync(fullPath, finalBuffer);

            // 更新任务
            const updatedTask = TaskManager.addImageToTask(id, relativePath);

            return { success: true, data: { path: relativePath, task: updatedTask } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除任务图片
    fastify.delete<{ Params: { id: string }; Body: { imagePath: string } }>('/api/tasks/:id/images', async (request, reply) => {
        try {
            const { id } = request.params;
            const { imagePath } = request.body;

            const task = TaskManager.removeImageFromTask(id, imagePath);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }

            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传任务录音
    fastify.post<{ Params: { id: string } }>('/api/tasks/:id/audio', async (request, reply) => {
        try {
            const { id } = request.params;
            const task = TaskManager.getTaskById(id);
            if (!task) {
                return reply.status(404).send({ success: false, error: '任务不存在' });
            }

            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有上传文件' });
            }

            const buffer = await data.toBuffer();
            const filename = `audio-${Date.now()}.webm`;
            const relativePath = `${id}/${filename}`;

            // 确保目录存在
            TaskManager.ensureTaskMediaDir(id);

            const uploadPath = TaskManager.getUploadPath();
            const fullPath = path.join(uploadPath, relativePath);
            fs.writeFileSync(fullPath, buffer);

            // 删除旧录音（如果存在）
            if (task.audioPath) {
                const oldPath = path.join(uploadPath, task.audioPath);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // 更新任务
            const updatedTask = TaskManager.setTaskAudio(id, relativePath);

            return { success: true, data: { path: relativePath, task: updatedTask } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除任务录音
    fastify.delete<{ Params: { id: string } }>('/api/tasks/:id/audio', async (request, reply) => {
        try {
            const { id } = request.params;
            const task = TaskManager.getTaskById(id);
            if (!task || !task.audioPath) {
                return reply.status(404).send({ success: false, error: '任务或录音不存在' });
            }

            // 删除文件
            const uploadPath = TaskManager.getUploadPath();
            const fullPath = path.join(uploadPath, task.audioPath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }

            // 更新任务
            const updatedTask = TaskManager.setTaskAudio(id, undefined);

            return { success: true, data: updatedTask };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
