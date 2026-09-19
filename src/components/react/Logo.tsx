import { useThemeStore } from '@stores/theme.store.ts'

const Logo = () => {
  const { theme } = useThemeStore()

  return <img
    src={theme === 'dark' ? '/logos/wmr_logo_dark.png' : '/logos/wmr_logo_light.png'}
    width="60"
    height="60"
    alt="WMR"
  />
}

export default Logo
