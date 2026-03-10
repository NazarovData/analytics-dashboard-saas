@echo off
chcp 65001 >nul
cls
echo ============================================
echo 🗑️ Очистка лишних документационных файлов
echo ============================================
echo.

echo ⚠️ ВНИМАНИЕ!
echo Будут удалены старые инструкции и документы
echo.
echo Останутся только:
echo   - 📖_ГЛАВНАЯ_ИНСТРУКЦИЯ.md
echo   - 🚀_ИНТЕГРАЦИЯ_CLAUDE_AI.md
echo   - 🎯_CLAUDE_AI_ВИЗУАЛИЗАЦИЯ_В_РЕАЛЬНОМ_ВРЕМЕНИ.md
echo   - README.md
echo   - Важные .bat файлы
echo   - SQL скрипты
echo.

set /p confirm="Продолжить? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Отменено
    pause
    exit /b
)

echo.
echo 🗑️ Удаление старых файлов...
echo.

REM Удаляем старые инструкции
del /q "⚡_БЫСТРОЕ_РЕШЕНИЕ.txt" 2>nul
del /q "🎯_РЕШЕНИЕ_DATETIME_ОШИБКИ.md" 2>nul
del /q "КОМАНДЫ_ВЫПОЛНИТЬ_СЕЙЧАС.txt" 2>nul
del /q "🎉_ФИНАЛЬНОЕ_ИСПРАВЛЕНИЕ.md" 2>nul
del /q "✅_ОТВЕТ_НА_ВОПРОС_POSTGRESQL.md" 2>nul
del /q "🎯_ПОЛНАЯ_ИНСТРУКЦИЯ_ТЕСТИРОВАНИЯ.md" 2>nul
del /q "✅_AI_ANALYZER_V3_ГОТОВ.md" 2>nul
del /q "🎯_ФИНАЛЬНАЯ_ИНСТРУКЦИЯ.md" 2>nul
del /q "✅_ТЕСТ_ВСЕХ_ОТРАСЛЕЙ.md" 2>nul
del /q "🎯_НАЧАТЬ_ЗДЕСЬ.txt" 2>nul
del /q "⚡_КОМАНДЫ_ДЛЯ_CMD.txt" 2>nul
del /q "🔍_АНАЛИЗ_КОНКУРЕНТОВ_СНГ.md" 2>nul
del /q "🎉_ФИНАЛЬНАЯ_ИНСТРУКЦИЯ.md" 2>nul
del /q "🚀_ГОТОВО_К_ДЕПЛОЮ.md" 2>nul
del /q "🎉_ВСЕ_ОТРАСЛИ_РАБОТАЮТ.md" 2>nul
del /q "🚀_ЗАПУСК_С_POSTGRESQL.txt" 2>nul
del /q "🎉_POSTGRESQL_И_ВИЗУАЛИЗАЦИЯ_ГОТОВЫ.md" 2>nul
del /q "✅_POSTGRESQL_ГОТОВ.md" 2>nul
del /q "⚠️_НЕДОСТАТКИ_И_РИСКИ.md" 2>nul
del /q "🎯_СТРАТЕГИЯ_ПРИВЛЕЧЕНИЯ_КЛИЕНТОВ.md" 2>nul
del /q "💰_ОЦЕНКА_СТОИМОСТИ_СТАРТАПА.md" 2>nul
del /q "🔧_ИСПРАВЛЕНИЕ_МАРКЕТИНГ_ДАШБОРДА.md" 2>nul
del /q "✅_ЧТО_СДЕЛАНО_И_ЧТО_ДАЛЬШЕ.md" 2>nul
del /q "🎯_ПОЛНАЯ_РЕАЛИЗАЦИЯ_ПЛАН.md" 2>nul
del /q "ДИЗАЙН_СИСТЕМА.md" 2>nul
del /q "🎉_ИТОГО_ВСЕ_НОВЫЕ_ФУНКЦИИ.md" 2>nul
del /q "✅_ВОССТАНОВЛЕНИЕ_БАЗЫ_1SUM_GO.md" 2>nul
del /q "⚡_ИСПРАВЛЕНА_ОШИБКА_POSTGRESQL.md" 2>nul
del /q "👉_ПЕРЕЗАПУСТИТЕ_FRONTEND_СЕЙЧАС.txt" 2>nul
del /q "🎉_POSTGRESQL_ДАННЫЕ_ГОТОВЫ.md" 2>nul
del /q "🔄_ПЕРЕЗАПУСТИТЕ_FRONTEND.txt" 2>nul
del /q "✅_ПРОСМОТР_ДАННЫХ_POSTGRESQL.md" 2>nul
del /q "🎯_НАЧНИТЕ_ЗДЕСЬ_POSTGRESQL.txt" 2>nul
del /q "✅_ИТОГ_POSTGRESQL_ИНТЕГРАЦИЯ.md" 2>nul
del /q "🚀_ЗАПУСТИТЕ_СОЗДАНИЕ_БАЗЫ.txt" 2>nul
del /q "🎉_POSTGRESQL_ГОТОВ_СОЗДАЙТЕ_БАЗУ.md" 2>nul
del /q "👉_СОЗДАЙТЕ_БАЗУ_1SUM_GO.txt" 2>nul
del /q "🎉_ВСЕ_ГОТОВО_POSTGRESQL.md" 2>nul
del /q "✅_POSTGRESQL_РЕАЛЬНОЕ_ПОДКЛЮЧЕНИЕ_ГОТОВО.md" 2>nul
del /q "🚀_РЕАЛЬНОЕ_ПОДКЛЮЧЕНИЕ_POSTGRESQL.md" 2>nul
del /q "🎉_POSTGRESQL_ПОЛНОСТЬЮ_ГОТОВ_ФИНАЛ.md" 2>nul
del /q "✅_МОДАЛЬНОЕ_ОКНО_ИСПРАВЛЕНО.md" 2>nul
del /q "✅_ЗАДАЧА_ВЫПОЛНЕНА.md" 2>nul
del /q "🎉_POSTGRESQL_ГОТОВ_К_ИСПОЛЬЗОВАНИЮ.md" 2>nul
del /q "✅_POSTGRESQL_ИНТЕГРАЦИЯ_ДОБАВЛЕНА.md" 2>nul
del /q "✅_POSTGRESQL_ПОЛНОСТЬЮ_ГОТОВ.md" 2>nul
del /q "🎉_ИТОГОВЫЙ_ОТЧЕТ.md" 2>nul
del /q "👉_НАЧАТЬ_ЗДЕСЬ.txt" 2>nul
del /q "✅_ФИНАЛЬНЫЙ_ЧЕКЛИСТ.md" 2>nul
del /q "⚡_БЫСТРЫЙ_СТАРТ.txt" 2>nul
del /q "🎉_ВСЕ_ГОТОВО_К_ЗАПУСКУ.md" 2>nul
del /q "✅_AI_ANALYZER_ОБНОВЛЕН.md" 2>nul
del /q "✅_НОВЫЕ_ФУНКЦИИ_ДОБАВЛЕНЫ.md" 2>nul
del /q "🚀_ПЛАН_РЕАЛИЗАЦИИ_ВСЕХ_ФУНКЦИЙ.md" 2>nul
del /q "✅_DATETIME_ИСПРАВЛЕН_ПОЛНОСТЬЮ.md" 2>nul
del /q "📊_ИТОГО_ВСЕ_ИСПРАВЛЕНИЯ.md" 2>nul
del /q "✅_ИТОГОВАЯ_ИНСТРУКЦИЯ.md" 2>nul
del /q "🚨_BACKEND_НЕ_ЗАПУЩЕН.txt" 2>nul
del /q "✅_ОШИБКА_500_ИСПРАВЛЕНА_ФИНАЛ.md" 2>nul
del /q "ИНСТРУКЦИЯ_ИСПРАВЛЕНИЕ_DATETIME.md" 2>nul
del /q "✅_ОШИБКА_500_ИСПРАВЛЕНА.md" 2>nul
del /q "✅_ОШИБКА_DATETIME_ИСПРАВЛЕНА.md" 2>nul
del /q "БЫСТРОЕ_РЕШЕНИЕ_404_AUTH.txt" 2>nul
del /q "✅_ОШИБКА_404_AUTH_ИСПРАВЛЕНА.md" 2>nul
del /q "✅_NOT_FOUND_ИСПРАВЛЕНО.md" 2>nul
del /q "БЫСТРОЕ_РЕШЕНИЕ_NOT_FOUND.txt" 2>nul
del /q "ИСПРАВЛЕНИЕ_NOT_FOUND.md" 2>nul
del /q "СПИСОК_ФАЙЛОВ_БИЗНЕС_МОДЕЛЬ.md" 2>nul
del /q "РЕЗЮМЕ_БИЗНЕС_МОДЕЛЬ.txt" 2>nul
del /q "СХЕМА_БИЗНЕС_МЕТРИК.md" 2>nul
del /q "✅_БИЗНЕС_МОДЕЛЬ_ГОТОВА.md" 2>nul
del /q "ШПАРГАЛКА_LTV.md" 2>nul
del /q "README_БИЗНЕС_МЕТРИКИ.md" 2>nul
del /q "ЗАПУСК_LTV_АНАЛИЗА.md" 2>nul
del /q "БИЗНЕС_МОДЕЛЬ_И_LTV.md" 2>nul
del /q "✅_ИСПРАВЛЕНИЕ_ОТРАСЛЕЙ.md" 2>nul

