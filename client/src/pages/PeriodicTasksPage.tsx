import { RefreshCw } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function PeriodicTasksPage() {
    return (
        <PageContainer
            title="周期任务"
            subtitle="养成好习惯，坚持每一天"
            icon={<RefreshCw size={40} />}
            iconColor="text-cyan-600"
            iconBgColor="bg-gradient-to-br from-cyan-400 to-teal-500"
        />
    )
}
