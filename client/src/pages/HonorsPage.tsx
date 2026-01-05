import { Trophy } from 'lucide-react'
import PageContainer from '../components/PageContainer'

export default function HonorsPage() {
    return (
        <PageContainer title="荣誉室">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="text-amber-500" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">荣誉室</h1>
                </div>

                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                    <Trophy size={64} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">荣誉室功能开发中...</p>
                    <p className="text-gray-400 text-sm mt-1">敬请期待</p>
                </div>
            </div>
        </PageContainer>
    )
}
