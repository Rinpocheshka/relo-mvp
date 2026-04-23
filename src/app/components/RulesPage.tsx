import { motion } from 'motion/react';
import { 
  Shield, 
  Info, 
  CheckCircle2, 
  AlertOctagon, 
  UserPlus, 
  Megaphone, 
  Award, 
  Lock, 
  Eye, 
  FileText, 
  Scale,
  Handshake,
  UserCheck,
  Zap
} from 'lucide-react';
import { Link } from 'react-router';

export function RulesPage() {
  const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-soft-sand/30 rounded-xl flex items-center justify-center text-dusty-indigo">
          {icon}
        </div>
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
      </div>
      <div className="bg-white rounded-[32px] p-8 border border-border/40 shadow-sm">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-milk/30 pb-24 pt-12 md:pt-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dusty-indigo/10 text-dusty-indigo rounded-full mb-6">
            <Scale className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Документация</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">📜 Правила сайта</h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
            Relome — это среда взаимной помощи. Чтобы она оставалась полезной и безопасной, есть базовые правила.
            <span className="block mt-4 text-foreground/80 italic font-bold">Это не про ограничения — это про то, чтобы здесь было комфортно всем.</span>
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/Relome_help" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border/40 rounded-full text-sm font-bold text-dusty-indigo hover:bg-soft-sand/20 transition-all">
              Чат поддержки t.me/Relome_help
            </a>
            <Link to="/support" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border/40 rounded-full text-sm font-bold text-warm-olive hover:bg-soft-sand/20 transition-all">
              Вопросы о Relo
            </Link>
          </div>
        </motion.div>

        {/* 1. Общие принципы */}
        <Section title="🧭 Общие принципы" icon={<Info className="w-6 h-6" />}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Уважение к другим участникам",
              "Честность в информации и взаимодействиях",
              "Ответственность за свои действия",
              "Ориентация на помощь, а не на спам"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 p-4 bg-soft-sand/10 rounded-2xl font-bold text-foreground/70">
                <CheckCircle2 className="w-5 h-5 text-warm-olive" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-8 pt-6 border-t border-border/20 text-xl font-bold text-dusty-indigo italic text-center">
            «Если коротко: веди себя так, как хотел(а) бы, чтобы вели себя с тобой.»
          </p>
        </Section>

        {/* 2. Регистрация */}
        <Section title="🛠 Регистрация" icon={<UserPlus className="w-6 h-6" />}>
          <p className="mb-6 text-muted-foreground font-medium">Чтобы создать полноценный профиль в системе, нужно:</p>
          <ul className="space-y-4">
            {[
              "Войти с помощью почты (на любом домене)",
              "Выбрать этап релокации",
              "Добавить мессенджер",
              "Выбрать 3 и более интереса (чтобы было проще находить «своих»)"
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground/80 font-bold">
                <div className="w-6 h-6 bg-dusty-indigo/10 text-dusty-indigo rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i+1}</div>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 p-6 bg-soft-sand/20 rounded-2xl border border-soft-sand/40">
            <p className="text-sm font-medium italic text-muted-foreground">
              Заполнение остальных разделов (мессенджеры, описание, фото, статус) остается на Ваше усмотрение. 
              <span className="block mt-2 font-bold text-foreground/70">Если Вы не зарегистрировались на сайте — Вы сможете его просматривать, но не сможете размещать материалы и оставлять комментарии.</span>
            </p>
          </div>
        </Section>

        {/* 3. Что можно */}
        <Section title="✅ Что здесь можно" icon={<CheckCircle2 className="w-6 h-6" />}>
          <div className="grid gap-4">
            {[
              "Задавать любые вопросы о жизни в новой стране",
              "Делиться опытом и помогать другим",
              "Размещать объявления (услуги, вещи, поиск)",
              "Создавать события и встречи",
              "Предлагать свою помощь как проводник/эксперт",
              "Участвовать в развитии проекта",
              "Оставлять заявку на открытие своего города"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 font-bold text-foreground/80">
                <div className="w-1.5 h-1.5 bg-warm-olive rounded-full" />
                {text}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-warm-olive font-black text-lg">
            Проект построен на активности — чем больше участия, тем больше ценности.
          </p>
        </Section>

        {/* 4. Запреты */}
        <Section title="🚫 Что запрещено" icon={<AlertOctagon className="w-6 h-6 text-red-500" />}>
          <div className="space-y-4 mb-8">
            {[
              "Оскорбления, токсичность, агрессия, порнография",
              "Обман, фейковые объявления, ввод в заблуждение",
              "Спам и навязчивая реклама",
              "Общение на темы, не касающиеся жизни в новых странах (флуд)",
              "Массовое дублирование объявлений",
              "Любая незаконная деятельность"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 font-bold text-red-600/80">
                <XCircleIcon />
                {text}
              </div>
            ))}
          </div>
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4">
            <AlertOctagon className="w-8 h-8 text-red-500 flex-shrink-0" />
            <p className="text-red-700 font-black">
              Такие действия могут привести к ограничению или блокировке аккаунта.
            </p>
          </div>
        </Section>

        {/* 5. Правила объявлений */}
        <Section title="📢 Правила объявлений" icon={<Megaphone className="w-6 h-6" />}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="font-bold flex items-center gap-2">📌 Одно объявление = одна задача</div>
              <div className="font-bold flex items-center gap-2">🖼 Актуальные фотографии</div>
              <div className="font-bold flex items-center gap-2">📝 Чёткое описание (что, где, условия)</div>
              <div className="font-bold flex items-center gap-2">🕒 Актуальность (удаляйте устаревшие)</div>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex flex-col justify-center">
              <p className="text-amber-800 font-black italic">
                💡 Рекомендуем: писать так, чтобы человек сразу понимал суть, без воды
              </p>
            </div>
          </div>
        </Section>

        {/* 6. Ограничения */}
        <Section title="🔢 Ограничения" icon={<Zap className="w-6 h-6" />}>
          <div className="space-y-4 mb-10">
            {[
              "До 10 активных объявлений в месяц",
              "До 4 событий в месяц",
              "Без массовых рассылок пользователям",
              "До 5 фото в объявлении"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 font-bold text-foreground/70">
                <CheckCircle2 className="w-4 h-4 text-dusty-indigo" />
                {text}
              </div>
            ))}
          </div>
          <Link to="/become-guide" className="group flex flex-col md:flex-row items-center gap-6 p-8 bg-gradient-to-r from-dusty-indigo to-dusty-indigo/80 text-white rounded-[32px] shadow-lg shadow-dusty-indigo/20 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black mb-2">Стань Проводником города</h4>
              <p className="text-sm font-medium opacity-80 leading-relaxed">
                Увеличенное количество объявлений (до 10 фото), возможность писать статьи, доступ к новым инструментам и знак доверия на аватарке.
              </p>
            </div>
          </Link>
        </Section>

        {/* 7. Взаимодействие */}
        <Section title="🤝 Взаимодействие" icon={<Handshake className="w-6 h-6" />}>
          <div className="space-y-6">
            <p className="font-bold text-foreground/80 leading-relaxed">
              — Общение происходит через внутренний чат или мессенджеры (Telegram, WhatsApp, VK)<br/>
              — Договаривайтесь напрямую, избегайте посредников<br/>
              — Уточняйте детали заранее, обсудите все моменты
            </p>
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200">
              <h4 className="font-black text-amber-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Внимание к безопасности:
              </h4>
              <p className="text-amber-800 font-bold leading-relaxed">
                Не переводите деньги удаленно, оплачивайте при встрече. Просьбы о «брони» или «предоплате» часто оказываются мошенничеством.
              </p>
            </div>
          </div>
        </Section>

        {/* 8. Модерация */}
        <Section title="🛠 Модерация" icon={<Scale className="w-6 h-6" />}>
          <p className="text-muted-foreground font-medium leading-relaxed mb-6">Мы не вмешиваемся без необходимости, но:</p>
          <ul className="space-y-3 font-bold text-foreground/80">
            <li>• Удаляем контент, нарушающий правила</li>
            <li>• Можем не опубликовать материал (напишем причину)</li>
            <li>• Рассматриваем жалобы пользователей</li>
            <li>• Наша задача — сохранить здоровую среду</li>
          </ul>
        </Section>

        {/* ── Privacy Policy Section ── */}
        <div id="privacy" className="mt-24 pt-12 border-t-4 border-dusty-indigo/10">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">🔐 Политика конфиденциальности</h2>
            <p className="text-muted-foreground font-medium italic">Обновлено: 2026 год</p>
          </motion.div>

          <div className="space-y-8">
            {[
              { 
                title: "1. Общие положения", 
                content: "Relome уважает вашу конфиденциальность и стремится защищать ваши персональные данные. Используя сайт, вы соглашаетесь с условиями данной политики." 
              },
              { 
                title: "2. Какие данные мы собираем", 
                content: "Мы собираем имя/никнейм, email, информацию профиля, ник в мессенджере или номер телефона, а также данные об активности внутри платформы. Автоматически могут собираться IP-адрес, тип браузера и технические данные." 
              },
              { 
                title: "3. Зачем мы это делаем", 
                content: "Данные нужны для работы платформы, связи между пользователями, улучшения сервиса и обеспечения безопасности. Мы не собираем данные «просто так»." 
              },
              { 
                title: "4. Передача данных", 
                content: "Мы не продаём и не передаём ваши данные третьим лицам, за исключением требований закона или необходимости для работы сервиса (технические подрядчики)." 
              },
              { 
                title: "5. Публичная информация", 
                content: "Часть информации (профиль, объявления) доступна другим пользователям. Вы сами решаете, что публиковать. Незарегистрированные пользователи не видят профили." 
              },
              { 
                title: "6. Хранение и защита", 
                content: "Мы принимаем разумные технические и административные меры для защиты данных. Однако ни одна система не гарантирует 100% защиту." 
              },
              { 
                title: "7. Cookies", 
                content: "Сайт может использовать cookies для сохранения настроек и анализа поведения. Вы можете отключить их в браузере." 
              },
              { 
                title: "8. Ваши права", 
                content: "Вы можете изменять или удалять свои данные, а также полностью удалить аккаунт." 
              }
            ].map((section, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[32px] border border-border/40 shadow-sm">
                <h3 className="text-xl font-black mb-4 text-dusty-indigo">{section.title}</h3>
                <p className="text-foreground/80 font-medium leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 p-12 bg-dusty-indigo text-white rounded-[48px] text-center shadow-2xl">
            <Lock className="w-12 h-12 mx-auto mb-6 opacity-50" />
            <h3 className="text-3xl font-black mb-4">⚠️ Отказ от ответственности</h3>
            <p className="text-lg opacity-80 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
              Relome является платформой для связи. Мы не являемся стороной сделок и не несём ответственности за договорённости между пользователями. Каждый участник самостоятельно принимает решения.
            </p>
            <a href="mailto:relome.world@gmail.com" className="inline-flex items-center gap-2 text-xl font-black underline decoration-white/30 underline-offset-8 hover:decoration-white transition-all">
              relome.world@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}
