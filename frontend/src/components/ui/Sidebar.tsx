import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  IconHome, IconBarChart, IconTrendUp, IconCalendar, IconBookOpen,
  IconHeart, IconCoin, IconTrophy, IconLogOut,
  IconNewspaper, IconClipboard, IconStar, IconBriefcase,
} from './Icons';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const studentGroups: NavGroup[] = [
  {
    items: [
      { path: '/student', label: 'Главная', icon: <IconHome /> },
    ],
  },
  {
    label: 'Учёба',
    items: [
      { path: '/student/grades',   label: 'Оценки',       icon: <IconBarChart /> },
      { path: '/student/ai',       label: 'Успеваемость', icon: <IconTrendUp /> },
      { path: '/student/schedule', label: 'Расписание',   icon: <IconCalendar /> },
      { path: '/student/kundelik', label: 'Kundelik',     icon: <IconBookOpen /> },
    ],
  },
  {
    label: 'Школьная жизнь',
    items: [
      { path: '/student/wellness',      label: 'Тесты',       icon: <IconHeart /> },
      { path: '/student/currency',      label: 'Буфет',       icon: <IconCoin /> },
      { path: '/student/gamification',  label: 'Достижения',  icon: <IconTrophy /> },
    ],
  },
];

const teacherGroups: NavGroup[] = [
  {
    items: [
      { path: '/teacher', label: 'Главная', icon: <IconHome /> },
    ],
  },
  {
    label: 'Учебный процесс',
    items: [
      { path: '/teacher/grades',    label: 'Оценки',     icon: <IconStar /> },
      { path: '/teacher/materials', label: 'Материалы',  icon: <IconBriefcase /> },
      { path: '/teacher/analytics', label: 'Аналитика',  icon: <IconBarChart /> },
      { path: '/teacher/schedule',  label: 'Расписание', icon: <IconCalendar /> },
    ],
  },
];

const parentGroups: NavGroup[] = [
  {
    items: [
      { path: '/parent', label: 'Главная', icon: <IconHome /> },
    ],
  },
  {
    label: 'Мои дети',
    items: [
      { path: '/parent', label: 'Успеваемость', icon: <IconBarChart /> },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    items: [
      { path: '/admin', label: 'Главная', icon: <IconHome /> },
    ],
  },
  {
    label: 'Управление',
    items: [
      { path: '/admin/schedule', label: 'Расписание', icon: <IconCalendar /> },
      { path: '/admin/news',     label: 'Новости',    icon: <IconNewspaper /> },
      { path: '/admin/reports',  label: 'Отчёты',     icon: <IconClipboard /> },
    ],
  },
];

function roleGroups(role: string): NavGroup[] {
  if (role === 'teacher') return teacherGroups;
  if (role === 'admin')   return adminGroups;
  if (role === 'parent')  return parentGroups;
  return studentGroups;
}

function roleName(role: string) {
  if (role === 'teacher') return 'Учитель';
  if (role === 'admin')   return 'Администратор';
  if (role === 'kiosk')   return 'Стенд';
  if (role === 'parent')  return 'Родитель';
  return 'Ученик';
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const groups = roleGroups(user.role);
  const initials = (() => {
    const last = user.name.split(' ').at(-1) ?? '';
    return /^\d+$/.test(last) ? last : user.name.charAt(0);
  })();

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#11001d' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="Aqbobek" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Aqbobek Lyceum</div>
            <div className="text-slate-400 text-xs mt-0.5">{roleName(user.role)}</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.name}</div>
            <div className="text-slate-400 text-xs truncate">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/student' || item.path === '/teacher' || item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full"
        >
          <IconLogOut />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
