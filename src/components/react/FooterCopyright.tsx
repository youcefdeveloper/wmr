import lang from '@lang/lang.json'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'

type FooterCopyrightProps = {
  currentYear: number
}

function FooterCopyright({ currentYear }: FooterCopyrightProps) {
  const { lang: currentLang } = useMortgageCalculatorStore()

  return (
    <div
      className="small fw-light text-center"
      dangerouslySetInnerHTML={{
        __html: `${lang[currentLang].footer.copyright} ${currentYear}`,
      }}
    />
  )
}

export default FooterCopyright
