// 2048游戏样式组类型定义
export interface TileStyle {
    backgroundImage?: string;  // 背景图片URL
    backgroundColor?: string;  // 背景颜色
    textColor?: string;        // 文字颜色
    borderColor?: string;      // 边框颜色
}

export interface StyleGroup {
    id: string;
    name: string;
    description?: string;
    tileStyles: Record<number, TileStyle>;  // value -> style
    boardBackground?: string;
    emptyTileColor?: string;
    createTime: string;
}

// 默认样式组
export const DEFAULT_STYLE_GROUP: StyleGroup = {
    id: 'default',
    name: '经典样式',
    description: '原版2048经典配色',
    tileStyles: {
        2: { backgroundColor: '#eee4da', textColor: '#776e65' },
        4: { backgroundColor: '#ede0c8', textColor: '#776e65' },
        8: { backgroundColor: '#f2b179', textColor: '#f9f6f2' },
        16: { backgroundColor: '#f59563', textColor: '#f9f6f2' },
        32: { backgroundColor: '#f67c5f', textColor: '#f9f6f2' },
        64: { backgroundColor: '#f65e3b', textColor: '#f9f6f2' },
        128: { backgroundColor: '#edcf72', textColor: '#f9f6f2' },
        256: { backgroundColor: '#edcc61', textColor: '#f9f6f2' },
        512: { backgroundColor: '#edc850', textColor: '#f9f6f2' },
        1024: { backgroundColor: '#edc53f', textColor: '#f9f6f2' },
        2048: { backgroundColor: '#edc22e', textColor: '#f9f6f2' },
        4096: { backgroundColor: '#3c3a32', textColor: '#f9f6f2' },
        8192: { backgroundColor: '#3c3a32', textColor: '#f9f6f2' },
    },
    boardBackground: '#bbada0',
    emptyTileColor: '#cdc1b4',
    createTime: new Date().toISOString()
};

// 获取方块样式
export function getTileStyle(value: number, styleGroup: StyleGroup): TileStyle {
    const style = styleGroup.tileStyles[value];
    if (style) {
        return style;
    }

    // 超过预设值的方块使用默认深色
    return {
        backgroundColor: '#3c3a32',
        textColor: '#f9f6f2'
    };
}

// 样式组管理API
export async function getStyleGroups(): Promise<StyleGroup[]> {
    try {
        const response = await fetch('/api/games/2048/styles');
        const result = await response.json();
        return result.success ? result.data : [DEFAULT_STYLE_GROUP];
    } catch (error) {
        console.error('获取样式组失败:', error);
        return [DEFAULT_STYLE_GROUP];
    }
}

export async function saveStyleGroup(styleGroup: StyleGroup): Promise<boolean> {
    try {
        const response = await fetch('/api/games/2048/styles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(styleGroup)
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('保存样式组失败:', error);
        return false;
    }
}

export async function deleteStyleGroup(styleGroupId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/games/2048/styles/${styleGroupId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('删除样式组失败:', error);
        return false;
    }
}
