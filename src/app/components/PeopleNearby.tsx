import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, MessageCircle, MapPin, Clock, Star, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { AuthModal } from './AuthWidget';

interface Person {
  id: string; // Updated to UUID string
  display_name: string;
  stage: string;
  city: string;
  bio: string;
  interests: string[];
  is_guide: boolean;
  rating?: number;
  last_seen?: string;
  avatar_url?: string;
}

import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { Link } from 'react-router';
import { translateTag } from '@/lib/tags';

export function PeopleNearby() {
  const { session } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const filters = ['Все', 'Уже здесь', 'Проводники', 'Ищут друзей'];

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    async function fetchProfiles() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', session?.user?.id || '') // Don't show current logged in user
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPeople(data);
      }
      setLoading(false);
    }
    
    fetchProfiles();
  }, [session]);

  const filteredPeople = selectedFilter === 'Все' 
    ? people 
    : selectedFilter === 'Проводники'
    ? people.filter(p => p.is_guide)
    : selectedFilter === 'Уже здесь'
    ? people.filter(p => p.stage?.includes('Осваиваюсь') || p.stage?.includes('Живу') || p.stage === 'Уже здесь')
    : selectedFilter === 'Ищут друзей'
    ? people.filter(p => p.bio?.toLowerCase().includes('друз'))
    : people;

  if (!session) {
    return (
      <div className="min-h-screen bg-warm-milk py-16 flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <div className="w-20 h-20 bg-dusty-indigo/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-dusty-indigo" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Люди рядом</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Этот раздел доступен только авторизованным пользователям. Войдите, чтобы находить единомышленников и общаться.
          </p>
          <Link to="/profile">
            <Button size="lg" className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-[12px]">
              Войти в профиль
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-milk py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dusty-indigo/10 rounded-full mb-4">
            <Users className="w-5 h-5 text-dusty-indigo" />
            <span className="text-dusty-indigo font-medium">Люди рядом</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Здесь уже есть люди, которые проходят тот же путь</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Познакомься с теми, кто сейчас в том же этапе или может помочь советом
          </p>
        </motion.div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск людей по интересам..."
              className="w-full pl-12 pr-4 py-4 bg-white shadow-sm border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 transition-all text-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-medium ${
                  selectedFilter === filter
                    ? 'bg-dusty-indigo text-white shadow-md'
                    : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border/50 shadow-sm'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* People Grid */}
       {loading ? (
    <div className="min-h-screen bg-warm-milk py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-indigo"></div></div>
  ) : !session ? (
    <div className="min-h-screen bg-warm-milk py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 py-12 bg-white/50 backdrop-blur-sm rounded-[32px] border border-white/20 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-terracotta-deep/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-terracotta-deep" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-4">Люди рядом</h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Присоединяйтесь к сообществу, чтобы видеть анкеты релокантов в вашем городе и находить новых друзей.
              </p>
              <Button 
                onClick={() => setAuthOpen(true)}
                className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-8 h-12 text-base font-medium shadow-lg"
              >
                Создать профиль
              </Button>
            </div>

            {/* Background blurred cards decorative effect */}
            <div className="absolute inset-x-0 -bottom-10 flex justify-center gap-4 opacity-20 pointer-events-none px-4">
               {[
                 { name: 'Александр', city: 'Дананг', stage: 'Уже здесь' },
                 { name: 'Елена', city: 'Нячанг', stage: 'Планирует' },
                 { name: 'Михаил', city: 'Хошимин', stage: 'Уже здесь' },
               ].map((p, i) => (
                 <div key={i} className="bg-white p-6 rounded-[24px] border border-border w-64 blur-[2px] transform rotate-2">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                 </div>
               ))}
            </div>
          </div>
          
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </div>
  ) : filteredPeople.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[16px] border border-border">
            <p className="text-muted-foreground">Пока нет пользователей, подходящих под критерии поиска.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map((person, i) => (
              <motion.div
                layout
                key={person.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className={`bg-white p-8 rounded-[32px] border transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 ${
                  person.is_guide 
                    ? 'border-warm-olive/30 bg-gradient-to-br from-white to-warm-olive/5' 
                    : 'border-border/40'
                }`}
              >
                {/* Header with Status Dot */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold shadow-sm ${
                        person.is_guide ? 'bg-warm-olive' : 'bg-dusty-indigo/20 text-dusty-indigo'
                      }`}>
                        {person.display_name?.charAt(0) || '?'}
                      </div>
                    )}
                    {/* Online Status Dot */}
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      person.last_seen && (new Date().getTime() - new Date(person.last_seen).getTime() < 5 * 60 * 1000)
                        ? 'bg-green-500' 
                        : 'bg-amber-400'
                    }`} title={person.last_seen && (new Date().getTime() - new Date(person.last_seen).getTime() < 5 * 60 * 1000) ? 'В сети' : 'Был недавно'} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{person.display_name || 'Аноним'}</h3>
                      {person.is_guide && (
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                       {person.stage === 'planning' ? 'Планирует' : 
                        person.stage === 'living' ? 'Живет здесь' : 
                        person.stage === 'helping' ? 'Помогает' : 
                        person.stage === 'leaving' ? 'Уезжает' : person.stage || 'Участник'}
                    </p>
                  </div>
                </div>

                {/* Location & Bio */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{person.city || 'Не указан'}</span>
                  </div>
                </div>

                {/* Interests */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {(person.interests || []).slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className={`px-2 py-1 text-xs rounded-full ${
                          person.is_guide
                            ? 'bg-warm-olive/20 text-warm-olive'
                            : 'bg-soft-sand/50 text-foreground'
                        }`}
                      >
                        {translateTag(interest)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Looking for / Bio Snippet */}
                {person.bio && (
                  <div className="mb-4 p-3 bg-soft-sand/30 rounded-[12px] h-20 overflow-hidden text-ellipsis relative">
                    <p className="text-sm font-medium text-muted-foreground">{person.bio}</p>
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-soft-sand/30 to-transparent"></div>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className={`w-full rounded-full h-12 font-medium shadow-sm transition-all ${
                    person.is_guide
                      ? 'bg-warm-olive hover:bg-warm-olive/90 text-white hover:ring-2 hover:ring-offset-2 hover:ring-warm-olive/50'
                      : 'bg-dusty-indigo hover:bg-dusty-indigo/90 text-white hover:ring-2 hover:ring-offset-2 hover:ring-dusty-indigo/50'
                  }`}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Написать
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-dusty-indigo to-terracotta-deep p-16 rounded-[40px] text-white text-center shadow-xl">
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">Присоединяйся к сообществу</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-medium">
            Создай профиль и находи людей, которые помогут тебе освоиться в новом городе
          </p>
          <Button 
            size="lg"
            className="bg-white text-dusty-indigo hover:bg-white/90 rounded-full h-14 px-8 text-lg font-bold shadow-lg"
          >
            Создать профиль
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 my-12">
          <div className="bg-white p-6 rounded-[16px] border border-border text-center">
            <div className="text-3xl font-bold text-terracotta-deep mb-2">24</div>
            <p className="text-muted-foreground">Активных пользователей</p>
          </div>
          <div className="bg-white p-6 rounded-[16px] border border-border text-center">
            <div className="text-3xl font-bold text-dusty-indigo mb-2">8</div>
            <p className="text-muted-foreground">Новичков на этой неделе</p>
          </div>
          <div className="bg-white p-6 rounded-[16px] border border-border text-center">
            <div className="text-3xl font-bold text-warm-olive mb-2">5</div>
            <p className="text-muted-foreground">Проводников в этом городе</p>
          </div>
        </div>
      </div>
    </div>
  );
}