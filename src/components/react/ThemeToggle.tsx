import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import { useThemeStore } from '@stores/theme.store'
import { type CSSProperties, useEffect } from 'react'

const ThemeToggle = () => {
  const { theme, updateTheme } = useThemeStore()
  const { lang: currentLang } = useMortgageCalculatorStore()

  const style: CSSProperties = currentLang === 'en'
    ? { position: 'relative', top: -1, left: -5 }
    : { position: 'relative', top: 1, right: -5 }

  useEffect(() => {
    const themeDiv = document.querySelector('.theme')
    if (!themeDiv) return

    if (theme === 'dark') {
      themeDiv.classList.add('dark')
    } else {
      themeDiv.classList.remove('dark')
    }
  }, [theme])

  return (
    <a
      href="#"
      className={
        theme === 'dark'
          ? `bi bi-brightness-high fs-5 mt-1 ${currentLang === 'ar' && 'rtl-flip'}`
          : `bi bi-moon fs-5 mt-1 ${
            currentLang === 'ar' && 'rtl-flip'
          }`
      }
      onClick={(e) => {
        e.preventDefault()
        updateTheme(theme === 'dark' ? 'light' : 'dark')
      }}
      style={style}
    ></a>
  )
}

export default ThemeToggle
