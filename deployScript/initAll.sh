#!/bin/bash

# =============================================================================
# 家用小工具 - 环境初始化脚本
# 功能：初始化依赖环境、Node 环境、目录结构（无需数据库）
# 创建时间: 2025-12-30
# 更新时间: 2026-01-12 - 移除SQLite相关逻辑，改用文件存储
# =============================================================================

set -e  # 遇到错误立即退出

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
FILE_DB_DIR="$PROJECT_DIR/fileDB"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# =============================================================================
# 检查系统依赖
# =============================================================================
check_system_dependencies() {
    echo ""
    echo "=============================================="
    echo "📋 检查系统依赖..."
    echo "=============================================="
    
    local missing_deps=()
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js 已安装: $node_version"
        
        # 检查 Node.js 版本是否 >= 18
        local major_version=$(echo $node_version | cut -d'.' -f1 | tr -d 'v')
        if [ "$major_version" -lt 18 ]; then
            print_warning "建议使用 Node.js 18 或更高版本，当前版本: $node_version"
        fi
    else
        print_error "Node.js 未安装"
        missing_deps+=("node")
    fi
    
    # 检查 npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm 已安装: v$npm_version"
    else
        print_error "npm 未安装"
        missing_deps+=("npm")
    fi
    
    # 如果有缺失的依赖，给出安装建议
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo ""
        print_error "缺少必要的依赖: ${missing_deps[*]}"
        echo ""
        echo "请先安装以下依赖："
        echo ""
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  macOS (使用 Homebrew):"
            echo "    brew install node"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  Ubuntu/Debian:"
            echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "    sudo apt-get install -y nodejs"
            echo ""
            echo "  CentOS/RHEL:"
            echo "    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
            echo "    sudo yum install -y nodejs"
        fi
        echo ""
        exit 1
    fi
    
    print_success "系统依赖检查完成"
}

# =============================================================================
# 初始化 Node.js 依赖
# =============================================================================
init_node_dependencies() {
    echo ""
    echo "=============================================="
    echo "📦 初始化 Node.js 依赖..."
    echo "=============================================="
    
    # 初始化根目录依赖（如果有）
    if [ -f "$PROJECT_DIR/package.json" ]; then
        if [ ! -d "$PROJECT_DIR/node_modules" ]; then
            print_step "安装根目录依赖..."
            cd "$PROJECT_DIR"
            npm install
            print_success "根目录依赖安装完成"
        else
            print_info "根目录依赖已存在，跳过安装"
        fi
    fi
    
    # 初始化服务端依赖
    print_step "检查服务端依赖..."
    cd "$PROJECT_DIR/server"
    if [ ! -d "node_modules" ]; then
        print_step "安装服务端依赖..."
        npm install
        print_success "服务端依赖安装完成"
    else
        # 检查 package.json 是否比 node_modules 更新
        if [ "$PROJECT_DIR/server/package.json" -nt "$PROJECT_DIR/server/node_modules" ]; then
            print_step "检测到 package.json 更新，重新安装服务端依赖..."
            npm install
            print_success "服务端依赖更新完成"
        else
            print_info "服务端依赖已是最新，跳过安装"
        fi
    fi
    
    # 初始化客户端依赖
    print_step "检查客户端依赖..."
    cd "$PROJECT_DIR/client"
    if [ ! -d "node_modules" ]; then
        print_step "安装客户端依赖..."
        npm install
        print_success "客户端依赖安装完成"
    else
        # 检查 package.json 是否比 node_modules 更新
        if [ "$PROJECT_DIR/client/package.json" -nt "$PROJECT_DIR/client/node_modules" ]; then
            print_step "检测到 package.json 更新，重新安装客户端依赖..."
            npm install
            print_success "客户端依赖更新完成"
        else
            print_info "客户端依赖已是最新，跳过安装"
        fi
    fi
    
    print_success "Node.js 依赖初始化完成"
}

# =============================================================================
# 创建必要的目录结构
# =============================================================================
create_directories() {
    echo ""
    echo "=============================================="
    echo "📁 创建目录结构..."
    echo "=============================================="
    
    local directories=(
        "$LOG_DIR"
        "$FILE_DB_DIR"
        "$FILE_DB_DIR/familyMembers"
        "$FILE_DB_DIR/appConfig"
        "$PROJECT_DIR/data/diaries"
        "$PROJECT_DIR/uploadFiles/gameFiles"
        "$PROJECT_DIR/uploadFiles/knowledgeFiles"
        "$PROJECT_DIR/uploadFiles/userFiles"
        "$PROJECT_DIR/uploadFiles/diaryFiles"
        "$PROJECT_DIR/uploadFiles/members/avatars"
        "$PROJECT_DIR/uploadFiles/members/logos"
        "$PROJECT_DIR/uploadFiles/members/attributes"
        "$PROJECT_DIR/tempFiles"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_step "创建目录: ${dir#$PROJECT_DIR/}"
        fi
    done
    
    print_success "目录结构创建完成"
}

# =============================================================================
# 构建项目
# =============================================================================
build_projects() {
    echo ""
    echo "=============================================="
    echo "🔨 构建项目..."
    echo "=============================================="
    
    # 构建服务端
    print_step "构建服务端..."
    cd "$PROJECT_DIR/server"
    npm run build
    print_success "服务端构建完成"
    
    # 构建客户端
    print_step "构建客户端..."
    cd "$PROJECT_DIR/client"
    npm run build
    print_success "客户端构建完成"
    
    print_success "项目构建完成"
}

# =============================================================================
# 主函数
# =============================================================================
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          🏠 家用小工具 - 环境初始化脚本                     ║"
    echo "║                    版本: 2.0.0                             ║"
    echo "║             (文件存储版 - 无需数据库)                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "项目目录: $PROJECT_DIR"
    echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 执行各个初始化步骤
    check_system_dependencies
    create_directories
    init_node_dependencies
    build_projects
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 初始化完成!                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "项目特点："
    echo "  ✅ 无需 SQLite 数据库"
    echo "  ✅ 数据以 JSON 文件形式存储在 fileDB/ 目录"
    echo "  ✅ 方便 Git 管理和跨机器迁移"
    echo ""
    echo "下一步操作："
    echo "  1. 运行启动脚本: sh ./deployScript/startAll.sh"
    echo "  2. 访问应用: http://localhost:3000"
    echo ""
}

# 执行主函数
main "$@"
