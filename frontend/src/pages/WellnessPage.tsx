import { useState } from 'react';

// ─── Данные тестов ────────────────────────────────────────────────────────────

const TEST_LEARNING_STYLE = {
  id: 'learning_style',
  title: 'Стиль обучения',
  subtitle: 'Тест VARK · 12 вопросов',
  description: 'Узнайте, как вам легче всего воспринимать и запоминать новый материал.',
  questions: [
    { text: 'Когда вы учите новую тему, вы предпочитаете...', options: [{ label: 'Читать учебник или конспект', type: 'R' }, { label: 'Смотреть видео или схемы', type: 'V' }, { label: 'Слушать объяснение учителя', type: 'A' }, { label: 'Решать задачи и практиковаться сразу', type: 'K' }] },
    { text: 'Чтобы запомнить информацию, вы...', options: [{ label: 'Перечитываете несколько раз', type: 'R' }, { label: 'Рисуете схемы и майндмэпы', type: 'V' }, { label: 'Проговариваете вслух', type: 'A' }, { label: 'Пробуете сделать что-то руками', type: 'K' }] },
    { text: 'На уроке вам легче всего, когда...', options: [{ label: 'Учитель даёт раздаточные материалы', type: 'R' }, { label: 'Объяснение идёт с презентацией', type: 'V' }, { label: 'Идёт живое обсуждение', type: 'A' }, { label: 'Есть лабораторная работа', type: 'K' }] },
    { text: 'Готовясь к экзамену, вы...', options: [{ label: 'Перечитываете записи', type: 'R' }, { label: 'Делаете таблицы и схемы', type: 'V' }, { label: 'Рассказываете материал вслух', type: 'A' }, { label: 'Решаете как можно больше задач', type: 'K' }] },
    { text: 'Если вы забыли дорогу, вы скорее...', options: [{ label: 'Ищете адрес в записях', type: 'R' }, { label: 'Смотрите карту', type: 'V' }, { label: 'Звоните и спрашиваете', type: 'A' }, { label: 'Идёте и ориентируетесь по ходу', type: 'K' }] },
    { text: 'При объяснении чего-то другу, вы...', options: [{ label: 'Отправляете ссылку или текст', type: 'R' }, { label: 'Рисуете или показываете картинку', type: 'V' }, { label: 'Рассказываете своими словами', type: 'A' }, { label: 'Показываете на практике', type: 'K' }] },
    { text: 'Когда вы скучаете на уроке, вы...', options: [{ label: 'Листаете учебник или тетрадь', type: 'R' }, { label: 'Рисуете на полях', type: 'V' }, { label: 'Тихо болтаете с соседом', type: 'A' }, { label: 'Ёрзаете и хочется встать', type: 'K' }] },
    { text: 'Лучше всего вы понимаете инструкцию, когда...', options: [{ label: 'Она написана пошагово', type: 'R' }, { label: 'Есть иллюстрации или видео', type: 'V' }, { label: 'Вам объясняют устно', type: 'A' }, { label: 'Сразу пробуете сделать', type: 'K' }] },
    { text: 'Новое слово лучше запомнится, если...', options: [{ label: 'Прочитаете определение', type: 'R' }, { label: 'Увидите картинку к слову', type: 'V' }, { label: 'Услышите его в контексте', type: 'A' }, { label: 'Используете его в разговоре', type: 'K' }] },
    { text: 'После урока вы лучше помните...', options: [{ label: 'То, что записали', type: 'R' }, { label: 'Схемы с доски', type: 'V' }, { label: 'Что говорил учитель', type: 'A' }, { label: 'Что делали сами', type: 'K' }] },
    { text: 'Вам легче изучить историческое событие через...', options: [{ label: 'Статью или книгу', type: 'R' }, { label: 'Документальный фильм или карту', type: 'V' }, { label: 'Рассказ учителя', type: 'A' }, { label: 'Ролевую игру или проект', type: 'K' }] },
    { text: 'Когда вы слушаете лекцию, вы...', options: [{ label: 'Подробно конспектируете', type: 'R' }, { label: 'Делаете зарисовки и стрелки', type: 'V' }, { label: 'Просто слушаете, не записывая', type: 'A' }, { label: 'Думаете, как применить на практике', type: 'K' }] },
  ],
};

