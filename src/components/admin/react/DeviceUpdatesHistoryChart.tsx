import { Chart } from 'react-google-charts'
import color from '@theme/colors.json'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import { buildReturningChartData, type NewPlatformData } from '@utils/common.ts'

type DevicesChartProps = {
  platform?: 'all' | 'ios' | 'android'
  data: any,
}

export default function DeviceUpdatesHistoryChart({ data, platform = 'all' }: DevicesChartProps) {
  const { theme } = useAdminThemeStore()

  const returningData = buildReturningChartData(
    data.find((s: NewPlatformData) => s.platform === platform),
  )

  const optionsLight = {
    pieHole: 0.72,
    is3D: true,
    // legend: 'none',
    // pieSliceText: 'none',
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
      '#64acdb',
      '#f8c268',
      color.chart.principalAndInterest,
      color.chart.propertyTax,
      color.chart.homeownersInsurance,
      color.chart.privateMortgageInsurance,
      color.chart.hoaFees,
    ],
    backgroundColor: color.chart.bgLight,
    pieSliceBorderColor: 'transparent',
    fontName: 'Hind Madurai',
    fontSize: 16,
    legend: {
      // position: 'top',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 13,
        italic: false,
        color: '#333',
      },
    },
  }

  const optionsDark = {
    pieHole: 0.72,
    is3D: true,
    // legend: 'none',
    // pieSliceText: 'none',
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
      '#64acdb',
      '#f8c268',
      color.chart.principalAndInterest,
      color.chart.propertyTax,
      color.chart.homeownersInsurance,
      color.chart.privateMortgageInsurance,
      color.chart.hoaFees,
    ],
    backgroundColor: color.chart.bgDark,
    pieSliceBorderColor: 'transparent',
    fontName: 'Hind Madurai',
    fontSize: 16,
    legend: {
      // position: 'top',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 13,
        italic: false,
        color: '#fff',
      },
    },
  }

  return (
    <Chart
      chartType="PieChart"
      width="100%"
      data={returningData}
      options={theme === 'light' ? optionsLight : optionsDark}
    />
  )
}