# 🔧 Решение ошибки PowerShell "Access was denied"

## 🚨 Проблема: Access was denied to PowerShell

Если вы видите ошибку:
```
The terminal process failed to launch: Access was denied to the path containing your executable "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"
```

---

## ✅ РЕШЕНИЕ 1: Запустите VS Code/Cursor от имени администратора

### Windows:

1. **Закройте** VS Code/Cursor полностью
2. **Найдите** ярлык VS Code/Cursor на рабочем столе или в меню Пуск
3. **Правой кнопкой** мыши на ярлык
4. Выберите **"Запуск от имени администратора"**
5. Откройте проект заново

**Это самое простое решение!**

---

## ✅ РЕШЕНИЕ 2: Измените настройки терминала

### В VS Code/Cursor:

1. Нажмите **Ctrl + Shift + P**
2. Введите: `Terminal: Select Default Profile`
3. Выберите **"Command Prompt"** вместо PowerShell
4. Или выберите **"Git Bash"** если установлен

### Или в настройках:

1. Нажмите **Ctrl + ,** (открыть настройки)
2. Найдите: `terminal.integrated.defaultProfile.windows`
3. Измените на: `"Command Prompt"` или `"Git Bash"`

---

## ✅ РЕШЕНИЕ 3: Используйте другой терминал

### Вариант A: Command Prompt (cmd)

1. Нажмите **Ctrl + Shift + `** (открыть терминал)
2. Нажмите на стрелку вниз рядом с **"+"**
3. Выберите **"Command Prompt"**

### Вариант B: Git Bash

Если у вас установлен Git:

1. Нажмите **Ctrl + Shift + `**
2. Выберите **"Git Bash"**

### Вариант C: Windows Terminal

Если установлен Windows Terminal:

1. Нажмите **Ctrl + Shift + `**
2. Выберите **"Windows Terminal"**

---

## ✅ РЕШЕНИЕ 4: Исправьте права доступа

### Через PowerShell (от имени администратора):

1. Откройте PowerShell **от имени администратора** (Win + X → Windows PowerShell (Admin))
2. Выполните:

```powershell
# Проверьте права
Get-Acl "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"

# Если нужно, дайте права (замените YOUR_USERNAME на ваше имя пользователя)
icacls "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe" /grant "YOUR_USERNAME:(RX)"
```

---

## ✅ РЕШЕНИЕ 5: Используйте внешний терминал

### Запустите команды в отдельном окне:

1. Откройте **Command Prompt** (Win + R → `cmd`)
2. Перейдите в папку проекта:
   ```cmd
   cd "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
   ```
3. Выполните команды там

---

## 🚀 Быстрое решение для запуска проекта

### Используйте Command Prompt вместо PowerShell:

1. **Откройте Command Prompt:**
   - Нажмите **Win + R**
   - Введите: `cmd`
   - Нажмите Enter

2. **Перейдите в папку проекта:**
   ```cmd
   cd "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
   ```

3. **Запустите команды:**
   ```cmd
   # Backend
   docker-compose up -d
   
   # Frontend (в новом окне cmd)
   cd frontend
   npm install
   npm run dev
   ```

---

## 📝 Настройка VS Code/Cursor для использования cmd

### В настройках (settings.json):

Добавьте:

```json
{
  "terminal.integrated.defaultProfile.windows": "Command Prompt",
  "terminal.integrated.profiles.windows": {
    "Command Prompt": {
      "path": "C:\\Windows\\System32\\cmd.exe"
    }
  }
}
```

---

## 🆘 Если ничего не помогает

### Используйте Git Bash:

1. Установите Git: https://git-scm.com/download/win
2. В VS Code/Cursor выберите Git Bash как терминал по умолчанию
3. Все команды будут работать в Git Bash

---

## ✅ Проверка что работает

После применения решения:

1. Откройте терминал в VS Code/Cursor (Ctrl + `)
2. Должен открыться выбранный терминал (cmd, Git Bash, или другой)
3. Попробуйте выполнить команду:
   ```cmd
   echo "Hello"
   ```

Если команда выполняется - все работает!

---

**Самое простое решение: Запустите VS Code/Cursor от имени администратора! 🚀**


