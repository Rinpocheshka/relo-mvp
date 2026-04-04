import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Star, MessageCircle, Settings, Edit, Award, Heart, Save, X, Camera, Loader2, Send, Phone, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { useParams } from 'react-router';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';

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
  avatar_url?: string;
  contact_telegram?: string;
  contact_whatsapp?: string;
  role?: string;
}

const PROFILE_TAGS = [
  { value: 'solo', label: '🧍 Я один' },
  { value: 'partner', label: '👫 С партнёром' },
  { value: 'kids', label: '👨‍👩‍👧 С детьми' },
  { value: 'pet', label: '🐾 С питомцем' },
  { value: 'remote', label: '💻 Удалёнщик' },
  { value: 'job', label: '💼 Ищу работу' },
  { value: 'housing', label: '🏠 Ищу жильё' },
];

export function Profile() {
  const { id } = useParams();
  const { session, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [uploading, setUploading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isOwnProfile = !id || id === session?.user?.id;
  const targetId = isOwnProfile ? session?.user?.id : id;

  useEffect(() => {
    if (authLoading) return;
    if (!targetId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      setLoading(true);
      
      // Fetch target profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (!error && data) {
        setProfile(data);
        setEditForm(data);
      } else if (isOwnProfile) {
        let initialData: Partial<UserData> = {};
        const stored = localStorage.getItem('reloOnboarding');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            initialData = {
              city: parsed.city,
              stage: parsed.stage,
              interests: parsed.need || [],
            };
          } catch (e) {}
        }
        setProfile(initialData as UserData);
        setEditForm(initialData);
        setIsEditing(true);
      }

      // If logged in, fetch current user's profile to check for Admin role
      if (session?.user?.id) {
        const { data: currentData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (currentData) setCurrentUserProfile(currentData);
      }

      setLoading(false);
    }
    fetchProfile();
  }, [targetId, authLoading]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: targetId, // Use targetId to allow Admins to save edits to other profiles
        display_name: editForm.display_name?.slice(0, 20), // Enforce 20 char limit on save
        stage: editForm.stage,
        city: editForm.city,
        bio: editForm.bio,
        interests: editForm.interests || [],
        avatar_url: editForm.avatar_url,
        contact_telegram: editForm.contact_telegram,
        contact_whatsapp: editForm.contact_whatsapp,
      });

    if (!error) {
      setProfile({ ...profile, ...editForm } as UserData);
      setIsEditing(false);
    } else {
      alert('Error updating profile: ' + error.message);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Вы не выбрали изображение');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session?.user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setEditForm({ ...editForm, avatar_url: publicUrl });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="min-h-screen bg-warm-milk py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dusty-indigo"></div></div>;
  }


  if (!session) {
    return (
      <div className="min-h-screen bg-warm-milk py-16 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-terracotta-deep/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-terracotta-deep" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Профиль защищен</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Зарегистрируйтесь или войдите, чтобы знакомиться с другими участниками сообщества.
        </p>
        <Button 
          onClick={() => setAuthModalOpen(true)}
          className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-8 h-12 text-base font-medium shadow-lg"
        >
          Зарегистрироваться
        </Button>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
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
          className="bg-white rounded-[32px] border border-border/50 p-8 md:p-10 mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center md:items-start group relative">
              <div className="w-32 h-32 bg-gradient-to-br from-terracotta-deep to-dusty-indigo rounded-full mb-4 flex items-center justify-center text-white text-4xl font-bold uppercase overflow-hidden relative shadow-md">
                {(isEditing ? editForm.avatar_url : profile?.avatar_url) ? (
                  <img src={(isEditing ? editForm.avatar_url : profile?.avatar_url) || ''} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(isEditing ? editForm.display_name : profile?.display_name)?.charAt(0) || '?'}</span>
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                    <span className="text-[10px] font-medium mt-1">Изменить</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={uploadAvatar} />
                  </label>
                )}
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
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{profile?.display_name || 'Аноним'}</h1>
                      <p className="text-lg text-muted-foreground mb-3">{profile?.stage === 'living' ? 'Уже здесь' : 'Планирую переезд'}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{profile?.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>На платформе с {new Date(profile?.created_at || session?.user?.created_at || Date.now()).toLocaleDateString('ru-RU')}</span>
                        </div>
                        {profile?.is_guide && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{profile?.rating || '5.0'}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
                        {profile?.contact_telegram && (
                          <a href={`https://t.me/${profile.contact_telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-dusty-indigo hover:text-dusty-indigo/80 font-medium bg-dusty-indigo/10 px-3 py-1.5 rounded-full transition-colors">
                            <Send className="w-4 h-4" /> Telegram
                          </a>
                        )}
                        {profile?.contact_whatsapp && (
                          <a href={`https://wa.me/${profile.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                            <Phone className="w-4 h-4" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {(isOwnProfile || currentUserProfile?.role === 'admin') ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full hover:bg-black/5"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      ) : (
                        <Button className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full shadow-sm px-6">
                           <MessageCircle className="w-4 h-4 mr-2" />
                           Написать
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-col gap-4">
                   <div className="flex justify-between items-center mb-2">
                     <h2 className="text-2xl font-bold">Редактирование профиля</h2>
                     <div className="flex gap-2">
                       <Button variant="outline" size="icon" onClick={() => { setIsEditing(false); setEditForm(profile || {}); }}><X className="w-4 h-4" /></Button>
                       <Button className="bg-terracotta-deep text-white hover:bg-terracotta-deep/90 rounded-full px-5 shadow-sm font-medium" onClick={handleSave}><Save className="w-4 h-4 mr-2"/>Сохранить</Button>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground ml-1">Имя (макс. 20 симв.)</label>
                       <input 
                         className="w-full p-3 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] mt-1 shadow-sm" 
                         placeholder="Имя" 
                         maxLength={20}
                         value={editForm.display_name || ''} 
                         onChange={e => setEditForm({...editForm, display_name: e.target.value.slice(0, 20)})} 
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground ml-1">Роль в сообществе</label>
                       <select className="w-full p-3 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] mt-1 shadow-sm" value={editForm.stage || ''} onChange={e => setEditForm({...editForm, stage: e.target.value})}>
                         <option value="" disabled>Выберите ваш статус</option>
                         <option value="planning">Планирую переезд</option>
                         <option value="living">Уже здесь</option>
                       </select>
                     </div>
                     <div className="md:col-span-2">
                       <label className="text-sm font-medium text-muted-foreground ml-1">Город</label>
                       <div className="relative mt-1">
                         <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                         <select className="w-full p-3 pl-10 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] shadow-sm appearance-none cursor-pointer" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})}>
                           <option value="" disabled>Селект локации</option>
                           <option value="В дороге" className="font-bold">📍 В дороге</option>
                           <optgroup label="Вьетнам">
                             <option value="Вьетнам">Вьетнам (вся страна)</option>
                             <option value="Дананг, Вьетнам">Дананг</option>
                             <option value="Нячанг, Вьетнам">Нячанг</option>
                             <option value="Муйне, Вьетнам">Муйне</option>
                             <option value="Хошимин, Вьетнам">Хошимин</option>
                             <option value="Ханой, Вьетнам">Ханой</option>
                           </optgroup>
                           <optgroup label="Таиланд">
                             <option value="Таиланд">Таиланд (вся страна)</option>
                             <option value="Паттайя, Таиланд">Паттайя</option>
                           </optgroup>
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground z-10">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6"/></svg>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   <div className="mt-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Контакты для связи</label>
                      <div className="flex gap-4 mt-1">
                        <div className="flex-1 relative">
                           <Send className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dusty-indigo/60" />
                           <input className="w-full p-3 pl-10 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] shadow-sm" placeholder="Telegram @username" value={editForm.contact_telegram || ''} onChange={e => setEditForm({...editForm, contact_telegram: e.target.value})} />
                        </div>
                        <div className="flex-1 relative">
                           <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-green-600/60" />
                           <input className="w-full p-3 pl-10 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] shadow-sm" placeholder="WhatsApp" value={editForm.contact_whatsapp || ''} onChange={e => setEditForm({...editForm, contact_whatsapp: e.target.value})} />
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Bio */}
              {!isEditing ? (
                 <p className="text-foreground my-6 leading-relaxed bg-soft-sand/10 p-5 rounded-[20px]">{profile?.bio || <span className="text-muted-foreground italic">Расскажите немного о себе...</span>}</p>
              ) : (
                 <div className="mt-4">
                   <label className="text-sm font-medium text-muted-foreground ml-1">О себе</label>
                   <textarea className="w-full mt-1 p-4 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] h-28 resize-none shadow-sm" placeholder="Расскажите о себе, чем занимаетесь и чем можете быть полезны" value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
                 </div>
              )}

              {/* Interests */}
              {!isEditing ? (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Интересы и потребности</span>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.interests || []).length > 0 ? (
                      (profile?.interests || []).map((interest) => {
                        const lbl = PROFILE_TAGS.find(t => t.value === interest)?.label || interest;
                        return (
                          <span
                            key={interest}
                            className="px-3 py-1.5 bg-white border border-border/80 text-sm font-medium text-foreground rounded-full shadow-sm"
                          >
                            {lbl}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">Не указаны</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground ml-1">Теги и интересы</label>
                  <p className="text-[13px] text-muted-foreground mb-3 ml-1">Помогают другим находить вас по общим интересам</p>
                  <div className="flex flex-wrap gap-2">
                    {PROFILE_TAGS.map((tag) => {
                      const selected = (editForm.interests || []).includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => {
                            const newInterests = selected 
                              ? (editForm.interests || []).filter(t => t !== tag.value) 
                              : [...(editForm.interests || []), tag.value];
                            setEditForm({ ...editForm, interests: newInterests });
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors shadow-sm ${selected ? 'bg-terracotta-deep text-white border-terracotta-deep' : 'bg-white text-foreground border-border hover:border-terracotta-deep/50'}`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
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
            className="bg-white p-8 rounded-[24px] border border-border/50 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          >
            <div className="w-14 h-14 bg-terracotta-deep/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-terracotta-deep" />
            </div>
            <div className="text-4xl font-extrabold text-terracotta-deep mb-1">-</div>
            <p className="text-sm font-medium text-muted-foreground">Объявлений</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[24px] border border-border/50 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          >
            <div className="w-14 h-14 bg-dusty-indigo/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-dusty-indigo" />
            </div>
            <div className="text-4xl font-extrabold text-dusty-indigo mb-1">-</div>
            <p className="text-sm font-medium text-muted-foreground">Событий</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[24px] border border-border/50 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          >
            <div className="w-14 h-14 bg-warm-olive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-warm-olive" />
            </div>
            <div className="text-4xl font-extrabold text-warm-olive mb-1">-</div>
            <p className="text-sm font-medium text-muted-foreground">Рейтинг</p>
          </motion.div>
        </div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[32px] border border-border/50 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        >
          <h2 className="text-2xl font-bold mb-6">История активности</h2>
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{activity.category}</span>
                    <span>•</span>
                    <span>{activity.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
