import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './pages/AppLayout';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import GradesPage from './pages/GradesPage';
import AITutorPage from './pages/AITutorPage';
import SchedulePage from './pages/SchedulePage';
import GamificationPage from './pages/GamificationPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAnalytics from './pages/TeacherAnalytics';
import TeacherSchedulePage from './pages/TeacherSchedulePage';
import TeacherGradesPage from './pages/TeacherGradesPage';
import TeacherMaterialsPage from './pages/TeacherMaterialsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSchedulePage from './pages/AdminSchedulePage';
import ParentDashboard from './pages/ParentDashboard';
import ParentChildPage from './pages/ParentChildPage';
import KioskMode from './pages/KioskMode';
import KundelikPage from './pages/KundelikPage';
import NisGramPage from './pages/NisGramPage';
import WellnessPage from './pages/WellnessPage';
import CurrencyPage from './pages/CurrencyPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kiosk" element={<KioskMode />} />

          <Route element={<AppLayout allowedRoles={['student']} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/grades" element={<GradesPage />} />
            <Route path="/student/ai" element={<AITutorPage />} />
            <Route path="/student/schedule" element={<SchedulePage />} />
            <Route path="/student/portfolio" element={<GamificationPage />} />
            <Route path="/student/gamification" element={<GamificationPage />} />
            <Route path="/student/kundelik" element={<KundelikPage />} />
            <Route path="/student/nisgram" element={<NisGramPage />} />
            <Route path="/student/wellness" element={<WellnessPage />} />
            <Route path="/student/currency" element={<CurrencyPage />} />
          </Route>

          <Route element={<AppLayout allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
            <Route path="/teacher/schedule" element={<TeacherSchedulePage />} />
            <Route path="/teacher/grades" element={<TeacherGradesPage />} />
            <Route path="/teacher/materials" element={<TeacherMaterialsPage />} />
          </Route>

          <Route element={<AppLayout allowedRoles={['parent']} />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/child/:id" element={<ParentChildPage />} />
          </Route>

          <Route element={<AppLayout allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/schedule" element={<AdminSchedulePage />} />
            <Route path="/admin/news" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
