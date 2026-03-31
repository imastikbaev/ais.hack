import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '../api';
import { useState } from 'react';
import type { ScheduleSlot } from '../types';
import { IconAlertTriangle, IconCheckCircle, IconCalendar } from '../components/ui/Icons';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const PERIOD_TIMES = ['08:00', '08:55', '09:50', '10:45', '11:40', '12:35'];

const CLASS_BADGE: Record<string, string> = {
  '10А': 'bg-blue-100 text-blue-800 border-blue-200',
  '10Б': 'bg-green-100 text-green-800 border-green-200',
  '11А': 'bg-purple-100 text-purple-800 border-purple-200',
  '11Б': 'bg-orange-100 text-orange-800 border-orange-200',
};
const DEFAULT_BADGE = 'bg-slate-100 text-slate-700 border-slate-200';

type ViewMode = 'class' | 'week';

export default function TeacherSchedulePage() {
  const qc = useQueryClient();
  const [view, setView] = useState<ViewMode>('class');
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  const { data: slots = [], isLoading } = useQuery<ScheduleSlot[]>({
    queryKey: ['my-schedule'],
    queryFn: () => scheduleApi.mySchedule().then((r) => r.data),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => scheduleApi.rooms().then((r) => r.data),
  });

  const { data: allTeachers = [] } = useQuery({
    queryKey: ['all-schedule-teachers'],
    queryFn: async () => {
      const results = await Promise.all([1, 2, 3].map((id) =>
        scheduleApi.classSchedule(id).then((r) => r.data as ScheduleSlot[])
      ));
      const teacherMap = new Map<number, string>();
      results.flat().forEach((s: any) => {
        if (s.teacher_id && s.teacher_name) teacherMap.set(s.teacher_id, s.teacher_name);
      });
      return Array.from(teacherMap.entries()).map(([id, name]) => ({ id, name }));
    },
  });

  const subMutation = useMutation({
    mutationFn: (data: { slot_id: number; new_teacher_id: number; new_room_id?: number }) =>
      scheduleApi.createSubstitution(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-schedule'] });
      setShowSubForm(false);
      setSelectedSlot(null);
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 4000);
    },
  });

  // Group slots by class name
  const byClass: Record<string, ScheduleSlot[]> = {};
  (slots as any[]).forEach((s) => {
    const cls = s.class_name ?? `Класс ${s.class_id}`;
    if (!byClass[cls]) byClass[cls] = [];
    byClass[cls].push(s);
  });
  const classNames = Object.keys(byClass).sort();

  // Build weekly grid: grid[day][period] = slot
  const grid: Record<number, Record<number, ScheduleSlot | undefined>> = {};
  for (let d = 0; d < 5; d++) {
    grid[d] = {};
    for (let p = 1; p <= 6; p++) grid[d][p] = undefined;
  }
  (slots as ScheduleSlot[]).forEach((s) => {
    if (s.day_of_week < 5) grid[s.day_of_week][s.period_num] = s;
  });

  const totalLessons = slots.length;

  function openSlot(slot: ScheduleSlot) {
    setSelectedSlot(slot);
    setShowSubForm(false);
    setNewTeacherId('');
    setNewRoomId('');
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Моё расписание</h1>
          <p className="page-subtitle">Уроки по классам и управление заменами</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('class')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'class' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            По классам
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Неделя
          </button>
        </div>
      </div>

      {subSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          <IconCheckCircle className="w-4 h-4 flex-shrink-0" />
          Замена оформлена и ученики уведомлены
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-primary-600">{totalLessons}</div>
          <div className="text-xs text-slate-500 mt-1">Уроков в неделю</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-slate-700">{classNames.length}</div>
          <div className="text-xs text-slate-500 mt-1">Классов</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-3xl font-bold text-slate-700">
            {[...new Set((slots as any[]).map((s) => s.subject_name).filter(Boolean))].length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Предметов</div>
        </div>
      </div>

      {/* BY CLASS VIEW */}
      {view === 'class' && (
        <div className="space-y-4">
          {classNames.length === 0 && (
            <div className="card text-center py-10 text-slate-400 text-sm">Уроки не найдены</div>
          )}
          {classNames.map((cls) => {
            const clsSlots = [...byClass[cls]].sort((a, b) =>
              a.day_of_week !== b.day_of_week ? a.day_of_week - b.day_of_week : a.period_num - b.period_num
            );
            // Group by day
            const byDay: Record<number, ScheduleSlot[]> = {};
            clsSlots.forEach((s) => {
              if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
              byDay[s.day_of_week].push(s);
            });

            return (
              <div key={cls} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${CLASS_BADGE[cls] ?? DEFAULT_BADGE}`}>
                    {cls}
                  </span>
                  <span className="text-sm text-slate-500">{clsSlots.length} урок(а/ов) в неделю</span>
                  {clsSlots[0] && <span className="text-sm text-slate-500">· {(clsSlots[0] as any).subject_name}</span>}
                </div>

                <div className="space-y-2">
                  {Object.entries(byDay)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([dayIdx, daySlots]) => (
                      <div key={dayIdx} className="flex items-start gap-3">
                        <div className="w-10 text-xs font-semibold text-slate-400 pt-2 flex-shrink-0">
                          {DAYS_SHORT[Number(dayIdx)]}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => openSlot(s)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-shadow hover:shadow-md text-left ${
                                s.is_substitution
                                  ? 'bg-orange-50 border-orange-200'
                                  : 'bg-slate-50 border-slate-200 hover:border-primary-300'
                              }`}
                            >
                              <div>
                                <div className="font-medium text-slate-700">
                                  {PERIOD_TIMES[s.period_num - 1]} · {s.period_num}-й урок
                                </div>
                                <div className="text-xs text-slate-400">{s.room_name}</div>
                              </div>
                              {s.is_substitution && (
                                <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Замена</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEKLY GRID VIEW */}
      {view === 'week' && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-3 text-left text-slate-500 font-medium w-20">Урок</th>
                {DAYS.map((d, i) => (
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
                    <div className="font-semibold text-slate-600 text-sm">{period}</div>
                    <div className="text-xs text-slate-400">{PERIOD_TIMES[period - 1]}</div>
                  </td>
                  {[0, 1, 2, 3, 4].map((dayIdx) => {
                    const slot = grid[dayIdx][period];
                    return (
                      <td key={dayIdx} className="p-2 align-top min-w-[130px]">
                        {slot ? (
                          <button
                            onClick={() => openSlot(slot)}
                            className={`w-full text-left rounded-lg p-2 text-xs border transition-shadow hover:shadow-md ${
                              slot.is_substitution
                                ? 'bg-orange-50 border-orange-200'
                                : CLASS_BADGE[(slot as any).class_name]
                                  ? `bg-white border-slate-200`
                                  : 'bg-primary-50 border-primary-100'
                            }`}
                          >
                            <div className="font-semibold text-slate-800 truncate">{slot.subject_name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${CLASS_BADGE[(slot as any).class_name] ?? DEFAULT_BADGE}`}>
                                {(slot as any).class_name ?? `Класс ${slot.class_id}`}
                              </span>
                            </div>
                            <div className="text-slate-400 mt-0.5">{slot.room_name}</div>
                            {slot.is_substitution && (
                              <span className="inline-block mt-1 px-1 py-0.5 bg-orange-100 text-orange-700 rounded">Замена</span>
                            )}
                          </button>
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
      )}

      {/* Slot detail / substitution panel */}
      {selectedSlot && (
        <div className="card border-l-4 border-primary-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                <IconCalendar className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{selectedSlot.subject_name}</h3>
                <p className="text-sm text-slate-500">
                  {DAYS[selectedSlot.day_of_week]} · {PERIOD_TIMES[selectedSlot.period_num - 1]} · {selectedSlot.period_num}-й урок · {selectedSlot.room_name}
                </p>
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded border ${CLASS_BADGE[(selectedSlot as any).class_name] ?? DEFAULT_BADGE}`}>
                  {(selectedSlot as any).class_name ?? `Класс ${selectedSlot.class_id}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
            >
              ✕
            </button>
          </div>

          {!showSubForm ? (
            <button
              onClick={() => setShowSubForm(true)}
              className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              <IconAlertTriangle className="w-4 h-4" />
              Оформить замену для этого урока
            </button>
          ) : (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700">Оформление замены</p>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Замещающий учитель</label>
                <select
                  value={newTeacherId}
                  onChange={(e) => setNewTeacherId(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">— выберите учителя —</option>
                  {(allTeachers as any[]).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Другой кабинет (необязательно)</label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">— тот же кабинет —</option>
                  {(rooms as any[]).map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!newTeacherId || subMutation.isPending}
                  onClick={() => subMutation.mutate({
                    slot_id: selectedSlot.id,
                    new_teacher_id: Number(newTeacherId),
                    new_room_id: newRoomId ? Number(newRoomId) : undefined,
                  })}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {subMutation.isPending ? 'Сохраняем...' : 'Подтвердить замену'}
                </button>
                <button
                  onClick={() => setShowSubForm(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
