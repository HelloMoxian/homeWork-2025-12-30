import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as HonorsManager from '../utils/honorsManager.js';
import { compressImageBuffer, isImageFile } from '../utils/imageCompress.js';
import { getHonorsDataPath } from '../utils/deployConfigManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取上传目录（基于配置的荣誉室数据路径）
function getUploadDir(): string {
    return path.join(getHonorsDataPath(), 'uploads');
}

// 确保上传目录存在
function ensureUploadDirs(): void {
    const uploadDir = getUploadDir();
    const dirs = ['images', 'videos', 'recordings', 'icons'];
    dirs.forEach(dir => {
        const dirPath = path.join(uploadDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
}

// 生成文件名
function generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}${ext}`;
}

export default async function honorsRoutes(fastify: FastifyInstance) {
    // 确保目录存在
    ensureUploadDirs();

    // ============ 荣誉室（一级板块）CRUD ============

    // 获取所有荣誉室
    fastify.get('/api/honors/halls', async (request, reply) => {
        try {
            const halls = HonorsManager.getAllHalls();
            // 为每个荣誉室添加统计信息
            const hallsWithStats = halls.map(hall => ({
                ...hall,
                statistics: HonorsManager.getHallStatistics(hall.id)
            }));
            return { success: true, data: hallsWithStats };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个荣誉室
    fastify.get<{ Params: { id: string } }>('/api/honors/halls/:id', async (request, reply) => {
        try {
            const hall = HonorsManager.getHallById(request.params.id);
            if (!hall) {
                return reply.status(404).send({ success: false, error: '荣誉室不存在' });
            }
            return {
                success: true,
                data: {
                    ...hall,
                    statistics: HonorsManager.getHallStatistics(hall.id)
                }
            };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建荣誉室
    fastify.post<{ Body: { name: string; icon?: string; sort_weight?: number } }>(
        '/api/honors/halls',
        async (request, reply) => {
            try {
                const hall = HonorsManager.createHall(request.body);
                return { success: true, data: hall };
            } catch (error) {
                return reply.status(500).send({ success: false, error: String(error) });
            }
        }
    );

    // 更新荣誉室
    fastify.put<{ Params: { id: string }; Body: { name?: string; icon?: string; sort_weight?: number } }>(
        '/api/honors/halls/:id',
        async (request, reply) => {
            try {
                const success = HonorsManager.updateHall(request.params.id, request.body);
                if (!success) {
                    return reply.status(404).send({ success: false, error: '荣誉室不存在' });
                }
                return { success: true };
            } catch (error) {
                return reply.status(500).send({ success: false, error: String(error) });
            }
        }
    );

    // 删除荣誉室
    fastify.delete<{ Params: { id: string } }>('/api/honors/halls/:id', async (request, reply) => {
        try {
            const success = HonorsManager.deleteHall(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '荣誉室不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传荣誉室图标
    fastify.post('/api/honors/halls/upload-icon', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '未上传文件' });
            }

            const buffer = await data.toBuffer();
            const fileName = generateFileName(data.filename);
            const uploadDir = getUploadDir();
            const filePath = path.join(uploadDir, 'icons', fileName);

            // 如果是图片，进行压缩
            if (isImageFile(data.filename)) {
                const compressed = await compressImageBuffer(buffer, data.filename, {
                    maxWidth: 256,
                    maxHeight: 256,
                    quality: 80
                });
                fs.writeFileSync(filePath, compressed);
            } else {
                fs.writeFileSync(filePath, buffer);
            }

            return {
                success: true,
                data: { path: `/honorsUploads/icons/${fileName}` }
            };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 荣誉条目 CRUD ============

    // 获取荣誉室下的所有荣誉
    fastify.get<{ Params: { hallId: string }; Querystring: { groupBy?: string } }>(
        '/api/honors/halls/:hallId/honors',
        async (request, reply) => {
            try {
                const { groupBy } = request.query;

                if (groupBy === 'glory') {
                    // 按荣耀度分组
                    const grouped = HonorsManager.getHonorsGroupedByGloryLevel(request.params.hallId);
                    const result: { level: number; honors: HonorsManager.Honor[] }[] = [];
                    grouped.forEach((honors, level) => {
                        result.push({ level, honors });
                    });
                    return { success: true, data: result, groupBy: 'glory' };
                } else if (groupBy === 'year') {
                    // 按年份分组
                    const grouped = HonorsManager.getHonorsGroupedByYear(request.params.hallId);
                    const result: { year: number; honors: HonorsManager.Honor[] }[] = [];
                    grouped.forEach((honors, year) => {
                        result.push({ year, honors });
                    });
                    return { success: true, data: result, groupBy: 'year' };
                } else if (groupBy === 'type') {
                    // 按类型分组
                    const grouped = HonorsManager.getHonorsGroupedByType(request.params.hallId);
                    const result: { type: string; honors: HonorsManager.Honor[] }[] = [];
                    grouped.forEach((honors, type) => {
                        result.push({ type, honors });
                    });
                    return { success: true, data: result, groupBy: 'type' };
                } else {
                    // 默认按权重排序
                    const honors = HonorsManager.getHonorsByHallId(request.params.hallId);
                    return { success: true, data: honors };
                }
            } catch (error) {
                return reply.status(500).send({ success: false, error: String(error) });
            }
        }
    );

    // 获取单个荣誉详情
    fastify.get<{ Params: { id: string } }>('/api/honors/:id', async (request, reply) => {
        try {
            const honor = HonorsManager.getHonorById(request.params.id);
            if (!honor) {
                return reply.status(404).send({ success: false, error: '荣誉不存在' });
            }
            return { success: true, data: honor };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建荣誉
    fastify.post<{
        Body: {
            hall_id: string;
            name: string;
            honor_date: { year: number; month: number | null; day: number | null };
            images?: string[];
            videos?: string[];
            voice_recordings?: string[];
            description?: string;
            honor_type?: string;
            glory_level?: number;
            sort_weight?: number;
        }
    }>('/api/honors', async (request, reply) => {
        try {
            const honor = HonorsManager.createHonor(request.body);
            return { success: true, data: honor };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新荣誉
    fastify.put<{
        Params: { id: string };
        Body: Partial<Omit<HonorsManager.Honor, 'id' | 'created_at'>>
    }>('/api/honors/:id', async (request, reply) => {
        try {
            const success = HonorsManager.updateHonor(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '荣誉不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除荣誉
    fastify.delete<{ Params: { id: string } }>('/api/honors/:id', async (request, reply) => {
        try {
            const success = HonorsManager.deleteHonor(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '荣誉不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 文件上传 ============

    // 上传荣誉图片（支持多张）
    fastify.post('/api/honors/upload-images', async (request, reply) => {
        try {
            const parts = request.files();
            const uploadedPaths: string[] = [];
            const uploadDir = getUploadDir();

            for await (const part of parts) {
                const buffer = await part.toBuffer();
                const fileName = generateFileName(part.filename);
                const filePath = path.join(uploadDir, 'images', fileName);

                // 图片压缩
                if (isImageFile(part.filename)) {
                    const compressed = await compressImageBuffer(buffer, part.filename, {
                        maxWidth: 1920,
                        maxHeight: 1080,
                        quality: 85
                    });
                    fs.writeFileSync(filePath, compressed);
                } else {
                    fs.writeFileSync(filePath, buffer);
                }

                uploadedPaths.push(`/honorsUploads/images/${fileName}`);
            }

            return { success: true, data: { paths: uploadedPaths } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传荣誉视频（支持多个）
    fastify.post('/api/honors/upload-videos', async (request, reply) => {
        try {
            const parts = request.files();
            const uploadedPaths: string[] = [];
            const uploadDir = getUploadDir();

            for await (const part of parts) {
                const buffer = await part.toBuffer();
                const fileName = generateFileName(part.filename);
                const filePath = path.join(uploadDir, 'videos', fileName);

                fs.writeFileSync(filePath, buffer);
                uploadedPaths.push(`/honorsUploads/videos/${fileName}`);
            }

            return { success: true, data: { paths: uploadedPaths } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传录音文件
    fastify.post('/api/honors/upload-recording', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '未上传文件' });
            }

            const buffer = await data.toBuffer();
            const fileName = generateFileName(data.filename || 'recording.webm');
            const uploadDir = getUploadDir();
            const filePath = path.join(uploadDir, 'recordings', fileName);

            fs.writeFileSync(filePath, buffer);

            return {
                success: true,
                data: { path: `/honorsUploads/recordings/${fileName}` }
            };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 辅助接口 ============

    // 获取所有已使用的荣誉类型（用于输入提示）
    fastify.get('/api/honors/types', async (request, reply) => {
        try {
            const types = HonorsManager.getAllHonorTypes();
            return { success: true, data: types };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取播放列表（用于荣誉播放功能）
    fastify.get<{ Params: { hallId: string } }>(
        '/api/honors/halls/:hallId/playlist',
        async (request, reply) => {
            try {
                const honors = HonorsManager.getHonorsByHallId(request.params.hallId);
                // 返回播放所需的数据
                const playlist = honors.map(honor => ({
                    id: honor.id,
                    name: honor.name,
                    images: honor.images,
                    videos: honor.videos,
                    voice_recordings: honor.voice_recordings,
                    description: honor.description,
                    glory_level: honor.glory_level,
                    honor_date: honor.honor_date
                }));
                return { success: true, data: playlist };
            } catch (error) {
                return reply.status(500).send({ success: false, error: String(error) });
            }
        }
    );
}
