# 🔧 Решение ошибки 404 на Railway

## ❌ Проблема:
`404: DEPLOYMENT_NOT_FOUND` - деплой не найден

## ✅ Решение:

---

## 🎯 ШАГ 1: Проверьте что проект существует

1. Зайдите на https://railway.app
2. Войдите в аккаунт
3. Проверьте список проектов
4. Если проекта нет - создайте новый (см. ШАГ 2)

---

## 🚀 ШАГ 2: Создайте новый проект правильно

### 2.1. Создайте проект
1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Выберите ваш репозиторий
4. **ВАЖНО:** Railway должен автоматически определить Python проект

### 2.2. Если Railway не определил проект:
1. В настройках сервиса → **"Settings"**
2. **"Build Command"**: `pip install -r requirements.txt`
3. **"Start Command**": `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **"Root Directory"**: оставьте пустым (корень проекта)

---

## 🔧 ШАГ 3: Проверьте конфигурацию

### 3.1. Убедитесь что есть файлы:
- ✅ `railway.json` (уже создан)
- ✅ `requirements.txt`
- ✅ `app/main.py`
- ✅ `.nixpacks.toml` (уже создан)

### 3.2. Проверьте `app/main.py`:
Должен быть:
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

---

## 📋 ШАГ 4: Правильный деплой

### 4.1. Убедитесь что код на GitHub:
```bash
git add .
git commit -m "Fix Railway deployment"
git push
```

### 4.2. В Railway:
1. Нажмите на ваш проект
2. Нажмите **"Deploy"** или **"Redeploy"**
3. Подождите завершения сборки (2-5 минут)

### 4.3. Проверьте логи:
1. В Railway → **"Deployments"**
2. Выберите последний деплой
3. Нажмите **"View Logs"**
4. Проверьте на ошибки

---

## ⚙️ ШАГ 5: Настройте переменные окружения

В Railway → **"Variables"** добавьте:

```
DATABASE_URL=<автоматически из PostgreSQL>
SECRET_KEY=<случайная строка минимум 32 символа>
ENVIRONMENT=production
PORT=$PORT
```

---

## 🌐 ШАГ 6: Получите правильный URL

1. В Railway → **"Settings"**
2. Найдите **"Domains"** или **"Public Domain"**
3. Скопируйте URL (например: `bizpulse-pro-production.up.railway.app`)
4. Откройте в браузере: `https://ваш-url.railway.app/health`

Должно вернуть: `{"status": "healthy"}`

---

## 🔍 Диагностика проблем:

### Проблема: "Build failed"
**Решение:**
1. Проверьте логи сборки
2. Убедитесь что `requirements.txt` правильный
3. Проверьте что Python версия правильная (3.11+)

### Проблема: "Application error"
**Решение:**
1. Проверьте логи приложения
2. Убедитесь что `DATABASE_URL` установлен
3. Проверьте что порт правильный (`$PORT`)

### Проблема: "404 Not Found"
**Решение:**
1. Убедитесь что деплой завершился успешно
2. Проверьте что URL правильный
3. Попробуйте `/health` endpoint

---

## ✅ Быстрое решение:

1. **Удалите старый проект** в Railway (если есть)
2. **Создайте новый проект** заново:
   - New Project → GitHub repo
   - Выберите репозиторий
3. **Добавьте PostgreSQL**:
   - + New → Database → PostgreSQL
4. **Настройте переменные**:
   - DATABASE_URL (автоматически)
   - SECRET_KEY (вручную)
5. **Дождитесь деплоя** (2-5 минут)
6. **Проверьте URL** в Settings → Domains

---

## 🎯 Правильная структура проекта для Railway:

```
ваш-проект/
├── app/
│   ├── main.py          ← Точка входа
│   ├── __init__.py
│   └── ...
├── requirements.txt     ← Зависимости
├── railway.json         ← Конфигурация Railway
├── .nixpacks.toml       ← Конфигурация сборки
└── README.md
```

---

## 📝 Проверочный список:

- [ ] Код загружен на GitHub
- [ ] Проект создан в Railway
- [ ] PostgreSQL добавлен
- [ ] Переменные окружения настроены
- [ ] Деплой завершился успешно
- [ ] URL работает (`/health` endpoint)

---

**Если проблема осталась - покажите логи из Railway!**

