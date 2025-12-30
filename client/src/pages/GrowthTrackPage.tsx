import { TrendingUp } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function GrowthTrackPage() {
    return (
        <PageContainer
            title="成长轨迹"
            subtitle="见证成长，记录足迹"
            icon={<TrendingUp size={40} />}
            iconColor="text-rose-600"
            iconBgColor="bg-gradient-to-br from-rose-400 to-pink-500"
        />
    )
}
