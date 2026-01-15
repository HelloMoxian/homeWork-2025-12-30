import { useState, useEffect } from 'react'
import { X, Upload, Image, Video, Trash2, Star } from 'lucide-react'
import AudioRecorder from './AudioRecorder'

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

interface HonorDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Omit<Honor, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
    editingHonor: Honor | null
    hallId: string
    existingTypes: string[]
}

export default function HonorDialog({
    isOpen,
    onClose,
    onSave,
    editingHonor,
    hallId,
    existingTypes
}: HonorDialogProps) {
    const [name, setName] = useState('')
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState<number | null>(null)
    const [day, setDay] = useState<number | null>(null)
    const [images, setImages] = useState<string[]>([])
    const [videos, setVideos] = useState<string[]>([])
    const [voiceRecordings, setVoiceRecordings] = useState<string[]>([])
    const [description, setDescription] = useState('')
    const [honorType, setHonorType] = useState('')
    const [gloryLevel, setGloryLevel] = useState(5)
    const [sortWeight, setSortWeight] = useState(0)
    const [saving, setSaving] = useState(false)
    const [uploadingImages, setUploadingImages] = useState(false)
    const [uploadingVideos, setUploadingVideos] = useState(false)
    const [showTypeSuggestions, setShowTypeSuggestions] = useState(false)

    // 初始化表单
    useEffect(() => {
        if (editingHonor) {
            setName(editingHonor.name)
            setYear(editingHonor.honor_date.year)
            setMonth(editingHonor.honor_date.month)
            setDay(editingHonor.honor_date.day)
            setImages(editingHonor.images)
            setVideos(editingHonor.videos)
            setVoiceRecordings(editingHonor.voice_recordings)
            setDescription(editingHonor.description)
            setHonorType(editingHonor.honor_type)
            setGloryLevel(editingHonor.glory_level)
            setSortWeight(editingHonor.sort_weight)
        } else {
            setName('')
            setYear(new Date().getFullYear())
            setMonth(null)
            setDay(null)
            setImages([])
            setVideos([])
            setVoiceRecordings([])
            setDescription('')
            setHonorType('')
            setGloryLevel(5)
            setSortWeight(0)
        }
    }, [editingHonor, isOpen])

    // 上传图片
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploadingImages(true)
        try {
            const formData = new FormData()
            Array.from(files).forEach(file => {
                formData.append('files', file)
            })

            const response = await fetch('/api/honors/upload-images', {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                setImages([...images, ...result.data.paths])
            }
        } catch (error) {
            console.error('上传图片失败:', error)
        } finally {
            setUploadingImages(false)
        }
    }

    // 上传视频
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploadingVideos(true)
        try {
            const formData = new FormData()
            Array.from(files).forEach(file => {
                formData.append('files', file)
            })

            const response = await fetch('/api/honors/upload-videos', {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                setVideos([...videos, ...result.data.paths])
            }
        } catch (error) {
            console.error('上传视频失败:', error)
        } finally {
            setUploadingVideos(false)
        }
    }

    // 删除图片
    const removeImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        setImages(newImages)
    }

    // 删除视频
    const removeVideo = (index: number) => {
        const newVideos = [...videos]
        newVideos.splice(index, 1)
        setVideos(newVideos)
    }

    // 提交表单
    const handleSubmit = async () => {
        if (!name.trim()) return

        setSaving(true)
        try {
            await onSave({
                hall_id: hallId,
                name: name.trim(),
                honor_date: { year, month, day },
                images,
                videos,
                voice_recordings: voiceRecordings,
                description,
                honor_type: honorType.trim(),
                glory_level: gloryLevel,
                sort_weight: sortWeight
            })
            onClose()
        } catch (error) {
            console.error('保存失败:', error)
        } finally {
            setSaving(false)
        }
    }

    // 类型建议过滤
    const filteredTypes = existingTypes.filter(t =>
        t.toLowerCase().includes(honorType.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {editingHonor ? '编辑荣誉' : '添加荣誉'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 表单内容 */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* 第一行：荣誉名和荣耀度 */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                荣誉名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例如：数学竞赛一等奖"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                荣耀度
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setGloryLevel(level)}
                                        className={`p-2 rounded-lg transition-colors ${gloryLevel >= level
                                                ? 'text-amber-500'
                                                : 'text-gray-300 hover:text-amber-300'
                                            }`}
                                    >
                                        <Star
                                            size={24}
                                            fill={gloryLevel >= level ? 'currentColor' : 'none'}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-lg font-bold text-amber-500">
                                    {gloryLevel}分
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 第二行：荣誉时间和类型 */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                荣誉时间
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                                    placeholder="年"
                                    min="1900"
                                    max="2100"
                                    className="w-24 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center"
                                />
                                <span className="flex items-center text-gray-500">年</span>
                                <select
                                    value={month ?? ''}
                                    onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-20 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    <option value="">-</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <span className="flex items-center text-gray-500">月</span>
                                <select
                                    value={day ?? ''}
                                    onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-20 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    <option value="">-</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <span className="flex items-center text-gray-500">日</span>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                荣誉类型
                            </label>
                            <input
                                type="text"
                                value={honorType}
                                onChange={(e) => setHonorType(e.target.value)}
                                onFocus={() => setShowTypeSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
                                placeholder="例如：学业、体育、艺术"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            {showTypeSuggestions && filteredTypes.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                                    {filteredTypes.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setHonorType(type)
                                                setShowTypeSuggestions(false)
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-amber-50 transition-colors"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 图片上传 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            荣誉图片 <span className="text-gray-400">(第一张为封面)</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {images.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img}
                                        alt={`图片 ${index + 1}`}
                                        className={`w-24 h-24 object-cover rounded-xl ${index === 0 ? 'ring-2 ring-amber-500' : ''
                                            }`}
                                    />
                                    {index === 0 && (
                                        <span className="absolute -top-2 -left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            封面
                                        </span>
                                    )}
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                {uploadingImages ? (
                                    <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Image size={24} className="text-gray-400" />
                                        <span className="text-xs text-gray-400 mt-1">添加图片</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* 视频上传 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            荣誉视频
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {videos.map((video, index) => (
                                <div key={index} className="relative group">
                                    <div className="w-32 h-24 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                                        <video
                                            src={video}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeVideo(index)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <label className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                                <input
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                />
                                {uploadingVideos ? (
                                    <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <Video size={24} className="text-gray-400" />
                                        <span className="text-xs text-gray-400 mt-1">添加视频</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* 内心感想（录音） */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            内心感想 <span className="text-gray-400">(录音)</span>
                        </label>
                        <AudioRecorder
                            recordings={voiceRecordings}
                            onRecordingsChange={setVoiceRecordings}
                        />
                    </div>

                    {/* 荣誉介绍 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            荣誉介绍 <span className="text-gray-400">(支持Markdown)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="详细描述这份荣誉的来历、意义..."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        />
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
                            className="w-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1">数值越大，排序越靠前</p>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="flex gap-4 px-8 py-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-lg"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || saving}
                        className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                    >
                        {saving ? '保存中...' : editingHonor ? '保存' : '添加'}
                    </button>
                </div>
            </div>
        </div>
    )
}
