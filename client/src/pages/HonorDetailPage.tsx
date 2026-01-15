import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Trophy,
    ChevronLeft,
    Star,
    Calendar,
    Award,
    Play,
    Pause,
    Edit2,
    Image,
    Video,
    Mic,
    FileText,
    ChevronRight,
    X
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
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

// 图片查看器组件
function ImageViewer({
    images,
    initialIndex,
    onClose
}: {
    images: string[]
    initialIndex: number
    onClose: () => void
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))
            if (e.key === 'ArrowRight') setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [images.length, onClose])

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            >
                <X size={32} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))
                }}
                className="absolute left-4 p-2 text-white/80 hover:text-white"
            >
                <ChevronLeft size={48} />
            </button>
            <img
                src={images[currentIndex]}
                alt=""
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))
                }}
                className="absolute right-4 p-2 text-white/80 hover:text-white"
            >
                <ChevronRight size={48} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    )
}

export default function HonorDetailPage() {
    const { hallId, honorId } = useParams<{ hallId: string; honorId: string }>()
    const navigate = useNavigate()

    const [honor, setHonor] = useState<Honor | null>(null)
    const [loading, setLoading] = useState(true)
    const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null)
    const [playingVideo, setPlayingVideo] = useState<string | null>(null)
    const [playingRecording, setPlayingRecording] = useState<number | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [existingTypes, setExistingTypes] = useState<string[]>([])

    const audioRef = useRef<HTMLAudioElement | null>(null)

    // 加载荣誉详情
    const loadHonor = async () => {
        if (!honorId) return
        setLoading(true)
        try {
            const response = await fetch(`/api/honors/${honorId}`)
            const result = await response.json()
            if (result.success) {
                setHonor(result.data)
            }
        } catch (error) {
            console.error('加载荣誉失败:', error)
        } finally {
            setLoading(false)
        }
    }

    // 加载已有类型
    const loadTypes = async () => {
        try {
            const response = await fetch('/api/honors/types')
            const result = await response.json()
            if (result.success) {
                setExistingTypes(result.data)
            }
        } catch (error) {
            console.error('加载类型失败:', error)
        }
    }

    useEffect(() => {
        loadHonor()
        loadTypes()
    }, [honorId])

    // 播放/暂停录音
    const toggleRecording = (index: number) => {
        if (playingRecording === index) {
            audioRef.current?.pause()
            setPlayingRecording(null)
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            audioRef.current = new Audio(honor!.voice_recordings[index])
            audioRef.current.onended = () => setPlayingRecording(null)
            audioRef.current.play()
            setPlayingRecording(index)
        }
    }

    // 格式化日期
    const formatDate = (date: { year: number; month: number | null; day: number | null }) => {
        let str = `${date.year}年`
        if (date.month) str += `${date.month}月`
        if (date.day) str += `${date.day}日`
        return str
    }

    // 保存荣誉
    const handleSave = async (data: Omit<Honor, 'id' | 'created_at' | 'updated_at'>) => {
        if (!honor) return
        await fetch(`/api/honors/${honor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        setEditDialogOpen(false)
        loadHonor()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!honor) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-xl text-gray-500">荣誉不存在</p>
                <button
                    onClick={() => navigate(`/honors/${hallId}`)}
                    className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-xl"
                >
                    返回
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
            {/* 顶部导航 */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/honors/${hallId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ChevronLeft size={24} />
                        <span>返回</span>
                    </button>
                    <button
                        onClick={() => setEditDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                    >
                        <Edit2 size={18} />
                        <span>编辑</span>
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* 标题区域 */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {Array.from({ length: honor.glory_level }).map((_, i) => (
                            <Star
                                key={i}
                                size={28}
                                className="text-amber-500"
                                fill="currentColor"
                            />
                        ))}
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">{honor.name}</h1>
                    <div className="flex items-center justify-center gap-6 text-gray-500">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            <span>{formatDate(honor.honor_date)}</span>
                        </div>
                        {honor.honor_type && (
                            <div className="flex items-center gap-2">
                                <Award size={18} />
                                <span>{honor.honor_type}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 图片展示 */}
                {honor.images.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Image size={20} className="text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800">荣誉图片</h2>
                            <span className="text-gray-400">({honor.images.length})</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {honor.images.map((img, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setViewingImageIndex(index)}
                                >
                                    <img
                                        src={img}
                                        alt={`图片 ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 视频展示 */}
                {honor.videos.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Video size={20} className="text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800">荣誉视频</h2>
                            <span className="text-gray-400">({honor.videos.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {honor.videos.map((video, index) => (
                                <div
                                    key={index}
                                    className="aspect-video rounded-2xl overflow-hidden bg-black"
                                >
                                    <video
                                        src={video}
                                        controls
                                        className="w-full h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 内心感想 */}
                {honor.voice_recordings.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Mic size={20} className="text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800">内心感想</h2>
                            <span className="text-gray-400">({honor.voice_recordings.length})</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {honor.voice_recordings.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => toggleRecording(index)}
                                    className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${playingRecording === index
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-white hover:bg-amber-50'
                                        }`}
                                >
                                    {playingRecording === index ? (
                                        <Pause size={20} />
                                    ) : (
                                        <Play size={20} />
                                    )}
                                    <span>感想 {index + 1}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* 荣誉介绍 */}
                {honor.description && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={20} className="text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800">荣誉介绍</h2>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-soft prose prose-amber max-w-none">
                            <ReactMarkdown>{honor.description}</ReactMarkdown>
                        </div>
                    </section>
                )}
            </div>

            {/* 图片查看器 */}
            {viewingImageIndex !== null && (
                <ImageViewer
                    images={honor.images}
                    initialIndex={viewingImageIndex}
                    onClose={() => setViewingImageIndex(null)}
                />
            )}

            {/* 编辑对话框 */}
            <HonorDialog
                isOpen={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                onSave={handleSave}
                editingHonor={honor}
                hallId={hallId || ''}
                existingTypes={existingTypes}
            />
        </div>
    )
}