REM Удаляем старые bat файлы (оставляем только важные)
del /q "ПЕРЕЗАПУСК_FRONTEND.bat" 2>nul
del /q "ПЕРЕЗАПУСК_BACKEND_ПОЛНЫЙ.bat" 2>nul
del /q "ОЧИСТИТЬ_КЭШ_И_ПЕРЕЗАПУСТИТЬ.bat" 2>nul
del /q "ПОЛНАЯ_ОЧИСТКА_И_ПЕРЕЗАПУСК.bat" 2>nul
del /q "УБИТЬ_КЭШИ_И_ПЕРЕЗАПУСТИТЬ.bat" 2>nul
del /q "🎯_ПОЛНАЯ_НАСТРОЙКА_POSTGRESQL.bat" 2>nul
del /q "🔄_ВОССТАНОВИТЬ_БАЗУ_1SUM_GO.bat" 2>nul
del /q "🔍_ПРОВЕРИТЬ_БАЗЫ_POSTGRESQL.bat" 2>nul

echo.
echo ============================================
echo ✅ Очистка завершена!
echo ============================================
echo.
echo 📖 Главная инструкция: 📖_ГЛАВНАЯ_ИНСТРУКЦИЯ.md
echo.
echo Осталось файлов:
echo   ✅ 📖_ГЛАВНАЯ_ИНСТРУКЦИЯ.md
echo   ✅ 🚀_ИНТЕГРАЦИЯ_CLAUDE_AI.md
echo   ✅ 🎯_CLAUDE_AI_ВИЗУАЛИЗАЦИЯ_В_РЕАЛЬНОМ_ВРЕМЕНИ.md
echo   ✅ README.md
echo   ✅ start_backend.bat
echo   ✅ start_frontend.bat
echo   ✅ ⚡_СОЗДАТЬ_БАЗУ_1SUM_GO.bat
echo   ✅ 🔧_СОЗДАТЬ_БАЗУ_1SUM_GO.sql
echo.
pause
