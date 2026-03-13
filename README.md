Analitix AI Платформа бизнес-аналитики для малого бизнеса

SaaS-дашборд с AI-аналитикой для 10 отраслей. Загрузи CSV — получи инсайты.

🌐 Live Demo: analytics-dashboard-saas.vercel.app

О проекте
Analitix AI — веб-платформа бизнес-аналитики, разработанная для малого бизнеса в СНГ. Владелец бизнеса загружает CSV из своей системы учёта (в том числе выгрузки 1С), и получает автоматические дашборды, метрики и AI-инсайты по своей отрасли.
Целевые рынки: Россия, Таджикистан, Узбекистан

Возможности

📊 10 отраслевых модулей — ритейл, кафе/ресторан, склад, логистика, салон красоты, e-commerce, Авито, маркетинг, CRM, финансы
📁 Загрузка CSV — автоматическое определение кодировки (UTF-8, Windows-1251), поддержка форматов 1С
📈 Аналитические дашборды — ключевые метрики, динамика продаж, топ-продукты, клиентский анализ
🔐 Авторизация с 2FA — безопасный вход с двухфакторной аутентификацией
🤖 AI-инсайты — автоматический анализ данных через Claude API с рекомендациями


Технический стек
СлойТехнологияFrontendReact, TypeScript, RechartsBackendFastAPI (Python)База данныхSQLite / PostgreSQLAIAnthropic Claude APIДеплойVercel (frontend), Railway (backend)КонтейнеризацияDocker, docker-composeМиграцииAlembicТестыpytest

Запуск локально
Требования

Python 3.10+
Node.js 18+

Backend
bashcd app
pip install -r requirements.txt
uvicorn main:app --reload
Frontend
bashcd frontend
npm install
npm run dev
Открыть: http://localhost:5173
Через Docker
bashdocker-compose up --build

Структура проекта
├── app/              # FastAPI backend
│   ├── routers/      # API endpoints по отраслям
│   ├── models/       # Модели данных
│   └── services/     # Бизнес-логика, AI-анализ
├── frontend/         # React + TypeScript
│   └── src/
│       ├── components/   # Компоненты дашбордов
│       └── pages/        # Страницы по отраслям
├── demo_data/        # CSV примеры для тестирования
├── tests/            # pytest тесты
└── docker-compose.yml

Демо-данные
В папке demo_data/ находятся CSV-файлы для каждой отрасли — можно загрузить сразу после запуска и увидеть дашборды в действии.

Разработчик
Bahrom Nazarov — @NazarovData
Fullstack-разработка, Data Engineering, аналитика для СНГ-рынка.
