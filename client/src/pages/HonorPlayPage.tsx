import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    X,
    Star,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    VolumeX
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// 播放列表项
interface PlaylistItem {
    id: string
    name: string
    images: string[]
    videos: string[]
    voice_recordings: string[]
    description: string
    glory_level: number
    honor_date: {
        year: number
        month: number | null
        day: number | null
    }
}

export default function HonorPlayPage() {
    const { hallId } = useParams<{ hallId: string }>()
    const navigate = useNavigate()

    const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [currentHonorIndex, setCurrentHonorIndex] = useState(0)
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
    const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isMuted, setIsMuted] = useState(false)
    const [showControls, setShowControls] = useState(true)

    const videoRef = useRef<HTMLVideoElement | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const imageTimerRef = useRef<NodeJS.Timeout | null>(null)
    const controlsTimerRef = useRef<NodeJS.Timeout | null>(null)
    const descriptionRef = useRef<HTMLDivElement | null>(null)

    // 当前荣誉
    const currentHonor = playlist[currentHonorIndex]

    // 所有媒体（图片 + 视频）
    const allMedia = currentHonor
        ? [
            ...currentHonor.images.map((url) => ({ type: 'image' as const, url })),
            ...currentHonor.videos.map((url) => ({ type: 'video' as const, url }))
        ]
        : []

    // 当前媒体
    const currentMedia = allMedia[currentMediaIndex]

    // 加载播放列表
    useEffect(() => {
        const loadPlaylist = async () => {
            if (!hallId) return
            try {
                const response = await fetch(`/api/honors/halls/${hallId}/playlist`)
                const result = await response.json()
                if (result.success && result.data.length > 0) {
                    setPlaylist(result.data)
                } else {
                    navigate(`/honors/${hallId}`)
                }
            } catch (error) {
                console.error('加载播放列表失败:', error)
                navigate(`/honors/${hallId}`)
            } finally {
                setLoading(false)
            }
        }
        loadPlaylist()
    }, [hallId, navigate])

    // 自动隐藏控制栏
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true)
            if (controlsTimerRef.current) {
                clearTimeout(controlsTimerRef.current)
            }
            controlsTimerRef.current = setTimeout(() => {
                if (isPlaying) {
                    setShowControls(false)
                }
            }, 3000)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            if (controlsTimerRef.current) {
                clearTimeout(controlsTimerRef.current)
            }
        }
    }, [isPlaying])

    // 播放下一个媒体
    const nextMedia = useCallback(() => {
        if (currentMediaIndex < allMedia.length - 1) {
            setCurrentMediaIndex(currentMediaIndex + 1)
        } else {
            // 当前荣誉的媒体播完，切换到下一个荣誉
            if (currentHonorIndex < playlist.length - 1) {
                setCurrentHonorIndex(currentHonorIndex + 1)
                setCurrentMediaIndex(0)
                setCurrentRecordingIndex(0)
            } else {
                // 循环播放
                setCurrentHonorIndex(0)
                setCurrentMediaIndex(0)
                setCurrentRecordingIndex(0)
            }
        }
    }, [currentMediaIndex, allMedia.length, currentHonorIndex, playlist.length])

    // 播放上一个媒体
    const prevMedia = useCallback(() => {
        if (currentMediaIndex > 0) {
            setCurrentMediaIndex(currentMediaIndex - 1)
        } else if (currentHonorIndex > 0) {
            const prevHonor = playlist[currentHonorIndex - 1]
            const prevMediaCount = prevHonor.images.length + prevHonor.videos.length
            setCurrentHonorIndex(currentHonorIndex - 1)
            setCurrentMediaIndex(Math.max(0, prevMediaCount - 1))
            setCurrentRecordingIndex(0)
        }
    }, [currentMediaIndex, currentHonorIndex, playlist])

    // 图片自动切换
    useEffect(() => {
        if (!currentMedia || currentMedia.type !== 'image' || !isPlaying) {
            if (imageTimerRef.current) {
                clearTimeout(imageTimerRef.current)
            }
            return
        }

        imageTimerRef.current = setTimeout(() => {
            nextMedia()
        }, 5000) // 5秒切换

        return () => {
            if (imageTimerRef.current) {
                clearTimeout(imageTimerRef.current)
            }
        }
    }, [currentMedia, isPlaying, nextMedia])

    // 视频播放结束
    useEffect(() => {
        const video = videoRef.current
        if (!video || !currentMedia || currentMedia.type !== 'video') return

        const handleEnded = () => {
            nextMedia()
        }

        video.addEventListener('ended', handleEnded)
        return () => video.removeEventListener('ended', handleEnded)
    }, [currentMedia, nextMedia])

    // 播放/暂停控制
    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(() => { })
            } else {
                videoRef.current.pause()
            }
        }
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(() => { })
            } else {
                audioRef.current.pause()
            }
        }
    }, [isPlaying])

    // 背景音频播放
    useEffect(() => {
        if (!currentHonor || currentHonor.voice_recordings.length === 0) return

        const audio = new Audio(currentHonor.voice_recordings[currentRecordingIndex])
        audioRef.current = audio
        audio.muted = isMuted

        audio.onended = () => {
            if (currentRecordingIndex < currentHonor.voice_recordings.length - 1) {
                setCurrentRecordingIndex(currentRecordingIndex + 1)
            } else {
                setCurrentRecordingIndex(0)
            }
        }

        if (isPlaying) {
            audio.play().catch(() => { })
        }

        return () => {
            audio.pause()
            audio.src = ''
        }
    }, [currentHonor, currentRecordingIndex, isMuted])

    // 介绍文字滚动
    useEffect(() => {
        if (!descriptionRef.current || !currentHonor?.description) return

        const element = descriptionRef.current
        element.scrollTop = 0

        if (!isPlaying) return

        const scrollInterval = setInterval(() => {
            if (element.scrollTop < element.scrollHeight - element.clientHeight) {
                element.scrollTop += 1
            }
        }, 100)

        return () => clearInterval(scrollInterval)
    }, [currentHonor, isPlaying])

    // 静音控制
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted
        }
        if (audioRef.current) {
            audioRef.current.muted = isMuted
        }
    }, [isMuted])

    // 键盘控制
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    navigate(`/honors/${hallId}`)
                    break
                case ' ':
                    e.preventDefault()
                    setIsPlaying((p) => !p)
                    break
                case 'ArrowLeft':
                    prevMedia()
                    break
                case 'ArrowRight':
                    nextMedia()
                    break
                case 'm':
                    setIsMuted((m) => !m)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [navigate, hallId, prevMedia, nextMedia])

    // 格式化日期
    const formatDate = (date: { year: number; month: number | null; day: number | null }) => {
        let str = `${date.year}年`
        if (date.month) str += `${date.month}月`
        if (date.day) str += `${date.day}日`
        return str
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!currentHonor) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black flex">
            {/* 媒体区域（左侧） */}
            <div className="flex-1 relative">
                {/* 媒体内容 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {currentMedia?.type === 'image' ? (
                        <img
                            src={currentMedia.url}
                            alt=""
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : currentMedia?.type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={currentMedia.url}
                            autoPlay
                            muted={isMuted}
                            className="max-w-full max-h-full"
                        />
                    ) : (
                        <div className="text-white text-xl">暂无媒体内容</div>
                    )}
                </div>

                {/* 顶部信息 */}
                <div
                    className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        {/* 荣耀度 */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: currentHonor.glory_level }).map((_, i) => (
                                <Star key={i} size={20} className="text-amber-500" fill="currentColor" />
                            ))}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{currentHonor.name}</h1>
                    </div>
                    <p className="text-white/70 mt-2">{formatDate(currentHonor.honor_date)}</p>
                </div>

                {/* 底部控制栏 */}
                <div
                    className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {/* 进度指示 */}
                    <div className="flex items-center gap-2 mb-4">
                        {playlist.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentHonorIndex(index)
                                    setCurrentMediaIndex(0)
                                    setCurrentRecordingIndex(0)
                                }}
                                className={`h-1 flex-1 rounded-full transition-colors ${index === currentHonorIndex ? 'bg-amber-500' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* 控制按钮 */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={prevMedia}
                            className="p-3 text-white/80 hover:text-white transition-colors"
                        >
                            <SkipBack size={28} />
                        </button>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                        >
                            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                        </button>
                        <button
                            onClick={nextMedia}
                            className="p-3 text-white/80 hover:text-white transition-colors"
                        >
                            <SkipForward size={28} />
                        </button>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-3 text-white/80 hover:text-white transition-colors"
                        >
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                    </div>

                    {/* 媒体进度 */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {allMedia.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentMediaIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentMediaIndex ? 'bg-white' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* 关闭按钮 */}
                <button
                    onClick={() => navigate(`/honors/${hallId}`)}
                    className={`absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <X size={32} />
                </button>
            </div>

            {/* 介绍区域（右侧） */}
            {currentHonor.description && (
                <div className="w-96 bg-black/50 backdrop-blur-sm border-l border-white/10 flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">荣誉介绍</h2>
                    </div>
                    <div
                        ref={descriptionRef}
                        className="flex-1 p-6 overflow-y-auto prose prose-invert prose-sm max-w-none"
                    >
                        <ReactMarkdown>{currentHonor.description}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    )
}
