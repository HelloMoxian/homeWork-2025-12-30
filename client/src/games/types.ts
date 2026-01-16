// 游戏基础接口定义
export interface GameInfo {
    id: string;
    name: string;
    cover: string;
    description?: string;
    enabled: boolean;
    createTime: string;
}

export interface GameStats {
    gameCount: number;
    totalPlayTime: number;
    todayPlayTime: number;
    highestScore: number;
    todayHighestScore: number;
    lastPlayDate: string;
    todayDate: string;
}

export interface GameSave {
    saveTime: string;
    gameData: any;
}

// 游戏基础抽象类
export abstract class BaseGame {
    protected gameId: string;
    protected startTime: number = 0;
    protected currentScore: number = 0;

    constructor(gameId: string) {
        this.gameId = gameId;
    }

    // 开始游戏
    start() {
        this.startTime = Date.now();
    }

    // 结束游戏并上报数据
    async end() {
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        await this.reportGameData(this.currentScore, playTime);
    }

    // 上报游戏数据
    protected async reportGameData(score: number, playTime: number) {
        try {
            const response = await fetch('/api/games/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.gameId,
                    score,
                    playTime,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('上报游戏数据失败:', error);
        }
    }

    // 保存游戏
    async saveGame(gameData: any) {
        try {
            const response = await fetch('/api/games/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.gameId,
                    gameData,
                }),
            });
            return await response.json();
        } catch (error) {
            console.error('保存游戏失败:', error);
        }
    }

    // 加载游戏存档
    async loadGame(): Promise<GameSave | null> {
        try {
            const response = await fetch(`/api/games/save/${this.gameId}`);
            const result = await response.json();
            return result.success ? result.data : null;
        } catch (error) {
            console.error('加载游戏存档失败:', error);
            return null;
        }
    }

    // 抽象方法：初始化游戏
    abstract init(): void;

    // 抽象方法：重置游戏
    abstract reset(): void;
}
