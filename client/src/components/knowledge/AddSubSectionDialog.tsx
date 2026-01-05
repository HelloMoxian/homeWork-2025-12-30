import React, { useState, useEffect } from 'react'
import { X, Upload, Check } from 'lucide-react'

interface KnowledgeSubSection {
    id?: string
    section_id: string
    name: string
    description?: string
    logo_path?: string
    color?: string
    dir_name: string
    sort_weight?: number
}

interface AddSubSectionDialogProps {
    sectionId: string
    sectionDir?: string
    categoryDir?: string
    subSection?: KnowledgeSubSection | null
    onClose: () => void
    onSuccess: () => void
}

// 预设颜色
const PRESET_COLORS = [
    '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1',
    '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#EAB308',
]

export default function AddSubSectionDialog({ sectionId, sectionDir, categoryDir, subSection, onClose, onSuccess }: AddSubSectionDialogProps) {
    const [formData, setFormData] = useState({
        section_id: sectionId,
        name: '',
        description: '',
        logo_path: '',
        color: '#10B981',
        sort_weight: 0,
        dir_name: ''
    })

    const isEditing = !!subSection?.id

    useEffect(() => {
        if (subSection) {
            setFormData({
                section_id: subSection.section_id,
                name: subSection.name || '',
                description: subSection.description || '',
                logo_path: subSection.logo_path || '',
                color: subSection.color || '#10B981',
                sort_weight: subSection.sort_weight || 0,
                dir_name: subSection.dir_name || ''
            })
        }
    }, [subSection])

    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件')
            return
        }

        setUploading(true)
        try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)

            const response = await fetch('/api/upload/knowledge-logo', {
                method: 'POST',
                body: uploadFormData
            })

            const result = await response.json()
            if (result.success) {
                setFormData({ ...formData, logo_path: result.data.path })
            } else {
                alert('上传失败: ' + result.error)
            }
        } catch (error) {
            alert('上传失败: ' + error)
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            alert('请输入板块名')
            return
        }
        if (!formData.dir_name.trim()) {
            alert('请输入文件目录名')
            return
        }

        setSaving(true)
        try {
            const url = isEditing && subSection?.id
                ? `/api/knowledge/subsections/${encodeURIComponent(subSection.id)}`
                : '/api/knowledge/subsections'
            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()
            if (result.success) {
                onSuccess()
                onClose()
            } else {
                alert('保存失败: ' + result.error)
            }
        } catch (error) {
            alert('保存失败: ' + error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{isEditing ? '编辑三级板块' : '添加三级板块'}</h2>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Logo上传 */}
                    <div className="flex justify-center">
                        <div className="relative">
                            {formData.logo_path ? (
                                <div className="relative">
                                    <img
                                        src={`/${formData.logo_path}`}
                                        alt="Logo"
                                        className="w-20 h-20 rounded-xl object-cover shadow-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, logo_path: '' })}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    {uploading ? (
                                        <div className="text-sm text-gray-500">上传中...</div>
                                    ) : (
                                        <>
                                            <Upload size={20} className="text-gray-400" />
                                            <span className="text-xs text-gray-400 mt-1">Logo</span>
                                        </>
                                    )}
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 板块名 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">板块名 *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="输入三级板块名称"
                        />
                    </div>

                    {/* 目录名 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">目录名 *</label>
                        <input
                            type="text"
                            value={formData.dir_name}
                            onChange={(e) => setFormData({ ...formData, dir_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="输入文件目录名（英文）"
                            disabled={isEditing}
                        />
                        <p className="text-xs text-gray-500 mt-1">用于存储文件，创建后不可修改</p>
                    </div>

                    {/* 备注 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="输入备注信息"
                            rows={2}
                        />
                    </div>

                    {/* 颜色选择 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">主题色</label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-lg transition ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                >
                                    {formData.color === color && (
                                        <Check size={16} className="text-white mx-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 排序权重 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">排序权重</label>
                        <input
                            type="number"
                            value={formData.sort_weight}
                            onChange={(e) => setFormData({ ...formData, sort_weight: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="数字越小越靠前"
                        />
                    </div>

                    {/* 按钮 */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition disabled:opacity-50"
                        >
                            {saving ? '保存中...' : (isEditing ? '保存修改' : '创建板块')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
