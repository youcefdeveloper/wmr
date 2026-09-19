import { Chart, type GoogleChartOptions } from 'react-google-charts'
import color from '@theme/colors.json'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'
import type { USVisitType } from '@admin-types/adminTypes'

type USVisitLineChartProps = {
    data: USVisitType
}

export default function USVisitLineChart({ data }: USVisitLineChartProps) {
  const { theme } = useAdminThemeStore()

    // Material chart options
  const optionsLight: GoogleChartOptions = {
    chart: {
      title: '',
      subtitle: '',
    },
    hAxis: {
    //   title: ``,
      slantedText: true,
      slantedTextAngle: 90, // Rotate labels
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 12, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        alignment: 'center', // Align legend text for RTL
        italic: false,
      },
    },
    vAxis: {
    //   title: ``,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 12, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        alignment: 'center', // Align legend text for RTL
        italic: false,
      },
    },
    chartArea: {
      left: 80,
      right: 22,
      top: 70,
      bottom: 140, // Increase bottom margin to fit rotated labels
    },
    colors: [color.chart['usVisits']],
    // legend: 'none',
    legend: {
      position: 'top',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 14, // 👈 Set legend font size here
        italic: false,
      },
    },
    backgroundColor: color.chart.bgLight,
    fontName: 'Hind Madurai',
  }

  const optionsDark: GoogleChartOptions = {
    chart: {
      title: '',
      subtitle: '',
    },
    hAxis: {
    //   title: ``,
      slantedText: true,
      slantedTextAngle: 90,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11,
        color: '#ffffff', // 👈 make text white for visibility
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        color: '#ffffff',
        italic: false,
      },
    },
    vAxis: {
    //   title: ``,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11,
        color: '#ffffff', // 👈 make text white
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        color: '#ffffff',
        italic: false,
      },
    },
    chartArea: {
      left: 80,
      right: 22,
      top: 70,
      bottom: 140,
    },
    colors: [color.chart['usVisits']],
    legend: {
      position: 'top',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 14,
        color: '#ffffff', // 👈 make legend text white
        italic: false,
      },
    },
    backgroundColor: color.chart.bgDark, // 👈 set background color to black
    fontName: 'Hind Madurai',
  }

  if (!data) return <div className="d-flex justify-content-center py-5">
        <div className="spinner" role="status">
        <span className="visually-hidden">Loading...</span>
        </div>
    </div>

  return (
    <div className="chart-scroll-wrapper-lg" style={{ width: '100%' }}>
      <div className="chart-scroll-lg chart-line" style={{ width: '100%'}}>
        <Chart 
            chartType="LineChart" 
            width="100%"
            height="400px"
            data={data.map(row => row.slice(0, 2))}
            options={theme === 'light' ? optionsLight : optionsDark}
        />
      </div>
    </div>
  )
}