import { CheckSquare } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function TodoTasksPage() {
    return (
        <PageContainer
            title="待做任务"
            subtitle="今天的目标，明天的成就"
            icon={<CheckSquare size={40} />}
            iconColor="text-green-600"
            iconBgColor="bg-gradient-to-br from-green-400 to-emerald-500"
        />
    )
}
