import { useState, useEffect, useRef } from 'react'
import {
    PenTool, Calendar, Cloud, Smile, Utensils, FileText,
    Image, Video, Mic, Plus, Trash2, ChevronLeft, ChevronRight,
    Camera, Upload, X, Save, Play, Pause, Thermometer
} from 'lucide-react'
import PageContainer from '@/components/PageContainer'

// 类型定义
interface MoodOption {
    value: string
    label: string
    emoji: string
}

interface WeatherOption {
    value: string
    label: string
    emoji: string
}

interface WeatherFeelOption {
    value: string
    label: string
    emoji: string
}

interface MoodRecord {
    period: 'morning' | 'afternoon' | 'evening'
    moods: string[]
    customMood?: string
}

interface MealRecord {
    period: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    content: string
    audioPath?: string
}

interface DiaryEntry {
    id: string
    date: string
    weather?: string[]  // 改为数组支持多选
    weatherFeel?: string  // 天气体感
    moods: MoodRecord[]
    meals: MealRecord[]
    events: string
    images: string[]
    videos: string[]
    audios: string[]
    created_at: string
    updated_at: string
}

interface Options {
    moodOptions: {
        morning: MoodOption[]
        afternoon: MoodOption[]
        evening: MoodOption[]
    }
    weatherOptions: WeatherOption[]
    weatherFeelOptions: WeatherFeelOption[]
}

// 时段标签
const periodLabels = {
    morning: '🌅 早上',
    afternoon: '☀️ 下午',
    evening: '🌙 晚上'
}

const mealLabels = {
    breakfast: '🍳 早餐',
    lunch: '🍱 午餐',
    dinner: '🍲 晚餐',
    snack: '🍪 零食'
}

