import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Trophy,
    Plus,
    Edit2,
    Trash2,
    X,
    Upload,
    Star,
    Calendar,
    Award
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

// 类型定义
interface HallStatistics {
    totalCount: number
    avgGloryLevel: number
    typeCount: number
    yearRange: { start: number; end: number } | null
}

interface HonorHall {
    id: string
    name: string
    icon: string | null
    sort_weight: number
    created_at: string
    updated_at: string
    statistics: HallStatistics
}

// 创建/编辑荣誉室对话框
function HallDialog({
    isOpen,
    onClose,
    onSave,
    editingHall
}: {
    isOpen: boolean
    onClose: () => void
    onSave: (data: { name: string; icon: string | null; sort_weight: number }) => void
    editingHall: HonorHall | null
}) {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState<string | null>(null)
    const [sortWeight, setSortWeight] = useState(0)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (editingHall) {
            setName(editingHall.name)
            setIcon(editingHall.icon)
            setSortWeight(editingHall.sort_weight)
        } else {
            setName('')
            setIcon(null)
            setSortWeight(0)
        }
    }, [editingHall, isOpen])

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/honors/halls/upload-icon', {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                setIcon(result.data.path)
            }
        } catch (error) {
            console.error('上传失败:', error)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = () => {
        if (!name.trim()) return
        onSave({ name: name.trim(), icon, sort_weight: sortWeight })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-[500px] max-w-[90vw] shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {editingHall ? '编辑荣誉室' : '创建荣誉室'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* 荣誉室名称 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            荣誉室名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：木木的荣誉"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
                        />
                    </div>

                    {/* 图标上传 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            图标
                        </label>
                        <div className="flex items-center gap-4">
                            {icon ? (
                                <div className="relative">
                                    <img
                                        src={icon}
                                        alt="图标"
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                    <button
                                        onClick={() => setIcon(null)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleIconUpload}
                                        className="hidden"
                                    />
                                    {uploading ? (
                                        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                                    ) : (
                                        <Upload size={24} className="text-gray-400" />
                                    )}
                                </label>
                            )}
                            <p className="text-sm text-gray-500">
                                建议上传正方形图片，用于区分不同家庭成员的荣誉室
                            </p>
                        </div>
                    </div>

                    {/* 排序权重 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            排序权重
                        </label>
                        <input
                            type="number"
                            value={sortWeight}
                            onChange={(e) => setSortWeight(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1">数值越大，排序越靠前</p>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-lg"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                    >
                        {editingHall ? '保存' : '创建'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// 荣誉室卡片
function HallCard({
    hall,
    onEdit,
    onDelete,
    onClick
}: {
    hall: HonorHall
    onEdit: () => void
    onDelete: () => void
    onClick: () => void
}) {
    return (
        <div
            className="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
            onClick={onClick}
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        {hall.icon ? (
                            <img
                                src={hall.icon}
                                alt={hall.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                                <Trophy size={32} className="text-white" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{hall.name}</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {hall.statistics.totalCount} 个荣誉
                            </p>
                        </div>
                    </div>
                    <div
                        className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onEdit}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Edit2 size={18} className="text-gray-500" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} className="text-red-500" />
                        </button>
                    </div>
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-500">
                            <Star size={16} />
                            <span className="font-bold">
                                {hall.statistics.avgGloryLevel || '-'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">平均荣耀度</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-500">
                            <Award size={16} />
                            <span className="font-bold">{hall.statistics.typeCount}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">荣誉类型</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-500">
                            <Calendar size={16} />
                            <span className="font-bold text-sm">
                                {hall.statistics.yearRange
                                    ? hall.statistics.yearRange.start === hall.statistics.yearRange.end
                                        ? hall.statistics.yearRange.start
                                        : `${hall.statistics.yearRange.start}-${hall.statistics.yearRange.end}`
                                    : '-'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">年份跨度</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function HonorsPage() {
    const navigate = useNavigate()
    const [halls, setHalls] = useState<HonorHall[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingHall, setEditingHall] = useState<HonorHall | null>(null)

    // 加载荣誉室列表
    const loadHalls = async () => {
        try {
            const response = await fetch('/api/honors/halls')
            const result = await response.json()
            if (result.success) {
                setHalls(result.data)
            }
        } catch (error) {
            console.error('加载荣誉室失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadHalls()
    }, [])

    // 创建/更新荣誉室
    const handleSave = async (data: { name: string; icon: string | null; sort_weight: number }) => {
        try {
            if (editingHall) {
                await fetch(`/api/honors/halls/${editingHall.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
            } else {
                await fetch('/api/honors/halls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
            }
            setDialogOpen(false)
            setEditingHall(null)
            loadHalls()
        } catch (error) {
            console.error('保存失败:', error)
        }
    }

    // 删除荣誉室
    const handleDelete = async (hall: HonorHall) => {
        if (!confirm(`确定要删除荣誉室「${hall.name}」吗？\n该操作会同时删除其中所有荣誉，且不可恢复！`)) {
            return
        }
        try {
            await fetch(`/api/honors/halls/${hall.id}`, { method: 'DELETE' })
            loadHalls()
        } catch (error) {
            console.error('删除失败:', error)
        }
    }

    return (
        <PageContainer
            title="荣誉室"
            subtitle="记录每一份荣耀时刻"
            icon={<Trophy size={40} className="text-white" />}
            iconBgColor="bg-gradient-to-br from-amber-400 to-orange-500"
        >
            <div className="p-6">
                {/* 顶部操作栏 */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => {
                            setEditingHall(null)
                            setDialogOpen(true)
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
                    >
                        <Plus size={24} />
                        <span>创建荣誉室</span>
                    </button>
                </div>

                {/* 荣誉室列表 */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
                    </div>
                ) : halls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl">
                        <Trophy size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-xl">还没有荣誉室</p>
                        <p className="text-gray-400 mt-2">点击右上角创建第一个荣誉室吧！</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {halls.map((hall) => (
                            <HallCard
                                key={hall.id}
                                hall={hall}
                                onEdit={() => {
                                    setEditingHall(hall)
                                    setDialogOpen(true)
                                }}
                                onDelete={() => handleDelete(hall)}
                                onClick={() => navigate(`/honors/${hall.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 创建/编辑对话框 */}
            <HallDialog
                isOpen={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setEditingHall(null)
                }}
                onSave={handleSave}
                editingHall={editingHall}
            />
        </PageContainer>
    )
}
