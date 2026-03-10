# 🆘 Что делать если нет Railway URL

## 🎯 У вас два варианта:

---

## ✅ ВАРИАНТ 1: Получить Railway URL (Рекомендуется)

### За 5 минут:

1. Откройте: **https://railway.app**
2. Войдите через GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Выберите ваш репозиторий
5. Добавьте **PostgreSQL**: New → Database → PostgreSQL
6. Получите URL из Settings → Domains
7. Обновите `vercel.json` с этим URL
8. Закоммитьте и запушьте

**Готово!** Приложение будет работать на Vercel.

---

## ✅ ВАРИАНТ 2: Запустить локально (Быстро)

Если не хотите создавать Railway проект сейчас:

### Запустите Backend локально:

```bash
# 1. Установите зависимости
pip install -r requirements.txt

# 2. Запустите PostgreSQL (через Docker)
docker run -d --name postgres \
  -e POSTGRES_USER=bizpulse \
  -e POSTGRES_PASSWORD=bizpulse_password \
  -e POSTGRES_DB=bizpulse_db \
  -p 5432:5432 postgres:15-alpine

# 3. Создайте .env файл
# DATABASE_URL=postgresql+asyncpg://bizpulse:bizpulse_password@localhost:5432/bizpulse_db
# SECRET_KEY=your-secret-key

# 4. Запустите миграции
alembic upgrade head

# 5. Запустите backend
uvicorn app.main:app --reload
```

Backend будет на: **http://localhost:8000**

### Запустите Frontend локально:

```bash
cd frontend
npm install

# Создайте frontend/.env
# VITE_API_URL=http://localhost:8000/api/v1

npm run dev
```

Frontend будет на: **http://localhost:3000**

**Готово!** Откройте http://localhost:3000

---

## 🎯 Что выбрать?

- **Railway URL** - если хотите чтобы работало на Vercel (в интернете)
- **Локально** - если хотите протестировать сейчас

---

## 📝 Рекомендация

**Создайте Railway проект** - это займет 5 минут и приложение будет работать в интернете!

См. файл: `ПОЛУЧИТЬ_URL_СЕЙЧАС.md`

---

**Выберите вариант и следуйте инструкциям! 🚀**


