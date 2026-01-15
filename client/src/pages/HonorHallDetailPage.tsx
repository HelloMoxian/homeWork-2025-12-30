import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Trophy,
    Plus,
    ChevronLeft,
    Star,
    Calendar,
    Play,
    Edit2,
    Trash2,
    LayoutGrid,
    List,
    Clock,
    Award,
    Filter
} from 'lucide-react'
import PageContainer from '../components/PageContainer'
import HonorDialog from '../components/honors/HonorDialog'

// 类型定义
interface Honor {
    id: string
    hall_id: string
    name: string
    honor_date: {
        year: number
        month: number | null
        day: number | null
    }
    images: string[]
    videos: string[]
    voice_recordings: string[]
    description: string
    honor_type: string
    glory_level: number
    sort_weight: number
    created_at: string
    updated_at: string
}

interface HonorHall {
    id: string
    name: string
    icon: string | null
    sort_weight: number
    created_at: string
    updated_at: string
    statistics: {
        totalCount: number
        avgGloryLevel: number
        typeCount: number
        yearRange: { start: number; end: number } | null
    }
}

type GroupBy = 'none' | 'glory' | 'year' | 'type'

// 荣誉卡片组件
function HonorCard({
    honor,
    onEdit,
    onDelete,
    onClick
}: {
    honor: Honor
    onEdit: () => void
    onDelete: () => void
    onClick: () => void
}) {
    const formatDate = (date: { year: number; month: number | null; day: number | null }) => {
        let str = `${date.year}年`
        if (date.month) str += `${date.month}月`
        if (date.day) str += `${date.day}日`
        return str
    }

    return (
        <div
            className="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
            onClick={onClick}
        >
            {/* 封面图 */}
            <div className="relative aspect-[4/3] bg-gray-100">
                {honor.images.length > 0 ? (
                    <img
                        src={honor.images[0]}
                        alt={honor.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                        <Trophy size={48} className="text-amber-300" />
                    </div>
                )}
                {/* 荣耀度 */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                    <Star size={14} className="text-amber-400" fill="currentColor" />
                    <span className="text-white text-sm font-bold">{honor.glory_level}</span>
                </div>
                {/* 操作按钮 */}
                <div
                    className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onEdit}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                    >
                        <Edit2 size={16} className="text-gray-600" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                    >
                        <Trash2 size={16} className="text-red-500" />
                    </button>
                </div>
            </div>
            {/* 信息 */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{honor.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>{formatDate(honor.honor_date)}</span>
                </div>
                {honor.honor_type && (
                    <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                            {honor.honor_type}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

// 分组标题
function GroupHeader({ title, count }: { title: string; count: number }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                {count} 个
            </span>
        </div>
    )
}

export default function HonorHallDetailPage() {
    const { hallId } = useParams<{ hallId: string }>()
    const navigate = useNavigate()

    const [hall, setHall] = useState<HonorHall | null>(null)
    const [honors, setHonors] = useState<Honor[]>([])
    const [groupedHonors, setGroupedHonors] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [groupBy, setGroupBy] = useState<GroupBy>('none')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingHonor, setEditingHonor] = useState<Honor | null>(null)
    const [existingTypes, setExistingTypes] = useState<string[]>([])

    // 加载荣誉室信息
    const loadHall = useCallback(async () => {
        if (!hallId) return
        try {
            const response = await fetch(`/api/honors/halls/${hallId}`)
            const result = await response.json()
            if (result.success) {
                setHall(result.data)
            }
        } catch (error) {
            console.error('加载荣誉室失败:', error)
        }
    }, [hallId])

    // 加载荣誉列表
    const loadHonors = useCallback(async () => {
        if (!hallId) return
        setLoading(true)
        try {
            const groupParam = groupBy !== 'none' ? `?groupBy=${groupBy}` : ''
            const response = await fetch(`/api/honors/halls/${hallId}/honors${groupParam}`)
            const result = await response.json()

            if (result.success) {
                if (result.groupBy) {
                    setGroupedHonors(result.data)
                    setHonors([])
                } else {
                    setHonors(result.data)
                    setGroupedHonors(null)
                }
            }
        } catch (error) {
            console.error('加载荣誉失败:', error)
        } finally {
            setLoading(false)
        }
    }, [hallId, groupBy])

    // 加载已有类型
    const loadTypes = useCallback(async () => {
        try {
            const response = await fetch('/api/honors/types')
            const result = await response.json()
            if (result.success) {
                setExistingTypes(result.data)
            }
        } catch (error) {
            console.error('加载类型失败:', error)
        }
    }, [])

    useEffect(() => {
        loadHall()
        loadTypes()
    }, [loadHall, loadTypes])

    useEffect(() => {
        loadHonors()
    }, [loadHonors])

    // 保存荣誉
    const handleSave = async (data: Omit<Honor, 'id' | 'created_at' | 'updated_at'>) => {
        if (editingHonor) {
            await fetch(`/api/honors/${editingHonor.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
        } else {
            await fetch('/api/honors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
        }
        setDialogOpen(false)
        setEditingHonor(null)
        loadHonors()
        loadHall()
        loadTypes()
    }

    // 删除荣誉
    const handleDelete = async (honor: Honor) => {
        if (!confirm(`确定要删除荣誉「${honor.name}」吗？`)) return
        try {
            await fetch(`/api/honors/${honor.id}`, { method: 'DELETE' })
            loadHonors()
            loadHall()
        } catch (error) {
            console.error('删除失败:', error)
        }
    }

    // 渲染荣誉网格
    const renderHonorGrid = (honorsList: Honor[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {honorsList.map((honor) => (
                <HonorCard
                    key={honor.id}
                    honor={honor}
                    onEdit={() => {
                        setEditingHonor(honor)
                        setDialogOpen(true)
                    }}
                    onDelete={() => handleDelete(honor)}
                    onClick={() => navigate(`/honors/${hallId}/detail/${honor.id}`)}
                />
            ))}
        </div>
    )

    return (
        <PageContainer
            title={hall?.name || '荣誉室'}
            subtitle={hall ? `共 ${hall.statistics.totalCount} 个荣誉` : undefined}
            icon={
                hall?.icon ? (
                    <img src={hall.icon} alt={hall.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                    <Trophy size={40} className="text-white" />
                )
            }
            iconBgColor="bg-gradient-to-br from-amber-400 to-orange-500"
        >
            <div className="p-6">
                {/* 顶部操作栏 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/honors')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ChevronLeft size={24} />
                        <span className="text-lg">返回荣誉室</span>
                    </button>
                    <div className="flex items-center gap-4">
                        {/* 分组选择 */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setGroupBy('none')}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${groupBy === 'none' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                    }`}
                            >
                                <LayoutGrid size={18} />
                                <span>默认</span>
                            </button>
                            <button
                                onClick={() => setGroupBy('glory')}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${groupBy === 'glory' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                    }`}
                            >
                                <Star size={18} />
                                <span>荣耀度</span>
                            </button>
                            <button
                                onClick={() => setGroupBy('year')}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${groupBy === 'year' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                    }`}
                            >
                                <Calendar size={18} />
                                <span>年份</span>
                            </button>
                            <button
                                onClick={() => setGroupBy('type')}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${groupBy === 'type' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                    }`}
                            >
                                <Award size={18} />
                                <span>类型</span>
                            </button>
                        </div>

                        {/* 播放按钮 */}
                        {(honors.length > 0 || groupedHonors) && (
                            <button
                                onClick={() => navigate(`/honors/${hallId}/play`)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors font-medium shadow-lg"
                            >
                                <Play size={20} />
                                <span>荣誉播放</span>
                            </button>
                        )}

                        {/* 添加按钮 */}
                        <button
                            onClick={() => {
                                setEditingHonor(null)
                                setDialogOpen(true)
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium shadow-lg"
                        >
                            <Plus size={20} />
                            <span>添加荣誉</span>
                        </button>
                    </div>
                </div>

                {/* 内容区 */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
                    </div>
                ) : groupedHonors ? (
                    // 分组显示
                    <div className="space-y-8">
                        {groupBy === 'glory' &&
                            groupedHonors.map((group: { level: number; honors: Honor[] }) => (
                                <div key={group.level}>
                                    <GroupHeader
                                        title={`${group.level}星荣耀`}
                                        count={group.honors.length}
                                    />
                                    {renderHonorGrid(group.honors)}
                                </div>
                            ))}
                        {groupBy === 'year' &&
                            groupedHonors.map((group: { year: number; honors: Honor[] }) => (
                                <div key={group.year}>
                                    <GroupHeader
                                        title={`${group.year}年`}
                                        count={group.honors.length}
                                    />
                                    {renderHonorGrid(group.honors)}
                                </div>
                            ))}
                        {groupBy === 'type' &&
                            groupedHonors.map((group: { type: string; honors: Honor[] }) => (
                                <div key={group.type}>
                                    <GroupHeader
                                        title={group.type}
                                        count={group.honors.length}
                                    />
                                    {renderHonorGrid(group.honors)}
                                </div>
                            ))}
                    </div>
                ) : honors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl">
                        <Trophy size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-xl">还没有荣誉</p>
                        <p className="text-gray-400 mt-2">点击右上角添加第一个荣誉吧！</p>
                    </div>
                ) : (
                    renderHonorGrid(honors)
                )}
            </div>

            {/* 荣誉对话框 */}
            <HonorDialog
                isOpen={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setEditingHonor(null)
                }}
                onSave={handleSave}
                editingHonor={editingHonor}
                hallId={hallId || ''}
                existingTypes={existingTypes}
            />
        </PageContainer>
    )
}
