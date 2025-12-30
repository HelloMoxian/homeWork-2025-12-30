import { Users } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function FamilyMembersPage() {
    return (
        <PageContainer
            title="家庭成员"
            subtitle="我们温馨的一家人"
            icon={<Users size={40} />}
            iconColor="text-pink-600"
            iconBgColor="bg-gradient-to-br from-pink-400 to-rose-500"
        />
    )
}
