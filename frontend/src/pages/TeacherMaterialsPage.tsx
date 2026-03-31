import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi } from '../api';

type MaterialType = 'presentation' | 'document' | 'video' | 'homework' | 'test';
type Material = {
  id: number;
  title: string;
  type: MaterialType;
  classId: number;
  className: string;
  subjectName: string;
  fileName?: string;
  url?: string;
  description?: string;
  uploadedAt: string;
};

const TYPE_META: Record<MaterialType, { label: string; icon: JSX.Element; badge: string }> = {
  presentation: {
    label: 'Презентация',
    badge: 'bg-blue-100 text-blue-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5M3.75 3v16.5M3.75 3H3m16.5 0v16.5m0-16.5H21M3.75 19.5h16.5M9 9l3 3 3-3" />
      </svg>
    ),
  },
  document: {
    label: 'Документ',
    badge: 'bg-slate-100 text-slate-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  video: {
    label: 'Видео',
    badge: 'bg-red-100 text-red-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  homework: {
    label: 'Домашнее задание',
    badge: 'bg-orange-100 text-orange-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  test: {
    label: 'Тест / СОР',
    badge: 'bg-purple-100 text-purple-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
};

// ── Local storage helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = 'teacher_materials';

function loadMaterials(): Material[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveMaterials(items: Material[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>(loadMaterials);
  const [showForm, setShowForm] = useState(false);
  const [filterClass, setFilterClass] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<MaterialType>('document');
  const [formClassId, setFormClassId] = useState<number | null>(null);
  const [formSubject, setFormSubject] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const { data: slots = [] } = useQuery({
    queryKey: ['my-schedule'],
    queryFn: () => scheduleApi.mySchedule().then((r) => r.data),
  });

  const classOptions = [...new Map(
    (slots as any[]).filter(s => s.class_id && s.class_name)
      .map(s => [s.class_id, { id: s.class_id, name: s.class_name }])
  ).values()].sort((a, b) => a.name.localeCompare(b.name));

  const subjectsForClass = (cid: number | null) => [...new Map(
    (slots as any[])
      .filter(s => s.class_id === cid && s.subject_name)
      .map(s => [s.subject_name, s.subject_name])
  ).keys()];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFormFileName(file.name);
  }

  function handleSubmit() {
    if (!formTitle || !formClassId || !formSubject) return;
    const cls = classOptions.find(c => c.id === formClassId);
    const newItem: Material = {
      id: Date.now(),
      title: formTitle,
      type: formType,
      classId: formClassId,
      className: cls?.name ?? '',
      subjectName: formSubject,
      fileName: formFileName || undefined,
      url: formUrl || undefined,
      description: formDesc || undefined,
      uploadedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...materials];
    setMaterials(updated);
    saveMaterials(updated);
    setShowForm(false);
    setFormTitle(''); setFormType('document'); setFormClassId(null);
    setFormSubject(''); setFormDesc(''); setFormUrl(''); setFormFileName('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
  }

  function handleDelete(id: number) {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    saveMaterials(updated);
  }

  const filtered = materials.filter(m =>
    (filterClass === null || m.classId === filterClass) &&
    (filterType === 'all' || m.type === filterType)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Учебные материалы</h1>
          <p className="page-subtitle">Загружайте материалы для классов — они появятся у учеников</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Добавить материал
        </button>
      </div>

      {formSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Материал добавлен и доступен ученикам
        </div>
      )}

      {/* Upload form */}
      {showForm && (
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Новый материал</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Название</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Например: Производная функции — теория и примеры"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Тип материала</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(TYPE_META) as MaterialType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormType(t)}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      formType === t ? 'bg-primary-50 border-primary-400 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {TYPE_META[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Класс</label>
              <select
                value={formClassId ?? ''}
                onChange={(e) => { setFormClassId(Number(e.target.value) || null); setFormSubject(''); }}
                className="input text-sm"
              >
                <option value="">— выберите —</option>
                {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Предмет</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="input text-sm"
                disabled={!formClassId}
              >
                <option value="">— выберите —</option>
                {subjectsForClass(formClassId).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* File upload area */}
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Файл</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                {formFileName ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="font-medium">{formFileName}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFormFileName(''); }}
                      className="text-slate-400 hover:text-red-500 ml-1"
                    >✕</button>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-slate-500">Нажмите, чтобы выбрать файл</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPTX, MP4, JPG — до 50 МБ</p>
                  </>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.png,.zip" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Или ссылка <span className="text-slate-400">(YouTube, Google Drive…)</span></label>
              <input
                type="text"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                className="input text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Описание <span className="text-slate-400">(необязательно)</span></label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                placeholder="Краткое описание или инструкция для учеников..."
                className="input text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmit}
              disabled={!formTitle || !formClassId || !formSubject}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Опубликовать
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterClass ?? ''}
          onChange={(e) => setFilterClass(Number(e.target.value) || null)}
          className="input text-sm w-36"
        >
          <option value="">Все классы</option>
          {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${filterType === 'all' ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600'}`}
          >
            Все
          </button>
          {(Object.keys(TYPE_META) as MaterialType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${filterType === t ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600'}`}
            >
              {TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">Нет материалов. Нажмите «Добавить материал», чтобы загрузить первый.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const meta = TYPE_META[m.type];
            return (
              <div key={m.id} className="card flex items-start gap-4 py-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">{m.title}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                    <span className="font-medium text-primary-600">{m.className}</span>
                    <span>·</span>
                    <span>{m.subjectName}</span>
                    {m.fileName && <><span>·</span><span>{m.fileName}</span></>}
                    {m.description && <><span>·</span><span className="truncate max-w-xs">{m.description}</span></>}
                    <span>·</span>
                    <span>{new Date(m.uploadedAt).toLocaleDateString('ru')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded border border-primary-200 hover:border-primary-400 transition-colors">
                      Открыть
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors p-1"
                    title="Удалить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
