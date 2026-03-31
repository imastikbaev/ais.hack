import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyApi } from '../api/modules';
import { useState } from 'react';
import { IconCoin, IconCheckCircle, IconUtensils, IconClipboard } from '../components/ui/Icons';
import { useLangStore, translations } from '../stores/langStore';

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Основное', snack: 'Закуска', drink: 'Напиток', dessert: 'Десерт'
};

export default function CurrencyPage() {
  const { lang } = useLangStore();
  const t = (k: string) => translations[lang]?.[k] ?? k;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'menu' | 'orders'>('menu');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const { data: balance } = useQuery({
    queryKey: ['currency-balance'],
    queryFn: () => currencyApi.balance().then(r => r.data),
  });
  const { data: menu = [] } = useQuery({
    queryKey: ['cafeteria-menu'],
    queryFn: () => currencyApi.cafeteria().then(r => r.data),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => currencyApi.myOrders().then(r => r.data),
    enabled: tab === 'orders',
  });

  const orderMutation = useMutation({
    mutationFn: (item_id: number) => currencyApi.order(item_id),
    onSuccess: (res) => {
      setOrderSuccess(res.data);
      qc.invalidateQueries({ queryKey: ['currency-balance'] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('school_canteen')}</h1>
          <p className="text-slate-500 text-sm">{t('coin_rate')}</p>
        </div>
        {balance && (
          <div className="card py-3 px-5 flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
            <IconCoin className="w-6 h-6 text-amber-500" />
            <div>
              <div className="text-2xl font-black text-amber-600">{balance.balance}</div>
              <div className="text-xs text-slate-500">монет ≈ {balance.balance_tenge} ₸</div>
            </div>
          </div>
        )}
      </div>

      {orderSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 font-semibold text-green-700 mb-2">
            <IconCheckCircle className="w-5 h-5" />
            {t('order_done')}
          </div>
          <div className="text-sm text-slate-600 mb-3">
            <strong>{orderSuccess.item_name}</strong> — {orderSuccess.coins_spent} монет
          </div>
          <div className="bg-white rounded-lg p-4 text-center border-2 border-dashed border-green-300">
            <div className="text-xs text-slate-400 mb-1">{t('qr_for_cashier')}</div>
            <div className="font-mono text-lg font-bold text-slate-700">{orderSuccess.qr_token}</div>
            <div className="text-xs text-slate-400 mt-1">{orderSuccess.qr_data}</div>
          </div>
          <button onClick={() => setOrderSuccess(null)} className="mt-3 text-sm text-slate-500 hover:text-slate-700">
            {t('close')}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { key: 'menu', label: '🍽 ' + t('menu_tab'), icon: <IconUtensils className="w-4 h-4" /> },
          { key: 'orders', label: '📋 ' + t('my_orders'), icon: <IconClipboard className="w-4 h-4" /> },
        ].map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === tb.key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(menu as any[]).map((item: any) => (
            <div key={item.id} className="card hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                {CATEGORY_LABELS[item.category] || item.category}
              </div>
              <div className="font-bold text-slate-800 text-lg">{item.name}</div>
              <div className="text-sm text-slate-500 mt-1">{item.description}</div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div>
                  <div className="flex items-center gap-1 text-xl font-black text-amber-600">
                    {item.price_coins}
                    <IconCoin className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-400">{item.price_tenge} ₸</div>
                </div>
                <button
                  onClick={() => orderMutation.mutate(item.id)}
                  disabled={orderMutation.isPending || (balance && balance.balance < item.price_coins)}
                  className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
                >
                  {t('order_btn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {(orders as any[]).length === 0 && (
            <div className="text-center text-slate-400 py-10">{t('no_orders')}</div>
          )}
          {(orders as any[]).map((order: any) => (
            <div key={order.id} className="card flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${order.status === 'redeemed' ? 'bg-green-500' : 'bg-amber-400'}`} />
              <div className="flex-1">
                <div className="font-medium text-slate-800">{order.item_name}</div>
                <div className="text-xs text-slate-400">
                  {new Date(order.created_at).toLocaleString('ru')}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                -{order.coins_spent}
                <IconCoin className="w-4 h-4" />
              </div>
              {order.status === 'pending' && (
                <div className="text-center">
                  <div className="font-mono text-xs bg-slate-100 rounded px-2 py-1">{order.qr_token}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t('show_cashier')}</div>
                </div>
              )}
              <span className={`badge ${order.status === 'redeemed' ? 'badge-green' : 'badge-orange'}`}>
                {order.status === 'redeemed' ? t('received') : t('pending')}
              </span>
            </div>
          ))}
        </div>
      )}

      {balance?.transactions?.length > 0 && tab === 'menu' && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-3">{t('tx_history')}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {balance.transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{tx.description}</span>
                <span className={`font-bold flex items-center gap-1 ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                  <IconCoin className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
