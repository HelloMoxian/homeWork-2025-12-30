import { useState, useEffect } from 'react'
import {
    RefreshCw, Plus, X, Calendar, Clock, Users, Repeat, Play, Pause,
    Trash2, Edit3, Check, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react'
import PageContainer from '@/components/PageContainer'

// ============ 类型定义 ============

interface FamilyMember {
    id: string
    nickname: string
    name?: string
    avatar_path?: string
    sort_weight: number
}

type PeriodicType = 'daily' | 'weekly' | 'monthly'
type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface PeriodicTask {
    id: string
    title: string
    periodicType: PeriodicType
    weekDays?: WeekDay[]
    monthDays?: number[]
    taskDuration: number
    executorIds?: string[]
    description?: string
    detail?: string
    maxRepeatCount?: number
    currentRepeatCount: number
    startDate: string
    endDate?: string
    isActive: boolean
    lastGeneratedDate?: string
    createdAt: string
    updatedAt: string
}

interface TaskStats {
    totalGenerated: number
    completed: number
    pending: number
}

// ============ 工具函数 ============

function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const periodicTypeLabels = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月'
}

// ============ 周期任务卡片组件 ============

interface PeriodicTaskCardProps {
    task: PeriodicTask
    members: FamilyMember[]
    onEdit: (task: PeriodicTask) => void
    onToggle: (taskId: string, isActive: boolean) => void
    onDelete: (taskId: string) => void
    onGenerate: (taskId: string) => void
}

