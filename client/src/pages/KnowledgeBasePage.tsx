import { BookOpen } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function KnowledgeBasePage() {
    return (
        <PageContainer
            title="知识库"
            subtitle="知识的海洋，智慧的源泉"
            icon={<BookOpen size={40} />}
            iconColor="text-blue-600"
            iconBgColor="bg-gradient-to-br from-blue-400 to-indigo-500"
        />
    )
}
