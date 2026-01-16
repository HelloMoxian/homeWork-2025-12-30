import { useState, useEffect, useCallback } from 'react'
import {
    CheckSquare, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Plus, Check, Clock, User, Calendar, X, Mic, Image, Upload, Trash2,
    Play, Pause, Edit3
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

interface ExecutorStatus {
    memberId: string
    status: 'pending' | 'completed'
    completedAt?: string
}

interface TodoTask {
    id: string
    title: string
    startDate: string
    endDate: string
    executorIds?: string[]
    description?: string
    detail?: string
    images?: string[]
    audioPath?: string
    status: 'pending' | 'completed'
    executorStatuses?: ExecutorStatus[]
    createdAt: string
    updatedAt: string
    periodicTaskId?: string
}

// ============ 工具函数 ============

// 获取日期所在周的周一（中国规则）
function getWeekMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day // 周日需要往前推6天
    d.setDate(d.getDate() + diff)
    return d
}

// 获取日期所在月的第一天
function getMonthFirstDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

// 格式化日期
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 格式化显示日期
function formatDisplayDate(date: Date): string {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
}

// 获取月份最后一天
function getMonthLastDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// 月份的中文名
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

// ============ 任务卡片组件 ============

interface TaskCardProps {
    task: TodoTask
    member?: FamilyMember
    onComplete: (taskId: string, memberId?: string) => void
    onEdit: (task: TodoTask) => void
}

function TaskCard({ task, member, onComplete, onEdit }: TaskCardProps) {
    const isCompleted = member
        ? task.executorStatuses?.find(es => es.memberId === member.id)?.status === 'completed'
        : task.status === 'completed'

    const endDate = new Date(task.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isOverdue = endDate < today && !isCompleted

    return (
        <div
            className={`bg-white rounded-lg shadow-sm border p-3 mb-2 cursor-pointer transition-all hover:shadow-md ${isCompleted ? 'opacity-60 bg-gray-50' : ''
                } ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}
            onClick={() => onEdit(task)}
        >
            <div className="flex items-start gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onComplete(task.id, member?.id)
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                        }`}
                >
                    {isCompleted && <Check size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                        }`}>
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className={`text-xs mt-1 truncate ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                            {task.description}
                        </p>
                    )}
                    <div className={`flex items-center gap-2 mt-2 text-xs ${isCompleted ? 'text-gray-300' : isOverdue ? 'text-red-500' : 'text-gray-400'
                        }`}>
                        <Clock size={12} />
                        <span>截止: {task.endDate}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============ 执行人列组件 ============

interface ExecutorColumnProps {
    member?: FamilyMember
    tasks: TodoTask[]
    onComplete: (taskId: string, memberId?: string) => void
    onEdit: (task: TodoTask) => void
}

function ExecutorColumn({ member, tasks, onComplete, onEdit }: ExecutorColumnProps) {
    // 分离已完成和未完成的任务
    const pendingTasks = tasks.filter(task => {
        if (member) {
            return task.executorStatuses?.find(es => es.memberId === member.id)?.status !== 'completed'
        }
        return task.status !== 'completed'
    })
    const completedTasks = tasks.filter(task => {
        if (member) {
            return task.executorStatuses?.find(es => es.memberId === member.id)?.status === 'completed'
        }
        return task.status === 'completed'
    })

    return (
        <div className="flex-shrink-0 w-72 bg-gradient-to-b from-gray-50 to-white rounded-xl p-3 border border-gray-100">
            {/* 头部：执行人信息 */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                {member ? (
                    <>
                        {member.avatar_path ? (
                            <img
                                src={`/${member.avatar_path}`}
                                alt={member.nickname}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                                {member.nickname[0]}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-gray-800">{member.nickname}</h3>
                            <span className="text-xs text-gray-400">
                                {pendingTasks.length} 待完成
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">全部任务</h3>
                            <span className="text-xs text-gray-400">
                                {pendingTasks.length} 待完成
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* 任务列表 */}
            <div className="space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                {pendingTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        member={member}
                        onComplete={onComplete}
                        onEdit={onEdit}
                    />
                ))}

                {completedTasks.length > 0 && (
                    <>
                        <div className="text-xs text-gray-400 pt-3 pb-1 border-t border-gray-100 mt-3">
                            已完成 ({completedTasks.length})
                        </div>
                        {completedTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                member={member}
                                onComplete={onComplete}
                                onEdit={onEdit}
                            />
                        ))}
                    </>
                )}

                {tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        暂无任务
                    </div>
                )}
            </div>
        </div>
    )
}

