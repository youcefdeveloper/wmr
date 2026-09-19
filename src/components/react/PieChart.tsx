import lang from '@lang/lang.json'
import color from '@theme/colors.json'
import font from '@theme/fonts.json'

import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import { useThemeStore } from '@stores/theme.store'
import { useEffect } from 'react'
import { Chart } from 'react-google-charts'
import debounce from 'lodash.debounce'

function PieChart() {
  const { theme } = useThemeStore()

  const {
    principalInterest,
    propertyTax,
    homeownersInsurance,
    privateMortgageInsurance,
    hoaFees,
    calculatePrincipalInterest,
    homePrice,
    loanTerm,
    interestRate,
    lang: currentLang,
  } = useMortgageCalculatorStore()

  const isArabic = currentLang === 'ar'

  const optionsLight = {
    pieHole: 0.72,
    is3D: false,
    legend: 'none',
    pieSliceText: 'none',
    title: '',
    chartArea: {
      top: 7,
      bottom: 7,
      left: 0,
      right: 0,
      width: '100%',
      height: '100%',
    },
    colors: [
      color.chart.principalAndInterest,
      color.chart.propertyTax,
      color.chart.homeownersInsurance,
      color.chart.privateMortgageInsurance,
      color.chart.hoaFees,
    ],
    backgroundColor: color.chart.bgLight,
    pieSliceBorderColor: 'transparent',
    fontName: isArabic ? font.ar : font.en,
  }

  const optionsDark = {
    pieHole: 0.72,
    is3D: false,
    legend: 'none',
    pieSliceText: 'none',
    title: '',
    chartArea: {
      top: 7,
      bottom: 7,
      left: 0,
      right: 0,
      width: '100%',
      height: '100%',
    },
    colors: [
      color.chart.principalAndInterest,
      color.chart.propertyTax,
      color.chart.homeownersInsurance,
      color.chart.privateMortgageInsurance,
      color.chart.hoaFees,
    ],
    backgroundColor: color.chart.bgDark,
    pieSliceBorderColor: 'transparent',
    fontName: isArabic ? font.ar : font.en,
  }

  const total =
    principalInterest +
    propertyTax +
    homeownersInsurance +
    privateMortgageInsurance +
    hoaFees

  const percent = (value: number) => {
    if (isArabic) {
      return total === 0 ? `%0` : `%${Math.round((value / total) * 100)}`
    } else {
      return total === 0 ? `0%` : `${Math.round((value / total) * 100)}%`
    }
  }

  const data = [
    ['Task', 'Amount', { role: 'tooltip' }],
    [
      `${percent(principalInterest)} ${
        lang[currentLang].mortgageCalculator.principalAndInterest
      }`,
      principalInterest,
      `${percent(principalInterest)} ${
        lang[currentLang].mortgageCalculator.principalAndInterest
      }`,
    ],
    [
      `${percent(propertyTax)} ${
        lang[currentLang].mortgageCalculator.propertyTax
      }`,
      propertyTax,
      `${percent(propertyTax)} ${
        lang[currentLang].mortgageCalculator.propertyTax
      }`,
    ],
    [
      `${percent(homeownersInsurance)} ${
        lang[currentLang].mortgageCalculator.homeownersInsurance
      }`,
      homeownersInsurance,
      `${percent(homeownersInsurance)} ${
        lang[currentLang].mortgageCalculator.homeownersInsurance
      }`,
    ],
    [
      `${percent(privateMortgageInsurance)} ${
        lang[currentLang].mortgageCalculator.pmi
      }`,
      privateMortgageInsurance,
      `${percent(privateMortgageInsurance)} ${
        lang[currentLang].mortgageCalculator.pmi
      }`,
    ],
    [
      `${percent(hoaFees)} ${lang[currentLang].mortgageCalculator.hoaFees}`,
      hoaFees,
      `${percent(hoaFees)} ${lang[currentLang].mortgageCalculator.hoaFees}`,
    ],
  ]

  const options = theme === 'light' ? optionsLight : optionsDark

  useEffect(() => {
    const debounced = debounce(() => {
      calculatePrincipalInterest()
    }, 300)
    debounced()
    return () => debounced.cancel()
  }, [homePrice, loanTerm, interestRate])

  return (
    <div className="position-relative w-100">
      <Chart chartType="PieChart" width="100%" data={data} options={options} />
      <div className="doughnut-content">
        <div className="text-center">
          <div
            className={`fw-light ${isArabic ? 'x-small' : 'x-small'}`}
            style={{ marginBottom: isArabic ? 6 : 0 }}
          >
            {lang[currentLang].mortgageCalculator.monthlyTotal}
          </div>
          <h3 className="mb-0 fw-bold number-font" style={{ fontSize: 28 }}>
            ${total.toLocaleString()}
          </h3>
        </div>
      </div>
    </div>
  )
}

export default PieChart
