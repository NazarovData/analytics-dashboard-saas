"""
Инициализация базы данных
Запустите этот скрипт для создания всех таблиц
"""
from app.core.database import init_db, engine
from app.models.database import Base

if __name__ == "__main__":
    print("🚀 Инициализация базы данных Analitix AI...")
    print("=" * 50)
    
    try:
        # Создаём все таблицы
        init_db()
        
        print("=" * 50)
        print("✅ База данных успешно инициализирована!")
        print("\nСозданные таблицы:")
        print("  - users (пользователи)")
        print("  - integrations (интеграции)")
        print("  - integration_syncs (синхронизации)")
        print("  - analytics (аналитика)")
        print("  - leads (заявки)")
        print("  - exports (экспорты)")
        print("\nТеперь можно запускать приложение!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        print("\nУбедитесь что:")
        print("  1. PostgreSQL запущен")
        print("  2. База данных 'analitix_ai' создана")
        print("  3. Указаны правильные credentials в DATABASE_URL")








