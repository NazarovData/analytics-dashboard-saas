/**
 * 🌍 Мультиязычность Analitix AI
 * Поддержка: Русский, Таджикский, English
 */

export type Language = 'ru' | 'tj' | 'en'

export interface Translations {
  [key: string]: {
    ru: string
    tj: string
    en: string
  }
}

export const translations: Translations = {
  // Общее
  'app.name': {
    ru: 'Analitix AI',
    tj: 'Analitix AI',
    en: 'Analitix AI'
  },
  'app.tagline': {
    ru: 'Революция в бизнес-аналитике',
    tj: 'Инқилоб дар аналитикаи тиҷорат',
    en: 'Revolution in Business Analytics'
  },
  
  // Приветствия
  'greeting.morning': {
    ru: 'Доброе утро',
    tj: 'Субҳ ба хайр',
    en: 'Good morning'
  },
  'greeting.afternoon': {
    ru: 'Добрый день',
    tj: 'Рӯз ба хайр',
    en: 'Good afternoon'
  },
  'greeting.evening': {
    ru: 'Добрый вечер',
    tj: 'Бегоҳ ба хайр',
    en: 'Good evening'
  },
  
  // Навигация
  'nav.dashboard': {
    ru: 'Дашборд',
    tj: 'Дашборд',
    en: 'Dashboard'
  },
  'nav.analytics': {
    ru: 'Аналитика',
    tj: 'Аналитика',
    en: 'Analytics'
  },
  'nav.integrations': {
    ru: 'Интеграции',
    tj: 'Интегратсияҳо',
    en: 'Integrations'
  },
  'nav.settings': {
    ru: 'Настройки',
    tj: 'Танзимот',
    en: 'Settings'
  },
  
  // Дашборд
  'dashboard.title': {
    ru: 'Главный дашборд',
    tj: 'Дашборди асосӣ',
    en: 'Main Dashboard'
  },
  'dashboard.revenue': {
    ru: 'Выручка',
    tj: 'Даромад',
    en: 'Revenue'
  },
  'dashboard.orders': {
    ru: 'Заказы',
    tj: 'Фармонҳо',
    en: 'Orders'
  },
  'dashboard.clients': {
    ru: 'Клиенты',
    tj: 'Мизоҷон',
    en: 'Clients'
  },
  'dashboard.average_check': {
    ru: 'Средний чек',
    tj: 'Чеки миёна',
    en: 'Average Check'
  },
  
  // Алерты
  'alerts.title': {
    ru: 'Уведомления',
    tj: 'Огоҳиномаҳо',
    en: 'Notifications'
  },
  'alerts.unread': {
    ru: 'Непрочитанных',
    tj: 'Хонда нашуда',
    en: 'Unread'
  },
  'alerts.critical': {
    ru: 'Критических',
    tj: 'Ҳушёранда',
    en: 'Critical'
  },
  'alerts.revenue_drop': {
    ru: 'Выручка упала',
    tj: 'Даромад кам шуд',
    en: 'Revenue dropped'
  },
  'alerts.inactive_client': {
    ru: 'Неактивный клиент',
    tj: 'Мизоҷи ғайрифаъол',
    en: 'Inactive client'
  },
  'alerts.mark_read': {
    ru: 'Прочитано',
    tj: 'Хонда шуд',
    en: 'Mark as read'
  },
  'alerts.resolve': {
    ru: 'Решено',
    tj: 'Ҳал шуд',
    en: 'Resolve'
  },
  'alerts.dismiss': {
    ru: 'Отклонить',
    tj: 'Рад кардан',
    en: 'Dismiss'
  },
  
  // Сравнение периодов
  'comparison.title': {
    ru: 'Сравнение периодов',
    tj: 'Муқоисаи давраҳо',
    en: 'Period Comparison'
  },
  'comparison.current': {
    ru: 'Текущий период',
    tj: 'Давраи ҷорӣ',
    en: 'Current Period'
  },
  'comparison.previous': {
    ru: 'Предыдущий период',
    tj: 'Давраи қаблӣ',
    en: 'Previous Period'
  },
  'comparison.change': {
    ru: 'Изменение',
    tj: 'Тағйир',
    en: 'Change'
  },
  'comparison.positive': {
    ru: 'Рост',
    tj: 'Афзоиш',
    en: 'Growth'
  },
  'comparison.negative': {
    ru: 'Снижение',
    tj: 'Камшавӣ',
    en: 'Decline'
  },
  'comparison.vs_previous_month': {
    ru: 'Январь 2026: +12% к декабрю',
    tj: 'Январ 2026: +12% нисбат ба декабр',
    en: 'January 2026: +12% vs December'
  },
  
  // White Label
  'whitelabel.title': {
    ru: 'Брендинг',
    tj: 'Брендинг',
    en: 'Branding'
  },
  'whitelabel.company_name': {
    ru: 'Название компании',
    tj: 'Номи ширкат',
    en: 'Company Name'
  },
  'whitelabel.logo': {
    ru: 'Логотип',
    tj: 'Логотип',
    en: 'Logo'
  },
  'whitelabel.colors': {
    ru: 'Цвета',
    tj: 'Рангҳо',
    en: 'Colors'
  },
  'whitelabel.custom_domain': {
    ru: 'Кастомный домен',
    tj: 'Домени фармоишӣ',
    en: 'Custom Domain'
  },
  'whitelabel.upload_logo': {
    ru: 'Загрузить логотип',
    tj: 'Бор кардани логотип',
    en: 'Upload Logo'
  },
  
  // Кнопки
  'button.save': {
    ru: 'Сохранить',
    tj: 'Нигоҳ доштан',
    en: 'Save'
  },
  'button.cancel': {
    ru: 'Отмена',
    tj: 'Бекор кардан',
    en: 'Cancel'
  },
  'button.upload': {
    ru: 'Загрузить',
    tj: 'Бор кардан',
    en: 'Upload'
  },
  'button.delete': {
    ru: 'Удалить',
    tj: 'Нест кардан',
    en: 'Delete'
  },
  
  // Ошибки
  'error.loading': {
    ru: 'Ошибка загрузки',
    tj: 'Хатогии боркунӣ',
    en: 'Loading Error'
  },
  'error.network': {
    ru: 'Ошибка сети',
    tj: 'Хатогии шабака',
    en: 'Network Error'
  },
  
  // Сообщения
  'message.success': {
    ru: 'Успешно',
    tj: 'Муваффақона',
    en: 'Success'
  },
  'message.error': {
    ru: 'Ошибка',
    tj: 'Хатогӣ',
    en: 'Error'
  },
}

// Функция для получения перевода
export function t(key: string, lang: Language = 'ru'): string {
  const translation = translations[key]
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`)
    return key
  }
  return translation[lang] || translation['ru'] || key
}

// Хук для использования переводов
export function useTranslation(lang: Language = 'ru') {
  return (key: string) => t(key, lang)
}


