import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { kioskApi } from '../api';
import { useAuthStore } from '../stores/authStore';
import { IconTrophy, IconMegaphone, IconAlertTriangle, IconCalendar, IconStar } from '../components/ui/Icons';

const ROTATION_INTERVAL = 8000;

// Period schedule: [start_h, start_m, end_h, end_m]
const PERIODS: [number, number, number, number][] = [
  [8,  0,  8, 45],
  [8, 55,  9, 40],
  [9, 50, 10, 35],
  [10, 45, 11, 30],
  [11, 40, 12, 25],
  [12, 35, 13, 20],
];

function currentLesson(now: Date): number | null {
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  for (let i = 0; i < PERIODS.length; i++) {
    const [sh, sm, eh, em] = PERIODS[i];
    if (total >= sh * 60 + sm && total <= eh * 60 + em) return i + 1;
  }
  return null;
}

function lessonEndTime(period: number): string {
  const [, , eh, em] = PERIODS[period - 1];
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

type KioskFeed = {
  top_students: { name: string; points: number }[];
  news: { title: string; body: string; is_announcement: boolean }[];
  substitutions: { subject: string; teacher: string; day: number; period: number }[];
};

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function RankLabel({ index }: { index: number }) {
  const labels = [
    { bg: 'bg-yellow-400', text: '1' },
    { bg: 'bg-slate-300', text: '2' },
    { bg: 'bg-amber-600', text: '3' },
  ];
  const l = labels[index];
  if (l) {
    return (
      <div className={`w-14 h-14 rounded-full ${l.bg} flex items-center justify-center text-white text-2xl font-black`}>
        {l.text}
      </div>
    );
  }
  return <div className="w-14 text-center text-3xl font-black text-white opacity-60">{index + 1}</div>;
}

function TopStudentsWidget({ students }: { students: { name: string; points: number }[] }) {
  return (
    <div className="flex flex-col justify-center h-full px-20 py-16">
      <div className="flex items-center gap-4 justify-center mb-12">
        <IconTrophy className="w-12 h-12 text-yellow-300" />
        <h2 className="text-5xl font-bold text-white">Топ учеников дня</h2>
      </div>
      <div className="space-y-6">
        {students.map((s, i) => (
          <div key={i} className="flex items-center gap-6 bg-white bg-opacity-10 rounded-2xl px-8 py-5">
            <RankLabel index={i} />
            <div className="flex-1">
              <div className="text-3xl font-bold text-white">{s.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <IconStar className="w-7 h-7 text-yellow-300" />
              <span className="text-3xl font-black text-yellow-300">{s.points}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsWidget({ items }: { items: { title: string; body: string; is_announcement: boolean }[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[idx];
  if (!item) return null;

  return (
    <div className="flex flex-col justify-center h-full px-20 py-16 text-center">
      {item.is_announcement && (
        <div className="flex items-center justify-center gap-3 text-2xl font-bold text-yellow-300 mb-4 uppercase tracking-widest">
          <IconMegaphone className="w-8 h-8" />
          Объявление
        </div>
      )}
      <h2 className="text-5xl font-bold text-white mb-8 leading-tight">{item.title}</h2>
      <p className="text-2xl text-blue-100 leading-relaxed">{item.body}</p>
      <div className="flex justify-center gap-2 mt-8">
        {items.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === idx ? 'bg-white' : 'bg-white bg-opacity-30'}`} />
        ))}
      </div>
    </div>
  );
}

function SubstitutionsWidget({ subs }: { subs: { subject: string; teacher: string; day: number; period: number }[] }) {
  return (
    <div className="flex flex-col justify-center h-full px-20 py-16">
      <div className="flex items-center gap-4 justify-center mb-10">
        <IconCalendar className="w-10 h-10 text-white" />
        <h2 className="text-5xl font-bold text-white">Замены в расписании</h2>
      </div>
      {subs.length === 0 ? (
        <div className="text-center text-3xl text-blue-200">Замен нет</div>
      ) : (
        <div className="space-y-5">
          {subs.map((s, i) => (
            <div key={i} className="flex items-center gap-6 bg-orange-500 bg-opacity-20 border border-orange-400 border-opacity-40 rounded-2xl px-8 py-5">
              <IconAlertTriangle className="w-8 h-8 text-orange-300 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-2xl font-bold text-white">{s.subject}</div>
                <div className="text-xl text-orange-200">{DAYS[s.day]} · Урок {s.period}</div>
              </div>
              <div className="text-xl text-white font-semibold">{s.teacher}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KioskMode() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [widgetIdx, setWidgetIdx] = useState(0);
  const { data: feed } = useQuery<KioskFeed>({
    queryKey: ['kiosk-feed'],
    queryFn: () => kioskApi.feed().then((r) => r.data),
    refetchInterval: 30000,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const [wsMsg, setWsMsg] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('http', 'ws')}/api/kiosk/ws`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'substitution') setWsMsg(data.message);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (!feed) return;
    const widgets = [0, feed.news.length > 0 ? 1 : -1, feed.substitutions.length > 0 ? 2 : -1].filter((x) => x >= 0);
    const t = setInterval(() => {
      setWidgetIdx((i) => {
        const next = widgets[(widgets.indexOf(i) + 1) % widgets.length];
        return next ?? 0;
      });
    }, ROTATION_INTERVAL);
    return () => clearInterval(t);
  }, [feed]);

  const formatTime = (d: Date) => d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => d.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });

  const lesson = currentLesson(time);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1a002a 0%, #2d0047 50%, #430069 100%)', fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between px-12 py-6 border-b border-white border-opacity-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-black text-primary-700">A</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Aqbobek Lyceum</div>
            <div className="text-primary-300 capitalize">{formatDate(time)}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-5xl font-black text-white tabular-nums">{formatTime(time)}</div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* ИДЕТ УРОК banner */}
      {lesson && (
        <div className="flex items-center justify-center gap-4 border-b px-12 py-3" style={{ backgroundColor: 'rgba(88,5,140,0.4)', borderColor: 'rgba(180,100,255,0.25)' }}>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-400 animate-pulse" />
            <span className="text-accent-400 font-bold text-lg tracking-wide">ИДЁТ УРОК</span>
          </span>
          <span className="text-white/40 text-base">·</span>
          <span className="text-white/80 text-base font-medium">{lesson}-й урок</span>
          <span className="text-white/40 text-base">·</span>
          <span className="text-white/50 text-sm">до {lessonEndTime(lesson)}</span>
        </div>
      )}

      {wsMsg && (
        <div className="bg-orange-500 bg-opacity-90 px-12 py-3 text-xl text-white font-semibold flex items-center gap-3">
          <IconMegaphone className="w-6 h-6 flex-shrink-0" />
          {wsMsg}
        </div>
      )}

      <div className="flex-1 overflow-hidden transition-all duration-700">
        {feed ? (
          <>
            {widgetIdx === 0 && <TopStudentsWidget students={feed.top_students} />}
            {widgetIdx === 1 && <NewsWidget items={feed.news} />}
            {widgetIdx === 2 && <SubstitutionsWidget subs={feed.substitutions} />}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-2xl animate-pulse">Загрузка...</div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${widgetIdx === i ? 'bg-white scale-125' : 'bg-white bg-opacity-30'}`} />
        ))}
      </div>
    </div>
  );
}
