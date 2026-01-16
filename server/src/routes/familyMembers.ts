import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compressImageBuffer, isImageFile } from '../utils/imageCompress.js';
import * as FamilyMembersManager from '../utils/familyMembersFileManager.js';
import { getFamilyMembersDataPath } from '../utils/deployConfigManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取成员上传目录
function getMembersUploadDir(): string {
    return path.join(getFamilyMembersDataPath(), 'uploads');
}

// 类型定义
interface FamilyMemberInput {
    nickname: string;
    name?: string;
    birthday_text?: string;
    birthday_date?: string;
    zodiac_sign?: string;
    chinese_zodiac?: string;
    avatar_path?: string;
    gender?: string;
    sort_weight?: number;
}

interface AttributeDefinitionInput {
    attribute_name: string;
    attribute_type: 'integer' | 'string' | 'decimal' | 'checkbox' | 'image';
    options?: string;
    attribute_logo?: string;
    sort_weight?: number;
}

interface AttributeValueInput {
    member_id: string;
    attribute_id: string;
    value_text?: string;
    value_number?: number;
    value_boolean?: number;
    value_image?: string;
}

export default async function familyMembersRoutes(fastify: FastifyInstance) {

    // ============ 家庭成员 CRUD ============

    // 获取所有家庭成员（按权重排序）
    fastify.get('/api/family-members', async (request, reply) => {
        try {
            const members = FamilyMembersManager.getAllMembers();
            return { success: true, data: members };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取单个家庭成员
    fastify.get<{ Params: { id: string } }>('/api/family-members/:id', async (request, reply) => {
        try {
            const member = FamilyMembersManager.getMemberById(request.params.id);
            if (!member) {
                return reply.status(404).send({ success: false, error: '成员不存在' });
            }
            return { success: true, data: member };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建家庭成员
    fastify.post<{ Body: FamilyMemberInput }>('/api/family-members', async (request, reply) => {
        try {
            const { nickname, name, birthday_text, birthday_date, zodiac_sign, chinese_zodiac, avatar_path, gender, sort_weight } = request.body;

            // 检查昵称是否重复
            const existing = FamilyMembersManager.getMemberByNickname(nickname);
            if (existing) {
                return reply.status(400).send({ success: false, error: '昵称已存在' });
            }

            const member = FamilyMembersManager.createMember({
                nickname,
                name,
                birthday_text,
                birthday_date,
                zodiac_sign,
                chinese_zodiac,
                avatar_path,
                gender,
                sort_weight
            });

            return { success: true, data: { id: member.id } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新家庭成员
    fastify.put<{ Params: { id: string }; Body: FamilyMemberInput }>('/api/family-members/:id', async (request, reply) => {
        try {
            const { nickname, name, birthday_text, birthday_date, zodiac_sign, chinese_zodiac, avatar_path, gender, sort_weight } = request.body;

            // 检查昵称是否与其他成员重复
            const existing = FamilyMembersManager.getMemberByNickname(nickname);
            if (existing && existing.id !== request.params.id) {
                return reply.status(400).send({ success: false, error: '昵称已存在' });
            }

            const success = FamilyMembersManager.updateMember(request.params.id, {
                nickname,
                name,
                birthday_text,
                birthday_date,
                zodiac_sign,
                chinese_zodiac,
                avatar_path,
                gender,
                sort_weight: sort_weight || 0
            });

            if (!success) {
                return reply.status(404).send({ success: false, error: '成员不存在' });
            }

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除家庭成员
    fastify.delete<{ Params: { id: string } }>('/api/family-members/:id', async (request, reply) => {
        try {
            const success = FamilyMembersManager.deleteMember(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '成员不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 属性定义 CRUD ============

    // 获取所有属性定义（按权重排序）
    fastify.get('/api/member-attributes', async (request, reply) => {
        try {
            const attributes = FamilyMembersManager.getAllAttributeDefinitions();
            return { success: true, data: attributes };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 创建属性定义
    fastify.post<{ Body: AttributeDefinitionInput }>('/api/member-attributes', async (request, reply) => {
        try {
            const { attribute_name, attribute_type, options, attribute_logo, sort_weight } = request.body;

            // 检查属性名是否重复
            const existing = FamilyMembersManager.getAttributeDefinitionByName(attribute_name);
            if (existing) {
                return reply.status(400).send({ success: false, error: '属性名已存在' });
            }

            const definition = FamilyMembersManager.createAttributeDefinition({
                attribute_name,
                attribute_type,
                options,
                attribute_logo,
                sort_weight
            });

            return { success: true, data: { id: definition.id } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 更新属性定义
    fastify.put<{ Params: { id: string }; Body: AttributeDefinitionInput }>('/api/member-attributes/:id', async (request, reply) => {
        try {
            const { attribute_name, attribute_type, options, attribute_logo, sort_weight } = request.body;

            // 检查属性名是否与其他属性重复
            const existing = FamilyMembersManager.getAttributeDefinitionByName(attribute_name);
            if (existing && existing.id !== request.params.id) {
                return reply.status(400).send({ success: false, error: '属性名已存在' });
            }

            const success = FamilyMembersManager.updateAttributeDefinition(request.params.id, {
                attribute_name,
                attribute_type,
                options,
                attribute_logo,
                sort_weight: sort_weight || 0
            });

            if (!success) {
                return reply.status(404).send({ success: false, error: '属性不存在' });
            }

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除属性定义
    fastify.delete<{ Params: { id: string } }>('/api/member-attributes/:id', async (request, reply) => {
        try {
            const success = FamilyMembersManager.deleteAttributeDefinition(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '属性不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 属性值 CRUD ============

    // 获取指定成员的所有属性值
    fastify.get<{ Params: { memberId: string } }>('/api/family-members/:memberId/attributes', async (request, reply) => {
        try {
            const values = FamilyMembersManager.getAttributeValuesByMember(request.params.memberId);
            return { success: true, data: values };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 获取所有成员的所有属性值（用于表格展示）
    fastify.get('/api/member-attribute-values', async (request, reply) => {
        try {
            const values = FamilyMembersManager.getAllAttributeValuesWithDetails();
            return { success: true, data: values };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 设置或更新属性值
    fastify.post<{ Body: AttributeValueInput }>('/api/member-attribute-values', async (request, reply) => {
        try {
            const { member_id, attribute_id, value_text, value_number, value_boolean, value_image } = request.body;

            FamilyMembersManager.setAttributeValue({
                member_id,
                attribute_id,
                value_text,
                value_number,
                value_boolean,
                value_image
            });

            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 删除属性值
    fastify.delete<{ Params: { id: string } }>('/api/member-attribute-values/:id', async (request, reply) => {
        try {
            const success = FamilyMembersManager.deleteAttributeValue(request.params.id);
            if (!success) {
                return reply.status(404).send({ success: false, error: '属性值不存在' });
            }
            return { success: true };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // ============ 文件上传 ============

    // 上传成员头像
    fastify.post('/api/upload/avatar', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(getMembersUploadDir(), 'avatars');

            // 确保目录存在
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `avatar_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 读取并压缩图片
            let buffer = await data.toBuffer();
            if (isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const relativePath = `membersUploads/avatars/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传属性Logo
    fastify.post('/api/upload/logo', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(getMembersUploadDir(), 'logos');

            // 确保目录存在
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `logo_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 读取并压缩图片
            let buffer = await data.toBuffer();
            if (isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const relativePath = `membersUploads/logos/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });

    // 上传属性值图片
    fastify.post('/api/upload/attribute', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ success: false, error: '没有文件上传' });
            }

            const uploadDir = path.join(getMembersUploadDir(), 'attributes');

            // 确保目录存在
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const extname = path.extname(data.filename);
            const filename = `attr_${timestamp}_${Math.random().toString(36).substring(7)}${extname}`;
            const filepath = path.join(uploadDir, filename);

            // 读取并压缩图片
            let buffer = await data.toBuffer();
            if (isImageFile(data.filename)) {
                buffer = await compressImageBuffer(buffer, data.filename, { quality: 70 });
            }
            fs.writeFileSync(filepath, buffer);

            const relativePath = `membersUploads/attributes/${filename}`;
            return { success: true, data: { path: relativePath } };
        } catch (error) {
            return reply.status(500).send({ success: false, error: String(error) });
        }
    });
}
