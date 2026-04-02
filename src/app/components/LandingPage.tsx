import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, ChevronRight } from 'lucide-react';
import { AuthModal } from './AuthWidget';

export function LandingPage() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    city: 'Дананг',
    cityConfirmed: false,
    stage: '',
    need: [] as string[],
    savePath: false,
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(0);
  };
  const handleOnboardingNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      localStorage.setItem('reloOnboarding', JSON.stringify(onboardingData));
      localStorage.setItem('reloStage', onboardingData.stage);
      
      if (onboardingData.savePath) {
        setShowOnboarding(false);
        setIsAuthOpen(true);
      } else {
        navigate('/home');
      }
    }
  };

  const skipOnboarding = () => {
    navigate('/home');
  };

  if (showOnboarding) {
    return (
      <>
        <OnboardingFlow 
          step={onboardingStep} 
          data={onboardingData} 
          setData={setOnboardingData}
          onNext={handleOnboardingNext}
          onBack={() => setOnboardingStep(Math.max(0, onboardingStep - 1))}
          onClose={skipOnboarding}
        />
        <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-warm-milk">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              В любой точке мира можно создать дом
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              А как при этом сохранить свои силы, время, деньги и нервы, - мы подскажем
            </p>
            <p className="text-lg text-foreground mb-8 max-w-2xl mx-auto font-medium">
              Relo.me - экосистема поддержки релоканта на протяжении всего пути
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={startOnboarding}
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white px-8 rounded-[12px]"
              >
                Начать свой путь
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-terracotta-deep text-terracotta-deep hover:bg-terracotta-deep/10 rounded-[12px]"
              >
                Просто посмотреть
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hook - Problems */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Жизнь релоканта часто выглядит так:</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              'Открываешь десятки чатов и не понимаешь, кому можно доверять',
              'Тратишь много времени на поиски базовых вещей',
              'Не знаешь, с чего начать и что делать дальше',
            ].map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-soft-sand/30 p-6 rounded-[16px] border border-border"
              >
                <p className="text-foreground">{problem}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4 bg-warm-milk">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Мы собрали всё в одном месте</h2>
          <p className="text-center text-lg text-muted-foreground mb-12">чтобы пройти этот путь проще</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Актуальные объявления и события', text: 'Можно выбрать по категориям, фильтрам и все - актуальное' },
              { title: 'Люди, которым можно доверять', text: 'Ты видишь путь, который уже прошел человек, а не только его ник' },
              { title: 'Все ответы в одном месте', text: 'Кто прошел путь – делится опытом, помогает другим' },
              { title: 'Понятно куда дальше', text: 'Внутри уже есть шаги на каждый этап релокации' },
            ].map((solution, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[16px] border border-border shadow-sm"
              >
                <h3 className="font-semibold mb-2 text-terracotta-deep">{solution.title}</h3>
                <p className="text-foreground">{solution.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* People */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Здесь уже есть люди, которые проходят тот же путь</h2>
          <div className="flex gap-6 justify-center flex-wrap">
            <div className="bg-soft-sand/20 p-6 rounded-[16px] border border-border max-w-xs">
              <div className="w-16 h-16 bg-dusty-indigo rounded-full mb-4"></div>
              <h4 className="font-semibold mb-2">Анна</h4>
              <p className="text-muted-foreground">2 недели в Дананге, ищет жильё</p>
            </div>
            <div className="bg-soft-sand/20 p-6 rounded-[16px] border border-border max-w-xs">
              <div className="w-16 h-16 bg-warm-olive rounded-full mb-4"></div>
              <h4 className="font-semibold mb-2">Иван</h4>
              <p className="text-muted-foreground">Уже нашёл и делится опытом</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario */}
      <section className="py-16 px-4 bg-warm-milk">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">С чего начать?</h2>
          <div className="space-y-6">
            {[
              'Выбери этап на котором находишься',
              'Определи, что важнее сейчас',
              'Сделай первый шаг',
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-terracotta-deep text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-lg">{step}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={startOnboarding}
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]"
            >
              Начать свой путь
              <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Сейчас на relo.me:</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-soft-sand/20 rounded-[16px]">
              <div className="text-4xl font-bold text-terracotta-deep mb-2">140</div>
              <p className="text-lg">человек зарегистировано</p>
            </div>
            <div className="p-8 bg-soft-sand/20 rounded-[16px]">
              <div className="text-4xl font-bold text-terracotta-deep mb-2">15</div>
              <p className="text-lg">ищут жильё</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-terracotta-deep text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Что важнее сейчас?</h2>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg"
              onClick={startOnboarding}
              className="bg-white text-black hover:bg-white/90 rounded-[12px]"
            >
              Начать свой путь
            </Button>
            <Button 
              size="lg"
              onClick={skipOnboarding}
              className="bg-white text-black hover:bg-white/90 rounded-[12px]"
            >
              Просто посмотреть
            </Button>
          </div>
        </div>
      </section>
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

function OnboardingFlow({ 
  step, 
  data, 
  setData, 
  onNext,
  onBack,
  onClose 
}: { 
  step: number;
  data: any;
  setData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(data.need || []);

  const questions = [
    {
      title: 'Похоже, ты сейчас в Дананге, верно?',
      options: [
        { label: 'Да', value: 'danang', action: () => setData({ ...data, city: 'Дананг', cityConfirmed: true }) },
        { label: 'Нет, выбрать другой город', value: 'other', action: () => setData({ ...data, cityConfirmed: false }) },
      ],
    },
    {
      title: 'Где ты сейчас?',
      options: [
        { label: 'Планирую переезд', value: 'planning', action: () => setData({ ...data, stage: 'planning' }) },
        { label: 'Уже здесь', value: 'living', action: () => setData({ ...data, stage: 'living' }) },
        { label: 'Помогаю другим', value: 'helping', action: () => setData({ ...data, stage: 'helping' }) },
        { label: 'Уезжаю', value: 'leaving', action: () => setData({ ...data, stage: 'leaving' }) },
      ],
    },
    {
      title: 'Что нужно найти сейчас?',
      options: [
        { label: 'Жильё', value: 'housing', action: () => setSelectedNeeds([...selectedNeeds, 'housing']) },
        { label: 'Работу', value: 'work', action: () => setSelectedNeeds([...selectedNeeds, 'work']) },
        { label: 'Поддержку', value: 'support', action: () => setSelectedNeeds([...selectedNeeds, 'support']) },
        { label: 'Информацию о городе', value: 'info', action: () => setSelectedNeeds([...selectedNeeds, 'info']) },
        { label: 'Комьюнити', value: 'community', action: () => setSelectedNeeds([...selectedNeeds, 'community']) },
      ],
    },
    {
      title: 'Спасибо за твою честность, здесь это ценят!',
      subtitle: 'А теперь пора…',
      options: [
        { label: 'Просто посмотреть', value: 'browse', action: () => setData({ ...data, need: selectedNeeds, savePath: false }) },
        { label: 'Создать профиль', value: 'save', action: () => setData({ ...data, need: selectedNeeds, savePath: true }) },
      ],
    },
  ];

  const currentQuestion = questions[step];

  return (
    <div className="fixed inset-0 bg-warm-milk z-50 flex items-center justify-center p-4">
      {step > 0 && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 hover:bg-black/5 rounded-[12px] flex items-center transition-colors text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-sm font-medium">Назад</span>
        </button>
      )}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-[12px] flex items-center transition-colors text-muted-foreground hover:text-foreground"
      >
        <span className="text-sm font-medium px-2">Закрыть</span>
        <X className="w-5 h-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-12">
            {step === 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Добро пожаловать 🌿</h2>
                <p className="text-lg text-muted-foreground">
                  Здесь можно пройти этот путь спокойнее и найти опору в новом месте
                </p>
              </div>
            )}
            <h3 className="text-2xl font-semibold mb-2">{currentQuestion.title}</h3>
            {currentQuestion.subtitle && (
              <p className="text-muted-foreground">{currentQuestion.subtitle}</p>
            )}
          </div>

          <div className="space-y-4">
            {step === 2 ? (
              // Множественный выбор для 4-го этапа
              <>
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedNeeds.includes(option.value);
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedNeeds(selectedNeeds.filter(n => n !== option.value));
                        } else {
                          setSelectedNeeds([...selectedNeeds, option.value]);
                        }
                      }}
                      className={`w-full p-6 bg-white rounded-[16px] border-2 transition-all text-left group ${
                        isSelected 
                          ? 'border-terracotta-deep bg-terracotta-deep/5' 
                          : 'border-border hover:border-terracotta-deep hover:bg-terracotta-deep/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-medium ${
                          isSelected ? 'text-terracotta-deep' : 'group-hover:text-terracotta-deep'
                        }`}>
                          {option.label}
                        </span>
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-terracotta-deep bg-terracotta-deep' 
                            : 'border-border'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
                <Button
                  size="lg"
                  onClick={() => {
                    setData({ ...data, need: selectedNeeds });
                    setTimeout(onNext, 300);
                  }}
                  className="w-full mt-4 bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]"
                >
                  Далее
                  <ChevronRight className="ml-2" />
                </Button>
              </>
            ) : (
              // Одиночный выбор для других этапов
              currentQuestion.options.map((option, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    option.action();
                    setTimeout(onNext, 300);
                  }}
                  className="w-full p-6 bg-white rounded-[16px] border-2 border-border hover:border-terracotta-deep hover:bg-terracotta-deep/5 transition-all text-left group"
                >
                  <span className="text-lg font-medium group-hover:text-terracotta-deep">
                    {option.label}
                  </span>
                </motion.button>
              ))
            )}
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-8 bg-terracotta-deep' : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}