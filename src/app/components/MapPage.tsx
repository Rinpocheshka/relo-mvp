import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Search, Filter, Coffee, Utensils, ShoppingBag, Heart, Home, Briefcase } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';

interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  addedBy: string;
  rating: number;
  verified: boolean;
}

export function MapPage() {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const categories = [
    { name: 'Все', icon: MapPin },
    { name: 'Кафе', icon: Coffee },
    { name: 'Рестораны', icon: Utensils },
    { name: 'Магазины', icon: ShoppingBag },
    { name: 'Жильё', icon: Home },
    { name: 'Услуги', icon: Briefcase },
    { name: 'Любимые места', icon: Heart },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('places')
          .select('id,name,category,description,address,added_by_name,rating,verified')
          .order('verified', { ascending: false })
          .order('rating', { ascending: false });
        if (error) throw error;

        const mapped: Place[] = (data ?? []).map((row) => ({
          id: row.id as string,
          name: (row.name ?? '') as string,
          category: (row.category ?? '') as string,
          description: (row.description ?? '') as string,
          address: (row.address ?? '') as string,
          addedBy: ((row as any).added_by_name ?? 'Пользователь') as string,
          rating: Number(row.rating ?? 0),
          verified: Boolean(row.verified),
        }));
        setPlaces(mapped);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось загрузить данные';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'Все') return places;
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  return (
    <div className="min-h-screen bg-warm-milk py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warm-olive/10 rounded-full mb-4">
            <MapPin className="w-5 h-5 text-warm-olive" />
            <span className="text-warm-olive font-medium">Карта города</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Полезные места в Дананге</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Проверенные места от местного сообщества релокантов
          </p>
        </motion.div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск мест..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[16px] focus:outline-none focus:ring-2 focus:ring-warm-olive/20"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[12px] whitespace-nowrap transition-all ${
                    selectedCategory === category.name
                      ? 'bg-warm-olive text-white shadow-md'
                      : 'bg-white text-foreground hover:bg-soft-sand/30 border border-border'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mb-8 bg-white rounded-[16px] border border-border overflow-hidden">
          <div className="h-96 bg-gradient-to-br from-soft-sand/20 to-dusty-indigo/10 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.1) 41px), repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 40px, rgba(0,0,0,0.1) 41px)'
            }}></div>
            <div className="text-center z-10">
              <MapPin className="w-16 h-16 text-warm-olive mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Интерактивная карта</p>
              <p className="text-sm text-muted-foreground mt-2">Здесь будет карта с отметками мест</p>
            </div>
            
            {/* Mock pins */}
            {filteredPlaces.slice(0, 5).map((place, i) => (
              <div
                key={place.id}
                className="absolute bg-terracotta-deep text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 20}%`,
                }}
              >
                <MapPin className="w-5 h-5" />
              </div>
            ))}
          </div>
        </div>

        {/* Places List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Места на карте</h2>
            <Button className="bg-warm-olive hover:bg-warm-olive/90 text-white rounded-[12px]">
              Добавить место
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="col-span-full bg-white p-6 rounded-[16px] border border-border text-muted-foreground text-center">
                Загружаем места…
              </div>
            )}
            {!loading && loadError && (
              <div className="col-span-full bg-white p-6 rounded-[16px] border border-border text-red-600 text-center">
                Ошибка загрузки: {loadError}
              </div>
            )}
            {!loading && !loadError && filteredPlaces.map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[16px] border border-border hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{place.name}</h3>
                      {place.verified && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          ✓ Проверено
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-warm-olive/10 text-warm-olive rounded-full">
                      {place.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{place.rating}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {place.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{place.address}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Добавил {place.addedBy}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-warm-olive to-terracotta-deep p-12 rounded-[16px] text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Добавь своё любимое место</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Помоги другим релокантам найти лучшие кафе, рестораны и полезные места города
          </p>
          <Button 
            size="lg"
            className="bg-white text-warm-olive hover:bg-white/90 rounded-[12px]"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Добавить место на карту
          </Button>
        </div>
      </div>
    </div>
  );
}
