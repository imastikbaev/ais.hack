import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '../api';
import type { Grade } from '../types';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useLangStore, translations } from '../stores/langStore';

const gradeColor = (v: number) => {
  if (v >= 4.5) return '#22c55e';
  if (v >= 3.5) return '#8b1fc8';
  if (v >= 2.5) return '#f97316';
  return '#ef4444';
};

export default function GradesPage() {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  const [quarter, setQuarter] = useState<number | undefined>();
  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ['grades', quarter],
    queryFn: () => gradesApi.myGrades(quarter).then((r) => r.data),
  });

  const bySubject = grades.reduce((acc, g) => {
    const key = g.subject_name || String(g.subject_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {} as Record<string, Grade[]>);

  const subjectAvgs = Object.entries(bySubject).map(([name, gs]) => ({
    name: name.slice(0, 10),
    avg: +(gs.reduce((s, g) => s + g.value, 0) / gs.length).toFixed(2),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t('my_grades')}</h1>
        <div className="flex gap-2">
          {[undefined, 1, 2, 3, 4].map((q) => (
            <button
              key={q ?? 'all'}
              onClick={() => setQuarter(q)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                quarter === q ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {q ? `${t(`q${q}`)}` : t('all')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4">{t('avg_by_subject')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectAvgs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [Number(v).toFixed(2), t('avg_by_subject')]} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {subjectAvgs.map((entry, i) => (
                    <Cell key={i} fill={gradeColor(entry.avg)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4">{t('last_grades')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">{t('subject')}</th>
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">{t('type')}</th>
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">{t('topic')}</th>
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">{t('date')}</th>
                    <th className="text-right py-2 text-slate-500 font-medium">{t('grade')}</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.slice(0, 30).map((g) => (
                    <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium text-slate-800">{g.subject_name}</td>
                      <td className="py-2 pr-4">
                        <span className={
                          g.grade_type === 'СОЧ' ? 'badge-red' :
                          g.grade_type === 'СОР' ? 'badge-orange' : 'badge-blue'
                        }>{g.grade_type}</span>
                      </td>
                      <td className="py-2 pr-4 text-slate-500 text-xs">{g.topic_name || '—'}</td>
                      <td className="py-2 pr-4 text-slate-500">{g.date}</td>
                      <td className="py-2 text-right">
                        <span className="text-lg font-bold" style={{ color: gradeColor(g.value) }}>
                          {g.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


