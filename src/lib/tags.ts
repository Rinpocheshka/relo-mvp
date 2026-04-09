const TAG_TRANSLATIONS: Record<string, string> = {
  // Situation / Who you are
  'solo': 'я один',
  'partner': 'с партнером',
  'kids': 'с детьми',
  'pet': 'с питомцем',
  'lgbt': 'LGBT',
  'volunteer': 'волонтер',
  'remote': 'удаленщик',
  'maternity': 'мама в декрете',
  'it_specialist': 'IT специалист',
  'master_classes': 'веду мастер-классы',
  'looking_job': 'ищу работу',
  'looking_friends': 'ищу друзей',
  'local_business': 'строю местный бизнес',

  // Relocation Stages
  'planning': 'Планирует переезд',
  'just_arrived': 'Только приехал',
  'settling': 'Осваивается',
  'sharing': 'Делится опытом',
  'moving_on': 'Переезжает дальше',
  'settled': 'Уже на месте',
  'resident': 'Местный житель',

  // Interests
  'english': 'учу английский',
  'philosopher': 'философ',
  'artist': 'художник',
  'sport': 'спорт',
  'yoga': 'йога',
  'surfing': 'серфинг',
  'motorcycles': 'мотоциклы',
  'biking': 'велопрогулки',
  'psychology': 'психология',
  'wine': 'люблю вино',
  'photographer': 'фотограф',
  'health': 'ЗОЖ',
  'clubbing': 'хожу в клубы',
  'no_alcohol': 'Non Alcohol',
  'musician': 'музыкант',
  'karaoke': 'караоке',
  'handicrafts': 'рукоделие',
  'kids_activities': 'занятия с детьми',
  'reading': 'чтение книг',
  'esoterics': 'эзотерика',
  'dancing': 'люблю танцевать',
  'actor': 'актер',
  'standup': 'стендап',
  'vietnamese': 'учу вьетнамский',
};

/**
 * Translates a tag value from English to Russian.
 * If no translation is found, returns the original value.
 */
export function translateTag(tag: string): string {
  if (!tag) return '';
  return TAG_TRANSLATIONS[tag.toLowerCase()] || tag;
}
