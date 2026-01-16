import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getKnowledgeDataPath } from './deployConfigManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取知识库根目录（从配置读取）
function getKnowledgeRoot(): string {
    return getKnowledgeDataPath();
}

// 获取索引文件路径（存储在知识库数据目录下）
function getIndexFilePath(): string {
    return path.join(getKnowledgeDataPath(), 'knowledgeIndex.json');
}

// ============ 索引数据类型 ============

export interface CategoryIndex {
    id: string;
    name: string;
    description?: string;
    color?: string;
    sort_weight: number;
    dir_name: string;
    section_count: number;
    item_count: number;
    created_at?: string;
    updated_at?: string;
    logo_path?: string;
}

export interface SectionIndex {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    color?: string;
    sort_weight: number;
    dir_name: string;
    subsection_count: number;
    item_count: number;
    created_at?: string;
    updated_at?: string;
    logo_path?: string;
}

export interface SubSectionIndex {
    id: string;
    section_id: string;
    category_id: string;
    name: string;
    description?: string;
    color?: string;
    sort_weight: number;
    dir_name: string;
    item_count: number;
    created_at?: string;
    updated_at?: string;
    logo_path?: string;
}

export interface KnowledgeIndex {
    version: string;
    generated_at: string;
    categories: CategoryIndex[];
    sections: SectionIndex[];
    subsections: SubSectionIndex[];
}

// 内存缓存
let indexCache: KnowledgeIndex | null = null;

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

function findIconFile(dirPath: string): string | undefined {
    const extensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
    for (const ext of extensions) {
        const iconPath = path.join(dirPath, `icon.${ext}`);
        if (fs.existsSync(iconPath)) {
            return iconPath;
        }
    }
    return undefined;
}

function getRelativePath(absolutePath: string): string {
    const projectRoot = path.join(__dirname, '../../../');
    return path.relative(projectRoot, absolutePath);
}

// ============ 索引生成与管理 ============

/**
 * 扫描目录生成完整索引
 */
