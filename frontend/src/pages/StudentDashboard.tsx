import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '../api';
import { useAuthStore } from '../stores/authStore';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import type { StudentAnalytics } from '../types';
import { useLangStore, translations } from '../stores/langStore';

function GradeBadge({ avg }: { avg: number }) {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  if (avg >= 4.5) return <span className="badge-green">{t('excellent')}</span>;
  if (avg >= 3.8) return <span className="badge-blue">{t('good')}</span>;
  if (avg >= 3.0) return <span className="badge-orange">{t('ok')}</span>;
  return <span className="badge-red">{t('help')}</span>;
}

export default function StudentDashboard() {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  const { user } = useAuthStore();
  const { data: analytics, isLoading } = useQuery<StudentAnalytics>({
    queryKey: ['my-analytics'],
    queryFn: () => gradesApi.myAnalytics().then((r) => r.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!analytics) return null;

  const subjects = analytics.subjects as Array<typeof analytics.subjects[0] & { trend_slope?: number }>;

  const radarData = subjects.slice(0, 7).map((s) => ({
    subject: s.subject_name.slice(0, 8),
    value: Math.round(s.average * 20),
  }));

  const topSubject   = [...subjects].sort((a, b) => b.average - a.average)[0];
  const worstSubject = [...subjects].sort((a, b) => a.average - b.average)[0];
  const overallAvg   = subjects.length
    ? subjects.reduce((s, x) => s + x.average, 0) / subjects.length
    : 0;
  const improving = subjects.filter((s) => (s.trend_slope ?? 0) > 0.02).length;
  const declining = subjects.filter((s) => (s.trend_slope ?? 0) < -0.02).length;

  const avgColor =
    overallAvg >= 4.5 ? '#16a34a' :
    overallAvg >= 3.8 ? '#58058C' :
    overallAvg >= 3.0 ? '#f97316' : '#ef4444';

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Привет, {user?.name}!</h1>
          <p className="page-subtitle">Твой учебный дашборд · {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
        </div>
        <GradeBadge avg={overallAvg} />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: avgColor }}
          >
            {overallAvg.toFixed(1)}
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-0.5">{t('avg_grade')}</div>
            <div className="text-sm text-slate-600">
              {improving > 0 && <span className="text-green-600 font-medium">↑{improving} {t('growing')} </span>}
              {declining > 0 && <span className="text-red-500 font-medium">↓{declining} {t('falling')}</span>}
              {improving === 0 && declining === 0 && <span className="text-slate-400">{t('stable')}</span>}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-green-400">
          <div className="text-xs text-slate-500 mb-0.5">{t('best_subject')}</div>
          <div className="font-semibold text-green-700">{topSubject?.subject_name}</div>
          <div className="text-3xl font-bold text-slate-800">{topSubject?.average.toFixed(1)}</div>
        </div>

        <div className="card border-l-4 border-l-orange-400">
          <div className="text-xs text-slate-500 mb-0.5">{t('needs_work')}</div>
          <div className="font-semibold text-orange-600">{worstSubject?.subject_name}</div>
          <div className="text-3xl font-bold text-slate-800">{worstSubject?.average.toFixed(1)}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="section-title">{t('radar')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="#58058C" fill="#58058C" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">{t('grades_by_subject')}</h3>
          <div className="space-y-3">
            {[...subjects]
              .sort((a, b) => b.average - a.average)
              .slice(0, 6)
              .map((s) => {
                const color =
                  s.average >= 4.5 ? '#16a34a' :
                  s.average >= 3.8 ? '#58058C' :
                  s.average >= 3.0 ? '#f97316' : '#ef4444';
                return (
                  <div key={s.subject_id} className="flex items-center gap-3">
                    <div className="text-sm text-slate-600 w-28 truncate">{s.subject_name}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${s.average * 20}%`, backgroundColor: color }} />
                    </div>
                    <div className="text-sm font-semibold w-8 text-right" style={{ color }}>{s.average.toFixed(1)}</div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {analytics.high_risk_subjects.length > 0 && (
        <div className="card border-l-4 border-l-orange-400 bg-orange-50/50">
          <h3 className="font-semibold text-slate-800 mb-1">{t('pay_attention')}</h3>
          <p className="text-sm text-slate-600">
            Средний балл ниже 3.5 по: <strong className="text-orange-700">{analytics.high_risk_subjects.join(', ')}</strong>.
            {t('check_performance')}, чтобы разобраться с пробелами.
          </p>
        </div>
      )}
    </div>
  );
}
