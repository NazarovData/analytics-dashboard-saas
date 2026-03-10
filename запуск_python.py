#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Запуск серверов через Python
"""
import subprocess
import time
import webbrowser
import requests
import sys
import os

def check_server(url, max_attempts=60):
    """Проверка готовности сервера"""
    print(f"Проверяю {url}...")
    for i in range(max_attempts):
        try:
            response = requests.get(url, timeout=2)
            if response.status_code < 500:
                print(f"✅ Сервер готов! (попытка {i+1})")
                return True
        except:
            pass
        print(f"⏳ Попытка {i+1}/{max_attempts}...")
        time.sleep(2)
    return False

def main():
    print("╔══════════════════════════════════════════╗")
    print("║   ЗАПУСК ЧЕРЕЗ PYTHON                   ║")
    print("╚══════════════════════════════════════════╝")
    print()
    
    # Получаем путь к скрипту
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Проверяем venv
    venv_path = os.path.join(script_dir, 'venv', 'Scripts', 'python.exe')
    if not os.path.exists(venv_path):
        print("Создаю виртуальное окружение...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'])
        venv_python = venv_path
        subprocess.run([venv_python, '-m', 'pip', 'install', '-q', 'uvicorn', 'fastapi', 'requests'])
    else:
        venv_python = venv_path
    
    # Проверяем node_modules
    node_modules = os.path.join(script_dir, 'frontend', 'node_modules')
    if not os.path.exists(node_modules):
        print("Устанавливаю npm зависимости...")
        subprocess.run(['npm', 'install'], cwd=os.path.join(script_dir, 'frontend'))
    
    print("\n[1/4] Запускаю бэкенд...")
    backend_cmd = f'"{venv_python}" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000'
    backend_process = subprocess.Popen(
        backend_cmd,
        shell=True,
        cwd=script_dir,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
    )
    
    print("Жду 25 секунд...")
    time.sleep(25)
    
    print("\n[2/4] Запускаю фронтенд...")
    frontend_cmd = 'npm run dev'
    frontend_process = subprocess.Popen(
        frontend_cmd,
        shell=True,
        cwd=os.path.join(script_dir, 'frontend'),
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
    )
    
    print("Жду 30 секунд...")
    time.sleep(30)
    
    print("\n[3/4] Проверяю готовность серверов...")
    backend_ready = check_server('http://localhost:8000/docs')
    frontend_ready = check_server('http://localhost:3000')
    
    print("\n[4/4] Открываю браузеры...")
    if backend_ready and frontend_ready:
        print("✅ Оба сервера готовы!")
        # Открываем браузеры
        webbrowser.open('http://localhost:3000')
        time.sleep(2)
        webbrowser.open('http://localhost:8000/docs')
        print("\n✅ Браузеры открыты!")
        print("\n📊 Фронтенд: http://localhost:3000")
        print("🔧 Бэкенд: http://localhost:8000/docs")
    else:
        print("\n⚠️  Серверы не готовы, но попробую открыть браузеры...")
        webbrowser.open('http://localhost:3000')
        time.sleep(2)
        webbrowser.open('http://localhost:8000/docs')
        print("\nПодождите еще 30-60 секунд и обновите страницу (F5)")
    
    print("\nНажмите Ctrl+C для остановки...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nОстанавливаю серверы...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Готово!")

if __name__ == '__main__':
    main()







