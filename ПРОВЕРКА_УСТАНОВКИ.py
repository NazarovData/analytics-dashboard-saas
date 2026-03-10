"""
🔍 Скрипт для проверки установки всех зависимостей
Запустите: python ПРОВЕРКА_УСТАНОВКИ.py
"""

import sys

print("=" * 50)
print("🔍 ПРОВЕРКА УСТАНОВКИ ЗАВИСИМОСТЕЙ")
print("=" * 50)
print()

errors = []

# Проверка основных зависимостей
print("📦 Проверяю основные зависимости...")
try:
    import fastapi
    print(f"  ✅ fastapi {fastapi.__version__}")
except ImportError as e:
    print(f"  ❌ fastapi: {e}")
    errors.append("fastapi")

try:
    import uvicorn
    print(f"  ✅ uvicorn {uvicorn.__version__}")
except ImportError as e:
    print(f"  ❌ uvicorn: {e}")
    errors.append("uvicorn")

try:
    import pandas
    print(f"  ✅ pandas {pandas.__version__}")
except ImportError as e:
    print(f"  ❌ pandas: {e}")
    errors.append("pandas")

try:
    import numpy
    print(f"  ✅ numpy {numpy.__version__}")
except ImportError as e:
    print(f"  ❌ numpy: {e}")
    errors.append("numpy")

print()

# Проверка 2FA зависимостей
print("🔐 Проверяю зависимости для 2FA...")
try:
    import pyotp
    print(f"  ✅ pyotp {pyotp.__version__}")
except ImportError as e:
    print(f"  ❌ pyotp: {e}")
    errors.append("pyotp")

try:
    import qrcode
    print(f"  ✅ qrcode {qrcode.__version__}")
except ImportError as e:
    print(f"  ❌ qrcode: {e}")
    errors.append("qrcode")

try:
    from PIL import Image
    import PIL
    print(f"  ✅ Pillow {PIL.__version__}")
except ImportError as e:
    print(f"  ❌ Pillow: {e}")
    errors.append("Pillow")

print()

# Проверка API файлов
print("📁 Проверяю API файлы...")
import os

api_files = [
    "app/api/v1/auth_2fa.py",
    "app/api/v1/geo_analytics.py",
    "app/api/v1/alerts.py",
    "app/api/v1/period_comparison.py",
    "app/api/v1/white_label.py",
]

for file in api_files:
    if os.path.exists(file):
        print(f"  ✅ {file}")
    else:
        print(f"  ❌ {file} - не найден!")
        errors.append(file)

print()

# Проверка импортов API
print("🔧 Проверяю импорты API...")
try:
    from app.api.v1 import auth_2fa
    print("  ✅ auth_2fa импортируется")
except Exception as e:
    print(f"  ❌ auth_2fa: {e}")
    errors.append("auth_2fa import")

try:
    from app.api.v1 import geo_analytics
    print("  ✅ geo_analytics импортируется")
except Exception as e:
    print(f"  ❌ geo_analytics: {e}")
    errors.append("geo_analytics import")

try:
    from app.api.v1 import alerts
    print("  ✅ alerts импортируется")
except Exception as e:
    print(f"  ❌ alerts: {e}")
    errors.append("alerts import")

print()

# Итоговый результат
print("=" * 50)
if errors:
    print(f"❌ НАЙДЕНО ОШИБОК: {len(errors)}")
    print("\nСписок ошибок:")
    for error in errors:
        print(f"  - {error}")
    print("\n⚠️ Нужно исправить ошибки перед запуском!")
    sys.exit(1)
else:
    print("✅ ВСЁ УСТАНОВЛЕНО ПРАВИЛЬНО!")
    print("\n🚀 Можете запускать сервер:")
    print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
print("=" * 50)

