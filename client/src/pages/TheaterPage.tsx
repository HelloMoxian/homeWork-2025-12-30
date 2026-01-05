import { Film } from 'lucide-react'
import PageContainer from '../components/PageContainer'

export default function TheaterPage() {
    return (
        <PageContainer title="放映厅">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Film className="text-indigo-500" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">放映厅</h1>
                </div>

                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl">
                    <Film size={64} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">放映厅功能开发中...</p>
                    <p className="text-gray-400 text-sm mt-1">敬请期待</p>
                </div>
            </div>
        </PageContainer>
    )
}
