import { GameInfo, GameStats } from './types';

// 获取游戏列表
export async function getGameList(): Promise<GameInfo[]> {
    try {
        const response = await fetch('/api/games/list');
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('获取游戏列表失败:', error);
        return [];
    }
}

// 获取游戏统计数据
export async function getGameStats(gameId: string): Promise<GameStats | null> {
    try {
        const response = await fetch(`/api/games/stats/${gameId}`);
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('获取游戏统计失败:', error);
        return null;
    }
}

// 获取所有游戏统计数据
export async function getAllGameStats(): Promise<Record<string, GameStats>> {
    try {
        const response = await fetch('/api/games/stats');
        const result = await response.json();
        return result.success ? result.data : {};
    } catch (error) {
        console.error('获取所有游戏统计失败:', error);
        return {};
    }
}
