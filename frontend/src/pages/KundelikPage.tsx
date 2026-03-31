import { useQuery } from '@tanstack/react-query';
import { kundelikApi } from '../api/modules';
import { IconRefresh, IconBookOpen, IconClock } from '../components/ui/Icons';
import { useLangStore, translations } from '../stores/langStore';


function DayProgressBar({ done, total, pct }: { done: number; total: number; pct: number }) {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{t('day_progress')}</span>
        <span className="text-sm font-bold text-primary-600">{done}/{total} {t('lessons')}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3">
        <div
          className="h-3 rounded-full bg-primary-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 mt-1 text-right">{pct}%</div>
    </div>
  );
}

function CurrentLessonCard({ lesson }: { lesson: any }) {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  if (!lesson) return (
    <div className="card border-l-4 border-slate-200">
      <div className="text-slate-400 text-sm">{t('no_lessons_today')}</div>
    </div>
  );
  return (
    <div className={`card border-l-4 ${lesson.status === 'in_progress' ? 'border-green-500 bg-green-50' : 'border-primary-400'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
            {lesson.status === 'in_progress'
              ? <><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t('current_lesson')}</>
              : <><IconClock className="w-3.5 h-3.5" /> {t('next_lesson')}</>
            }
          </div>
          <div className="text-lg font-bold text-slate-800">{lesson.subject_name}</div>
          <div className="text-sm text-slate-500 mt-1">
            {lesson.teacher_name} · {lesson.room} · {lesson.start_time}–{lesson.end_time}
          </div>
        </div>
        {lesson.status === 'in_progress' && (
          <div className="text-right">
            <div className="text-2xl font-black text-green-600">{lesson.progress_pct}%</div>
            <div className="text-xs text-slate-400">{t('passed')}</div>
          </div>
        )}
      </div>
      {lesson.status === 'in_progress' && (
        <div className="mt-3 w-full bg-white rounded-full h-2">
          <div
            className="h-2 rounded-full bg-green-500 transition-all"
            style={{ width: `${lesson.progress_pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function KundelikPage() {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  const { data: progress } = useQuery({
    queryKey: ['day-progress'],
    queryFn: () => kundelikApi.dayProgress().then(r => r.data),
    refetchInterval: 60_000,
  });
  const { data: currentLesson } = useQuery({
    queryKey: ['current-lesson'],
    queryFn: () => kundelikApi.currentLesson().then(r => r.data),
    refetchInterval: 30_000,
  });
  const { data: homework = [] } = useQuery({
    queryKey: ['homework'],
    queryFn: () => kundelikApi.homework().then(r => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Kundelik</h1>
          <p className="text-slate-500 text-sm">{t('today_schedule')} &amp; {t('homework').toLowerCase()}</p>
        </div>
        <button
          onClick={() => kundelikApi.sync()}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <IconRefresh className="w-4 h-4" />
          {t('sync')}
        </button>
      </div>

      {progress && (
        <DayProgressBar done={progress.done} total={progress.total} pct={progress.pct} />
      )}

      <CurrentLessonCard lesson={currentLesson} />

      {progress?.lessons?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">{t('today_schedule')}</h3>
          <div className="space-y-2">
            {progress.lessons.map((lesson: any) => (
              <div key={lesson.period_num}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  lesson.is_cancelled ? 'opacity-40 line-through bg-slate-50' : 'bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                  {lesson.period_num}
                </div>
                <div className="text-xs text-slate-400 w-20">{lesson.start_time}</div>
                <div className="flex-1 font-medium text-slate-800">{lesson.subject_name}</div>
                <div className="text-xs text-slate-500">{lesson.room}</div>
                {lesson.is_cancelled && <span className="badge-red">{t('cancelled')}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <IconBookOpen className="w-4 h-4" />
          {t('homework')}
        </h3>
        <div className="space-y-3">
          {(homework as any[]).map((hw: any) => (
            <div key={hw.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
              hw.is_done ? 'border-green-100 bg-green-50 opacity-60' : 'border-slate-100 bg-white'
            }`}>
              <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center ${
                hw.is_done ? 'border-green-500 bg-green-500' : 'border-slate-300'
              }`}>
                {hw.is_done && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm">{hw.subject_name}</div>
                <div className="text-sm text-slate-600 mt-0.5">{hw.description}</div>
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                до {new Date(hw.due_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