export default function MumuDiaryPage() {
    // 状态
    const [currentDate, setCurrentDate] = useState(new Date())
    const [diary, setDiary] = useState<DiaryEntry | null>(null)
    const [diaries, setDiaries] = useState<DiaryEntry[]>([])
    const [options, setOptions] = useState<Options | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingPeriod, setRecordingPeriod] = useState<string | null>(null)

    // 拍照相关状态
    const [showCameraModal, setShowCameraModal] = useState(false)
    const [cameraCountdown, setCameraCountdown] = useState(0)
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
    const cameraVideoRef = useRef<HTMLVideoElement>(null)
    const cameraCanvasRef = useRef<HTMLCanvasElement>(null)

    // 摄影相关状态
    const [showVideoRecordModal, setShowVideoRecordModal] = useState(false)
    const [videoRecordStream, setVideoRecordStream] = useState<MediaStream | null>(null)
    const [isVideoRecording, setIsVideoRecording] = useState(false)
    const [videoRecordTime, setVideoRecordTime] = useState(0)
    const videoRecordRef = useRef<HTMLVideoElement>(null)
    const videoMediaRecorderRef = useRef<MediaRecorder | null>(null)
    const videoChunksRef = useRef<Blob[]>([])
    const videoRecordTimerRef = useRef<NodeJS.Timeout | null>(null)

    // refs
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const formatDisplayDate = (date: Date) => {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
    }

    // 加载选项
    useEffect(() => {
        fetch('/api/diary/options')
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setOptions(result.data)
                }
            })
            .catch(console.error)
    }, [])

    // 加载当前日期的日记
    useEffect(() => {
        loadDiary()
    }, [currentDate])

    // 加载月份日记列表
    useEffect(() => {
        loadMonthDiaries()
    }, [currentDate])

    const loadDiary = async () => {
        setLoading(true)
        try {
            const dateStr = formatDate(currentDate)
            const response = await fetch(`/api/diary/${dateStr}`)
            const result = await response.json()
            if (result.success) {
                setDiary(result.data)
            } else {
                // 日记不存在，创建新的
                const createRes = await fetch('/api/diary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: dateStr })
                })
                const createResult = await createRes.json()
                if (createResult.success) {
                    setDiary(createResult.data)
                }
            }
        } catch (error) {
            console.error('Load diary error:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMonthDiaries = async () => {
        try {
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth() + 1
            const response = await fetch(`/api/diary/by-month?year=${year}&month=${month}`)
            const result = await response.json()
            if (result.success) {
                setDiaries(result.data)
            }
        } catch (error) {
            console.error('Load month diaries error:', error)
        }
    }

    const saveDiary = async (updates: Partial<DiaryEntry>) => {
        if (!diary) return
        setSaving(true)
        try {
            const response = await fetch(`/api/diary/${diary.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            const result = await response.json()
            if (result.success) {
                setDiary(result.data)
            }
        } catch (error) {
            console.error('Save diary error:', error)
        } finally {
            setSaving(false)
        }
    }

    // 切换日期
    const changeDate = (days: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + days)
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // 更新天气（多选）
    const toggleWeather = (weatherValue: string) => {
        if (!diary) return
        const currentWeather = diary.weather || []
        let newWeather: string[]

        if (currentWeather.includes(weatherValue)) {
            newWeather = currentWeather.filter(w => w !== weatherValue)
        } else {
            newWeather = [...currentWeather, weatherValue]
        }

        saveDiary({ weather: newWeather })
    }

    // 更新天气体感
    const updateWeatherFeel = (weatherFeel: string) => {
        if (!diary) return
        // 如果点击当前选中的体感，则取消选择
        if (diary.weatherFeel === weatherFeel) {
            saveDiary({ weatherFeel: undefined })
        } else {
            saveDiary({ weatherFeel })
        }
    }

    // 更新心情
    const toggleMood = (period: 'morning' | 'afternoon' | 'evening', moodValue: string) => {
        if (!diary) return
        const existingMood = diary.moods.find(m => m.period === period)
        let newMoods: string[]

        if (existingMood) {
            if (existingMood.moods.includes(moodValue)) {
                newMoods = existingMood.moods.filter(m => m !== moodValue)
            } else {
                newMoods = [...existingMood.moods, moodValue]
            }
        } else {
            newMoods = [moodValue]
        }

        const updatedMoods = diary.moods.filter(m => m.period !== period)
        if (newMoods.length > 0 || existingMood?.customMood) {
            updatedMoods.push({
                period,
                moods: newMoods,
                customMood: existingMood?.customMood
            })
        }

        saveDiary({ moods: updatedMoods })
    }

    const updateCustomMood = (period: 'morning' | 'afternoon' | 'evening', customMood: string) => {
        if (!diary) return
        const existingMood = diary.moods.find(m => m.period === period)
        const updatedMoods = diary.moods.filter(m => m.period !== period)

        if (customMood || (existingMood?.moods && existingMood.moods.length > 0)) {
            updatedMoods.push({
                period,
                moods: existingMood?.moods || [],
                customMood
            })
        }

        saveDiary({ moods: updatedMoods })
    }

    // 更新饮食
    const updateMeal = (period: 'breakfast' | 'lunch' | 'dinner' | 'snack', content: string) => {
        if (!diary) return
        const existingMeal = diary.meals.find(m => m.period === period)
        const updatedMeals = diary.meals.filter(m => m.period !== period)

        if (content || existingMeal?.audioPath) {
            updatedMeals.push({
                period,
                content,
                audioPath: existingMeal?.audioPath
            })
        }

        saveDiary({ meals: updatedMeals })
    }

    // 更新事件
    const updateEvents = (events: string) => {
        saveDiary({ events })
    }

    // 上传图片
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !diary) return
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`/api/diary/${diary.id}/upload/image`, {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                loadDiary()
            }
        } catch (error) {
            console.error('Upload image error:', error)
        }
        e.target.value = ''
    }

    // 上传视频
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !diary) return
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`/api/diary/${diary.id}/upload/video`, {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                loadDiary()
            }
        } catch (error) {
            console.error('Upload video error:', error)
        }
        e.target.value = ''
    }

    // 上传音频
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !diary) return
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`/api/diary/${diary.id}/upload/audio`, {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                loadDiary()
            }
        } catch (error) {
            console.error('Upload audio error:', error)
        }
        e.target.value = ''
    }

    // 删除媒体
    const deleteMedia = async (type: 'image' | 'video' | 'audio', path: string) => {
        if (!diary) return
        if (!confirm('确定要删除吗？')) return

        try {
            const response = await fetch(
                `/api/diary/${diary.id}/media?type=${type}&path=${encodeURIComponent(path)}`,
                { method: 'DELETE' }
            )
            const result = await response.json()
            if (result.success) {
                loadDiary()
            }
        } catch (error) {
            console.error('Delete media error:', error)
        }
    }

    // 录音功能
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                await uploadRecordedAudio(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (error) {
            console.error('Start recording error:', error)
            alert('无法访问麦克风，请检查权限设置')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const uploadRecordedAudio = async (blob: Blob) => {
        if (!diary) return
        const formData = new FormData()
        formData.append('file', blob, `recording_${Date.now()}.webm`)

        try {
            const response = await fetch(`/api/diary/${diary.id}/upload/audio`, {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                loadDiary()
            }
        } catch (error) {
            console.error('Upload recording error:', error)
        }
    }

    // 拍照功能
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            setCameraStream(stream)
            setShowCameraModal(true)

            // 等待视频元素准备好
            setTimeout(() => {
                if (cameraVideoRef.current) {
                    cameraVideoRef.current.srcObject = stream
                }
                // 开始3秒倒计时
                setCameraCountdown(3)
            }, 100)
        } catch (error) {
            console.error('Open camera error:', error)
            alert('无法访问摄像头，请检查权限设置')
        }
    }

    // 倒计时效果
    useEffect(() => {
        if (cameraCountdown > 0) {
            const timer = setTimeout(() => {
                setCameraCountdown(cameraCountdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else if (cameraCountdown === 0 && showCameraModal && cameraStream) {
            // 倒计时结束，自动拍照
            takePhoto()
        }
    }, [cameraCountdown, showCameraModal, cameraStream])

    const takePhoto = async () => {
        if (!cameraVideoRef.current || !cameraCanvasRef.current || !diary) return

        const video = cameraVideoRef.current
        const canvas = cameraCanvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.drawImage(video, 0, 0)
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const formData = new FormData()
                    formData.append('file', blob, `photo_${Date.now()}.jpg`)

                    try {
                        const response = await fetch(`/api/diary/${diary.id}/upload/image`, {
                            method: 'POST',
                            body: formData
                        })
                        const result = await response.json()
                        if (result.success) {
                            loadDiary()
                        }
                    } catch (error) {
                        console.error('Upload photo error:', error)
                    }
                }
                closeCamera()
            }, 'image/jpeg', 0.9)
        }
    }

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setShowCameraModal(false)
        setCameraCountdown(0)
    }

    // 摄影功能
    const openVideoRecorder = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true
            })
            setVideoRecordStream(stream)
            setShowVideoRecordModal(true)

            setTimeout(() => {
                if (videoRecordRef.current) {
                    videoRecordRef.current.srcObject = stream
                }
            }, 100)
        } catch (error) {
            console.error('Open video recorder error:', error)
            alert('无法访问摄像头，请检查权限设置')
        }
    }

    const startVideoRecording = () => {
        if (!videoRecordStream) return

        const mediaRecorder = new MediaRecorder(videoRecordStream)
        videoMediaRecorderRef.current = mediaRecorder
        videoChunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
            videoChunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = async () => {
            const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
            await uploadRecordedVideo(videoBlob)
        }

        mediaRecorder.start()
        setIsVideoRecording(true)
        setVideoRecordTime(0)

        // 开始计时，最多60秒
        videoRecordTimerRef.current = setInterval(() => {
            setVideoRecordTime(prev => {
                if (prev >= 60) {
                    stopVideoRecording()
                    return 60
                }
                return prev + 1
            })
        }, 1000)
    }

    const stopVideoRecording = () => {
        if (videoMediaRecorderRef.current && isVideoRecording) {
            videoMediaRecorderRef.current.stop()
            setIsVideoRecording(false)
            if (videoRecordTimerRef.current) {
                clearInterval(videoRecordTimerRef.current)
                videoRecordTimerRef.current = null
            }
        }
    }

    const uploadRecordedVideo = async (blob: Blob) => {
        if (!diary) return
        const formData = new FormData()
        formData.append('file', blob, `video_${Date.now()}.webm`)

        try {
            const response = await fetch(`/api/diary/${diary.id}/upload/video`, {
                method: 'POST',
                body: formData
            })
            const result = await response.json()
            if (result.success) {
                loadDiary()
            }
        } catch (error) {
            console.error('Upload video error:', error)
        }
        closeVideoRecorder()
    }

    const closeVideoRecorder = () => {
        if (isVideoRecording) {
            stopVideoRecording()
        }
        if (videoRecordStream) {
            videoRecordStream.getTracks().forEach(track => track.stop())
            setVideoRecordStream(null)
        }
        setShowVideoRecordModal(false)
        setVideoRecordTime(0)
    }

    // 获取心情记录
    const getMoodRecord = (period: 'morning' | 'afternoon' | 'evening') => {
        return diary?.moods.find(m => m.period === period)
    }

    // 获取饮食记录
    const getMealRecord = (period: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
        return diary?.meals.find(m => m.period === period)
    }

    if (loading) {
        return (
            <PageContainer
                title="木木日记"
                subtitle="记录生活的点点滴滴"
                icon={<PenTool size={40} />}
                iconColor="text-purple-600"
                iconBgColor="bg-gradient-to-br from-purple-400 to-violet-500"
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer
            title="木木日记"
            subtitle="记录生活的点点滴滴"
            icon={<PenTool size={40} />}
            iconColor="text-purple-600"
            iconBgColor="bg-gradient-to-br from-purple-400 to-violet-500"
        >
            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                {/* 日期导航 */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {formatDisplayDate(currentDate)}
                            </h2>
                            {formatDate(currentDate) !== formatDate(new Date()) && (
                                <button
                                    onClick={goToToday}
                                    className="text-sm text-purple-500 hover:text-purple-600 mt-1"
                                >
                                    返回今天
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* 月份日记指示器 */}
                    <div className="flex justify-center gap-1 mt-4 flex-wrap">
                        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                            const day = i + 1
                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const hasDiary = diaries.some(d => d.id === dateStr && (d.weather || d.moods.length > 0 || d.events))
                            const isToday = dateStr === formatDate(currentDate)

                            return (
                                <button
                                    key={day}
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                    className={`w-7 h-7 rounded-full text-xs transition ${isToday
                                        ? 'bg-purple-500 text-white'
                                        : hasDiary
                                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 保存状态 */}
                {saving && (
                    <div className="fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
                        <Save size={16} className="animate-pulse" />
                        保存中...
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左列 */}
                    <div className="space-y-6">
                        {/* 天气 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Cloud className="text-blue-500" size={24} />
                                <h3 className="font-bold text-lg">今日天气</h3>
                                <span className="text-xs text-gray-400">（可多选）</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {options?.weatherOptions.map((weather) => (
                                    <button
                                        key={weather.value}
                                        onClick={() => toggleWeather(weather.value)}
                                        className={`px-4 py-2 rounded-full transition ${diary?.weather?.includes(weather.value)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {weather.emoji} {weather.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 天气体感 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Thermometer className="text-orange-500" size={24} />
                                <h3 className="font-bold text-lg">天气体感</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {options?.weatherFeelOptions?.map((feel) => (
                                    <button
                                        key={feel.value}
                                        onClick={() => updateWeatherFeel(feel.value)}
                                        className={`px-4 py-2 rounded-full transition ${diary?.weatherFeel === feel.value
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {feel.emoji} {feel.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 心情 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Smile className="text-yellow-500" size={24} />
                                <h3 className="font-bold text-lg">今日心情</h3>
                            </div>

                            {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                                const moodRecord = getMoodRecord(period)
                                const periodOptions = options?.moodOptions[period] || []

                                return (
                                    <div key={period} className="mb-4 last:mb-0">
                                        <div className="text-sm font-medium text-gray-600 mb-2">
                                            {periodLabels[period]}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {periodOptions.map((mood) => (
                                                <button
                                                    key={mood.value}
                                                    onClick={() => toggleMood(period, mood.value)}
                                                    className={`px-3 py-1.5 rounded-full text-sm transition ${moodRecord?.moods.includes(mood.value)
                                                        ? 'bg-yellow-400 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                        }`}
                                                >
                                                    {mood.emoji} {mood.label}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="或输入自定义心情..."
                                            value={moodRecord?.customMood || ''}
                                            onChange={(e) => updateCustomMood(period, e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                        />
                                    </div>
                                )
                            })}
                        </div>

                        {/* 饮食记录 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Utensils className="text-orange-500" size={24} />
                                <h3 className="font-bold text-lg">饮食记录</h3>
                            </div>

                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((period) => {
                                const mealRecord = getMealRecord(period)

                                return (
                                    <div key={period} className="mb-4 last:mb-0">
                                        <div className="text-sm font-medium text-gray-600 mb-2">
                                            {mealLabels[period]}
                                        </div>
                                        <textarea
                                            placeholder={`记录${mealLabels[period].slice(2)}吃了什么...`}
                                            value={mealRecord?.content || ''}
                                            onChange={(e) => updateMeal(period, e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 右列 */}
                    <div className="space-y-6">
                        {/* 一天的事情 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="text-green-500" size={24} />
                                <h3 className="font-bold text-lg">一天的事情</h3>
                            </div>
                            <textarea
                                placeholder="记录今天发生的事情..."
                                value={diary?.events || ''}
                                onChange={(e) => updateEvents(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                            />
                        </div>

                        {/* 图片 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Image className="text-pink-500" size={24} />
                                    <h3 className="font-bold text-lg">图片记录</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={openCamera}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg text-sm transition"
                                    >
                                        <Camera size={16} />
                                        拍照记录
                                    </button>
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-lg text-sm transition"
                                    >
                                        <Upload size={16} />
                                        上传
                                    </button>
                                </div>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {diary?.images.map((path, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img
                                            src={`/${path}`}
                                            alt=""
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => deleteMedia('image', path)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(!diary?.images || diary.images.length === 0) && (
                                    <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                                        还没有图片，点击上传或拍照添加
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 视频 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Video className="text-red-500" size={24} />
                                    <h3 className="font-bold text-lg">视频记录</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={openVideoRecorder}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg text-sm transition"
                                    >
                                        <Camera size={16} />
                                        摄影记录
                                    </button>
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm transition"
                                    >
                                        <Upload size={16} />
                                        上传
                                    </button>
                                </div>
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="space-y-2">
                                {diary?.videos.map((path, index) => (
                                    <div key={index} className="relative group">
                                        <video
                                            src={`/${path}`}
                                            controls
                                            className="w-full rounded-lg"
                                        />
                                        <button
                                            onClick={() => deleteMedia('video', path)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(!diary?.videos || diary.videos.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        还没有视频，点击上传或摄影添加
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 音频 */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Mic className="text-indigo-500" size={24} />
                                    <h3 className="font-bold text-lg">语音记录</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${isRecording
                                            ? 'bg-red-500 text-white animate-pulse'
                                            : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
                                            }`}
                                    >
                                        {isRecording ? <Pause size={16} /> : <Mic size={16} />}
                                        {isRecording ? '停止录音' : '开始录音'}
                                    </button>
                                    <button
                                        onClick={() => audioInputRef.current?.click()}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg text-sm transition"
                                    >
                                        <Upload size={16} />
                                        上传
                                    </button>
                                </div>
                                <input
                                    ref={audioInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleAudioUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="space-y-2">
                                {diary?.audios.map((path, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group">
                                        <audio
                                            src={`/${path}`}
                                            controls
                                            className="flex-1 h-10"
                                        />
                                        <button
                                            onClick={() => deleteMedia('audio', path)}
                                            className="p-1 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(!diary?.audios || diary.audios.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        还没有语音，点击录音或上传添加
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 拍照模态框 */}
            {showCameraModal && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                    <div className="relative">
                        <video
                            ref={cameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="max-w-full max-h-[70vh] rounded-lg"
                        />
                        {cameraCountdown > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-9xl font-bold text-white drop-shadow-lg animate-pulse">
                                    {cameraCountdown}
                                </div>
                            </div>
                        )}
                    </div>
                    <canvas ref={cameraCanvasRef} className="hidden" />
                    <button
                        onClick={closeCamera}
                        className="mt-6 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2"
                    >
                        <X size={20} />
                        取消
                    </button>
                </div>
            )}

            {/* 摄影模态框 */}
            {showVideoRecordModal && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                    <div className="relative">
                        <video
                            ref={videoRecordRef}
                            autoPlay
                            playsInline
                            muted
                            className="max-w-full max-h-[70vh] rounded-lg"
                        />
                        {isVideoRecording && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-lg">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                录制中 {videoRecordTime}s / 60s
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex gap-4">
                        {!isVideoRecording ? (
                            <button
                                onClick={startVideoRecording}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                            >
                                <Play size={20} />
                                开始录制
                            </button>
                        ) : (
                            <button
                                onClick={stopVideoRecording}
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center gap-2"
                            >
                                <Pause size={20} />
                                停止录制
                            </button>
                        )}
                        <button
                            onClick={closeVideoRecorder}
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2"
                        >
                            <X size={20} />
                            取消
                        </button>
                    </div>
                    <div className="mt-4 text-white/60 text-sm">
                        每条视频最多录制1分钟
                    </div>
                </div>
            )}
        </PageContainer>
    )
}
