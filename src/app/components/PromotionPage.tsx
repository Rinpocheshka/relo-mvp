import { motion } from 'motion/react';
import { Target, ShieldCheck, Zap, BarChart3, MessageCircle, Send, PlusCircle, CheckCircle2 } from 'lucide-react';

export function PromotionPage() {
  const importanceItems = [
    { title: "Релевантность", desc: "Подходит ли это под задачи релокации", icon: <Target className="w-5 h-5 text-terracotta-deep" /> },
    { title: "Практическая ценность", desc: "Решает ли это реальную проблему", icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { title: "Опыт и репутация", desc: "Можно ли этому доверять", icon: <ShieldCheck className="w-5 h-5 text-warm-olive" /> },
    { title: "Формат подачи", desc: "Насколько это честно и понятно", icon: <MessageCircle className="w-5 h-5 text-dusty-indigo" /> }
  ];

  const futureItems = [
    "Форматы нативного продвижения",
    "Инструменты для проводников и сервисов",
    "Прозрачные условия размещения"
  ];

  return (
    <div className="min-h-screen bg-warm-milk/30 pb-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-soft-sand/40 via-transparent to-dusty-indigo/5 -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-8 leading-tight text-foreground"
          >
            Продвижение <span className="text-dusty-indigo">на сайте</span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-white/40 shadow-xl shadow-soft-sand/20"
          >
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              На текущем этапе проект находится в стадии формирования партнерской и рекламной экосистемы. 
              Мы не масштабируем продвижение активно, а фокусируемся на <span className="text-foreground font-bold">качестве и релевантности</span> предложений внутри платформы.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6">Как это работает сейчас</h2>
            <p className="text-lg text-muted-foreground mb-8 font-medium">Мы открыты к предложениям от:</p>
            <div className="space-y-4">
              {["Проводников", "Локальных сервисов", "Специалистов и бизнесов", "Участников сообщества"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-border/40 shadow-sm transition-transform hover:translate-x-2">
                  <div className="w-2 h-2 bg-dusty-indigo rounded-full" />
                  <span className="font-bold text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-dusty-indigo text-white p-10 md:p-14 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <p className="text-xl font-bold leading-relaxed relative z-10">
              «Каждое предложение рассматривается индивидуально. Наша задача — не количество рекламы, а реальная польза для людей в новой стране.»
            </p>
          </div>
        </div>
      </section>

      {/* Importance Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-4">Что для нас важно</h2>
          <p className="text-muted-foreground font-medium italic">Это позволяет формировать доверительную и живую среду, а не рекламную площадку.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {importanceItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-border/40 hover:border-dusty-indigo/30 transition-all shadow-sm flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-soft-sand/20 rounded-xl flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h4 className="text-lg font-black mb-2">{item.title}</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-soft-sand/20 rounded-[48px] p-10 md:p-16 border border-soft-sand/30">
          <h3 className="text-2xl font-black mb-10 text-center text-dusty-indigo">Такой подход позволяет:</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: "избегать “мусорной” рекламы", icon: "🚫" },
              { text: "видеть только полезные предложения", icon: "✅" },
              { text: "быстрее находить то, что нужно", icon: "🚀" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-4">{item.icon}</div>
                <p className="font-bold text-foreground/70 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action Section */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <div className="bg-white p-12 md:p-16 rounded-[48px] border border-border/30 shadow-2xl shadow-soft-sand/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <PlusCircle className="w-12 h-12 text-terracotta-deep/20" />
          </div>
          <h2 className="text-3xl font-black mb-8">Для тех, кто хочет продвигаться</h2>
          <p className="text-lg text-muted-foreground font-medium mb-10 leading-relaxed">
            Если вы хотите представить свои услуги или продукт — мы рассматриваем не «рекламу», а включение в экосистему.
          </p>
          <ul className="space-y-4 mb-12">
            {[
              "Опишите, чем вы полезны людям в новой стране",
              "Покажите реальный опыт или кейсы",
              "Предложите формат взаимодействия"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-4 text-foreground font-bold">
                <CheckCircle2 className="w-5 h-5 text-warm-olive" />
                {text}
              </li>
            ))}
          </ul>
          <div className="text-center">
            <a 
              href="https://t.me/Relome_help" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-dusty-indigo/20 active:scale-95"
            >
              <Send className="w-5 h-5" />
              Написать в @Relome_help
            </a>
            <p className="mt-6 text-sm text-muted-foreground font-bold">
              Сделаем наш Relome еще полезнее вместе!
            </p>
          </div>
        </div>
      </section>

      {/* Future Section */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full mb-8">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Что дальше</span>
          </div>
          <h3 className="text-2xl font-black mb-8">По мере развития платформы появятся:</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {futureItems.map((text, i) => (
              <span key={i} className="px-6 py-3 bg-white border border-border/40 rounded-full text-sm font-bold text-muted-foreground shadow-sm">
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
