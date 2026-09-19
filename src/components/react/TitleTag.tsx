import lang from '@lang/lang.json'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'

function TitleTag() {
  const { lang: currentLang } = useMortgageCalculatorStore()

  return <title>{lang[currentLang].header.title}</title>
}

export default TitleTag
