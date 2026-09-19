import { useAdminThemeStore } from '@stores/admin/theme.store.ts'

const Logo = () => {
  const { theme } = useAdminThemeStore()

  return <img
    src={theme === 'dark' ? '/logos/wmr_logo_dark.png' : '/logos/wmr_logo_light.png'}
    width="60"
    height="60"
    alt="WMR"
  />
}

export default Logo
