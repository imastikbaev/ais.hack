import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { parentApi } from '../api';
import { useState } from 'react';

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const DAYS_FULL  = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
const PERIOD_TIMES = ['08:00', '08:55', '09:50', '10:45', '11:40', '12:35'];

function gradeColor(v: number) {
  if (v >= 4.5) return 'text-green-700 bg-green-100';
  if (v >= 3.5) return 'text-blue-700 bg-blue-100';
  if (v >= 2.5) return 'text-orange-700 bg-orange-100';
  return 'text-red-700 bg-red-100';
}

type Tab = 'grades' | 'schedule';

export default function ParentChildPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = Number(id);
  const [tab, setTab] = useState<Tab>('grades');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');

  const { data: gradesRaw = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['parent-child-grades', studentId],
    queryFn: () => parentApi.childGrades(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: scheduleRaw = [], isLoading: schedLoading } = useQuery({
    queryKey: ['parent-child-schedule', studentId],
    queryFn: () => parentApi.childSchedule(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const grades = gradesRaw as any[];
  const schedule = scheduleRaw as any[];

  // Subject list for filter
  const subjects = [...new Set(grades.map((g) => g.subject_name))].sort();

  // Filtered grades
  const filtered = grades.filter((g) => {
    if (filterSubject && g.subject_name !== filterSubject) return false;
    if (filterQuarter && String(g.quarter) !== filterQuarter) return false;
    return true;
  });

  // Group filtered grades by subject
  const bySubject: Record<string, any[]> = {};
  filtered.forEach((g) => {
    if (!bySubject[g.subject_name]) bySubject[g.subject_name] = [];
    bySubject[g.subject_name].push(g);
  });

  // Build weekly grid
  const grid: Record<number, Record<number, any>> = {};
  for (let d = 0; d < 5; d++) {
    grid[d] = {};
    for (let p = 1; p <= 6; p++) grid[d][p] = null;
  }
  schedule.forEach((s: any) => {
    if (s.day_of_week < 5) grid[s.day_of_week][s.period_num] = s;
  });

  return (
    <div className="p-6 space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/parent')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Назад
        </button>
        <div className="w-px h-4 bg-slate-200" />
        <h1 className="page-title">Успеваемость ребёнка</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(['grades', 'schedule'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'grades' ? 'Оценки' : 'Расписание'}
          </button>
        ))}
      </div>

      {/* GRADES TAB */}
      {tab === 'grades' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="input text-sm py-1.5 w-48"
            >
              <option value="">Все предметы</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterQuarter}
              onChange={(e) => setFilterQuarter(e.target.value)}
              className="input text-sm py-1.5 w-40"
            >
              <option value="">Все четверти</option>
              <option value="1">I четверть</option>
              <option value="2">II четверть</option>
              <option value="3">III четверть</option>
              <option value="4">IV четверть</option>
            </select>
          </div>

          {gradesLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!gradesLoading && Object.keys(bySubject).length === 0 && (
            <div className="card text-center py-10 text-slate-400 text-sm">Оценки не найдены</div>
          )}

          {Object.entries(bySubject).map(([subj, gs]) => {
            const avg = gs.reduce((s, g) => s + g.value, 0) / gs.length;
            return (
              <div key={subj} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">{subj}</h3>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${gradeColor(avg)}`}>
                    Ср: {avg.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gs.map((g) => (
                    <div
                      key={g.id}
                      className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border ${gradeColor(g.value)} border-current border-opacity-30`}
                    >
                      <span className="text-base font-bold leading-none">{g.value}</span>
                      <span className="opacity-70 mt-0.5">{g.grade_type}</span>
                      <span className="opacity-50 text-[10px]">
                        {new Date(g.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE TAB */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          {schedLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          )}

          {/* Mobile: by-day cards */}
          <div className="block md:hidden space-y-4">
            {DAYS_FULL.map((day, dayIdx) => {
              const daySlots = schedule
                .filter((s: any) => s.day_of_week === dayIdx)
                .sort((a: any, b: any) => a.period_num - b.period_num);
              if (daySlots.length === 0) return null;
              return (
                <div key={dayIdx} className="card">
                  <h3 className="font-semibold text-slate-700 mb-3">{day}</h3>
                  <div className="space-y-2">
                    {daySlots.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <div className="w-10 text-center">
                          <div className="font-semibold text-slate-600">{s.period_num}</div>
                          <div className="text-xs text-slate-400">{PERIOD_TIMES[s.period_num - 1]}</div>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                          <div className="font-medium text-slate-800">{s.subject_name}</div>
                          <div className="text-xs text-slate-500">{s.teacher_name} · {s.room_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: week grid */}
          <div className="hidden md:block card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-3 text-left text-slate-500 font-medium w-20">Урок</th>
                  {DAYS_FULL.map((d, i) => (
                    <th key={d} className="p-3 text-center text-slate-500 font-medium">
                      <div className="font-semibold">{DAYS_SHORT[i]}</div>
                      <div className="font-normal text-xs text-slate-400">{d}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map((period) => (
                  <tr key={period} className="border-b border-slate-50">
                    <td className="p-3 text-center">
                      <div className="font-semibold text-slate-600">{period}</div>
                      <div className="text-xs text-slate-400">{PERIOD_TIMES[period - 1]}</div>
                    </td>
                    {[0, 1, 2, 3, 4].map((dayIdx) => {
                      const slot = grid[dayIdx][period];
                      return (
                        <td key={dayIdx} className="p-2 align-top min-w-[130px]">
                          {slot ? (
                            <div className="rounded-lg p-2 text-xs bg-primary-50 border border-primary-100">
                              <div className="font-semibold text-slate-800 truncate">{slot.subject_name}</div>
                              <div className="text-slate-500 truncate mt-0.5">{slot.teacher_name}</div>
                              <div className="text-slate-400">{slot.room_name}</div>
                              {slot.is_substitution && (
                                <span className="inline-block mt-1 px-1 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px]">Замена</span>
                              )}
                            </div>
                          ) : (
                            <div className="h-16 rounded-lg bg-slate-50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
