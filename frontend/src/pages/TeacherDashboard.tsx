import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { newsApi, scheduleApi } from '../api';
import { IconBarChart, IconCalendar, IconNewspaper, IconStar, IconBriefcase } from '../components/ui/Icons';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: news = [] } = useQuery({
    queryKey: ['news'],
    queryFn: () => newsApi.list().then((r) => r.data),
  });

  const { data: slots = [] } = useQuery({
    queryKey: ['my-schedule'],
    queryFn: () => scheduleApi.mySchedule().then((r) => r.data),
  });

  // Today's lessons (Monday=0 … Friday=4, today is day of week - 1 mod 5)
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const todaySlots = (slots as any[])
    .filter((s) => s.day_of_week === todayIdx)
    .sort((a, b) => a.period_num - b.period_num);

  const PERIOD_TIMES = ['08:00','08:55','09:50','10:45','11:40','12:35'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Добрый день, {user?.name}!</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-800">{(slots as any[]).length}</div>
          <div className="text-xs text-slate-500">уроков в неделю</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today */}
        <div className="card border-t-4 border-t-primary-500 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <IconCalendar className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Уроки сегодня</h3>
          </div>
          {todaySlots.length === 0 ? (
            <p className="text-sm text-slate-400">Сегодня уроков нет</p>
          ) : (
            <div className="space-y-2">
              {todaySlots.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-slate-400 w-10 flex-shrink-0">
                    {PERIOD_TIMES[s.period_num - 1] ?? ''}
                  </span>
                  <span className="font-medium text-slate-700 truncate">{s.subject_name}</span>
                  <span className="text-slate-400 text-xs ml-auto flex-shrink-0">{s.class_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card border-t-4 border-t-green-500 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <IconStar className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Оценки</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex-1">Выставить оценки ученикам по классу</p>
          <a href="/teacher/grades" className="btn-primary text-sm inline-block text-center">Открыть</a>
        </div>

        <div className="card border-t-4 border-t-orange-500 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <IconBriefcase className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Материалы</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex-1">Загрузить учебные материалы и ДЗ</p>
          <a href="/teacher/materials" className="btn-primary text-sm inline-block text-center">Открыть</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <IconBarChart className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Аналитика класса</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">Успеваемость учеников, слабые предметы, динамика</p>
          <a href="/teacher/analytics" className="btn-primary text-sm inline-block">Открыть</a>
        </div>

        <div className="card border-t-4 border-t-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <IconCalendar className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Расписание</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">Моё расписание по классам, оформление замен</p>
          <a href="/teacher/schedule" className="btn-primary text-sm inline-block">Открыть</a>
        </div>
      </div>

      {/* News */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <IconNewspaper className="w-4 h-4 text-slate-500" />
          <h3 className="section-title mb-0">Объявления и новости</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {(news as any[]).slice(0, 5).map((n: any) => (
            <div key={n.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(n.published_at).toLocaleDateString('ru')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
