import { Chart } from 'react-google-charts'
import color from '@theme/colors.json'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'

type DevicesChartProps = {
  data: any,
}

export default function DevicesChart({ data }: DevicesChartProps) {
  const { theme } = useAdminThemeStore()

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
      '#0284c7',
      '#ff7f0e',
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
      '#0284c7',
      '#ff7f0e',
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

  if (!data) return <div className="d-flex justify-content-center py-5">
        <div className="spinner" role="status">
        <span className="visually-hidden">Loading...</span>
        </div>
    </div>

  return (
    <Chart
      chartType="PieChart"
      width="100%"
      data={data}
      options={theme === 'light' ? optionsLight : optionsDark}
    />
  )
}