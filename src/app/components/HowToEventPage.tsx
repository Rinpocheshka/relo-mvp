import { motion } from 'motion/react';
import { 
  Calendar, 
  Lightbulb, 
  Pencil, 
  ClipboardList, 
  Smile, 
  Share2, 
  UserCheck, 
  PartyPopper, 
  HeartHandshake,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router';

export function HowToEventPage() {
  const steps = [
    {
      title: "1. Определи идею мероприятия",
      icon: <Lightbulb className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Ответь себе на 3 вопроса:</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-dusty-indigo rounded-full" /> Что это? (встреча, прогулка, мастер-класс, нетворкинг)</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-dusty-indigo rounded-full" /> Для кого? (новички, предприниматели, мамы, экспаты)</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-dusty-indigo rounded-full" /> Зачем людям приходить?</li>
          </ul>
          <div className="bg-soft-sand/20 p-4 rounded-2xl border-l-4 border-dusty-indigo">
            <p className="text-sm font-bold italic">👉 Пример: «Прогулка по Данангу для тех, кто только переехал — познакомиться и освоиться»</p>
          </div>
          <p className="mt-4 text-sm font-black text-warm-olive italic">‼️ Любой повод который пришел тебе в голову может быть интересен — будь смелее, пробуй!</p>
        </>
      )
    },
    {
      title: "2. Придумай понятное название",
      icon: <Pencil className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Хорошее название = сразу ясно, что будет происходить. Формула: <strong>Формат + польза + атмосфера</strong></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["«Нетворкинг у моря для экспатов»", "«Завтрак и знакомства в Дананге»", "«Прогулка по городу + кофе»"].map((t, i) => (
              <div key={i} className="p-3 bg-white border border-border/40 rounded-xl text-sm font-bold text-foreground/70">{t}</div>
            ))}
          </div>
        </>
      )
    },
    {
      title: "3. Заполни карточку события",
      icon: <ClipboardList className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Обязательно укажи основные параметры: название, категория, дата/время, стоимость и вместимость. Описание должно отвечать на вопросы: <strong>что будет, сколько длится, что получит человек.</strong></p>
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 mb-4">
            <p className="text-sm font-bold text-amber-900 leading-relaxed">
              👉 Не пиши абстрактно — пиши конкретно. Если планируешь брать предоплату (как бронь места) — обязательно укажи это в описании.
            </p>
          </div>
        </>
      )
    },
    {
      title: "4. Добавь живое описание",
      icon: <Smile className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Люди идут не на «событие», а на ощущение. Добавь атмосферу (спокойно/весело), формат общения и примерный состав участников.</p>
          <div className="p-4 bg-white border border-dashed border-dusty-indigo/30 rounded-2xl italic text-muted-foreground text-sm">
            «Будет небольшая группа до 10 человек, познакомимся, обсудим жизнь в Дананге и просто хорошо проведём время у моря»
          </div>
        </>
      )
    },
    {
      title: "5. Опубликуй и продвигай",
      icon: <Share2 className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Само по себе событие редко собирает людей — используй кнопку <strong>«Поделиться»</strong> в чатах, приглашай знакомых лично и отвечай всем откликнувшимся.</p>
          <div className="flex items-start gap-3 p-4 bg-soft-sand/10 rounded-2xl border border-soft-sand/30">
            <AlertCircle className="w-5 h-5 text-dusty-indigo shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-muted-foreground">
              После публикации событие поступит на модерацию (обычно 1-2 часа, максимум сутки), так как мы всё проверяем вручную.
            </p>
          </div>
        </>
      )
    },
    {
      title: "6. Подтверди участников",
      icon: <UserCheck className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Люди регистрируются кнопкой «Участвовать». Напиши им за 1-3 дня до события, чтобы напомнить, уточнить состав и решить вопрос с предоплатой.</p>
          <p className="text-sm font-bold text-dusty-indigo">👉 Это сильно снижает «сливы» и помогает понять реальное количество гостей.</p>
        </>
      )
    },
    {
      title: "7. Проведи мероприятие",
      icon: <PartyPopper className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">Твоя задача: встретить людей, познакомить их друг с другом и задать тон общения.</p>
          <div className="bg-gradient-to-r from-warm-olive/10 to-transparent p-4 rounded-xl">
            <p className="text-sm font-black text-warm-olive flex items-center gap-2">
              <Zap className="w-4 h-4" /> Лайфхак: заранее придумай 2–3 вопроса для знакомства.
            </p>
          </div>
        </>
      )
    },
    {
      title: "8. Заверши и поддержи людей",
      icon: <HeartHandshake className="w-6 h-6" />,
      content: (
        <>
          <p className="mb-4">После мероприятия напиши участникам, поблагодари и предложи следующее событие. Это превращает разовую встречу в настоящее сообщество.</p>
        </>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-warm-milk/30 pb-24">
      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-white to-transparent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full mb-6"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Гайд: Афиша</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Как создать и провести мероприятие <br className="hidden md:block" /> в разделе <span className="text-terracotta-deep">“Афиша”</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            Эта статья поможет тебе не просто опубликовать событие, а собрать людей и сделать его живым и полезным.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[32px] p-8 border border-border/40 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-soft-sand/30 rounded-2xl flex items-center justify-center text-dusty-indigo">
                  {step.icon}
                </div>
                <h2 className="text-xl font-black text-foreground">{step.title}</h2>
              </div>
              <div className="text-muted-foreground font-medium leading-relaxed">
                {step.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { t: "Начни с простого", d: "Не усложняй формат на старте" },
            { t: "Маленькое и живое", d: "Лучше, чем большое, но пустое" },
            { t: "Люди на людей", d: "Приходят на личность, а не на описание" }
          ].map((item, i) => (
            <div key={i} className="bg-dusty-indigo text-white p-8 rounded-[32px] text-center shadow-xl">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-4 opacity-50" />
              <h4 className="font-black mb-2">{item.t}</h4>
              <p className="text-xs opacity-80 font-medium">{item.d}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-16 bg-white p-10 rounded-[40px] border border-border/40 text-center shadow-2xl">
          <p className="text-lg font-medium text-muted-foreground leading-relaxed mb-8">
            Relome — удобная платформа для анонсирования событий, сбора гостей и анализа. Делись своими событиями в чатах, чтобы сделать их еще более эффективными!
          </p>
          <Link 
            to="/events?create=true"
            className="inline-flex items-center gap-3 px-10 py-5 bg-terracotta-deep text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-terracotta-deep/20 hover:scale-105 active:scale-95"
          >
            Создать событие
          </Link>
        </div>
      </section>
    </div>
  );
}
