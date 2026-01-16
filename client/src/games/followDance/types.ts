// 跟随跳舞游戏类型定义
export interface DanceTemplate {
    id: string;
    name: string;
    videoUrl: string;
    coverUrl?: string;
    duration?: number;  // 视频时长（秒）
    createTime: string;
}

export interface FollowDanceSaveData {
    lastTemplateId?: string;
}

// 模板管理API
export async function getDanceTemplates(): Promise<DanceTemplate[]> {
    try {
        const response = await fetch('/api/games/followDance/templates');
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('获取跳舞模板失败:', error);
        return [];
    }
}

export async function uploadDanceTemplate(
    name: string,
    videoFile: File,
    coverFile?: File
): Promise<DanceTemplate | null> {
    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('video', videoFile);
        if (coverFile) {
            formData.append('cover', coverFile);
        }

        const response = await fetch('/api/games/followDance/templates', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('上传跳舞模板失败:', error);
        return null;
    }
}

export async function deleteDanceTemplate(templateId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/games/followDance/templates/${templateId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('删除跳舞模板失败:', error);
        return false;
    }
}
