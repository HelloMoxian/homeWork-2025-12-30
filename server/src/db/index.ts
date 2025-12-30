import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../data/homework.db');
const DB_INIT_SQL_PATH = path.join(__dirname, '../../../dbInit/db_init_all.sql');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
    if (!db) {
        // 确保数据目录存在
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

export async function initDatabase(): Promise<void> {
    const database = getDatabase();

    // 检查是否需要初始化
    const tableCheck = database.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='app_config'"
    ).get();

    if (!tableCheck) {
        console.log('📦 正在初始化数据库...');

        if (fs.existsSync(DB_INIT_SQL_PATH)) {
            const initSql = fs.readFileSync(DB_INIT_SQL_PATH, 'utf-8');
            database.exec(initSql);
            console.log('✅ 数据库初始化完成');
        } else {
            // 创建基础表结构
            database.exec(`
        CREATE TABLE IF NOT EXISTS app_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          config_key TEXT UNIQUE NOT NULL,
          config_value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        INSERT INTO app_config (config_key, config_value) VALUES ('app_version', '1.0.0');
      `);
            console.log('✅ 数据库基础表创建完成');
        }
    }
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}
