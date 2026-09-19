import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import lang from '@lang/lang.json'
import AppStore from '@assets/icons/AppStore.tsx'
import GooglePlay from '@assets/icons/GooglePlay.tsx'
import { useThemeStore } from '@stores/theme.store.ts'

function MobileApp() {
  const { lang: currentLang } = useMortgageCalculatorStore()
  const { theme } = useThemeStore()

  return <>
    <div className="text-center fw-light">{lang[currentLang].footer.getMobileApp}</div>
    <div className="d-flex justify-content-center gap-1 mt-3">
      <a
        href="https://apps.apple.com/us/app/weekly-mortgage-rates/id6747959492"
        target="_blank"
        title={lang[currentLang].footer.getIOSApp}
      >
        {/*<img src={appStore.src} width="140" height="auto" alt="App Store" />*/}
        <AppStore width={144}
                  height={46}
                  color={theme === 'dark' ? '#ffffff' : '#010202'}
                  fillColor={theme === 'dark' ? 'transparent' : 'transparent'}
                  borderColor={theme === 'dark' ? 'transparent' : 'transparent'}
        />
      </a>
      <a
        href="https://play.google.com/store/apps/details?id=org.weeklymortgagerates.app"
        target="_blank"
        title={lang[currentLang].footer.getAndroidApp}
      >
        {/*<img src={playStore.src} width="140" height="auto" alt="Play Store" />*/}
        <GooglePlay width={144}
                    height={46}
                    color={theme === 'dark' ? '#ffffff' : '#010202'}
                    fillColor={theme === 'dark' ? 'transparent' : 'transparent'}
                    borderColor={theme === 'dark' ? 'transparent' : 'transparent'}
        />
      </a>
    </div>
  </>
}

export default MobileApp
