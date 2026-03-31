import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { parentApi, newsApi } from '../api';
import type { NewsItem } from '../types';

function GradeBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, (value / 5) * 100);
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-blue-500' : 'bg-orange-500';
  const textColor = value >= 4 ? 'text-green-700' : value >= 3 ? 'text-blue-700' : 'text-orange-600';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 text-slate-500 truncate">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-7 text-right font-semibold ${textColor}`}>{value}</span>
    </div>
  );
}

function OverallBadge({ avg }: { avg: number }) {
  if (avg >= 4.5) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Отличник</span>;
  if (avg >= 3.5) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Хорошист</span>;
  if (avg >= 2.5) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">Справляется</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Нужна помощь</span>;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => parentApi.myChildren().then((r) => r.data),
  });

  const { data: news = [] } = useQuery<NewsItem[]>({
    queryKey: ['news-announcements'],
    queryFn: () => newsApi.announcements().then((r) => r.data),
  });

  const today = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Личный кабинет родителя</h1>
        <p className="page-subtitle">{user?.name} · {today}</p>
      </div>

      {/* Children */}
      <div>
        <h2 className="section-title">Мои дети</h2>
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!isLoading && (children as any[]).length === 0 && (
          <div className="card text-center py-10 text-slate-400 text-sm">
            Нет привязанных учеников
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(children as any[]).map((child) => {
            const subjects = Object.entries(child.subject_averages ?? {}) as [string, number][];
            const avg = subjects.length
              ? subjects.reduce((s, [, v]) => s + v, 0) / subjects.length
              : 0;
            const rounded = Math.round(avg * 10) / 10;
            const weakSubjects = subjects.filter(([, v]) => v < 3.0);

            return (
              <div key={child.id} className="card flex flex-col gap-4">
                {/* Child header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{child.name}</div>
                      <div className="text-xs text-slate-500">{child.class_name ?? '—'}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-2xl font-bold text-slate-700">{rounded.toFixed(1)}</span>
                    <OverallBadge avg={rounded} />
                  </div>
                </div>

                {/* Subject bars */}
                <div className="space-y-2">
                  {subjects.slice(0, 6).map(([subj, val]) => (
                    <GradeBar key={subj} label={subj} value={val} />
                  ))}
                  {subjects.length > 6 && (
                    <p className="text-xs text-slate-400">+{subjects.length - 6} предметов</p>
                  )}
                </div>

                {/* Alerts */}
                {weakSubjects.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span>
                      Слабые предметы: {weakSubjects.map(([s]) => s).join(', ')}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/parent/child/${child.id}`)}
                    className="btn-primary flex-1 text-sm py-2"
                  >
                    Оценки и расписание
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* School news */}
      <div>
        <h2 className="section-title">Объявления школы</h2>
        <div className="space-y-3">
          {(news as NewsItem[]).slice(0, 5).map((item) => (
            <div key={item.id} className="card-accent">
              <div className="font-medium text-slate-800">{item.title}</div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.body}</p>
              <div className="text-xs text-slate-400 mt-2">
                {new Date(item.published_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
          {(news as NewsItem[]).length === 0 && (
            <div className="card text-center py-6 text-slate-400 text-sm">Нет объявлений</div>
          )}
        </div>
      </div>
    </div>
  );
}
