import { motion } from 'motion/react';
import { 
  Heart, 
  Globe, 
  Users, 
  ShieldCheck, 
  Zap, 
  Target, 
  Clock, 
  Home, 
  CheckCircle2, 
  ArrowRight,
  Send,
  Star,
  Quote
} from 'lucide-react';
import { Link } from 'react-router';

export function AboutPage() {
  const values = [
    { title: "Экология", desc: "Даём вещам вторую жизнь, развивая осознанное потребление", icon: "🌱" },
    { title: "Взаимопомощь", desc: "Только проверенная информация и реальная поддержка", icon: "🤝" },
    { title: "Поддержка", desc: "Вещи в дар и функции в духе Couchsurfing для сложных моментов", icon: "🏠" },
    { title: "Общение", desc: "Живая афиша событий от самих пользователей", icon: "✨" }
  ];

  const howItWorks = [
    { title: "Структурированные объявления", desc: "Автоматическое удаление через месяц, никаких завалов и хаоса.", icon: "/assets/icons/custom/luggage.png" },
    { title: "Афиша от пользователей", desc: "Все встречи проходят модерацию для вашей безопасности.", icon: "/assets/icons/custom/afisha.png" },
    { title: "База знаний", desc: "Ответы на вопросы, основанные на реальном опыте жителей.", icon: "/assets/icons/custom/support_tab.png" },
    { title: "Удобный поиск жилья", desc: "От аренды на месяц до подселения и проверенных агентов.", icon: "/assets/icons/custom/category_housing.png" }
  ];

  const benefits = [
    { id: 1, text: "Экономия времени", desc: "Сразу видишь актуальные варианты" },
    { id: 2, text: "Меньше лишних затрат", desc: "Быстрее находишь то, что подходит" },
    { id: 3, text: "Понятно, кому доверять", desc: "Видишь путь и репутацию человека" },
    { id: 4, text: "Люди рядом", desc: "Те, кто в твоём городе и проходит тот же путь" },
    { id: 5, text: "Есть с чего начать", desc: "Внутри уже есть шаги и ориентиры" },
    { id: 6, text: "Меньше тревоги", desc: "Понятно, что делать и что ты не один" },
    { id: 7, text: "Всё в одном месте", desc: "Без десятков хаотичных чатов" },
    { id: 8, text: "Видишь свой путь", desc: "Как ты постепенно осваиваешься" },
    { id: 9, text: "Рост до Проводника", desc: "От поиска решений до помощи другим" },
    { id: 10, text: "Это пространство для жизни", desc: "Где жизнь постепенно складывается" }
  ];

  return (
    <div className="min-h-screen bg-warm-milk/30 pb-24 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-terracotta-deep/5 via-transparent to-dusty-indigo/5 -z-10" />
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-deep/10 text-terracotta-deep rounded-full mb-8"
          >
            <Heart className="w-4 h-4 fill-terracotta-deep" />
            <span className="text-xs font-black uppercase tracking-widest">У тебя есть на кого опереться</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-8 leading-tight text-foreground"
          >
            Relo me: свои люди <br/> в <span className="text-dusty-indigo">новой стране</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto"
          >
            Это не просто встречи и вещи. Это структурированная экосистема взаимной пользы для релокантов.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 md:mb-32">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-stretch">
          <div className="bg-white p-6 md:p-10 lg:p-14 rounded-[32px] md:rounded-[48px] border border-border/40 shadow-xl flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 flex items-center gap-3">
              <Globe className="w-7 h-7 md:w-8 md:h-8 text-dusty-indigo" /> Наша цель
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-4 md:mb-6">
              К 2028 году создать эффективную международную систему из <span className="text-foreground font-bold">10+ городов по всему миру</span> для людей, выбирающих жить в других странах.
            </p>
            <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
              Место, где экспаты обмениваются товарами, услугами, жильём, опытом и полезными контактами на всех этапах жизни за границей.
            </p>
          </div>
          <div className="bg-dusty-indigo text-white p-6 md:p-10 lg:p-14 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 relative z-10">Наша миссия</h2>
            <p className="text-base md:text-xl font-medium leading-relaxed relative z-10">
              Чтобы люди, выбравшие путь релокации, чувствовали себя среди своих, «как дома». Мы упрощаем быт, поиск друзей и поддержку развития местного бизнеса.
            </p>
          </div>
        </div>
      </section>

      {/* Scaling Section */}
      <section className="max-w-4xl mx-auto px-6 mb-32 text-center">
        <h2 className="text-3xl font-black mb-8">Масштабирование</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <span className="px-6 py-3 bg-terracotta-deep text-white rounded-full font-bold shadow-lg shadow-terracotta-deep/20">🚀 Дананг, Вьетнам — Первый запуск</span>
          <span className="px-6 py-3 bg-white border border-border/40 rounded-full font-bold text-muted-foreground">Далее — ключевые города мира</span>
          <span className="px-6 py-3 bg-white border border-border/40 rounded-full font-bold text-muted-foreground">Система открыта для всех</span>
        </div>
        <div className="bg-soft-sand/20 p-8 rounded-[32px] border border-soft-sand/40 italic text-muted-foreground font-medium text-lg">
          «Вся система основана на доверии: всё понятно и собрано в одном месте — в отличие от десятков хаотичных чатов в Telegram и Facebook»
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <h2 className="text-3xl font-black mb-12 text-center">Наши ценности</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-border/40 shadow-sm hover:shadow-md transition-all text-center">
              <div className="text-4xl mb-6">{v.icon}</div>
              <h3 className="text-xl font-black mb-3">{v.title}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 md:mb-32">
        <div className="bg-white rounded-[32px] md:rounded-[60px] p-6 sm:p-8 md:p-20 border border-border/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Quote className="w-40 h-40" />
          </div>
          <div className="grid md:grid-cols-12 gap-6 md:gap-12 items-center relative z-10">
            <div className="md:col-span-4">
              <div className="aspect-[4/5] bg-soft-sand/30 rounded-[40px] overflow-hidden relative group shadow-lg">
                <img 
                  src="/assets/images/founder.jpg" 
                  alt="Founder" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="mt-6 text-center">
                <p className="text-xl font-black">Основатель проекта</p>
                <p className="text-muted-foreground font-bold italic">Мама двоих детей, релокант со стажем</p>
              </div>
            </div>
            <div className="md:col-span-8">
              <h2 className="text-3xl font-black mb-8">Об основателе и опыте</h2>
              <div className="space-y-6 text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  За последние 4 года мы успели пожить в <span className="text-foreground font-bold">Кыргызстане, Турции, Египте, Таиланде и Вьетнаме</span>. И каждый раз новая страна — это безумно интересно, но и очень сложно.
                </p>
                <p>
                  Сложно встроиться в новую систему, наладить быт, найти новых «своих» — людей, с которыми можно играть в настолки или ходить на пляж. Это отнимает много сил и часто снижает желание двигаться дальше.
                </p>
                <p>
                  Пытаясь найти активности для детей среди множества чатов, я снова вспомнила свою идею 2022 года. И поняла: <span className="text-dusty-indigo font-bold italic">сейчас это важно. Это необходимо.</span>
                </p>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900/80 italic font-bold">
                  «У меня есть для этого весь нужный опыт — и личный, и профессиональный»
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works grid */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-6">Как Relo me помогает?</h2>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Это не просто сайт с объявлениями. Это система принятия решений на основе реального опыта.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {howItWorks.map((item, i) => (
            <div key={i} className="bg-white p-10 rounded-[40px] border border-border/40 shadow-sm flex gap-6 items-start hover:border-dusty-indigo/20 transition-all">
              <div className="w-12 h-12 bg-soft-sand/20 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden p-2.5">
                <img src={item.icon as string} alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 p-10 bg-soft-sand/20 rounded-[40px] border border-soft-sand/30">
          <h3 className="text-2xl font-black mb-6 text-center">⚡ Только суть — без лишнего шума</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {["Только полезная информация", "Без перегруженных чатов", "Конкретные решения"].map((text, i) => (
              <div key={i} className="font-bold text-foreground/70 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-warm-olive" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-5xl mx-auto px-6 mb-32">
        <div className="bg-white border-2 border-dusty-indigo/20 rounded-[48px] overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            <div className="p-12 bg-soft-sand/10 border-b md:border-b-0 md:border-r border-border/40">
              <h3 className="text-2xl font-black mb-8 text-muted-foreground/60">Обычные доски</h3>
              <ul className="space-y-4">
                {["Хаос и всё вперемешку", "Нет структуры", "Нет доверия", "Бесконечные обсуждения"].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground font-medium line-through decoration-red-500/30">
                    <span className="text-red-500">✕</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-12 bg-dusty-indigo text-white">
              <h3 className="text-2xl font-black mb-8">Экосистема Relo me</h3>
              <ul className="space-y-4">
                {["Удобная навигация и фильтры", "Модерация объявлений", "Система доверия и рейтингов", "Быстрая адаптация"].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-warm-olive" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="p-8 bg-red-50 text-center">
            <p className="text-red-700 font-black italic">
              «Если пользователь ведёт себя недобросовестно — он блокируется без возможности вернуться»
            </p>
          </div>
        </div>
      </section>

      {/* 10 Reasons Section */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">Чем мне поможет Relo me?</h2>
          <p className="text-muted-foreground font-bold">10 причин стать частью нашего сообщества</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {benefits.map((b) => (
            <motion.div
              key={b.id}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-[24px] border border-border/40 shadow-sm flex flex-col h-full"
            >
              <div className="text-terracotta-deep font-black text-2xl mb-4">#{b.id}</div>
              <h4 className="font-black text-base mb-2 leading-tight">{b.text}</h4>
              <p className="text-xs text-muted-foreground font-medium mt-auto leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-br from-terracotta-deep to-terracotta-deep/90 p-12 md:p-16 rounded-[60px] text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <h2 className="text-3xl md:text-4xl font-black mb-8 relative z-10">Готовы изменить свой опыт релокации?</h2>
          <p className="text-xl opacity-90 font-medium mb-10 max-w-2xl mx-auto relative z-10">
            Есть предложения, вопросы или хочешь открыть Relo me в своём городе? Напиши нам!
          </p>
          <div className="flex justify-center relative z-10">
            <a 
              href="https://t.me/Relome_help" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-10 py-5 bg-white text-terracotta-deep rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Send className="w-6 h-6" />
              Написать
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
