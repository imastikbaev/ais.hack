import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore, translations, type Lang } from '../../stores/langStore';
import {
  IconHome, IconBarChart, IconTrendUp, IconCalendar, IconBookOpen,
  IconHeart, IconCoin, IconTrophy, IconLogOut,
  IconNewspaper, IconClipboard, IconStar, IconBriefcase,
} from './Icons';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
}

interface NavGroup {
  labelKey?: string;
  items: NavItem[];
}

const studentGroups: NavGroup[] = [
  {
    items: [
      { path: '/student', labelKey: 'home', icon: <IconHome /> },
    ],
  },
  {
    labelKey: 'study',
    items: [
      { path: '/student/grades',   labelKey: 'grades',       icon: <IconBarChart /> },
      { path: '/student/ai',       labelKey: 'performance',  icon: <IconTrendUp /> },
      { path: '/student/schedule', labelKey: 'schedule',     icon: <IconCalendar /> },
      { path: '/student/kundelik', labelKey: 'kundelik',     icon: <IconBookOpen /> },
    ],
  },
  {
    labelKey: 'school_life',
    items: [
      { path: '/student/nisgram',       labelKey: 'nisgram',      icon: <IconNewspaper /> },
      { path: '/student/wellness',      labelKey: 'wellness',     icon: <IconHeart /> },
      { path: '/student/currency',      labelKey: 'canteen',      icon: <IconCoin /> },
      { path: '/student/gamification',  labelKey: 'achievements', icon: <IconTrophy /> },
    ],
  },
];

const teacherGroups: NavGroup[] = [
  {
    items: [
      { path: '/teacher', labelKey: 'home', icon: <IconHome /> },
    ],
  },
  {
    labelKey: 'edu_process',
    items: [
      { path: '/teacher/grades',    labelKey: 'grades',      icon: <IconStar /> },
      { path: '/teacher/materials', labelKey: 'materials',   icon: <IconBriefcase /> },
      { path: '/teacher/analytics', labelKey: 'analytics',   icon: <IconBarChart /> },
      { path: '/teacher/schedule',  labelKey: 'schedule',    icon: <IconCalendar /> },
    ],
  },
];

const parentGroups: NavGroup[] = [
  {
    items: [
      { path: '/parent', labelKey: 'home', icon: <IconHome /> },
    ],
  },
  {
    labelKey: 'my_children',
    items: [
      { path: '/parent', labelKey: 'performance', icon: <IconBarChart /> },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    items: [
      { path: '/admin', labelKey: 'home', icon: <IconHome /> },
    ],
  },
  {
    labelKey: 'management',
    items: [
      { path: '/admin/schedule', labelKey: 'schedule', icon: <IconCalendar /> },
      { path: '/admin/news',     labelKey: 'news',     icon: <IconNewspaper /> },
      { path: '/admin/reports',  labelKey: 'reports',  icon: <IconClipboard /> },
    ],
  },
];

function roleGroups(role: string): NavGroup[] {
  if (role === 'teacher') return teacherGroups;
  if (role === 'admin')   return adminGroups;
  if (role === 'parent')  return parentGroups;
  return studentGroups;
}

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
  { code: 'en', label: 'EN' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { lang, setLang } = useLangStore();
  const t = (key: string) => translations[lang]?.[key] ?? key;

  if (!user) return null;

  const groups = roleGroups(user.role);
  const initials = (() => {
    const last = user.name.split(' ').at(-1) ?? '';
    return /^\d+$/.test(last) ? last : user.name.charAt(0);
  })();

  const roleKey = `role_${user.role}` as const;

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
            <div className="text-slate-400 text-xs mt-0.5">{t(roleKey)}</div>
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
            {group.labelKey && (
              <div className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t(group.labelKey)}
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
                  <span>{item.labelKey === 'kundelik' ? 'Kundelik' : t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Language switcher */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors ${
                lang === code
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-3">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full"
        >
          <IconLogOut />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
