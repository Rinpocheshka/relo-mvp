import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatRelativeRu(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: ru })
}

