import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Star, MessageCircle, Settings, Edit, Award, Heart, Save, X } from 'lucide-react';
import { Button } from './ui/button';
import { useParams } from 'react-router';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';

interface UserData {
  id: string;
  display_name: string;
  stage: string;
  city: string;
  bio: string;
  interests: string[];
  is_guide: boolean;
  rating?: number;
  created_at: string;
}

export function Profile() {
  const { id } = useParams();
  const { session } = useAuth();
  
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});

  const isOwnProfile = !id || id === session?.user?.id;
  const targetId = isOwnProfile ? session?.user?.id : id;

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (!error && data) {
        setProfile(data);
        setEditForm(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [targetId]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    
    // Upsert profile data
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: session.user.id, 
        display_name: editForm.display_name,
        stage: editForm.stage,
        city: editForm.city,
        bio: editForm.bio,
        interests: editForm.interests || []
      });

    if (!error) {
      setProfile({ ...profile, ...editForm } as UserData);
      setIsEditing(false);
    } else {
      alert('Error updating profile: ' + error.message);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-warm-milk py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-indigo"></div></div>;
  }

  if (!profile && isOwnProfile) {
    return (
      <div className="min-h-screen bg-warm-milk py-16 flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-3xl font-bold mb-4">Добро пожаловать в Relo!</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Заполните свой профиль, чтобы начать общаться и находить полезные контакты.
          </p>
          <Button size="lg" onClick={() => setIsEditing(true)} className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-[12px]">
            Создать профиль
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="min-h-screen bg-warm-milk py-16 flex justify-center"><p>Пользователь не найден</p></div>;
  }

  const activities = [
    {
      id: 1,
      type: 'announcement',
      title: 'Добавила объявление "Ищу соседку для аренды"',
      date: '2 дня назад',
      category: 'Жильё',
    },
    {
      id: 2,
      type: 'event',
      title: 'Создала событие "Встреча дизайнеров"',
      date: '5 дней назад',
      category: 'Нетворкинг',
    },
    {
      id: 3,
      type: 'help',
      title: 'Помогла новичку с выбором банка',
      date: '1 неделю назад',
      category: 'Опора',
    },
    {
      id: 4,
      type: 'review',
      title: 'Получила отзыв от Ивана: "Очень помогла с поиском жилья!"',
      date: '2 недели назад',
      category: 'Отзыв',
    },
  ];

  return (
    <div className="min-h-screen bg-warm-milk py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[16px] border border-border p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center md:items-start">
               {/* Use the display_name from editForm or profile state depending on edit mode, if none exists fallback to '?' */}
              <div className="w-32 h-32 bg-gradient-to-br from-terracotta-deep to-dusty-indigo rounded-full mb-4 flex items-center justify-center text-white text-4xl font-bold uppercase overflow-hidden">
                 {(isEditing ? editForm.display_name : profile?.display_name)?.charAt(0) || '?'}
              </div>
              {!isEditing && profile?.is_guide && (
                <div className="flex items-center gap-2 px-3 py-1 bg-warm-olive/10 text-warm-olive rounded-full">
                  <Star className="w-4 h-4 fill-warm-olive" />
                  <span className="text-sm font-medium">Проводник</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              {!isEditing ? (
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile?.display_name || 'Аноним'}</h1>
                    <p className="text-lg text-muted-foreground mb-3">{profile?.stage}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{profile?.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>На платформе с {new Date(profile?.created_at || '').toLocaleDateString('ru-RU')}</span>
                      </div>
                      {profile?.is_guide && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{profile?.rating || '5.0'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button variant="outline" className="rounded-[12px]" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Button>
                        <Button variant="outline" className="rounded-[12px]">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Написать
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-bold">Редактирование профиля</h2>
                     <div className="flex gap-2">
                       <Button variant="outline" size="icon" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
                       <Button className="bg-dusty-indigo text-white hover:bg-dusty-indigo/90" onClick={handleSave}><Save className="w-4 h-4 mr-2"/>Сохранить</Button>
                     </div>
                   </div>
                   <input className="w-full p-3 border border-border bg-input-background focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[12px]" placeholder="Ваше имя" value={editForm.display_name || ''} onChange={e => setEditForm({...editForm, display_name: e.target.value})} />
                   <input className="w-full p-3 border border-border bg-input-background focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[12px]" placeholder="Локация (напр. Дананг)" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                   <select className="w-full p-3 border border-border bg-input-background focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[12px]" value={editForm.stage || ''} onChange={e => setEditForm({...editForm, stage: e.target.value})}>
                     <option value="" disabled>Выберите ваш статус</option>
                     <option value="Планирую переезд">Планирую переезд</option>
                     <option value="Осваиваюсь / Живу здесь">Осваиваюсь / Живу здесь</option>
                     <option value="Помогаю другим">Помогаю другим</option>
                     <option value="Уезжаю">Уезжаю</option>
                   </select>
                </div>
              )}

              {/* Bio */}
              {!isEditing ? (
                 <p className="text-foreground mb-4">{profile?.bio}</p>
              ) : (
                 <textarea className="w-full mt-4 p-3 border border-border bg-input-background focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[12px] h-24 resize-none" placeholder="Расскажите о себе (био)" value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
              )}

              {/* Interests */}
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {(profile?.interests || []).map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-soft-sand/50 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Интересы (через запятую)</p>
                  <input className="w-full p-3 border border-border bg-input-background focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[12px]" placeholder="Например: Дизайн, Йога, Спорт" 
                    value={(editForm.interests || []).join(', ')} 
                    onChange={e => setEditForm({...editForm, interests: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} 
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-[16px] border border-border text-center"
          >
            <div className="w-12 h-12 bg-terracotta-deep/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-terracotta-deep" />
            </div>
            <div className="text-3xl font-bold text-terracotta-deep mb-1">-</div>
            <p className="text-sm text-muted-foreground">Объявлений (Скоро)</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-[16px] border border-border text-center"
          >
            <div className="w-12 h-12 bg-dusty-indigo/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-dusty-indigo" />
            </div>
            <div className="text-3xl font-bold text-dusty-indigo mb-1">-</div>
            <p className="text-sm text-muted-foreground">Событий (Скоро)</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-[16px] border border-border text-center"
          >
            <div className="w-12 h-12 bg-warm-olive/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-warm-olive" />
            </div>
            <div className="text-3xl font-bold text-warm-olive mb-1">-</div>
            <p className="text-sm text-muted-foreground">Рейтинг</p>
          </motion.div>
        </div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[16px] border border-border p-8"
        >
          <h2 className="text-2xl font-semibold mb-6">История активности</h2>
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-[12px] hover:bg-soft-sand/20 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'announcement' ? 'bg-terracotta-deep/10' :
                  activity.type === 'event' ? 'bg-dusty-indigo/10' :
                  activity.type === 'help' ? 'bg-warm-olive/10' :
                  'bg-soft-sand/50'
                }`}>
                  {activity.type === 'announcement' && <MessageCircle className="w-5 h-5 text-terracotta-deep" />}
                  {activity.type === 'event' && <Calendar className="w-5 h-5 text-dusty-indigo" />}
                  {activity.type === 'help' && <Heart className="w-5 h-5 text-warm-olive" />}
                  {activity.type === 'review' && <Star className="w-5 h-5 text-yellow-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">{activity.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 bg-soft-sand/30 rounded-full text-xs">
                      {activity.category}
                    </span>
                    <span>·</span>
                    <span>{activity.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Become Guide CTA (if not a guide) */}
        {!profile?.is_guide && isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-gradient-to-br from-warm-olive to-terracotta-deep p-8 rounded-[16px] text-white"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Стать проводником города</h3>
                <p className="opacity-90">
                  Получи статус проводника и помогай новичкам адаптироваться в городе
                </p>
              </div>
              <Button 
                size="lg"
                className="bg-white text-warm-olive hover:bg-white/90 rounded-[12px] whitespace-nowrap"
              >
                Узнать больше
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
