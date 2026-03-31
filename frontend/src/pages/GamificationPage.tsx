import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationApi } from '../api';
import type { LeaderboardEntry, ShopItem, PortfolioItem } from '../types';
import { useState } from 'react';
import { IconTrophy, IconGift, IconAward, IconStar } from '../components/ui/Icons';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white text-sm font-black">1</div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white text-sm font-black">2</div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-black">3</div>;
  return <div className="w-8 text-center font-bold text-slate-400">{rank}</div>;
}

function PortfolioIcon({ type }: { type: string }) {
  if (type === 'certificate') return <IconAward className="w-6 h-6 text-blue-500" />;
  if (type === 'olympiad') return <IconStar className="w-6 h-6 text-yellow-500" />;
  return <IconTrophy className="w-6 h-6 text-amber-600" />;
}

export default function GamificationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'points' | 'leaderboard' | 'shop' | 'portfolio'>('points');

  const { data: points } = useQuery({
    queryKey: ['my-points'],
    queryFn: () => gamificationApi.myPoints().then((r) => r.data),
  });
  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['school-leaderboard'],
    queryFn: () => gamificationApi.schoolLeaderboard().then((r) => r.data),
  });
  const { data: shop = [] } = useQuery<ShopItem[]>({
    queryKey: ['shop'],
    queryFn: () => gamificationApi.shop().then((r) => r.data),
  });
  const { data: portfolio = [] } = useQuery<PortfolioItem[]>({
    queryKey: ['portfolio'],
    queryFn: () => gamificationApi.portfolio().then((r) => r.data),
  });

  const buyMutation = useMutation({
    mutationFn: (item_id: number) => gamificationApi.buy(item_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-points'] }),
  });

  const [newItem, setNewItem] = useState({ item_type: 'certificate', title: '', description: '' });
  const addMutation = useMutation({
    mutationFn: () => gamificationApi.addPortfolioItem(newItem),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); setNewItem({ item_type: 'certificate', title: '', description: '' }); },
  });

  const tabs = [
    { key: 'points', label: 'Баллы' },
    { key: 'leaderboard', label: 'Лидерборд' },
    { key: 'shop', label: 'Магазин' },
    { key: 'portfolio', label: 'Портфолио' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Достижения</h1>
        {points && (
          <div className="card py-2 px-4 flex items-center gap-2">
            <IconTrophy className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xl font-bold text-primary-600">{points.total_points}</div>
              <div className="text-xs text-slate-500">баллов</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'points' && points && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">История начислений</h3>
          <div className="space-y-2">
            {points.history.map((h: any) => (
              <div key={h.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                <div className="text-sm text-slate-700">{h.reason}</div>
                <div className={`font-bold text-sm ${h.points > 0 ? 'text-success-600' : 'text-danger-500'}`}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Рейтинг лицея</h3>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.student_id} className={`flex items-center gap-3 p-3 rounded-lg ${
                entry.rank <= 3 ? 'bg-yellow-50' : 'hover:bg-slate-50'
              }`}>
                <RankBadge rank={entry.rank} />
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{entry.student_name}</div>
                  <div className="text-xs text-slate-500">{entry.class_name}</div>
                </div>
                <div className="font-bold text-primary-600">{entry.total_points}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shop.map((item) => (
            <div key={item.id} className="card">
              <div className="mb-2">
                <IconGift className="w-7 h-7 text-primary-400" />
              </div>
              <div className="font-semibold text-slate-800">{item.name}</div>
              <div className="text-sm text-slate-500 mt-1">{item.description}</div>
              <div className="flex items-center justify-between mt-4">
                <div className="font-bold text-primary-600">{item.cost} баллов</div>
                <button
                  onClick={() => buyMutation.mutate(item.id)}
                  disabled={buyMutation.isPending}
                  className="btn-primary py-1.5 px-3 text-sm"
                >
                  Купить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'portfolio' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4">Добавить достижение</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="input" value={newItem.item_type} onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value })}>
                <option value="certificate">Сертификат</option>
                <option value="olympiad">Олимпиада</option>
                <option value="competition">Конкурс</option>
                <option value="project">Проект</option>
              </select>
              <input className="input" placeholder="Название" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
              <button onClick={() => addMutation.mutate()} disabled={!newItem.title || addMutation.isPending} className="btn-primary">
                + Добавить
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start gap-3">
                  <PortfolioIcon type={item.item_type} />
                  <div>
                    <div className="font-semibold text-slate-800">{item.title}</div>
                    {item.description && <div className="text-sm text-slate-500 mt-1">{item.description}</div>}
                    <div className="text-xs text-slate-400 mt-2">{new Date(item.created_at).toLocaleDateString('ru')}</div>
                    {item.verified_by && <span className="badge-green mt-1">Верифицировано</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
