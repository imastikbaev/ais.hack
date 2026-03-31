import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../stores/authStore';

const demoAccounts = [
  { label: 'Ученик 1',   sublabel: '10А класс',            email: 'student1@aqbobek.kz',  password: 'student123' },
  { label: 'Учитель',    sublabel: 'Учитель математики',   email: 'math@aqbobek.kz',      password: 'teacher123' },
  { label: 'Родитель 1', sublabel: 'Родитель Ученика 1',   email: 'parent1@aqbobek.kz',   password: 'parent123'  },
  { label: 'Управление школы', sublabel: 'Администратор лицея', email: 'admin@aqbobek.kz', password: 'admin123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, user, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function roleHome(role: string) {
    if (role === 'admin')   return '/admin';
    if (role === 'teacher') return '/teacher';
    if (role === 'kiosk')   return '/kiosk';
    if (role === 'parent')  return '/parent';
    return '/student';
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated() && user) navigate(roleHome(user.role), { replace: true });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { access_token, refresh_token, user } = res.data;
      setAuth(user, access_token, refresh_token);
      navigate(roleHome(user.role));
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — school identity */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 px-12 py-10 text-white" style={{ background: 'linear-gradient(160deg, #2d0047 0%, #11001d 100%)' }}>
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-8" style={{ backgroundColor: '#58058C' }}>
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-white">Aqbobek<br/>Lyceum</h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            Единый школьный портал для учеников,<br/>учителей и администрации
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h4v7H3zM9.5 8h4v12.5h-4zM16 4h4v16.5h-4z" />
                </svg>
              ),
              text: 'Оценки и расписание в одном месте',
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ),
              text: 'Достижения и рейтинг учеников',
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              ),
              text: 'Психологическая поддержка',
            },
            {
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              ),
              text: 'Заказ еды в буфете',
            },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm" style={{ color: '#cbd5e1' }}>
              <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                {f.icon}
              </span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: '#475569' }}>© 2026 Aqbobek Lyceum</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-slate-100 px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-primary-500 items-center justify-center mb-3">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Aqbobek Lyceum</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Добро пожаловать</h2>
            <p className="text-sm text-slate-500 mb-6">Войдите в свой аккаунт</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@aqbobek.kz"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-3">Демо-аккаунты</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                    className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-xs"
                  >
                    <div className="font-semibold text-slate-700">{acc.label}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{acc.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