// ============ 任务编辑弹窗组件 ============

interface TaskEditModalProps {
    task: TodoTask | null
    isNew: boolean
    members: FamilyMember[]
    onSave: (task: Partial<TodoTask>) => void
    onClose: () => void
    onDelete?: (taskId: string) => void
}

function TaskEditModal({ task, isNew, members, onSave, onClose, onDelete }: TaskEditModalProps) {
    const [formData, setFormData] = useState<Partial<TodoTask>>({
        title: '',
        startDate: formatDate(new Date()),
        endDate: formatDate(new Date()),
        executorIds: [],
        description: '',
        detail: '',
        ...task
    })

    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

    const handleSubmit = () => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            alert('请填写任务名、起始时间和终止时间')
            return
        }
        onSave(formData)
    }

    const toggleExecutor = (memberId: string) => {
        const executorIds = formData.executorIds || []
        if (executorIds.includes(memberId)) {
            setFormData({
                ...formData,
                executorIds: executorIds.filter(id => id !== memberId)
            })
        } else {
            setFormData({
                ...formData,
                executorIds: [...executorIds, memberId]
            })
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks: BlobPart[] = []

            recorder.ondataavailable = (e) => chunks.push(e.data)
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' })
                stream.getTracks().forEach(track => track.stop())

                // 如果是已存在的任务，上传录音
                if (task?.id) {
                    const formDataFile = new FormData()
                    formDataFile.append('file', blob, `audio-${Date.now()}.webm`)
                    const response = await fetch(`/api/tasks/${task.id}/audio`, {
                        method: 'POST',
                        body: formDataFile
                    })
                    const result = await response.json()
                    if (result.success) {
                        setFormData({ ...formData, audioPath: result.data.path })
                    }
                }
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            console.error('录音失败:', error)
            alert('无法访问麦克风')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setIsRecording(false)
            setMediaRecorder(null)
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
                        {isNew ? '新建任务' : '编辑任务'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* 任务名 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            任务名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            placeholder="输入任务名称"
                        />
                    </div>

                    {/* 时间范围 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                起始时间 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                终止时间 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.endDate || ''}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            />
                        </div>
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
                                        ? 'bg-green-500 text-white'
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
                            任务描述（一句话）
                        </label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                            placeholder="简单描述任务内容"
                        />
                    </div>

                    {/* 任务详情 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            任务详情（支持 Markdown）
                        </label>
                        <textarea
                            value={formData.detail || ''}
                            onChange={e => setFormData({ ...formData, detail: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                            placeholder="详细描述任务内容..."
                        />
                    </div>

                    {/* 录音 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            任务录音
                        </label>
                        <div className="flex items-center gap-3">
                            {formData.audioPath && (
                                <audio
                                    src={`/taskUploads/${formData.audioPath}`}
                                    controls
                                    className="flex-1 h-10"
                                />
                            )}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isNew}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isRecording
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : isNew
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                    }`}
                            >
                                <Mic size={18} />
                                {isRecording ? '停止录音' : '开始录音'}
                            </button>
                        </div>
                        {isNew && (
                            <p className="text-xs text-gray-400 mt-1">保存任务后可添加录音</p>
                        )}
                    </div>

                    {/* 图片 */}
                    {!isNew && task && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                任务图片
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {formData.images?.map((img, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img
                                            src={`/taskUploads/${img}`}
                                            alt=""
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                            {(!formData.images || formData.images.length === 0) && (
                                <p className="text-sm text-gray-400">保存任务后可添加图片</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between">
                    {!isNew && onDelete && (
                        <button
                            onClick={() => {
                                if (confirm('确定要删除这个任务吗？')) {
                                    onDelete(task!.id)
                                }
                            }}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            删除任务
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                            {isNew ? '创建' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============ 主页面组件 ============

export default function TodoTasksPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [tasks, setTasks] = useState<TodoTask[]>([])
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [loading, setLoading] = useState(true)
    const [editingTask, setEditingTask] = useState<TodoTask | null>(null)
    const [isNewTask, setIsNewTask] = useState(false)

    // 获取当前视图的日期范围信息
    const viewInfo = {
        weekMonday: getWeekMonday(currentDate),
        monthFirstDay: getMonthFirstDay(currentDate),
        monthLastDay: getMonthLastDay(currentDate),
        daysInMonth: getMonthLastDay(currentDate).getDate()
    }

    // 生成当月所有日期
    const monthDates: Date[] = []
    for (let i = 1; i <= viewInfo.daysInMonth; i++) {
        monthDates.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }

    // 加载数据
    useEffect(() => {
        loadData()
    }, [currentDate])

    const loadData = async () => {
        setLoading(true)
        try {
            // 加载当天任务
            const dateStr = formatDate(currentDate)
            const [tasksRes, membersRes] = await Promise.all([
                fetch(`/api/tasks/by-date?date=${dateStr}`),
                fetch('/api/family-members')
            ])

            const tasksResult = await tasksRes.json()
            const membersResult = await membersRes.json()

            if (tasksResult.success) {
                setTasks(tasksResult.data)
            }
            if (membersResult.success) {
                // 按权重排序
                const sortedMembers = membersResult.data.sort((a: FamilyMember, b: FamilyMember) =>
                    (a.sort_weight || 0) - (b.sort_weight || 0)
                )
                setMembers(sortedMembers)
            }
        } catch (error) {
            console.error('加载数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    // 切换日期
    const changeDate = (days: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + days)
        setCurrentDate(newDate)
    }

    // 切换月份
    const changeMonth = (months: number) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + months)
        newDate.setDate(1)
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // 键盘导航
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            changeDate(-1)
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            changeDate(1)
        }
    }, [currentDate])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // 完成任务
    const handleCompleteTask = async (taskId: string, memberId?: string) => {
        try {
            const task = tasks.find(t => t.id === taskId)
            if (!task) return

            const currentStatus = memberId
                ? task.executorStatuses?.find(es => es.memberId === memberId)?.status
                : task.status

            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

            const url = memberId
                ? `/api/tasks/${taskId}/executor/${memberId}/status`
                : `/api/tasks/${taskId}/status`

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            const result = await response.json()
            if (result.success) {
                setTasks(tasks.map(t => t.id === taskId ? result.data : t))
            }
        } catch (error) {
            console.error('更新任务状态失败:', error)
        }
    }

    // 保存任务
    const handleSaveTask = async (taskData: Partial<TodoTask>) => {
        try {
            if (isNewTask) {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                })
                const result = await response.json()
                if (result.success) {
                    await loadData()
                }
            } else if (editingTask) {
                const response = await fetch(`/api/tasks/${editingTask.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
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

    // 删除任务
    const handleDeleteTask = async (taskId: string) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                setTasks(tasks.filter(t => t.id !== taskId))
                setEditingTask(null)
            }
        } catch (error) {
            console.error('删除任务失败:', error)
        }
    }

    // 按执行人分组任务
    const getTasksForMember = (memberId: string | null) => {
        if (memberId === null) {
            // 无执行人或所有人的任务
            return tasks.filter(task =>
                !task.executorIds || task.executorIds.length === 0
            )
        }
        return tasks.filter(task =>
            task.executorIds?.includes(memberId)
        )
    }

    // 计算星期和月份的宽度信息
    const calculateWeekAndMonthInfo = () => {
        const weeks: { weekNum: number; startIndex: number; endIndex: number; label: string }[] = []
        const monthsInfo: { month: number; startIndex: number; endIndex: number; label: string }[] = []

        let currentWeekStart = 0
        let prevWeekMonday = getWeekMonday(monthDates[0]).getTime()

        monthDates.forEach((date, index) => {
            const weekMonday = getWeekMonday(date).getTime()
            if (weekMonday !== prevWeekMonday) {
                weeks.push({
                    weekNum: weeks.length + 1,
                    startIndex: currentWeekStart,
                    endIndex: index - 1,
                    label: `第${weeks.length + 1}周`
                })
                currentWeekStart = index
                prevWeekMonday = weekMonday
            }
        })
        // 最后一周
        weeks.push({
            weekNum: weeks.length + 1,
            startIndex: currentWeekStart,
            endIndex: monthDates.length - 1,
            label: `第${weeks.length + 1}周`
        })

        // 月份信息（当前月份）
        monthsInfo.push({
            month: currentDate.getMonth(),
            startIndex: 0,
            endIndex: monthDates.length - 1,
            label: monthNames[currentDate.getMonth()]
        })

        return { weeks, monthsInfo }
    }

    const { weeks, monthsInfo } = calculateWeekAndMonthInfo()

    if (loading) {
        return (
            <PageContainer
                title="待做任务"
                subtitle="今天的目标，明天的成就"
                icon={<CheckSquare size={40} />}
                iconColor="text-green-600"
                iconBgColor="bg-gradient-to-br from-green-400 to-emerald-500"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer
            title="待做任务"
            subtitle="今天的目标，明天的成就"
            icon={<CheckSquare size={40} />}
            iconColor="text-green-600"
            iconBgColor="bg-gradient-to-br from-green-400 to-emerald-500"
        >
            <div className="p-4 md:p-6" tabIndex={0}>
                {/* 日期导航区域 */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    {/* 顶部导航 */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="上个月"
                            >
                                <ChevronsLeft size={24} />
                            </button>
                            <button
                                onClick={() => changeDate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="上一天"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {formatDisplayDate(currentDate)}
                            </h2>
                            {formatDate(currentDate) !== formatDate(new Date()) && (
                                <button
                                    onClick={goToToday}
                                    className="text-sm text-green-500 hover:text-green-600 mt-1"
                                >
                                    返回今天
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => changeDate(1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="下一天"
                            >
                                <ChevronRight size={24} />
                            </button>
                            <button
                                onClick={() => changeMonth(1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="下个月"
                            >
                                <ChevronsRight size={24} />
                            </button>
                        </div>
                    </div>

                    {/* 日期网格 */}
                    <div className="overflow-x-auto">
                        <div className="min-w-max">
                            {/* 日期行 */}
                            <div className="flex justify-center gap-1 mb-2">
                                {monthDates.map((date, index) => {
                                    const dateStr = formatDate(date)
                                    const isSelected = dateStr === formatDate(currentDate)
                                    const isToday = dateStr === formatDate(new Date())
                                    const hasTasks = tasks.some(t => dateStr >= t.startDate && dateStr <= t.endDate)

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentDate(date)}
                                            className={`w-8 h-8 rounded-full text-xs font-medium transition flex-shrink-0 ${isSelected
                                                ? 'bg-green-500 text-white'
                                                : isToday
                                                    ? 'bg-green-100 text-green-700'
                                                    : hasTasks
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                }`}
                                        >
                                            {date.getDate()}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* 星期行 */}
                            <div className="flex justify-center gap-1 mb-2">
                                {weeks.map((week, index) => {
                                    const width = (week.endIndex - week.startIndex + 1) * 36 - 4 // 32px + 4px gap
                                    return (
                                        <div
                                            key={index}
                                            style={{ width: `${width}px` }}
                                            className="h-6 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-xs text-blue-600 font-medium flex-shrink-0"
                                        >
                                            {week.label}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* 月份行 */}
                            <div className="flex justify-center">
                                {monthsInfo.map((month, index) => {
                                    const width = (month.endIndex - month.startIndex + 1) * 36 - 4
                                    return (
                                        <div
                                            key={index}
                                            style={{ width: `${width}px` }}
                                            className="h-6 bg-gradient-to-r from-purple-100 to-purple-50 rounded-full flex items-center justify-center text-xs text-purple-600 font-medium"
                                        >
                                            {month.label}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 新建任务按钮 */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => {
                            setEditingTask(null)
                            setIsNewTask(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md"
                    >
                        <Plus size={20} />
                        新建任务
                    </button>
                </div>

                {/* 任务列表区域 - 按执行人分列 */}
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {/* 无执行人的任务列 */}
                    {getTasksForMember(null).length > 0 && (
                        <ExecutorColumn
                            tasks={getTasksForMember(null)}
                            onComplete={handleCompleteTask}
                            onEdit={(task) => {
                                setEditingTask(task)
                                setIsNewTask(false)
                            }}
                        />
                    )}

                    {/* 各执行人的任务列 */}
                    {members.map(member => {
                        const memberTasks = getTasksForMember(member.id)
                        if (memberTasks.length === 0) return null
                        return (
                            <ExecutorColumn
                                key={member.id}
                                member={member}
                                tasks={memberTasks}
                                onComplete={handleCompleteTask}
                                onEdit={(task) => {
                                    setEditingTask(task)
                                    setIsNewTask(false)
                                }}
                            />
                        )
                    })}

                    {/* 空状态 */}
                    {tasks.length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-16">
                            <div className="text-center text-gray-400">
                                <CheckSquare size={48} className="mx-auto mb-3 opacity-50" />
                                <p>今天还没有任务</p>
                                <p className="text-sm mt-1">点击右上角按钮创建新任务</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 任务编辑弹窗 */}
            {(editingTask || isNewTask) && (
                <TaskEditModal
                    task={editingTask}
                    isNew={isNewTask}
                    members={members}
                    onSave={handleSaveTask}
                    onClose={() => {
                        setEditingTask(null)
                        setIsNewTask(false)
                    }}
                    onDelete={handleDeleteTask}
                />
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </PageContainer>
    )
}
