import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/homework.db');
const DB_INIT_SQL_PATH = path.join(__dirname, '../dbInit/db_init_all.sql');
const DB_UPDATE_DIR = path.join(__dirname, '../dbInit/update_step');
const BACKUP_DIR = path.join(__dirname, '../dbBackup');

async function initDatabase() {
    console.log('🚀 开始初始化数据库...');

    // 确保数据目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 创建数据目录:', dataDir);
    }

    // 如果数据库已存在，先备份
    if (fs.existsSync(DB_PATH)) {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `homework_${timestamp}.db`);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log('💾 已备份现有数据库到:', backupPath);

        // 删除旧数据库
        fs.unlinkSync(DB_PATH);
    }

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    // 执行初始化SQL
    if (fs.existsSync(DB_INIT_SQL_PATH)) {
        const initSql = fs.readFileSync(DB_INIT_SQL_PATH, 'utf-8');
        db.exec(initSql);
        console.log('✅ 执行初始化SQL完成');
    } else {
        console.error('❌ 初始化SQL文件不存在:', DB_INIT_SQL_PATH);
        process.exit(1);
    }

    // 执行增量更新SQL
    if (fs.existsSync(DB_UPDATE_DIR)) {
        const updateFiles = fs.readdirSync(DB_UPDATE_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of updateFiles) {
            const filePath = path.join(DB_UPDATE_DIR, file);
            const sql = fs.readFileSync(filePath, 'utf-8');
            db.exec(sql);
            console.log('📝 执行更新脚本:', file);
        }
    }

    db.close();
    console.log('🎉 数据库初始化完成!');
}

initDatabase().catch(console.error);
