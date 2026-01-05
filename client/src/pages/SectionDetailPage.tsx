import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Edit2, Trash2, Layers, ChevronRight, BookOpen } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import AddSubSectionDialog from '../components/knowledge/AddSubSectionDialog'

interface KnowledgeCategory {
    id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
}

interface KnowledgeSection {
    id: string
    category_id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
}

interface KnowledgeSubSection {
    id: string
    section_id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
    sort_weight: number
    item_count?: number
    last_study_at?: string
}

export default function SectionDetailPage() {
    const { categoryId, sectionId } = useParams<{ categoryId: string; sectionId: string }>()
    const navigate = useNavigate()

    const [category, setCategory] = useState<KnowledgeCategory | null>(null)
    const [section, setSection] = useState<KnowledgeSection | null>(null)
    const [subSections, setSubSections] = useState<KnowledgeSubSection[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingSubSection, setEditingSubSection] = useState<KnowledgeSubSection | null>(null)

    useEffect(() => {
        if (categoryId && sectionId) {
            fetchData()
        }
    }, [categoryId, sectionId])

    const fetchData = async () => {
        try {
            const categoryRes = await fetch(`/api/knowledge/categories/${categoryId}`)
            const categoryResult = await categoryRes.json()
            if (categoryResult.success) {
                setCategory(categoryResult.data)
            }

            // 构建完整的 section ID（格式：categoryId/sectionId），并进行URL编码
            const fullSectionId = `${categoryId}/${sectionId}`
            const sectionRes = await fetch(`/api/knowledge/sections/${encodeURIComponent(fullSectionId)}`)
            const sectionResult = await sectionRes.json()
            if (sectionResult.success) {
                setSection(sectionResult.data)
            }

            const subSectionsRes = await fetch(`/api/knowledge/subsections?sectionId=${encodeURIComponent(fullSectionId)}`)
            const subSectionsResult = await subSectionsRes.json()
            if (subSectionsResult.success) {
                setSubSections(subSectionsResult.data)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (subSection: KnowledgeSubSection) => {
        if (!confirm(`确定要删除板块「${subSection.name}」吗？此操作不可恢复！`)) {
            return
        }

        try {
            const response = await fetch(`/api/knowledge/subsections/${encodeURIComponent(subSection.id)}`, {
                method: 'DELETE'
            })
            const result = await response.json()
            if (result.success) {
                fetchData()
            } else {
                alert('删除失败: ' + result.error)
            }
        } catch (error) {
            alert('删除失败: ' + error)
        }
    }

    const handleEdit = (subSection: KnowledgeSubSection) => {
        setEditingSubSection(subSection)
        setShowAddDialog(true)
    }

    const handleDialogClose = () => {
        setShowAddDialog(false)
        setEditingSubSection(null)
    }

    const handleDialogSuccess = () => {
        fetchData()
        handleDialogClose()
    }

    const getSubSectionColor = (color?: string) => {
        return color || section?.color || category?.color || '#10b981'
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '从未学习'
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN')
    }

    if (loading) {
        return (
            <PageContainer title="加载中...">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    if (!section || !category) {
        return (
            <PageContainer title="未找到">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500 text-lg mb-4">板块不存在</p>
                    <button
                        onClick={() => navigate('/knowledge')}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg"
                    >
                        返回知识库
                    </button>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer title={section.name}>
            <div className="p-6">
                {/* 顶部导航 */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(`/knowledge/${categoryId}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate('/knowledge')}>
                            知识库
                        </span>
                        <span>/</span>
                        <span className="cursor-pointer hover:text-gray-700" onClick={() => navigate(`/knowledge/${categoryId}`)}>
                            {category.name}
                        </span>
                        <span>/</span>
                        <span className="font-medium text-gray-700">{section.name}</span>
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        {section.logo_path && (
                            <img src={`/${section.logo_path}`} alt="" className="w-10 h-10 object-contain rounded" />
                        )}
                        <button
                            onClick={() => setShowAddDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition shadow-lg"
                        >
                            <Plus size={20} />
                            添加三级板块
                        </button>
                    </div>
                </div>

                {/* 三级板块列表 */}
                {subSections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                        <Layers size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">还没有三级板块</p>
                        <p className="text-gray-400 text-sm mt-1">点击上方按钮创建第一个三级板块</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subSections.map((subSection, index) => (
                            <div
                                key={subSection.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
                                onClick={() => navigate(`/knowledge/${categoryId}/${sectionId}/${subSection.dir_name}`)}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* 序号 */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0"
                                            style={{
                                                backgroundColor: getSubSectionColor(subSection.color) + '20',
                                                color: getSubSectionColor(subSection.color)
                                            }}
                                        >
                                            {index + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate">{subSection.name}</h3>
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                                {subSection.description || '暂无描述'}
                                            </p>
                                        </div>

                                        {subSection.logo_path && (
                                            <img
                                                src={`/${subSection.logo_path}`}
                                                alt=""
                                                className="w-10 h-10 object-contain rounded"
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{subSection.item_count || 0} 个知识点</span>
                                            <span>上次学习：{formatDate(subSection.last_study_at)}</span>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(subSection)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(subSection)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 添加卡片 */}
                        <div
                            onClick={() => setShowAddDialog(true)}
                            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[150px] group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 group-hover:bg-emerald-100 flex items-center justify-center mb-2 transition">
                                <Plus size={24} className="text-gray-400 group-hover:text-emerald-500 transition" />
                            </div>
                            <span className="text-gray-500 group-hover:text-emerald-600 font-medium text-sm">
                                添加三级板块
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 添加/编辑对话框 */}
            {showAddDialog && (
                <AddSubSectionDialog
                    sectionId={`${categoryId}/${sectionId}`}
                    sectionDir={section.dir_name}
                    categoryDir={category.dir_name}
                    subSection={editingSubSection}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                />
            )}
        </PageContainer>
    )
}
