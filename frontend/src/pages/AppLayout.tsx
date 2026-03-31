import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
  allowedRoles?: string[];
}

export default function AppLayout({ allowedRoles }: LayoutProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin')   return <Navigate to="/admin"   replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (user.role === 'kiosk')   return <Navigate to="/kiosk"   replace />;
    if (user.role === 'parent')  return <Navigate to="/parent"  replace />;
    return <Navigate to="/student" replace />;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f7f4fa' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
