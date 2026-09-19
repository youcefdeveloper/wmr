import lang from '@lang/lang.json'
import color from '@theme/colors.json'
import font from '@theme/fonts.json'

import { Chart } from 'react-google-charts'
import type { YeahlyAvgRates } from '@api-v1-types/index.ts'

type YearlyAvgLineChartAdminProps = {
  rates: YeahlyAvgRates[]
  theme: 'light' | 'dark'
  firstYear: number
  lastYear: number
}

type MortgageData = {
  id: number
  year: number
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
      'year',
      lang[language].annualAvgRates['30YrLegend'],
      lang[language].annualAvgRates['15YrLegend'],
    ]
    : ['year', lang[language].annualAvgRates['30YrLegend']]

  const rows = data.map((entry) => {
    const base = [entry.year, entry.us30_yr_frm]
    return has15YrData ? [...base, entry.us15_yr_frm ?? null] : base
  })

  return [header, ...rows]
}

function YearlyAvgLineChartAdmin({
                                   rates,
                                   theme,
                                   firstYear,
                                   lastYear,
                                 }: YearlyAvgLineChartAdminProps) {

  const currentLang = 'en'
  const isArabic = false

  const data = convertToChartData(rates, currentLang)

  const optionsLight = {
    title: '',
    hAxis: {
      title: `${lang[currentLang].annualAvgRates.hAxis} (${firstYear}-${lastYear})`,
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
      left: 50,
      right: 20,
      top: 70,
      bottom: 100, // Increase bottom margin to fit rotated labels
    },
    colors: [
      '#546fd2',
      '#f4609f',
    ],
    legend: {
      position: 'top',
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 13, // 👈 Set legend font size here
        italic: false,
      },
    },
    backgroundColor: color.chart.bgLight,
    fontName: isArabic ? font.ar : font.en,
    // legend: 'none',
  }

  const optionsDark = {
    title: '',
    hAxis: {
      title: `${lang[currentLang].annualAvgRates.hAxis} (${firstYear}-${lastYear})`,
      slantedText: true,
      slantedTextAngle: 90,
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 11,
        color: '#ffffff', // 👈 white axis labels
        italic: false,
      },
      titleTextStyle: {
        fontName: isArabic ? font.ar : font.en,
        color: '#ffffff', // 👈 white axis title
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
        italic: false,
      },
      titleTextStyle: {
        color: '#ffffff', // 👈 white axis title
        italic: false,
      },
    },
    chartArea: {
      left: 50,
      right: 22,
      top: 70,
      bottom: 120,
    },
    colors: [
      '#546fd2',
      '#f4609f',
    ],
    legend: {
      position: 'top',
      textStyle: {
        fontName: isArabic ? font.ar : font.en,
        fontSize: 13,
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

export default YearlyAvgLineChartAdmin
