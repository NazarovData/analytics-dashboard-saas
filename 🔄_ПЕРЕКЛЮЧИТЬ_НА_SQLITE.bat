@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          🔄 ПЕРЕКЛЮЧЕНИЕ НА SQLITE                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📝 SQLite - это легкая база данных без установки сервера
echo    Идеально для разработки и тестирования
echo.
echo ⚠️ Для продакшена рекомендуется PostgreSQL
echo.

echo 🔧 Изменяю .env файл...
echo.

REM Создаем backup .env
if exist .env (
    copy .env .env.backup >nul
    echo ✅ Создан backup: .env.backup
)

REM Создаем новый .env с SQLite
(
echo # 🔧 КОНФИГУРАЦИЯ ANALITIX AI ^(SQLite режим^)
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 🗄️ БАЗА ДАННЫХ ^(SQLite - без PostgreSQL^)
echo # ═══════════════════════════════════════════════════════════
echo DATABASE_URL=sqlite:///./analitix_ai.db
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 🌐 CORS ^(разрешенные домены^)
echo # ═══════════════════════════════════════════════════════════
echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 🔐 БЕЗОПАСНОСТЬ
echo # ═══════════════════════════════════════════════════════════
echo SECRET_KEY=your-secret-key-change-in-production
echo ALGORITHM=HS256
echo ACCESS_TOKEN_EXPIRE_MINUTES=1440
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 📁 ЗАГРУЗКА ФАЙЛОВ
echo # ═══════════════════════════════════════════════════════════
echo MAX_FILE_SIZE_MB=100
echo MAX_IMAGE_SIZE_MB=50
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 🔴 REDIS ^(опционально^)
echo # ═══════════════════════════════════════════════════════════
echo REDIS_ENABLED=False
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 📊 ЛОГИРОВАНИЕ
echo # ═══════════════════════════════════════════════════════════
echo LOG_LEVEL=INFO
echo LOG_FILE=logs/app.log
echo.
echo # ═══════════════════════════════════════════════════════════
echo # 🚀 ОКРУЖЕНИЕ
echo # ═══════════════════════════════════════════════════════════
echo ENVIRONMENT=development
echo DEBUG=True
) > .env

echo ✅ Файл .env обновлен для SQLite
echo.

echo 🔄 Применяю миграции для SQLite...
echo.

call venv\Scripts\activate
alembic upgrade head

if %errorlevel% equ 0 (
    echo.
    echo ✅ SQLite база данных готова!
    echo    Файл: analitix_ai.db
    echo.
    echo 📊 Созданные таблицы:
    echo    - users
    echo    - file_uploads
    echo    - analytics
    echo    - integrations
    echo    - integration_syncs
    echo    - leads
    echo    - exports
    echo.
    echo 🚀 Теперь запустите backend:
    echo    ▶️_ЗАПУСТИТЬ_BACKEND.bat
    echo.
) else (
    echo.
    echo ❌ Ошибка создания SQLite базы
    echo.
)

echo ════════════════════════════════════════════════════════════
echo.
echo 💡 ПРЕИМУЩЕСТВА SQLITE:
echo    ✅ Не требует установки PostgreSQL
echo    ✅ Простая настройка
echo    ✅ Идеально для разработки
echo    ✅ Один файл - вся база данных
echo.
echo ⚠️ ОГРАНИЧЕНИЯ SQLITE:
echo    ❌ Не подходит для продакшена
echo    ❌ Медленнее на больших данных
echo    ❌ Нет параллельных записей
echo.
echo 🔄 Чтобы вернуться на PostgreSQL:
echo    1. Восстановите .env.backup
echo    2. Запустите 🔧_НАСТРОИТЬ_POSTGRESQL.bat
echo.
echo ════════════════════════════════════════════════════════════
echo.

pause
