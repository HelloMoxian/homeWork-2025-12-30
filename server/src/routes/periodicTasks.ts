import { FastifyInstance } from 'fastify';
import * as PeriodicTaskManager from '../utils/periodicTaskManager.js';

export default async function periodicTasksRoutes(fastify: FastifyInstance) {

    // ============ 周期任务 CRUD ============

    // 获取所有周期任务
    fastify.get('/api/periodic-tasks', async (request, reply) => {
        try {
            const tasks = PeriodicTaskManager.getAllPeriodicTasks();
            return { success: true, data: tasks };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个周期任务
    fastify.get<{ Params: { id: string } }>('/api/periodic-tasks/:id', async (request, reply) => {
        try {
            const task = PeriodicTaskManager.getPeriodicTaskById(request.params.id);
            if (!task) {
                return reply.status(404).send({ success: false, error: '周期任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建周期任务
    fastify.post<{
        Body: {
            title: string;
            periodicType: 'daily' | 'weekly' | 'monthly';
            weekDays?: number[];
            monthDays?: number[];
            taskDuration: number;
            executorIds?: string[];
            description?: string;
            detail?: string;
            maxRepeatCount?: number;
            startDate: string;
            endDate?: string;
        }
    }>('/api/periodic-tasks', async (request, reply) => {
        try {
            const {
                title, periodicType, weekDays, monthDays, taskDuration,
                executorIds, description, detail, maxRepeatCount, startDate, endDate
            } = request.body;

            if (!title || !periodicType || !startDate) {
                return reply.status(400).send({ success: false, error: '任务名、周期类型和开始日期为必填项' });
            }

            // 验证周期类型相关配置
            if (periodicType === 'weekly' && (!weekDays || weekDays.length === 0)) {
                return reply.status(400).send({ success: false, error: '每周循环需要指定执行日（周几）' });
            }
            if (periodicType === 'monthly' && (!monthDays || monthDays.length === 0)) {
                return reply.status(400).send({ success: false, error: '每月循环需要指定执行日（几号）' });
            }

            const task = PeriodicTaskManager.createPeriodicTask({
                title,
                periodicType,
                weekDays: weekDays as any,
                monthDays,
                taskDuration: taskDuration || 1,
                executorIds,
                description,
                detail,
                maxRepeatCount,
                startDate,
                endDate
            });

            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新周期任务
    fastify.put<{
        Params: { id: string };
        Body: Partial<{
            title: string;
            periodicType: 'daily' | 'weekly' | 'monthly';
            weekDays: number[];
            monthDays: number[];
            taskDuration: number;
            executorIds: string[];
            description: string;
            detail: string;
            maxRepeatCount: number;
            startDate: string;
            endDate: string;
            isActive: boolean;
        }>
    }>('/api/periodic-tasks/:id', async (request, reply) => {
        try {
            const task = PeriodicTaskManager.updatePeriodicTask(request.params.id, request.body as any);
            if (!task) {
                return reply.status(404).send({ success: false, error: '周期任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除周期任务
    fastify.delete<{ Params: { id: string } }>('/api/periodic-tasks/:id', async (request, reply) => {
        try {
            const success = PeriodicTaskManager.deletePeriodicTask(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '周期任务不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 周期任务执行 ============

    // 切换周期任务激活状态
    fastify.put<{ Params: { id: string }; Body: { isActive: boolean } }>('/api/periodic-tasks/:id/toggle', async (request, reply) => {
        try {
            const { isActive } = request.body;
            const task = PeriodicTaskManager.updatePeriodicTask(request.params.id, { isActive });
            if (!task) {
                return reply.status(404).send({ success: false, error: '周期任务不存在' });
            }
            return { success: true, data: task };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 手动触发生成今日任务
    fastify.post('/api/periodic-tasks/generate-today', async (request, reply) => {
        try {
            const generatedCount = PeriodicTaskManager.checkAndGenerateTodayTasks();
            return { success: true, data: { generatedCount } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 手动为指定周期任务生成今日任务
    fastify.post<{ Params: { id: string } }>('/api/periodic-tasks/:id/generate', async (request, reply) => {
        try {
            const today = new Date();
            const generated = PeriodicTaskManager.generateTodoTaskForDate(request.params.id, today);
            return { success: true, data: { generated } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 统计信息 ============

    // 获取周期任务的统计信息
    fastify.get<{ Params: { id: string } }>('/api/periodic-tasks/:id/stats', async (request, reply) => {
        try {
            const task = PeriodicTaskManager.getPeriodicTaskById(request.params.id);
            if (!task) {
                return reply.status(404).send({ success: false, error: '周期任务不存在' });
            }
            const stats = PeriodicTaskManager.getPeriodicTaskStats(request.params.id);
            return { success: true, data: { task, stats } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取周期任务生成的待办任务列表
    fastify.get<{ Params: { id: string } }>('/api/periodic-tasks/:id/generated-tasks', async (request, reply) => {
        try {
            const tasks = PeriodicTaskManager.getGeneratedTasks(request.params.id);
            return { success: true, data: tasks };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
