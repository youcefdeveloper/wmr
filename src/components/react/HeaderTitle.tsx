import lang from '@lang/lang.json'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'

function HeaderTitle() {
  const { lang: currentLang } = useMortgageCalculatorStore()

  return (
    <h4 className="fw-bold mb-0 text-center">
      {lang[currentLang].header.title}
    </h4>
  )
}

export default HeaderTitle