export function generateIndex(): KnowledgeIndex {
    console.log('🔄 开始生成知识库索引...');
    const startTime = Date.now();

    const knowledgeRoot = getKnowledgeRoot();
    ensureDir(knowledgeRoot);

    const categories: CategoryIndex[] = [];
    const sections: SectionIndex[] = [];
    const subsections: SubSectionIndex[] = [];

    const categoryDirs = getDirectories(knowledgeRoot);

    for (const categoryDir of categoryDirs) {
        const categoryPath = path.join(knowledgeRoot, categoryDir);
        const categoryConfigPath = path.join(categoryPath, 'config.json');
        const categoryConfig = readJsonFile<any>(categoryConfigPath);

        if (!categoryConfig) continue;

        const iconPath = findIconFile(categoryPath);
        let categoryItemCount = 0;
        let sectionCount = 0;

        const sectionDirs = getDirectories(categoryPath);

        for (const sectionDir of sectionDirs) {
            const sectionPath = path.join(categoryPath, sectionDir);
            const sectionConfigPath = path.join(sectionPath, 'config.json');
            const sectionConfig = readJsonFile<any>(sectionConfigPath);

            if (!sectionConfig) continue;

            sectionCount++;
            const sectionIconPath = findIconFile(sectionPath);
            let sectionItemCount = 0;
            let subsectionCount = 0;

            const subsectionDirs = getDirectories(sectionPath);

            for (const subsectionDir of subsectionDirs) {
                const subsectionPath = path.join(sectionPath, subsectionDir);
                const subsectionConfigPath = path.join(subsectionPath, 'config.json');
                const subsectionConfig = readJsonFile<any>(subsectionConfigPath);

                if (!subsectionConfig) continue;

                subsectionCount++;
                const subsectionIconPath = findIconFile(subsectionPath);

                // 统计知识条目
                const itemDirs = getDirectories(subsectionPath);
                let itemCount = 0;
                for (const itemDir of itemDirs) {
                    const itemConfigPath = path.join(subsectionPath, itemDir, 'config.json');
                    if (fs.existsSync(itemConfigPath)) {
                        itemCount++;
                    }
                }

                subsections.push({
                    id: `${categoryDir}/${sectionDir}/${subsectionDir}`,
                    section_id: `${categoryDir}/${sectionDir}`,
                    category_id: categoryDir,
                    name: subsectionConfig.name,
                    description: subsectionConfig.description,
                    color: subsectionConfig.color || '#10B981',
                    sort_weight: subsectionConfig.sort_weight || 0,
                    dir_name: subsectionDir,
                    item_count: itemCount,
                    created_at: subsectionConfig.created_at,
                    updated_at: subsectionConfig.updated_at,
                    logo_path: subsectionIconPath ? getRelativePath(subsectionIconPath) : undefined
                });

                sectionItemCount += itemCount;
            }

            sections.push({
                id: `${categoryDir}/${sectionDir}`,
                category_id: categoryDir,
                name: sectionConfig.name,
                description: sectionConfig.description,
                color: sectionConfig.color || '#8B5CF6',
                sort_weight: sectionConfig.sort_weight || 0,
                dir_name: sectionDir,
                subsection_count: subsectionCount,
                item_count: sectionItemCount,
                created_at: sectionConfig.created_at,
                updated_at: sectionConfig.updated_at,
                logo_path: sectionIconPath ? getRelativePath(sectionIconPath) : undefined
            });

            categoryItemCount += sectionItemCount;
        }

        categories.push({
            id: categoryDir,
            name: categoryConfig.name,
            description: categoryConfig.description,
            color: categoryConfig.color || '#3B82F6',
            sort_weight: categoryConfig.sort_weight || 0,
            dir_name: categoryDir,
            section_count: sectionCount,
            item_count: categoryItemCount,
            created_at: categoryConfig.created_at,
            updated_at: categoryConfig.updated_at,
            logo_path: iconPath ? getRelativePath(iconPath) : undefined
        });
    }

    // 排序
    categories.sort((a, b) => a.sort_weight - b.sort_weight);
    sections.sort((a, b) => a.sort_weight - b.sort_weight);
    subsections.sort((a, b) => a.sort_weight - b.sort_weight);

    const index: KnowledgeIndex = {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        categories,
        sections,
        subsections
    };

    const endTime = Date.now();
    console.log(`✅ 知识库索引生成完成，耗时 ${endTime - startTime}ms`);
    console.log(`   - 一级板块: ${categories.length}`);
    console.log(`   - 二级板块: ${sections.length}`);
    console.log(`   - 三级板块: ${subsections.length}`);
    console.log(`   - 总知识条目: ${categories.reduce((sum, c) => sum + c.item_count, 0)}`);

    // 保存到文件
    writeJsonFile(getIndexFilePath(), index);

    // 更新缓存
    indexCache = index;

    return index;
}

/**
 * 从文件加载索引
 */
export function loadIndex(): KnowledgeIndex | null {
    if (indexCache) {
        return indexCache;
    }

    const index = readJsonFile<KnowledgeIndex>(getIndexFilePath());
    if (index) {
        indexCache = index;
    }
    return index;
}

/**
 * 获取索引（如果不存在则生成）
 */
export function getIndex(): KnowledgeIndex {
    let index = loadIndex();
    if (!index) {
        index = generateIndex();
    }
    return index;
}

/**
 * 刷新索引
 */
export function refreshIndex(): KnowledgeIndex {
    return generateIndex();
}

/**
 * 获取所有分类（从索引）
 */
export function getCategoriesFromIndex(): CategoryIndex[] {
    return getIndex().categories;
}

/**
 * 获取指定分类的二级板块（从索引）
 */
export function getSectionsFromIndex(categoryId: string): SectionIndex[] {
    return getIndex().sections.filter(s => s.category_id === categoryId);
}

/**
 * 获取指定二级板块的三级板块（从索引）
 */
export function getSubSectionsFromIndex(sectionId: string): SubSectionIndex[] {
    return getIndex().subsections.filter(s => s.section_id === sectionId);
}

/**
 * 清除缓存
 */
export function clearIndexCache(): void {
    indexCache = null;
}

/**
 * 初始化：服务启动时调用
 */
export function initializeIndex(): void {
    console.log('🚀 初始化知识库索引...');
    const index = loadIndex();
    if (!index) {
        generateIndex();
    } else {
        console.log(`📚 已加载知识库索引，生成时间: ${index.generated_at}`);
        console.log(`   - 一级板块: ${index.categories.length}`);
        console.log(`   - 二级板块: ${index.sections.length}`);
        console.log(`   - 三级板块: ${index.subsections.length}`);
    }
}
