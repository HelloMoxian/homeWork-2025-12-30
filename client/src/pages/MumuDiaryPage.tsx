import { PenTool } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function MumuDiaryPage() {
    return (
        <PageContainer
            title="木木日记"
            subtitle="记录生活的点点滴滴"
            icon={<PenTool size={40} />}
            iconColor="text-purple-600"
            iconBgColor="bg-gradient-to-br from-purple-400 to-violet-500"
        />
    )
}
