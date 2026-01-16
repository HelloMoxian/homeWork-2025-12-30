// 2048游戏核心逻辑
export interface TileData {
    id: number;
    value: number;
    row: number;
    col: number;
    mergedFrom?: number[];
    isNew?: boolean;
}

export interface Game2048State {
    grid: (TileData | null)[][];
    score: number;
    bestScore: number;
    gameOver: boolean;
    won: boolean;
    gridSize: number;
    keepPlaying: boolean;
}

export interface Game2048SaveData {
    grid: (TileData | null)[][];
    score: number;
    bestScore: number;
    gridSize: number;
    keepPlaying: boolean;
}

// 默认颜色配置
export const DEFAULT_TILE_COLORS: Record<number, { bg: string; text: string }> = {
    2: { bg: '#eee4da', text: '#776e65' },
    4: { bg: '#ede0c8', text: '#776e65' },
    8: { bg: '#f2b179', text: '#f9f6f2' },
    16: { bg: '#f59563', text: '#f9f6f2' },
    32: { bg: '#f67c5f', text: '#f9f6f2' },
    64: { bg: '#f65e3b', text: '#f9f6f2' },
    128: { bg: '#edcf72', text: '#f9f6f2' },
    256: { bg: '#edcc61', text: '#f9f6f2' },
    512: { bg: '#edc850', text: '#f9f6f2' },
    1024: { bg: '#edc53f', text: '#f9f6f2' },
    2048: { bg: '#edc22e', text: '#f9f6f2' },
    4096: { bg: '#3c3a32', text: '#f9f6f2' },
    8192: { bg: '#3c3a32', text: '#f9f6f2' },
};

export class Game2048Logic {
    private grid: (TileData | null)[][];
    private score: number = 0;
    private bestScore: number = 0;
    private gridSize: number;
    private tileIdCounter: number = 0;
    private gameOver: boolean = false;
    private won: boolean = false;
    private keepPlaying: boolean = false;

    constructor(gridSize: number = 4) {
        this.gridSize = gridSize;
        this.grid = this.createEmptyGrid();
        this.addRandomTile();
        this.addRandomTile();
    }

