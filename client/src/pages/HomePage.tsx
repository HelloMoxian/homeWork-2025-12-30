import { Home, Users, CheckSquare, BookOpen, PenTool, RefreshCw, Gamepad2, Star, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface QuickCard {
    path: string
    label: string
    icon: React.ReactNode
    color: string
    bgGradient: string
    emoji: string
}

const quickCards: QuickCard[] = [
    {
        path: '/family',
        label: '家庭成员',
        icon: <Users size={36} />,
        color: 'text-white',
        bgGradient: 'from-pink-400 to-rose-500',
        emoji: '👨‍👩‍👧‍👦'
    },
    {
        path: '/todos',
        label: '待做任务',
        icon: <CheckSquare size={36} />,
        color: 'text-white',
        bgGradient: 'from-green-400 to-emerald-500',
        emoji: '✅'
    },
    {
        path: '/knowledge',
        label: '知识库',
        icon: <BookOpen size={36} />,
        color: 'text-white',
        bgGradient: 'from-blue-400 to-indigo-500',
        emoji: '📚'
    },
    {
        path: '/diary',
        label: '木木日记',
        icon: <PenTool size={36} />,
        color: 'text-white',
        bgGradient: 'from-purple-400 to-violet-500',
        emoji: '📝'
    },
    {
        path: '/periodic',
        label: '周期任务',
        icon: <RefreshCw size={36} />,
        color: 'text-white',
        bgGradient: 'from-cyan-400 to-teal-500',
        emoji: '🔄'
    },
    {
        path: '/games',
        label: '游戏空间',
        icon: <Gamepad2 size={36} />,
        color: 'text-white',
        bgGradient: 'from-orange-400 to-amber-500',
        emoji: '🎮'
    },
    {
        path: '/favorites',
        label: '我的收藏',
        icon: <Star size={36} />,
        color: 'text-white',
        bgGradient: 'from-yellow-400 to-orange-400',
        emoji: '⭐'
    },
    {
        path: '/growth',
        label: '成长轨迹',
        icon: <TrendingUp size={36} />,
        color: 'text-white',
        bgGradient: 'from-rose-400 to-pink-500',
        emoji: '📈'
    },
]

export default function HomePage() {
    const now = new Date()
    const hour = now.getHours()
    let greeting = '早上好'
    let greetingEmoji = '🌅'

    if (hour >= 12 && hour < 14) {
        greeting = '中午好'
        greetingEmoji = '☀️'
    } else if (hour >= 14 && hour < 18) {
        greeting = '下午好'
        greetingEmoji = '🌤️'
    } else if (hour >= 18 && hour < 22) {
        greeting = '晚上好'
        greetingEmoji = '🌙'
    } else if (hour >= 22 || hour < 6) {
        greeting = '夜深了'
        greetingEmoji = '🌟'
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* 欢迎区域 */}
            <div className="mb-10 text-center">
                <div className="text-7xl mb-4">{greetingEmoji}</div>
                <h1 className="text-5xl font-bold text-gray-800 mb-3">
                    {greeting}，欢迎回家！
                </h1>
                <p className="text-2xl text-gray-500">
                    今天是 {now.getFullYear()}年{now.getMonth() + 1}月{now.getDate()}日
                </p>
            </div>

            {/* 快捷入口卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {quickCards.map((card) => (
                    <Link
                        key={card.path}
                        to={card.path}
                        className={cn(
                            'group relative overflow-hidden rounded-3xl p-6 shadow-card transition-all duration-300',
                            'hover:scale-105 hover:shadow-xl',
                            'bg-gradient-to-br',
                            card.bgGradient
                        )}
                    >
                        {/* 背景装饰 */}
                        <div className="absolute -right-4 -bottom-4 text-8xl opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
                            {card.emoji}
                        </div>

                        {/* 内容 */}
                        <div className="relative z-10">
                            <div className={cn('mb-4', card.color)}>
                                {card.icon}
                            </div>
                            <h3 className={cn('text-2xl font-bold', card.color)}>
                                {card.label}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>

            {/* 底部鼓励语 */}
            <div className="mt-12 text-center">
                <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-soft">
                    <p className="text-xl text-gray-600">
                        🌈 每天进步一点点，生活更美好！
                    </p>
                </div>
            </div>
        </div>
    )
}
