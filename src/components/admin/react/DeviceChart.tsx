import { Chart, type GoogleChartOptions } from 'react-google-charts'
import color from '@theme/colors.json'
import { useAdminThemeStore } from '@stores/admin/theme.store.ts'

type DeviceChartProps = {
  data: any,
  platform: 'ios' | 'android',
}

export default function DeviceChart({ data, platform }: DeviceChartProps) {
  const { theme } = useAdminThemeStore()

  // Material chart options
  const numModels = Array.isArray(data) && data.length > 1 ? data.length - 1 : 0;
  const vAxisTitle = `Device Models (${numModels})`;
  const optionsLight: GoogleChartOptions = {
    chart: {
      title: '',
      subtitle: '',
    },
    hAxis: {
      title: `Number of Devices`,
      slantedText: true,
      slantedTextAngle: 90, // Rotate labels
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        alignment: 'center',
        italic: false,
      },
    },
    vAxis: {
      title: vAxisTitle,
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 11, // Reduce label font size
        italic: false,
      },
      titleTextStyle: {
        fontName: 'Hind Madurai',
        alignment: 'center', // Align legend text for RTL
        italic: false,
      },
    },
    chartArea: {
      left: 200,
      right: 20,
      top: 10,
      bottom: 90, // Increase bottom margin to fit rotated labels
    },
    colors: platform === 'ios' ? ['#0284c7'] : ['#ff7f0e'],
    // legend: 'none',
    legend: {
      position: 'bottom',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 12, // 👈 Set legend font size here
        italic: false,
        color: '#333',
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
      title: `Number of Devices`,
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
      title: vAxisTitle,
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
      left: 200,
      right: 20,
      top: 10,
      bottom: 90, // Increase bottom margin to fit rotated labels
    },
    colors: platform === 'ios' ? ['#0284c7'] : ['#ff7f0e'],
    // legend: 'none',
    legend: {
      position: 'bottom',
      textStyle: {
        fontName: 'Hind Madurai',
        fontSize: 12, // 👈 Set legend font size here
        italic: false,
        color: '#ffffff',
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
    <div className="chart-scroll-wrapper">
      <div className="chart-scroll">
        <Chart
          chartType="BarChart"
          height={1000}
          width="100%"
          data={data}
          options={theme === 'light' ? optionsLight : optionsDark}
        />
      </div>
    </div>
  )
}