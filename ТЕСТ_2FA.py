"""
🧪 Тестовый скрипт для проверки 2FA функций
Запустите: python ТЕСТ_2FA.py
"""

print("=" * 50)
print("🧪 ТЕСТ 2FA ФУНКЦИЙ")
print("=" * 50)
print()

# Тест 1: Импорты
print("📦 Тест 1: Проверка импортов...")
try:
    import pyotp
    print("  ✅ pyotp импортирован")
except ImportError as e:
    print(f"  ❌ pyotp: {e}")
    exit(1)

try:
    import qrcode
    print("  ✅ qrcode импортирован")
except ImportError as e:
    print(f"  ❌ qrcode: {e}")
    exit(1)

try:
    from PIL import Image
    print("  ✅ Pillow (PIL) импортирован")
except ImportError as e:
    print(f"  ❌ Pillow: {e}")
    exit(1)

print()

# Тест 2: Генерация TOTP секрета
print("🔑 Тест 2: Генерация TOTP секрета...")
try:
    secret = pyotp.random_base32()
    print(f"  ✅ Секрет создан: {secret[:10]}...")
except Exception as e:
    print(f"  ❌ Ошибка: {e}")
    exit(1)

print()

# Тест 3: Создание TOTP кода
print("🔢 Тест 3: Генерация TOTP кода...")
try:
    totp = pyotp.TOTP(secret)
    code = totp.now()
    print(f"  ✅ Код сгенерирован: {code}")
except Exception as e:
    print(f"  ❌ Ошибка: {e}")
    exit(1)

print()

# Тест 4: Верификация кода
print("✅ Тест 4: Верификация TOTP кода...")
try:
    is_valid = totp.verify(code)
    if is_valid:
        print(f"  ✅ Код верифицирован успешно!")
    else:
        print(f"  ❌ Код не прошёл верификацию")
        exit(1)
except Exception as e:
    print(f"  ❌ Ошибка: {e}")
    exit(1)

print()

# Тест 5: Создание QR кода
print("📱 Тест 5: Создание QR кода...")
try:
    import io
    import base64
    
    totp_uri = totp.provisioning_uri(
        name="test@example.com",
        issuer_name="Analitix AI"
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Сохраняем в буфер
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    print(f"  ✅ QR код создан! Размер: {len(img_str)} символов (base64)")
    print(f"  ✅ URI: {totp_uri[:50]}...")
except Exception as e:
    print(f"  ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print()

# Тест 6: Импорт API модулей
print("🔌 Тест 6: Импорт API модулей...")
try:
    from app.api.v1 import auth_2fa
    print("  ✅ auth_2fa API импортирован")
except Exception as e:
    print(f"  ❌ auth_2fa: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

try:
    from app.api.v1 import geo_analytics
    print("  ✅ geo_analytics API импортирован")
except Exception as e:
    print(f"  ❌ geo_analytics: {e}")
    exit(1)

print()

# Итоговый результат
print("=" * 50)
print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
print("=" * 50)
print()
print("🚀 Всё готово для запуска сервера!")
print()
print("Запустите backend:")
print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
print()

