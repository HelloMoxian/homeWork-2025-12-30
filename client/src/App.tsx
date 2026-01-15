import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import FamilyMembersPage from './pages/FamilyMembersPage'
import TodoTasksPage from './pages/TodoTasksPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import CategoryDetailPage from './pages/CategoryDetailPage'
import SectionDetailPage from './pages/SectionDetailPage'
import SubSectionDetailPage from './pages/SubSectionDetailPage'
import MumuDiaryPage from './pages/MumuDiaryPage'
import PeriodicTasksPage from './pages/PeriodicTasksPage'
import GameSpacePage from './pages/GameSpacePage'
import TheaterPage from './pages/TheaterPage'
import HonorsPage from './pages/HonorsPage'
import HonorHallDetailPage from './pages/HonorHallDetailPage'
import HonorDetailPage from './pages/HonorDetailPage'
import HonorPlayPage from './pages/HonorPlayPage'
import FavoritesPage from './pages/FavoritesPage'
import GrowthTrackPage from './pages/GrowthTrackPage'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="family" element={<FamilyMembersPage />} />
                <Route path="todos" element={<TodoTasksPage />} />
                <Route path="knowledge" element={<KnowledgeBasePage />} />
                <Route path="knowledge/:categoryId" element={<CategoryDetailPage />} />
                <Route path="knowledge/:categoryId/:sectionId" element={<SectionDetailPage />} />
                <Route path="knowledge/:categoryId/:sectionId/:subSectionId" element={<SubSectionDetailPage />} />
                <Route path="diary" element={<MumuDiaryPage />} />
                <Route path="periodic" element={<PeriodicTasksPage />} />
                <Route path="games" element={<GameSpacePage />} />
                <Route path="theater" element={<TheaterPage />} />
                <Route path="honors" element={<HonorsPage />} />
                <Route path="honors/:hallId" element={<HonorHallDetailPage />} />
                <Route path="honors/:hallId/detail/:honorId" element={<HonorDetailPage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="growth" element={<GrowthTrackPage />} />
            </Route>
            {/* 荣誉播放页面（全屏，不使用Layout） */}
            <Route path="honors/:hallId/play" element={<HonorPlayPage />} />
        </Routes>
    )
}

export default App
