import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react'

interface AudioRecorderProps {
    recordings: string[]
    onRecordingsChange: (recordings: string[]) => void
}

export default function AudioRecorder({ recordings, onRecordingsChange }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [playingIndex, setPlayingIndex] = useState<number | null>(null)
    const [uploading, setUploading] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                stream.getTracks().forEach(track => track.stop())

                // 上传录音
                setUploading(true)
                try {
                    const formData = new FormData()
                    formData.append('file', blob, `recording_${Date.now()}.webm`)

                    const response = await fetch('/api/honors/upload-recording', {
                        method: 'POST',
                        body: formData
                    })
                    const result = await response.json()
                    if (result.success) {
                        onRecordingsChange([...recordings, result.data.path])
                    }
                } catch (error) {
                    console.error('上传录音失败:', error)
                } finally {
                    setUploading(false)
                }
            }

            mediaRecorder.start(1000)
            mediaRecorderRef.current = mediaRecorder
            setIsRecording(true)
            setRecordingTime(0)

            // 开始计时
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('无法访问麦克风:', error)
            alert('无法访问麦克风，请确保已授权麦克风权限')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }

    const deleteRecording = (index: number) => {
        const newRecordings = [...recordings]
        newRecordings.splice(index, 1)
        onRecordingsChange(newRecordings)
    }

    const playRecording = (index: number) => {
        if (playingIndex === index) {
            // 暂停
            audioRef.current?.pause()
            setPlayingIndex(null)
        } else {
            // 播放
            if (audioRef.current) {
                audioRef.current.pause()
            }
            audioRef.current = new Audio(recordings[index])
            audioRef.current.onended = () => setPlayingIndex(null)
            audioRef.current.play()
            setPlayingIndex(index)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-4">
            {/* 录音按钮 */}
            <div className="flex items-center gap-4">
                {isRecording ? (
                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                        <Square size={20} />
                        <span>停止录音</span>
                        <span className="ml-2 font-mono">{formatTime(recordingTime)}</span>
                    </button>
                ) : (
                    <button
                        onClick={startRecording}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        <Mic size={20} />
                        <span>{uploading ? '上传中...' : '开始录音'}</span>
                    </button>
                )}
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-500 text-sm">录音中...</span>
                    </div>
                )}
            </div>

            {/* 录音列表 */}
            {recordings.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">已录制 ({recordings.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                        {recordings.map((recording, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => playRecording(index)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {playingIndex === index ? (
                                            <Pause size={18} className="text-amber-500" />
                                        ) : (
                                            <Play size={18} className="text-gray-600" />
                                        )}
                                    </button>
                                    <span className="text-sm text-gray-600">感想 {index + 1}</span>
                                </div>
                                <button
                                    onClick={() => deleteRecording(index)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
