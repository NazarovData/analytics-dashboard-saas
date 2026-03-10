export const logisticsKpi = [
  { label: 'Доставок сегодня', value: '347', delta: '+6.4%', up: true },
  { label: 'В пути', value: '82', delta: '-12', up: true },
  { label: 'Ср. время', value: '2.4 дня', delta: '-0.3', up: true },
  { label: 'Стоимость/доставка', value: '480 ₽', delta: '-3.1%', up: true },
]

export const logisticsStatuses = [
  { name: 'Доставлено', value: 218, fill: '#10B981' },
  { name: 'В пути', value: 82, fill: '#8B5CF6' },
  { name: 'Ожидание', value: 34, fill: '#F59E0B' },
  { name: 'Отменено', value: 13, fill: '#EF4444' },
]

export const logisticsByDay = [
  { day: 'Пн', delivered: 48, inTransit: 12, pending: 5 },
  { day: 'Вт', delivered: 52, inTransit: 14, pending: 4 },
  { day: 'Ср', delivered: 44, inTransit: 18, pending: 7 },
  { day: 'Чт', delivered: 56, inTransit: 10, pending: 3 },
  { day: 'Пт', delivered: 61, inTransit: 15, pending: 6 },
  { day: 'Сб', delivered: 38, inTransit: 8, pending: 4 },
  { day: 'Вс', delivered: 19, inTransit: 5, pending: 5 },
]

export const logisticsCarriers = [
  { name: 'СДЭК', deliveries: 124, avgDays: 2.1, cost: 420 },
  { name: 'Деловые Линии', deliveries: 87, avgDays: 3.2, cost: 560 },
  { name: 'ПЭК', deliveries: 68, avgDays: 2.8, cost: 380 },
  { name: 'Яндекс Доставка', deliveries: 68, avgDays: 1.4, cost: 540 },
]
