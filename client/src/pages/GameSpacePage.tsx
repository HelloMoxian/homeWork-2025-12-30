import { Gamepad2 } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function GameSpacePage() {
    return (
        <PageContainer
            title="游戏空间"
            subtitle="寓教于乐，快乐成长"
            icon={<Gamepad2 size={40} />}
            iconColor="text-orange-600"
            iconBgColor="bg-gradient-to-br from-orange-400 to-amber-500"
        />
    )
}
