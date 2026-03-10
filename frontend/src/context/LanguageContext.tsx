/**
 * 🌍 Context для управления языком приложения
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, t as translate } from '@/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Получаем язык из localStorage или определяем по умолчанию
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('analitix_language')
    if (saved && ['ru', 'tj', 'en'].includes(saved)) {
      return saved as Language
    }
    // Определяем язык браузера
    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'tg' || browserLang === 'tj') return 'tj'
    if (browserLang === 'en') return 'en'
    return 'ru'
  })

  useEffect(() => {
    localStorage.setItem('analitix_language', language)
    // Применяем язык к документу
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  // Используем прямой импорт функции перевода
  const t = (key: string) => {
    return translate(key, language)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

// Компонент для переключения языка
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="relative flex items-center gap-0.5 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-0.5 shadow-lg">
      <button
        onClick={() => setLanguage('ru')}
        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all min-w-[44px] ${
          language === 'ru'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 scale-105'
            : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/80'
        }`}
        title="Русский"
      >
        <span className="sm:inline">🇷🇺</span> <span className="ml-1">RU</span>
      </button>
      <button
        onClick={() => setLanguage('tj')}
        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all min-w-[44px] ${
          language === 'tj'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 scale-105'
            : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/80'
        }`}
        title="Тоҷикӣ"
      >
        <span className="sm:inline">🇹🇯</span> <span className="ml-1">TJ</span>
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all min-w-[44px] ${
          language === 'en'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 scale-105'
            : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/80'
        }`}
        title="English"
      >
        <span className="sm:inline">🇺🇸</span> <span className="ml-1">EN</span>
      </button>
    </div>
  )
}

