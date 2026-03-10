# 🔐 Установка зависимостей для 2FA

## Python зависимости:

```bash
cd "C:\Users\jobir\OneDrive\Desktop\Дашборд SaaS"
venv\Scripts\activate
pip install pyotp qrcode[pil] pillow
```

## Если ошибка при установке:

### Для pyotp:
```bash
pip install pyotp
```

### Для qrcode:
```bash
pip install qrcode
pip install pillow  # Для работы с изображениями
```

---

## 📝 Проверка установки:

```bash
python -c "import pyotp; import qrcode; print('OK')"
```

Если выводит "OK" - всё установлено правильно!

---

## ⚠️ Если не нужен QR код (опционально):

Можно убрать генерацию QR кода из `auth_2fa.py` и использовать только SMS/Email.

---

**Готово! 🚀**

