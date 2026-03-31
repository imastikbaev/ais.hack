import { useQuery } from '@tanstack/react-query';
import { scheduleApi } from '../api';
import type { ScheduleSlot } from '../types';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const PERIOD_TIMES = ['08:00', '08:55', '09:50', '10:45', '11:40', '12:35', '13:30'];

export default function SchedulePage() {
  const { data: slots = [], isLoading } = useQuery<ScheduleSlot[]>({
    queryKey: ['my-schedule'],
    queryFn: () => scheduleApi.mySchedule().then((r) => r.data),
  });

  const grid: Record<string, ScheduleSlot[]> = {};
  slots.forEach((s) => {
    const key = `${s.day_of_week}-${s.period_num}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(s);
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="page-title">Расписание</h1>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-3 text-left text-slate-500 font-medium w-20">Урок</th>
              {DAYS.map((d) => (
                <th key={d} className="p-3 text-center text-slate-500 font-medium">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period} className="border-b border-slate-50">
                <td className="p-3 text-slate-400 text-center">
                  <div className="font-medium text-slate-600">{period}</div>
                  <div className="text-xs">{PERIOD_TIMES[period - 1]}</div>
                </td>
                {DAYS.map((_, dayIdx) => {
                  const key = `${dayIdx}-${period}`;
                  const cells = grid[key] || [];
                  return (
                    <td key={dayIdx} className="p-2 align-top">
                      {cells.map((slot) => (
                        <div
                          key={slot.id}
                          className={`rounded-lg p-2 mb-1 text-xs ${
                            slot.is_substitution
                              ? 'bg-orange-50 border border-orange-200'
                              : 'bg-primary-50 border border-primary-100'
                          }`}
                        >
                          <div className="font-semibold text-slate-800 truncate">{slot.subject_name}</div>
                          <div className="text-slate-500 truncate">{slot.teacher_name}</div>
                          <div className="text-slate-400">{slot.room_name}</div>
                          {slot.is_substitution && (
                            <span className="badge-orange mt-1">Замена</span>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