    // 创建空网格
    private createEmptyGrid(): (TileData | null)[][] {
        return Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null)
        );
    }

    // 获取下一个方块ID
    private getNextTileId(): number {
        return ++this.tileIdCounter;
    }

    // 获取空格位置
    private getEmptyCells(): { row: number; col: number }[] {
        const cells: { row: number; col: number }[] = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.grid[row][col]) {
                    cells.push({ row, col });
                }
            }
        }
        return cells;
    }

    // 添加随机方块
    private addRandomTile(): boolean {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return false;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;

        this.grid[randomCell.row][randomCell.col] = {
            id: this.getNextTileId(),
            value,
            row: randomCell.row,
            col: randomCell.col,
            isNew: true
        };

        return true;
    }

    // 移动方块
    move(direction: 'up' | 'down' | 'left' | 'right'): boolean {
        // 清除之前的状态标记
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    tile.isNew = false;
                    tile.mergedFrom = undefined;
                }
            }
        }

        let moved = false;
        const traversals = this.getTraversals(direction);

        for (const row of traversals.rows) {
            for (const col of traversals.cols) {
                const tile = this.grid[row][col];
                if (tile) {
                    const { furthest, next } = this.findFurthestPosition(row, col, direction);

                    if (next && this.grid[next.row][next.col]?.value === tile.value &&
                        !this.grid[next.row][next.col]?.mergedFrom) {
                        // 合并
                        const mergedValue = tile.value * 2;
                        const mergedTile: TileData = {
                            id: this.getNextTileId(),
                            value: mergedValue,
                            row: next.row,
                            col: next.col,
                            mergedFrom: [tile.id, this.grid[next.row][next.col]!.id]
                        };

                        this.grid[row][col] = null;
                        this.grid[next.row][next.col] = mergedTile;

                        this.score += mergedValue;

                        // 检查是否赢了
                        if (mergedValue === 2048 && !this.keepPlaying) {
                            this.won = true;
                        }

                        moved = true;
                    } else if (furthest.row !== row || furthest.col !== col) {
                        // 移动
                        this.grid[row][col] = null;
                        tile.row = furthest.row;
                        tile.col = furthest.col;
                        this.grid[furthest.row][furthest.col] = tile;
                        moved = true;
                    }
                }
            }
        }

        if (moved) {
            this.addRandomTile();
            if (!this.movesAvailable()) {
                this.gameOver = true;
            }
        }

        return moved;
    }

    // 获取遍历顺序
    private getTraversals(direction: 'up' | 'down' | 'left' | 'right') {
        const rows: number[] = [];
        const cols: number[] = [];

        for (let i = 0; i < this.gridSize; i++) {
            rows.push(i);
            cols.push(i);
        }

        if (direction === 'down') rows.reverse();
        if (direction === 'right') cols.reverse();

        return { rows, cols };
    }

    // 获取移动向量
    private getVector(direction: 'up' | 'down' | 'left' | 'right'): { row: number; col: number } {
        const vectors = {
            up: { row: -1, col: 0 },
            down: { row: 1, col: 0 },
            left: { row: 0, col: -1 },
            right: { row: 0, col: 1 }
        };
        return vectors[direction];
    }

    // 查找最远位置
    private findFurthestPosition(row: number, col: number, direction: 'up' | 'down' | 'left' | 'right') {
        const vector = this.getVector(direction);
        let previous = { row, col };
        let cell = { row: row + vector.row, col: col + vector.col };

        while (this.isWithinBounds(cell) && !this.grid[cell.row][cell.col]) {
            previous = cell;
            cell = { row: cell.row + vector.row, col: cell.col + vector.col };
        }

        return {
            furthest: previous,
            next: this.isWithinBounds(cell) ? cell : null
        };
    }

    // 检查是否在边界内
    private isWithinBounds(cell: { row: number; col: number }): boolean {
        return cell.row >= 0 && cell.row < this.gridSize &&
            cell.col >= 0 && cell.col < this.gridSize;
    }

    // 检查是否有可用移动
    private movesAvailable(): boolean {
        // 检查是否有空格
        if (this.getEmptyCells().length > 0) return true;

        // 检查是否有可合并的相邻方块
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    const directions: Array<{ row: number; col: number }> = [
                        { row: 0, col: 1 },
                        { row: 1, col: 0 }
                    ];

                    for (const dir of directions) {
                        const adjacent = { row: row + dir.row, col: col + dir.col };
                        if (this.isWithinBounds(adjacent)) {
                            const adjacentTile = this.grid[adjacent.row][adjacent.col];
                            if (adjacentTile && adjacentTile.value === tile.value) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    // 继续游戏（达到2048后）
    continueGame() {
        this.keepPlaying = true;
        this.won = false;
    }

    // 重置游戏
    reset() {
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.tileIdCounter = 0;
        this.addRandomTile();
        this.addRandomTile();
    }

    // 更改网格大小
    setGridSize(size: number) {
        this.gridSize = size;
        this.reset();
    }

    // 从存档恢复
    loadFromSave(saveData: Game2048SaveData) {
        this.gridSize = saveData.gridSize;
        this.grid = saveData.grid;
        this.score = saveData.score;
        this.bestScore = saveData.bestScore;
        this.keepPlaying = saveData.keepPlaying;
        this.gameOver = false;
        this.won = false;

        // 恢复tileIdCounter
        let maxId = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = this.grid[row][col];
                if (tile && tile.id > maxId) {
                    maxId = tile.id;
                }
            }
        }
        this.tileIdCounter = maxId;
    }

    // 获取存档数据
    getSaveData(): Game2048SaveData {
        return {
            grid: this.grid,
            score: this.score,
            bestScore: this.bestScore,
            gridSize: this.gridSize,
            keepPlaying: this.keepPlaying
        };
    }

    // 获取游戏状态
    getState(): Game2048State {
        return {
            grid: this.grid,
            score: this.score,
            bestScore: this.bestScore,
            gameOver: this.gameOver,
            won: this.won,
            gridSize: this.gridSize,
            keepPlaying: this.keepPlaying
        };
    }

    // 更新最高分
    updateBestScore(score: number) {
        if (score > this.bestScore) {
            this.bestScore = score;
        }
    }

    // 获取分数
    getScore(): number {
        return this.score;
    }

    // 获取网格大小
    getGridSize(): number {
        return this.gridSize;
    }
}