function PeriodicTaskCard({ task, members, onEdit, onToggle, onDelete, onGenerate }: PeriodicTaskCardProps) {
    const [showStats, setShowStats] = useState(false)
    const [stats, setStats] = useState<TaskStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(false)

    const loadStats = async () => {
        if (stats) {
            setShowStats(!showStats)
            return
        }
        setLoadingStats(true)
        try {
            const response = await fetch(`/api/periodic-tasks/${task.id}/stats`)
            const result = await response.json()
            if (result.success) {
                setStats(result.data.stats)
                setShowStats(true)
            }
        } catch (error) {
            console.error('加载统计失败:', error)
        } finally {
            setLoadingStats(false)
        }
    }

    const getPeriodicDescription = () => {
        switch (task.periodicType) {
            case 'daily':
                return '每天'
            case 'weekly':
                if (task.weekDays && task.weekDays.length > 0) {
                    return `每周 ${task.weekDays.map(d => weekDayNames[d]).join('、')}`
                }
                return '每周'
            case 'monthly':
                if (task.monthDays && task.monthDays.length > 0) {
                    return `每月 ${task.monthDays.join('、')} 号`
                }
                return '每月'
            default:
                return ''
        }
    }

    const executors = members.filter(m => task.executorIds?.includes(m.id))

    return (
        <div className={`bg-white rounded-xl shadow-md p-4 border-l-4 transition ${task.isActive ? 'border-l-cyan-500' : 'border-l-gray-300 opacity-60'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        {task.title}
                        {!task.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                已暂停
                            </span>
                        )}
                    </h3>
                    {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onToggle(task.id, !task.isActive)}
                        className={`p-2 rounded-lg transition ${task.isActive
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-green-600 hover:bg-green-50'
                            }`}
                        title={task.isActive ? '暂停' : '启用'}
                    >
                        {task.isActive ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                        onClick={() => onEdit(task)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="编辑"
                    >
                        <Edit3 size={18} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('确定要删除这个周期任务吗？')) {
                                onDelete(task.id)
                            }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="删除"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* 周期信息 */}
            <div className="flex flex-wrap gap-3 mb-3 text-sm">
                <div className="flex items-center gap-1 text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg">
                    <Repeat size={14} />
                    {getPeriodicDescription()}
                </div>
                <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                    <Clock size={14} />
                    耗时 {task.taskDuration} 天
                </div>
                {task.maxRepeatCount && task.maxRepeatCount > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        <BarChart3 size={14} />
                        {task.currentRepeatCount}/{task.maxRepeatCount} 次
                    </div>
                )}
            </div>

            {/* 执行人 */}
            {executors.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-gray-400" />
                    <div className="flex -space-x-2">
                        {executors.slice(0, 5).map(member => (
                            member.avatar_path ? (
                                <img
                                    key={member.id}
                                    src={`/${member.avatar_path}`}
                                    alt={member.nickname}
                                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                    title={member.nickname}
                                />
                            ) : (
                                <div
                                    key={member.id}
                                    className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs text-white"
                                    title={member.nickname}
                                >
                                    {member.nickname[0]}
                                </div>
                            )
                        ))}
                        {executors.length > 5 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                +{executors.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 时间范围 */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Calendar size={12} />
                <span>
                    {task.startDate} 开始
                    {task.endDate && ` ~ ${task.endDate}`}
                </span>
                {task.lastGeneratedDate && (
                    <span className="ml-2">
                        · 最近生成: {task.lastGeneratedDate}
                    </span>
                )}
            </div>

            {/* 操作按钮和统计 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                    onClick={loadStats}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                    {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {loadingStats ? '加载中...' : '查看统计'}
                </button>
                <button
                    onClick={() => onGenerate(task.id)}
                    disabled={!task.isActive}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${task.isActive
                        ? 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <RefreshCw size={14} />
                    立即生成
                </button>
            </div>

            {/* 统计信息展开 */}
            {showStats && stats && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-700">{stats.totalGenerated}</div>
                        <div className="text-xs text-gray-400">已生成</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        <div className="text-xs text-gray-400">已完成</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                        <div className="text-xs text-gray-400">进行中</div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============ 编辑弹窗组件 ============

interface EditModalProps {
    task: PeriodicTask | null
    isNew: boolean
    members: FamilyMember[]
    onSave: (data: Partial<PeriodicTask>) => void
    onClose: () => void
}

function EditModal({ task, isNew, members, onSave, onClose }: EditModalProps) {
    const [formData, setFormData] = useState<Partial<PeriodicTask>>({
        title: '',
        periodicType: 'daily',
        weekDays: [],
        monthDays: [],
        taskDuration: 1,
        executorIds: [],
        description: '',
        detail: '',
        maxRepeatCount: 0,
        startDate: formatDate(new Date()),
        endDate: '',
        ...task
    })

    const handleSubmit = () => {
        if (!formData.title || !formData.startDate) {
            alert('请填写任务名和开始日期')
            return
        }

        if (formData.periodicType === 'weekly' && (!formData.weekDays || formData.weekDays.length === 0)) {
            alert('每周循环需要选择执行日')
            return
        }

        if (formData.periodicType === 'monthly' && (!formData.monthDays || formData.monthDays.length === 0)) {
            alert('每月循环需要选择执行日')
            return
        }

        onSave(formData)
    }

    const toggleWeekDay = (day: WeekDay) => {
        const weekDays = formData.weekDays || []
        if (weekDays.includes(day)) {
            setFormData({ ...formData, weekDays: weekDays.filter(d => d !== day) })
        } else {
            setFormData({ ...formData, weekDays: [...weekDays, day].sort() })
        }
    }

    const toggleMonthDay = (day: number) => {
        const monthDays = formData.monthDays || []
        if (monthDays.includes(day)) {
            setFormData({ ...formData, monthDays: monthDays.filter(d => d !== day) })
        } else {
            setFormData({ ...formData, monthDays: [...monthDays, day].sort((a, b) => a - b) })
        }
    }

    const toggleExecutor = (memberId: string) => {
        const executorIds = formData.executorIds || []
        if (executorIds.includes(memberId)) {
            setFormData({ ...formData, executorIds: executorIds.filter(id => id !== memberId) })
        } else {
            setFormData({ ...formData, executorIds: [...executorIds, memberId] })
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isNew ? '新建周期任务' : '编辑周期任务'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* 任务名 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            任务名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                            placeholder="输入任务名称"
                        />
                    </div>

                    {/* 周期类型 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            周期类型 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {(['daily', 'weekly', 'monthly'] as PeriodicType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormData({ ...formData, periodicType: type })}
                                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${formData.periodicType === type
                                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-medium">{periodicTypeLabels[type]}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {type === 'daily' && '每天创建任务'}
                                        {type === 'weekly' && '指定周几创建'}
                                        {type === 'monthly' && '指定日期创建'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 每周配置 */}
                    {formData.periodicType === 'weekly' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                选择执行日 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {weekDayNames.map((name, index) => (
                                    <button
                                        key={index}
                                        onClick={() => toggleWeekDay(index as WeekDay)}
                                        className={`w-12 h-12 rounded-lg border-2 font-medium transition ${formData.weekDays?.includes(index as WeekDay)
                                            ? 'border-cyan-500 bg-cyan-500 text-white'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {name.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 每月配置 */}
                    {formData.periodicType === 'monthly' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                选择执行日（几号） <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <button
                                        key={day}
                                        onClick={() => toggleMonthDay(day)}
                                        className={`h-10 rounded-lg border-2 text-sm font-medium transition ${formData.monthDays?.includes(day)
                                            ? 'border-cyan-500 bg-cyan-500 text-white'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 任务耗时 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            任务耗时（天）
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.taskDuration || 1}
                            onChange={e => setFormData({ ...formData, taskDuration: parseInt(e.target.value) || 1 })}
                            className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                        <p className="text-xs text-gray-400 mt-1">生成的待办任务从开始日到结束日的天数</p>
                    </div>

                    {/* 时间范围 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                开始日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                结束日期（可选）
                            </label>
                            <input
                                type="date"
                                value={formData.endDate || ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                            />
                        </div>
                    </div>

                    {/* 最大重复次数 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            最大重复次数（0表示无限制）
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.maxRepeatCount || 0}
                            onChange={e => setFormData({ ...formData, maxRepeatCount: parseInt(e.target.value) || 0 })}
                            className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                    </div>

                    {/* 执行人 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            执行人（可多选）
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {members.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => toggleExecutor(member.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition ${formData.executorIds?.includes(member.id)
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {member.avatar_path ? (
                                        <img
                                            src={`/${member.avatar_path}`}
                                            alt={member.nickname}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
                                            {member.nickname[0]}
                                        </div>
                                    )}
                                    {member.nickname}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 任务描述 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            任务描述
                        </label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                            placeholder="简单描述任务内容"
                        />
                    </div>

                    {/* 任务详情 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            任务详情
                        </label>
                        <textarea
                            value={formData.detail || ''}
                            onChange={e => setFormData({ ...formData, detail: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
                            placeholder="详细描述任务内容..."
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                    >
                        {isNew ? '创建' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============ 主页面组件 ============

export default function PeriodicTasksPage() {
    const [tasks, setTasks] = useState<PeriodicTask[]>([])
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [loading, setLoading] = useState(true)
    const [editingTask, setEditingTask] = useState<PeriodicTask | null>(null)
    const [isNewTask, setIsNewTask] = useState(false)
    const [filterActive, setFilterActive] = useState<boolean | null>(null) // null = 全部

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [tasksRes, membersRes] = await Promise.all([
                fetch('/api/periodic-tasks'),
                fetch('/api/family-members')
            ])

            const tasksResult = await tasksRes.json()
            const membersResult = await membersRes.json()

            if (tasksResult.success) {
                setTasks(tasksResult.data)
            }
            if (membersResult.success) {
                setMembers(membersResult.data.sort((a: FamilyMember, b: FamilyMember) =>
                    (a.sort_weight || 0) - (b.sort_weight || 0)
                ))
            }
        } catch (error) {
            console.error('加载数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveTask = async (data: Partial<PeriodicTask>) => {
        try {
            if (isNewTask) {
                const response = await fetch('/api/periodic-tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                const result = await response.json()
                if (result.success) {
                    setTasks([result.data, ...tasks])
                }
            } else if (editingTask) {
                const response = await fetch(`/api/periodic-tasks/${editingTask.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                const result = await response.json()
                if (result.success) {
                    setTasks(tasks.map(t => t.id === editingTask.id ? result.data : t))
                }
            }
            setEditingTask(null)
            setIsNewTask(false)
        } catch (error) {
            console.error('保存任务失败:', error)
        }
    }

    const handleToggleTask = async (taskId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/periodic-tasks/${taskId}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            })
            const result = await response.json()
            if (result.success) {
                setTasks(tasks.map(t => t.id === taskId ? result.data : t))
            }
        } catch (error) {
            console.error('切换状态失败:', error)
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        try {
            const response = await fetch(`/api/periodic-tasks/${taskId}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                setTasks(tasks.filter(t => t.id !== taskId))
            }
        } catch (error) {
            console.error('删除任务失败:', error)
        }
    }

    const handleGenerateTask = async (taskId: string) => {
        try {
            const response = await fetch(`/api/periodic-tasks/${taskId}/generate`, {
                method: 'POST'
            })
            const result = await response.json()
            if (result.success) {
                if (result.data.generated) {
                    alert('已成功生成今日任务')
                    await loadData()
                } else {
                    alert('今日任务已存在或不满足生成条件')
                }
            }
        } catch (error) {
            console.error('生成任务失败:', error)
        }
    }

    const handleGenerateAll = async () => {
        try {
            const response = await fetch('/api/periodic-tasks/generate-today', {
                method: 'POST'
            })
            const result = await response.json()
            if (result.success) {
                alert(`已生成 ${result.data.generatedCount} 个任务`)
                await loadData()
            }
        } catch (error) {
            console.error('批量生成失败:', error)
        }
    }

    const filteredTasks = tasks.filter(task => {
        if (filterActive === null) return true
        return task.isActive === filterActive
    })

    const activeCount = tasks.filter(t => t.isActive).length
    const inactiveCount = tasks.filter(t => !t.isActive).length

    if (loading) {
        return (
            <PageContainer
                title="周期任务"
                subtitle="养成好习惯，坚持每一天"
                icon={<RefreshCw size={40} />}
                iconColor="text-cyan-600"
                iconBgColor="bg-gradient-to-br from-cyan-400 to-teal-500"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer
            title="周期任务"
            subtitle="养成好习惯，坚持每一天"
            icon={<RefreshCw size={40} />}
            iconColor="text-cyan-600"
            iconBgColor="bg-gradient-to-br from-cyan-400 to-teal-500"
        >
            <div className="p-4 md:p-6">
                {/* 顶部操作栏 */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilterActive(null)}
                            className={`px-4 py-2 rounded-lg text-sm transition ${filterActive === null
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            全部 ({tasks.length})
                        </button>
                        <button
                            onClick={() => setFilterActive(true)}
                            className={`px-4 py-2 rounded-lg text-sm transition ${filterActive === true
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            进行中 ({activeCount})
                        </button>
                        <button
                            onClick={() => setFilterActive(false)}
                            className={`px-4 py-2 rounded-lg text-sm transition ${filterActive === false
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            已暂停 ({inactiveCount})
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleGenerateAll}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                        >
                            <RefreshCw size={18} />
                            生成今日任务
                        </button>
                        <button
                            onClick={() => {
                                setEditingTask(null)
                                setIsNewTask(true)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition shadow-md"
                        >
                            <Plus size={20} />
                            新建周期任务
                        </button>
                    </div>
                </div>

                {/* 任务列表 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTasks.map(task => (
                        <PeriodicTaskCard
                            key={task.id}
                            task={task}
                            members={members}
                            onEdit={(task) => {
                                setEditingTask(task)
                                setIsNewTask(false)
                            }}
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                            onGenerate={handleGenerateTask}
                        />
                    ))}
                </div>

                {/* 空状态 */}
                {filteredTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <RefreshCw size={48} className="mb-3 opacity-50" />
                        <p>还没有周期任务</p>
                        <p className="text-sm mt-1">创建周期任务，让好习惯自动提醒</p>
                    </div>
                )}
            </div>

            {/* 编辑弹窗 */}
            {(editingTask || isNewTask) && (
                <EditModal
                    task={editingTask}
                    isNew={isNewTask}
                    members={members}
                    onSave={handleSaveTask}
                    onClose={() => {
                        setEditingTask(null)
                        setIsNewTask(false)
                    }}
                />
            )}
        </PageContainer>
    )
}
