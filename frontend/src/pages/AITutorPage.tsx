import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StudentAnalytics, SubjectSummary } from '../types';
import { useLangStore, translations } from '../stores/langStore';

// Grade label based on average
function gradeLabel(avg: number, t: (k: string) => string): { text: string; cls: string } {
  if (avg >= 4.5) return { text: t('grade_excellent'), cls: 'bg-green-100 text-green-700 border-green-200' };
  if (avg >= 3.8) return { text: t('grade_good'),      cls: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (avg >= 3.0) return { text: t('grade_ok'),        cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  return           { text: t('grade_bad'),              cls: 'bg-red-100 text-red-700 border-red-200' };
}

function trendArrow(slope: number) {
  if (slope >  0.02) return <span className="text-green-600 font-bold text-base" title="Оценки растут">↑</span>;
  if (slope < -0.02) return <span className="text-red-500 font-bold text-base" title="Оценки снижаются">↓</span>;
  return               <span className="text-slate-400 font-bold text-base" title="Стабильно">→</span>;
}

function RiskMeter({ risk }: { risk: number }) {
  const pct = Math.round(risk * 100);
  const color = risk >= 0.6 ? '#ef4444' : risk >= 0.35 ? '#f97316' : '#22c55e';
  const label =
    risk >= 0.6  ? `С вероятностью ${pct}% ты завалишь следующий СОЧ` :
    risk >= 0.35 ? `Умеренный риск — ${pct}%. Стоит повторить материал` :
                   `Риск низкий — ${pct}%. Так держать!`;
  return (
    <div className="card border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">AI Risk Score</span>
        <span className="text-2xl font-black" style={{ color }}>{pct}%</span>
      </div>
      <p className="text-sm text-slate-600 mb-3">{label}</p>
      <div className="w-full bg-slate-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>Низкий</span><span>Умеренный</span><span>Высокий</span>
      </div>
    </div>
  );
}

function SubjectCard({ subject }: { subject: SubjectSummary & { trend_slope?: number; grades_count?: number; risk_score?: number; recommendations?: { title: string; url: string }[] } }) {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  const label = gradeLabel(subject.average, t);
  const barColor =
    subject.average >= 4.5 ? '#22c55e' :
    subject.average >= 3.8 ? '#8b1fc8' :
    subject.average >= 3.0 ? '#f97316' : '#ef4444';
  const riskPct = Math.round((subject.risk_score ?? 0) * 100);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{subject.subject_name}</h3>
          <div className="text-xs text-slate-400 mt-0.5">{subject.grades_count ?? '—'} {t('n_grades')}</div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded border ml-2 flex-shrink-0 ${label.cls}`}>
          {label.text}
        </span>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <div className="text-4xl font-bold" style={{ color: barColor }}>
          {subject.average.toFixed(1)}
        </div>
        <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
          {trendArrow(subject.trend_slope ?? 0)}
          <span className="text-xs">
            {(subject.trend_slope ?? 0) > 0.02 ? t('rising') :
             (subject.trend_slope ?? 0) < -0.02 ? t('declining') : t('stable')}
          </span>
        </div>
        {riskPct >= 35 && (
          <div className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            риск {riskPct}%
          </div>
        )}
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${subject.average * 20}%`, backgroundColor: barColor }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>

      {subject.recommendations && subject.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
          {subject.recommendations.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 hover:underline">
              <span>▶</span>
              <span className="truncate">{r.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AITutorPage() {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
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

  const subjects = analytics.subjects as Array<SubjectSummary & { trend_slope?: number; grades_count?: number; risk_score?: number; recommendations?: { title: string; url: string }[] }>;
  const sorted = [...subjects].sort((a, b) => b.average - a.average);

  const chartData = sorted.map((s) => ({
    name: s.subject_name.slice(0, 7),
    avg: s.average,
  }));

  const overallAvg = subjects.length
    ? subjects.reduce((s, x) => s + x.average, 0) / subjects.length
    : 0;

  const weakSubjects = subjects.filter((s) => s.average < 3.5);
  const improving    = subjects.filter((s) => (s.trend_slope ?? 0) > 0.02);

  const allRecs = subjects
    .filter((s) => s.recommendations && s.recommendations.length > 0)
    .flatMap((s) => (s.recommendations ?? []).map((r) => ({ ...r, subject: s.subject_name })));

  const overallRisk = subjects.length
    ? subjects.reduce((acc, s) => acc + (s.risk_score ?? 0), 0) / subjects.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">{t('performance_by_subject')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('avg_grades_dynamics')}</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{overallAvg.toFixed(2)}</div>
          <div className="text-sm text-slate-500 mt-1">{t('avg_grade')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-500">{weakSubjects.length}</div>
          <div className="text-sm text-slate-500 mt-1">{t('needs_work')}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{improving.length}</div>
          <div className="text-sm text-slate-500 mt-1">{t('growing')}</div>
        </div>
      </div>

      <RiskMeter risk={overallRisk} />

      {/* Alert for weak subjects */}
      {weakSubjects.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="font-semibold text-orange-800 mb-1">{t('focus_on')}</div>
          <div className="text-sm text-orange-700">
            Средний балл ниже 3.5 по: <strong>{weakSubjects.map((s) => s.subject_name).join(', ')}</strong>
          </div>
        </div>
      )}

      {/* Global recommendations */}
      {allRecs.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3">📚 Рекомендованные материалы</h3>
          <div className="space-y-2">
            {allRecs.slice(0, 6).map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-colors group">
                <span className="text-lg flex-shrink-0">▶</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-primary-700 truncate">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.subject}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">{t('compare_subjects')}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [Number(v).toFixed(2), t('avg_grade')]} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.avg >= 4.5 ? '#22c55e' :
                    entry.avg >= 3.8 ? '#8b1fc8' :
                    entry.avg >= 3.0 ? '#f97316' : '#ef4444'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Subject cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((s) => (
          <SubjectCard key={s.subject_id} subject={s} />
        ))}
      </div>
    </div>
  );
}
