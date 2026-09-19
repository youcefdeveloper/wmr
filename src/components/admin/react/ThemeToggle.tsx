import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import { useEffect } from 'react'

const ThemeToggle = () => {
  const { theme, updateTheme } = useAdminThemeStore()


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
          ? `bi bi-brightness-high fs-5`
          : `bi bi-moon fs-5`
      }
      onClick={(e: any) => {
        e.preventDefault()
        updateTheme(theme === 'dark' ? 'light' : 'dark')
      }}
    ></a>
  )
}

export default ThemeToggle
