# 🚀 ЗАПУСК ЧЕРЕЗ CMD

## ✅ САМЫЙ ПРОСТОЙ СПОСОБ - Один клик!

### **Просто дважды кликните на файл:**
```
start_all.bat
```

Этот файл:
- ✅ Запустит Backend (FastAPI)
- ✅ Запустит Frontend (React + Vite)
- ✅ Откроет браузер автоматически
- ✅ Всё в отдельных окнах

---

## 📋 ВСЕ ДОСТУПНЫЕ КОМАНДЫ:

### **1. 🔥 Запустить всё сразу (РЕКОМЕНДУЕТСЯ)**
```cmd
start_all.bat
```
→ Запустит Backend и Frontend одновременно

---

### **2. 🔧 Запустить только Backend**
```cmd
start_backend.bat
```
→ Только FastAPI сервер на порту 8000

---

### **3. 🎨 Запустить только Frontend**
```cmd
start_frontend.bat
```
→ Только React + Vite на порту 5173

---

### **4. 📦 Установить зависимости (первый запуск)**
```cmd
install_dependencies.bat
```
→ Установит все npm пакеты + jspdf для PDF

---

### **5. 🔍 Проверить статус**
```cmd
check_status.bat
```
→ Покажет запущены ли Backend и Frontend

---

## 🎯 ПОШАГОВАЯ ИНСТРУКЦИЯ:

### **Первый запуск:**

1. **Откройте CMD**
   ```
   Win + R → cmd → Enter
   ```

2. **Перейдите в папку проекта:**
   ```cmd
   cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
   ```

3. **Установите зависимости (только один раз):**
   ```cmd
   install_dependencies.bat
   ```
   Ждите 2-3 минуты...

4. **Запустите систему:**
   ```cmd
   start_all.bat
   ```

5. **Готово!** Браузер откроется автоматически на `http://localhost:5173`

---

### **Последующие запуски:**

Просто дважды кликните на **`start_all.bat`** или:

```cmd
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
start_all.bat
```

---

## 🖱️ ЕЩЕ ПРОЩЕ - БЕЗ CMD:

### **Windows проводник:**

1. Откройте папку: `C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS`
2. Найдите файл `start_all.bat`
3. **Дважды кликните** на него
4. Готово! 🎉

---

## 📡 ЧТО БУДЕТ ЗАПУЩЕНО:

После запуска `start_all.bat`:

```
✅ Backend:  http://localhost:8000
   API Docs: http://localhost:8000/docs

✅ Frontend: http://localhost:5173
```

Откроются **2 окна CMD**:
- 🔧 Backend (FastAPI) - не закрывайте!
- 🎨 Frontend (React + Vite) - не закрывайте!

---

## 🛑 КАК ОСТАНОВИТЬ:

### **Способ 1 - Закрыть окна:**
Просто закройте оба окна CMD

### **Способ 2 - Ctrl+C:**
В каждом окне CMD нажмите `Ctrl+C`

---

## ⚠️ ПРОБЛЕМЫ И РЕШЕНИЯ:

### **"venv не найден"**
```cmd
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
python -m venv venv
install_dependencies.bat
```

### **"Порт уже занят"**
```cmd
# Найти и завершить процесс:
netstat -ano | findstr :8000
taskkill /F /PID [номер_процесса]
```

### **"npm не найден"**
Установите Node.js: https://nodejs.org/

### **"python не найден"**
Установите Python: https://www.python.org/

---

## 💡 ПОЛЕЗНЫЕ КОМАНДЫ:

### **Проверить статус:**
```cmd
check_status.bat
```

### **Посмотреть логи Backend:**
Смотрите в окно CMD с Backend

### **Посмотреть логи Frontend:**
Смотрите в окно CMD с Frontend

### **Перезапустить:**
1. Закройте оба окна
2. Запустите `start_all.bat` снова

---

## 🎯 БЫСТРЫЙ СТАРТ (3 команды):

```cmd
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
install_dependencies.bat
start_all.bat
```

**Готово! 🚀**

---

## 📂 ЧТО ДЕЛАЮТ ФАЙЛЫ:

| Файл | Описание |
|------|----------|
| `start_all.bat` | Запускает Backend + Frontend |
| `start_backend.bat` | Только Backend |
| `start_frontend.bat` | Только Frontend |
| `install_dependencies.bat` | Установка зависимостей |
| `check_status.bat` | Проверка статуса |

---

## 🔥 СОЗДАТЬ ЯРЛЫК НА РАБОЧЕМ СТОЛЕ:

1. **ПКМ на `start_all.bat`**
2. **Отправить → Рабочий стол (создать ярлык)**
3. **Переименуйте:** "🚀 Запуск Дашборда"
4. **Готово!** Теперь запуск в один клик с рабочего стола!

---

## ✅ ИТОГО:

### **Самый простой способ:**
```
Дважды кликните на start_all.bat
```

### **Через CMD:**
```cmd
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
start_all.bat
```

### **Первый запуск:**
```cmd
cd /d "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
install_dependencies.bat
start_all.bat
```

---

**ВСЁ ГОТОВО! ЗАПУСКАЙТЕ! 🚀🔥**

**P.S.** Все команды уже в BAT файлах, просто кликните дважды! 😊





