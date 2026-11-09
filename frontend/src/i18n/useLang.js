import { useEffect, useState } from 'react'
import en from './en'
import hi from './hi'

const translations = { en, hi }
export function useLang() {
  const [lang, setLang] = useState(() => localStorage.getItem('feedesk-language') || 'en')
  useEffect(() => {
    const handleLanguageChange = (event) => setLang(event.detail)
    window.addEventListener('feedesk-language-change', handleLanguageChange)
    return () => window.removeEventListener('feedesk-language-change', handleLanguageChange)
  }, [])
  useEffect(() => {
    localStorage.setItem('feedesk-language', lang)
    document.documentElement.lang = lang
  }, [lang])
  const changeLang = (nextLang) => {
    setLang(nextLang)
    window.dispatchEvent(new CustomEvent('feedesk-language-change', { detail: nextLang }))
  }
  return { lang, setLang: changeLang, t: translations[lang] || en }
}
