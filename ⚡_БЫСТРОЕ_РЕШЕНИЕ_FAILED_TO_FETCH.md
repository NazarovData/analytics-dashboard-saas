# ⚡ БЫСТРОЕ РЕШЕНИЕ "Failed to fetch"

## 🔍 Проблема
Frontend не может подключиться к Backend - ошибка **"Failed to fetch"**

## ✅ Причина
Backend не запущен на порту 8000

## 🚀 РЕШЕНИЕ (выберите один способ)

### Способ 1: Автоматический запуск (РЕКОМЕНДУЕТСЯ)
```cmd
🚀_ЗАПУСТИТЬ_ОБА_СЕРВЕРА.bat
```
Запустит Backend + Frontend одновременно

### Способ 2: Только Backend
```cmd
🚀_ИСПРАВИТЬ_FAILED_TO_FETCH.bat
```
Запустит только Backend на порту 8000

### Способ 3: Ручной запуск

#### Терминал 1 - Backend:
```cmd
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Терминал 2 - Frontend:
```cmd
cd frontend
npm run dev
```

## 🔍 Проверка

После запуска проверьте:

1. **Backend работает:**
   - Откройте: http://localhost:8000
   - Должно показать: `{"message": "Analitix AI", "status": "running"}`

2. **API Docs доступны:**
   - Откройте: http://localhost:8000/docs
   - Должна открыться Swagger документация

3. **Frontend работает:**
   - Откройте: http://localhost:5173
   - Ошибка "Failed to fetch" должна исчезнуть

## 📊 Диагностика

Если проблема осталась:

```cmd
# Проверить порты
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Проверить логи Backend
# Смотрите в терминале где запущен Backend
```

## ⚙️ Настройки

Frontend подключается к Backend через:
- **Development:** `http://localhost:8000/api/v1`
- **Production:** `/api/v1` (относительный путь)

Файл: `frontend/src/lib/api.ts`

## 🎯 Что дальше?

После запуска серверов:
1. Откройте http://localhost:5173
2. Войдите в систему
3. Загрузите CSV файл
4. Система должна работать без ошибок

---

**Создано:** 2026-02-09
**Статус:** ✅ Готово к использованию
