#!/bin/bash

# 家用小工具启动脚本
# 此脚本会杀掉现有进程并启动前后端服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

echo "🏠 家用小工具启动脚本"
echo "================================"
echo "项目目录: $PROJECT_DIR"
echo ""

# 杀掉现有的 Node.js 进程
echo "⏹️  停止现有服务..."
pkill -f "homework-server" 2>/dev/null || true
pkill -f "node.*server/dist" 2>/dev/null || true

# 等待进程完全退出
sleep 1

# 进入服务端目录
cd "$PROJECT_DIR/server"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装服务端依赖..."
    npm install
fi

# 构建服务端
echo "🔨 构建服务端..."
npm run build

# 进入客户端目录
cd "$PROJECT_DIR/client"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装客户端依赖..."
    npm install
fi

# 构建客户端
echo "🔨 构建客户端..."
npm run build

# 初始化数据库（如果需要）
cd "$PROJECT_DIR/server"
if [ ! -f "$PROJECT_DIR/data/homework.db" ]; then
    echo "🗄️  初始化数据库..."
    npx tsx "$PROJECT_DIR/scripts/init-db.ts"
fi

# 启动服务端（后台运行）
echo "🚀 启动服务..."
nohup node dist/index.js > "$LOG_DIR/server.log" 2>&1 &

# 等待服务启动
sleep 2

# 检查服务是否启动成功
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo ""
    echo "================================"
    echo "✅ 服务启动成功!"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📝 日志文件: $LOG_DIR/server.log"
    echo "================================"
else
    echo ""
    echo "❌ 服务启动失败，请检查日志: $LOG_DIR/server.log"
    exit 1
fi
