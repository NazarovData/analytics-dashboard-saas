// ============================================
// 🏭 КОНФИГУРАЦИЯ 10 ОТРАСЛЕЙ
// Обязательные поля, aliases для авто-маппинга
// Русский + Таджикский + Узбекский + English
// ============================================

export type IndustryKey =
  | 'ecommerce'
  | 'avito'
  | 'warehouse'
  | 'logistics'
  | 'cafe'
  | 'beauty'
  | 'retail'
  | 'marketing'
  | 'crm'
  | 'finance'

export interface FieldConfig {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'enum'
  required: boolean
  aliases: string[]
  enumValues?: string[]
}

export interface IndustryConfig {
  key: IndustryKey
  name: string
  icon: string
  description: string
  color: string
  fields: FieldConfig[]
  metrics: string[]
}

// ─── Общие aliases для дат (все отрасли) ──────

const DATE_ALIASES = [
  'дата', 'дата продажи', 'дата чека', 'период', 'дата документа',
  'дата операции', 'дата и время', 'дата заказа', 'дата создания',
  'sana', 'vaqt', 'kun',
  'санаи', 'рӯз',
  'date', 'datetime', 'created_at', 'order_date',
]

const PRODUCT_ALIASES = [
  'товар', 'наименование', 'наименование товара', 'номенклатура',
  'продукт', 'позиция', 'название', 'артикул', 'название товара',
  'mahsulot', 'tovar', 'nomi', 'mahsulot nomi',
  'мол', 'номгӯй', 'номи мол',
  'product', 'product_name', 'name', 'item', 'goods', 'sku',
]

const QUANTITY_ALIASES = [
  'количество', 'кол-во', 'кол.', 'штук', 'шт', 'шт.',
  'miqdor', 'dona', 'soni',
  'миқдор', 'адад',
  'qty', 'quantity', 'count', 'units',
]

const PRICE_ALIASES = [
  'цена', 'цена продажи', 'цена за ед', 'розничная цена', 'цена за единицу',
  'narx', 'bahosi', 'birlik narxi',
  'нарх', 'баҳо',
  'price', 'unit_price', 'cost',
]

const TOTAL_ALIASES = [
  'сумма', 'итого', 'сумма продажи', 'выручка', 'сумма с ндс',
  'сумма без ндс', 'итоговая сумма', 'стоимость', 'оплата',
  'summa', 'jami', 'tushum', 'umumiy summa',
  'маблағ', 'ҷамъ', 'нархи умумӣ',
  'amount', 'total', 'sum', 'revenue', 'payment',
]

const CLIENT_ALIASES = [
  'клиент', 'покупатель', 'заказчик', 'имя клиента', 'контрагент',
  'mijoz', 'xaridor', 'mijoz nomi',
  'муштарӣ', 'харидор',
  'client', 'customer', 'client_name', 'customer_name', 'buyer',
]

const CLIENT_ID_ALIASES = [
  'id клиента', 'номер клиента', 'код клиента',
  'mijoz id', 'mijoz raqami',
  'рақами муштарӣ',
  'client_id', 'customer_id', 'user_id',
]

const PAYMENT_TYPE_ALIASES = [
  'оплата', 'вид оплаты', 'способ оплаты', 'тип оплаты',
  'tolov turi', 'tolov usuli',
  'навъи пардохт', 'усули пардохт',
  'payment', 'payment_type', 'pay_method', 'payment_method',
]

const CATEGORY_ALIASES = [
  'категория', 'группа', 'раздел', 'тип',
  'kategoriya', 'turkum', 'guruh',
  'гурӯҳ', 'категорияи',
  'category', 'group', 'type', 'section',
]

const STATUS_ALIASES = [
  'статус', 'состояние',
  'holat', 'status',
  'ҳолат', 'вазъият',
  'status', 'state',
]

// ─── 10 ОТРАСЛЕЙ ──────────────────────────────

