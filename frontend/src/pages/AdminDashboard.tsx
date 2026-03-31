import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '../api';
import api from '../api/client';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IconTrash, IconNewspaper, IconClipboard } from '../components/ui/Icons';

export default function AdminDashboard() {
  const qc = useQueryClient();
  const location = useLocation();
  const [tab, setTab] = useState<'news' | 'reports'>(
    location.pathname.includes('reports') ? 'reports' : 'news'
  );
  const [newNews, setNewNews] = useState({ title: '', body: '', is_announcement: false });
  const [report, setReport] = useState('');
  const [quarter, setQuarter] = useState<number | undefined>();

  useEffect(() => {
    setTab(location.pathname.includes('reports') ? 'reports' : 'news');
  }, [location.pathname]);

  const { data: news = [] } = useQuery({
    queryKey: ['news'],
    queryFn: () => newsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => newsApi.create(newNews),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['news'] }); setNewNews({ title: '', body: '', is_announcement: false }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => newsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news'] }),
  });

  const reportMutation = useMutation({
    mutationFn: () => api.get('/ai/report/generate', { params: quarter ? { quarter } : {} }).then((r) => r.data),
    onSuccess: (data) => setReport(data.report),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">Панель администратора</h1>
        <p className="text-slate-500 text-sm">Управление порталом</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'news',    label: 'Новости',  icon: <IconNewspaper className="w-4 h-4" /> },
          { key: 'reports', label: 'Отчёты',   icon: <IconClipboard className="w-4 h-4" /> },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'news' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4">Создать публикацию</h3>
            <div className="space-y-3">
              <input className="input" placeholder="Заголовок" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} />
              <textarea className="input h-24 resize-none" placeholder="Текст..." value={newNews.body} onChange={(e) => setNewNews({ ...newNews, body: e.target.value })} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={newNews.is_announcement} onChange={(e) => setNewNews({ ...newNews, is_announcement: e.target.checked })} />
                  Объявление
                </label>
                <button onClick={() => createMutation.mutate()} disabled={!newNews.title || !newNews.body || createMutation.isPending} className="btn-primary">
                  Опубликовать
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4">Публикации ({(news as any[]).length})</h3>
            <div className="space-y-3">
              {(news as any[]).map((n) => (
                <div key={n.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      {n.title}
                      {n.is_announcement && <span className="badge-orange">Объявление</span>}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.body}</div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(n.id)}
                    className="ml-3 text-slate-400 hover:text-danger-500 transition-colors"
                    title="Удалить"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-1">Отчёт об успеваемости</h3>
            <p className="text-sm text-slate-500 mb-4">
              Формируется на основе оценок из журнала — средние баллы, распределение, динамика по четвертям.
            </p>
            <div className="flex gap-3 items-center">
              <select
                className="input w-44"
                value={quarter || ''}
                onChange={(e) => setQuarter(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">За весь год</option>
                <option value="1">1-я четверть</option>
                <option value="2">2-я четверть</option>
                <option value="3">3-я четверть</option>
                <option value="4">4-я четверть</option>
              </select>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                className="btn-primary"
              >
                {reportMutation.isPending ? 'Формирование...' : 'Сформировать отчёт'}
              </button>
            </div>

            {report && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
