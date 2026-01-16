import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compressImageBuffer, isImageFile } from '../utils/imageCompress.js';
import * as KnowledgeManager from '../utils/knowledgeFileManager.js';
import * as KnowledgeIndexManager from '../utils/knowledgeIndexManager.js';
import { getKnowledgeDataPath } from '../utils/deployConfigManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function knowledgeRoutes(fastify: FastifyInstance) {

    // ============ 索引管理 ============

    // 刷新知识库索引
    fastify.post('/api/knowledge/refresh-index', async (request, reply) => {
        try {
            const index = KnowledgeIndexManager.refreshIndex();
            return {
                success: true,
                data: {
                    generated_at: index.generated_at,
                    categories_count: index.categories.length,
                    sections_count: index.sections.length,
                    subsections_count: index.subsections.length,
                    total_items: index.categories.reduce((sum, c) => sum + c.item_count, 0)
                }
            };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取索引信息
    fastify.get('/api/knowledge/index-info', async (request, reply) => {
        try {
            const index = KnowledgeIndexManager.getIndex();
            return {
                success: true,
                data: {
                    version: index.version,
                    generated_at: index.generated_at,
                    categories_count: index.categories.length,
                    sections_count: index.sections.length,
                    subsections_count: index.subsections.length,
                    total_items: index.categories.reduce((sum, c) => sum + c.item_count, 0)
                }
            };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 知识库（一级板块）CRUD ============

    // 获取所有知识库
    fastify.get('/api/knowledge/categories', async (request, reply) => {
        try {
            const categories = KnowledgeManager.getAllCategories();
            return { success: true, data: categories };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个知识库
    fastify.get<{ Params: { id: string } }>('/api/knowledge/categories/:id', async (request, reply) => {
        try {
            const category = KnowledgeManager.getCategoryById(request.params.id);
            if (!category) {
                return reply.status(404).send({ success: false, error: '知识库不存在' });
            }
            return { success: true, data: category };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建知识库
    fastify.post<{ Body: { name: string; description?: string; color?: string; sort_weight?: number; dir_name: string } }>('/api/knowledge/categories', async (request, reply) => {
        try {
            const category = KnowledgeManager.createCategory(request.body);
            return { success: true, data: { id: category.id } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新知识库
    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; color?: string; sort_weight?: number } }>('/api/knowledge/categories/:id', async (request, reply) => {
        try {
            const success = KnowledgeManager.updateCategory(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '知识库不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除知识库
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/categories/:id', async (request, reply) => {
        try {
            const result = KnowledgeManager.deleteCategory(request.params.id);
            if (!result.success) {
                return reply.status(400).send({ success: false, error: result.error });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 二级板块 CRUD ============

    // 获取二级板块列表
    fastify.get<{ Querystring: { categoryId?: string } }>('/api/knowledge/sections', async (request, reply) => {
        try {
            const { categoryId } = request.query;
            if (!categoryId) {
                return { success: true, data: [] };
            }
            const sections = KnowledgeManager.getSectionsByCategory(categoryId);
            return { success: true, data: sections };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取某知识库的所有二级板块
    fastify.get<{ Params: { categoryId: string } }>('/api/knowledge/categories/:categoryId/sections', async (request, reply) => {
        try {
            const sections = KnowledgeManager.getSectionsByCategory(request.params.categoryId);
            return { success: true, data: sections };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个二级板块
    fastify.get<{ Params: { id: string } }>('/api/knowledge/sections/:id', async (request, reply) => {
        try {
            const section = KnowledgeManager.getSectionById(request.params.id);
            if (!section) {
                return reply.status(404).send({ success: false, error: '板块不存在' });
            }
            return { success: true, data: section };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建二级板块
    fastify.post<{ Body: { category_id: string; name: string; description?: string; color?: string; sort_weight?: number; dir_name: string } }>('/api/knowledge/sections', async (request, reply) => {
        try {
            const { category_id, ...data } = request.body;
            const section = KnowledgeManager.createSection(category_id, data);
            return { success: true, data: { id: section.id } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新二级板块
    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; color?: string; sort_weight?: number } }>('/api/knowledge/sections/:id', async (request, reply) => {
        try {
            const success = KnowledgeManager.updateSection(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '板块不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除二级板块
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/sections/:id', async (request, reply) => {
        try {
            const result = KnowledgeManager.deleteSection(request.params.id);
            if (!result.success) {
                return reply.status(400).send({ success: false, error: result.error });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 三级板块 CRUD ============

    // 获取三级板块列表
    fastify.get<{ Querystring: { sectionId?: string } }>('/api/knowledge/subsections', async (request, reply) => {
        try {
            const { sectionId } = request.query;
            if (!sectionId) {
                return { success: true, data: [] };
            }
            const subSections = KnowledgeManager.getSubSectionsBySection(sectionId);
            return { success: true, data: subSections };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个三级板块
    fastify.get<{ Params: { id: string } }>('/api/knowledge/subsections/:id', async (request, reply) => {
        try {
            const subSection = KnowledgeManager.getSubSectionById(request.params.id);
            if (!subSection) {
                return reply.status(404).send({ success: false, error: '三级板块不存在' });
            }
            return { success: true, data: subSection };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建三级板块
    fastify.post<{ Body: { section_id: string; name: string; description?: string; color?: string; sort_weight?: number; dir_name: string } }>('/api/knowledge/subsections', async (request, reply) => {
        try {
            const { section_id, ...data } = request.body;
            const subSection = KnowledgeManager.createSubSection(section_id, data);
            if (!subSection) {
                return reply.status(400).send({ success: false, error: '创建失败' });
            }
            return { success: true, data: { id: subSection.id } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新三级板块
    fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; color?: string; sort_weight?: number } }>('/api/knowledge/subsections/:id', async (request, reply) => {
        try {
            const success = KnowledgeManager.updateSubSection(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '三级板块不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除三级板块
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/subsections/:id', async (request, reply) => {
        try {
            const result = KnowledgeManager.deleteSubSection(request.params.id);
            if (!result.success) {
                return reply.status(400).send({ success: false, error: result.error });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 清空三级板块学习记录
    fastify.put<{ Params: { subsectionId: string } }>('/api/knowledge/subsections/:subsectionId/clear-study-records', async (request, reply) => {
        try {
            KnowledgeManager.clearSubSectionStudyRecords(request.params.subsectionId);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 知识条目 CRUD ============

    // 获取知识条目列表
    fastify.get<{ Querystring: { sectionId?: string; subsectionId?: string } }>('/api/knowledge/items', async (request, reply) => {
        try {
            const { subsectionId } = request.query;
            if (!subsectionId) {
                return { success: true, data: [] };
            }
            const items = KnowledgeManager.getItemsBySubSection(subsectionId);
            return { success: true, data: items };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取某三级板块的所有知识条目
    fastify.get<{ Params: { subsectionId: string } }>('/api/knowledge/subsections/:subsectionId/items', async (request, reply) => {
        try {
            const items = KnowledgeManager.getItemsBySubSection(request.params.subsectionId);
            return { success: true, data: items };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个知识条目
    fastify.get<{ Params: { id: string } }>('/api/knowledge/items/:id', async (request, reply) => {
        try {
            const item = KnowledgeManager.getItemById(request.params.id);
            if (!item) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }
            return { success: true, data: item };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建知识条目
    fastify.post<{ Body: { subsection_id: string; name: string; keywords?: string; brief_note?: string; summary?: string; detail?: string; sort_weight?: number; temp_files?: string[] } }>('/api/knowledge/items', async (request, reply) => {
        try {
            const { subsection_id, ...data } = request.body;
            const item = KnowledgeManager.createItem(subsection_id, data);
            if (!item) {
                return reply.status(400).send({ success: false, error: '创建失败' });
            }
            return { success: true, data: { id: item.id } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新知识条目
    fastify.put<{ Params: { id: string }; Body: { name?: string; keywords?: string; brief_note?: string; summary?: string; detail?: string; sort_weight?: number } }>('/api/knowledge/items/:id', async (request, reply) => {
        try {
            const success = KnowledgeManager.updateItem(request.params.id, request.body);
            if (!success) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除知识条目
    fastify.delete<{ Params: { id: string } }>('/api/knowledge/items/:id', async (request, reply) => {
        try {
            const result = KnowledgeManager.deleteItem(request.params.id);
            if (!result.success) {
                return reply.status(400).send({ success: false, error: result.error });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新学习记录 (POST)
    fastify.post<{ Params: { id: string }; Body: { isCorrect: boolean } }>('/api/knowledge/items/:id/study', async (request, reply) => {
        try {
            const { isCorrect } = request.body;
            const success = KnowledgeManager.updateItemStudy(request.params.id, isCorrect);
            if (!success) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新学习记录 (PUT)
    fastify.put<{ Params: { id: string }; Body: { result: 'correct' | 'wrong' | 'skip' } }>('/api/knowledge/items/:id/study', async (request, reply) => {
        try {
            const { result } = request.body;
            if (result === 'skip') {
                return { success: true };
            }
            const success = KnowledgeManager.updateItemStudy(request.params.id, result === 'correct');
            if (!success) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 清空单个条目的学习记录
    fastify.put<{ Params: { id: string } }>('/api/knowledge/items/:id/clear-study-record', async (request, reply) => {
        try {
            const success = KnowledgeManager.clearItemStudyRecord(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '知识条目不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 文件上传 ============

    // 上传知识库/板块Logo
    fastify.post<{ Querystring: { targetType: 'category' | 'section' | 'subsection'; targetId: string } }>('/api/upload/knowledge-logo', async (request, reply) => {
        try {
            const { targetType, targetId } = request.query;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            let targetPath: string | null = null;
            if (targetType === 'category') {
                targetPath = KnowledgeManager.getCategoryPath(targetId);
            } else if (targetType === 'section') {
                targetPath = KnowledgeManager.getSectionPath(targetId);
            } else if (targetType === 'subsection') {
                targetPath = KnowledgeManager.getSubSectionPath(targetId);
            }

            if (!targetPath) {
                // 如果没有指定目标，保存到临时目录
                targetPath = path.join(getKnowledgeDataPath(), '.temp');
                if (!fs.existsSync(targetPath)) {
                    fs.mkdirSync(targetPath, { recursive: true });
                }
            }

            const extname = path.extname(data.filename).toLowerCase() || '.png';
            const filename = `icon${extname}`;
            const filepath = path.join(targetPath, filename);

            // 删除旧的icon文件
            const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
            for (const ext of extensions) {
                const oldPath = path.join(targetPath, `icon.${ext}`);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // 读取并压缩图片
            let buffer = await data.toBuffer();
            if (isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const projectRoot = path.join(__dirname, '../../../');
            const relativePath = path.relative(projectRoot, filepath);
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传知识条目媒体文件
    fastify.post<{ Querystring: { itemId: string; type: 'image' | 'audio' | 'video' } }>('/api/upload/knowledge-media', async (request, reply) => {
        try {
            const { itemId, type } = request.query;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const itemPath = KnowledgeManager.getItemPath(itemId);
            if (!itemPath) {
                return reply.status(400).send({ success: false, error: '无效的知识条目ID' });
            }

            if (!fs.existsSync(itemPath)) {
                fs.mkdirSync(itemPath, { recursive: true });
            }

            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const prefix = type === 'image' ? 'img' : type === 'audio' ? 'aud' : 'vid';
            const filename = `${prefix}_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(itemPath, filename);

            // 读取文件，对图片进行压缩
            let buffer = await data.toBuffer();
            if (type === 'image' && isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            // 更新config.json中的文件列表
            KnowledgeManager.addMediaToItem(itemId, type, filename);

            const projectRoot = path.join(__dirname, '../../../');
            const relativePath = path.relative(projectRoot, filepath);
            return { success: true, data: { path: relativePath, filename } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除知识条目媒体文件
    fastify.delete<{ Querystring: { itemId: string; type: 'image' | 'audio' | 'video'; filename: string } }>('/api/upload/knowledge-media', async (request, reply) => {
        try {
            const { itemId, type, filename } = request.query;
            const success = KnowledgeManager.removeMediaFromItem(itemId, type, filename);
            if (!success) {
                return reply.status(400).send({ success: false, error: '删除失败' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 临时文件上传 ============

    // 上传临时文件（用于新建知识条目时先上传媒体文件）
    fastify.post<{ Querystring: { type: 'image' | 'audio' | 'video' } }>('/api/upload/knowledge-temp', async (request, reply) => {
        try {
            const { type } = request.query;
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const tempDir = KnowledgeManager.getTempDir();
            const filename = KnowledgeManager.generateTempFileName(type, data.filename);
            const filepath = path.join(tempDir, filename);

            // 读取文件，对图片进行压缩
            let buffer = await data.toBuffer();
            if (type === 'image' && isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const relativePath = KnowledgeManager.getTempFileRelativePath(filename);
            return { success: true, data: { path: relativePath, filename } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除临时文件
    fastify.delete<{ Querystring: { filename: string } }>('/api/upload/knowledge-temp', async (request, reply) => {
        try {
            const { filename } = request.query;
            KnowledgeManager.cleanupTempFiles([filename]);
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 清理过期临时文件
    fastify.post('/api/upload/knowledge-temp/cleanup', async (request, reply) => {
        try {
            const cleaned = KnowledgeManager.cleanupExpiredTempFiles();
            return { success: true, data: { cleaned } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