export const INDUSTRIES: Record<IndustryKey, IndustryConfig> = {

  // ─── 1. Интернет-магазин ────────────────────
  ecommerce: {
    key: 'ecommerce',
    name: 'Интернет-магазин',
    icon: '🛒',
    description: 'E-commerce, маркетплейсы',
    color: 'blue',
    metrics: ['RFM-сегментация', 'LTV клиентов', 'Когортный анализ'],
    fields: [
      { key: 'order_id', label: 'Номер заказа', type: 'string', required: true, aliases: [
        'номер заказа', 'заказ', '№ заказа', 'id заказа', '№',
        'buyurtma raqami', 'buyurtma id',
        'рақами фармоиш',
        'order_id', 'order', 'invoice',
      ]},
      { key: 'client_id', label: 'ID клиента', type: 'string', required: true, aliases: CLIENT_ID_ALIASES },
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'product_name', label: 'Товар', type: 'string', required: true, aliases: PRODUCT_ALIASES },
      { key: 'quantity', label: 'Количество', type: 'number', required: true, aliases: QUANTITY_ALIASES },
      { key: 'price', label: 'Цена', type: 'number', required: true, aliases: PRICE_ALIASES },
      { key: 'total', label: 'Сумма', type: 'number', required: true, aliases: TOTAL_ALIASES },
      { key: 'status', label: 'Статус', type: 'string', required: false, aliases: STATUS_ALIASES },
      { key: 'source', label: 'Источник', type: 'string', required: false, aliases: [
        'источник', 'канал', 'utm_source', 'откуда', 'рекламный канал',
        'manba', 'kanal',
        'сарчашма', 'канал',
        'source', 'channel', 'utm',
      ]},
    ],
  },

  // ─── 2. Авито ───────────────────────────────
  avito: {
    key: 'avito',
    name: 'Авито',
    icon: '📢',
    description: 'Доски объявлений',
    color: 'orange',
    metrics: ['Просмотры/звонки', 'Конверсия', 'ТОП объявлений'],
    fields: [
      { key: 'listing_id', label: 'ID объявления', type: 'string', required: true, aliases: [
        'id объявления', '№ объявления', 'номер объявления',
        'elon id', 'elon raqami',
        'listing_id', 'ad_id', 'id',
      ]},
      { key: 'title', label: 'Название', type: 'string', required: true, aliases: [
        'название', 'заголовок', 'наименование', 'объявление',
        'sarlavha', 'nomi', 'elon nomi',
        'title', 'name', 'heading',
      ]},
      { key: 'category', label: 'Категория', type: 'string', required: false, aliases: CATEGORY_ALIASES },
      { key: 'views', label: 'Просмотры', type: 'number', required: true, aliases: [
        'просмотры', 'показы', 'кол-во просмотров',
        'korishlar', 'korishlar soni',
        'views', 'impressions', 'shows',
      ]},
      { key: 'calls', label: 'Звонки', type: 'number', required: false, aliases: [
        'звонки', 'кол-во звонков',
        'qongiroqlar',
        'calls', 'phone_calls',
      ]},
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'price', label: 'Цена', type: 'number', required: true, aliases: PRICE_ALIASES },
      { key: 'status', label: 'Статус', type: 'string', required: false, aliases: STATUS_ALIASES },
    ],
  },

  // ─── 3. Склад ──────────────────────────────
  warehouse: {
    key: 'warehouse',
    name: 'Склад',
    icon: '📦',
    description: 'Складской учёт',
    color: 'teal',
    metrics: ['ABC-анализ', 'Неликвиды', 'Оборачиваемость'],
    fields: [
      { key: 'product_name', label: 'Товар', type: 'string', required: true, aliases: PRODUCT_ALIASES },
      { key: 'sku', label: 'Артикул', type: 'string', required: false, aliases: [
        'артикул', 'код товара', 'код', 'штрихкод',
        'artikul', 'tovar kodi', 'shtrix kod',
        'артикул', 'рамзи мол',
        'sku', 'barcode', 'item_code',
      ]},
      { key: 'quantity_in', label: 'Приход', type: 'number', required: true, aliases: [
        'приход', 'поступление', 'кол-во приход', 'приход шт',
        'kirim', 'kirim miqdori',
        'воридот', 'даромад',
        'quantity_in', 'income', 'received',
      ]},
      { key: 'quantity_out', label: 'Расход', type: 'number', required: true, aliases: [
        'расход', 'отгрузка', 'продажа', 'кол-во расход',
        'chiqim', 'chiqim miqdori', 'sotilgan',
        'харҷ', 'фурӯш',
        'quantity_out', 'outcome', 'sold', 'shipped',
      ]},
      { key: 'stock', label: 'Остаток', type: 'number', required: false, aliases: [
        'остаток', 'на складе', 'текущий остаток', 'наличие',
        'qoldiq', 'omborda', 'mavjud',
        'боқимонда', 'мавҷуд',
        'stock', 'balance', 'on_hand', 'inventory',
      ]},
      { key: 'price', label: 'Цена', type: 'number', required: true, aliases: PRICE_ALIASES },
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'category', label: 'Категория', type: 'string', required: false, aliases: CATEGORY_ALIASES },
    ],
  },

  // ─── 4. Логистика ──────────────────────────
  logistics: {
    key: 'logistics',
    name: 'Логистика',
    icon: '🚛',
    description: 'Доставки, маршруты',
    color: 'red',
    metrics: ['Статусы доставок', 'Время в пути', 'Стоимость'],
    fields: [
      { key: 'delivery_id', label: 'ID доставки', type: 'string', required: true, aliases: [
        'номер доставки', 'id доставки', '№ доставки', 'трек-номер',
        'yetkazma id', 'yetkazma raqami',
        'delivery_id', 'tracking', 'shipment_id',
      ]},
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'status', label: 'Статус', type: 'string', required: true, aliases: [
        ...STATUS_ALIASES,
        'статус доставки', 'состояние доставки',
        'yetkazma holati',
        'delivery_status',
      ]},
      { key: 'origin', label: 'Откуда', type: 'string', required: false, aliases: [
        'откуда', 'отправление', 'город отправления', 'склад',
        'qayerdan', 'jo\'natish joyi',
        'origin', 'from', 'source_city',
      ]},
      { key: 'destination', label: 'Куда', type: 'string', required: false, aliases: [
        'куда', 'назначение', 'город назначения', 'адрес',
        'qayerga', 'yetkazish joyi', 'manzil',
        'destination', 'to', 'dest_city',
      ]},
      { key: 'transit_days', label: 'Дни в пути', type: 'number', required: false, aliases: [
        'дней в пути', 'срок доставки', 'время доставки', 'дни',
        'yetkazish muddati', 'kunlar',
        'transit_days', 'delivery_days', 'days',
      ]},
      { key: 'cost', label: 'Стоимость', type: 'number', required: true, aliases: [
        'стоимость', 'стоимость доставки', 'цена доставки',
        'yetkazish narxi', 'xarajat',
        'cost', 'delivery_cost', 'shipping_cost', 'price',
      ]},
      { key: 'carrier', label: 'Перевозчик', type: 'string', required: false, aliases: [
        'перевозчик', 'транспортная компания', 'курьер', 'водитель',
        'tashuvchi', 'kuryer', 'haydovchi',
        'carrier', 'courier', 'driver',
      ]},
    ],
  },

  // ─── 5. Кафе / Ресторан ────────────────────
  cafe: {
    key: 'cafe',
    name: 'Кафе / Ресторан',
    icon: '☕',
    description: 'HoReCa',
    color: 'amber',
    metrics: ['Фудкост', 'ТОП блюд', 'Часы пик'],
    fields: [
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'shift', label: 'Смена', type: 'string', required: false, aliases: [
        'смена', 'номер смены',
        'smena', 'ish vaqti',
        'shift', 'shift_number',
      ]},
      { key: 'dish_name', label: 'Блюдо', type: 'string', required: true, aliases: [
        'блюдо', 'название блюда', 'наименование', 'позиция', 'товар', 'меню',
        'taom', 'taom nomi', 'ovqat',
        'хӯрок', 'номи хӯрок',
        'dish', 'dish_name', 'item', 'menu_item', 'product',
      ]},
      { key: 'quantity', label: 'Количество', type: 'number', required: true, aliases: QUANTITY_ALIASES },
      { key: 'price', label: 'Цена', type: 'number', required: true, aliases: PRICE_ALIASES },
      { key: 'total', label: 'Сумма', type: 'number', required: true, aliases: TOTAL_ALIASES },
      { key: 'food_cost', label: 'Себестоимость', type: 'number', required: false, aliases: [
        'себестоимость', 'фудкост', 'закупочная цена', 'затраты',
        'tannarx', 'xarajat', 'sotib olish narxi',
        'арзиши аслӣ', 'нархи харид',
        'food_cost', 'cost', 'cogs',
      ]},
      { key: 'waiter_name', label: 'Официант', type: 'string', required: false, aliases: [
        'официант', 'сотрудник', 'кассир', 'продавец',
        'ofitsiant', 'xodim', 'kassir',
        'пешхизмат', 'кормандон',
        'waiter', 'waiter_name', 'staff', 'employee',
      ]},
    ],
  },

  // ─── 6. Салон красоты ──────────────────────
  beauty: {
    key: 'beauty',
    name: 'Салон красоты',
    icon: '✂️',
    description: 'Бьюти-индустрия',
    color: 'pink',
    metrics: ['Рейтинг мастеров', 'Загрузка', 'Возвращаемость'],
    fields: [
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'master_name', label: 'Мастер', type: 'string', required: true, aliases: [
        'мастер', 'специалист', 'сотрудник', 'имя мастера',
        'usta', 'mutaxassis', 'xodim',
        'устод', 'мутахассис',
        'master', 'master_name', 'specialist', 'staff',
      ]},
      { key: 'service_name', label: 'Услуга', type: 'string', required: true, aliases: [
        'услуга', 'название услуги', 'процедура', 'вид услуги',
        'xizmat', 'xizmat nomi', 'protsedura',
        'хизмат', 'номи хизмат',
        'service', 'service_name', 'procedure', 'treatment',
      ]},
      { key: 'client_id', label: 'ID клиента', type: 'string', required: false, aliases: CLIENT_ID_ALIASES },
      { key: 'duration', label: 'Длительность (мин)', type: 'number', required: false, aliases: [
        'длительность', 'время', 'продолжительность', 'минуты',
        'davomiylik', 'vaqt', 'daqiqa',
        'давомнокӣ', 'вақт',
        'duration', 'minutes', 'time',
      ]},
      { key: 'total', label: 'Сумма', type: 'number', required: true, aliases: TOTAL_ALIASES },
      { key: 'payment_type', label: 'Тип оплаты', type: 'string', required: false, aliases: PAYMENT_TYPE_ALIASES },
    ],
  },

  // ─── 7. Розница ────────────────────────────
  retail: {
    key: 'retail',
    name: 'Розница',
    icon: '🏪',
    description: 'Офлайн магазины',
    color: 'orange',
    metrics: ['Кассовые данные', 'Средний чек', 'Конверсия'],
    fields: [
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'shift', label: 'Смена', type: 'string', required: false, aliases: [
        'смена', 'номер смены',
        'smena',
        'shift',
      ]},
      { key: 'cashier_name', label: 'Кассир', type: 'string', required: false, aliases: [
        'кассир', 'продавец', 'сотрудник', 'оператор', 'менеджер',
        'kassir', 'sotuvchi', 'xodim',
        'кассир', 'фурӯшанда',
        'cashier', 'cashier_name', 'operator', 'seller',
      ]},
      { key: 'product_name', label: 'Товар', type: 'string', required: true, aliases: PRODUCT_ALIASES },
      { key: 'quantity', label: 'Количество', type: 'number', required: true, aliases: QUANTITY_ALIASES },
      { key: 'price', label: 'Цена', type: 'number', required: true, aliases: PRICE_ALIASES },
      { key: 'total', label: 'Сумма', type: 'number', required: true, aliases: TOTAL_ALIASES },
      { key: 'payment_type', label: 'Тип оплаты', type: 'string', required: false, aliases: PAYMENT_TYPE_ALIASES },
      { key: 'category', label: 'Категория', type: 'string', required: false, aliases: CATEGORY_ALIASES },
    ],
  },

  // ─── 8. Маркетинг ─────────────────────────
  marketing: {
    key: 'marketing',
    name: 'Маркетинг',
    icon: '📊',
    description: 'ROMI, реклама',
    color: 'purple',
    metrics: ['ROMI', 'CTR/CPC/CAC', 'Воронка'],
    fields: [
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'channel', label: 'Канал', type: 'string', required: true, aliases: [
        'канал', 'рекламный канал', 'площадка', 'источник',
        'kanal', 'manba', 'reklama kanali',
        'channel', 'source', 'medium', 'platform',
      ]},
      { key: 'campaign', label: 'Кампания', type: 'string', required: false, aliases: [
        'кампания', 'рекламная кампания', 'название кампании',
        'kampaniya', 'reklama nomi',
        'campaign', 'campaign_name', 'ad_name',
      ]},
      { key: 'impressions', label: 'Показы', type: 'number', required: true, aliases: [
        'показы', 'охват', 'кол-во показов',
        'korishlar', 'korishlr soni',
        'impressions', 'views', 'reach',
      ]},
      { key: 'clicks', label: 'Клики', type: 'number', required: true, aliases: [
        'клики', 'переходы', 'кол-во кликов',
        'bosishlar', 'kliklar',
        'clicks', 'click_count',
      ]},
      { key: 'spend', label: 'Расход', type: 'number', required: true, aliases: [
        'расход', 'бюджет', 'затраты', 'потрачено', 'стоимость',
        'xarajat', 'byudjet', 'sarflangan',
        'spend', 'cost', 'budget', 'ad_spend',
      ]},
      { key: 'revenue', label: 'Доход', type: 'number', required: false, aliases: [
        'доход', 'выручка', 'продажи',
        'daromad', 'tushum', 'sotuv',
        'revenue', 'income', 'sales',
      ]},
      { key: 'leads', label: 'Лиды', type: 'number', required: false, aliases: [
        'лиды', 'заявки', 'обращения',
        'lidlar', 'arizalar',
        'leads', 'applications', 'inquiries',
      ]},
      { key: 'conversions', label: 'Конверсии', type: 'number', required: false, aliases: [
        'конверсии', 'продажи', 'целевые действия',
        'konversiyalar', 'sotuvlar',
        'conversions', 'sales', 'actions',
      ]},
    ],
  },

  // ─── 9. CRM ────────────────────────────────
  crm: {
    key: 'crm',
    name: 'CRM',
    icon: '👥',
    description: 'Клиенты, сделки',
    color: 'indigo',
    metrics: ['Воронка продаж', 'LTV', 'Churn'],
    fields: [
      { key: 'client_id', label: 'ID клиента', type: 'string', required: true, aliases: CLIENT_ID_ALIASES },
      { key: 'client_name', label: 'Имя клиента', type: 'string', required: true, aliases: CLIENT_ALIASES },
      { key: 'deal_id', label: 'ID сделки', type: 'string', required: false, aliases: [
        'номер сделки', 'id сделки', '№ сделки',
        'bitim id', 'bitim raqami',
        'deal_id', 'deal', 'opportunity_id',
      ]},
      { key: 'stage', label: 'Этап', type: 'string', required: true, aliases: [
        'этап', 'стадия', 'воронка', 'этап сделки',
        'bosqich', 'holat',
        'stage', 'pipeline', 'funnel_stage',
      ]},
      { key: 'amount', label: 'Сумма сделки', type: 'number', required: true, aliases: [
        'сумма сделки', 'сумма', 'бюджет сделки',
        'bitim summasi', 'summa',
        'amount', 'deal_amount', 'value',
      ]},
      { key: 'date_created', label: 'Дата создания', type: 'date', required: true, aliases: [
        'дата создания', 'создан', 'дата',
        'yaratilgan sana', 'sana',
        'date_created', 'created_at', 'date',
      ]},
      { key: 'date_closed', label: 'Дата закрытия', type: 'date', required: false, aliases: [
        'дата закрытия', 'закрыт', 'дата завершения',
        'yopilgan sana', 'tugash sanasi',
        'date_closed', 'closed_at', 'close_date',
      ]},
      { key: 'manager', label: 'Менеджер', type: 'string', required: false, aliases: [
        'менеджер', 'ответственный', 'продавец', 'сотрудник',
        'menejer', 'masul', 'xodim',
        'manager', 'owner', 'sales_rep', 'responsible',
      ]},
      { key: 'status', label: 'Статус', type: 'string', required: false, aliases: STATUS_ALIASES },
    ],
  },

  // ─── 10. Финансы ───────────────────────────
  finance: {
    key: 'finance',
    name: 'Финансы',
    icon: '💰',
    description: 'P&L, учёт',
    color: 'emerald',
    metrics: ['Доходы/расходы', 'Прибыль', 'Кэшфлоу'],
    fields: [
      { key: 'date', label: 'Дата', type: 'date', required: true, aliases: DATE_ALIASES },
      { key: 'type', label: 'Тип', type: 'enum', required: true, aliases: [
        'тип', 'тип операции', 'вид операции', 'приход/расход',
        'turi', 'operatsiya turi',
        'навъ', 'навъи амалиёт',
        'type', 'operation_type', 'transaction_type',
      ], enumValues: ['income', 'expense', 'доход', 'расход', 'приход', 'kirim', 'chiqim', 'даромад', 'харҷ'] },
      { key: 'category', label: 'Категория', type: 'string', required: true, aliases: [
        ...CATEGORY_ALIASES,
        'статья', 'статья расхода', 'статья дохода',
        'modda', 'xarajat moddasi',
        'article', 'expense_category',
      ]},
      { key: 'amount', label: 'Сумма', type: 'number', required: true, aliases: [
        ...TOTAL_ALIASES,
        'дебет', 'кредит', 'оборот', 'сальдо',
        'debet', 'kredit', 'aylanma',
        'debit', 'credit', 'turnover', 'balance',
      ]},
      { key: 'description', label: 'Описание', type: 'string', required: false, aliases: [
        'описание', 'комментарий', 'назначение', 'основание', 'примечание',
        'izoh', 'tavsif', 'sharh',
        'тавсиф', 'шарҳ',
        'description', 'comment', 'note', 'memo',
      ]},
      { key: 'account', label: 'Счёт', type: 'string', required: false, aliases: [
        'счёт', 'счет', 'банковский счёт', 'касса', 'кошелёк',
        'hisob', 'bank hisobi', 'kassa',
        'ҳисоб', 'ҳисоби бонкӣ',
        'account', 'bank_account', 'wallet',
      ]},
      { key: 'counterparty', label: 'Контрагент', type: 'string', required: false, aliases: [
        'контрагент', 'получатель', 'плательщик', 'от кого', 'кому',
        'kontragent', 'kimdan', 'kimga',
        'контрагент', 'аз кӣ', 'ба кӣ',
        'counterparty', 'payee', 'payer', 'vendor',
      ]},
    ],
  },
}

// ─── Хелперы ──────────────────────────────────

export function getIndustry(key: IndustryKey): IndustryConfig {
  return INDUSTRIES[key]
}

export function getRequiredFields(key: IndustryKey): FieldConfig[] {
  return INDUSTRIES[key].fields.filter((f) => f.required)
}

export function getAllIndustries(): IndustryConfig[] {
  return Object.values(INDUSTRIES)
}
