import { Star } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function FavoritesPage() {
    return (
        <PageContainer
            title="我的收藏"
            subtitle="珍藏美好，留住精彩"
            icon={<Star size={40} />}
            iconColor="text-yellow-600"
            iconBgColor="bg-gradient-to-br from-yellow-400 to-orange-400"
        />
    )
}
