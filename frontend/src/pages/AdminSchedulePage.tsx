import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../api';
import { useState } from 'react';
import { IconZap, IconAlertTriangle } from '../components/ui/Icons';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function AdminSchedulePage() {
  const qc = useQueryClient();
  const [classId, setClassId] = useState(1);

  const { data: slots = [] } = useQuery({
    queryKey: ['schedule', classId],
    queryFn: () => scheduleApi.classSchedule(classId).then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => scheduleApi.generate([1, 2, 3]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });

  const { data: subs = [] } = useQuery({
    queryKey: ['substitutions'],
    queryFn: () => scheduleApi.latestSubstitutions().then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Управление расписанием</h1>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="btn-primary"
        >
          {generateMutation.isPending
            ? 'Генерация CSP...'
            : <span className="flex items-center gap-2"><IconZap className="w-4 h-4" />Сгенерировать расписание</span>
          }
        </button>
      </div>

      {generateMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Расписание успешно сгенерировано!
        </div>
      )}

      <div className="flex gap-2 items-center">
        <span className="text-sm text-slate-500">Класс:</span>
        {[1, 2, 3].map((id) => (
          <button key={id} onClick={() => setClassId(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${classId === id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {id === 1 ? '10А' : id === 2 ? '10Б' : '11А'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-3 text-left text-slate-500 font-medium">Урок</th>
              {DAYS.map((d) => <th key={d} className="p-3 text-center text-slate-500 font-medium">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((period) => (
              <tr key={period} className="border-b border-slate-50">
                <td className="p-3 text-center font-medium text-slate-500">{period}</td>
                {[0, 1, 2, 3, 4, 5].map((day) => {
                  const slot = (slots as any[]).find((s) => s.day_of_week === day && s.period_num === period);
                  return (
                    <td key={day} className="p-2">
                      {slot ? (
                        <div className={`rounded p-1.5 text-xs ${slot.is_substitution ? 'bg-orange-50 border border-orange-200' : 'bg-primary-50 border border-primary-100'}`}>
                          <div className="font-medium text-slate-700 truncate">{slot.subject_name}</div>
                          <div className="text-slate-400 truncate">{slot.room_name}</div>
                        </div>
                      ) : <div className="h-8" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(subs as any[]).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3">Актуальные замены</h3>
          <div className="space-y-2">
            {(subs as any[]).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-100 rounded-lg text-sm">
                <IconAlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="font-medium">{s.subject_name}</span>
                <span className="text-slate-500">→ {s.teacher_name} | {DAYS[s.day_of_week]} ур.{s.period_num}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