const TEST_MOTIVATION = {
  id: 'motivation',
  title: 'Учебная мотивация',
  subtitle: 'Тест Гордеевой–Леонтьева · 12 вопросов',
  description: 'Оцените каждое утверждение: насколько оно соответствует вашей учёбе.',
  scale: ['Совсем не так', 'Скорее не так', 'Отчасти так', 'Скорее так', 'Именно так'],
  questions: [
    { text: 'Я учусь, потому что мне интересно узнавать новое', type: 'intrinsic' },
    { text: 'Я стараюсь в учёбе, чтобы получить хорошую работу в будущем', type: 'external' },
    { text: 'Учёба даёт мне чувство достижения и гордости', type: 'intrinsic' },
    { text: 'Я учусь, потому что родители этого ждут от меня', type: 'external' },
    { text: 'Мне нравится разбираться в сложных задачах', type: 'intrinsic' },
    { text: 'Меня беспокоит, что подумают другие, если у меня плохие оценки', type: 'external' },
    { text: 'Я учусь ради самого процесса — это мне нравится', type: 'intrinsic' },
    { text: 'Оценки важны для меня, потому что влияют на мою репутацию', type: 'external' },
    { text: 'Я сам(а) ставлю себе цели в учёбе и стремлюсь к ним', type: 'intrinsic' },
    { text: 'Я учусь, чтобы избежать неприятностей', type: 'external' },
    { text: 'Знания, которые я получаю, кажутся мне важными и полезными', type: 'intrinsic' },
    { text: 'Я учусь, потому что иначе накажут или осудят', type: 'external' },
  ],
};

