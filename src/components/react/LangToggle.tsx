import lang from '@lang/lang.json'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import { useEffect } from 'react'

const LangToggle = () => {
  const {
    lang: currentLang,
    setLang,
    setIsWeeklyRatesDrawerOpen,
    setIsYearlyAvgRatesDrawerOpen,
    setIsMortgageCalculatorDrawerOpen,
  } = useMortgageCalculatorStore()

  useEffect(() => {
    const htmlElement = document.documentElement
    if (!htmlElement) return

    htmlElement.setAttribute('lang', currentLang)
    htmlElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr')
  }, [currentLang])

  const switchLang = (newLang: 'en' | 'ar') => {
    setIsWeeklyRatesDrawerOpen(false)
    setIsYearlyAvgRatesDrawerOpen(false)
    setIsMortgageCalculatorDrawerOpen(false)
    setLang(newLang)
    // window.location.reload() // 👈 Force hard reload
  }

  return (
    <div className="container d-flex justify-content-center align-items-center small">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          switchLang(currentLang === 'ar' ? 'en' : 'ar')
        }}
        className={`fw-bold ${currentLang === 'ar' ? 'en-font' : 'ar-font'}`}
      >
        {currentLang === 'ar'
          ? lang.en.footer.langVersion
          : lang.ar.footer.langVersion}
      </a>
    </div>
  )
}

export default LangToggle
