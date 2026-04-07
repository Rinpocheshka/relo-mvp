import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Star, MessageCircle, Settings, Edit, Award, Heart, Save, X, Camera, Loader2, Send, Phone, Lock, Clock, Users, ChevronDown, Search } from 'lucide-react';
import { Button } from './ui/button';
import { useParams, useLocation, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../SupabaseAuthProvider';
import { AuthModal } from './AuthWidget';
import { AnnouncementDetailsModal } from './AnnouncementDetailsModal';
import { Announcement } from './Announcements';
import { EventDetailsModal } from './EventDetailsModal';
import { EventFormModal } from './EventFormModal';

interface Event {
  id: string;
  title: string;
  type: string;
  starts_at: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizer_id?: string;
  attendees: number;
  maxAttendees?: number;
  description: string;
  price: string;
  images: string[];
}

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

const SITUATION_TAGS = [
  { value: 'solo', label: '🧍 я один' },
  { value: 'partner', label: '👫 с партнером' },
  { value: 'kids', label: '👨‍👩‍👧 с детьми' },
  { value: 'pet', label: '🐾 с питомцем' },
  { value: 'lgbt', label: '🏳️‍🌈 LGBT' },
  { value: 'volunteer', label: '🤝 волонтер' },
  { value: 'remote', label: '💻 удаленщик' },
  { value: 'maternity', label: '👶 мама в декрете' },
  { value: 'it_specialist', label: '👨‍💻 IT специалист' },
  { value: 'master_classes', label: '🎨 веду мастер-классы' },
  { value: 'looking_job', label: '💼 ищу работу' },
  { value: 'looking_friends', label: '👋 ищу друзей' },
  { value: 'local_business', label: '🏗️ строю местный бизнес' },
];

const INTERESTS_TAGS = [
  { value: 'english', label: '🇬🇧 учу английский' },
  { value: 'philosopher', label: '🧠 философ' },
  { value: 'artist', label: '🎨 художник' },
  { value: 'sport', label: '💪 спорт' },
  { value: 'yoga', label: '🧘 йога' },
  { value: 'surfing', label: '🏄 серфинг' },
  { value: 'motorcycles', label: '🏍️ мотоциклы' },
  { value: 'biking', label: '🚲 велопрогулки' },
  { value: 'psychology', label: '🧩 психология' },
  { value: 'wine', label: '🍷 люблю вино' },
  { value: 'photographer', label: '📸 фотограф' },
  { value: 'health', label: '🥗 ЗОЖ' },
  { value: 'clubbing', label: '🕺 хожу в клубы' },
  { value: 'no_alcohol', label: '🚫 Non Alcohol' },
  { value: 'musician', label: '🎸 музыкант' },
  { value: 'karaoke', label: '🎤 караоке' },
  { value: 'handicrafts', label: '🧶 рукоделие' },
  { value: 'kids_activities', label: '🧸 занятия с детьми' },
  { value: 'reading', label: '📚 чтение книг' },
  { value: 'esoterics', label: '🔮 эзотерика' },
  { value: 'dancing', label: '💃 люблю танцевать' },
  { value: 'actor', label: '🎭 актер' },
  { value: 'standup', label: '🎤 стендап' },
  { value: 'vietnamese', label: '🇻🇳 учу вьетнамский' },
];

const STAGES = [
  { value: 'planning', label: 'планирую переезд', icon: '/assets/icons/custom/airplane_bw.png' },
  { value: 'just_arrived', label: 'только приехал', icon: '/assets/icons/custom/luggage.png' },
  { value: 'settling', label: 'осваиваюсь', icon: '/assets/icons/custom/path_arrow.png' },
  { value: 'sharing', label: 'делюсь опытом', icon: '/assets/icons/custom/message.png' },
  { value: 'moving_on', label: 'переезжаю дальше', icon: '/assets/icons/custom/travel.png' },
];

export function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, profile: globalProfile, loading: authLoading, refreshProfile } = useAuth();
  
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [manualCity, setManualCity] = useState('');
  const [uploading, setUploading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userAnnouncements, setUserAnnouncements] = useState<Announcement[]>([]);
  const [announcementsCount, setAnnouncementsCount] = useState<number>(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const isOwnProfile = !id || id === user?.id;
  const targetId = isOwnProfile ? session?.user?.id : id;

  useEffect(() => {
    if (authLoading) return;
    if (!targetId) {
      setLoading(false);
      return;
    }

    async function fetchProfileData() {
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
        // Pre-fill manual city if current city is not in standard list
        const standardCities = ['Вьетнам', 'Дананг, Вьетнам'];
        if (data.city && !standardCities.includes(data.city)) {
          setManualCity(data.city);
        }
        // Check if we should start in edit mode
        if (isOwnProfile && new URLSearchParams(location.search).get('edit') === 'true') {
          setIsEditing(true);
        }
        
        // Fetch User Announcements
        const { data: annData, count, error: annError } = await supabase
          .from('announcements')
          .select('*', { count: 'exact' })
          .eq('author_id', targetId)
          .order('created_at', { ascending: false });
        
        if (!annError && annData) {
          setUserAnnouncements(annData);
          setAnnouncementsCount(count || 0);
        }

        // Fetch User Events
        const { data: eventData, count: eCount, error: eventError } = await supabase
          .from('events')
          .select('*, event_participants(user_id)', { count: 'exact' })
          .eq('organizer_id', targetId)
          .order('starts_at', { ascending: false });

        if (!eventError && eventData) {
          const mapped: Event[] = (eventData ?? []).map((row: any) => {
            const startsAt = row.starts_at ? new Date(row.starts_at) : new Date();
            return {
              id: row.id,
              title: row.title || '',
              type: row.type || '',
              starts_at: row.starts_at,
              date: startsAt.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }),
              time: startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
              location: row.location_text || '',
              organizer: row.organizer_name || 'Организатор',
              organizer_id: row.organizer_id,
              attendees: (row.event_participants || []).length,
              maxAttendees: row.max_attendees,
              description: row.description || '',
              price: row.price_text || 'Бесплатно',
              images: row.images || [],
            };
          });
          setUserEvents(mapped);
          setEventsCount(eCount || 0);
        }
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

      setLoading(false);
    }
    fetchProfileData();
  }, [targetId, authLoading, isOwnProfile]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    
    const finalCity = manualCity.trim() || editForm.city || '';
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: targetId, // Use targetId to allow Admins to save edits to other profiles
        display_name: editForm.display_name?.slice(0, 20), // Enforce 20 char limit on save
        stage: editForm.stage,
        city: finalCity,
        bio: editForm.bio,
        interests: editForm.interests || [],
        avatar_url: editForm.avatar_url,
        contact_telegram: editForm.contact_telegram,
        contact_whatsapp: editForm.contact_whatsapp,
      });

    if (!error) {
      setProfile({ ...profile, ...editForm, city: finalCity } as UserData);
      setIsEditing(false);
      refreshProfile(); // Sync Header
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
          className="bg-white rounded-[24px] md:rounded-[32px] border border-border/50 p-5 md:p-10 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
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
                      <p className="text-lg text-muted-foreground mb-3 flex items-center gap-2">
                        {STAGES.find(s => s.value === profile?.stage)?.icon && (
                          <img src={STAGES.find(s => s.value === profile?.stage)?.icon} className="w-5 h-5 object-contain" alt="" />
                        )}
                        {STAGES.find(s => s.value === profile?.stage)?.label || 'Участник сообщества'}
                      </p>
                      
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
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile ? (
                        <Button 
                          className="bg-terracotta-deep text-white hover:bg-terracotta-deep/90 rounded-full shadow-md px-8 h-11 font-semibold transition-all active:scale-95 min-w-[200px]"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать профиль
                        </Button>
                      ) : (globalProfile?.role === 'admin' || user?.id === 'admin-id-fallback') ? (
                        <div className="flex gap-2">
                          <Button 
                            className="bg-terracotta-deep text-white hover:bg-terracotta-deep/90 rounded-full shadow-md px-8 h-11 font-semibold transition-all active:scale-95 min-w-[200px]"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать (Админ)
                          </Button>
                          <Button className="bg-soft-sand hover:bg-soft-sand/80 text-foreground rounded-full shadow-sm px-8 h-11 font-medium transition-all active:scale-95">
                             <MessageCircle className="w-4 h-4 mr-2" />
                             Написать
                          </Button>
                        </div>
                      ) : user ? (
                        <Button className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full shadow-sm px-6 h-11 font-medium">
                           <MessageCircle className="w-4 h-4 mr-2" />
                           Написать
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-col gap-6">
                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
                     <h2 className="text-xl md:text-2xl font-bold">Редактирование профиля</h2>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                         <Button 
                          className="flex-1 md:flex-none bg-terracotta-deep text-white hover:bg-terracotta-deep/90 rounded-full px-6 h-11 shadow-md font-semibold transition-all active:scale-95 md:min-w-[160px]" 
                          onClick={handleSave}
                        >
                          <Save className="w-4 h-4 mr-2"/>
                          Сохранить
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-full h-11 w-11 border-soft-sand/30 hover:bg-soft-sand/10 flex-shrink-0"
                          onClick={() => { setIsEditing(false); setEditForm(profile || {}); }}
                        >
                          <X className="w-5 h-5 text-muted-foreground" />
                        </Button>
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
                        <label className="text-sm font-medium text-muted-foreground ml-1">Статус (Шаг 1 онбординга)</label>
                        <select 
                          className="w-full p-3 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] mt-1 shadow-sm" 
                          value={editForm.stage || ''} 
                          onChange={e => setEditForm({...editForm, stage: e.target.value})}
                        >
                          <option value="" disabled>Выберите ваш статус</option>
                          {STAGES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Место (Шаг 2 онбординга)</label>
                        <div className="flex flex-col gap-4 mt-2">
                          <div className="relative">
                            <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <select 
                              className="w-full p-3 pl-10 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] shadow-sm appearance-none cursor-pointer" 
                              value={editForm.city || ''} 
                              onChange={e => {
                                setEditForm({...editForm, city: e.target.value});
                                setManualCity('');
                              }}
                            >
                              <option value="" disabled>Селект локации</option>
                              <option value="Вьетнам">🇻🇳 Весь Вьетнам</option>
                              <option value="Дананг, Вьетнам">🏙️ Дананг</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground z-10">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-px bg-border/40 flex-1" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">или свой вариант</span>
                            <div className="h-px bg-border/40 flex-1" />
                          </div>

                          <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              className="w-full p-3 pl-10 border border-border bg-white focus:ring-2 focus:ring-terracotta-deep/20 outline-none transition-all rounded-[14px] shadow-sm"
                              placeholder="Город \ страна"
                              maxLength={20}
                              value={manualCity}
                              onChange={(e) => {
                                setManualCity(e.target.value);
                                if (e.target.value) setEditForm({...editForm, city: ''});
                              }}
                            />
                            {manualCity && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40">
                                {manualCity.length}/20
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="mt-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Контакты для связи</label>
                      <div className="flex flex-col sm:flex-row gap-4 mt-1">
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

              {/* Interests Sections */}
              {!isEditing ? (
                <div className="flex flex-col gap-6 mt-6">
                  {/* Situation */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Кто вы?</span>
                    <div className="flex flex-wrap gap-2">
                      { (profile?.interests || []).filter(int => SITUATION_TAGS.some(t => t.value === int)).length > 0 ? (
                        (profile?.interests || []).filter(int => SITUATION_TAGS.some(t => t.value === int)).map((interest: string) => {
                          const lbl = SITUATION_TAGS.find(t => t.value === interest)?.label || interest;
                          return (
                            <span key={interest} className="px-3 py-1.5 bg-terracotta-deep/5 border border-terracotta-deep/10 text-sm font-medium text-foreground rounded-full shadow-sm">
                              {lbl}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Информация не заполнена</span>
                      )}
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ваши интересы</span>
                    <div className="flex flex-wrap gap-2">
                      { (profile?.interests || []).filter(int => INTERESTS_TAGS.some(t => t.value === int)).length > 0 ? (
                        (profile?.interests || []).filter(int => INTERESTS_TAGS.some(t => t.value === int)).map((interest: string) => {
                          const lbl = INTERESTS_TAGS.find(t => t.value === interest)?.label || interest;
                          return (
                            <span key={interest} className="px-3 py-1.5 bg-dusty-indigo/5 border border-dusty-indigo/10 text-sm font-medium text-foreground rounded-full shadow-sm">
                              {lbl}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Интересы пока не добавлены</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 space-y-8">
                  {/* Edit Situation */}
                  <div>
                    <label className="text-sm font-bold text-foreground">Кто вы?</label>
                    <p className="text-[13px] text-muted-foreground mb-3">Ваш статус и текущая ситуация</p>
                    <div className="flex flex-wrap gap-2">
                      {SITUATION_TAGS.map((tag) => {
                        const selected = (editForm.interests || []).includes(tag.value);
                        return (
                          <button
                            key={tag.value}
                            type="button"
                            onClick={() => {
                              const newInterests = selected 
                                ? (editForm.interests || []).filter((t: string) => t !== tag.value) 
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

                  {/* Edit Interests */}
                  <div>
                    <label className="text-sm font-bold text-foreground">Ваши интересы</label>
                    <p className="text-[13px] text-muted-foreground mb-3">Хобби и способы проведения досуга</p>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS_TAGS.map((tag) => {
                        const selected = (editForm.interests || []).includes(tag.value);
                        return (
                          <button
                            key={tag.value}
                            type="button"
                            onClick={() => {
                              const newInterests = selected 
                                ? (editForm.interests || []).filter((t: string) => t !== tag.value) 
                                : [...(editForm.interests || []), tag.value];
                              setEditForm({ ...editForm, interests: newInterests });
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors shadow-sm ${selected ? 'bg-dusty-indigo text-white border-dusty-indigo' : 'bg-white text-foreground border-border hover:border-dusty-indigo/50'}`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
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
            <div className="text-4xl font-extrabold text-terracotta-deep mb-1">{announcementsCount}</div>
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
            <div className="text-4xl font-extrabold text-dusty-indigo mb-1">{eventsCount}</div>
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

        {/* User Announcements Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{isOwnProfile ? 'Мои объявления' : 'Объявления'}</h2>
            {announcementsCount > 0 && (
               <span className="px-3 py-1 bg-terracotta-deep/10 text-terracotta-deep text-xs font-bold rounded-full">
                 {announcementsCount}
               </span>
            )}
          </div>
          
          {userAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userAnnouncements.map((announcement, i) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setIsDetailsModalOpen(true);
                  }}
                  className="bg-white rounded-[24px] border border-border/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col h-full active:scale-[0.98]"
                >
                  {/* Image */}
                  <div className="h-48 bg-soft-sand/10 relative overflow-hidden">
                    {announcement.images && announcement.images.length > 0 ? (
                      <img 
                        src={announcement.images[0]} 
                        alt={announcement.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <MessageCircle className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-terracotta-deep uppercase tracking-wider shadow-sm">
                      {announcement.category}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-terracotta-deep transition-colors">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{announcement.location_text}</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="text-lg font-black text-foreground">
                         {announcement.price_text}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {new Date(announcement.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-border/50 p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="w-14 h-14 bg-terracotta-deep/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-terracotta-deep/30" />
              </div>
              <p className="text-muted-foreground italic">Объявлений пока нет...</p>
              {isOwnProfile && (
                <Button 
                  className="mt-6 bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-full px-8"
                  onClick={() => navigate('/announcements')}
                >
                  Создать первое
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Announcements Details Modal */}
      {selectedAnnouncement && (
        <AnnouncementDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          announcement={selectedAnnouncement}
          onDeleted={() => {
            setUserAnnouncements(prev => prev.filter(a => a.id !== selectedAnnouncement.id));
            setAnnouncementsCount(prev => prev - 1);
            setIsDetailsModalOpen(false);
          }}
        />
      )}

      {/* User Events Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-12 bg-white rounded-[32px] border border-border/50 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-foreground">{isOwnProfile ? 'Мои события' : 'События'}</h2>
            <p className="text-sm text-muted-foreground">Мероприятия, организованные пользователем</p>
          </div>
          {eventsCount > 0 && (
            <span className="px-4 py-1.5 bg-dusty-indigo/10 text-dusty-indigo text-xs font-bold rounded-full uppercase tracking-widest border border-dusty-indigo/20">
              {eventsCount}
            </span>
          )}
        </div>

        {userEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.05 }}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsEventDetailsModalOpen(true);
                }}
                className="bg-white rounded-[24px] border border-border/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col h-full active:scale-[0.98] shadow-sm"
              >
                <div className="h-40 bg-soft-sand/10 relative overflow-hidden">
                  {event.images && event.images.length > 0 ? (
                    <img src={event.images[0]} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dusty-indigo/20 to-terracotta-deep/10" />
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-dusty-indigo uppercase tracking-wider shadow-sm">
                    {event.type}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-dusty-indigo transition-colors">{event.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-4 px-1">
                    <Clock className="w-3 h-3 text-terracotta-deep" /> {event.date}
                  </div>
                  <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {event.attendees}
                    </div>
                    <div className="text-foreground">{event.price}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-border/40 rounded-[24px] bg-soft-sand/5">
            <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground italic mb-6">Событий пока нет...</p>
            {isOwnProfile && (
              <Button 
                onClick={() => navigate('/events')}
                className="bg-dusty-indigo hover:bg-dusty-indigo/90 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-dusty-indigo/10"
              >
                Перейти в Афишу
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Event Modals */}
      {selectedEvent && (
        <EventDetailsModal
          isOpen={isEventDetailsModalOpen}
          onClose={() => setIsEventDetailsModalOpen(false)}
          event={selectedEvent}
          onJoined={() => {
            setUserEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, attendees: e.attendees + 1 } : e));
          }}
          onLeft={() => {
            setUserEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, attendees: e.attendees - 1 } : e));
          }}
          onDeleted={() => {
            setUserEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
            setEventsCount(prev => prev - 1);
          }}
          onEdited={(editedEvent) => {
            setEventToEdit(editedEvent);
            setIsEventFormModalOpen(true);
          }}
        />
      )}

      {isEventFormModalOpen && (
        <EventFormModal
          isOpen={isEventFormModalOpen}
          onClose={() => setIsEventFormModalOpen(false)}
          eventToEdit={eventToEdit}
          onSuccess={() => {
            // Refresh logic - simplest is to just re-fetch for now or update local item
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
}
