# 家用小工具

> 🏠 一个温馨的家庭助手应用，让生活更有条理、更有趣！

## 功能模块

| 模块       | 说明               | 路由         |
| ---------- | ------------------ | ------------ |
| 🏠 首页     | 快捷入口、今日概览 | `/`          |
| 👨‍👩‍👧‍👦 家庭成员 | 管理家庭成员信息   | `/family`    |
| ✅ 待做任务 | 日常任务管理       | `/todos`     |
| 📚 知识库   | 家庭知识分享       | `/knowledge` |
| 📝 木木日记 | 记录生活点滴       | `/diary`     |
| 🔄 周期任务 | 定期提醒事项       | `/periodic`  |
| 🎮 游戏空间 | 益智小游戏         | `/games`     |
| ⭐ 我的收藏 | 收藏喜欢的内容     | `/favorites` |
| 📈 成长轨迹 | 记录成长历程       | `/growth`    |

## 技术栈

- **前端**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS + Lucide Icons
- **后端**: Fastify + TypeScript
- **数据库**: SQLite (better-sqlite3)

## 快速开始

### 开发模式

```bash
# 安装所有依赖
npm run install:all

# 初始化数据库
npm run db:init

# 启动开发服务
npm run dev
```

前端开发服务: http://localhost:5173
后端 API 服务: http://localhost:3000

### 生产部署

```bash
# 一键启动（构建 + 部署）
./deployScript/startAll.sh
```

访问地址: http://localhost:3000

## 目录结构

```
homework/
├── client/              # 前端项目 (React + Vite)
│   ├── src/
│   │   ├── components/  # 公共组件
│   │   ├── pages/       # 页面组件
│   │   ├── lib/         # 工具函数
│   │   └── App.tsx      # 路由配置
│   └── dist/            # 构建产物
├── server/              # 后端项目 (Fastify)
│   ├── src/
│   │   ├── db/          # 数据库相关
│   │   └── index.ts     # 服务入口
│   └── dist/            # 构建产物
├── configs/             # 配置文件
│   ├── config.json      # 静态配置
│   └── deployConfig.json # 部署配置
├── dbInit/              # 数据库初始化
│   ├── db_init_all.sql  # 完整初始化脚本
│   └── update_step/     # 增量更新脚本
├── dbBackup/            # 数据库备份
├── deployScript/        # 部署脚本
│   └── startAll.sh      # 一键启动脚本
├── logs/                # 日志文件
├── scripts/             # 工具脚本
│   └── init-db.ts       # 数据库初始化
├── uploadFiles/         # 上传文件
│   ├── gameFiles/       # 游戏文件
│   ├── knowledgeFiles/  # 知识库文件
│   └── userFiles/       # 用户文件
├── tempFiles/           # 临时文件
├── utils/               # 工具类
├── aiRules/             # AI编程规则
└── api-docs/            # API文档
```

#### configs
- 一些配置文件存放于此，里面包含两个文件
  - config.json: 用于存放一些静态配置，通常不同的部署环境此文件是相同的
  - deployConfig.json: 用于存放一些部署信息，通常不同的部署环境此文件是不同的

#### logs
- 日志文件存放目录

#### subRule
- 一些子规则存放目录，项目不建议将所有的代码都集中放置，可以按需拆分为多个文件放入到subRules的对应文件中

#### utils
- 一些工具类函数存放目录

#### dbBackup
- 一些数据库备份文件存放目录，系统定期创建数据库备份

#### dbInit
- 一些数据库初始化sql文件存放目录
  - db_init_all.sql 所有数据库内容初始化文件
  - update_step目录，某些开发需要二次改动数据库，将数据库的增量改动放在此目录下，按01-xx.sql命名，如01-user-tablesql,02-role-table.sql

#### uploadFiles
- 上传的文件

#### tempFiles
- 临时文件（可删除）

#### aiRules
- AI规则存放目录，此目录下的文件会自动被AI识别并作为规则使用

#### api-docs：
- 一些对外的交互的说明文档存放在此处，供AI Coding时模型参考，此部分的所有文件不直接参与运行