const TEST_TEMPERAMENT = {
  id: 'temperament',
  title: 'Тип темперамента',
  subtitle: 'Тест Айзенка · 10 вопросов',
  description: 'Определите, какой тип темперамента вам ближе всего по поведению и реакциям.',
  questions: [
    { text: 'В компании незнакомых людей вы...', options: [{ label: 'Легко знакомитесь и много общаетесь', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Чувствуете себя комфортно, но не торопитесь', score: { S: 0, C: 2, F: 0, M: 1 } }, { label: 'Держитесь в стороне и наблюдаете', score: { S: 0, C: 1, F: 0, M: 2 } }, { label: 'Нервничаете, но пытаетесь общаться', score: { S: 1, C: 0, F: 2, M: 0 } }] },
    { text: 'Когда задание срочное, вы...', options: [{ label: 'Берётесь с энтузиазмом', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Методично составляете план', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Волнуетесь, но справляетесь', score: { S: 0, C: 0, F: 2, M: 1 } }, { label: 'Работаете медленно и вдумчиво', score: { S: 0, C: 1, F: 0, M: 2 } }] },
    { text: 'После неудачи вы обычно...', options: [{ label: 'Быстро забываете и двигаетесь дальше', score: { S: 2, C: 0, F: 0, M: 0 } }, { label: 'Анализируете, что пошло не так', score: { S: 0, C: 2, F: 0, M: 1 } }, { label: 'Долго переживаете', score: { S: 0, C: 0, F: 2, M: 0 } }, { label: 'Расстраиваетесь, но не торопитесь', score: { S: 0, C: 1, F: 0, M: 2 } }] },
    { text: 'В споре вы...', options: [{ label: 'Активно отстаиваете свою точку зрения', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Логично аргументируете', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Легко соглашаетесь с другими', score: { S: 0, C: 0, F: 0, M: 2 } }, { label: 'Расстраиваетесь и замолкаете', score: { S: 0, C: 0, F: 2, M: 1 } }] },
    { text: 'Ваш типичный темп работы...', options: [{ label: 'Быстро, но иногда небрежно', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Равномерно и методично', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Переменно — то быстро, то медленно', score: { S: 0, C: 0, F: 2, M: 0 } }, { label: 'Медленно, но тщательно', score: { S: 0, C: 1, F: 0, M: 2 } }] },
    { text: 'Перед важным событием вы...', options: [{ label: 'Возбуждены и нетерпеливы', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Спокойно готовитесь', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Очень тревожитесь', score: { S: 0, C: 0, F: 2, M: 0 } }, { label: 'Стараетесь не думать об этом', score: { S: 0, C: 0, F: 0, M: 2 } }] },
    { text: 'Вам легче работать в...', options: [{ label: 'Шумном месте с людьми', score: { S: 2, C: 0, F: 0, M: 0 } }, { label: 'Тихом удобном месте', score: { S: 0, C: 2, F: 0, M: 1 } }, { label: 'Любом — если настрой есть', score: { S: 0, C: 0, F: 2, M: 0 } }, { label: 'Привычном спокойном месте', score: { S: 0, C: 1, F: 0, M: 2 } }] },
    { text: 'Ваши эмоции обычно...', options: [{ label: 'Яркие и быстро меняются', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Ровные и стабильные', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Сильные и долгие', score: { S: 0, C: 0, F: 2, M: 0 } }, { label: 'Слабые и медленные', score: { S: 0, C: 0, F: 0, M: 2 } }] },
    { text: 'Когда нужно принять решение, вы...', options: [{ label: 'Решаете быстро и интуитивно', score: { S: 2, C: 0, F: 1, M: 0 } }, { label: 'Взвешиваете все за и против', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Долго сомневаетесь', score: { S: 0, C: 0, F: 2, M: 1 } }, { label: 'Откладываете решение', score: { S: 0, C: 0, F: 0, M: 2 } }] },
    { text: 'В конце насыщенного дня вы...', options: [{ label: 'Всё ещё полны энергии', score: { S: 2, C: 0, F: 0, M: 0 } }, { label: 'Немного устали, но спокойны', score: { S: 0, C: 2, F: 0, M: 0 } }, { label: 'Истощены и взволнованы', score: { S: 0, C: 0, F: 2, M: 0 } }, { label: 'Устали и хотите тишины', score: { S: 0, C: 0, F: 0, M: 2 } }] },
  ],
};

const TEST_TIMEMANAGEMENT = {
  id: 'timemanagement',
  title: 'Тайм-менеджмент',
  subtitle: '10 вопросов',
  description: 'Оцените, насколько хорошо вы управляете своим временем в учёбе.',
  scale: ['Никогда', 'Редко', 'Иногда', 'Часто', 'Всегда'],
  questions: [
    'Я планирую своё домашнее задание заранее, а не в последний момент',
    'Я разбиваю большие задачи на маленькие шаги',
    'Я соблюдаю дедлайны по сдаче работ',
    'Я знаю, сколько времени займёт то или иное задание',
    'Я отключаю телефон или убираю отвлекающие факторы во время учёбы',
    'Я делаю перерывы по расписанию, а не хаотично',
    'У меня есть чёткое рабочее место для учёбы',
    'Я расставляю приоритеты: сначала важное, потом второстепенное',
    'Я редко опаздываю на уроки или пропускаю события из-за плохой организации',
    'После учёбы я чувствую, что сделал(а) достаточно',
  ],
};

// ─── Вспомогательные типы ────────────────────────────────────────────────────

const STYLE_INFO: Record<string, { title: string; badge: string; text: string }> = {
  V: { title: 'Визуальный тип', badge: 'bg-blue-100 text-blue-800', text: 'Вы лучше всего усваиваете информацию через схемы, таблицы, диаграммы и видео. Используйте майндмэпы, цветные маркеры и структурированные конспекты.' },
  A: { title: 'Аудиальный тип', badge: 'bg-purple-100 text-purple-800', text: 'Вы запоминаете лучше, когда слышите информацию. Проговаривайте материал вслух, записывайте голосовые заметки, объясняйте темы другим.' },
  R: { title: 'Текстовый тип', badge: 'bg-green-100 text-green-800', text: 'Вы лучший друг учебника и конспекта. Перечитывание и переписывание — ваши главные инструменты. Делайте подробные записи и читайте дополнительную литературу.' },
  K: { title: 'Кинестетический тип', badge: 'bg-orange-100 text-orange-800', text: 'Вы учитесь через практику. Лабораторные работы, проекты и решение задач — ваши сильные стороны. Старайтесь сразу применять новые знания на практике.' },
};

const TEMP_INFO: Record<string, { title: string; badge: string; text: string }> = {
  S: { title: 'Сангвиник', badge: 'bg-yellow-100 text-yellow-800', text: 'Живой, энергичный, общительный. Легко берётесь за новое, быстро адаптируетесь. Учитесь использовать свою энергию целенаправленно — доводить дела до конца.' },
  C: { title: 'Флегматик', badge: 'bg-blue-100 text-blue-800', text: 'Спокойный, методичный, надёжный. Вы сильны в планировании и анализе. Ваш темп может казаться медленным, но результат всегда качественный.' },
  F: { title: 'Холерик', badge: 'bg-red-100 text-red-800', text: 'Импульсивный, эмоциональный, решительный. Быстро воспламеняетесь идеями. Учитесь управлять вспышками эмоций — это сделает вас ещё эффективнее.' },
  M: { title: 'Меланхолик', badge: 'bg-slate-100 text-slate-700', text: 'Чувствительный, вдумчивый, глубокий. Вы замечаете детали, которые другие пропускают. Работайте над уверенностью в себе — ваши способности заслуживают признания.' },
};

// ─── Компонент: тест VARK ────────────────────────────────────────────────────

function LearningStyleTest() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ dominant: string; counts: Record<string, number> } | null>(null);
  const totalQ = TEST_LEARNING_STYLE.questions.length;
  const answered = Object.keys(answers).length;

  function handleSubmit() {
    const counts: Record<string, number> = { V: 0, A: 0, R: 0, K: 0 };
    Object.values(answers).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    setResult({ dominant, counts });
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{TEST_LEARNING_STYLE.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{TEST_LEARNING_STYLE.subtitle}</p>
          <p className="text-sm text-slate-500 mt-2">{TEST_LEARNING_STYLE.description}</p>
        </div>
        {!result ? (
          <button onClick={() => setOpen(!open)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${open ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
            {open ? 'Свернуть' : 'Пройти тест'}
          </button>
        ) : (
          <button onClick={() => { setAnswers({}); setResult(null); setOpen(false); }} className="flex-shrink-0 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100">Пройти снова</button>
        )}
      </div>

      {open && !result && (
        <div className="mt-5 border-t border-slate-100 pt-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(answered / totalQ) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400">{answered} / {totalQ}</span>
          </div>
          {TEST_LEARNING_STYLE.questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium text-slate-700 mb-3"><span className="text-slate-400 mr-2">{qi + 1}.</span>{q.text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswers({ ...answers, [qi]: opt.type })}
                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${answers[qi] === opt.type ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <span className={`inline-block w-4 h-4 rounded-full border-2 mr-2 align-middle ${answers[qi] === opt.type ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} disabled={answered < totalQ} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
            {answered < totalQ ? `Ответьте на все вопросы (${totalQ - answered} осталось)` : 'Посмотреть результат'}
          </button>
        </div>
      )}

      {result && (() => {
        const info = STYLE_INFO[result.dominant];
        return (
          <div className="mt-4 p-4 rounded-xl border bg-slate-50 border-slate-200">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${info.badge}`}>{info.title}</span>
            <p className="text-sm text-slate-600 mt-3 mb-4">{info.text}</p>
            <div className="grid grid-cols-4 gap-2">
              {(['V', 'A', 'R', 'K'] as const).map((t) => (
                <div key={t} className={`text-center p-2 rounded-lg ${t === result.dominant ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-slate-100'}`}>
                  <div className={`text-lg font-bold ${t === result.dominant ? 'text-primary-600' : 'text-slate-400'}`}>{result.counts[t]}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t === 'V' ? 'Визуал' : t === 'A' ? 'Аудиал' : t === 'R' ? 'Текст' : 'Кинест.'}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Компонент: мотивация ────────────────────────────────────────────────────

function MotivationTest() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ intrinsic: number; external: number } | null>(null);
  const totalQ = TEST_MOTIVATION.questions.length;
  const answered = Object.keys(answers).length;
  const intrinsicMax = TEST_MOTIVATION.questions.filter(q => q.type === 'intrinsic').length * 5;
  const externalMax = TEST_MOTIVATION.questions.filter(q => q.type === 'external').length * 5;

  function handleSubmit() {
    let intrinsic = 0, external = 0;
    TEST_MOTIVATION.questions.forEach((q, i) => {
      const val = (answers[i] ?? 0) + 1;
      if (q.type === 'intrinsic') intrinsic += val; else external += val;
    });
    setResult({ intrinsic, external });
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{TEST_MOTIVATION.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{TEST_MOTIVATION.subtitle}</p>
          <p className="text-sm text-slate-500 mt-2">{TEST_MOTIVATION.description}</p>
        </div>
        {!result ? (
          <button onClick={() => setOpen(!open)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${open ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
            {open ? 'Свернуть' : 'Пройти тест'}
          </button>
        ) : (
          <button onClick={() => { setAnswers({}); setResult(null); setOpen(false); }} className="flex-shrink-0 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100">Пройти снова</button>
        )}
      </div>

      {open && !result && (
        <div className="mt-5 border-t border-slate-100 pt-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(answered / totalQ) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400">{answered} / {totalQ}</span>
          </div>
          {TEST_MOTIVATION.questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium text-slate-700 mb-3"><span className="text-slate-400 mr-2">{qi + 1}.</span>{q.text}</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TEST_MOTIVATION.scale.map((label, si) => (
                  <button key={si} onClick={() => setAnswers({ ...answers, [qi]: si })}
                    className={`px-2 py-2 rounded-lg border text-xs text-center transition-colors ${answers[qi] === si ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 mx-auto mb-1 ${answers[qi] === si ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} disabled={answered < totalQ} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
            {answered < totalQ ? `Ответьте на все вопросы (${totalQ - answered} осталось)` : 'Посмотреть результат'}
          </button>
        </div>
      )}

      {result && (() => {
        const ip = Math.round((result.intrinsic / intrinsicMax) * 100);
        const ep = Math.round((result.external / externalMax) * 100);
        const isHealthy = ip >= ep;
        return (
          <div className={`mt-4 p-4 rounded-xl border ${isHealthy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${isHealthy ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Преобладает {ip >= ep ? 'внутренняя' : 'внешняя'} мотивация
            </span>
            <div className="space-y-3 mt-3 mb-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Внутренняя (интерес, развитие)</span><span className="font-medium text-green-700">{ip}%</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${ip}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Внешняя (оценки, мнение других)</span><span className="font-medium text-orange-600">{ep}%</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-400 rounded-full" style={{ width: `${ep}%` }} /></div>
              </div>
            </div>
            <p className="text-sm text-slate-600">{isHealthy ? 'Отлично! Вы учитесь из интереса и желания развиваться — это самый устойчивый вид мотивации.' : 'Попробуйте находить что-то интересное в каждом предмете — это поможет учиться с большим удовольствием.'}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Компонент: темперамент ───────────────────────────────────────────────────

function TemperamentTest() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Record<string, number>>>({});
  const [result, setResult] = useState<{ dominant: string; scores: Record<string, number> } | null>(null);
  const totalQ = TEST_TEMPERAMENT.questions.length;
  const answered = Object.keys(answers).length;

  function handleSubmit() {
    const scores: Record<string, number> = { S: 0, C: 0, F: 0, M: 0 };
    Object.values(answers).forEach((sc) => {
      Object.entries(sc).forEach(([k, v]) => { scores[k] = (scores[k] ?? 0) + v; });
    });
    const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    setResult({ dominant, scores });
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{TEST_TEMPERAMENT.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{TEST_TEMPERAMENT.subtitle}</p>
          <p className="text-sm text-slate-500 mt-2">{TEST_TEMPERAMENT.description}</p>
        </div>
        {!result ? (
          <button onClick={() => setOpen(!open)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${open ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
            {open ? 'Свернуть' : 'Пройти тест'}
          </button>
        ) : (
          <button onClick={() => { setAnswers({}); setResult(null); setOpen(false); }} className="flex-shrink-0 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100">Пройти снова</button>
        )}
      </div>

      {open && !result && (
        <div className="mt-5 border-t border-slate-100 pt-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(answered / totalQ) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400">{answered} / {totalQ}</span>
          </div>
          {TEST_TEMPERAMENT.questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium text-slate-700 mb-3"><span className="text-slate-400 mr-2">{qi + 1}.</span>{q.text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswers({ ...answers, [qi]: opt.score })}
                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${JSON.stringify(answers[qi]) === JSON.stringify(opt.score) ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <span className={`inline-block w-4 h-4 rounded-full border-2 mr-2 align-middle ${JSON.stringify(answers[qi]) === JSON.stringify(opt.score) ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} disabled={answered < totalQ} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
            {answered < totalQ ? `Ответьте на все вопросы (${totalQ - answered} осталось)` : 'Посмотреть результат'}
          </button>
        </div>
      )}

      {result && (() => {
        const info = TEMP_INFO[result.dominant];
        const total = Object.values(result.scores).reduce((a, b) => a + b, 0) || 1;
        return (
          <div className="mt-4 p-4 rounded-xl border bg-slate-50 border-slate-200">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${info.badge}`}>{info.title}</span>
            <p className="text-sm text-slate-600 mt-3 mb-4">{info.text}</p>
            <div className="grid grid-cols-4 gap-2">
              {(['S', 'C', 'F', 'M'] as const).map((t) => (
                <div key={t} className={`text-center p-2 rounded-lg ${t === result.dominant ? 'bg-primary-50 border border-primary-200' : 'bg-white border border-slate-100'}`}>
                  <div className={`text-lg font-bold ${t === result.dominant ? 'text-primary-600' : 'text-slate-400'}`}>{Math.round((result.scores[t] / total) * 100)}%</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t === 'S' ? 'Сангв.' : t === 'C' ? 'Флегм.' : t === 'F' ? 'Холер.' : 'Мелан.'}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Компонент: тайм-менеджмент ─────────────────────────────────────────────

function TimeManagementTest() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const totalQ = TEST_TIMEMANAGEMENT.questions.length;
  const answered = Object.keys(answers).length;

  function handleSubmit() {
    const score = Object.values(answers).reduce((a, b) => a + b + 1, 0);
    setResult(score);
  }

  const maxScore = totalQ * 5;
  const getLevel = (s: number) => {
    const pct = s / maxScore;
    if (pct >= 0.8) return { label: 'Отличное владение временем', badge: 'bg-green-100 text-green-800', bar: 'bg-green-500', text: 'Вы отлично организованы. Продолжайте в том же духе и делитесь советами с одноклассниками.' };
    if (pct >= 0.6) return { label: 'Хорошее владение', badge: 'bg-blue-100 text-blue-800', bar: 'bg-blue-500', text: 'У вас хорошие навыки планирования. Есть несколько зон роста — попробуйте технику «Помодоро».' };
    if (pct >= 0.4) return { label: 'Средний уровень', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400', text: 'Вы справляетесь, но часто откладываете дела. Попробуйте планировать вечер перед сном.' };
    return { label: 'Есть над чем работать', badge: 'bg-red-100 text-red-800', bar: 'bg-red-400', text: 'Время утекает незаметно. Начните с малого: записывайте 3 главные задачи на день.' };
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{TEST_TIMEMANAGEMENT.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{TEST_TIMEMANAGEMENT.subtitle}</p>
          <p className="text-sm text-slate-500 mt-2">{TEST_TIMEMANAGEMENT.description}</p>
        </div>
        {result === null ? (
          <button onClick={() => setOpen(!open)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${open ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
            {open ? 'Свернуть' : 'Пройти тест'}
          </button>
        ) : (
          <button onClick={() => { setAnswers({}); setResult(null); setOpen(false); }} className="flex-shrink-0 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100">Пройти снова</button>
        )}
      </div>

      {open && result === null && (
        <div className="mt-5 border-t border-slate-100 pt-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(answered / totalQ) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400">{answered} / {totalQ}</span>
          </div>
          {TEST_TIMEMANAGEMENT.questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-medium text-slate-700 mb-3"><span className="text-slate-400 mr-2">{qi + 1}.</span>{q}</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TEST_TIMEMANAGEMENT.scale.map((label, si) => (
                  <button key={si} onClick={() => setAnswers({ ...answers, [qi]: si })}
                    className={`px-2 py-2 rounded-lg border text-xs text-center transition-colors ${answers[qi] === si ? 'bg-primary-50 border-primary-400 text-primary-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 mx-auto mb-1 ${answers[qi] === si ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} disabled={answered < totalQ} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
            {answered < totalQ ? `Ответьте на все вопросы (${totalQ - answered} осталось)` : 'Посмотреть результат'}
          </button>
        </div>
      )}

      {result !== null && (() => {
        const level = getLevel(result);
        const pct = Math.round((result / maxScore) * 100);
        return (
          <div className="mt-4 p-4 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${level.badge}`}>{level.label}</span>
              <span className="text-xs text-slate-400">{result} / {maxScore} баллов</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div className={`h-full ${level.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-slate-600">{level.text}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Компонент: запись к психологу ──────────────────────────────────────────

const PSYCHOLOGISTS = [
  { id: 1, name: 'Айгуль Сейткали', spec: 'Подростковая психология', photo: 'АС', days: ['Пн', 'Ср', 'Пт'], slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
  { id: 2, name: 'Марат Джаксыбеков', spec: 'Учебные трудности и стресс', photo: 'МД', days: ['Вт', 'Чт'], slots: ['09:30', '11:00', '13:00', '15:30'] },
];

type BookingStep = 'select' | 'slot' | 'confirm' | 'done';

function PsychologistBooking() {
  const [step, setStep] = useState<BookingStep>('select');
  const [selectedPsy, setSelectedPsy] = useState<typeof PSYCHOLOGISTS[0] | null>(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');

  function reset() { setStep('select'); setSelectedPsy(null); setSelectedDay(''); setSelectedSlot(''); setReason(''); }

  return (
    <div className="card border-l-4 border-l-primary-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Запись к психологу</h3>
          <p className="text-sm text-slate-500 mt-0.5">Конфиденциально · Бесплатно · Без осуждения</p>
        </div>
        {step !== 'select' && step !== 'done' && (
          <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded">← Назад</button>
        )}
      </div>

      {/* Шаг 1: выбор психолога */}
      {step === 'select' && (
        <div className="space-y-3">
          {PSYCHOLOGISTS.map((p) => (
            <button key={p.id} onClick={() => { setSelectedPsy(p); setStep('slot'); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center flex-shrink-0">{p.photo}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800">{p.name}</div>
                <div className="text-sm text-slate-500">{p.spec}</div>
                <div className="text-xs text-slate-400 mt-1">Приём: {p.days.join(', ')}</div>
              </div>
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>
      )}

      {/* Шаг 2: выбор дня и времени */}
      {step === 'slot' && selectedPsy && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">{selectedPsy.photo}</div>
            <div><div className="font-medium text-slate-800 text-sm">{selectedPsy.name}</div><div className="text-xs text-slate-500">{selectedPsy.spec}</div></div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">День недели</p>
            <div className="flex gap-2 flex-wrap">
              {selectedPsy.days.map((d) => (
                <button key={d} onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedDay === d ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>{d}</button>
              ))}
            </div>
          </div>
          {selectedDay && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Время</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {selectedPsy.slots.map((s) => (
                  <button key={s} onClick={() => setSelectedSlot(s)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${selectedSlot === s ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Причина обращения <span className="text-slate-400 font-normal">(необязательно)</span></p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Например: учебный стресс, конфликт с одноклассником..."
              className="input text-sm resize-none" />
          </div>
          <button onClick={() => setStep('confirm')} disabled={!selectedDay || !selectedSlot}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
            Продолжить
          </button>
        </div>
      )}

      {/* Шаг 3: подтверждение */}
      {step === 'confirm' && selectedPsy && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Специалист</span><span className="font-medium text-slate-800">{selectedPsy.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">День</span><span className="font-medium text-slate-800">{selectedDay}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Время</span><span className="font-medium text-slate-800">{selectedSlot}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Кабинет</span><span className="font-medium text-slate-800">205</span></div>
            {reason && <div className="flex justify-between text-sm"><span className="text-slate-500">Причина</span><span className="font-medium text-slate-800 text-right max-w-[60%]">{reason}</span></div>}
          </div>
          <p className="text-xs text-slate-400">Запись конфиденциальна. Классный руководитель и родители не уведомляются без вашего согласия.</p>
          <div className="flex gap-2">
            <button onClick={() => setStep('slot')} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Изменить</button>
            <button onClick={() => setStep('done')} className="flex-1 btn-primary text-sm">Записаться</button>
          </div>
        </div>
      )}

      {/* Шаг 4: успех */}
      {step === 'done' && selectedPsy && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="font-semibold text-slate-800 mb-1">Запись оформлена</h4>
          <p className="text-sm text-slate-500 mb-4">{selectedPsy.name} · {selectedDay} в {selectedSlot} · кабинет 205</p>
          <button onClick={reset} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Записаться снова</button>
        </div>
      )}
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function WellnessPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">Тесты и психолог</h1>
        <p className="page-subtitle">Узнайте о себе больше · Результаты видите только вы</p>
      </div>

      <PsychologistBooking />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
        Тесты носят ознакомительный характер и помогут лучше организовать учёбу. Данные не сохраняются.
      </div>

      <LearningStyleTest />
      <MotivationTest />
      <TemperamentTest />
      <TimeManagementTest />
    </div>
  );
}
