import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nisgramApi } from '../api/modules';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { IconHeart, IconClock } from '../components/ui/Icons';

const TAG_COLORS: Record<string, string> = {
  'Олимпиада': 'bg-yellow-100 text-yellow-700',
  'Спорт': 'bg-green-100 text-green-700',
  'Наука': 'bg-blue-100 text-blue-700',
  'Искусство': 'bg-purple-100 text-purple-700',
  'Выборы президента школы': 'bg-red-100 text-red-700',
};

function PostCard({ post, onLike }: { post: any; onLike: () => void }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      {post.image_url && (
        <img src={post.image_url} alt={post.title}
          className="w-full h-48 object-cover rounded-lg mb-4" />
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        {(post.tags || []).map((tag: string) => (
          <span key={tag} className={`badge text-xs ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-600'}`}>
            {tag}
          </span>
        ))}
      </div>
      <h3 className="font-bold text-slate-800 text-lg">{post.title}</h3>
      <p className="text-slate-600 text-sm mt-2 line-clamp-3">{post.description}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div>
          <div className="text-sm font-medium text-slate-700">{post.student_name}</div>
          {post.mentor_name && (
            <div className="text-xs text-slate-400">Наставник: {post.mentor_name}</div>
          )}
        </div>
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
        >
          <IconHeart className="w-4 h-4" />
          {post.likes_count}
        </button>
      </div>
    </div>
  );
}

export default function NisGramPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '', description: '', student_id: user?.id || 0, tags: [] as string[]
  });

  const { data: feed = [] } = useQuery({
    queryKey: ['nisgram-feed', activeTag],
    queryFn: () => nisgramApi.feed(activeTag).then(r => r.data),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ['nisgram-tags'],
    queryFn: () => nisgramApi.tags().then(r => r.data),
  });
  const { data: pending = [] } = useQuery({
    queryKey: ['nisgram-pending'],
    queryFn: () => nisgramApi.pendingPosts().then(r => r.data),
    enabled: user?.role === 'teacher' || user?.role === 'admin',
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => nisgramApi.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nisgram-feed'] }),
  });

  const createMutation = useMutation({
    mutationFn: () => nisgramApi.createPost(newPost),
    onSuccess: () => { setShowCreateForm(false); qc.invalidateQueries({ queryKey: ['nisgram-feed'] }); },
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      nisgramApi.moderate(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nisgram-pending'] }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Лента достижений</h1>
          <p className="text-slate-500 text-sm">Успехи и достижения учеников лицея</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          + Добавить достижение
        </button>
      </div>

      {showCreateForm && (
        <div className="card border-l-4 border-primary-500">
          <h3 className="font-semibold text-slate-700 mb-4">Новое достижение</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Заголовок" value={newPost.title}
              onChange={e => setNewPost({ ...newPost, title: e.target.value })} />
            <textarea className="input h-24 resize-none" placeholder="Описание..."
              value={newPost.description}
              onChange={e => setNewPost({ ...newPost, description: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              {(tags as any[]).map((tag: any) => (
                <button key={tag.name}
                  onClick={() => {
                    const t = newPost.tags.includes(tag.name)
                      ? newPost.tags.filter(x => x !== tag.name)
                      : [...newPost.tags, tag.name];
                    setNewPost({ ...newPost, tags: t });
                  }}
                  className={`badge cursor-pointer ${newPost.tags.includes(tag.name) ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {tag.icon} {tag.name}
                </button>
              ))}
            </div>
            <button onClick={() => createMutation.mutate()} disabled={!newPost.title || createMutation.isPending}
              className="btn-primary">
              Отправить на модерацию
            </button>
          </div>
        </div>
      )}

      {(user?.role === 'teacher' || user?.role === 'admin') && (pending as any[]).length > 0 && (
        <div className="card border border-orange-200 bg-orange-50">
          <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
            <IconClock className="w-4 h-4" />
            Ожидают модерации ({(pending as any[]).length})
          </h3>
          <div className="space-y-3">
            {(pending as any[]).map((p: any) => (
              <div key={p.id} className="bg-white rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{p.title}</div>
                  <div className="text-sm text-slate-500">{p.student_name}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => moderateMutation.mutate({ id: p.id, action: 'approve' })}
                    className="btn-primary py-1 px-3 text-sm">Принять</button>
                  <button onClick={() => moderateMutation.mutate({ id: p.id, action: 'reject' })}
                    className="btn-danger py-1 px-3 text-sm">Отклонить</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveTag(undefined)}
          className={`badge cursor-pointer px-3 py-1 ${!activeTag ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          Все
        </button>
        {(tags as any[]).map((tag: any) => (
          <button key={tag.name} onClick={() => setActiveTag(tag.name === activeTag ? undefined : tag.name)}
            className={`badge cursor-pointer px-3 py-1 ${activeTag === tag.name ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {tag.icon} {tag.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(feed as any[]).map((post: any) => (
          <PostCard key={post.id} post={post} onLike={() => likeMutation.mutate(post.id)} />
        ))}
        {(feed as any[]).length === 0 && (
          <div className="col-span-3 text-center text-slate-400 py-10">Пока нет публикаций</div>
        )}
      </div>
    </div>
  );
}
