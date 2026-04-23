import { motion } from 'motion/react';
import { CheckCircle2, XCircle, TrendingUp, Users, Award, Rocket, Heart, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

export function BecomeGuide() {
  const whyItems = [
    {
      title: "Ты уже знаешь, как всё устроено",
      icon: <CheckCircle2 className="w-6 h-6 text-warm-olive" />,
    },
    {
      title: "У тебя есть контакты, опыт и понимание «как лучше»",
      icon: <Users className="w-6 h-6 text-dusty-indigo" />,
    },
    {
      title: "Люди прямо сейчас ищут таких, как ты",
      icon: <Heart className="w-6 h-6 text-terracotta-deep" />,
    }
  ];

  const valueItems = [
    {
      title: "Доход",
      desc: "Монетизируешь то, что уже знаешь",
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      color: "bg-green-50"
    },
    {
      title: "Связи",
      desc: "Расширяешь круг общения и выходишь на новых людей",
      icon: <Users className="w-8 h-8 text-dusty-indigo" />,
      color: "bg-indigo-50"
    },
    {
      title: "Репутация",
      desc: "Становишься лидером мнений и востребованным внутри сообщества",
      icon: <Award className="w-8 h-8 text-amber-500" />,
      color: "bg-amber-50"
    },
    {
      title: "Возможности",
      desc: "Доступ к новым возможностям и росту внутри платформы",
      icon: <Rocket className="w-8 h-8 text-terracotta-deep" />,
      color: "bg-orange-50"
    }
  ];

  return (
    <div className="min-h-screen bg-warm-milk/30 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-soft-sand/40 to-transparent -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-deep/10 text-terracotta-deep rounded-full mb-6"
          >
            <Award className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Программа Проводников</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-8 leading-tight"
          >
            Стань проводником <span className="text-terracotta-deep underline decoration-soft-sand underline-offset-8">города</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Ты уже прошёл старт в новой стране, адаптацию и весь этот тернистый путь? 
            Тогда то, что для тебя — «обычные вещи», для кого-то — стрессы, ошибки и потерянные деньги.
            <span className="block mt-4 text-foreground font-bold">Ты можешь это изменить.</span>
          </motion.p>
        </div>
      </section>

      {/* Why Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {whyItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] shadow-sm border border-border/40 hover:shadow-xl hover:shadow-soft-sand/20 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-soft-sand/20 flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold leading-snug">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-dusty-indigo text-white rounded-[40px] overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-14 border-b md:border-b-0 md:border-r border-white/10 bg-black/5">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span className="opacity-40">И вместо того, чтобы:</span>
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-red-500/20 rounded-full">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-lg font-medium opacity-80">Хаотично отвечать в тысяче чатов</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-red-500/20 rounded-full">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-lg font-medium opacity-80">Повторять одно и то же по кругу</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-red-500/20 rounded-full">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-lg font-medium opacity-80">Смотреть, как люди совершают те же ошибки</span>
                </li>
              </ul>
            </div>
            <div className="p-10 md:p-14 bg-gradient-to-br from-terracotta-deep to-terracotta-deep/80">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <span>Ты можешь:</span>
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-white/20 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold">Поддерживать системно и качественно</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-white/20 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold">Получать за это ценность (деньги / связи / репутацию)</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-white/20 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold">Стать «своим человеком» для новых людей</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <h2 className="text-3xl font-black mb-12 text-center">Что ты получаешь</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-border/40 text-center flex flex-col items-center"
            >
              <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
                {item.icon}
              </div>
              <h4 className="text-xl font-black mb-3">{item.title}</h4>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <div className="bg-soft-sand/20 p-10 md:p-14 rounded-[40px] text-center border border-soft-sand/30">
          <p className="text-xl md:text-2xl font-bold leading-relaxed italic text-dusty-indigo mb-0">
            «Проводник — это не «работа по найму», а роль внутри экосистемы. Её сила — в доверии, предоставлении пользы и живом опыте. Чем больше человек помогает другим — тем сильнее его позиции в обществе.»
          </p>
        </div>
      </section>

      {/* Who it suits Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-black mb-8 leading-tight">Кому это подойдёт</h2>
            <ul className="space-y-6">
              {[
                "Уже живёшь в городе и «разобрался»",
                "Не равнодушен к людям и тебе доверяют",
                "Имеешь свое влияние на комьюнити в городе",
                "Уже проявил активность (создавал объявления, отвечал)",
                "Хочешь большего, чем просто «жить для себя»"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="w-2 h-2 bg-terracotta-deep rounded-full transition-all group-hover:scale-150" />
                  <span className="text-lg font-bold text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-10 rounded-[40px] border border-border/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-warm-olive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <HelpCircle className="w-12 h-12 text-warm-olive mb-6" />
            <h3 className="text-2xl font-black mb-4">Важно понимать</h3>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Тебе не нужно быть «службой поддержки». Не нужно знать абсолютно всё. 
              <span className="block mt-4 text-foreground font-black">
                Нужно только одно — реально хотеть помочь и поделиться тем, что уже знаешь.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white p-12 md:p-16 rounded-[48px] shadow-2xl shadow-soft-sand/50 border border-border/20"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">👉 Сделай шаг</h2>
          <p className="text-xl text-muted-foreground font-bold mb-10 leading-relaxed max-w-2xl mx-auto">
            Стань проводником и преврати свой опыт в ценность — для себя и для других. Начать можно уже сейчас.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <a 
              href="https://t.me/Relome_help" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-terracotta-deep/20 active:scale-95"
            >
              Напиши нам в поддержку
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Напиши слово «проводник» нам в @Relome_help
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
