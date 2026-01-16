import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Gamepad2,
    Play,
    Clock,
    Trophy,
    Calendar,
    Star
} from 'lucide-react'
import PageContainer from '@/components/PageContainer'

// 类型定义
interface GameInfo {
    id: string
    name: string
    cover: string
    description?: string
    enabled: boolean
    createTime: string
}

interface GameStats {
    gameCount: number
    totalPlayTime: number
    todayPlayTime: number
    highestScore: number
    todayHighestScore: number
    lastPlayDate: string
    todayDate: string
}

// 格式化时间
function formatTime(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}秒`
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`
    } else {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`
    }
}

// 游戏卡片组件
function GameCard({
    game,
    stats,
    onClick
}: {
    game: GameInfo
    stats: GameStats | null
    onClick: () => void
}) {
    return (
        <div
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] border border-gray-100"
            onClick={onClick}
        >
            {/* 游戏封面 */}
            <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-amber-100">
                {game.cover && (
                    <img
                        src={game.cover}
                        alt={game.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    {!game.cover && (
                        <Gamepad2 size={48} className="text-orange-400 opacity-50" />
                    )}
                </div>
                {/* 播放按钮 */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
                    <div className="w-16 h-16 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={32} className="text-orange-500 ml-1" />
                    </div>
                </div>
            </div>

            {/* 游戏信息 */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{game.name}</h3>
                {game.description && (
                    <p className="text-sm text-gray-500 mb-3">{game.description}</p>
                )}

                {/* 统计数据网格 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* 游戏次数 */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Play size={14} className="text-blue-500" />
                        <span>游戏次数:</span>
                        <span className="font-semibold text-gray-800">
                            {stats?.gameCount || 0}
                        </span>
                    </div>

                    {/* 累计时间 */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock size={14} className="text-green-500" />
                        <span>累计:</span>
                        <span className="font-semibold text-gray-800">
                            {formatTime(stats?.totalPlayTime || 0)}
                        </span>
                    </div>

                    {/* 今日时间 */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={14} className="text-purple-500" />
                        <span>今日:</span>
                        <span className="font-semibold text-gray-800">
                            {formatTime(stats?.todayPlayTime || 0)}
                        </span>
                    </div>

                    {/* 历史最高分 */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Trophy size={14} className="text-amber-500" />
                        <span>最高分:</span>
                        <span className="font-semibold text-gray-800">
                            {stats?.highestScore || 0}
                        </span>
                    </div>

                    {/* 今日最高分 */}
                    <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                        <Star size={14} className="text-red-500" />
                        <span>今日最高分:</span>
                        <span className="font-semibold text-gray-800">
                            {stats?.todayHighestScore || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function GameSpacePage() {
    const navigate = useNavigate()
    const [games, setGames] = useState<GameInfo[]>([])
    const [allStats, setAllStats] = useState<Record<string, GameStats>>({})
    const [loading, setLoading] = useState(true)

    // 加载数据
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 并行加载游戏列表和统计数据
            const [gamesRes, statsRes] = await Promise.all([
                fetch('/api/games/list'),
                fetch('/api/games/stats')
            ])

            const gamesData = await gamesRes.json()
            const statsData = await statsRes.json()

            if (gamesData.success) {
                setGames(gamesData.data.filter((g: GameInfo) => g.enabled))
            }
            if (statsData.success) {
                setAllStats(statsData.data)
            }
        } catch (error) {
            console.error('加载游戏数据失败:', error)
        } finally {
            setLoading(false)
        }
    }

    // 进入游戏
    const enterGame = (gameId: string) => {
        navigate(`/game-space/${gameId}`)
    }

    return (
        <PageContainer
            title="游戏空间"
            subtitle="寓教于乐，快乐成长"
            icon={<Gamepad2 size={40} />}
            iconColor="text-orange-600"
            iconBgColor="bg-gradient-to-br from-orange-400 to-amber-500"
        >
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Gamepad2 size={64} className="mb-4 opacity-50" />
                        <p className="text-lg">暂无可用游戏</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                stats={allStats[game.id] || null}
                                onClick={() => enterGame(game.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
