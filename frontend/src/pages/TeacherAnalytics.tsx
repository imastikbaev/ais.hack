import { useQuery } from '@tanstack/react-query';
import { gradesApi } from '../api';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CLASSES = [
  { id: 1, name: '10А' },
  { id: 2, name: '10Б' },
  { id: 3, name: '11А' },
];

function avgColor(avg: number) {
  if (avg >= 4.5) return '#16a34a';
  if (avg >= 3.8) return '#58058C';
  if (avg >= 3.0) return '#ea580c';
  return '#dc2626';
}

function avgBg(avg: number) {
  if (avg >= 4.5) return 'bg-green-50 text-green-800';
  if (avg >= 3.8) return 'bg-blue-50 text-blue-800';
  if (avg >= 3.0) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
}

export default function TeacherAnalytics() {
  const [classId, setClassId] = useState(1);

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class-analytics', classId],
    queryFn: () => gradesApi.classAnalytics(classId).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!classData) return null;

  const students: any[] = classData.students || [];
  const subjectNames: string[] = students[0]?.subjects?.map((s: any) => s.subject_name) || [];

  // Class-level subject averages
  const subjectAvgs: Record<string, number[]> = {};
  students.forEach((st: any) => {
    st.subjects?.forEach((s: any) => {
      if (!subjectAvgs[s.subject_name]) subjectAvgs[s.subject_name] = [];
      subjectAvgs[s.subject_name].push(s.average);
    });
  });

  const subjectChartData = Object.entries(subjectAvgs).map(([name, vals]) => ({
    name: name.slice(0, 8),
    fullName: name,
    avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
  })).sort((a, b) => b.avg - a.avg);

  // Student overall averages
  const studentsWithAvg = students.map((st: any) => ({
    ...st,
    overallAvg: st.overall_avg ?? (
      st.subjects?.length
        ? st.subjects.reduce((s: number, x: any) => s + x.average, 0) / st.subjects.length
        : 0
    ),
  })).sort((a, b) => b.overallAvg - a.overallAvg);

  const classAvg = studentsWithAvg.length
    ? studentsWithAvg.reduce((s, st) => s + st.overallAvg, 0) / studentsWithAvg.length
    : 0;

  const needsHelp = studentsWithAvg.filter((s) => s.overallAvg < 3.0);
  const excellent = studentsWithAvg.filter((s) => s.overallAvg >= 4.5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Аналитика класса</h1>
          <p className="text-slate-500 text-sm">Успеваемость учеников по предметам</p>
        </div>
        <div className="flex gap-2">
          {CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setClassId(c.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                classId === c.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{students.length}</div>
          <div className="text-sm text-slate-500">Учеников</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold" style={{ color: avgColor(classAvg) }}>
            {classAvg.toFixed(2)}
          </div>
          <div className="text-sm text-slate-500">Средний балл</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{excellent.length}</div>
          <div className="text-sm text-slate-500">Отличники</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-500">{needsHelp.length}</div>
          <div className="text-sm text-slate-500">Нужна помощь</div>
        </div>
      </div>

      {/* Subject bar chart */}
      {subjectChartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Средний балл по предметам</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, _: string, props: any) => [v.toFixed(2), props.payload.fullName]} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {subjectChartData.map((entry) => (
                  <Cell key={entry.name} fill={avgColor(entry.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade table */}
      <div className="card overflow-x-auto p-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Таблица успеваемости</h3>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">≥4.5 отлично</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">≥3.8 хорошо</span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">≥3.0 норм</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">&lt;3.0 слабо</span>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="p-3 text-left text-slate-500 font-medium w-28">Ученик</th>
              {subjectNames.map((s: string) => (
                <th key={s} className="p-2 text-center text-slate-500 font-medium" style={{ minWidth: 64 }}>
                  {s.slice(0, 5)}
                </th>
              ))}
              <th className="p-2 text-center text-slate-600 font-semibold">Ср.балл</th>
            </tr>
          </thead>
          <tbody>
            {studentsWithAvg.map((student: any, idx: number) => (
              <tr key={student.student_id} className={`border-b border-slate-50 ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                <td className="p-3 font-medium text-slate-700 truncate max-w-[112px]">
                  {student.student_name}
                </td>
                {subjectNames.map((subjectName: string) => {
                  const subj = student.subjects?.find((s: any) => s.subject_name === subjectName);
                  const avg = subj?.average ?? null;
                  return (
                    <td key={subjectName} className="p-1 text-center">
                      {avg !== null ? (
                        <span
                          className={`inline-block w-10 py-0.5 rounded text-xs font-semibold ${avgBg(avg)}`}
                        >
                          {avg.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="p-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${avgBg(student.overallAvg)}`}>
                    {student.overallAvg.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}

            {/* Class average row */}
            {studentsWithAvg.length > 0 && (
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="p-3 text-slate-500 text-xs">Ср. по классу</td>
                {subjectNames.map((subjectName: string) => {
                  const vals = subjectChartData.find((s) => s.fullName === subjectName);
                  return (
                    <td key={subjectName} className="p-1 text-center">
                      {vals ? (
                        <span className={`inline-block w-10 py-0.5 rounded text-xs font-semibold ${avgBg(vals.avg)}`}>
                          {vals.avg.toFixed(1)}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  );
                })}
                <td className="p-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${avgBg(classAvg)}`}>
                    {classAvg.toFixed(2)}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Students needing attention */}
      {needsHelp.length > 0 && (
        <div className="card border-l-4 border-red-400">
          <h3 className="font-semibold text-slate-700 mb-3">Требуют особого внимания (ср. балл ниже 3.0)</h3>
          <div className="space-y-2">
            {needsHelp.map((st: any) => {
              const weakSubjects = st.subjects?.filter((s: any) => s.average < 3.0).map((s: any) => s.subject_name) || [];
              return (
                <div key={st.student_id} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-slate-700 w-24 flex-shrink-0">{st.student_name}</span>
                  <span className="text-slate-500">
                    Слабые: {weakSubjects.length > 0 ? weakSubjects.join(', ') : 'нет данных'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
