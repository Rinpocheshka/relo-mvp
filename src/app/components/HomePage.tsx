import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';
import { MessageHelper } from './MessageHelper';

type Stage = 'planning' | 'living' | 'helping' | 'leaving';

export function HomePage() {
  const [currentStage, setCurrentStage] = useState<Stage>('living');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [showMessageHelper, setShowMessageHelper] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('reloOnboarding');
    const storedStage = localStorage.getItem('reloStage') as Stage;
    if (stored) {
      setOnboardingData(JSON.parse(stored));
    }
    if (storedStage) {
      setCurrentStage(storedStage);
    }
  }, []);

  const stages = [
    { id: 'planning' as Stage, label: 'Планирую переезд', icon: '🗺️' },
    { id: 'living' as Stage, label: 'Осваиваюсь / Живу', icon: '🏠' },
    { id: 'helping' as Stage, label: 'Помогаю другим', icon: '🤝' },
    { id: 'leaving' as Stage, label: 'Уезжаю', icon: '👋' },
  ];

  const stageContent = {
    planning: {
      greeting: 'Переезд — это не про чемоданы. Это про то, как создать новую жизнь.',
      subtitle: '',
      steps: [
        { text: 'Выбрать город', link: '/cities' },
        { text: 'Посмотреть жилье', link: '/announcements?category=housing' },
        { text: 'Найти ответы', link: '/support' },
        { text: 'Написать местным', link: '/people?filter=local' },
      ],
      sections: [
        {
          title: 'Ответы на вопросы «А как проще…»',
          subtitle: 'Найти опору',
          link: '/support',
        },
        {
          title: 'Те, кто уже переехал и подскажет как это',
          subtitle: 'Люди (с фильтром «живу, помогаю»)',
          link: '/people?filter=helpers',
        },
        {
          title: 'Посмотреть жилье по цене и району',
          subtitle: 'Объявления (жилье)',
          link: '/announcements?category=housing',
        },
        {
          title: 'Что происходит в Дананге?',
          subtitle: 'Афиша',
          link: '/events',
        },
      ],
      people: [
        { name: 'Мария', status: 'Планирует переезд', tag: 'Собирает документы' },
        { name: 'Олег', status: 'Уже переехал', tag: 'Делится опытом' },
      ],
    },
    living: {
      greeting: 'Первые шаги и комфортная жизнь — давай обустраиваться вместе',
      subtitle: '',
      steps: [
        { text: 'Жилье и базовая информация', link: '/announcements?category=housing' },
        { text: 'Куда сходить', link: '/events' },
        { text: 'Найти друзей и советы', link: '/people' },
        { text: 'Визаран и другие услуги', link: '/announcements?category=services' },
      ],
      sections: [
        {
          title: 'Те, с кем можно подружиться или спросить совет',
          subtitle: 'Люди (Новички и Проводники)',
          link: '/people',
        },
        {
          title: 'Самое актуальное на первое время и для жизни',
          subtitle: 'Объявления: услуги и жилье',
          link: '/announcements',
        },
        {
          title: 'Честные вопросы и ответы на них',
          subtitle: 'Найти опору (Справочник)',
          link: '/support',
        },
        {
          title: 'Всегда есть куда сходить',
          subtitle: 'Афиша',
          link: '/events',
        },
      ],
      people: [
        { name: 'Елена', status: 'Осваивается', tag: 'Ищет друзей' },
        { name: 'Дмитрий', status: 'Уже местный', tag: 'Организует встречи' },
      ],
    },
    helping: {
      greeting: 'Ты уже часть этого города, тебе есть чем поделиться 🌿',
      subtitle: '',
      steps: [
        { text: 'Помочь новичкам', link: '/people?filter=newcomers' },
        { text: 'Стать проводником города', link: '/become-guide' },
        { text: 'Провести свое событие', link: '/events/create' },
        { text: 'Открыть свой бизнес', link: '/support?article=business' },
        { text: 'Продвижение на сайте', link: '/promotion' },
      ],
      sections: [
        {
          title: 'Люди, которым ты можешь помочь',
          subtitle: 'Люди',
          link: '/people',
        },
        {
          title: 'Сходить на встречу или организовать свою?',
          subtitle: 'Афиша',
          link: '/events',
        },
        {
          title: 'Продать ненужное',
          subtitle: 'Объявления',
          link: '/announcements',
        },
        {
          title: 'Ответить на вопросы новичков',
          subtitle: 'Найти опору',
          link: '/support',
        },
      ],
      people: [
        { name: 'Светлана', status: 'Только приехала', tag: 'Ищет жильё' },
        { name: 'Максим', status: 'Новичок', tag: 'Нужна помощь' },
      ],
    },
    leaving: {
      greeting: 'Освободи место для нового опыта',
      subtitle: '',
      steps: [
        { text: 'Продать вещи', link: '/announcements?category=items' },
        { text: 'Пересдать квартиру', link: '/announcements?category=housing' },
        { text: 'Перенести профиль в новую страну', link: '/profile/transfer' },
        { text: 'Стать «проводником» в новом городе', link: '/become-guide' },
      ],
      sections: [
        {
          title: 'Продать то, что не влезет в чемодан',
          subtitle: 'Объявления',
          link: '/announcements',
        },
        {
          title: 'Сходить попрощаться, сделать отвальную',
          subtitle: 'Афиша',
          link: '/events',
        },
        {
          title: 'Сохранить контакты, ведь мир большой',
          subtitle: 'Люди',
          link: '/people',
        },
        {
          title: 'Поделиться своими лайф хаками',
          subtitle: 'Найти опору',
          link: '/support',
        },
      ],
      people: [
        { name: 'Артём', status: 'Тоже уезжает', tag: 'Продаёт вещи' },
        { name: 'Ксения', status: 'Новичок', tag: 'Примет эстафету' },
      ],
    },
  };

  const content = stageContent[currentStage] || stageContent['living'];

  return (
    <div className="min-h-screen bg-warm-milk">
      {/* Header with Timeline */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {stages.map((stage, i) => (
              <button
                key={stage.id}
                onClick={() => setCurrentStage(stage.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[12px] whitespace-nowrap transition-all ${
                  currentStage === stage.id
                    ? 'bg-terracotta-deep text-white'
                    : 'bg-soft-sand/30 text-foreground hover:bg-soft-sand/50'
                }`}
              >
                <span>{stage.icon}</span>
                <span className="text-sm font-medium">{stage.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Greeting */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{content.greeting}</h1>
            {content.subtitle && (
              <p className="text-lg text-muted-foreground">{content.subtitle}</p>
            )}
          </div>

          {/* Steps */}
          <div className="mb-12">
            <div className="bg-white p-6 rounded-[16px] border border-border">
              <div className="flex flex-wrap gap-3 justify-center">
                {content.steps.map((step, i) => (
                  <Link key={i} to={step.link}>
                    <button className="px-4 py-2 bg-soft-sand/30 hover:bg-terracotta-deep/10 hover:text-terracotta-deep rounded-[12px] text-sm font-medium transition-all border border-transparent hover:border-terracotta-deep">
                      {step.text}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {content.sections.map((section, sectionIndex) => (
              <section key={sectionIndex}>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
                  <Link to={section.link}>
                    <p className="text-terracotta-deep hover:text-terracotta-deep/80 cursor-pointer">
                      {section.subtitle}
                    </p>
                  </Link>
                </div>

                {/* People Section */}
                {section.subtitle.includes('Люди') && (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">👉 Здесь нормально писать первым</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {content.people.map((person, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white p-6 rounded-[16px] border border-border transition-all hover:border-dusty-indigo/30"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-dusty-indigo rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{person.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{person.status}</p>
                              <span className="inline-block px-3 py-1 bg-soft-sand/30 text-xs rounded-full">
                                {person.tag}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-4 bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]"
                            onClick={() => {
                              setSelectedPerson(person.name);
                              setShowMessageHelper(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Написать
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* Other Sections - Generic Cards */}
                {!section.subtitle.includes('Люди') && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Link key={i} to={section.link}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white p-6 rounded-[16px] border border-border transition-all hover:border-dusty-indigo/30 cursor-pointer h-full"
                        >
                          <span className="inline-block px-3 py-1 bg-warm-olive/20 text-warm-olive text-xs rounded-full mb-3">
                            {section.subtitle.split(' ')[0]}
                          </span>
                          <h3 className="font-semibold mb-2">
                            {section.subtitle.includes('Афиша') && 'Событие этой недели'}
                            {section.subtitle.includes('Объявления') && 'Актуальное предложение'}
                            {section.subtitle.includes('опору') && 'Популярный вопрос'}
                          </h3>
                          <p className="text-sm text-muted-foreground">Нажмите для просмотра</p>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Message Helper */}
      <AnimatePresence>
        {showMessageHelper && (
          <MessageHelper
            personName={selectedPerson}
            onClose={() => setShowMessageHelper(false)}
            onSend={(message) => {
              console.log('Отправлено сообщение:', message, 'для', selectedPerson);
              setShowMessageHelper(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
