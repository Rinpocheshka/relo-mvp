import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, MessageCircle, MapPin, Clock, Star } from 'lucide-react';
import { Button } from './ui/button';

interface Person {
  id: string; // Updated to UUID string
  display_name: string;
  stage: string;
  city: string;
  bio: string;
  interests: string[];
  is_guide: boolean;
  rating?: number;
}

import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { Link } from 'react-router';

export function PeopleNearby() {
  const { session } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-dusty-indigo/20 transition-all"
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
                className={`px-4 py-2 rounded-[12px] whitespace-nowrap transition-all ${
                  selectedFilter === filter
                    ? 'bg-dusty-indigo text-white'
                    : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* People Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-indigo"></div></div>
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
                className={`bg-white p-6 rounded-[16px] border transition-all hover:shadow-md ${
                  person.is_guide 
                    ? 'border-warm-olive/50 bg-gradient-to-br from-white to-warm-olive/5' 
                    : 'border-border/80 hover:border-dusty-indigo/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold ${
                    person.is_guide ? 'bg-warm-olive ring-2 ring-warm-olive/30' : 'bg-dusty-indigo'
                  }`}>
                    {person.display_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{person.display_name || 'Аноним'}</h3>
                      {person.is_guide && (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{person.stage}</p>
                    {person.is_guide && person.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm font-medium">{person.rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}
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
                        {interest}
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
                  className={`w-full rounded-[12px] ${
                    person.is_guide
                      ? 'bg-warm-olive hover:bg-warm-olive/90 text-white'
                      : 'bg-dusty-indigo hover:bg-dusty-indigo/90 text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Написать
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-dusty-indigo to-terracotta-deep p-12 rounded-[16px] text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Присоединяйся к сообществу</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Создай профиль и находи людей, которые помогут тебе освоиться в новом городе
          </p>
          <Button 
            size="lg"
            className="bg-white text-dusty-indigo hover:bg-white/90 rounded-[12px]"
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