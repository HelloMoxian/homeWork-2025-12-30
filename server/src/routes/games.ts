import { FastifyPluginAsync } from 'fastify';
import {
    getGamesList,
    getAllGameStats,
    getGameStats,
    updateGameStats,
    getGameSave,
    saveGame,
    deleteGameSave,
    get2048StyleGroups,
    save2048StyleGroup,
    delete2048StyleGroup,
    getDanceTemplates,
    addDanceTemplate,
    deleteDanceTemplate
} from '../utils/gamesManager.js';
import { getGamesDataPath } from '../utils/deployConfigManager.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取跳舞上传目录
function getFollowDanceUploadDir(): string {
    return path.join(getGamesDataPath(), 'uploads', 'followDance');
}

const gamesRoutes: FastifyPluginAsync = async (fastify) => {
    // 获取游戏列表
    fastify.get('/api/games/list', async (request, reply) => {
        try {
            const games = getGamesList();
            return { success: true, data: games };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '获取游戏列表失败' });
        }
    });

    // 获取所有游戏统计
    fastify.get('/api/games/stats', async (request, reply) => {
        try {
            const stats = getAllGameStats();
            return { success: true, data: stats };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '获取统计数据失败' });
        }
    });

    // 获取单个游戏统计
    fastify.get<{
        Params: { gameId: string }
    }>('/api/games/stats/:gameId', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const stats = getGameStats(gameId);

            if (!stats) {
                return {
                    success: true, data: {
                        gameCount: 0,
                        totalPlayTime: 0,
                        todayPlayTime: 0,
                        highestScore: 0,
                        todayHighestScore: 0,
                        lastPlayDate: '',
                        todayDate: ''
                    }
                };
            }

            return { success: true, data: stats };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '获取游戏统计失败' });
        }
    });

    // 上报游戏数据
    fastify.post<{
        Body: {
            gameId: string;
            score: number;
            playTime: number;
        }
    }>('/api/games/report', async (request, reply) => {
        try {
            const { gameId, score, playTime } = request.body;

            if (!gameId || score === undefined || playTime === undefined) {
                return reply.status(400).send({
                    success: false,
                    error: '缺少必要参数'
                });
            }

            const stats = updateGameStats(gameId, score, playTime);
            return { success: true, data: stats };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '上报数据失败' });
        }
    });

    // 保存游戏存档
    fastify.post<{
        Body: {
            gameId: string;
            gameData: any;
        }
    }>('/api/games/save', async (request, reply) => {
        try {
            const { gameId, gameData } = request.body;

            if (!gameId || !gameData) {
                return reply.status(400).send({
                    success: false,
                    error: '缺少必要参数'
                });
            }

            const save = saveGame(gameId, gameData);
            return { success: true, data: save };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '保存游戏失败' });
        }
    });

    // 获取游戏存档
    fastify.get<{
        Params: { gameId: string }
    }>('/api/games/save/:gameId', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const save = getGameSave(gameId);

            if (!save) {
                return { success: false, message: '没有存档' };
            }

            return { success: true, data: save };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '获取存档失败' });
        }
    });

    // 删除游戏存档
    fastify.delete<{
        Params: { gameId: string }
    }>('/api/games/save/:gameId', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const result = deleteGameSave(gameId);

            if (!result) {
                return { success: false, message: '存档不存在' };
            }

            return { success: true, message: '删除成功' };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '删除存档失败' });
        }
    });

    // ============ 2048 样式组接口 ============

    // 获取所有样式组
    fastify.get('/api/games/2048/styles', async (request, reply) => {
        try {
            const styles = get2048StyleGroups();
            return { success: true, data: styles };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '获取样式组失败' });
        }
    });

    // 保存样式组
    fastify.post<{
        Body: { id: string; name: string;[key: string]: any }
    }>('/api/games/2048/styles', async (request, reply) => {
        try {
            const styleGroup = request.body;
            if (!styleGroup.id || !styleGroup.name) {
                return reply.status(400).send({ success: false, error: '缺少必要参数' });
            }
            const result = save2048StyleGroup(styleGroup);
            return { success: true, data: result };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '保存样式组失败' });
        }
    });

    // 删除样式组
    fastify.delete<{
        Params: { styleId: string }
    }>('/api/games/2048/styles/:styleId', async (request, reply) => {
        try {
            const { styleId } = request.params;
            const result = delete2048StyleGroup(styleId);

            if (!result) {
                return { success: false, message: '无法删除默认样式或样式不存在' };
            }

            return { success: true, message: '删除成功' };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '删除样式组失败' });
        }
    });

    // ============ 跟随跳舞接口 ============

    // 获取所有跳舞模板
    fastify.get('/api/games/followDance/templates', async (request, reply) => {
        try {
            const templates = getDanceTemplates();
            return { success: true, data: templates };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '获取模板失败' });
        }
    });

    // 上传跳舞模板
    fastify.post('/api/games/followDance/templates', async (request, reply) => {
        try {
            const parts = request.parts();
            let name = '';
            let videoPath = '';
            let coverPath = '';
            const templateId = randomUUID();

            // 确保上传目录存在
            const uploadDir = getFollowDanceUploadDir();
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for await (const part of parts) {
                if (part.type === 'field') {
                    if (part.fieldname === 'name') {
                        name = part.value as string;
                    }
                } else if (part.type === 'file') {
                    const ext = path.extname(part.filename || '');
                    if (part.fieldname === 'video') {
                        const filename = `${templateId}_video${ext}`;
                        const filePath = path.join(uploadDir, filename);
                        await pipeline(part.file, fs.createWriteStream(filePath));
                        videoPath = `/gameUploads/followDance/${filename}`;
                    } else if (part.fieldname === 'cover') {
                        const filename = `${templateId}_cover${ext}`;
                        const filePath = path.join(uploadDir, filename);
                        await pipeline(part.file, fs.createWriteStream(filePath));
                        coverPath = `/gameUploads/followDance/${filename}`;
                    }
                }
            }

            if (!name || !videoPath) {
                return reply.status(400).send({ success: false, error: '缺少必要参数' });
            }

            const template = {
                id: templateId,
                name,
                videoUrl: videoPath,
                coverUrl: coverPath || undefined,
                createTime: new Date().toISOString()
            };

            addDanceTemplate(template);
            return { success: true, data: template };
        } catch (error) {
            console.error('上传模板失败:', error);
            return reply.status(500).send({ success: false, error: '上传模板失败' });
        }
    });

    // 删除跳舞模板
    fastify.delete<{
        Params: { templateId: string }
    }>('/api/games/followDance/templates/:templateId', async (request, reply) => {
        try {
            const { templateId } = request.params;
            const template = deleteDanceTemplate(templateId);

            if (!template) {
                return { success: false, message: '模板不存在' };
            }

            // 删除相关文件
            const uploadDir = getFollowDanceUploadDir();
            if (template.videoUrl) {
                const videoFile = path.join(uploadDir, path.basename(template.videoUrl));
                if (fs.existsSync(videoFile)) {
                    fs.unlinkSync(videoFile);
                }
            }
            if (template.coverUrl) {
                const coverFile = path.join(uploadDir, path.basename(template.coverUrl));
                if (fs.existsSync(coverFile)) {
                    fs.unlinkSync(coverFile);
                }
            }

            return { success: true, message: '删除成功' };
        } catch (error) {
            return reply.status(500).send({ success: false, error: '删除模板失败' });
        }
    });
};

export default gamesRoutes;
