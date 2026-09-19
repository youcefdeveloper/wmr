import lang from '@lang/lang.json'
import color from '@theme/colors.json'
import font from '@theme/fonts.json'

import { Chart, type GoogleChartOptions } from 'react-google-charts'
import type { Rates } from '@api-v1-types/index'
import { useMortgageCalculatorStore } from '@stores/mortgage.calculator.store'
import { numberToWords } from '@utils/common'

type LineChatProps = {
  rates: Rates[]
  theme: 'light' | 'dark'
  selectedYear: number
  numberOfWeeks: number
}

type MortgageData = {
  id: number
  week: string
  us30_yr_frm: number
  us15_yr_frm: number
}

function convertToChartData(
  data: MortgageData[],
  language: 'ar' | 'en' = 'en',
): (string | number)[][] {
  const has15YrData = data.some(
    (entry) => entry.us15_yr_frm !== null && entry.us15_yr_frm !== undefined,
  )

  const header = has15YrData
    ? [
        'week',
        lang[language].weeklyRates['30YrLegend'],
        lang[language].weeklyRates['15YrLegend'],
      ]
    : ['week', lang[language].weeklyRates['30YrLegend']]

  const rows = data.map((entry) => {
    const base = [entry.week, entry.us30_yr_frm]
    return has15YrData ? [...base, entry.us15_yr_frm ?? null] : base
  })

  return [header, ...rows]
}

function LineChat({
  rates,
  theme,
  selectedYear,
  numberOfWeeks,
}: LineChatProps) {
  const { lang: currentLang } = useMortgageCalculatorStore()

  const isArabic = currentLang === 'ar'

  const data = convertToChartData(rates, currentLang)

  const optionsLight: GoogleChartOptions = {
    title: '',
    hAxis: {
      title: `${
        !!numberOfWeeks
          ? `${
              isArabic
                ? numberToWords(numberOfWeeks).arabicWords
                : numberToWords(numberOfWeeks).englishWords
            } `
          : ''
      }${
        numberOfWeeks === 1
          ? lang[currentLang].weeklyRates.hAxisAlt
          : lang[currentLang].weeklyRates.hAxis
      } ${selectedYear}`,
      slantedText: true,
      slantedTextAngle: 90, // Rotate labels
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 11, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: isArabic ? font.ar : font.en,
        alignment: isArabic ? 'right' : 'center', // Align legend text for RTL
        italic: false,
      },
    },
    vAxis: {
      title: `${isArabic ? '(%) ' : ''}${lang[currentLang].weeklyRates.vAxis}${
        !isArabic ? ' (%)' : ''
      }`,
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 11, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: isArabic ? font.ar : font.en,
        alignment: isArabic ? 'right' : 'center', // Align legend text for RTL
        italic: false,
      },
    },
    chartArea: {
      left: 80,
      right: 22,
      top: 70,
      bottom: 140, // Increase bottom margin to fit rotated labels
    },
    colors: [color.chart['30YrFixed'], color.chart['15YrFixed']],
    legend: {
      position: 'top',
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 12, // 👈 Set legend font size here
        italic: false,
      },
    },
    backgroundColor: color.chart.bgLight,
    fontName: isArabic ? font.ar : font.en,
    // legend: 'none',
  }

  const optionsDark: GoogleChartOptions = {
    title: '',
    hAxis: {
      title: `${
        !!numberOfWeeks
          ? `${
              isArabic
                ? numberToWords(numberOfWeeks).arabicWords
                : numberToWords(numberOfWeeks).englishWords
            } `
          : ''
      }${
        numberOfWeeks === 1
          ? lang[currentLang].weeklyRates.hAxisAlt
          : lang[currentLang].weeklyRates.hAxis
      } ${selectedYear}`,
      slantedText: true,
      slantedTextAngle: 90,
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 11,
        color: '#ffffff', // 👈 white axis labels
        alignment: isArabic ? 'right' : 'center', // Align title right for RTL
        italic: false,
      },
      titleTextStyle: {
        fontName: isArabic ? font.ar : font.en,
        color: '#ffffff', // 👈 white axis title
        alignment: isArabic ? 'right' : 'center', // Align title right for RTL
        italic: false,
      },
    },
    vAxis: {
      title: `${isArabic ? '(%) ' : ''}${lang[currentLang].weeklyRates.vAxis}${
        !isArabic ? ' (%)' : ''
      }`,
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 11,
        color: '#ffffff', // 👈 white axis labels
        alignment: isArabic ? 'right' : 'center', // Align title right for RTL
        italic: false,
      },
      titleTextStyle: {
        fontName: isArabic ? font.ar : font.en,
        color: '#ffffff', // 👈 white axis title
        alignment: isArabic ? 'right' : 'center', // Align title right for RTL
        italic: false,
      },
    },
    chartArea: {
      left: 80,
      right: 22,
      top: 70,
      bottom: 140,
    },
    colors: [color.chart['30YrFixed'], color.chart['15YrFixed']],
    legend: {
      position: 'top',
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 12,
        color: '#ffffff', // 👈 white legend text
        italic: false,
      },
    },
    backgroundColor: color.chart.bgDark, // 👈 black chart background
    fontName: isArabic ? font.ar : font.en,
  }

  return (
    <>
      <Chart
        chartType="LineChart"
        width="100%"
        height="400px"
        data={data}
        options={theme === 'light' ? optionsLight : optionsDark}
      />
    </>
  )
}

export default LineChat
